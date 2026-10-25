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
using goatplan::test::RankKey;
using goatplan::test::TestCourse;
using goatplan::test::TestSection;
using goatplan::test::rankKey;
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

TEST(EngineApi, LoadTermJsonNamesTheTerm) {
    Engine engine;
    const json response = json::parse(engine.loadTermJson(readText(GOATPLAN_FIXTURES "/2027-C.small.json")));
    EXPECT_EQ(response, json::parse(R"({"ok": true, "version": 1, "termId": "2027-C", "courses": 2})"));
    EXPECT_TRUE(engine.hasTerm());
}

TEST(EngineApi, LoadTermJsonRefusesBrokenJson) {
    Engine engine = fixtureEngine();
    for (const std::string text : {"{not json", "", R"({"term": {"id": "2027-C",)"}) {
        SCOPED_TRACE(text);
        std::string response;
        EXPECT_NO_THROW(response = engine.loadTermJson(text));
        expectError(json::parse(response), "badTerm");
    }
    EXPECT_EQ(call(engine, kBoth)["termId"], "2027-C");
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
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"anyOf": []}})",
         "preferences.anyOf"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"anyOf": {"AE 2320": "AE 2320-CL01"}}})",
         R"(preferences.anyOf["AE 2320"])"},
        {R"({"version": 1, "courses": ["AE 2320"], "preferences": {"anyOf": {"AE 2320": [7]}}})",
         R"(preferences.anyOf["AE 2320"][0])"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"perDay": 20000}})", "sort.perDay"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"lateCutoff": 1441}})", "sort.lateCutoff"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"lateCutoff": -1}})", "sort.lateCutoff"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"perLateMinute": 10001}})", "sort.perLateMinute"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"perLateMinute": -1}})", "sort.perLateMinute"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"primary": "total"}})", "sort.primary"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"primary": "FirstStart"}})", "sort.primary"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"primary": ""}})", "sort.primary"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"primary": 3}})", "sort.primary"},
        {R"({"version": 1, "courses": ["AE 2320"], "sort": {"primary": ["days"]}})", "sort.primary"},
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

TEST(EngineApi, AnyOfRejectsUnknownCoursesAndSections) {
    const Engine engine = fixtureEngine();
    for (const std::string id : {"AE 2320-ZZ99", "AE 4310-C01"}) {
        SCOPED_TRACE(id);
        const json response = call(engine, R"({"version": 1, "courses": ["AE 2320"],
            "preferences": {"anyOf": {"AE 2320": [")" + id + R"("]}}})");
        ASSERT_EQ(response["ok"], false) << response.dump();
        expectError(response, "unknownSection");
        EXPECT_EQ(response["error"]["detail"], id);
    }
    const json response = call(engine, R"({"version": 1, "courses": ["AE 2320"],
        "preferences": {"anyOf": {"PH 9999": []}}})");
    ASSERT_EQ(response["ok"], false) << response.dump();
    expectError(response, "unknownCourse");
    EXPECT_EQ(response["error"]["detail"], "PH 9999");
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

TEST(EngineApi, AnyOfKeepsOptionsWithAtLeastOneListedSection) {
    const json response = call(fixtureEngine(), R"({"version": 1, "courses": ["AE 2320"],
        "preferences": {"anyOf": {"AE 2320": ["AE 2320-CX01", "AE 2320-CX03"]}}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["version"], 1);
    EXPECT_EQ(response["total"], 2);
    EXPECT_TRUE(response["diagnosis"].is_null());
    std::vector<std::vector<std::string>> alternatives;
    for (const json& schedule : response["schedules"]) {
        for (const json& option : schedule["courses"][0]["alternatives"]) {
            alternatives.push_back(option.get<std::vector<std::string>>());
        }
    }
    std::sort(alternatives.begin(), alternatives.end());
    EXPECT_EQ(alternatives, (std::vector<std::vector<std::string>>{
        {"AE 2320-CL01", "AE 2320-CX01"}, {"AE 2320-CL01", "AE 2320-CX03"}}));
}

TEST(EngineApi, EmptyOrNullAnyOfKeepsTheDefaultBehavior) {
    const Engine engine = fixtureEngine();
    json expected = call(engine, kBoth);
    expected.erase("elapsedMs");
    for (const std::string request : {
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "preferences": {"anyOf": {}}})",
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "preferences": {"anyOf": {"AE 2320": []}}})",
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "preferences": {"anyOf": null}})"}) {
        SCOPED_TRACE(request);
        json response = call(engine, request);
        response.erase("elapsedMs");
        EXPECT_EQ(response, expected);
    }
}

