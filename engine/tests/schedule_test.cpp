#include <gtest/gtest.h>

#include "goatplan/schedule.hpp"

using namespace goatplan;

namespace {
constexpr int at(int hour, int minute) { return hour * 60 + minute; }
}  // namespace

TEST(Overlaps, SameDayOverlappingTimes) {
    Meeting a{Monday, at(9, 0), at(9, 50)};
    Meeting b{Monday, at(9, 30), at(10, 20)};
    EXPECT_TRUE(overlaps(a, b));
    EXPECT_TRUE(overlaps(b, a));
}

TEST(Overlaps, DifferentDaysNeverOverlap) {
    Meeting a{Monday | Wednesday, at(9, 0), at(9, 50)};
    Meeting b{Tuesday | Thursday, at(9, 0), at(9, 50)};
    EXPECT_FALSE(overlaps(a, b));
}

TEST(Overlaps, BackToBackClassesDoNotOverlap) {
    Meeting a{Friday, at(9, 0), at(10, 0)};
    Meeting b{Friday, at(10, 0), at(11, 0)};
    EXPECT_FALSE(overlaps(a, b));
}

TEST(Overlaps, SharesOneDayOutOfSeveral) {
    Meeting a{Monday | Tuesday | Thursday | Friday, at(14, 0), at(14, 50)};
    Meeting b{Thursday, at(14, 0), at(15, 50)};
    EXPECT_TRUE(overlaps(a, b));
}
