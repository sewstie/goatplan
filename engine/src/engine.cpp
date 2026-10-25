#include "goatplan/engine.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <exception>
#include <optional>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

#include <nlohmann/json.hpp>

#include "day_names.hpp"
#include "goatplan/diagnose.hpp"
#include "goatplan/filters.hpp"
#include "goatplan/json_io.hpp"
#include "goatplan/score.hpp"
#include "goatplan/solver.hpp"

namespace goatplan {
    namespace {
        using json = nlohmann::ordered_json;
        using Clock = std::chrono::steady_clock;

        constexpr int kVersion = 1;
        constexpr std::uint64_t kMaxSchedules = 500;
        constexpr std::uint64_t kMaxStepBudget = 50'000'000;
        constexpr int kMaxWeight = 10'000;
        constexpr int kMinutesPerDay = 1440;
        constexpr const char* kUnknownError =
            R"({"ok":false,"version":1,"error":{"code":"internal","message":"Unknown error","detail":null}})";

        struct RequestError {
            std::string code;
            std::string message;
            json detail;
        };

        struct Request {
            std::vector<std::string> courses;
            Preferences prefs;
            ScoreWeights weights;
            SortPrimary primary = SortPrimary::None;
            SolveLimits limits;
        };

        RequestError badRequest(const std::string& field, const std::string& problem) {
            return {"badRequest", field + " " + problem, field};
        }

        RequestError unknownCourse(const std::string& code, const Term& term) {
            return {"unknownCourse", "No course " + code + " in " + term.id, code};
        }

        json errorResponse(const std::string& code, const std::string& message, const json& detail) {
            return {
                {"ok", false},
                {"version", kVersion},
                {"error", {{"code", code}, {"message", message}, {"detail", detail}}},
            };
        }

        const json* find(const json& object, const char* key) {
            const auto found = object.find(key);
            return found == object.end() || found->is_null() ? nullptr : &*found;
        }

        const json& required(const json& object, const char* key, const std::string& field) {
            const json* value = find(object, key);
            if (value == nullptr) {
                throw badRequest(field, "is missing");
            }
            return *value;
        }

        const json& expectObject(const json& value, const std::string& field) {
            if (!value.is_object()) {
                throw badRequest(field, "must be an object");
            }
            return value;
        }

        const json& expectList(const json& value, const std::string& field) {
            if (!value.is_array()) {
                throw badRequest(field, "must be a list");
            }
            return value;
        }

        std::string expectText(const json& value, const std::string& field) {
            if (!value.is_string()) {
                throw badRequest(field, "must be a string");
            }
            return value.get<std::string>();
        }

        std::uint64_t expectCount(const json& value, const std::string& field) {
            if (!value.is_number_unsigned()) {
                throw badRequest(field, "must be a whole number, 0 or more");
            }
            return value.get<std::uint64_t>();
        }

        int expectUpTo(const json& value, const std::string& field, int high) {
            if (!value.is_number_unsigned() || value.get<std::uint64_t>() > static_cast<std::uint64_t>(high)) {
                throw badRequest(field, "must be a whole number from 0 to " + std::to_string(high));
            }
            return static_cast<int>(value.get<std::uint64_t>());
        }

        void readUpTo(const json& object, const char* key, const std::string& parent, int high, int& target) {
            if (const json* value = find(object, key)) {
                target = expectUpTo(*value, parent + "." + key, high);
            }
        }

        SortPrimary toPrimary(const json& value) {
            static const std::pair<const char*, SortPrimary> names[] = {
                {"earlyMinutes", SortPrimary::EarlyMinutes},
                {"firstStart", SortPrimary::FirstStart},
                {"lastEnd", SortPrimary::LastEnd},
                {"days", SortPrimary::Days},
                {"freeMinutes", SortPrimary::FreeMinutes},
            };
            if (value.is_string()) {
                for (const auto& [name, primary] : names) {
                    if (value.get<std::string>() == name) {
                        return primary;
                    }
                }
            }
            throw badRequest("sort.primary", "must be one of earlyMinutes, firstStart, lastEnd, days, freeMinutes");
        }

        std::string itemField(const std::string& list, std::size_t index) {
            return list + "[" + std::to_string(index) + "]";
        }