TEST(EngineApi, DiagnosisCountsAnyOfRejectionsAfterLocks) {
    const json response = call(fixtureEngine(), R"({"version": 1, "courses": ["AE 2320"],
        "preferences": {"locked": {"AE 2320": ["AE 2320-CX01"]},
                        "anyOf": {"AE 2320": ["AE 2320-CX02"]}, "onlyOpen": true}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["total"], 0);
    ASSERT_EQ(response["diagnosis"]["emptyCourses"].size(), 1u);
    EXPECT_EQ(response["diagnosis"]["emptyCourses"][0]["removed"], json::parse(R"({
        "notLocked": 2, "notAnyOf": 1, "notOpen": 0, "startsTooEarly": 0, "blocked": 0})"));
}

TEST(EngineApi, DiagnosisSuggestsClearingAnyOfWithTheCourseCode) {
    const Engine engine = engineFor(termJson({
        {"A", {{Monday, 540, 590}, {Tuesday, 540, 590}}},
        {"B", {{Monday, 540, 590}}}}));
    const json response = call(engine, R"({"version": 1, "courses": ["B", "A"],
        "preferences": {"anyOf": {"A": ["A-0"]}}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    EXPECT_EQ(response["total"], 0);
    ASSERT_FALSE(response["diagnosis"]["fixes"].empty());
    EXPECT_EQ(response["diagnosis"]["fixes"][0], json::parse(R"({
        "kind": "clearAnyOf", "course": "A", "schedules": 1, "capped": false})"));
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

TEST(EngineApi, LateMinutesInResponseWithDefaults) {
    const json response = call(fixtureEngine(), kBoth);
    ASSERT_EQ(response["ok"], true) << response.dump();
    for (const json& schedule : response["schedules"]) {
        EXPECT_TRUE(schedule["score"].contains("lateMinutes"));
        EXPECT_EQ(schedule["score"]["lateMinutes"], 0);
    }
}

TEST(EngineApi, HeavyLateWeightRanksEarlierEndingFirst) {
    const std::vector<TestCourse> courses{
        {"A", {{Monday, 540, 590}, {Monday, 540, 660}}},
        {"B", {{Tuesday, 540, 590}}},
    };
    const Engine engine = engineFor(termJson(courses));
    const json response = call(engine, R"({"version": 1, "courses": ["A", "B"],
        "sort": {"earlyCutoff": 0, "perEarlyMinute": 0, "perGapMinute": 0, "perDay": 0,
                 "lateCutoff": 600, "perLateMinute": 100}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    ASSERT_EQ(response["schedules"].size(), 2u);
    EXPECT_EQ(response["schedules"][0]["score"]["lateMinutes"], 0);
    EXPECT_LT(response["schedules"][0]["score"]["total"],
              response["schedules"][1]["score"]["total"]);
    EXPECT_GT(response["schedules"][1]["score"]["lateMinutes"], 0);
}

TEST(EngineApi, LateMinutesCountedPerDay) {
    const std::vector<TestCourse> courses{
        {"A", {{Monday | Wednesday, 900, 960}}},
    };
    const Engine engine = engineFor(termJson(courses));
    const json response = call(engine, R"({"version": 1, "courses": ["A"],
        "sort": {"earlyCutoff": 0, "perEarlyMinute": 0, "perGapMinute": 0, "perDay": 0,
                 "lateCutoff": 900, "perLateMinute": 1}})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    ASSERT_EQ(response["schedules"].size(), 1u);
    EXPECT_EQ(response["schedules"][0]["score"]["lateMinutes"], 120);
    EXPECT_EQ(response["schedules"][0]["score"]["total"], 120);
}

TEST(EngineApi, ScoreHasTheTimeFields) {
    const Engine engine = engineFor(termJson({
        {"A", {{Monday | Wednesday, 540, 590}}},
        {"B", {{Monday, 660, 710}}}}));
    const json response = call(engine, R"({"version": 1, "courses": ["A", "B"]})");
    ASSERT_EQ(response["ok"], true) << response.dump();
    ASSERT_EQ(response["schedules"].size(), 1u);
    EXPECT_EQ(response["schedules"][0]["score"], json::parse(R"({
        "total": 550, "earlyMinutes": 120, "gapMinutes": 70, "lateMinutes": 0, "days": 2,
        "firstStart": 540, "lastEnd": 710, "averageStart": 540, "averageEnd": 650, "freeMinutes": 70})"));
}

TEST(EngineApi, MissingOrNullPrimaryRanksAsBefore) {
    const Engine engine = fixtureEngine();
    json expected = call(engine, kBoth);
    expected.erase("elapsedMs");
    for (const std::string request : {
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "sort": {}})",
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "sort": {"primary": null}})",
        R"({"version": 1, "courses": ["AE 2320", "AE 4310"], "sort": null})"}) {
        SCOPED_TRACE(request);
        json response = call(engine, request);
        response.erase("elapsedMs");
        EXPECT_EQ(response, expected);
    }
}

