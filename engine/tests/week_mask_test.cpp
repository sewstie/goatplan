#include <gtest/gtest.h>

#include <stdexcept>
#include <vector>

#include "goatplan/json_io.hpp"
#include "goatplan/schedule.hpp"
#include "goatplan/week_mask.hpp"

using namespace goatplan;

namespace {
constexpr int at(int hour, int minute) { return hour * 60 + minute; }

// addRange counts days from Monday = 0.
constexpr int kMon = 0;
constexpr int kTue = 1;
constexpr int kSun = 6;

Term smallFixture() { return loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json"); }
}  // namespace

TEST(WeekMask, StartsEmpty) {
    WeekMask mask;
    EXPECT_TRUE(mask.empty());
    EXPECT_EQ(mask.slotCount(), 0u);

    EXPECT_TRUE(maskOf(Section{}).empty());
}

TEST(WeekMask, FiftyMinutesFillTenSlots) {
    WeekMask mask;
    mask.addRange(kMon, at(9, 0), at(9, 50));
    EXPECT_FALSE(mask.empty());
    EXPECT_EQ(mask.slotCount(), 10u);
}

TEST(WeekMask, AMeetingFillsEachOfItsDays) {
    WeekMask mask;
    mask.addMeeting(Meeting{Monday | Tuesday | Thursday | Friday, at(9, 0), at(9, 50)});
    EXPECT_EQ(mask.slotCount(), 40u);
}

TEST(WeekMask, BackToBackClassesDoNotIntersect) {
    WeekMask first;
    WeekMask second;
    first.addRange(kMon, at(9, 0), at(9, 50));
    second.addRange(kMon, at(9, 50), at(10, 40));
    EXPECT_FALSE(first.intersects(second));
}

TEST(WeekMask, DifferentDaysDoNotIntersect) {
    WeekMask first;
    WeekMask second;
    first.addRange(kMon, at(9, 0), at(9, 50));
    second.addRange(kTue, at(9, 0), at(9, 50));
    EXPECT_FALSE(first.intersects(second));
}

TEST(WeekMask, RoundsOutToWholeSlots) {
    WeekMask first;
    first.addRange(kMon, at(9, 0), at(9, 52));
    EXPECT_EQ(first.slotCount(), 11u);

    WeekMask lateStart;
    lateStart.addRange(kMon, at(9, 2), at(9, 5));
    EXPECT_EQ(lateStart.slotCount(), 1u);

    // These two only touch at 09:52, but rounding puts both in the 09:50-09:55
    // slot, so the masks report a clash that the exact check does not.
    WeekMask second;
    second.addRange(kMon, at(9, 52), at(10, 0));
    EXPECT_FALSE(overlaps(Meeting{Monday, at(9, 0), at(9, 52)}, Meeting{Monday, at(9, 52), at(10, 0)}));
    EXPECT_TRUE(first.intersects(second));
}

TEST(WeekMask, RejectsRangesOutsideTheWeek) {
    WeekMask mask;
    EXPECT_THROW(mask.addRange(-1, at(9, 0), at(9, 50)), std::invalid_argument);
    EXPECT_THROW(mask.addRange(7, at(9, 0), at(9, 50)), std::invalid_argument);
    EXPECT_THROW(mask.addRange(kMon, -1, at(9, 50)), std::invalid_argument);
    EXPECT_THROW(mask.addRange(kMon, at(9, 50), at(9, 50)), std::invalid_argument);
    EXPECT_THROW(mask.addRange(kMon, at(10, 0), at(9, 50)), std::invalid_argument);
    EXPECT_THROW(mask.addRange(kMon, at(9, 0), at(24, 1)), std::invalid_argument);
    EXPECT_TRUE(mask.empty());
}

TEST(WeekMask, ReachesTheEndOfSunday) {
    WeekMask sunday;
    sunday.addRange(kSun, at(23, 59), at(24, 0));
    EXPECT_EQ(sunday.slotCount(), 1u);

    WeekMask fullWeek;
    for (int day = 0; day < 7; ++day) {
        fullWeek.addRange(day, at(0, 0), at(24, 0));
    }
    EXPECT_EQ(fullWeek.slotCount(), 2016u);
    EXPECT_TRUE(fullWeek.intersects(sunday));

    WeekMask combined;
    combined |= sunday;
    combined |= sunday;
    EXPECT_EQ(combined, sunday);
}

TEST(WeekMask, AnOptionIsTheUnionOfItsSections) {
    const Term term = smallFixture();
    const Course* course = term.findCourse("AE 2320");
    ASSERT_NE(course, nullptr);
    EXPECT_EQ(course->sections.size(), 4u);
    EXPECT_EQ(course->options.size(), 3u);

    for (const CourseOption& option : course->options) {
        ASSERT_EQ(option.size(), 2u);
        const Section& first = course->sections.at(option[0]);
        const Section& second = course->sections.at(option[1]);
        const bool lectureAndLab = (first.type == SectionType::Lecture && second.type == SectionType::Lab) ||
                                   (first.type == SectionType::Lab && second.type == SectionType::Lecture);
        EXPECT_TRUE(lectureAndLab) << first.id << " with " << second.id;

        WeekMask expected = maskOf(first);
        expected |= maskOf(second);
        EXPECT_EQ(maskOf(*course, option), expected);
    }
}

TEST(WeekMask, AgreesWithTheExactOverlapCheckOnTheFixture) {
    const Term term = smallFixture();
    std::vector<const Section*> sections;
    for (const Course& course : term.courses) {
        for (const Section& section : course.sections) {
            sections.push_back(&section);
        }
    }
    ASSERT_GE(sections.size(), 2u);

    for (std::size_t i = 0; i < sections.size(); ++i) {
        for (std::size_t j = i; j < sections.size(); ++j) {
            bool exact = false;
            for (const Meeting& a : sections[i]->meetings) {
                for (const Meeting& b : sections[j]->meetings) {
                    exact = exact || overlaps(a, b);
                }
            }
            EXPECT_EQ(maskOf(*sections[i]).intersects(maskOf(*sections[j])), exact)
                << sections[i]->id << " vs " << sections[j]->id;
        }
    }
}

TEST(WeekMask, EmptyDayHasNoSpan) {
    const DaySpan span = WeekMask{}.daySpan(kMon);
    EXPECT_EQ(span.first, -1);
    EXPECT_EQ(span.last, -1);
    EXPECT_EQ(span.filled, 0);
}

TEST(WeekMask, DaySpanOfOneClass) {
    WeekMask mask;
    mask.addRange(kMon, at(9, 0), at(9, 50));
    const DaySpan span = mask.daySpan(kMon);
    EXPECT_EQ(span.first, 108);
    EXPECT_EQ(span.last, 117);
    EXPECT_EQ(span.filled, 10);
    EXPECT_EQ(mask.daySpan(kTue).filled, 0);
}

// Slots 62-64 sit in two different words.
TEST(WeekMask, DaySpanAcrossAWordBoundary) {
    WeekMask mask;
    mask.addRange(kTue, at(5, 10), at(5, 25));
    const DaySpan span = mask.daySpan(kTue);
    EXPECT_EQ(span.first, 62);
    EXPECT_EQ(span.last, 64);
    EXPECT_EQ(span.filled, 3);
    EXPECT_EQ(mask.slotCount(), 3u);

    WeekMask justSlot64;
    justSlot64.addRange(kTue, at(5, 20), at(5, 25));
    EXPECT_TRUE(mask.intersects(justSlot64));
}

TEST(WeekMask, DaySpanReachesTheLastSlotOfSunday) {
    WeekMask mask;
    mask.addRange(kSun, at(23, 55), at(24, 0));
    const DaySpan span = mask.daySpan(kSun);
    EXPECT_EQ(span.first, 287);
    EXPECT_EQ(span.last, 287);
    EXPECT_EQ(span.filled, 1);
}

TEST(WeekMask, FullDaysDoNotSpillIntoEachOther) {
    WeekMask mask;
    mask.addRange(kTue, at(0, 0), at(24, 0));
    EXPECT_EQ(mask.daySpan(kMon).filled, 0);
    EXPECT_EQ(mask.daySpan(2).filled, 0);
    const DaySpan span = mask.daySpan(kTue);
    EXPECT_EQ(span.first, 0);
    EXPECT_EQ(span.last, 287);
    EXPECT_EQ(span.filled, 288);
    EXPECT_THROW((void)mask.daySpan(7), std::invalid_argument);
}

TEST(WeekMask, BreakSlotsCountOnlyLongBreaks) {
    WeekMask mask;
    EXPECT_EQ(mask.breakSlots(kTue, 0), 0);
    mask.addRange(kTue, at(5, 0), at(5, 10));
    EXPECT_EQ(mask.breakSlots(kTue, 0), 0);
    mask.addRange(kTue, at(5, 25), at(5, 30));
    mask.addRange(kTue, at(6, 0), at(6, 5));
    mask.addRange(kTue, at(6, 15), at(6, 20));
    EXPECT_EQ(mask.breakSlots(kTue, 0), 3 + 6 + 2);
    EXPECT_EQ(mask.breakSlots(kTue, 2), 3 + 6);
    EXPECT_EQ(mask.breakSlots(kTue, 3), 6);
    EXPECT_EQ(mask.breakSlots(kMon, 0), 0);
}

TEST(WeekMask, BreakSlotsSpanEveryWordOfTheDay) {
    WeekMask mask;
    mask.addRange(kSun, at(0, 0), at(0, 5));
    mask.addRange(kSun, at(23, 55), at(24, 0));
    EXPECT_EQ(mask.breakSlots(kSun, 2), 286);
    EXPECT_THROW((void)mask.breakSlots(7, 0), std::invalid_argument);
}
