#include "goatplan/audit.hpp"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <string>
#include <string_view>
#include <unordered_map>
#include <utility>
#include <vector>

#include <nlohmann/json.hpp>

#include "audit_requirements.hpp"

namespace goatplan {
namespace {

using json = nlohmann::ordered_json;

constexpr double kMinimumCredits = 0.75;
constexpr double kLineCredits = 3;
constexpr double kCreditTolerance = 1e-9;
constexpr int kNone = -1;
constexpr int kFirstTier = 0;
constexpr int kSecondTier = 1;
constexpr int kLastTier = 2;

struct AuditError {
    std::string code;
    std::string message;
    json detail;
};

AuditError badRequest(const std::string& field, const std::string& problem) {
    return {"badRequest", field + " " + problem, field};
}

const json* find(const json& object, const char* key) {
    const auto it = object.find(key);
    return it == object.end() || it->is_null() ? nullptr : &*it;
}

bool contains(const json& values, const std::string& text) {
    return std::any_of(values.begin(), values.end(), [&](const auto& value) {
        return value.template get_ref<const std::string&>() == text;
    });
}

int indexOf(const std::vector<std::string>& values, const std::string& text) {
    const auto it = std::find(values.begin(), values.end(), text);
    return it == values.end() ? kNone : static_cast<int>(it - values.begin());
}

int filterWidth(const json& filter, const json& requirements) {
    const auto type = filter.at("type").get<std::string>();
    if (type == "courses") return 0;
    if (type == "cs4000plus") return 1;
    if (type == "subjectMinLevel") return 6000 - filter.at("minLevel").get<int>();
    if (type == "csIntro") return 6001 - filter.at("minLevel").get<int>();
    if (type == "huaSubjects") return static_cast<int>(requirements.at("huaSubjects").size()) + 2;
    return filter.contains("subjects") ? static_cast<int>(filter.at("subjects").size()) + 2 : 0;
}

struct LineRule {
    const json* filter;
    int id;
    std::string section;
    std::size_t subSlots;
    int area;
    bool pool;
};

struct Rules {
    json document;
    std::vector<LineRule> lines;
    std::vector<std::size_t> narrowestFirst;
    std::vector<std::vector<std::size_t>> sameFilter;
    std::vector<std::string> areaIds;
    std::vector<std::string> disciplines;
    std::vector<std::string> groupingNames;
    std::vector<const json*> groupings;
    std::size_t depthCourses = 0;
    std::size_t scienceListed = 0;
    std::size_t scienceFromOne = 0;
    std::size_t apIbLimit = 0;
    int mathCeiling = 0;

