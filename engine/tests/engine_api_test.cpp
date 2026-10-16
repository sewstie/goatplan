#include <gtest/gtest.h>

#include <algorithm>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include <nlohmann/json.hpp>

#include "goatplan/engine.hpp"
#include "goatplan/filters.hpp"
#include "goatplan/json_io.hpp"
#include "goatplan/solver.hpp"
#include "test_helpers.hpp"

using namespace goatplan;
using goatplan::test::TestCourse;
using goatplan::test::TestSection;
using json = nlohmann::json;

namespace {
const std::string kBoth = R"({"version": 1, "courses": ["AE 2320", "AE 4310"]})";

std::string readText(const std::string& path) {
    std::ifstream file(path);
    std::ostringstream text;
    text << file.rdbuf();
    return text.str();
}

Engine engineFor(const std::string& termJson) {
    Engine engine;
    engine.loadTerm(termJson);
    return engine;
}

Engine fixtureEngine() { return engineFor(readText(GOATPLAN_FIXTURES "/2027-C.small.json")); }

Term fixtureTerm() { return loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json"); }

json call(const Engine& engine, const std::string& request) {
    return json::parse(engine.handle(request));
}

void expectError(const json& response, const std::string& code) {
    EXPECT_EQ(response["ok"], false);
    EXPECT_EQ(response["version"], 1);
    EXPECT_EQ(response["error"]["code"], code) << response.dump();
}

std::string termJson(const std::vector<TestCourse>& courses) {
    static const char* const dayNames[] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
    json list = json::array();
    for (const auto& [code, sections] : courses) {
        json sectionList = json::array();
        json options = json::array();
        for (std::size_t i = 0; i < sections.size(); ++i) {
            const TestSection& spec = sections[i];
            json days = json::array();
            for (int d = 0; d < 7; ++d) {
                if (spec.days & (1u << d)) days.push_back(dayNames[d]);
            }
            const std::string id = code + "-" + std::to_string(i);
            json meeting = {{"days", days}, {"start", spec.start}, {"end", spec.end}, {"location", ""}};
            sectionList.push_back({
                {"id", id}, {"code", std::to_string(i)}, {"type", "lecture"},
                {"status", spec.status == SectionStatus::Open ? "open" : "closed"},
                {"enrolled", 0}, {"capacity", 10}, {"instructors", json::array()},
                {"meetings", json::array({meeting})},
            });
            options.push_back(json::array({id}));
        }
        list.push_back({{"code", code}, {"title", code}, {"credits", 3},
                        {"sections", sectionList}, {"options", options}});
    }
    return json{{"term", {{"id", "TEST"}, {"name", "Test"}}}, {"courses", list}}.dump();
}

std::vector<std::string> idsOf(const CourseChoices& choice, std::size_t filtered) {
    std::vector<std::string> ids;
    for (std::size_t section : choice.course->options[choice.options[filtered]]) {
        ids.push_back(choice.course->sections[section].id);
    }
    return ids;
}

void expectGolden(const Engine& engine, const std::string& name, const std::string& request) {
    nlohmann::ordered_json response = nlohmann::ordered_json::parse(engine.handle(request));
    response.erase("elapsedMs");
    const std::string path = std::string(GOATPLAN_GOLDEN_DIR) + "/" + name + ".json";
    const char* update = std::getenv("GOATPLAN_UPDATE_GOLDEN");
    if (update != nullptr && std::string(update) == "1") {
        std::ofstream(path) << response.dump(2) << '\n';
        return;
    }
    std::ifstream file(path);
    ASSERT_TRUE(file) << path << " is missing, run the tests with GOATPLAN_UPDATE_GOLDEN=1";
    EXPECT_EQ(json::parse(response.dump()), json::parse(file)) << response.dump(2);
}
}

TEST(EngineApi, NeedsATermFirst) {
    const Engine engine;
    EXPECT_FALSE(engine.hasTerm());
    const json response = call(engine, kBoth);
    expectError(response, "noTerm");
    EXPECT_TRUE(response["error"]["detail"].is_null());
}

TEST(EngineApi, BrokenJsonIsABadRequest) {
    const Engine engine = fixtureEngine();
    for (const std::string text : {"{not json", "", "[1, 2]", "null", "\"AE 2320\"", "{\"version\": 1,"}) {
        SCOPED_TRACE(text);
        std::string response;
        EXPECT_NO_THROW(response = engine.handle(text));
        expectError(json::parse(response), "badRequest");
    }
}

TEST(EngineApi, BadFieldsAreNamed) {
    const Engine engine = fixtureEngine();
    const std::vector<std::pair<std::string, std::string>> cases{
        {R"({"version": 1})", "courses"},
        {R"({"version": 1, "courses": 5})", "courses"},
        {R"({"version": 1, "courses": []})", "courses"},
        {R"({"version": 1, "courses": ["AE 2320", 7]})", "courses[1]"},
        {R"({"courses": ["AE 2320"]})", "version"},
        {R"({"version": "1", "courses": ["AE 2320"]})", "version"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": []})", "preferences"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"startsAfter": 1500}})", "preferences.startsAfter"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"startsAfter": -5}})", "preferences.startsAfter"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"onlyOpen": "yes"}})", "preferences.onlyOpen"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"blocked": {}}})", "preferences.blocked"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"blocked": [{"day": "Funday", "start": 0, "end": 60}]}})",
         "preferences.blocked[0].day"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"blocked": [{"day": "Mon", "start": 600}]}})",
         "preferences.blocked[0].end"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"blocked": [{"day": "Mon", "start": 600, "end": 600}]}})",
         "preferences.blocked[0]"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"locked": {"AE 2320": "AE 2320-CL01"}}})",
         R"(preferences.locked["AE 2320"])"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"perDay": 20000}})", "sort.perDay"},
        {R"({"version": 1, "courses": ["AE 2320"], "limits": {"maxSchedules": -1}})", "limits.maxSchedules"},
        {R"({"version": 1, "courses": ["AE 2320"], "limits": {"stepBudget": 2.5}})", "limits.stepBudget"},
    };
    for (const auto& [request, field] : cases) {
        SCOPED_TRACE(request);
        const json response = call(engine, request);
        expectError(response, "badRequest");
        EXPECT_EQ(response["error"]["detail"], field);
        EXPECT_NE(response["error"]["message"].get<std::string>().find(field), std::string::npos);
    }
}