        void readBlocked(const json& blocked, WeekMask& mask) {
            expectList(blocked, "preferences.blocked");
            for (std::size_t i = 0; i < blocked.size(); ++i) {
                const std::string field = itemField("preferences.blocked", i);
                const json& range = expectObject(blocked[i], field);
                const std::string dayField = field + ".day";
                const std::optional<Day> day = dayFromName(expectText(required(range, "day", dayField), dayField));
                if (!day) {
                    throw badRequest(dayField, "must be one of Mon, Tue, Wed, Thu, Fri, Sat, Sun");
                }
                const int start = expectUpTo(required(range, "start", field + ".start"), field + ".start", kMinutesPerDay);
                const int end = expectUpTo(required(range, "end", field + ".end"), field + ".end", kMinutesPerDay);
                if (start >= end) {
                    throw badRequest(field, "has to end after it starts");
                }
                mask.addMeeting(Meeting{*day, start, end, ""});
            }
        }

        void readSectionRules(const json& rules, const Term& term, const std::string& parent,
                              std::unordered_map<std::string, std::vector<std::string>>& target) {
            expectObject(rules, parent);
            for (const auto& entry : rules.items()) {
                const std::string& code = entry.key();
                const Course* course = term.findCourse(code);
                if (course == nullptr) {
                    throw unknownCourse(code, term);
                }
                const std::string field = parent + "[\"" + code + "\"]";
                const json& ids = expectList(entry.value(), field);
                std::vector<std::string>& kept = target[code];
                for (std::size_t i = 0; i < ids.size(); ++i) {
                    std::string id = expectText(ids[i], itemField(field, i));
                    const bool belongs = std::any_of(course->sections.begin(), course->sections.end(),
                        [&](const Section& section) { return section.id == id; });
                    if (!belongs) {
                        throw RequestError{"unknownSection", "No section " + id + " in " + code, id};
                    }
                    kept.push_back(std::move(id));
                }
            }
        }

        Preferences toPreferences(const json& value, const Term& term) {
            expectObject(value, "preferences");
            Preferences prefs;
            readUpTo(value, "startsAfter", "preferences", kMinutesPerDay, prefs.startsAfter);
            if (const json* onlyOpen = find(value, "onlyOpen")) {
                if (!onlyOpen->is_boolean()) {
                    throw badRequest("preferences.onlyOpen", "must be true or false");
                }
                prefs.onlyOpen = onlyOpen->get<bool>();
            }
            if (const json* blocked = find(value, "blocked")) {
                readBlocked(*blocked, prefs.blocked);
            }
            if (const json* locked = find(value, "locked")) {
                readSectionRules(*locked, term, "preferences.locked", prefs.locked);
            }
            if (const json* anyOf = find(value, "anyOf")) {
                readSectionRules(*anyOf, term, "preferences.anyOf", prefs.anyOf);
            }
            return prefs;
        }

