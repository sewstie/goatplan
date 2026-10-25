#include "goatplan/diagnose.hpp"
#include "goatplan/groups.hpp"
#include <algorithm>
#include <cstddef>
#include <iterator>
#include <numeric>
#include <optional>
#include <set>

namespace goatplan {
    namespace {
        constexpr std::size_t kNotAnyOf = static_cast<std::size_t>(FilterReason::NotAnyOf);
        constexpr std::size_t kStartsTooEarly = static_cast<std::size_t>(FilterReason::StartsTooEarly);

        SolveResult quickSolve(const std::vector<CourseChoices>& choices, SolveLimits limits) {
            limits.stopAtFirst = true;
            return solve(choices, limits);
        }

        int earliestStart(const Course& course, const CourseOption& option) {
            int earliest = -1;
            for (std::size_t section : option) {
                for (const Meeting& meeting : course.sections.at(section).meetings) {
                    if (earliest < 0 || meeting.start < earliest) {
                        earliest = meeting.start;
                    }
                }
            }
            return earliest;
        }

        int latestWorkingStart(const Term& term, const std::string& code, Preferences prefs) {
            prefs.startsAfter = 0;
            const CourseChoices choice = filterOptions(term, {code}, prefs).at(0);
            int latest = -1;
            for (std::size_t option : choice.options) {
                latest = std::max(latest, earliestStart(*choice.course, choice.course->options[option]));
            }
            return latest;
        }

