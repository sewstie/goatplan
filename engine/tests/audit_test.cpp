#include <gtest/gtest.h>

#include <algorithm>
#include <chrono>
#include <cstddef>
#include <fstream>
#include <iostream>
#include <map>
#include <random>
#include <set>
#include <string>
#include <utility>
#include <vector>

#include <nlohmann/json.hpp>

#include "goatplan/engine.hpp"

using goatplan::Engine;
using json = nlohmann::json;

namespace {

json cases() {
    std::ifstream input(GOATPLAN_AUDIT_CASES);
    return json::parse(input);
}

}

TEST(Audit, SharedContractCasesWithoutLoadedTerm) {
    const Engine engine;
    EXPECT_FALSE(engine.hasTerm());
    for (const auto& item : cases()) {
        SCOPED_TRACE(item.at("name").get<std::string>());
        std::string text;
        ASSERT_NO_THROW(text = engine.handle(item.at("request").dump()));
        const auto response = json::parse(text);
        EXPECT_EQ(response.at("version"), 1);
        if (item.contains("error")) {
            ASSERT_EQ(response.at("ok"), false) << text;
            EXPECT_EQ(response.at("error").at("code"), item.at("error").at("code"));
            EXPECT_EQ(response.at("error").at("detail"), item.at("error").at("detail"));
            continue;
        }
        ASSERT_EQ(response.at("ok"), true) << text;
        EXPECT_EQ(response.at("sections").size(), 8u);
        std::set<std::string> assigned;
        std::size_t lineCount = 0;
        for (const auto& section : response.at("sections")) {
            lineCount += section.at("lines").size();
            int done = 0;
            int planned = 0;
            for (const auto& line : section.at("lines")) {
                if (line.contains("subSlots")) {
                    for (const auto& slot : line.at("subSlots")) {
                        if (slot.at("state") == "done") ++done;
                        if (slot.at("state") == "planned") ++planned;
                        if (!slot.at("course").is_null()) {
                            EXPECT_TRUE(assigned.insert(slot.at("course").get<std::string>()).second);
                        }
                    }
                } else {
                    if (line.at("state") == "done") ++done;
                    if (line.at("state") == "planned") ++planned;
                }
                if (!line.at("course").is_null()) {
                    EXPECT_NE(line.at("state"), "empty");
                    if (section.at("name") != "Free Electives") {
                        EXPECT_TRUE(assigned.insert(line.at("course").get<std::string>()).second);
                    }
                }
                for (const auto& expected : item.value("lines", json::array())) {
                    if (expected.at("id") == line.at("id")) {
                        EXPECT_EQ(line.at("course"), expected.at("course"));
                        EXPECT_EQ(line.at("state"), expected.at("state"));
                        if (expected.contains("subSlots")) EXPECT_EQ(line.at("subSlots"), expected.at("subSlots"));
                    }
                }
            }
            EXPECT_EQ(section.at("done"), done);
            EXPECT_EQ(section.at("planned"), planned);
            const auto name = section.at("name").get<std::string>();
            if (item.at("sections").contains(name)) {
                const auto& expected = item.at("sections").at(name);
                EXPECT_EQ(section.at("done"), expected.at("done"));
                EXPECT_EQ(section.at("planned"), expected.at("planned"));
                EXPECT_EQ(section.at("total"), expected.at("total"));
            }
        }
        EXPECT_EQ(lineCount, 45u);
        EXPECT_TRUE(response.at("checks").is_array());
        const auto& pool = response.at("freeElectives");
        if (item.contains("freeElectives")) EXPECT_EQ(pool, item.at("freeElectives"));
        if (item.contains("extra")) EXPECT_EQ(response.at("extra"), item.at("extra"));
        EXPECT_LE(pool.at("creditsDone").get<double>() + pool.at("creditsPlanned").get<double>(),
                  pool.at("creditsTotal").get<double>());
        for (const auto& course : pool.at("courses")) {
            EXPECT_EQ(assigned.count(course.get<std::string>()), 0u) << course;
        }
        EXPECT_TRUE(response.at("candidateResults").is_array());
        if (item.contains("candidateResults")) EXPECT_EQ(response.at("candidateResults"), item.at("candidateResults"));
        for (const auto& expected : item.value("checks", json::array())) {
            const auto& checks = response.at("checks");
            const auto check = std::find_if(checks.begin(), checks.end(), [&](const json& entry) { return entry.at("id") == expected.at("id"); });
            ASSERT_NE(check, checks.end()) << expected;
            EXPECT_EQ(check->at("state"), expected.at("state")) << expected.at("id");
            if (expected.contains("courses")) EXPECT_EQ(check->at("courses"), expected.at("courses")) << expected.at("id");
        }
    }
}