    Rules() : document(json::parse(kAuditRequirements)) {
        for (const auto& check : document.at("checks")) {
            const auto type = check.at("type").get<std::string>();
            if (type == "area") areaIds.push_back(check.at("id").get<std::string>());
            if (type == "scienceDepth") {
                disciplines = check.at("disciplines").get<std::vector<std::string>>();
                scienceListed = check.at("requiredFromBBCHGEPH").get<std::size_t>();
                scienceFromOne = check.at("requiredFromOneDiscipline").get<std::size_t>();
            }
            if (type == "huaDepth") depthCourses = check.at("minCourses").get<std::size_t>();
            if (type == "apIbLimit") apIbLimit = check.at("maxApIb").get<std::size_t>();
            if (type == "mathLevelLimit") mathCeiling = check.at("levelCeiling").get<int>();
            if (type == "huaBreadth") {
                for (const auto& [name, subjects] : check.at("groupings").items()) {
                    groupingNames.push_back(name);
                    groupings.push_back(&subjects);
                }
            }
        }
        for (const auto& line : document.at("lines")) {
            const auto section = line.at("section").get<std::string>();
            const auto& sections = document.at("sections");
            const auto owner = std::find_if(sections.begin(), sections.end(), [&](const auto& item) { return item.at("id") == section; });
            lines.push_back({&line.at("filter"), line.at("line").get<int>(), section,
                             line.value("subSlots", std::size_t{0}),
                             line.contains("areaTag") ? indexOf(areaIds, line.at("areaTag").get<std::string>()) : kNone,
                             owner->contains("creditPool")});
        }
        for (std::size_t i = 0; i < lines.size(); ++i) narrowestFirst.push_back(i);
        std::stable_sort(narrowestFirst.begin(), narrowestFirst.end(), [&](std::size_t a, std::size_t b) {
            return filterWidth(*lines[a].filter, document) < filterWidth(*lines[b].filter, document);
        });
        for (std::size_t i = 0; i < lines.size(); ++i) {
            const auto group = std::find_if(sameFilter.begin(), sameFilter.end(), [&](const auto& members) {
                return *lines[members.front()].filter == *lines[i].filter;
            });
            if (group == sameFilter.end()) sameFilter.push_back({i});
            else group->push_back(i);
        }
    }
};

const Rules& rules() {
    static const Rules value;
    return value;
}

struct ParsedCode {
    std::string subject;
    int level = 0;
    bool graduate = false;
};

bool parseCode(const std::string& text, ParsedCode& parsed) {
    const auto space = text.find(' ');
    const auto upper = [](char c) { return c >= 'A' && c <= 'Z'; };
    const auto digit = [](char c) { return c >= '0' && c <= '9'; };
    if (space < 2 || space > 4 || !std::all_of(text.begin(), text.begin() + static_cast<std::ptrdiff_t>(space), upper)) return false;
    auto number = text.substr(space + 1);
    const auto suffixed = !number.empty() && upper(number.back());
    if (suffixed) number.pop_back();
    if (number.size() < 3 || number.size() > 4 || !std::all_of(number.begin(), number.end(), digit)) return false;
    parsed.subject = text.substr(0, space);
    parsed.level = std::stoi(number);
    parsed.graduate = parsed.level >= 5000 || (number.size() == 3 && !suffixed);
    if (number.size() == 3) parsed.level = suffixed ? parsed.level * 10 : 4000;
    return true;
}

struct CodeFacts {
    std::string code;
    ParsedCode parsed;
    std::vector<std::size_t> lines;
    int set = kNone;
    const json* crossList = nullptr;
    unsigned areas = 0;
    unsigned nonCsAreas = 0;
    const std::string* areaTwin = nullptr;
    int discipline = kNone;
    int grouping = kNone;
    bool exactLine = false;
    bool advanced = false;
};

bool fits(const std::string& code, const ParsedCode& parsed, const json& filter, const json& requirements) {
    const auto& type = filter.at("type").get_ref<const std::string&>();
    if (type == "courses") return contains(filter.at("courses"), code);
    if (type == "huaSubjects") return contains(requirements.at("huaSubjects"), parsed.subject);
    if (type == "subjects" || type == "scienceElective") {
        if (filter.contains("excludedCourses") && contains(filter.at("excludedCourses"), code)) return false;
        return contains(filter.at("subjects"), parsed.subject) ||
               (filter.contains("additionalCourses") && contains(filter.at("additionalCourses"), code));
    }
    if (code == "CS 2119") return false;
    if (type == "cs4000plus") return parsed.subject == "CS" && parsed.level >= 4000 && code != "CS 5007";
    if (type == "csIntro" && contains(filter.at("courses"), code)) return true;
    if (type == "subjectMinLevel" || type == "csIntro") {
        return parsed.subject == filter.at("subject").get_ref<const std::string&>() && parsed.level >= filter.at("minLevel").get<int>();
    }
    return false;
}

class CodeBook {
public:
    const CodeFacts* lookUp(const std::string& code) {
        const auto known = facts_.find(code);
        if (known != facts_.end()) return &known->second;
        ParsedCode parsed;
        if (!parseCode(code, parsed)) return nullptr;
        return &facts_.emplace(code, build(code, parsed)).first->second;
    }

private:
    static CodeFacts build(const std::string& code, const ParsedCode& parsed) {
        const auto& all = rules();
        CodeFacts facts{code, parsed, {}, kNone, nullptr, 0, 0, nullptr, kNone, kNone, false, false};
        for (std::size_t i = 0; i < all.lines.size(); ++i) {
            const auto& filter = *all.lines[i].filter;
            if (!fits(code, parsed, filter, all.document)) continue;
            facts.lines.push_back(i);
            const auto& type = filter.at("type").get_ref<const std::string&>();
            if (type == "courses") facts.exactLine = true;
            if (type == "cs4000plus") facts.advanced = true;
        }
        const auto& sets = all.document.at("onlyOneSets");
        for (std::size_t i = 0; i < sets.size(); ++i) {
            if (contains(sets[i].at("courses"), code)) facts.set = static_cast<int>(i);
        }
        const auto& lists = all.document.at("crossLists");
        const auto list = std::find_if(lists.begin(), lists.end(), [&](const auto& item) { return contains(item, code); });
        if (list != lists.end()) facts.crossList = &*list;
        std::size_t area = 0;
        for (const auto& check : all.document.at("checks")) {
            if (check.at("type") != "area") continue;
            const auto bit = 1U << area++;
            const auto& nonCs = check.contains("nonCsCourses") ? check.at("nonCsCourses") : json::array();
            if (contains(nonCs, code)) facts.nonCsAreas |= bit;
            else if (contains(check.at("courses"), code)) facts.areas |= bit;
            if (!facts.crossList) continue;
            for (const auto& twin : *facts.crossList) {
                const auto& text = twin.get_ref<const std::string&>();
                if (text == code || contains(nonCs, text) || !contains(check.at("courses"), text)) continue;
                facts.areas |= bit;
                facts.areaTwin = &text;
            }
        }
        facts.discipline = indexOf(all.disciplines, parsed.subject);
        if (facts.discipline == kNone && facts.crossList) {
            for (const auto& twin : *facts.crossList) {
                ParsedCode other;
                if (parseCode(twin.get_ref<const std::string&>(), other) && indexOf(all.disciplines, other.subject) != kNone) {
                    facts.discipline = indexOf(all.disciplines, other.subject);
                }
            }
        }
        for (std::size_t i = 0; i < all.groupings.size(); ++i) {
            if (contains(*all.groupings[i], parsed.subject)) facts.grouping = static_cast<int>(i);
        }
        return facts;
    }

    std::unordered_map<std::string, CodeFacts> facts_;
};

struct Course {
    const CodeFacts* facts;
    double credits;
    bool taken;
    bool apIb;

    const std::string& code() const { return facts->code; }
};

Course parseCourse(const json& value, const std::string& field, bool taken, CodeBook& book) {
    if (!value.is_object()) throw badRequest(field, "must be an object");
    const auto* code = find(value, "code");
    if (!code || !code->is_string()) throw badRequest(field + ".code", "must be a course code");
    const auto* facts = book.lookUp(code->get_ref<const std::string&>());
    if (!facts) throw badRequest(field + ".code", "must be a course code");
    const auto* credits = find(value, "credits");
    if (!credits || !credits->is_number()) throw badRequest(field + ".credits", "must be a number");
    const auto amount = credits->get<double>();
    if (!std::isfinite(amount) || amount < 0) {
        throw badRequest(field + ".credits", "must be finite and nonnegative");
    }
    const auto* apIb = find(value, "apIb");
    if (apIb && !apIb->is_boolean()) throw badRequest(field + ".apIb", "must be true or false");
    return {facts, amount, taken, apIb && apIb->get<bool>()};
}

std::vector<Course> courses(const json& root, const char* key, bool taken, CodeBook& book) {
    std::vector<Course> result;
    if (const auto* list = find(root, key)) {
        if (!list->is_array()) throw badRequest(key, "must be a list");
        for (std::size_t i = 0; i < list->size(); ++i) {
            result.push_back(parseCourse((*list)[i], std::string(key) + "[" + std::to_string(i) + "]", taken, book));
        }
    }
    return result;
}

class FlowNetwork {
public:
    FlowNetwork(std::size_t nodes, std::size_t sink)
        : graph_(nodes), sink_(sink), nodes_(nodes), connected_(nodes * nodes, false), visited_(nodes), cameFrom_(nodes) {}

