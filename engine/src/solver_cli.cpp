#include "goatplan/filters.hpp"
#include "goatplan/groups.hpp"
#include "goatplan/json_io.hpp"
#include "goatplan/solver.hpp"

#include <algorithm>
#include <charconv>
#include <chrono>
#include <cctype>
#include <cstdint>
#include <exception>
#include <iomanip>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <system_error>
#include <unordered_set>
#include <vector>

namespace {
    using namespace goatplan;
    using Clock = std::chrono::steady_clock;
    void usage() {
        std::cout
            << "Usage: goatplan_solver_cli <term.json> [options]\n"
            << "  --courses \"PH 1120,MA 1022,CS 2102\"\n"
            << "  --starts-after HH:MM\n"
            << "  --only-open\n"
            << "  --max-schedules N   (default 200)\n"
            << "  --step-budget N     (default 5000000)\n"
            << "Without --courses, print term and PH 1120 counts only.\n";
    }
    std::string trim(const std::string& text) {
        const auto first = text.find_first_not_of(" \t\r\n");
        if (first == std::string::npos) return "";
        const auto last = text.find_last_not_of(" \t\r\n");
        return text.substr(first, last - first + 1);
    }
    std::vector<std::string> parseCourses(const std::string& text) {
        std::vector<std::string> result;
        std::unordered_set<std::string> seen;
        std::size_t start = 0;
        while (true) {
            const std::size_t comma = text.find(',', start);
            const std::string code = trim(text.substr(start, comma == std::string::npos
                ? std::string::npos : comma - start));
            if (code.empty()) throw std::invalid_argument("--courses contains an empty course code");
            if (!seen.insert(code).second) throw std::invalid_argument("Duplicate course: " + code);
            result.push_back(code);
            if (comma == std::string::npos) break;
            start = comma + 1;
        }
        return result;
    }
    int parseTime(const std::string& text) {
        if (text.size() != 5 || text[2] != ':' ||
            !std::isdigit(static_cast<unsigned char>(text[0])) ||
            !std::isdigit(static_cast<unsigned char>(text[1])) ||
            !std::isdigit(static_cast<unsigned char>(text[3])) ||
            !std::isdigit(static_cast<unsigned char>(text[4]))) {
            throw std::invalid_argument("--starts-after must be HH:MM, for example 10:00");
        }
        const int hours = (text[0] - '0') * 10 + text[1] - '0';
        const int minutes = (text[3] - '0') * 10 + text[4] - '0';
        if (hours > 23 || minutes > 59) throw std::invalid_argument("Invalid time: " + text);
        return hours * 60 + minutes;
    }
    std::uint64_t parseCount(const std::string& flag, const std::string& text) {
        std::uint64_t value = 0;
        const auto parsed = std::from_chars(text.data(), text.data() + text.size(), value);
        if (parsed.ec != std::errc{} || parsed.ptr != text.data() + text.size()) {
            throw std::invalid_argument(flag + " requires an unsigned integer");
        }
        return value;
    }
    double milliseconds(Clock::time_point start, Clock::time_point end) {
        return std::chrono::duration<double, std::milli>(end - start).count();
    }
    void printSchedules(const std::vector<CourseChoices>& choices, const SolveResult& result) {
        const std::size_t count = std::min(std::size_t{3}, result.schedules.size());
        for (std::size_t s = 0; s < count; ++s) {
            const Score& score = result.schedules[s].score;
            std::cout << "Schedule " << s + 1 << ": total " << score.total
                      << " — early " << score.earlyMinutes << ", gaps " << score.gapMinutes
                      << ", days " << score.days << '\n';
            for (std::size_t i = 0; i < choices.size(); ++i) {
                const CourseChoices& choice = choices[i];
                const std::size_t filteredPosition = result.schedules[s].picks.at(i);
                const std::size_t sourcePosition = choice.options.at(filteredPosition);
                const CourseOption& option = choice.course->options.at(sourcePosition);
                std::cout << "  " << choice.course->code << ": ";
                bool first = true;
                for (std::size_t sectionIndex : option) {
                    const Section& section = choice.course->sections.at(sectionIndex);
                    if (!first) std::cout << " + ";
                    std::cout << (section.code.empty() ? section.id : section.code);
                    first = false;
                }
                const std::size_t sameTime = result.schedules[s].alternatives.at(i).size() - 1;
                if (sameTime > 0) std::cout << " (+" << sameTime << " same time)";
                std::cout << '\n';
            }
        }
    }
}
int main(int argc, char* argv[]) {
    if (argc < 2) { usage(); return 1; }
    if (std::string(argv[1]) == "--help") { usage(); return 0; }
    try {
        const std::string path = argv[1];
        std::vector<std::string> codes;
        bool hasCourses = false;
        Preferences prefs;
        SolveLimits limits;
        for (int i = 2; i < argc; ++i) {
            const std::string flag = argv[i];
            if (flag == "--only-open") { prefs.onlyOpen = true; continue; }
            if (flag == "--help") { usage(); return 0; }
            if (flag != "--courses" && flag != "--starts-after" &&
                flag != "--max-schedules" && flag != "--step-budget") {
                throw std::invalid_argument("Unknown flag: " + flag);
            }
            if (i + 1 >= argc) throw std::invalid_argument("Missing value for " + flag);
            const std::string value = argv[++i];
            if (flag == "--courses") {
                if (hasCourses) throw std::invalid_argument("Specify --courses only once");
                codes = parseCourses(value);
                hasCourses = true;
            } else if (flag == "--starts-after") {
                prefs.startsAfter = parseTime(value);
            } else if (flag == "--max-schedules") {
                const auto count = parseCount(flag, value);
                if (count > std::numeric_limits<std::size_t>::max())
                    throw std::invalid_argument("--max-schedules is too large for this platform");
                limits.maxSchedules = static_cast<std::size_t>(count);
            } else {
                limits.stepBudget = parseCount(flag, value);
            }
        }
        const auto loadStart = Clock::now();
        const Term term = loadTermFile(path);
        const auto loadEnd = Clock::now();
        std::cout << std::fixed << std::setprecision(3);
        std::cout << "courses=" << term.courses.size()
                  << " load_ms=" << milliseconds(loadStart, loadEnd) << '\n';
        if (const Course* ph = term.findCourse("PH 1120")) {
            std::cout << "PH 1120: sections=" << ph->sections.size()
                      << " options=" << ph->options.size() << '\n';
        }
        if (!hasCourses) return 0;
        const auto start = Clock::now();
        const auto choices = filterOptions(term, codes, prefs);
        const auto filtered = Clock::now();
        const SolveResult result = solve(choices, limits);
        const auto end = Clock::now();
        const auto groups = groupByTime(choices);
        for (std::size_t c = 0; c < choices.size(); ++c) {
            const CourseChoices& choice = choices[c];
            std::cout << choice.course->code << ": " << choice.options.size() << " options → "
                      << groups[c].groups.size() << " different times";
            if (choice.options.size() != choice.course->options.size()) {
                std::cout << " (filters kept " << choice.options.size() << '/' << choice.course->options.size()
                          << ": NotLocked=" << choice.removed[static_cast<std::size_t>(FilterReason::NotLocked)]
                          << " NotOpen=" << choice.removed[static_cast<std::size_t>(FilterReason::NotOpen)]
                          << " StartsTooEarly=" << choice.removed[static_cast<std::size_t>(FilterReason::StartsTooEarly)]
                          << " Blocked=" << choice.removed[static_cast<std::size_t>(FilterReason::Blocked)] << ')';
            }
            std::cout << '\n';
        }
        std::cout << "patterns=" << result.patterns
                  << " total=" << result.total
                  << " capped=" << (result.capped ? "true" : "false")
                  << " steps=" << result.steps
                  << " retained=" << result.schedules.size()
                  << " elapsed_ms=" << milliseconds(start, end)
                  << " filter_ms=" << milliseconds(start, filtered)
                  << " solve_ms=" << milliseconds(filtered, end) << '\n';
        if (result.capped) std::cout << "total is a lower bound because the step budget ran out.\n";
        printSchedules(choices, result);
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
}