        std::optional<int> latestStartsAfterThatFits(const Term& term, const std::vector<std::string>& courseCodes,
                                                     const Preferences& prefs, const SolveLimits& limits) {
            std::set<int> earlier;
            for (const std::string& code : courseCodes) {
                const Course& course = *term.findCourse(code);
                for (const CourseOption& option : course.options) {
                    const int start = earliestStart(course, option);
                    if (start >= 0 && start < prefs.startsAfter) {
                        earlier.insert(start);
                    }
                }
            }
            const std::vector<int> starts(earlier.begin(), earlier.end());
            std::optional<int> best;
            std::size_t low = 0;
            std::size_t high = starts.size();
            while (low < high) {
                const std::size_t mid = low + (high - low) / 2;
                Preferences changed = prefs;
                changed.startsAfter = starts[mid];
                if (quickSolve(filterOptions(term, courseCodes, changed), limits).total > 0) {
                    best = starts[mid];
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            return best;
        }

        bool fitTogether(const CourseGroups& a, const CourseGroups& b) {
            for (const TimeGroup& x : a.groups) {
                for (const TimeGroup& y : b.groups) {
                    if (!x.mask.intersects(y.mask)) {
                        return true;
                    }
                }
            }
            return false;
        }

        std::vector<std::size_t> findMinimalClash(const std::vector<CourseChoices>& choices,
                                                  const SolveLimits& limits) {
            std::vector<std::size_t> clash(choices.size());
            std::iota(clash.begin(), clash.end(), std::size_t{0});
            for (std::size_t dropped = 0; dropped < choices.size(); ++dropped) {
                std::vector<std::size_t> rest;
                std::vector<CourseChoices> restChoices;
                for (std::size_t c : clash) {
                    if (c != dropped) {
                        rest.push_back(c);
                        restChoices.push_back(choices[c]);
                    }
                }
                const SolveResult result = quickSolve(restChoices, limits);
                if (!result.capped && result.total == 0) {
                    clash = std::move(rest);
                }
            }
            return clash;
        }

        void apply(const Fix& fix, std::vector<std::string>& codes, Preferences& prefs) {
            switch (fix.kind) {
                case FixKind::RelaxStartsAfter:
                    prefs.startsAfter = std::max(fix.startsAfter, 0);
                    break;
                case FixKind::ClearBlocked:
                    prefs.blocked = WeekMask{};
                    break;
                case FixKind::AllowFull:
                    prefs.onlyOpen = false;
                    break;
                case FixKind::Unlock:
                    prefs.locked.erase(codes.at(fix.course));
                    break;
                case FixKind::ClearAnyOf:
                    prefs.anyOf.erase(codes.at(fix.course));
                    if (fix.startsAfter >= 0) {
                        prefs.startsAfter = fix.startsAfter;
                    }
                    break;
                case FixKind::DropCourse:
                    codes.erase(std::next(codes.begin(), static_cast<std::ptrdiff_t>(fix.course)));
                    break;
            }
        }

        std::vector<std::size_t> problemCourses(const Diagnosis& diagnosis) {
            if (!diagnosis.emptyCourses.empty()) {
                std::vector<std::size_t> courses;
                for (const EmptyCourse& empty : diagnosis.emptyCourses) {
                    courses.push_back(empty.course);
                }
                return courses;
            }
            if (!diagnosis.clashingPairs.empty()) {
                std::set<std::size_t> courses;
                for (const auto& [a, b] : diagnosis.clashingPairs) {
                    courses.insert(a);
                    courses.insert(b);
                }
                return {courses.begin(), courses.end()};
            }
            return diagnosis.minimalClash;
        }

        std::vector<Fix> findFixes(const Term& term, const std::vector<std::string>& courseCodes,
                                   const Preferences& prefs, const SolveLimits& limits,
                                   const std::vector<CourseChoices>& choices, const Diagnosis& diagnosis) {
            SolveLimits counting = limits;
            counting.maxSchedules = 0;
            counting.stopAtFirst = false;
            std::vector<Fix> fixes;
            auto attempt = [&](Fix fix) {
                std::vector<std::string> codes = courseCodes;
                Preferences changed = prefs;
                apply(fix, codes, changed);
                const SolveResult result = solve(filterOptions(term, codes, changed), counting);
                if (result.total == 0) {
                    return false;
                }
                fix.schedules = result.total;
                fix.capped = result.capped;
                fixes.push_back(fix);
                return true;
            };

            if (prefs.startsAfter != 0) {
                if (const auto startsAfter = latestStartsAfterThatFits(term, courseCodes, prefs, limits)) {
                    attempt(Fix{FixKind::RelaxStartsAfter, 0, *startsAfter});
                }
            }
            if (!prefs.blocked.empty()) {
                attempt(Fix{FixKind::ClearBlocked});
            }
            if (prefs.onlyOpen) {
                attempt(Fix{FixKind::AllowFull});
            }
            for (std::size_t c = 0; c < courseCodes.size(); ++c) {
                const auto lock = prefs.locked.find(courseCodes[c]);
                if (lock != prefs.locked.end() && !lock->second.empty()) {
                    attempt(Fix{FixKind::Unlock, c});
                }
                const auto anyOf = prefs.anyOf.find(courseCodes[c]);
                if (anyOf != prefs.anyOf.end() && !anyOf->second.empty() && !attempt(Fix{FixKind::ClearAnyOf, c}) &&
                    prefs.startsAfter != 0 && choices[c].removed[kNotAnyOf] > 0) {
                    Preferences cleared = prefs;
                    cleared.anyOf.erase(anyOf->first);
                    if (const auto startsAfter = latestStartsAfterThatFits(term, courseCodes, cleared, limits)) {
                        attempt(Fix{FixKind::ClearAnyOf, c, *startsAfter});
                    }
                }
            }
            for (std::size_t c : problemCourses(diagnosis)) {
                attempt(Fix{FixKind::DropCourse, c});
            }

            std::stable_sort(fixes.begin(), fixes.end(), [](const Fix& a, const Fix& b) {
                const bool aDrops = a.kind == FixKind::DropCourse;
                const bool bDrops = b.kind == FixKind::DropCourse;
                if (aDrops != bDrops) {
                    return bDrops;
                }
                return a.schedules > b.schedules;
            });
            return fixes;
        }
    }

    Diagnosis diagnose(const Term& term, const std::vector<std::string>& courseCodes,
                       const Preferences& prefs, const SolveLimits& limits) {
        Diagnosis diagnosis;
        const std::vector<CourseChoices> choices = filterOptions(term, courseCodes, prefs);
        const SolveResult first = quickSolve(choices, limits);
        if (first.total > 0) {
            diagnosis.ok = true;
            return diagnosis;
        }
        if (first.capped) {
            diagnosis.unsure = true;
            return diagnosis;
        }

        for (std::size_t c = 0; c < choices.size(); ++c) {
            if (!choices[c].options.empty()) {
                continue;
            }
            EmptyCourse empty{c, static_cast<int>(choices[c].course->options.size()), choices[c].removed};
            if (empty.removed[kStartsTooEarly] > 0) {
                empty.latestStartsAfter = latestWorkingStart(term, courseCodes[c], prefs);
            }
            diagnosis.emptyCourses.push_back(empty);
        }
        if (diagnosis.emptyCourses.empty()) {
            const std::vector<CourseGroups> groups = groupByTime(choices);
            for (std::size_t i = 0; i < groups.size(); ++i) {
                for (std::size_t j = i + 1; j < groups.size(); ++j) {
                    if (!fitTogether(groups[i], groups[j])) {
                        diagnosis.clashingPairs.emplace_back(i, j);
                    }
                }
            }
            if (diagnosis.clashingPairs.empty()) {
                diagnosis.minimalClash = findMinimalClash(choices, limits);
            }
        }
        diagnosis.fixes = findFixes(term, courseCodes, prefs, limits, choices, diagnosis);
        return diagnosis;
    }
}
