#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>
#include "goatplan/filters.hpp"
#include "goatplan/solver.hpp"

namespace goatplan {

struct EmptyCourse {
    std::size_t course;
    int optionsInData = 0;
    std::array<int, static_cast<std::size_t>(FilterReason::Count)> removed{};
    int latestStartsAfter = -1;
    bool operator==(const EmptyCourse&) const = default;
};

enum class FixKind { RelaxStartsAfter, ClearBlocked, AllowFull, Unlock, ClearAnyOf, DropCourse };

struct Fix {
    FixKind kind;
    std::size_t course = 0;
    int startsAfter = -1;
    std::uint64_t schedules = 0;
    bool capped = false;
    bool operator==(const Fix&) const = default;
};

struct Diagnosis {
    bool ok = false;
    bool unsure = false;
    std::vector<EmptyCourse> emptyCourses;
    std::vector<std::pair<std::size_t, std::size_t>> clashingPairs;
    std::vector<std::size_t> minimalClash;
    std::vector<Fix> fixes;
    bool operator==(const Diagnosis&) const = default;
};

Diagnosis diagnose(const Term& term,
                   const std::vector<std::string>& courseCodes,
                   const Preferences& prefs,
                   const SolveLimits& limits = {});

}
