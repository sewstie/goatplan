#include "goatplan/solver.hpp"
#include <algorithm>
#include <limits>
#include <numeric>
#include <queue>
#include <stdexcept>

namespace goatplan {
    namespace {
        // Lower total wins; equal totals fall back to picks so every run gives the same order.
        bool better(int total, const std::vector<std::size_t>& picks, const Schedule& other) {
            if (total != other.score.total) {
                return total < other.score.total;
            }
            return picks < other.picks;
        }
        struct Better {
            bool operator()(const Schedule& a, const Schedule& b) const {
                return better(a.score.total, a.picks, b);
            }
        };
        // The worst kept schedule is on top, ready to be replaced.
        using Kept = std::priority_queue<Schedule, std::vector<Schedule>, Better>;

        struct Search {
            const std::vector<CourseChoices>& choices;
            const SolveLimits& limits;
            const ScoreWeights& weights;
            const std::vector<std::size_t>& order;
            SolveResult& result;
            std::vector<std::size_t> picks;
            Kept kept;
            void keep(const WeekMask& week) {
                if (limits.maxSchedules == 0) {
                    return;
                }
                const Score score = scoreOf(week, weights);
                if (kept.size() == limits.maxSchedules) {
                    if (!better(score.total, picks, kept.top())) {
                        return;
                    }
                    kept.pop();
                }
                kept.push(Schedule{picks, score});
            }
            void search(std::size_t depth, WeekMask used) {
                if (depth == order.size()) {
                    ++result.total;
                    keep(used);
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
    SolveResult solve(const std::vector<CourseChoices>& choices, const SolveLimits& limits,
                      const ScoreWeights& weights) {
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
        Search search{choices, limits, weights, order, result,
                    std::vector<std::size_t>(choices.size()), Kept{}};
        search.search(0, WeekMask{});

        result.schedules.reserve(search.kept.size());
        while (!search.kept.empty()) {
            result.schedules.push_back(search.kept.top());
            search.kept.pop();
        }
        std::reverse(result.schedules.begin(), result.schedules.end());
        return result;
    }
}
