#pragma once

#include <array>
#include <cstddef>
#include <string>
#include <unordered_map>
#include <vector>

#include "goatplan/model.hpp"
#include "goatplan/week_mask.hpp"

namespace goatplan{
    struct Preferences {
        int startsAfter = 0;
        WeekMask blocked;
        bool onlyOpen =false;
        std::unordered_map<std::string, std::vector<std::string>> locked;
    };

    enum class FilterReason : std::size_t {
    NotLocked,
    NotOpen,
    StartsTooEarly,
    Blocked,
    Count
    };

    struct CourseChoices {
    const Course* course = nullptr;
    std::vector<std::size_t> options;
    std::vector<WeekMask> masks;
    std::vector<int> openSeats;
    std::array<int, static_cast<std::size_t>(FilterReason::Count)> removed{};
    };

    std::vector<CourseChoices> filterOptions(
    const Term& term,
    const std::vector<std::string>& courseCodes,
    const Preferences& prefs);
}