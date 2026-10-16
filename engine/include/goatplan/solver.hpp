#pragma once

#include <cstddef>
#include <cstdint>
#include <vector>

#include "goatplan/filters.hpp"
#include "goatplan/score.hpp"

namespace goatplan {
    struct SolveLimits {
        std::size_t maxSchedules = 200;
        std::uint64_t stepBudget = 5'000'000;
    };
    struct Schedule {
        std::vector<std::size_t> picks;
        std::vector<std::vector<std::size_t>> alternatives;
        Score score;
    };
    struct SolveResult {
        std::uint64_t total = 0;
        std::uint64_t patterns = 0;
        bool capped = false;
        std::uint64_t steps = 0;
        std::vector<Schedule> schedules;
    };
    SolveResult solve(const std::vector<CourseChoices>& choices,
                    const SolveLimits& limits = {},
                    const ScoreWeights& weights = {});
}
