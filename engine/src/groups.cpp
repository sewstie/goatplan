#include "goatplan/groups.hpp"

#include <map>
#include <utility>

namespace goatplan {
    std::vector<CourseGroups> groupByTime(const std::vector<CourseChoices>& choices) {
        std::vector<CourseGroups> result;
        result.reserve(choices.size());
        for (const CourseChoices& choice : choices) {
            CourseGroups course;
            std::map<WeekMask, std::size_t> groupOf;
            for (std::size_t i = 0; i < choice.masks.size(); ++i) {
                const auto [found, isNew] = groupOf.try_emplace(choice.masks[i], course.groups.size());
                if (isNew) {
                    course.groups.push_back(TimeGroup{choice.masks[i], {}});
                }
                course.groups[found->second].members.push_back(i);
            }
            result.push_back(std::move(course));
        }
        return result;
    }
}
