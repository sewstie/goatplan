#include "goatplan/schedule.hpp"

namespace goatplan {
    bool overlaps(const Meeting& a, const Meeting& b) {
        if ((a.days & b.days) == 0) {
            return false;
        }
        return a.start < b.end && b.start < a.end;
    }
}
