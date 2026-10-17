#include <string>

#include <emscripten/bind.h>

#include "goatplan/engine.hpp"

namespace {
    goatplan::Engine engine;

    std::string loadTerm(const std::string& termJson) {
        return engine.loadTermJson(termJson);
    }

    std::string handle(const std::string& requestJson) {
        return engine.handle(requestJson);
    }
}

EMSCRIPTEN_BINDINGS(goatplan) {
    emscripten::function("loadTerm", &loadTerm);
    emscripten::function("handle", &handle);
}