TEST(Audit, HandWrittenHistoriesMatchTheirExpectedAnswersExactly) {
    const Engine engine;
    const std::map<std::string, std::string> sectionNames = {
        {"hua", "Humanities and Arts"},
        {"wpe", "Wellness and Physical Education"},
        {"social-science", "Social Science"},
        {"iqp", "Interactive Qualifying Project"},
        {"free-electives", "Free Electives"},
        {"cs", "Computer Science"},
        {"math", "Mathematics"},
        {"science", "Basic Science and/or Engineering Science"},
    };
    const auto word = [](const json& state) -> json {
        if (state == "missing") return "empty";
        if (state == "check-yourself") return "check";
        return state;
    };
    for (const std::string name : {"degree-history-mid.json", "degree-history-complete.json"}) {
        SCOPED_TRACE(name);
        std::ifstream input(std::string(GOATPLAN_FIXTURES) + "/" + name);
        const auto history = json::parse(input);
        const auto list = [](const json& entries) {
            json result = json::array();
            for (const auto& entry : entries) {
                json course = {{"code", entry.at("code")}, {"credits", entry.at("credits")}};
                if (entry.contains("apIb")) course["apIb"] = entry.at("apIb");
                result.push_back(course);
            }
            return result;
        };
        const json request = {{"version", 1}, {"requirements", "cs-2030"}, {"taken", list(history.at("takenCourses"))},
                              {"planned", list(history.at("plannedCourses"))}, {"manual", history.at("confirmedManualItems")}};
        const auto response = json::parse(engine.handle(request.dump()));
        ASSERT_EQ(response.at("ok"), true) << response;

        std::size_t linesSeen = 0;
        for (const auto& section : response.at("sections")) {
            for (const auto& line : section.at("lines")) {
                ++linesSeen;
                const auto id = std::to_string(line.at("id").get<int>());
                SCOPED_TRACE("line " + id);
                const auto& expected = history.at("expectedLines").at(id);
                EXPECT_EQ(line.at("state"), word(expected.at("state")));
                if (expected.contains("course")) EXPECT_EQ(line.at("course"), expected.at("course"));
                if (expected.contains("subSlots")) {
                    ASSERT_EQ(line.at("subSlots").size(), expected.at("subSlots").size());
                    for (std::size_t i = 0; i < expected.at("subSlots").size(); ++i) {
                        EXPECT_EQ(line.at("subSlots")[i].at("course"), expected.at("subSlots")[i].at("course"));
                        EXPECT_EQ(line.at("subSlots")[i].at("state"), word(expected.at("subSlots")[i].at("state")));
                    }
                }
            }
        }
        EXPECT_EQ(linesSeen, history.at("expectedLines").size());

        for (const auto& [id, expected] : history.at("expectedSections").items()) {
            SCOPED_TRACE(id);
            const auto& sections = response.at("sections");
            const auto section = std::find_if(sections.begin(), sections.end(), [&](const json& entry) { return entry.at("name") == sectionNames.at(id); });
            ASSERT_NE(section, sections.end());
            EXPECT_EQ(section->at("done"), expected.at("done"));
            EXPECT_EQ(section->at("planned"), expected.at("planned"));
            EXPECT_EQ(section->at("total"), expected.at("total"));
        }

        EXPECT_EQ(response.at("checks").size(), history.at("expectedChecks").size());
        for (const auto& check : response.at("checks")) {
            const auto id = check.at("id").get<std::string>();
            SCOPED_TRACE(id);
            const auto& expected = history.at("expectedChecks").at(id);
            EXPECT_EQ(check.at("state"), word(expected.at("state")));
            if (expected.contains("courses")) EXPECT_EQ(check.at("courses"), expected.at("courses"));
        }

        json poolCodes = json::array();
        double poolCredits = 0;
        for (const auto& course : history.at("expectedFreeElectivePool").at("courses")) {
            poolCodes.push_back(course.at("code"));
            poolCredits += course.at("credits").get<double>();
        }
        EXPECT_DOUBLE_EQ(poolCredits, history.at("expectedFreeElectivePool").at("totalCredits").get<double>());
        const auto& pool = response.at("freeElectives");
        EXPECT_EQ(pool.at("courses"), poolCodes);
        EXPECT_DOUBLE_EQ(pool.at("creditsDone").get<double>() + pool.at("creditsPlanned").get<double>(), poolCredits);

        json extraCodes = json::array();
        for (const auto& course : history.at("expectedExtra")) extraCodes.push_back(course.at("code"));
        EXPECT_EQ(response.at("extra"), extraCodes);
    }
}

