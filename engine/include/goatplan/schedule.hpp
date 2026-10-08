#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace goatplan {

// Days of the week as bit flags, so one meeting can cover several days
// (e.g. "M-T-R-F" = Mon | Tue | Thu | Fri).
enum Day : std::uint8_t {
    Mon = 1u << 0,
    Tue = 1u << 1,
    Wed = 1u << 2,
    Thu = 1u << 3,
    Fri = 1u << 4,
    Sat = 1u << 5,
    Sun = 1u << 6,
};

// One recurring block of class time. Times are minutes after midnight,
// with an exclusive end: 9:00-9:50 AM is {540, 590}.
struct Meeting {
    std::uint8_t days = 0;
    int start = 0;
    int end = 0;
};

// One choosable option for a course, e.g. a lecture, or a lecture plus its lab.
struct Section {
    std::string id;          // e.g. "AE 2320-CL01/CX01"
    std::string course;      // e.g. "AE 2320"
    std::string instructor;  // may be empty when not assigned
    std::vector<Meeting> meetings;
};

// True if two meetings share at least one day and their times overlap.
bool overlaps(const Meeting& a, const Meeting& b);

// True if any meeting of `a` overlaps any meeting of `b`.
bool conflicts(const Section& a, const Section& b);

}  // namespace goatplan
