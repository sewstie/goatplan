#include "goatplan/filters.hpp"

#include <algorithm>
#include <stdexcept>
#include <utility>

namespace goatplan {
namespace {
  bool containsAllLocked(const CourseOption& option, const std::vector<std::size_t>& locked) {
      for (std::size_t index : locked) {
          if (std::find(option.begin(), option.end(), index) == option.end()) {
              return false;
          }
      }
      return true;
  }
  bool containsAnyOf(const CourseOption& option, const std::vector<std::size_t>& selected) {
      return selected.empty() || std::any_of(selected.begin(), selected.end(), [&](std::size_t index) {
          return std::find(option.begin(), option.end(), index) != option.end();
      });
  }
  bool allSectionsOpen(const Course& course, const CourseOption& option) {
      for (std::size_t index : option) {
          if (course.sections.at(index).status != SectionStatus::Open) {
              return false;
          }
      }
      return true;
  }
  bool startsTooEarly(const Course& course, const CourseOption& option, int startsAfter) {
      for (std::size_t index : option) {
          for (const Meeting& meeting : course.sections.at(index).meetings) {
              if (meeting.start < startsAfter) {
                  return true;
              }
          }
      }
      return false;
  }
  int openSeatsOf(const Course& course, const CourseOption& option) {
      bool foundNumber = false;
      int smallest = 0;
      for (std::size_t index : option) {
          const Section& section = course.sections.at(index);
          if (section.capacity == 0) {
              continue;
          }
          const int available = std::max(0, section.capacity - section.enrolled);
          if (!foundNumber || available < smallest) {
              smallest = available;
          }
          foundNumber = true;
      }
      return foundNumber ? smallest : -1;
  }
  std::vector<std::size_t> resolveSections(
      const Course& course, const std::vector<std::string>& ids, const std::string& rule) {
      std::vector<std::size_t> positions;
      positions.reserve(ids.size());
      for (const std::string& id : ids) {
          const auto section = std::find_if(
              course.sections.begin(), course.sections.end(),
              [&](const Section& candidate) { return candidate.id == id; });
          if (section == course.sections.end()) {
              throw std::invalid_argument(course.code + ": unknown " + rule + " section " + id);
          }
          positions.push_back(static_cast<std::size_t>(section - course.sections.begin()));
      }
      return positions;
  }
}

std::vector<CourseChoices> filterOptions(
    const Term& term,
    const std::vector<std::string>& courseCodes,
    const Preferences& prefs) {
    std::unordered_map<std::string, std::vector<std::size_t>> lockPositions;
    for (const auto& [code, ids] : prefs.locked) {
        const Course* course = term.findCourse(code);
        if (course == nullptr) {
            throw std::invalid_argument("Unknown course code in locks: " + code);
        }
        lockPositions.emplace(code, resolveSections(*course, ids, "locked"));
    }
    std::unordered_map<std::string, std::vector<std::size_t>> anyOfPositions;
    for (const auto& [code, ids] : prefs.anyOf) {
        const Course* course = term.findCourse(code);
        if (course == nullptr) {
            throw std::invalid_argument("Unknown course code in anyOf: " + code);
        }
        anyOfPositions.emplace(code, resolveSections(*course, ids, "anyOf"));
    }
    std::vector<CourseChoices> result;
    result.reserve(courseCodes.size());
    const std::vector<std::size_t> noSections;
    for (const std::string& code : courseCodes) {
        const Course* course = term.findCourse(code);
        if (course == nullptr) {
            throw std::invalid_argument("Unknown course code: " + code);
        }
        const auto foundLocks = lockPositions.find(code);
        const auto& locked = foundLocks == lockPositions.end()
            ? noSections : foundLocks->second;
        const auto foundAnyOf = anyOfPositions.find(code);
        const auto& anyOf = foundAnyOf == anyOfPositions.end()
            ? noSections : foundAnyOf->second;
        CourseChoices choices;
        choices.course = course;
        choices.options.reserve(course->options.size());
        choices.masks.reserve(course->options.size());
        choices.openSeats.reserve(course->options.size());
        for (std::size_t i = 0; i < course->options.size(); ++i) {
            const CourseOption& option = course->options[i];
            if (!containsAllLocked(option, locked)) {
                ++choices.removed[static_cast<std::size_t>(FilterReason::NotLocked)];
                continue;
            }
            if (!containsAnyOf(option, anyOf)) {
                ++choices.removed[static_cast<std::size_t>(FilterReason::NotAnyOf)];
                continue;
            }
            if (prefs.onlyOpen && !allSectionsOpen(*course, option)) {
                ++choices.removed[static_cast<std::size_t>(FilterReason::NotOpen)];
                continue;
            }
            if (prefs.startsAfter != 0 && startsTooEarly(*course, option, prefs.startsAfter)) {
                ++choices.removed[static_cast<std::size_t>(FilterReason::StartsTooEarly)];
                continue;
            }

            WeekMask mask = maskOf(*course, option);
            if (mask.intersects(prefs.blocked)) {
                ++choices.removed[static_cast<std::size_t>(FilterReason::Blocked)];
                continue;
            }
            choices.options.push_back(i);
            choices.masks.push_back(mask);
            choices.openSeats.push_back(openSeatsOf(*course, option));
        }
        result.push_back(std::move(choices));
      }
    return result;
    }
}
