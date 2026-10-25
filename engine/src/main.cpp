#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <exception>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include <nlohmann/json.hpp>

#include "goatplan/engine.hpp"

namespace {
    using json = nlohmann::json;

    const char* kUsage =
        "Usage: goatplan_cli <term.json> <request.json | -> [--text]\n"
        "  -       read the request from stdin\n"
        "  --text  print the response as readable text instead of JSON\n";

    bool readFile(const std::string& path, std::string& text) {
        std::ifstream file(path);
        if (!file) {
            return false;
        }
        std::ostringstream content;
        content << file.rdbuf();
        text = content.str();
        return true;
    }

    std::string clockTime(int minutes) {
        const int hour = minutes / 60;
        std::ostringstream text;
        text << (hour % 12 == 0 ? 12 : hour % 12) << ':' << std::setw(2) << std::setfill('0')
             << minutes % 60 << (hour < 12 ? " AM" : " PM");
        return text.str();
    }

    std::string joined(const std::vector<std::string>& parts, const std::string& last) {
        std::string text;
        for (std::size_t i = 0; i < parts.size(); ++i) {
            if (i > 0) text += i + 1 == parts.size() ? last : ", ";
            text += parts[i];
        }
        return text;
    }

    std::string plural(std::uint64_t n, const std::string& one, const std::string& many) {
        return std::to_string(n) + ' ' + (n == 1 ? one : many);
    }

    std::string sectionList(const json& ids, const std::string& code) {
        std::string text;
        for (const json& id : ids) {
            std::string name = id.get<std::string>();
            if (name.rfind(code + "-", 0) == 0) name.erase(0, code.size() + 1);
            if (!text.empty()) text += " + ";
            text += name;
        }
        return text;
    }

    void printSchedules(const json& schedules) {
        const std::size_t shown = std::min<std::size_t>(3, schedules.size());
        for (std::size_t s = 0; s < shown; ++s) {
            const json& score = schedules[s]["score"];
            std::cout << "Schedule " << s + 1 << ": score " << score["total"]
                      << " (early " << score["earlyMinutes"] << ", gaps " << score["gapMinutes"]
                      << ", late " << score["lateMinutes"]
                      << ", days " << score["days"] << ")\n";
            for (const json& course : schedules[s]["courses"]) {
                const std::string code = course["code"];
                std::cout << "  " << code << ": " << sectionList(course["sections"], code);
                const std::size_t sameTime = course["alternatives"].size() - 1;
                if (sameTime > 0) std::cout << " (+" << sameTime << " same time)";
                std::cout << '\n';
            }
        }
        if (schedules.size() > shown) {
            std::cout << "...and " << schedules.size() - shown << " more in the JSON\n";
        }
    }

    std::string fixText(const json& fix) {
        const std::string kind = fix["kind"];
        if (kind == "relaxStartsAfter") {
            const int startsAfter = fix["startsAfter"];
            return startsAfter == 0 ? "turn off starts-after" : "start after " + clockTime(startsAfter) + " instead";
        }
        if (kind == "clearBlocked") return "clear your blocked times";
        if (kind == "allowFull") return "allow full sections";
        if (kind == "unlock") return "unlock your " + fix["course"].get<std::string>() + " sections";
        if (kind == "dropCourse") return "drop " + fix["course"].get<std::string>();
        return kind;
    }

    void printDiagnosis(const json& diagnosis, int startsAfter) {
        if (diagnosis["unsure"].get<bool>()) {
            std::cout << "Too many combinations to check, try fewer courses.\n";
            return;
        }
        for (const json& empty : diagnosis["emptyCourses"]) {
            std::cout << empty["code"].get<std::string>() << ": ";
            if (empty["optionsInData"] == 0) {
                std::cout << "no options in the data (it may have no set meeting times)\n";
                continue;
            }
            const json& removed = empty["removed"];
            std::vector<std::string> reasons;
            if (int n = removed["notLocked"])
                reasons.push_back(plural(n, "doesn't include your locked sections", "don't include your locked sections"));
            if (int n = removed["notOpen"])
                reasons.push_back(plural(n, "is full", "are full"));
            if (int n = removed["startsTooEarly"]) {
                const std::string before = "before " + clockTime(startsAfter);
                reasons.push_back(plural(n, "starts " + before, "start " + before));
            }
            if (int n = removed["blocked"])
                reasons.push_back(plural(n, "hits your blocked times", "hit your blocked times"));
            std::cout << "no options left (" << joined(reasons, ", ") << ")\n";
        }
        for (const json& pair : diagnosis["clashingPairs"]) {
            std::cout << pair[0].get<std::string>() << " and " << pair[1].get<std::string>()
                      << " never fit together\n";
        }
        if (!diagnosis["minimalClash"].empty()) {
            std::cout << joined(diagnosis["minimalClash"].get<std::vector<std::string>>(), " and ")
                      << " can't all fit together, though any two of them can\n";
        }
        for (const json& fix : diagnosis["fixes"]) {
            std::cout << "Try: " << fixText(fix) << " → " << (fix["capped"].get<bool>() ? "at least " : "")
                      << plural(fix["schedules"], "schedule", "schedules") << '\n';
        }
        if (diagnosis["fixes"].empty()) std::cout << "None of the usual fixes help here.\n";
    }

    void printText(const json& response, const json& request) {
        if (!response["ok"].get<bool>()) {
            const json& error = response["error"];
            std::cout << "Error (" << error["code"].get<std::string>() << "): "
                      << error["message"].get<std::string>() << '\n';
            return;
        }
        std::cout << response["termId"].get<std::string>() << ": "
                  << plural(response["total"], "schedule", "schedules") << " in "
                  << plural(response["patterns"], "time pattern", "time patterns") << " ("
                  << response["steps"] << " steps, " << std::fixed << std::setprecision(3)
                  << response["elapsedMs"].get<double>() << " ms)\n";
        if (response["capped"].get<bool>()) {
            std::cout << "The step budget ran out, so these counts are a lower bound.\n";
        }
        printSchedules(response["schedules"]);
        if (!response["diagnosis"].is_null()) {
            const json::json_pointer path("/preferences/startsAfter");
            const int startsAfter = request.contains(path) && request[path].is_number_integer()
                ? request[path].get<int>() : 0;
            printDiagnosis(response["diagnosis"], startsAfter);
        }
    }
}

int main(int argc, char** argv) {
    std::vector<std::string> args(argv + 1, argv + argc);
    const auto textFlag = std::find(args.begin(), args.end(), "--text");
    const bool asText = textFlag != args.end();
    if (asText) args.erase(textFlag);
    if (args.size() != 2) {
        std::cerr << kUsage;
        return 1;
    }

    try {
        std::string termText;
        if (!readFile(args[0], termText)) {
            std::cerr << "goatplan_cli: can't open " << args[0] << '\n';
            return 1;
        }
        goatplan::Engine engine;
        engine.loadTerm(termText);

        std::string requestText;
        if (args[1] == "-") {
            std::ostringstream content;
            content << std::cin.rdbuf();
            requestText = content.str();
        } else if (!readFile(args[1], requestText)) {
            std::cerr << "goatplan_cli: can't open " << args[1] << '\n';
            return 1;
        }

        const std::string response = engine.handle(requestText);
        const json parsed = json::parse(response);
        if (asText) {
            printText(parsed, json::parse(requestText, nullptr, false));
        } else {
            std::cout << response << '\n';
        }
        return parsed["ok"].get<bool>() ? 0 : 1;
    } catch (const std::exception& error) {
        std::cerr << "goatplan_cli: " << error.what() << '\n';
        return 1;
    }
}
