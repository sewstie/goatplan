#pragma once

#include <stdexcept>
#include <string>
#include <string_view>

#include "goatplan/model.hpp"

namespace goatplan {
    struct TermLoadError : std::runtime_error {
        using std::runtime_error::runtime_error;
    };

    // Both throw TermLoadError if the text isn't a usable term file.
    Term parseTerm(std::string_view text);
    Term loadTermFile(const std::string& path);
}