TEST(EngineApi, EveryPrimaryPutsTheBestOfAllSchedulesFirst) {
    const std::vector<TestCourse> courses{
        {"A", {{Friday, 480, 590}, {Monday | Thursday, 900, 975}, {Thursday, 750, 860}, {Monday | Thursday, 660, 735}}},
        {"B", {{Monday | Thursday, 660, 735}, {Thursday, 540, 650}, {Friday, 690, 800}, {Monday, 900, 1010}}},
        {"C", {{Monday | Wednesday | Friday, 1080, 1130}, {Monday | Thursday, 600, 675}, {Thursday, 990, 1100},
               {Wednesday, 510, 620}}},
        {"D", {{Monday | Thursday, 510, 585}, {Monday | Wednesday | Friday, 540, 590}, {Monday | Thursday, 990, 1065},
               {Wednesday, 540, 650}}},
    };
    const std::string text = termJson(courses);
    const Term term = parseTerm(text);
    const Engine engine = engineFor(text);

    std::vector<std::pair<Score, std::vector<std::size_t>>> valid;
    for (std::size_t n = 0; n < 256; ++n) {
        const std::vector<std::size_t> picks{n % 4, n / 4 % 4, n / 16 % 4, n / 64};
        WeekMask week;
        bool clash = false;
        for (std::size_t c = 0; c < picks.size(); ++c) {
            const WeekMask mask = maskOf(term.courses[c], term.courses[c].options[picks[c]]);
            clash = clash || mask.intersects(week);
            week |= mask;
        }
        if (!clash) valid.emplace_back(scoreOf(week), picks);
    }
    const auto order = [&](SortPrimary primary) {
        std::vector<RankKey> keys;
        for (const auto& [score, picks] : valid) keys.push_back(rankKey(score, primary, picks));
        std::sort(keys.begin(), keys.end());
        return keys;
    };
    const std::vector<RankKey> byTotal = order(SortPrimary::None);

    const std::vector<std::pair<std::string, SortPrimary>> primaries{
        {"null", SortPrimary::None},
        {R"("earlyMinutes")", SortPrimary::EarlyMinutes},
        {R"("firstStart")", SortPrimary::FirstStart},
        {R"("lastEnd")", SortPrimary::LastEnd},
        {R"("days")", SortPrimary::Days},
        {R"("freeMinutes")", SortPrimary::FreeMinutes},
    };
    for (const auto& [name, primary] : primaries) {
        SCOPED_TRACE(name);
        const json response = call(engine, R"({"version": 1, "courses": ["A", "B", "C", "D"],
            "sort": {"primary": )" + name + R"(}, "limits": {"maxSchedules": 5}})");
        ASSERT_EQ(response["ok"], true) << response.dump();
        EXPECT_EQ(response["total"], valid.size());
        ASSERT_EQ(response["schedules"].size(), 5u);

        const std::vector<RankKey> expected = order(primary);
        for (std::size_t s = 0; s < 5; ++s) {
            const std::vector<std::size_t>& picks = std::get<3>(expected[s]);
            for (std::size_t c = 0; c < courses.size(); ++c) {
                EXPECT_EQ(response["schedules"][s]["courses"][c]["sections"],
                          json::array({courses[c].first + "-" + std::to_string(picks[c])}));
            }
        }

        const auto best = std::find_if(valid.begin(), valid.end(),
            [&](const auto& entry) { return entry.second == std::get<3>(expected[0]); });
        ASSERT_NE(best, valid.end());
        const Score& score = best->first;
        EXPECT_EQ(response["schedules"][0]["score"], json({
            {"total", score.total}, {"earlyMinutes", score.earlyMinutes}, {"gapMinutes", score.gapMinutes},
            {"lateMinutes", score.lateMinutes}, {"days", score.days}, {"firstStart", score.firstStart},
            {"lastEnd", score.lastEnd}, {"averageStart", score.averageStart}, {"averageEnd", score.averageEnd},
            {"freeMinutes", score.freeMinutes}}));

        if (primary != SortPrimary::None) {
            const auto rank = std::find_if(byTotal.begin(), byTotal.end(),
                [&](const RankKey& key) { return std::get<3>(key) == std::get<3>(expected[0]); }) - byTotal.begin();
            EXPECT_GE(rank, 5);
        }
    }
}
