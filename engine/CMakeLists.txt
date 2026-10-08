cmake_minimum_required(VERSION 3.20)
project(goatplan_engine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Tests run natively only (not when building WebAssembly with emcmake).
if(EMSCRIPTEN)
    set(GOATPLAN_TESTS_DEFAULT OFF)
else()
    set(GOATPLAN_TESTS_DEFAULT ON)
endif()
option(GOATPLAN_BUILD_TESTS "Build GoogleTest unit tests" ${GOATPLAN_TESTS_DEFAULT})

# --- Core library: the scheduling engine -----------------------------------
add_library(goatplan_core
    src/schedule.cpp
)
target_include_directories(goatplan_core PUBLIC include)
if(MSVC)
    target_compile_options(goatplan_core PRIVATE /W4)
else()
    target_compile_options(goatplan_core PRIVATE -Wall -Wextra -Wpedantic)
endif()

# --- Command-line tool for trying the engine without the web app -----------
add_executable(goatplan_cli src/main.cpp)
target_link_libraries(goatplan_cli PRIVATE goatplan_core)

# --- Unit tests --------------------------------------------------------------
if(GOATPLAN_BUILD_TESTS)
    # Use an installed GoogleTest if there is one (e.g. `brew install googletest`
    # or `apt install libgtest-dev`); otherwise download it once.
    find_package(GTest QUIET)
    if(NOT GTest_FOUND)
        include(FetchContent)
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
        tests/schedule_test.cpp
    )
    target_link_libraries(goatplan_tests PRIVATE goatplan_core GTest::gtest_main)

    include(GoogleTest)
    gtest_discover_tests(goatplan_tests)
endif()