        Request parseRequest(std::string_view text, const Term& term) {
            json root;
            try {
                root = json::parse(text);
            } catch (const json::exception& error) {
                throw RequestError{"badRequest", std::string("The request isn't valid JSON: ") + error.what(), nullptr};
            }
            if (!root.is_object()) {
                throw RequestError{"badRequest", "The request must be a JSON object", nullptr};
            }
            const json version = required(root, "version", "version");
            if (!version.is_number_integer()) {
                throw badRequest("version", "must be a whole number");
            }
            if (version != kVersion) {
                throw RequestError{"unsupportedVersion",
                    "This engine understands version " + std::to_string(kVersion) + ", not " + version.dump(),
                    version.dump()};
            }

            Request request;
            const json courses = required(root, "courses", "courses");
            if (!courses.is_array() || courses.empty()) {
                throw badRequest("courses", "must be a list of at least one course code");
            }
            std::unordered_set<std::string> seen;
            for (std::size_t i = 0; i < courses.size(); ++i) {
                std::string code = expectText(courses[i], itemField("courses", i));
                if (term.findCourse(code) == nullptr) {
                    throw unknownCourse(code, term);
                }
                if (seen.insert(code).second) {
                    request.courses.push_back(std::move(code));
                }
            }
            if (const json* preferences = find(root, "preferences")) {
                request.prefs = toPreferences(*preferences, term);
            }
            if (const json* sort = find(root, "sort")) {
                expectObject(*sort, "sort");
                if (const json* primary = find(*sort, "primary")) {
                    request.primary = toPrimary(*primary);
                }
                readUpTo(*sort, "earlyCutoff", "sort", kMinutesPerDay, request.weights.earlyCutoff);
                readUpTo(*sort, "perEarlyMinute", "sort", kMaxWeight, request.weights.perEarlyMinute);
                readUpTo(*sort, "lateCutoff", "sort", kMinutesPerDay, request.weights.lateCutoff);
                readUpTo(*sort, "perLateMinute", "sort", kMaxWeight, request.weights.perLateMinute);
                readUpTo(*sort, "perGapMinute", "sort", kMaxWeight, request.weights.perGapMinute);
                readUpTo(*sort, "perDay", "sort", kMaxWeight, request.weights.perDay);
            }
            if (const json* limits = find(root, "limits")) {
                expectObject(*limits, "limits");
                if (const json* maxSchedules = find(*limits, "maxSchedules")) {
                    request.limits.maxSchedules = static_cast<std::size_t>(
                        std::min(expectCount(*maxSchedules, "limits.maxSchedules"), kMaxSchedules));
                }
                if (const json* stepBudget = find(*limits, "stepBudget")) {
                    request.limits.stepBudget = std::min(expectCount(*stepBudget, "limits.stepBudget"), kMaxStepBudget);
                }
            }
            return request;
        }

        json sectionIds(const CourseChoices& choice, std::size_t filtered) {
            json ids = json::array();
            for (std::size_t section : choice.course->options.at(choice.options.at(filtered))) {
                ids.push_back(choice.course->sections.at(section).id);
            }
            return ids;
        }

        json scheduleToJson(const Schedule& schedule, const std::vector<CourseChoices>& choices) {
            json courses = json::array();
            for (std::size_t c = 0; c < choices.size(); ++c) {
                const CourseChoices& choice = choices[c];
                const std::size_t shown = schedule.picks.at(c);
                json alternatives = json::array();
                for (std::size_t option : schedule.alternatives.at(c)) {
                    alternatives.push_back(sectionIds(choice, option));
                }
                const int seats = choice.openSeats.at(shown);
                courses.push_back({
                    {"code", choice.course->code},
                    {"sections", sectionIds(choice, shown)},
                    {"openSeats", seats < 0 ? json(nullptr) : json(seats)},
                    {"alternatives", std::move(alternatives)},
                });
            }
            const Score& score = schedule.score;
            return {
                {"score", {
                    {"total", score.total},
                    {"earlyMinutes", score.earlyMinutes},
                    {"gapMinutes", score.gapMinutes},
                    {"lateMinutes", score.lateMinutes},
                    {"days", score.days},
                    {"firstStart", score.firstStart},
                    {"lastEnd", score.lastEnd},
                    {"averageStart", score.averageStart},
                    {"averageEnd", score.averageEnd},
                    {"freeMinutes", score.freeMinutes},
                }},
                {"courses", std::move(courses)},
            };
        }

        const char* fixKindName(FixKind kind) {
            switch (kind) {
                case FixKind::RelaxStartsAfter: return "relaxStartsAfter";
                case FixKind::ClearBlocked: return "clearBlocked";
                case FixKind::AllowFull: return "allowFull";
                case FixKind::Unlock: return "unlock";
                case FixKind::ClearAnyOf: return "clearAnyOf";
                case FixKind::DropCourse: return "dropCourse";
            }
            return "";
        }