TEST(EngineApi, OtherVersionsAreRefused) {
    const json response = call(fixtureEngine(), R"({"version": 2, "courses": ["AE 2320"]})");
    expectError(response, "unsupportedVersion");
    EXPECT_EQ(response["error"]["detail"], "2");
}

TEST(EngineApi, UnknownCourseNamesTheCode) {
    const Engine engine = fixtureEngine();
    json response = call(engine, R"({"version": 1, "courses": ["AE 2320", "PH 9999"]})");
    expectError(response, "unknownCourse");
    EXPECT_EQ(response["error"]["detail"], "PH 9999");
    EXPECT_EQ(response["error"]["message"], "No course PH 9999 in 2027-C");

    response = call(engine, R"({"version": 1, "courses": ["AE 2320"],
                                "preferences": {"locked": {"PH 9999": ["PH 9999-A01"]}}})");
    expectError(response, "unknownCourse");
    EXPECT_EQ(response["error"]["detail"], "PH 9999");
}

TEST(EngineApi, UnknownLockedSectionIsReported) {
    const Engine engine = fixtureEngine();
    for (const std::string id : {"AE 2320-ZZ99", "AE 4310-C01"}) {
        SCOPED_TRACE(id);
        const json response = call(engine, R"({"version": 1, "courses": ["AE 2320"],
            "preferences": {"locked": {"AE 2320": [")" + id + R"("]}}})");
        expectError(response, "unknownSection");
        EXPECT_EQ(response["error"]["detail"], id);
    }
}

TEST(EngineApi, MatchesCallingTheSolverDirectly) {
    const Term term = fixtureTerm();
    const SolveResult direct = solve(filterOptions(term, {"AE 2320", "AE 4310"}, Preferences{}));
    const json response = call(fixtureEngine(), kBoth);
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["version"], 1);
    EXPECT_EQ(response["termId"], "2027-C");
    EXPECT_EQ(response["total"], direct.total);
    EXPECT_EQ(response["patterns"], direct.patterns);
    EXPECT_EQ(response["steps"], direct.steps);
    EXPECT_EQ(response["capped"], false);
    EXPECT_EQ(response["schedules"].size(), direct.schedules.size());
    EXPECT_TRUE(response["elapsedMs"].is_number());
}

TEST(EngineApi, SectionIdsAreRealAndShownOptionIsAnAlternative) {
    const std::vector<TestCourse> courses{
        {"A", {{Monday, 540, 590}, {Monday, 540, 590}, {Monday, 540, 590}, {Tuesday, 540, 590}}},
        {"B", {{Monday, 600, 650}, {Wednesday, 600, 650}, {Wednesday, 600, 650}}},
    };
    const std::vector<std::pair<std::string, std::string>> terms{
        {termJson(courses), R"({"version": 1, "courses": ["A", "B"]})"},
        {readText(GOATPLAN_FIXTURES "/2027-C.small.json"), kBoth},
    };
    for (const auto& [text, request] : terms) {
        const Term term = parseTerm(text);
        const json response = call(engineFor(text), request);
        ASSERT_EQ(response["ok"], true) << response.dump();
        ASSERT_FALSE(response["schedules"].empty());
        std::size_t sameTime = 0;
        for (const json& schedule : response["schedules"]) {
            for (const json& course : schedule["courses"]) {
                const Course* known = term.findCourse(course["code"].get<std::string>());
                ASSERT_NE(known, nullptr);
                std::vector<std::vector<std::string>> options;
                for (const CourseOption& option : known->options) {
                    std::vector<std::string> ids;
                    for (std::size_t section : option) ids.push_back(known->sections[section].id);
                    options.push_back(ids);
                }
                const auto alternatives = course["alternatives"].get<std::vector<std::vector<std::string>>>();
                const auto shown = course["sections"].get<std::vector<std::string>>();
                EXPECT_NE(std::find(alternatives.begin(), alternatives.end(), shown), alternatives.end());
                for (const auto& alternative : alternatives) {
                    EXPECT_NE(std::find(options.begin(), options.end(), alternative), options.end());
                }
                sameTime = std::max(sameTime, alternatives.size());
            }
        }
        if (term.id == "TEST") EXPECT_EQ(sameTime, 3u);
    }
}

