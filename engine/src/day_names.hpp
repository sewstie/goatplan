#pragma once

#include <array>
#include <optional>
#include <string_view>
#include <utility>

#include "goatplan/model.hpp"

namespace goatplan {
    inline std::optional<Day> dayFromName(std::string_view name) {
        static constexpr std::array<std::pair<std::string_view, Day>, 7> days{{
            {"Mon", Monday}, {"Tue", Tuesday}, {"Wed", Wednesday}, {"Thu", Thursday},
            {"Fri", Friday}, {"Sat", Saturday}, {"Sun", Sunday},
        }};
        for (const auto& [dayName, day] : days) {
            if (dayName == name) {
                return day;
            }
        }
        return std::nullopt;
    }
}
