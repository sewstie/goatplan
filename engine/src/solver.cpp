#include "goatplan/solver.hpp"
#include <algorithm>
#include <limits>
#include <numeric>
#include <stdexcept>

namespace goatplan {
    namespace {
        struct Search {
            const std::vector<CourseChoices>& choices;
            const SolveLimits& limits;
            const std::vector<std::size_t>& order;
            SolveResult& result;
            std::vector<std::size_t> picks;
            void search(std::size_t depth, WeekMask used) {
                if (depth == order.size()) {
                    ++result.total;
                    if (result.schedules.size() < limits.maxSchedules) {
                        result.schedules.push_back(Schedule{picks});
                    }
                    return;
                }
                const std::size_t c = order[depth];
                const auto& masks = choices[c].masks;
                for (std::size_t k = 0; k < masks.size(); ++k) {
                    if (result.steps == std::numeric_limits<std::uint64_t>::max()) {
                        result.capped = true;
                        return;
                    }
                    ++result.steps;
                    if (result.steps > limits.stepBudget) {
                        result.capped = true;
                        return;
                    }
                    if (masks[k].intersects(used)) {
                        continue;
                    }
                    picks[c] = k;
                    WeekMask next = used;
                    next |= masks[k];
                    search(depth + 1, next);
                    if (result.capped) {
                        return;
                    }
                }
            }
        };
    }
    SolveResult solve(const std::vector<CourseChoices>& choices, const SolveLimits& limits) {
        for (const CourseChoices& choice : choices) {
            if (choice.masks.size() != choice.options.size()) {
                throw std::invalid_argument("Solver requires one mask per filtered option");
            }
        }
        SolveResult result;
        if (choices.empty()) {
            return result;
        }
        for (const CourseChoices& choice : choices) {
            if (choice.options.empty()) {
                return result;
            }
        }
        std::vector<std::size_t> order(choices.size());
        std::iota(order.begin(), order.end(), std::size_t{0});
        std::stable_sort(order.begin(), order.end(),
            [&](std::size_t a, std::size_t b) {
                return choices[a].options.size() < choices[b].options.size();
            });
        Search search{choices, limits, order, result,
                    std::vector<std::size_t>(choices.size())};
        search.search(0, WeekMask{});
        return result;
    }
}
