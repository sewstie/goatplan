cmake_minimum_required(VERSION 3.20)
project(goatplan_engine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include(FetchContent)

# The engine reports problems by throwing, and without WebAssembly exceptions
# every throw in the browser would abort instead of being caught.
if(EMSCRIPTEN)
    add_compile_options(-fwasm-exceptions)
    add_link_options(-fwasm-exceptions)
endif()

option(GOATPLAN_BUILD_TESTS "Build GoogleTest unit tests (native builds only)" ON)

# --- Core library: the scheduling engine -----------------------------------
add_library(goatplan_core
    src/diagnose.cpp
    src/engine.cpp
    src/filters.cpp
    src/groups.cpp
    src/json_io.cpp
    src/schedule.cpp
    src/score.cpp
    src/solver.cpp
    src/week_mask.cpp
)
target_include_directories(goatplan_core PUBLIC include)
if(MSVC)
    target_compile_options(goatplan_core PRIVATE /W4)
else()
    target_compile_options(goatplan_core PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Use an installed nlohmann_json if there is one (e.g. `brew install
# nlohmann-json`); otherwise download it once.
find_package(nlohmann_json 3.12 QUIET)
if(NOT nlohmann_json_FOUND)
    FetchContent_Declare(
        json
        URL https://github.com/nlohmann/json/releases/download/v3.12.0/json.tar.xz
        DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    )
    FetchContent_MakeAvailable(json)
endif()
target_link_libraries(goatplan_core PRIVATE nlohmann_json::nlohmann_json)

# --- Command-line tool for trying the engine without the web app -----------
if(NOT EMSCRIPTEN)
    add_executable(goatplan_cli src/main.cpp)
    target_link_libraries(goatplan_cli PRIVATE goatplan_core nlohmann_json::nlohmann_json)
endif()

# --- Unit tests --------------------------------------------------------------
if(GOATPLAN_BUILD_TESTS AND NOT EMSCRIPTEN)
    # Use an installed GoogleTest if there is one (e.g. `brew install googletest`
    # or `apt install libgtest-dev`); otherwise download it once.
    find_package(GTest QUIET)
    if(NOT GTest_FOUND)
        FetchContent_Declare(
            googletest
            URL https://github.com/google/googletest/archive/refs/tags/v1.17.0.tar.gz
            DOWNLOAD_EXTRACT_TIMESTAMP TRUE
        )
        # Keep GoogleTest from overriding our compiler/linker settings on Windows.
        set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
        FetchContent_MakeAvailable(googletest)
    endif()

    enable_testing()
    add_executable(goatplan_tests
        tests/diagnose_test.cpp
        tests/engine_api_test.cpp
        tests/filters_test.cpp
        tests/groups_test.cpp
        tests/json_io_test.cpp
        tests/schedule_test.cpp
        tests/score_test.cpp
        tests/solver_test.cpp
        tests/week_mask_test.cpp
    )
    target_link_libraries(goatplan_tests PRIVATE
        goatplan_core
        nlohmann_json::nlohmann_json
        GTest::gtest_main
    )

    # An absolute path, so tests find the fixtures from any folder.
    cmake_path(SET GOATPLAN_FIXTURES NORMALIZE "${CMAKE_CURRENT_SOURCE_DIR}/../data/fixtures")
    target_compile_definitions(goatplan_tests PRIVATE
        GOATPLAN_FIXTURES="${GOATPLAN_FIXTURES}"
        GOATPLAN_GOLDEN_DIR="${CMAKE_CURRENT_SOURCE_DIR}/tests/golden")

    include(GoogleTest)
    gtest_discover_tests(goatplan_tests)
endif()

# --- WebAssembly module for the web app (emcmake only) ----------------------
if(EMSCRIPTEN)
    add_executable(goatplan_wasm src/wasm_bindings.cpp)
    target_link_libraries(goatplan_wasm PRIVATE goatplan_core)
    target_link_options(goatplan_wasm PRIVATE
        -lembind
        -O3
        -sMODULARIZE=1
        -sEXPORT_ES6=1
        -sEXPORT_NAME=createGoatplan
        -sENVIRONMENT=worker,node
        -sALLOW_MEMORY_GROWTH=1
    )
    cmake_path(SET GOATPLAN_WEB_ENGINE NORMALIZE "${CMAKE_CURRENT_SOURCE_DIR}/../apps/web/public/engine")
    set_target_properties(goatplan_wasm PROPERTIES
        OUTPUT_NAME goatplan
        SUFFIX ".mjs"
        RUNTIME_OUTPUT_DIRECTORY "${GOATPLAN_WEB_ENGINE}"
    )
endif()
