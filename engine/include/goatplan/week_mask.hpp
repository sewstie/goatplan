#pragma once
#include <array>
#include <cstddef>
#include <cstdint>
#include "goatplan/model.hpp"

namespace goatplan {
    inline constexpr int kSlotMinutes = 5;
    inline constexpr int kSlotsPerDay = 24 * 60 / kSlotMinutes;
    inline constexpr int kSlotsPerWeek = 7 * kSlotsPerDay;

    inline constexpr std::size_t kWordsPerDay = 5;
    inline constexpr std::size_t kWordsPerWeek = 7 * kWordsPerDay;

    struct DaySpan {
        int first = -1;
        int last = -1;
        int filled = 0;
    };

    class WeekMask {
        public:
            void addRange(int dayIndex, int startMinute, int endMinute);
            void addMeeting(const Meeting& m);
            bool intersects(const WeekMask& other) const {
                for (std::size_t i = 0; i < kWordsPerWeek; ++i) {
                    if ((words_[i] & other.words_[i]) != 0) {
                        return true;
                    }
                }
                return false;
            }
            WeekMask& operator|=(const WeekMask& other) {
                for (std::size_t i = 0; i < kWordsPerWeek; ++i) {
                    words_[i] |= other.words_[i];
                }
                return *this;
            }
            bool empty() const;
            std::size_t slotCount() const;
            DaySpan daySpan(int dayIndex) const;
            bool operator==(const WeekMask&) const = default;
        private:
            std::array<std::uint64_t, kWordsPerWeek> words_{};
    };

    WeekMask maskOf(const Section& section);
    WeekMask maskOf(const Course& course, const CourseOption& option);

}
