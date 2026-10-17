#pragma once
#include <optional>
#include <string>
#include <string_view>
#include "goatplan/model.hpp"

namespace goatplan {

class Engine {
public:
    void loadTerm(std::string_view termJson);
    std::string loadTermJson(std::string_view termJson);
    bool hasTerm() const { return term_.has_value(); }

    std::string handle(std::string_view requestJson) const;

private:
    std::optional<Term> term_;
};

}
