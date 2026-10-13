// Command-line entry point for the GoatPlan engine.
// For now it loads a term file and prints a few counts; later it will print
// every schedule that fits.

#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

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
}

int main(int argc, char** argv) {
    using namespace goatplan;

    if (argc < 2) {
        std::cerr << "Usage: goatplan_cli <term.json> [course code]\n";
        return 1;
    }
    const std::string code = argc > 2 ? argv[2] : "PH 1120";

    try {
        const Term term = loadTermFile(argv[1]);
        std::cout << term.id << " " << term.name << ": " << term.courses.size() << " courses\n";

        if (const Course* course = term.findCourse(code)) {
            std::cout << code << ": " << course->sections.size() << " sections, " << course->options.size()
                      << " options, " << countDifferentTimes(*course) << " with different times\n";
        } else {
            std::cout << code << " is not in this term\n";
        }
    } catch (const TermLoadError& error) {
        std::cerr << "goatplan_cli: " << error.what() << '\n';
        return 1;
    }
    return 0;
}