    void connect(std::size_t from, std::size_t to) {
        const auto slot = from * nodes_ + to;
        if (connected_[slot]) return;
        connected_[slot] = true;
        graph_[from].push_back({to, graph_[to].size(), true, true});
        graph_[to].push_back({from, graph_[from].size() - 1, false, false});
    }

    bool augment(std::size_t start) {
        std::fill(visited_.begin(), visited_.end(), false);
        queue_.clear();
        queue_.push_back(start);
        visited_[start] = true;
        for (std::size_t head = 0; head < queue_.size() && !visited_[sink_]; ++head) {
            const auto node = queue_[head];
            for (std::size_t i = 0; i < graph_[node].size(); ++i) {
                const auto& edge = graph_[node][i];
                if (!edge.open || visited_[edge.to]) continue;
                visited_[edge.to] = true;
                cameFrom_[edge.to] = {node, i};
                queue_.push_back(edge.to);
            }
        }
        if (!visited_[sink_]) return false;
        for (auto node = sink_; node != start; node = cameFrom_[node].first) {
            auto& edge = graph_[cameFrom_[node].first][cameFrom_[node].second];
            edge.open = false;
            graph_[node][edge.reverse].open = true;
        }
        return true;
    }

    int source(std::size_t node, std::size_t sources) const {
        while (node >= sources) {
            const auto& edges = graph_[node];
            const auto it = std::find_if(edges.begin(), edges.end(), [](const Edge& edge) { return edge.open && !edge.forward; });
            if (it == edges.end()) return kNone;
            node = it->to;
        }
        return static_cast<int>(node);
    }

private:
    struct Edge {
        std::size_t to;
        std::size_t reverse;
        bool forward;
        bool open;
    };

    std::vector<std::vector<Edge>> graph_;
    std::size_t sink_;
    std::size_t nodes_;
    std::vector<bool> connected_;
    std::vector<bool> visited_;
    std::vector<std::pair<std::size_t, std::size_t>> cameFrom_;
    std::vector<std::size_t> queue_;
};

struct Listing {
    std::vector<Course> codes;
    double credits;
    const json* crossList;
    const void* identity;

