// Command-line entry point for the GoatPlan engine.
// For now it loads a term file and prints a few counts; later it will print
// every schedule that fits.

#include <algorithm>
#include <cstddef>
#include <cstdio>
#include <iostream>
#include <string>
#include <vector>

#include "goatplan/filters.hpp"
#include "goatplan/json_io.hpp"
#include "goatplan/week_mask.hpp"

namespace {
    // Options that meet at exactly the same times count once.
    std::size_t countDifferentTimes(const goatplan::Course& course) {
        std::vector<goatplan::WeekMask> seen;
        for (const goatplan::CourseOption& option : course.options) {
            const goatplan::WeekMask mask = goatplan::maskOf(course, option);
            if (std::find(seen.begin(), seen.end(), mask) == seen.end()) {
                seen.push_back(mask);
            }
        }
        return seen.size();
    }

    // "10:00" becomes 600 minutes; anything that isn't a time of day becomes -1.
    int parseTime(const std::string& text) {
        int hours = 0;
        int minutes = 0;
        char extra = 0;
        if (std::sscanf(text.c_str(), "%d:%d%c", &hours, &minutes, &extra) != 2 ||
            hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return -1;
        }
        return hours * 60 + minutes;
    }

    const char* reasonName(goatplan::FilterReason reason) {
        switch (reason) {
            case goatplan::FilterReason::NotLocked: return "not locked";
            case goatplan::FilterReason::NotOpen: return "not open";
            case goatplan::FilterReason::StartsTooEarly: return "starts too early";
            case goatplan::FilterReason::Blocked: return "blocked";
            case goatplan::FilterReason::Count: break;
        }
        return "?";
    }

    void printFiltered(const goatplan::CourseChoices& choices, const std::string& startsAfter) {
        std::cout << choices.course->code << " starting at " << startsAfter << " or later: "
                  << choices.options.size() << " of " << choices.course->options.size()
                  << " options left";
        const char* separator = ", removed ";
        for (std::size_t i = 0; i < choices.removed.size(); ++i) {
            if (choices.removed[i] == 0) {
                continue;
            }
            std::cout << separator << choices.removed[i] << " "
                      << reasonName(static_cast<goatplan::FilterReason>(i));
            separator = ", ";
        }
        std::cout << '\n';
    }
}

int main(int argc, char** argv) {
    using namespace goatplan;

    const char* usage = "Usage: goatplan_cli <term.json> [course code] [--starts-after HH:MM]\n";
    std::vector<std::string> positional;
    std::string startsAfter;
    Preferences prefs;
    for (int i = 1; i < argc; ++i) {
        const std::string arg = argv[i];
        if (arg != "--starts-after") {
            positional.push_back(arg);
            continue;
        }
        if (i + 1 == argc || (prefs.startsAfter = parseTime(argv[i + 1])) < 0) {
            std::cerr << "goatplan_cli: --starts-after needs a time like 10:00\n" << usage;
            return 1;
        }
        startsAfter = argv[++i];
    }
    if (positional.empty() || positional.size() > 2) {
        std::cerr << usage;
        return 1;
    }
    const std::string code = positional.size() > 1 ? positional[1] : "PH 1120";

    try {
        const Term term = loadTermFile(positional[0]);
        std::cout << term.id << " " << term.name << ": " << term.courses.size() << " courses\n";

        if (const Course* course = term.findCourse(code)) {
            std::cout << code << ": " << course->sections.size() << " sections, " << course->options.size()
                      << " options, " << countDifferentTimes(*course) << " with different times\n";
            if (!startsAfter.empty()) {
                printFiltered(filterOptions(term, {code}, prefs).at(0), startsAfter);
            }
        } else {
            std::cout << code << " is not in this term\n";
        }
    } catch (const TermLoadError& error) {
        std::cerr << "goatplan_cli: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
