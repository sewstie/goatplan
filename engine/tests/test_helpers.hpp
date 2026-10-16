#pragma once

#include <cstddef>
#include <string>
#include <utility>
#include <vector>

#include "goatplan/model.hpp"

namespace goatplan::test {

struct TestSection {
    DayMask days = Monday;
    int start = 0;
    int end = 0;
    SectionStatus status = SectionStatus::Open;
};

using TestCourse = std::pair<std::string, std::vector<TestSection>>;

// Each section becomes its own option, with the id "<code>-<position>".
inline Term makeTerm(const std::vector<TestCourse>& courses) {
    Term term;
    for (const auto& [code, sections] : courses) {
        Course course;
        course.code = code;
        for (const TestSection& spec : sections) {
            Section section;
            section.id = code + "-" + std::to_string(course.sections.size());
            section.code = section.id;
            section.status = spec.status;
            section.meetings.push_back(Meeting{spec.days, spec.start, spec.end, ""});
            course.options.push_back({course.sections.size()});
            course.sections.push_back(std::move(section));
        }
        term.courseIndex.emplace(code, term.courses.size());
        term.courses.push_back(std::move(course));
    }
    return term;
}

}  // namespace goatplan::test