TEST(EngineApi, BlockedTimesMatchPreferences) {
    const Term term = fixtureTerm();
    Preferences prefs;
    prefs.blocked.addRange(3, 900, 960);
    const auto choices = filterOptions(term, {"AE 2320", "AE 4310"}, prefs);
    const SolveResult direct = solve(choices);

    const json response = call(fixtureEngine(), R"({"version": 1, "courses": ["AE 2320", "AE 4310"],
        "preferences": {"blocked": [{"day": "Thu", "start": 900, "end": 960}]}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["total"], direct.total);
    EXPECT_LT(direct.total, solve(filterOptions(term, {"AE 2320", "AE 4310"}, Preferences{})).total);
    ASSERT_EQ(response["schedules"].size(), direct.schedules.size());
    for (std::size_t s = 0; s < direct.schedules.size(); ++s) {
        for (std::size_t c = 0; c < choices.size(); ++c) {
            EXPECT_EQ(response["schedules"][s]["courses"][c]["sections"],
                      json(idsOf(choices[c], direct.schedules[s].picks[c])));
        }
    }
}

TEST(EngineApi, DiagnosisOnlyWhenNothingFits) {
    const Engine engine = fixtureEngine();
    EXPECT_TRUE(call(engine, kBoth)["diagnosis"].is_null());

    const json late = call(engine, R"({"version": 1, "courses": ["AE 2320", "AE 4310"],
                                       "preferences": {"startsAfter": 600}})");
    ASSERT_EQ(late["ok"], true) << late.dump();
    EXPECT_EQ(late["total"], 0);
    EXPECT_TRUE(late["schedules"].empty());
    const json& diagnosis = late["diagnosis"];
    EXPECT_EQ(diagnosis["unsure"], false);
    ASSERT_EQ(diagnosis["emptyCourses"].size(), 1u);
    EXPECT_EQ(diagnosis["emptyCourses"][0]["code"], "AE 2320");
    EXPECT_EQ(diagnosis["emptyCourses"][0]["removed"]["startsTooEarly"], 3);
    EXPECT_EQ(diagnosis["emptyCourses"][0]["latestStartsAfter"], 540);
    EXPECT_EQ(diagnosis["fixes"], json::parse(R"([
        {"kind": "relaxStartsAfter", "startsAfter": 540, "schedules": 3, "capped": false},
        {"kind": "dropCourse", "course": "AE 2320", "schedules": 1, "capped": false}])"));

    const std::string clash = termJson({{"A", {{Monday, 540, 590}}}, {"B", {{Monday, 540, 590}}}});
    const json pair = call(engineFor(clash), R"({"version": 1, "courses": ["A", "B"]})");
    EXPECT_EQ(pair["diagnosis"]["clashingPairs"], json::parse(R"([["A", "B"]])"));
}

TEST(EngineApi, RepeatedCoursesCountOnce) {
    const Engine engine = fixtureEngine();
    json once = call(engine, kBoth);
    json twice = call(engine, R"({"version": 1, "courses": ["AE 2320", "AE 4310", "AE 2320", "AE 4310"]})");
    once.erase("elapsedMs");
    twice.erase("elapsedMs");
    EXPECT_EQ(once, twice);
    EXPECT_EQ(twice["schedules"][0]["courses"].size(), 2u);
}

TEST(EngineApi, LimitsAreClamped) {
    std::vector<TestCourse> courses;
    for (DayMask day : {Monday, Tuesday, Wednesday}) {
        std::vector<TestSection> sections;
        for (int hour = 8; hour < 16; ++hour) sections.push_back({day, hour * 60, hour * 60 + 50});
        courses.emplace_back("X" + std::to_string(courses.size()), sections);
    }
    const Engine engine = engineFor(termJson(courses));
    const json response = call(engine, R"({"version": 1, "courses": ["X0", "X1", "X2"],
        "limits": {"maxSchedules": 10000, "stepBudget": 1000000000000000}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["total"], 512);
    EXPECT_EQ(response["schedules"].size(), 500u);
}

TEST(EngineApi, MatchesGoldenResponses) {
    const Engine engine = fixtureEngine();
    expectGolden(engine, "basic", kBoth);
    expectGolden(engine, "impossible", R"({"version": 1, "courses": ["AE 2320", "AE 4310"],
        "preferences": {"startsAfter": 600, "onlyOpen": true}})");
}
