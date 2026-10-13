#pragma once
#include <bitset>
#include <cstddef>
#include "goatplan/model.hpp"

namespace goatplan {
    inline constexpr int kSlotMinutes = 5;
    inline constexpr int kSlotsPerDay = 24 * 60 / kSlotMinutes;
    inline constexpr int kSlotsPerWeek = 7 * kSlotsPerDay;

    class WeekMask {
        public:
            void addRange(int dayIndex, int startMinute, int endMinute);
            void addMeeting(const Meeting& m);
            bool intersects(const WeekMask& other) const { return (bits_ & other.bits_).any(); }
            WeekMask& operator|=(const WeekMask& other) { bits_ |= other.bits_; return *this; }
            bool empty() const { return bits_.none(); }
            std::size_t slotCount() const { return bits_.count(); }
            bool operator==(const WeekMask&) const = default;
        private:
            std::bitset<kSlotsPerWeek> bits_;
    };

    WeekMask maskOf(const Section& section);
    WeekMask maskOf(const Course& course, const CourseOption& option);

}