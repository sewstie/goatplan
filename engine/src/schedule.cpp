#include "goatplan/schedule.hpp"

namespace goatplan {

bool overlaps(const Meeting& a, const Meeting& b) {
    if ((a.days & b.days) == 0) {
        return false;
    }
    return a.start < b.end && b.start < a.end;
}

bool conflicts(const Section& a, const Section& b) {
    for (const Meeting& ma : a.meetings) {
        for (const Meeting& mb : b.meetings) {
            if (overlaps(ma, mb)) {
                return true;
            }
        }
    }
    return false;
}

}  // namespace goatplan