        json diagnosisToJson(const Diagnosis& diagnosis, const std::vector<std::string>& codes) {
            json emptyCourses = json::array();
            for (const EmptyCourse& empty : diagnosis.emptyCourses) {
                const auto removed = [&](FilterReason reason) {
                    return empty.removed[static_cast<std::size_t>(reason)];
                };
                emptyCourses.push_back({
                    {"code", codes.at(empty.course)},
                    {"optionsInData", empty.optionsInData},
                    {"removed", {
                        {"notLocked", removed(FilterReason::NotLocked)},
                        {"notAnyOf", removed(FilterReason::NotAnyOf)},
                        {"notOpen", removed(FilterReason::NotOpen)},
                        {"startsTooEarly", removed(FilterReason::StartsTooEarly)},
                        {"blocked", removed(FilterReason::Blocked)},
                    }},
                    {"latestStartsAfter", empty.latestStartsAfter < 0 ? json(nullptr) : json(empty.latestStartsAfter)},
                });
            }
            json clashingPairs = json::array();
            for (const auto& [a, b] : diagnosis.clashingPairs) {
                clashingPairs.push_back(json::array({codes.at(a), codes.at(b)}));
            }
            json minimalClash = json::array();
            for (std::size_t course : diagnosis.minimalClash) {
                minimalClash.push_back(codes.at(course));
            }
            json fixes = json::array();
            for (const Fix& fix : diagnosis.fixes) {
                json item = {{"kind", fixKindName(fix.kind)}};
                if (fix.kind == FixKind::RelaxStartsAfter) {
                    item["startsAfter"] = std::max(fix.startsAfter, 0);
                }
                if (fix.kind == FixKind::Unlock || fix.kind == FixKind::ClearAnyOf ||
                    fix.kind == FixKind::DropCourse) {
                    item["course"] = codes.at(fix.course);
                }
                item["schedules"] = fix.schedules;
                item["capped"] = fix.capped;
                fixes.push_back(std::move(item));
            }
            return {
                {"unsure", diagnosis.unsure},
                {"emptyCourses", std::move(emptyCourses)},
                {"clashingPairs", std::move(clashingPairs)},
                {"minimalClash", std::move(minimalClash)},
                {"fixes", std::move(fixes)},
            };
        }

        json respond(const Term& term, std::string_view text) {
            const Request request = parseRequest(text, term);
            const auto start = Clock::now();
            const std::vector<CourseChoices> choices = filterOptions(term, request.courses, request.prefs);
            const SolveResult result = solve(choices, request.limits, request.weights, request.primary);
            std::optional<Diagnosis> diagnosis;
            if (result.total == 0) {
                diagnosis = diagnose(term, request.courses, request.prefs, request.limits);
            }
            const double elapsedMs = std::chrono::duration<double, std::milli>(Clock::now() - start).count();

            json schedules = json::array();
            for (const Schedule& schedule : result.schedules) {
                schedules.push_back(scheduleToJson(schedule, choices));
            }
            return {
                {"ok", true},
                {"version", kVersion},
                {"termId", term.id},
                {"total", result.total},
                {"patterns", result.patterns},
                {"capped", result.capped},
                {"steps", result.steps},
                {"elapsedMs", std::round(elapsedMs * 1000.0) / 1000.0},
                {"schedules", std::move(schedules)},
                {"diagnosis", diagnosis ? diagnosisToJson(*diagnosis, request.courses) : json(nullptr)},
            };
        }

        std::string dump(const json& response) {
            return response.dump(-1, ' ', false, json::error_handler_t::replace);
        }
    }

    void Engine::loadTerm(std::string_view termJson) {
        term_ = parseTerm(termJson);
    }

    std::string Engine::loadTermJson(std::string_view termJson) {
        try {
            try {
                loadTerm(termJson);
                return dump({
                    {"ok", true},
                    {"version", kVersion},
                    {"termId", term_->id},
                    {"courses", term_->courses.size()},
                });
            } catch (const TermLoadError& error) {
                return dump(errorResponse("badTerm", std::string("The term file isn't usable: ") + error.what(), nullptr));
            } catch (const std::exception& error) {
                return dump(errorResponse("internal", error.what(), nullptr));
            }
        } catch (...) {
            return kUnknownError;
        }
    }

    std::string Engine::handle(std::string_view requestJson) const {
        try {
            try {
                if (!term_) {
                    throw RequestError{"noTerm", "No term is loaded yet", nullptr};
                }
                return dump(respond(*term_, requestJson));
            } catch (const RequestError& error) {
                return dump(errorResponse(error.code, error.message, error.detail));
            } catch (const std::exception& error) {
                return dump(errorResponse("internal", error.what(), nullptr));
            }
        } catch (...) {
            return kUnknownError;
        }
    }
}
