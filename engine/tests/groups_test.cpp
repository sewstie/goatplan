#include <gtest/gtest.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <random>
#include <vector>

#include "goatplan/groups.hpp"

using namespace goatplan;

namespace {
using Members = std::vector<std::size_t>;

WeekMask mondayAt(int start) {
    WeekMask mask;
    mask.addRange(0, start, start + 50);
    return mask;
}

CourseChoices choicesFromMasks(const std::vector<WeekMask>& masks) {
    CourseChoices choice;
    for (const WeekMask& mask : masks) {
        choice.options.push_back(choice.options.size());
        choice.masks.push_back(mask);
        choice.openSeats.push_back(-1);
    }
    return choice;
}
}

TEST(Groups, DifferentTimesGetOneGroupEach) {
    const auto groups = groupByTime({choicesFromMasks({mondayAt(600), mondayAt(540), mondayAt(660)})});
    ASSERT_EQ(groups.size(), 1u);
    ASSERT_EQ(groups[0].groups.size(), 3u);
    EXPECT_EQ(groups[0].groups[0].mask, mondayAt(600));
    EXPECT_EQ(groups[0].groups[1].mask, mondayAt(540));
    EXPECT_EQ(groups[0].groups[2].mask, mondayAt(660));
    for (std::size_t g = 0; g < 3; ++g) EXPECT_EQ(groups[0].groups[g].members, Members({g}));
}

TEST(Groups, SameTimeSharesAGroup) {
    const auto groups = groupByTime({choicesFromMasks({mondayAt(600), mondayAt(540), mondayAt(600)})});
    ASSERT_EQ(groups[0].groups.size(), 2u);
    EXPECT_EQ(groups[0].groups[0].mask, mondayAt(600));
    EXPECT_EQ(groups[0].groups[0].members, Members({0, 2}));
    EXPECT_EQ(groups[0].groups[1].members, Members({1}));
}

TEST(Groups, KeepsCoursesApartAndInOrder) {
    const auto groups = groupByTime({
        choicesFromMasks({mondayAt(600), mondayAt(600)}),
        CourseChoices{},
        choicesFromMasks({mondayAt(600)})
    });
    ASSERT_EQ(groups.size(), 3u);
    EXPECT_EQ(groups[0].groups.size(), 1u);
    EXPECT_TRUE(groups[1].groups.empty());
    EXPECT_EQ(groups[2].groups.size(), 1u);
}

TEST(Groups, EveryOptionAppearsExactlyOnce) {
    for (std::uint32_t seed = 0; seed < 20; ++seed) {
        SCOPED_TRACE(seed);
        std::mt19937 rng(seed);
        std::vector<WeekMask> masks;
        for (int i = 0; i < 30; ++i) masks.push_back(mondayAt(480 + static_cast<int>(rng() % 4) * 60));
        const CourseChoices choice = choicesFromMasks(masks);
        const auto groups = groupByTime({choice});

        std::vector<int> seen(masks.size(), 0);
        std::size_t members = 0;
        for (const TimeGroup& group : groups[0].groups) {
            ASSERT_FALSE(group.members.empty());
            EXPECT_TRUE(std::is_sorted(group.members.begin(), group.members.end()));
            for (std::size_t member : group.members) {
                EXPECT_EQ(choice.masks[member], group.mask);
                ++seen[member];
            }
            members += group.members.size();
        }
        EXPECT_EQ(members, masks.size());
        for (std::size_t a = 0; a < groups[0].groups.size(); ++a) {
            for (std::size_t b = a + 1; b < groups[0].groups.size(); ++b) {
                EXPECT_NE(groups[0].groups[a].mask, groups[0].groups[b].mask);
            }
        }
        for (int count : seen) EXPECT_EQ(count, 1);
        EXPECT_LE(groups[0].groups.size(), 4u);
    }
}
