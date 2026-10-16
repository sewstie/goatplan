#pragma once

#include <cstddef>
#include <vector>

#include "goatplan/filters.hpp"
#include "goatplan/week_mask.hpp"

namespace goatplan {
    struct TimeGroup {
        WeekMask mask;
        std::vector<std::size_t> members;
    };
    struct CourseGroups {
        std::vector<TimeGroup> groups;
    };
    std::vector<CourseGroups> groupByTime(const std::vector<CourseChoices>& choices);
}
