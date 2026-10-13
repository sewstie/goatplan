#include "goatplan/week_mask.hpp"

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
    const int dayOffset = dayIndex * kSlotsPerDay;

    for (int slot = firstSlot; slot < pastLastSlot; ++slot) {
        bits_.set(static_cast<std::size_t>(dayOffset + slot));
    }
    }

    void WeekMask::addMeeting(const Meeting& m) {
        for (int dayIndex = 0; dayIndex < 7; ++dayIndex) {
            if ((m.days & (1u << dayIndex)) != 0) {
                addRange(dayIndex, m.start, m.end);
            }
        }
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