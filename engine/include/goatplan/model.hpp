#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <unordered_map>
#include <vector>

namespace goatplan {
    using DayMask = std::uint8_t;

    enum Day : DayMask {
        Monday    = 1u << 0,
        Tuesday   = 1u << 1,
        Wednesday = 1u << 2,
        Thursday  = 1u << 3,
        Friday    = 1u << 4,
        Saturday  = 1u << 5,
        Sunday    = 1u << 6
    };

    enum class SectionType {
        Lecture,
        Lab,
        Discussion,
        Seminar,
        Other
    };

    enum class SectionStatus {
        Open,
        Waitlist,
        Closed
    };

    struct Meeting {
        DayMask days = 0;
        int start = 0;
        int end = 0;
        std::string location;
    };

    struct Section {
        std::string id;
        std::string code;

        SectionType type = SectionType::Other;
        SectionStatus status = SectionStatus::Closed;
        std::vector<std::string> instructors;
        std::vector<Meeting> meetings;
        int enrolled = 0;
        int capacity = 0;
    };

    // One way to take a course: positions in its sections list.
    using CourseOption = std::vector<std::size_t>;

    struct Course{
        std::string code;
        std::string title;
        std::vector<Section> sections;
        std::vector<CourseOption> options;
        double credits = 0.0;
    };

    struct Term{
        std::string id;
        std::string name;
        std::vector<Course> courses;
        std::unordered_map<std::string, std::size_t> courseIndex;

        const Course* findCourse(const std::string& code) const {
            const auto found = courseIndex.find(code);
            return found == courseIndex.end() ? nullptr : &courses[found->second];
        }
    };
}
