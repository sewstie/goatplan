#include <gtest/gtest.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <numeric>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "goatplan/filters.hpp"
#include "goatplan/json_io.hpp"

using namespace goatplan;

namespace {
using Removed = std::array<int, static_cast<std::size_t>(FilterReason::Count)>;

std::size_t reasonIndex(FilterReason reason) { return static_cast<std::size_t>(reason); }

int removedTotal(const CourseChoices& choice) {
    return std::accumulate(choice.removed.begin(), choice.removed.end(), 0);
}

Meeting meeting(std::uint8_t days, int start, int end) {
    Meeting result;
    result.days = days;
    result.start = start;
    result.end = end;
    return result;
}

Section section(const std::string& id, SectionType type, SectionStatus status,
                int capacity, int enrolled, std::vector<Meeting> meetings) {
    Section result;
    result.id = id;
    result.type = type;
    result.status = status;
    result.capacity = capacity;
    result.enrolled = enrolled;
    result.meetings = std::move(meetings);
    return result;
}

Term sampleTerm() {
    Course course;
    course.code = "TEST 100";
    course.sections = {
        section("TEST-LECTURE", SectionType::Lecture, SectionStatus::Open,
                100, 70, {meeting(Monday, 540, 590)}),
        section("TEST-LAB-A", SectionType::Lab, SectionStatus::Open,
                20, 17, {meeting(Tuesday, 600, 650)}),
        section("TEST-LAB-B", SectionType::Lab, SectionStatus::Waitlist,
                20, 10, {meeting(Wednesday, 660, 710)}),
        section("TEST-LAB-C", SectionType::Lab, SectionStatus::Closed,
                0, 0, {meeting(Thursday, 720, 770)})
    };
    course.options = {{0, 1}, {0, 2}, {0, 3}};
    Term term;
    term.courses.push_back(std::move(course));
    term.courseIndex.emplace("TEST 100", 0);
    return term;
}

CourseChoices choicesFor(const Term& term, const Preferences& prefs) {
    return filterOptions(term, {"TEST 100"}, prefs).at(0);
}

Term smallFixture() { return loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json"); }

FilterReason referenceReason(const Course& course, const CourseOption& option,
                             const Preferences& prefs) {
    const auto locks = prefs.locked.find(course.code);
    if (locks != prefs.locked.end()) {
        for (const std::string& id : locks->second) {
            bool present = false;
            for (std::size_t index : option) {
                if (course.sections.at(index).id == id) present = true;
            }
            if (!present) return FilterReason::NotLocked;
        }
    }
    if (prefs.onlyOpen) {
        for (std::size_t index : option) {
            if (course.sections.at(index).status != SectionStatus::Open) return FilterReason::NotOpen;
        }
    }
    if (prefs.startsAfter != 0) {
        for (std::size_t index : option) {
            for (const Meeting& m : course.sections.at(index).meetings) {
                if (m.start < prefs.startsAfter) return FilterReason::StartsTooEarly;
            }
        }
    }
    for (std::size_t index : option) {
        for (const Meeting& m : course.sections.at(index).meetings) {
            WeekMask meetingMask;
            meetingMask.addMeeting(m);
            if (meetingMask.intersects(prefs.blocked)) return FilterReason::Blocked;
        }
    }
    return FilterReason::Count;
}

void expectMatchesReference(const Term& term, const Course& course, const Preferences& prefs) {
    const CourseChoices actual = filterOptions(term, {course.code}, prefs).at(0);
    std::vector<std::size_t> expectedKept;
    Removed expectedRemoved{};
    for (std::size_t i = 0; i < course.options.size(); ++i) {
        const FilterReason reason = referenceReason(course, course.options[i], prefs);
        if (reason == FilterReason::Count) expectedKept.push_back(i);
        else ++expectedRemoved[reasonIndex(reason)];
    }
    EXPECT_EQ(actual.options, expectedKept) << course.code;
    EXPECT_EQ(actual.removed, expectedRemoved) << course.code;
}
}

TEST(Filters, NoPreferencesKeepsEverything) {
    const Term term = sampleTerm();
    const CourseChoices choice = choicesFor(term, Preferences{});
    EXPECT_EQ(choice.course, &term.courses.at(0));
    EXPECT_EQ(choice.options, std::vector<std::size_t>({0, 1, 2}));
    EXPECT_EQ(removedTotal(choice), 0);
    ASSERT_EQ(choice.masks.size(), choice.options.size());
    ASSERT_EQ(choice.openSeats.size(), choice.options.size());
    for (std::size_t i = 0; i < choice.options.size(); ++i) {
        EXPECT_EQ(choice.masks[i], maskOf(*choice.course, choice.course->options[choice.options[i]]));
    }
}

TEST(Filters, CountsEveryOptionOnceAndKeepsCourseOrder) {
    Term term = sampleTerm();
    Course second = term.courses.at(0);
    second.code = "TEST 200";
    term.courseIndex.emplace(second.code, term.courses.size());
    term.courses.push_back(second);

    Preferences prefs;
    prefs.onlyOpen = true;
    const auto choices = filterOptions(term, {"TEST 200", "TEST 100"}, prefs);
    ASSERT_EQ(choices.size(), 2u);
    EXPECT_EQ(choices[0].course->code, "TEST 200");
    EXPECT_EQ(choices[1].course->code, "TEST 100");
    for (const CourseChoices& choice : choices) {
        EXPECT_EQ(choice.options.size() + static_cast<std::size_t>(removedTotal(choice)),
                  choice.course->options.size());
    }
}

TEST(Filters, RemovesOptionsThatStartTooEarly) {
    const Term term = sampleTerm();
    Preferences prefs;
    prefs.startsAfter = 541;
    const CourseChoices choice = choicesFor(term, prefs);
    EXPECT_TRUE(choice.options.empty());
    EXPECT_EQ(choice.removed[reasonIndex(FilterReason::StartsTooEarly)], 3);
    EXPECT_EQ(removedTotal(choice), 3);
}

// 9:03 rounds down to the 9:00 slot in a WeekMask, so the check must use real minutes.
TEST(Filters, StartingExactlyAtTheLimitIsAllowed) {
    Term term = sampleTerm();
    term.courses[0].sections[0].meetings[0].start = 543;
    Preferences prefs;
    prefs.startsAfter = 543;
    EXPECT_EQ(choicesFor(term, prefs).options.size(), 3u);
}

TEST(Filters, BlockedTimeRemovesOnlyTheOptionThatMeetsThen) {
    const Term term = sampleTerm();
    Preferences prefs;
    prefs.blocked.addRange(1, 600, 650);
    const CourseChoices choice = choicesFor(term, prefs);
    EXPECT_EQ(choice.options, std::vector<std::size_t>({1, 2}));
    EXPECT_EQ(choice.removed[reasonIndex(FilterReason::Blocked)], 1);
}

TEST(Filters, SectionsWithoutMeetingsPassTimeRules) {
    Term term = sampleTerm();
    for (Section& current : term.courses[0].sections) current.meetings.clear();
    Preferences prefs;
    prefs.startsAfter = 600;
    for (int day = 0; day < 7; ++day) prefs.blocked.addRange(day, 0, 1440);
    const CourseChoices choice = choicesFor(term, prefs);
    EXPECT_EQ(choice.options.size(), 3u);
    for (const WeekMask& mask : choice.masks) EXPECT_TRUE(mask.empty());
}

TEST(Filters, OnlyOpenRemovesWaitlistAndClosed) {
    const Term term = sampleTerm();
    Preferences prefs;
    prefs.onlyOpen = true;
    const CourseChoices choice = choicesFor(term, prefs);
    EXPECT_EQ(choice.options, std::vector<std::size_t>({0}));
    EXPECT_EQ(choice.removed[reasonIndex(FilterReason::NotOpen)], 2);
}

TEST(Filters, KeepsOnlyOptionsWithEveryLockedSection) {
    const Term term = sampleTerm();
    Preferences prefs;
    prefs.locked["TEST 100"] = {"TEST-LECTURE", "TEST-LAB-B"};
    EXPECT_EQ(choicesFor(term, prefs).options, std::vector<std::size_t>({1}));

    prefs.locked["TEST 100"] = {"TEST-LAB-A", "TEST-LAB-B"};
    const CourseChoices incompatible = choicesFor(term, prefs);
    EXPECT_TRUE(incompatible.options.empty());
    EXPECT_EQ(incompatible.removed[reasonIndex(FilterReason::NotLocked)], 3);
}

TEST(Filters, CountsOnlyTheFirstReasonAnOptionFails) {
    const Term term = sampleTerm();
    Preferences prefs;
    prefs.locked["TEST 100"] = {"TEST-LAB-B"};
    prefs.onlyOpen = true;
    prefs.startsAfter = 600;
    prefs.blocked.addRange(0, 540, 590);
    const CourseChoices choice = choicesFor(term, prefs);
    EXPECT_EQ(choice.removed[reasonIndex(FilterReason::NotLocked)], 2);
    EXPECT_EQ(choice.removed[reasonIndex(FilterReason::NotOpen)], 1);
    EXPECT_EQ(removedTotal(choice), 3);

    prefs.locked.clear();
    prefs.onlyOpen = false;
    const CourseChoices early = choicesFor(term, prefs);
    EXPECT_EQ(early.removed[reasonIndex(FilterReason::StartsTooEarly)], 3);
    EXPECT_EQ(early.removed[reasonIndex(FilterReason::Blocked)], 0);
}

TEST(Filters, OpenSeatsAreTheSmallestKnownCount) {
    Term term = sampleTerm();
    EXPECT_EQ(choicesFor(term, Preferences{}).openSeats, std::vector<int>({3, 10, 30}));

    term.courses[0].sections[0].capacity = 0;
    EXPECT_EQ(choicesFor(term, Preferences{}).openSeats, std::vector<int>({3, 10, -1}));

    term.courses[0].sections[1].enrolled = term.courses[0].sections[1].capacity;
    EXPECT_EQ(choicesFor(term, Preferences{}).openSeats[0], 0);

    term.courses[0].sections[1].enrolled = term.courses[0].sections[1].capacity + 2;
    EXPECT_EQ(choicesFor(term, Preferences{}).openSeats[0], 0);
}

TEST(Filters, UnknownCoursesAndSectionsThrow) {
    const Term term = sampleTerm();
    EXPECT_THROW((void)filterOptions(term, {"MISSING"}, Preferences{}), std::invalid_argument);

    Preferences prefs;
    prefs.locked["TEST 100"] = {"MISSING-SECTION"};
    EXPECT_THROW((void)choicesFor(term, prefs), std::invalid_argument);

    prefs.locked.clear();
    prefs.locked["MISSING"] = {"ANY-SECTION"};
    EXPECT_THROW((void)choicesFor(term, prefs), std::invalid_argument);
}

TEST(Filters, FixtureKeepsEveryOptionByDefault) {
    const Term term = smallFixture();
    const Course* ae = term.findCourse("AE 2320");
    ASSERT_NE(ae, nullptr);
    ASSERT_EQ(ae->sections.size(), 4u);
    ASSERT_EQ(ae->options.size(), 3u);

    std::vector<std::string> codes;
    for (const Course& course : term.courses) codes.push_back(course.code);
    for (const CourseChoices& choice : filterOptions(term, codes, Preferences{})) {
        EXPECT_EQ(choice.options.size(), choice.course->options.size()) << choice.course->code;
        EXPECT_EQ(removedTotal(choice), 0) << choice.course->code;
    }

    Preferences prefs;
    prefs.onlyOpen = true;
    prefs.startsAfter = 600;
    for (const CourseChoices& choice : filterOptions(term, codes, prefs)) {
        EXPECT_EQ(choice.options.size() + static_cast<std::size_t>(removedTotal(choice)),
                  choice.course->options.size()) << choice.course->code;
    }
}

TEST(Filters, FixtureMatchesTheReferenceRules) {
    const Term term = smallFixture();
    bool triedMeeting = false;
    for (const Course& course : term.courses) {
        Preferences open;
        open.onlyOpen = true;
        expectMatchesReference(term, course, open);
        for (const CourseOption& option : course.options) {
            for (std::size_t index : option) {
                const Section& current = course.sections.at(index);
                Preferences lock;
                lock.locked[course.code] = {current.id};
                expectMatchesReference(term, course, lock);
                for (const Meeting& m : current.meetings) {
                    triedMeeting = true;
                    Preferences time;
                    time.startsAfter = m.start;
                    expectMatchesReference(term, course, time);
                    time.startsAfter = m.start + 1;
                    expectMatchesReference(term, course, time);

                    Preferences blocked;
                    blocked.blocked.addMeeting(m);
                    expectMatchesReference(term, course, blocked);

                    lock.onlyOpen = true;
                    lock.startsAfter = m.start + 1;
                    lock.blocked.addMeeting(m);
                    expectMatchesReference(term, course, lock);
                }
            }
        }
    }
    EXPECT_TRUE(triedMeeting);
}