TEST(Audit, CandidatesLeaveTheRestOfTheResponseAlone) {
    const Engine engine;
    for (const auto& item : cases()) {
        if (item.contains("error") || !item.at("request").contains("candidates")) continue;
        SCOPED_TRACE(item.at("name").get<std::string>());
        auto request = item.at("request");
        const auto with = json::parse(engine.handle(request.dump()));
        request.erase("candidates");
        const auto without = json::parse(engine.handle(request.dump()));
        for (const char* key : {"sections", "checks", "freeElectives", "extra"}) EXPECT_EQ(with.at(key), without.at(key)) << key;
    }
}

TEST(Audit, CandidatesAreReportedInTheOrderTheyWereSent) {
    const Engine engine;
    const json request = {{"version", 1}, {"requirements", "cs-2030"},
                          {"candidates", {{{"code", "PH 1110"}, {"credits", 3}}, {{"code", "CS 3013"}, {"credits", 3}}, {{"code", "PH 1110"}, {"credits", 3}}}}};
    const auto results = json::parse(engine.handle(request.dump())).at("candidateResults");
    ASSERT_EQ(results.size(), 3u);
    EXPECT_EQ(results[0].at("code"), "PH 1110");
    EXPECT_EQ(results[1].at("code"), "CS 3013");
    EXPECT_EQ(results[2], results[0]);
}

TEST(Audit, AboutFiveHundredEightyCandidatesRunUnnoticed) {
    const Engine engine;
    const auto subjects = {"CS", "MA", "PH", "CH", "BB", "GE", "EN", "HI", "PY", "SP", "GOV", "PSY", "ECE", "ME", "RBE", "BME", "AE", "ID", "BUS", "DS"};
    json candidates = json::array();
    for (int number = 1000; candidates.size() < 580; number += 7) {
        for (const auto* subject : subjects) {
            if (candidates.size() == 580) break;
            candidates.push_back({{"code", std::string(subject) + " " + std::to_string(number)}, {"credits", 3}});
        }
    }
    std::ifstream input(std::string(GOATPLAN_FIXTURES) + "/degree-history-mid.json");
    const auto history = json::parse(input);
    json taken = json::array();
    for (const auto& entry : history.at("takenCourses")) taken.push_back({{"code", entry.at("code")}, {"credits", entry.at("credits")}});
    json planned = json::array();
    for (const auto& entry : history.at("plannedCourses")) planned.push_back({{"code", entry.at("code")}, {"credits", entry.at("credits")}});
    const json midRequest = {{"version", 1}, {"requirements", "cs-2030"}, {"taken", taken}, {"planned", planned}, {"candidates", candidates}};

    std::ifstream fullInput(std::string(GOATPLAN_FIXTURES) + "/degree-history-complete.json");
    const auto full = json::parse(fullInput);
    json fullTaken = json::array();
    for (const auto& entry : full.at("takenCourses")) fullTaken.push_back({{"code", entry.at("code")}, {"credits", entry.at("credits")}});
    const json fullRequest = {{"version", 1}, {"requirements", "cs-2030"}, {"taken", fullTaken}, {"manual", full.at("confirmedManualItems")}, {"candidates", candidates}};

    for (const auto& [name, request] : {std::pair<std::string, json>{"mid-degree", midRequest}, {"full-degree", fullRequest}}) {
        const auto text = request.dump();
        auto best = std::chrono::steady_clock::duration::max();
        std::string response;
        for (int run = 0; run < 5; ++run) {
            const auto start = std::chrono::steady_clock::now();
            response = engine.handle(text);
            best = std::min(best, std::chrono::steady_clock::now() - start);
        }
        const auto ms = std::chrono::duration<double, std::milli>(best).count();
        std::cout << "[ timing   ] " << name << ": 580 candidates in " << ms << " ms\n";
        RecordProperty(name + "Ms", static_cast<int>(ms));
        EXPECT_EQ(json::parse(response).at("candidateResults").size(), 580u);
        EXPECT_LT(ms, 100.0);
    }
}

TEST(Audit, ShuffledInputGivesTheSameBytes) {
    const Engine engine;
    std::mt19937 random(2030);
    for (const auto& item : cases()) {
        if (item.contains("error")) continue;
        SCOPED_TRACE(item.at("name").get<std::string>());
        const auto expected = engine.handle(item.at("request").dump());
        for (int i = 0; i < 20; ++i) {
            auto request = item.at("request");
            for (const char* key : {"taken", "planned", "manual"}) {
                if (request.contains(key) && request.at(key).is_array()) {
                    std::shuffle(request.at(key).begin(), request.at(key).end(), random);
                }
            }
            EXPECT_EQ(engine.handle(request.dump()), expected);
        }
    }
}

