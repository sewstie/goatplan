#include <gtest/gtest.h>

#include "goatplan/schedule.hpp"

using namespace goatplan;

namespace {
constexpr int at(int hour, int minute) { return hour * 60 + minute; }
}  // namespace

TEST(Overlaps, SameDayOverlappingTimes) {
    Meeting a{Mon, at(9, 0), at(9, 50)};
    Meeting b{Mon, at(9, 30), at(10, 20)};
    EXPECT_TRUE(overlaps(a, b));
    EXPECT_TRUE(overlaps(b, a));
}

TEST(Overlaps, DifferentDaysNeverOverlap) {
    Meeting a{Mon | Wed, at(9, 0), at(9, 50)};
    Meeting b{Tue | Thu, at(9, 0), at(9, 50)};
    EXPECT_FALSE(overlaps(a, b));
}

TEST(Overlaps, BackToBackClassesDoNotOverlap) {
    Meeting a{Fri, at(9, 0), at(10, 0)};
    Meeting b{Fri, at(10, 0), at(11, 0)};
    EXPECT_FALSE(overlaps(a, b));
}

TEST(Overlaps, SharesOneDayOutOfSeveral) {
    Meeting a{Mon | Tue | Thu | Fri, at(14, 0), at(14, 50)};
    Meeting b{Thu, at(14, 0), at(15, 50)};
    EXPECT_TRUE(overlaps(a, b));
}

TEST(Conflicts, LectureAndLabChecksEveryMeeting) {
    Section lectureWithLab{"AE 2320-CL01/CX01", "AE 2320", "Ye Lu",
                           {{Mon | Tue | Wed | Thu | Fri, at(9, 0), at(9, 50)}, {Thu, at(14, 0), at(14, 50)}}};
    Section afternoonClass{"X 1000-C01", "X 1000", "", {{Thu, at(14, 30), at(15, 20)}}};
    Section eveningClass{"Y 1000-C01", "Y 1000", "", {{Thu, at(16, 0), at(16, 50)}}};

    EXPECT_TRUE(conflicts(lectureWithLab, afternoonClass));
    EXPECT_FALSE(conflicts(lectureWithLab, eveningClass));
}
