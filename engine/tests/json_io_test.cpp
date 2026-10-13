#include <gtest/gtest.h>

#include <nlohmann/json.hpp>

#include "goatplan/json_io.hpp"

using namespace goatplan;

namespace {
nlohmann::json oneCourseTerm() {
    return nlohmann::json::parse(R"({
        "term": {"id": "2027-C", "name": "C Term"},
        "courses": [{
            "code": "AE 2320",
            "title": "Introduction to Orbital Mechanics",
            "credits": 3,
            "sections": [
                {"id": "AE 2320-CL01", "code": "CL01", "type": "lecture", "status": "open",
                 "enrolled": 85, "capacity": 120, "instructors": ["Ye Lu"],
                 "meetings": [{"days": ["Mon", "Thu"], "start": 540, "end": 590, "location": "Unity Hall 400"}]},
                {"id": "AE 2320-CX01", "code": "CX01", "type": "lab", "status": "closed",
                 "enrolled": 40, "capacity": 40, "instructors": ["Ye Lu"],
                 "meetings": [{"days": ["Thu"], "start": 840, "end": 890, "location": "Higgins Labs 230"}]}
            ],
            "options": [["AE 2320-CL01", "AE 2320-CX01"]]
        }]
    })");
}
}  // namespace

TEST(JsonIo, LoadsTheSmallFixture) {
    const Term term = loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json");

    EXPECT_EQ(term.id, "2027-C");
    EXPECT_EQ(term.name, "C Term");
    EXPECT_EQ(term.courses.size(), 2u);

    const Course* course = term.findCourse("AE 2320");
    ASSERT_NE(course, nullptr);
    EXPECT_EQ(course->sections.size(), 4u);
    EXPECT_EQ(course->options.size(), 3u);

    EXPECT_EQ(term.findCourse("PH 1120"), nullptr);
}

TEST(JsonIo, ReadsASectionAndItsMeeting) {
    const Term term = parseTerm(oneCourseTerm().dump());
    const Course& course = term.courses.at(0);
    EXPECT_EQ(course.title, "Introduction to Orbital Mechanics");
    EXPECT_EQ(course.credits, 3.0);

    const Section& lecture = course.sections.at(0);
    EXPECT_EQ(lecture.id, "AE 2320-CL01");
    EXPECT_EQ(lecture.code, "CL01");
    EXPECT_EQ(lecture.type, SectionType::Lecture);
    EXPECT_EQ(lecture.status, SectionStatus::Open);
    EXPECT_EQ(lecture.enrolled, 85);
    EXPECT_EQ(lecture.capacity, 120);
    EXPECT_EQ(lecture.instructors, std::vector<std::string>{"Ye Lu"});

    const Meeting& meeting = lecture.meetings.at(0);
    EXPECT_EQ(meeting.days, Monday | Thursday);
    EXPECT_EQ(meeting.start, 540);
    EXPECT_EQ(meeting.end, 590);
    EXPECT_EQ(meeting.location, "Unity Hall 400");
}

TEST(JsonIo, TurnsOptionIdsIntoPositions) {
    nlohmann::json json = oneCourseTerm();
    json["courses"][0]["options"][0] = {"AE 2320-CX01", "AE 2320-CL01"};

    const Term term = parseTerm(json.dump());
    EXPECT_EQ(term.courses.at(0).options.at(0), (CourseOption{1, 0}));
}

TEST(JsonIo, CountsAWorkshopAsOther) {
    nlohmann::json json = oneCourseTerm();
    json["courses"][0]["sections"][1]["type"] = "workshop";

    const Term term = parseTerm(json.dump());
    EXPECT_EQ(term.courses.at(0).sections.at(1).type, SectionType::Other);
}

TEST(JsonIo, RejectsAnOptionThatPointsToAMissingSection) {
    nlohmann::json json = oneCourseTerm();
    json["courses"][0]["options"][0][1] = "AE 2320-CX09";
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);
}

TEST(JsonIo, RejectsAMeetingThatDoesNotEndAfterItStarts) {
    nlohmann::json json = oneCourseTerm();
    nlohmann::json& meeting = json["courses"][0]["sections"][0]["meetings"][0];

    meeting["end"] = 540;
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);
    meeting["end"] = 500;
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);
}

TEST(JsonIo, RejectsADayOrStatusItDoesNotKnow) {
    nlohmann::json json = oneCourseTerm();
    json["courses"][0]["sections"][0]["meetings"][0]["days"] = {"Mon", "Xyz"};
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);

    json = oneCourseTerm();
    json["courses"][0]["sections"][0]["status"] = "full";
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);
}

TEST(JsonIo, ReportsJsonProblemsAsTermLoadError) {
    EXPECT_THROW(parseTerm("{ not json"), TermLoadError);

    nlohmann::json json = oneCourseTerm();
    json["courses"][0].erase("sections");
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);

    json = oneCourseTerm();
    json["courses"][0]["sections"][0]["enrolled"] = "many";
    EXPECT_THROW(parseTerm(json.dump()), TermLoadError);
}

TEST(JsonIo, ReportsAFileItCannotOpen) {
    EXPECT_THROW(loadTermFile(GOATPLAN_FIXTURES "/no-such-term.json"), TermLoadError);
}
