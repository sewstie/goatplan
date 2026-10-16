#include "goatplan/week_mask.hpp"

#include <bit>
#include <stdexcept>

namespace goatplan {
    void WeekMask::addRange(int dayIndex, int startMinute, int endMinute) {
        if (dayIndex < 0 || dayIndex >= 7 ||
            startMinute < 0 || startMinute >= endMinute || endMinute > 1440) {
            throw std::invalid_argument(
                "WeekMask::addRange: require day 0..6 and 0 <= start < end <= 1440");
        }
        const int firstSlot = startMinute / kSlotMinutes;
        const int pastLastSlot = (endMinute + kSlotMinutes - 1) / kSlotMinutes;
        std::uint64_t* day = &words_[static_cast<std::size_t>(dayIndex) * kWordsPerDay];

        for (int slot = firstSlot; slot < pastLastSlot; ++slot) {
            day[slot / 64] |= std::uint64_t{1} << (slot % 64);
        }
    }

    void WeekMask::addMeeting(const Meeting& m) {
        for (int dayIndex = 0; dayIndex < 7; ++dayIndex) {
            if ((m.days & (1u << dayIndex)) != 0) {
                addRange(dayIndex, m.start, m.end);
            }
        }
    }

    bool WeekMask::empty() const {
        for (std::uint64_t word : words_) {
            if (word != 0) {
                return false;
            }
        }
        return true;
    }

    std::size_t WeekMask::slotCount() const {
        std::size_t count = 0;
        for (std::uint64_t word : words_) {
            count += static_cast<std::size_t>(std::popcount(word));
        }
        return count;
    }

    DaySpan WeekMask::daySpan(int dayIndex) const {
        if (dayIndex < 0 || dayIndex >= 7) {
            throw std::invalid_argument("WeekMask::daySpan: require day 0..6");
        }
        const std::uint64_t* day = &words_[static_cast<std::size_t>(dayIndex) * kWordsPerDay];
        DaySpan span;
        for (std::size_t w = 0; w < kWordsPerDay; ++w) {
            span.filled += std::popcount(day[w]);
        }
        if (span.filled == 0) {
            return span;
        }
        std::size_t first = 0;
        while (day[first] == 0) {
            ++first;
        }
        span.first = static_cast<int>(first) * 64 + std::countr_zero(day[first]);
        std::size_t last = kWordsPerDay - 1;
        while (day[last] == 0) {
            --last;
        }
        span.last = static_cast<int>(last) * 64 + 63 - std::countl_zero(day[last]);
        return span;
    }

    WeekMask maskOf(const Section& section) {
        WeekMask mask;
        for (const Meeting& meeting : section.meetings) {
            mask.addMeeting(meeting);
        }
        return mask;
    }

    WeekMask maskOf(const Course& course, const CourseOption& option) {
        WeekMask mask;
        for (std::size_t index : option) {
            mask |= maskOf(course.sections.at(index));
        }
        return mask;
    }
}