TEST(Audit, RandomHistoriesKeepTakenCoursesAndSetLimits) {
    const Engine engine;
    std::vector<std::string> codes = {"CS 1101", "CS 1102", "CS 2022", "MA 2201", "CS 2102", "CS 2103", "CS 210X",
                                      "CS 2301", "CS 2303", "CS 3043", "SS 3043", "CS 4513", "CS 4516", "CS 502",
                                      "MA 1021", "MA 1022", "MA 1023", "MA 1024", "MA 1800", "MA 2071", "MA 2611",
                                      "MA 2621", "ECON 1110", "GOV 1100", "PSY 1400", "WPE 1008", "WPE 1009",
                                      "WPE 1012", "WPE 1018", "WPE 1019"};
    for (int number = 2001; number <= 2012; ++number) codes.push_back("CS " + std::to_string(number));
    const auto courseList = [](auto begin, auto end) {
        json list = json::array();
        for (auto it = begin; it != end; ++it) {
            list.push_back({{"code", *it}, {"credits", it->rfind("WPE", 0) == 0 ? 0.75 : 3}});
        }
        return list;
    };
    const auto oneCode = [](const std::string& code) -> std::string {
        if (code == "MA 2201") return "CS 2022";
        if (code == "SS 3043") return "CS 3043";
        return code;
    };
    const auto seatedAndPooled = [&](const json& response, std::set<std::string>& seated, std::set<std::string>& pooled) {
        for (const auto& section : response.at("sections")) {
            if (section.at("name") == "Free Electives") continue;
            for (const auto& line : section.at("lines")) {
                if (line.at("state") == "done" && !line.at("course").is_null()) seated.insert(oneCode(line.at("course")));
                for (const auto& slot : line.value("subSlots", json::array())) {
                    if (slot.at("state") == "done" && !slot.at("course").is_null()) seated.insert(oneCode(slot.at("course")));
                }
            }
        }
        for (const auto& course : response.at("freeElectives").at("courses")) pooled.insert(oneCode(course));
    };
    std::mt19937 random(2030);
    for (int trial = 0; trial < 300; ++trial) {
        std::shuffle(codes.begin(), codes.end(), random);
        const auto takenCount = static_cast<std::ptrdiff_t>(random() % codes.size());
        const auto split = codes.begin() + takenCount;
        const json takenOnly = {{"version", 1}, {"requirements", "cs-2030"}, {"taken", courseList(codes.begin(), split)}};
        auto both = takenOnly;
        both["planned"] = courseList(split, codes.end());
        std::set<std::string> seatedBefore;
        std::set<std::string> pooledBefore;
        std::set<std::string> seatedAfter;
        std::set<std::string> pooledAfter;
        seatedAndPooled(json::parse(engine.handle(takenOnly.dump())), seatedBefore, pooledBefore);
        const auto response = json::parse(engine.handle(both.dump()));
        seatedAndPooled(response, seatedAfter, pooledAfter);
        for (const auto& code : seatedBefore) EXPECT_EQ(seatedAfter.count(code), 1u) << code << " in " << both;
        for (const auto& code : pooledBefore) {
            EXPECT_EQ(seatedAfter.count(code) + pooledAfter.count(code), 1u) << code << " in " << both;
        }
        for (const auto& set : {std::vector<std::string>{"CS 1101", "CS 1102"}, {"CS 2301", "CS 2303"},
                                {"CS 2102", "CS 2103", "CS 210X"}}) {
            int filling = 0;
            for (const auto& section : response.at("sections")) {
                if (section.at("name") != "Computer Science") continue;
                for (const auto& line : section.at("lines")) {
                    if (line.at("course").is_string() &&
                        std::find(set.begin(), set.end(), line.at("course").get<std::string>()) != set.end()) {
                        ++filling;
                    }
                }
            }
            EXPECT_LE(filling, 1) << both;
        }
    }
}

TEST(Audit, ResponsesRepeatByteForByte) {
    const Engine engine;
    for (const auto& item : cases()) {
        const auto request = item.at("request").dump();
        const auto expected = engine.handle(request);
        for (int i = 0; i < 10; ++i) EXPECT_EQ(engine.handle(request), expected);
    }
}

TEST(Audit, MalformedRequestsNeverThrow) {
    const Engine engine;
    for (const std::string text : {"{", "null", "[]", R"({"requirements":"cs-2030"})"}) {
        std::string response;
        ASSERT_NO_THROW(response = engine.handle(text));
        EXPECT_EQ(json::parse(response).at("ok"), false);
    }
    EXPECT_EQ(json::parse(engine.handle(R"({"version":1,"courses":["CS 2102"]})"))
                  .at("error").at("code"), "noTerm");
}
