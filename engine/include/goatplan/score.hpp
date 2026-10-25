#pragma once
#include "goatplan/week_mask.hpp"

namespace goatplan {

struct ScoreWeights {
    int earlyCutoff = 10 * 60;
    int perEarlyMinute = 3;
    int lateCutoff = 24 * 60;
    int perLateMinute = 0;
    int perGapMinute = 1;
    int perDay = 60;
};

struct Score {
    int earlyMinutes = 0;
    int lateMinutes = 0;
    int gapMinutes = 0;
    int days = 0; 
    int total = 0; 
};

Score scoreOf(const WeekMask& week, const ScoreWeights& weights = {});

}  // namespace goatplan