    bool taken() const { return codes.front().taken; }
    const CodeFacts& first() const { return *codes.front().facts; }
    bool fillsLines() const { return credits >= kLineCredits; }
    unsigned areas() const {
        unsigned result = 0;
        for (const auto& course : codes) result |= course.facts->areas;
        return result;
    }
    unsigned nonCsAreas() const {
        unsigned result = 0;
        for (const auto& course : codes) result |= course.facts->nonCsAreas;
        return result;
    }
};

bool isWpe(const Course& course) {
    return course.facts->parsed.subject == "WPE";
}

std::vector<Listing> groupCopies(std::vector<Course> history, std::vector<std::string>& extra) {
    std::stable_sort(history.begin(), history.end(), [](const Course& a, const Course& b) {
        if (a.taken != b.taken) return a.taken;
        if (a.code() != b.code()) return a.code() < b.code();
        if (a.credits != b.credits) return a.credits > b.credits;
        return a.apIb && !b.apIb;
    });
    std::vector<Listing> listings;
    for (const auto& course : history) {
        if (course.credits == 0 || (!isWpe(course) && course.credits < kMinimumCredits)) {
            extra.push_back(course.code());
            continue;
        }
        const auto* crossList = course.facts->crossList;
        const void* identity = crossList ? static_cast<const void*>(crossList) : static_cast<const void*>(course.facts);
        const auto it = std::find_if(listings.begin(), listings.end(), [&](const Listing& listing) { return listing.identity == identity; });
        if (it == listings.end()) {
            listings.push_back({{course}, course.credits, crossList, identity});
            continue;
        }
        const auto repeated = std::any_of(it->codes.begin(), it->codes.end(), [&](const Course& other) { return other.facts == course.facts; });
        if (repeated || it->taken() != course.taken) {
            extra.push_back(course.code());
        } else {
            it->codes.push_back(course);
            it->credits = std::max(it->credits, course.credits);
        }
    }
    return listings;
}

void rankWindow(const std::vector<Listing>& listings, std::size_t begin, std::size_t end, std::vector<int>& tiers) {
    const auto& all = rules();
    const auto mark = [&](std::size_t i, int tier) {
        if (i >= begin && i < end) tiers[i] = std::min(tiers[i], tier);
    };
    for (std::size_t area = 0; area < all.areaIds.size(); ++area) {
        const auto bit = 1U << area;
        auto found = false;
        for (std::size_t i = 0; i < end; ++i) {
            if (!listings[i].fillsLines() || !(listings[i].areas() & bit)) continue;
            if (!found) mark(i, kFirstTier);
            found = true;
            if (std::any_of(listings[i].codes.begin(), listings[i].codes.end(), [](const Course& course) { return course.facts->advanced; })) {
                mark(i, kSecondTier);
            }
        }
        for (std::size_t i = 0; i < end && !found; ++i) {
            if (!listings[i].fillsLines() || !(listings[i].nonCsAreas() & bit)) continue;
            mark(i, kFirstTier);
            found = true;
        }
    }
    const auto leading = [&](auto pick) {
        std::vector<std::size_t> counts;
        for (std::size_t i = 0; i < end; ++i) {
            const auto group = pick(listings[i]);
            if (group == kNone) continue;
            if (counts.size() <= static_cast<std::size_t>(group)) counts.resize(static_cast<std::size_t>(group) + 1, 0);
            ++counts[static_cast<std::size_t>(group)];
        }
        const auto best = std::max_element(counts.begin(), counts.end());
        return best == counts.end() ? std::pair<int, std::size_t>{kNone, 0}
                                    : std::pair<int, std::size_t>{static_cast<int>(best - counts.begin()), *best};
    };
    const auto discipline = [](const Listing& listing) { return listing.fillsLines() ? listing.first().discipline : kNone; };
    const auto [science, scienceCount] = leading(discipline);
    std::size_t pair = 0;
    for (std::size_t i = 0; i < end; ++i) {
        if (discipline(listings[i]) == kNone) continue;
        const auto keep = scienceCount >= all.scienceFromOne && discipline(listings[i]) == science && pair < all.scienceFromOne;
        if (keep) ++pair;
        mark(i, keep ? kFirstTier : kSecondTier);
    }
    const auto grouping = [](const Listing& listing) {
        return listing.fillsLines() && !listing.first().exactLine ? listing.first().grouping : kNone;
    };
    const auto [depth, depthCount] = leading(grouping);
    std::size_t kept = 0;
    auto breadthFound = depthCount < all.depthCourses;
    for (std::size_t i = 0; i < end; ++i) {
        const auto group = grouping(listings[i]);
        if (group == kNone) continue;
        if (group == depth && kept < all.depthCourses) {
            mark(i, kFirstTier);
            ++kept;
        } else if (group != depth && !breadthFound) {
            mark(i, kSecondTier);
            breadthFound = true;
        }
    }
}

std::vector<std::size_t> seatingOrder(const std::vector<Listing>& listings, std::size_t takenEnd) {
    std::vector<int> tiers(listings.size(), kLastTier);
    rankWindow(listings, 0, takenEnd, tiers);
    rankWindow(listings, takenEnd, listings.size(), tiers);
    std::vector<std::size_t> order;
    for (std::size_t i = 0; i < listings.size(); ++i) order.push_back(i);
    std::stable_sort(order.begin(), order.end(), [&](std::size_t a, std::size_t b) {
        if (listings[a].taken() != listings[b].taken()) return listings[a].taken();
        if (tiers[a] != tiers[b]) return tiers[a] < tiers[b];
        if (tiers[a] == kFirstTier) return false;
        return listings[a].first().parsed.subject > listings[b].first().parsed.subject;
    });
    return order;
}

std::vector<int> matchLines(const std::vector<Listing>& listings, const std::vector<std::size_t>& order, std::size_t takenEnd, CodeBook& book) {
    const auto& all = rules();
    const auto lineCount = all.lines.size();
    const auto setCount = all.document.at("onlyOneSets").size();
    const auto lineStart = listings.size();
    const auto setStart = lineStart + lineCount;
    const auto sink = setStart + 2 * setCount;
    FlowNetwork network(sink + 1, sink);
    for (std::size_t i = 0; i < lineCount; ++i) network.connect(lineStart + i, sink);
    for (std::size_t i = 0; i < setCount; ++i) network.connect(setStart + 2 * i, setStart + 2 * i + 1);

    std::vector<int> narrowness(lineCount, 0);
    for (std::size_t i = 0; i < lineCount; ++i) narrowness[all.narrowestFirst[i]] = static_cast<int>(i);
    const auto connect = [&](std::size_t listing, const CodeFacts& facts, double credits) {
        if (credits < kLineCredits) return;
        auto fitted = facts.lines;
        std::sort(fitted.begin(), fitted.end(), [&](std::size_t a, std::size_t b) { return narrowness[a] < narrowness[b]; });
        for (const auto line : fitted) {
            if (facts.set == kNone) {
                network.connect(listing, lineStart + line);
            } else {
                const auto set = setStart + 2 * static_cast<std::size_t>(facts.set);
                network.connect(listing, set);
                network.connect(set + 1, lineStart + line);
            }
        }
    };
    std::vector<bool> seated(listings.size(), false);
    const auto seat = [&](std::size_t phaseEnd) {
        for (const auto i : order) {
            if (i < phaseEnd && !seated[i]) seated[i] = network.augment(i);
        }
    };
    for (const auto& [begin, end] : {std::pair<std::size_t, std::size_t>{0, takenEnd}, {takenEnd, listings.size()}}) {
        for (const auto i : order) {
            if (i < begin || i >= end) continue;
            for (const auto& course : listings[i].codes) {
                if (course.facts->areaTwin) {
                    const auto* twin = book.lookUp(*course.facts->areaTwin);
                    if (twin) connect(i, *twin, listings[i].credits);
                }
                connect(i, *course.facts, course.credits);
            }
        }
        seat(end);
        for (const auto i : order) {
            if (i < begin || i >= end || !listings[i].crossList) continue;
            for (const auto& code : *listings[i].crossList) {
                const auto* twin = book.lookUp(code.get_ref<const std::string&>());
                if (twin) connect(i, *twin, listings[i].credits);
            }
        }
        seat(end);
    }
    std::vector<int> holders;
    for (std::size_t i = 0; i < lineCount; ++i) holders.push_back(network.source(lineStart + i, lineStart));
    return holders;
}

void layOutLines(const std::vector<Listing>& listings, const std::vector<std::size_t>& order, std::vector<int>& holders) {
    const auto& all = rules();
    std::vector<std::size_t> rank(listings.size(), 0);
    for (std::size_t i = 0; i < order.size(); ++i) rank[order[i]] = i;
    for (const auto& group : all.sameFilter) {
        if (group.size() < 2) continue;
        std::vector<int> waiting;
        for (const auto line : group) {
            if (holders[line] != kNone) waiting.push_back(holders[line]);
            holders[line] = kNone;
        }
        std::sort(waiting.begin(), waiting.end(), [&](int a, int b) {
            return rank[static_cast<std::size_t>(a)] < rank[static_cast<std::size_t>(b)];
        });
        for (const auto line : group) {
            const auto area = all.lines[line].area;
            if (area == kNone) continue;
            const auto it = std::find_if(waiting.begin(), waiting.end(), [&](int holder) {
                return (listings[static_cast<std::size_t>(holder)].areas() >> area) & 1U;
            });
            if (it == waiting.end()) continue;
            holders[line] = *it;
            waiting.erase(it);
        }
        for (const auto plainFirst : {true, false}) {
            for (const auto line : group) {
                if (waiting.empty()) break;
                if (holders[line] != kNone || (all.lines[line].area == kNone) != plainFirst) continue;
                holders[line] = waiting.front();
                waiting.erase(waiting.begin());
            }
        }
    }
}

enum class CheckState { Met, Planned, NotMet, Check };

const char* word(CheckState state) {
    switch (state) {
        case CheckState::Met: return "met";
        case CheckState::Planned: return "planned";
        case CheckState::NotMet: return "not-met";
        case CheckState::Check: return "check";
    }
    return "check";
}

struct CheckResult {
    CheckState state;
    std::vector<std::string> courses;
    bool meets;
};

struct Slot {
    int listing;
    const char* state;
};

struct Manual {
    std::vector<bool> lines;
    bool depthConfirmed = false;
};

struct Placement {
    std::vector<Listing> listings;
    std::vector<std::string> extra;
    std::vector<int> holders;
    std::vector<const CodeFacts*> shown;
    std::vector<std::vector<Slot>> slots;
    std::vector<int> filled;
    std::vector<bool> placed;
    std::vector<CheckResult> checks;
};

CheckState takenOrPlanned(bool anyPlanned) {
    return anyPlanned ? CheckState::Planned : CheckState::Met;
}

CheckResult areaCheck(const Placement& placement, std::size_t area) {
    const auto& all = rules();
    const auto bit = 1U << area;
    auto taken = false;
    auto planned = false;
    for (std::size_t i = 0; i < all.lines.size(); ++i) {
        if (all.lines[i].section != "cs" || placement.holders[i] == kNone) continue;
        const auto& listing = placement.listings[static_cast<std::size_t>(placement.holders[i])];
        if (!(listing.areas() & bit)) continue;
        (listing.taken() ? taken : planned) = true;
    }
    std::vector<std::string> codes;
    auto nonCs = false;
    for (const auto& listing : placement.listings) {
        if (!listing.fillsLines()) continue;
        if (listing.nonCsAreas() & bit) nonCs = true;
        if ((listing.areas() | listing.nonCsAreas()) & bit) codes.push_back(listing.first().code);
    }
    if (taken || planned) return {takenOrPlanned(!taken), std::move(codes), true};
    if (nonCs) return {CheckState::Check, std::move(codes), true};
    return {CheckState::NotMet, {}, false};
}

CheckResult scienceCheck(const Placement& placement) {
    const auto& all = rules();
    std::vector<std::size_t> takenCount(all.disciplines.size(), 0);
    std::vector<std::size_t> anyCount(all.disciplines.size(), 0);
    std::vector<std::string> codes;
    for (std::size_t i = 0; i < all.lines.size(); ++i) {
        if (all.lines[i].section != "science" || placement.holders[i] == kNone) continue;
        const auto discipline = placement.shown[i]->discipline;
        if (discipline == kNone) continue;
        const auto index = static_cast<std::size_t>(discipline);
        ++anyCount[index];
        if (placement.listings[static_cast<std::size_t>(placement.holders[i])].taken()) ++takenCount[index];
        if (codes.size() < all.scienceListed) codes.push_back(placement.shown[i]->code);
    }
    const auto enough = [&](std::size_t count) { return count >= all.scienceFromOne; };
    if (std::any_of(takenCount.begin(), takenCount.end(), enough)) return {CheckState::Met, std::move(codes), true};
    if (std::any_of(anyCount.begin(), anyCount.end(), enough)) return {CheckState::Planned, std::move(codes), true};
    return {CheckState::NotMet, {}, false};
}

struct HumanitiesCourse {
    std::string code;
    int grouping;
    bool taken;
};

std::vector<HumanitiesCourse> humanitiesCourses(const Placement& placement) {
    const auto& all = rules();
    std::vector<HumanitiesCourse> result;
    for (std::size_t i = 0; i < all.lines.size(); ++i) {
        if (placement.holders[i] == kNone || all.lines[i].filter->at("type") != "huaSubjects") continue;
        const auto& listing = placement.listings[static_cast<std::size_t>(placement.holders[i])];
        result.push_back({placement.shown[i]->code, placement.shown[i]->grouping, listing.taken()});
    }
    return result;
}

int depthGrouping(const std::vector<HumanitiesCourse>& courses) {
    const auto& all = rules();
    for (std::size_t group = 0; group < all.groupings.size(); ++group) {
        const auto count = std::count_if(courses.begin(), courses.end(), [&](const HumanitiesCourse& course) {
            return course.grouping == static_cast<int>(group);
        });
        if (static_cast<std::size_t>(count) >= all.depthCourses) return static_cast<int>(group);
    }
    return kNone;
}

CheckResult depthCheck(const Placement& placement, const Manual& manual) {
    const auto& all = rules();
    auto courses = humanitiesCourses(placement);
    const auto depth = depthGrouping(courses);
    if (depth == kNone) {
        const auto spans = !courses.empty() && std::any_of(courses.begin(), courses.end(), [&](const HumanitiesCourse& course) {
            return course.grouping != courses.front().grouping;
        });
        if (!spans) return {CheckState::NotMet, {}, false};
        std::vector<std::string> codes;
        for (const auto& course : courses) codes.push_back(course.code);
        std::sort(codes.begin(), codes.end());
        return {CheckState::Check, std::move(codes), false};
    }
    std::sort(courses.begin(), courses.end(), [](const HumanitiesCourse& a, const HumanitiesCourse& b) {
        if (a.taken != b.taken) return a.taken;
        return a.code < b.code;
    });
    std::vector<std::string> codes;
    auto anyPlanned = false;
    for (const auto& course : courses) {
        if (course.grouping != depth || codes.size() == all.depthCourses) continue;
        codes.push_back(course.code);
        if (!course.taken) anyPlanned = true;
    }
    return {manual.depthConfirmed ? takenOrPlanned(anyPlanned) : CheckState::Check, std::move(codes), true};
}

CheckResult breadthCheck(const Placement& placement) {
    const auto& all = rules();
    auto courses = humanitiesCourses(placement);
    const auto depth = depthGrouping(courses);
    if (depth == kNone) {
        if (courses.empty()) return {CheckState::NotMet, {}, false};
        return {CheckState::Check, {}, false};
    }
    std::sort(courses.begin(), courses.end(), [](const HumanitiesCourse& a, const HumanitiesCourse& b) {
        if (a.taken != b.taken) return a.taken;
        return a.code < b.code;
    });
    std::vector<std::string> outside;
    auto anyTaken = false;
    for (const auto& course : courses) {
        if (course.grouping == depth) continue;
        outside.push_back(course.code);
        if (course.taken) anyTaken = true;
    }
    if (!outside.empty()) return {takenOrPlanned(!anyTaken), std::move(outside), true};
    if (all.groupingNames[static_cast<std::size_t>(depth)] != "modern-languages") return {CheckState::NotMet, {}, false};
    std::vector<std::string> codes;
    for (const auto& course : courses) codes.push_back(course.code);
    return {CheckState::Check, std::move(codes), true};
}

CheckResult apIbCheck(const Placement& placement) {
    std::vector<std::string> codes;
    for (const auto& listing : placement.listings) {
        const auto flagged = std::any_of(listing.codes.begin(), listing.codes.end(), [](const Course& course) {
            return course.apIb && course.facts->grouping != kNone;
        });
        if (flagged) codes.push_back(listing.first().code);
    }
    const auto state = codes.size() > rules().apIbLimit ? CheckState::Check : CheckState::Met;
    return {state, std::move(codes), true};
}

CheckResult mathLimitCheck(const Placement& placement) {
    const auto& all = rules();
    std::vector<std::string> codes;
    for (std::size_t i = 0; i < all.lines.size(); ++i) {
        if (all.lines[i].section != "math" || placement.holders[i] == kNone) continue;
        if (placement.shown[i]->parsed.level < all.mathCeiling) codes.push_back(placement.shown[i]->code);
    }
    return {CheckState::Met, std::move(codes), true};
}

CheckResult graduateCheck(const Placement& placement) {
    const auto& all = rules();
    std::vector<bool> onCsLine(placement.listings.size(), false);
    for (std::size_t i = 0; i < all.lines.size(); ++i) {
        if (all.lines[i].section == "cs" && placement.holders[i] != kNone) onCsLine[static_cast<std::size_t>(placement.holders[i])] = true;
    }
    std::vector<std::string> codes;
    for (std::size_t i = 0; i < placement.listings.size(); ++i) {
        const auto& listing = placement.listings[i];
        const auto counts = onCsLine[i] && std::any_of(listing.codes.begin(), listing.codes.end(), [](const Course& course) {
            return course.facts->advanced && course.facts->parsed.graduate;
        });
        if (counts) codes.push_back(listing.first().code);
    }
    return {CheckState::Check, std::move(codes), true};
}

std::vector<CheckResult> evaluateChecks(const Placement& placement, const Manual& manual, bool anyCourses) {
    std::vector<CheckResult> results;
    std::size_t area = 0;
    for (const auto& check : rules().document.at("checks")) {
        const auto& type = check.at("type").get_ref<const std::string&>();
        if (type == "area") results.push_back(areaCheck(placement, area++));
        else if (type == "scienceDepth") results.push_back(scienceCheck(placement));
        else if (type == "huaDepth") results.push_back(depthCheck(placement, manual));
        else if (type == "huaBreadth") results.push_back(breadthCheck(placement));
        else if (type == "apIbLimit") results.push_back(apIbCheck(placement));
        else if (type == "residency") results.push_back({anyCourses ? CheckState::Check : CheckState::NotMet, {}, false});
        else if (type == "mathLevelLimit") results.push_back(mathLimitCheck(placement));
        else results.push_back(graduateCheck(placement));
    }
    return results;
}

Placement place(const std::vector<Course>& history, const Manual& manual, CodeBook& book) {
    const auto& all = rules();
    Placement result;
    result.listings = groupCopies(history, result.extra);
    const auto& listings = result.listings;
    const auto takenEnd = static_cast<std::size_t>(std::count_if(listings.begin(), listings.end(), [](const Listing& listing) { return listing.taken(); }));
    const auto order = seatingOrder(listings, takenEnd);
    result.holders = matchLines(listings, order, takenEnd, book);
    layOutLines(listings, order, result.holders);

    result.placed.assign(listings.size(), false);
    const auto seatCourse = [&](std::size_t listing, const std::string& code) {
        result.placed[listing] = true;
        for (const auto& course : listings[listing].codes) {
            if (course.code() != code) result.extra.push_back(course.code());
        }
    };
    const auto lineCount = all.lines.size();
    result.shown.assign(lineCount, nullptr);
    result.slots.assign(lineCount, {});
    result.filled.assign(lineCount, 0);
    for (std::size_t i = 0; i < lineCount; ++i) {
        if (result.holders[i] != kNone) {
            const auto holder = static_cast<std::size_t>(result.holders[i]);
            const auto& codes = listings[holder].codes;
            const auto fit = std::find_if(codes.begin(), codes.end(), [&](const Course& course) {
                return course.credits >= kLineCredits && std::binary_search(course.facts->lines.begin(), course.facts->lines.end(), i);
            });
            result.shown[i] = fit == codes.end() ? codes.front().facts : fit->facts;
            seatCourse(holder, result.shown[i]->code);
            result.filled[i] = 1;
        }
        if (manual.lines[i]) result.filled[i] = 1;
        const auto count = all.lines[i].subSlots;
        if (count == 0) continue;
        auto& slots = result.slots[i];
        const auto fill = [&](bool taken) {
            for (std::size_t c = 0; c < listings.size() && slots.size() < count; ++c) {
                const auto& course = listings[c].codes.front();
                if (!isWpe(course) || course.taken != taken) continue;
                slots.push_back({static_cast<int>(c), taken ? "done" : "planned"});
                seatCourse(c, course.code());
            }
        };
        fill(true);
        if (manual.lines[i]) {
            while (slots.size() < count) slots.push_back({kNone, "done"});
        }
        fill(false);
        result.filled[i] = static_cast<int>(slots.size());
        while (slots.size() < count) slots.push_back({kNone, "empty"});
    }
    for (std::size_t i = 0; i < lineCount; ++i) {
        if (all.lines[i].pool) result.filled[i] = 0;
    }
    result.checks = evaluateChecks(result, manual, !history.empty());
    return result;
}

json candidateResult(const Course& candidate, const std::vector<Course>& history, const Placement& base, const Manual& manual, CodeBook& book) {
    auto trial = history;
    trial.push_back(candidate);
    const auto after = place(trial, manual, book);
    const auto& all = rules();
    const auto total = [](const Placement& placement) {
        int sum = 0;
        for (const auto count : placement.filled) sum += count;
        return sum;
    };
    json lines = json::array();
    if (total(after) > total(base)) {
        for (std::size_t i = 0; i < all.lines.size(); ++i) {
            if (after.filled[i] > base.filled[i]) lines.push_back(all.lines[i].id);
        }
    }
    json checks = json::array();
    const auto& ruleChecks = all.document.at("checks");
    for (std::size_t i = 0; i < ruleChecks.size(); ++i) {
        if (!base.checks[i].meets && after.checks[i].meets) checks.push_back(ruleChecks[i].at("id"));
    }
    return {{"code", candidate.code()}, {"closesLines", std::move(lines)}, {"closesChecks", std::move(checks)}};
}

json respond(const json& root) {
    const auto* version = find(root, "version");
    if (!version) throw badRequest("version", "is missing");
    if (!version->is_number_integer()) throw badRequest("version", "must be a whole number");
    if (*version != 1) throw AuditError{"unsupportedVersion", "This engine understands version 1", version->dump()};
    const auto* id = find(root, "requirements");
    if (!id || !id->is_string()) throw badRequest("requirements", "must be a string");
    if (*id != "cs-2030") throw AuditError{"unknownRequirements", "Unknown requirements: " + id->get<std::string>(), *id};

    CodeBook book;
    auto history = courses(root, "taken", true, book);
    const auto planned = courses(root, "planned", false, book);
    history.insert(history.end(), planned.begin(), planned.end());
    const auto candidates = courses(root, "candidates", false, book);
    const auto emptyList = json::array();
    const auto* manualList = find(root, "manual");
    if (manualList) {
        if (!manualList->is_array()) throw badRequest("manual", "must be a list");
        for (std::size_t i = 0; i < manualList->size(); ++i) {
            if (!(*manualList)[i].is_string()) throw badRequest("manual[" + std::to_string(i) + "]", "must be a string");
        }
    }
    const auto& confirmed = manualList ? *manualList : emptyList;

    const auto& all = rules();
    const auto& requirements = all.document;
    Manual manual;
    manual.lines.assign(all.lines.size(), false);
    for (const auto& item : requirements.at("manualItems")) {
        if (!contains(confirmed, item.at("id").get<std::string>())) continue;
        if (item.at("id") == "hua-depth-confirmation") manual.depthConfirmed = true;
        if (!item.contains("line")) continue;
        const auto line = std::find_if(all.lines.begin(), all.lines.end(), [&](const LineRule& rule) { return item.at("line") == rule.id; });
        manual.lines[static_cast<std::size_t>(line - all.lines.begin())] = true;
    }

    auto placement = place(history, manual, book);
    const auto& listings = placement.listings;
    auto& extra = placement.extra;
    const auto& lines = requirements.at("lines");

    std::vector<json> results;
    for (std::size_t i = 0; i < lines.size(); ++i) {
        json line = {{"id", lines[i].at("line")}, {"label", lines[i].at("name")}, {"state", "empty"}, {"course", nullptr}};
        if (placement.holders[i] != kNone) {
            line["state"] = listings[static_cast<std::size_t>(placement.holders[i])].taken() ? "done" : "planned";
            line["course"] = placement.shown[i]->code;
        }
        if (manual.lines[i]) line["state"] = "done";
        const auto& slots = placement.slots[i];
        if (!slots.empty()) {
            json slotList = json::array();
            auto anyPlanned = false;
            std::size_t filled = 0;
            for (const auto& slot : slots) {
                const auto empty = std::string_view(slot.state) == "empty";
                if (!empty) ++filled;
                if (std::string_view(slot.state) == "planned") anyPlanned = true;
                json course = nullptr;
                if (slot.listing != kNone) course = listings[static_cast<std::size_t>(slot.listing)].first().code;
                slotList.push_back({{"course", std::move(course)}, {"state", slot.state}});
            }
            line["state"] = filled == 0 ? "empty" : filled < slots.size() ? "partial" : anyPlanned ? "planned" : "done";
            line["subSlots"] = std::move(slotList);
        }
        results.push_back(std::move(line));
    }
    const auto resultFor = [&](const json& lineId) -> json& {
        return *std::find_if(results.begin(), results.end(), [&](const json& line) { return line.at("id") == lineId; });
    };

    const auto& allSections = requirements.at("sections");
    const auto poolSectionIt = std::find_if(allSections.begin(), allSections.end(), [](const auto& section) {
        return section.contains("creditPool");
    });
    const auto& poolSection = *poolSectionIt;
    const auto poolCredits = poolSection.at("poolCredits").get<double>();
    const auto creditsPerLine = poolCredits / static_cast<double>(poolSection.at("lines").size());
    double poolFilled = 0;
    double creditsDone = 0;
    double creditsPlanned = 0;
    std::size_t poolLinesFinished = 0;
    json poolCourses = json::array();
    for (std::size_t c = 0; c < listings.size(); ++c) {
        if (placement.placed[c]) continue;
        const auto& listing = listings[c];
        if (listing.credits < kMinimumCredits || poolFilled >= poolCredits - kCreditTolerance) {
            for (const auto& course : listing.codes) extra.push_back(course.code());
            continue;
        }
        const auto& course = listing.codes.front();
        for (std::size_t other = 1; other < listing.codes.size(); ++other) extra.push_back(listing.codes[other].code());
        (course.taken ? creditsDone : creditsPlanned) += std::min(listing.credits, poolCredits - poolFilled);
        poolFilled += listing.credits;
        poolCourses.push_back(course.code());
        auto named = false;
        while (poolLinesFinished < poolSection.at("lines").size() &&
               poolFilled + kCreditTolerance >= creditsPerLine * static_cast<double>(poolLinesFinished + 1)) {
            auto& line = resultFor(poolSection.at("lines")[poolLinesFinished]);
            line["state"] = course.taken ? "done" : "planned";
            if (!named) line["course"] = course.code();
            named = true;
            ++poolLinesFinished;
        }
    }
    std::sort(extra.begin(), extra.end());

    json sections = json::array();
    for (const auto& section : allSections) {
        int done = 0;
        int plannedCount = 0;
        int total = 0;
        json sectionLines = json::array();
        const auto count = [&](const json& state) {
            ++total;
            if (state == "done") ++done;
            if (state == "planned") ++plannedCount;
        };
        for (const auto& lineId : section.at("lines")) {
            const auto& line = resultFor(lineId);
            if (line.contains("subSlots")) {
                for (const auto& slot : line.at("subSlots")) count(slot.at("state"));
            } else {
                count(line.at("state"));
            }
            sectionLines.push_back(line);
        }
        sections.push_back({{"name", section.at("name")}, {"done", done}, {"planned", plannedCount},
                            {"total", total}, {"lines", std::move(sectionLines)}});
    }
    json checks = json::array();
    const auto& ruleChecks = requirements.at("checks");
    for (std::size_t i = 0; i < ruleChecks.size(); ++i) {
        const auto& result = placement.checks[i];
        checks.push_back({{"id", ruleChecks[i].at("id")}, {"label", ruleChecks[i].at("name")},
                          {"state", word(result.state)}, {"courses", result.courses}});
    }
    json candidateResults = json::array();
    for (const auto& candidate : candidates) {
        candidateResults.push_back(candidateResult(candidate, history, placement, manual, book));
    }
    return {{"ok", true}, {"version", 1}, {"sections", std::move(sections)}, {"checks", std::move(checks)},
            {"freeElectives", {{"creditsDone", creditsDone}, {"creditsPlanned", creditsPlanned},
                               {"creditsTotal", poolSection.at("poolCredits")}, {"courses", std::move(poolCourses)}}},
            {"extra", std::move(extra)}, {"candidateResults", std::move(candidateResults)}};
}

}

std::string handleAudit(std::string_view requestJson) {
    try {
        const auto root = json::parse(requestJson);
        return respond(root).dump(-1, ' ', false, json::error_handler_t::replace);
    } catch (const AuditError& error) {
        return json({{"ok", false}, {"version", 1},
                     {"error", {{"code", error.code}, {"message", error.message}, {"detail", error.detail}}}})
            .dump(-1, ' ', false, json::error_handler_t::replace);
    } catch (...) {
        return R"({"ok":false,"version":1,"error":{"code":"internal","message":"Could not audit courses","detail":null}})";
    }
}

}
