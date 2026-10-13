#include "goatplan/json_io.hpp"

#include <fstream>
#include <sstream>
#include <unordered_map>
#include <utility>

#include <nlohmann/json.hpp>

namespace goatplan {
    namespace {
        using json = nlohmann::json;

        DayMask readDays(const json& j) {
            static const std::unordered_map<std::string, Day> days{
                {"Mon", Monday}, {"Tue", Tuesday}, {"Wed", Wednesday}, {"Thu", Thursday},
                {"Fri", Friday}, {"Sat", Saturday}, {"Sun", Sunday},
            };
            DayMask mask = 0;
            for (const json& name : j) {
                const auto found = days.find(name.get<std::string>());
                if (found == days.end()) {
                    throw TermLoadError("unknown day " + name.dump());
                }
                mask |= found->second;
            }
            return mask;
        }

        // Workshops, and any type added to the data later, count as Other.
        SectionType readSectionType(const json& j) {
            static const std::unordered_map<std::string, SectionType> types{
                {"lecture", SectionType::Lecture},
                {"lab", SectionType::Lab},
                {"discussion", SectionType::Discussion},
                {"seminar", SectionType::Seminar},
            };
            const auto found = types.find(j.get<std::string>());
            return found == types.end() ? SectionType::Other : found->second;
        }

        SectionStatus readStatus(const json& j) {
            static const std::unordered_map<std::string, SectionStatus> statuses{
                {"open", SectionStatus::Open},
                {"waitlist", SectionStatus::Waitlist},
                {"closed", SectionStatus::Closed},
            };
            const auto found = statuses.find(j.get<std::string>());
            if (found == statuses.end()) {
                throw TermLoadError("unknown section status " + j.dump());
            }
            return found->second;
        }

        Meeting readMeeting(const json& j) {
            Meeting meeting;
            meeting.days = readDays(j.at("days"));
            meeting.start = j.at("start").get<int>();
            meeting.end = j.at("end").get<int>();
            meeting.location = j.at("location").get<std::string>();
            if (meeting.start >= meeting.end) {
                throw TermLoadError("a meeting has to end after it starts, got " + std::to_string(meeting.start) +
                                    " to " + std::to_string(meeting.end));
            }
            return meeting;
        }

        Section readSection(const json& j) {
            Section section;
            section.id = j.at("id").get<std::string>();
            section.code = j.at("code").get<std::string>();
            section.type = readSectionType(j.at("type"));
            section.status = readStatus(j.at("status"));
            section.enrolled = j.at("enrolled").get<int>();
            section.capacity = j.at("capacity").get<int>();
            section.instructors = j.at("instructors").get<std::vector<std::string>>();
            for (const json& meeting : j.at("meetings")) {
                section.meetings.push_back(readMeeting(meeting));
            }
            return section;
        }

        Course readCourse(const json& j) {
            Course course;
            course.code = j.at("code").get<std::string>();
            course.title = j.at("title").get<std::string>();
            course.credits = j.at("credits").get<double>();

            std::unordered_map<std::string, std::size_t> positions;
            for (const json& section : j.at("sections")) {
                course.sections.push_back(readSection(section));
                positions.emplace(course.sections.back().id, course.sections.size() - 1);
            }

            for (const json& ids : j.at("options")) {
                CourseOption option;
                for (const json& id : ids) {
                    const auto found = positions.find(id.get<std::string>());
                    if (found == positions.end()) {
                        throw TermLoadError(course.code + ": an option points to " + id.dump() +
                                            ", which is not one of its sections");
                    }
                    option.push_back(found->second);
                }
                course.options.push_back(std::move(option));
            }
            return course;
        }

        Term readTerm(const json& j) {
            Term term;
            term.id = j.at("term").at("id").get<std::string>();
            term.name = j.at("term").at("name").get<std::string>();
            for (const json& course : j.at("courses")) {
                term.courses.push_back(readCourse(course));
                term.courseIndex.emplace(term.courses.back().code, term.courses.size() - 1);
            }
            return term;
        }
    }

    Term parseTerm(std::string_view text) {
        try {
            return readTerm(json::parse(text));
        } catch (const json::exception& error) {
            throw TermLoadError(error.what());
        }
    }

    Term loadTermFile(const std::string& path) {
        std::ifstream file(path);
        if (!file) {
            throw TermLoadError("can't open " + path);
        }
        std::ostringstream text;
        text << file.rdbuf();
        return parseTerm(text.str());
    }
}
