#include "goatplan/solver.hpp"
#include "goatplan/groups.hpp"
#include <algorithm>
#include <compare>
#include <limits>
#include <numeric>
#include <queue>
#include <stdexcept>
#include <utility>

namespace goatplan {
    namespace {
        struct Found {
            std::vector<std::size_t> groups;
            Score score;
        };
        bool better(const Score& score, const std::vector<std::size_t>& groups, const Found& other,
                    SortPrimary primary) {
            const std::strong_ordering order = compareScores(score, other.score, primary);
            if (order != 0) {
                return order < 0;
            }
            return groups < other.groups;
        }
        struct Better {
            SortPrimary primary;
            bool operator()(const Found& a, const Found& b) const {
                return better(a.score, a.groups, b, primary);
            }
        };
        using Kept = std::priority_queue<Found, std::vector<Found>, Better>;

        struct Search {
            const std::vector<CourseGroups>& courses;
            const SolveLimits& limits;
            const ScoreWeights& weights;
            SortPrimary primary;
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
                    if (!better(score, picks, kept.top(), primary)) {
                        return;
                    }
                    kept.pop();
                }
                kept.push(Found{picks, score});
            }
            bool finished() const {
                return result.capped || (limits.stopAtFirst && result.patterns > 0);
            }
            void search(std::size_t depth, const WeekMask& used, std::uint64_t schedules) {
                if (depth == order.size()) {
                    result.total += schedules;
                    ++result.patterns;
                    if (!limits.stopAtFirst) {
                        keep(used);
                    }
                    return;
                }
                const std::size_t c = order[depth];
                const auto& groups = courses[c].groups;
                for (std::size_t g = 0; g < groups.size(); ++g) {
                    if (result.steps == std::numeric_limits<std::uint64_t>::max()) {
                        result.capped = true;
                        return;
                    }
                    ++result.steps;
                    if (result.steps > limits.stepBudget) {
                        result.capped = true;
                        return;
                    }
                    if (groups[g].mask.intersects(used)) {
                        continue;
                    }
                    picks[c] = g;
                    WeekMask next = used;
                    next |= groups[g].mask;
                    search(depth + 1, next, schedules * groups[g].members.size());
                    if (finished()) {
                        return;
                    }
                }
            }
        };

        std::size_t mostOpenSeats(const CourseChoices& choice, const std::vector<std::size_t>& members) {
            std::size_t best = members.front();
            for (std::size_t member : members) {
                if (choice.openSeats[member] > choice.openSeats[best]) {
                    best = member;
                }
            }
            return best;
        }
    }
    SolveResult solve(const std::vector<CourseChoices>& choices, const SolveLimits& limits,
                      const ScoreWeights& weights, SortPrimary primary) {
        for (const CourseChoices& choice : choices) {
            if (choice.masks.size() != choice.options.size() ||
                choice.openSeats.size() != choice.options.size()) {
                throw std::invalid_argument("Solver requires one mask and one seat count per filtered option");
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
        const std::vector<CourseGroups> courses = groupByTime(choices);
        std::vector<std::size_t> order(courses.size());
        std::iota(order.begin(), order.end(), std::size_t{0});
        std::stable_sort(order.begin(), order.end(),
            [&](std::size_t a, std::size_t b) {
                return courses[a].groups.size() < courses[b].groups.size();
            });
        Search search{courses, limits, weights, primary, order, result,
                    std::vector<std::size_t>(courses.size()), Kept{Better{primary}}};
        search.search(0, WeekMask{}, 1);

        std::vector<Found> found;
        found.reserve(search.kept.size());
        while (!search.kept.empty()) {
            found.push_back(search.kept.top());
            search.kept.pop();
        }
        result.schedules.reserve(found.size());
        for (auto it = found.rbegin(); it != found.rend(); ++it) {
            Schedule schedule;
            schedule.score = it->score;
            for (std::size_t c = 0; c < courses.size(); ++c) {
                const std::vector<std::size_t>& members = courses[c].groups[it->groups[c]].members;
                schedule.picks.push_back(mostOpenSeats(choices[c], members));
                schedule.alternatives.push_back(members);
            }
            result.schedules.push_back(std::move(schedule));
        }
        return result;
    }
}
