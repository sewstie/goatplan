// Command-line entry point for the GoatPlan engine.
// For now it runs a tiny built-in example; later it will read course JSON
// and print every conflict-free schedule.

#include <iostream>

#include "goatplan/schedule.hpp"

int main() {
    using namespace goatplan;

    const Section calc{"MA 1021-A01", "MA 1021", "Example Prof", {{Mon | Tue | Thu | Fri, 9 * 60, 9 * 60 + 50}}};
    const Section cs{"CS 1101-A01", "CS 1101", "Example Prof", {{Mon | Tue | Thu | Fri, 9 * 60 + 30, 10 * 60 + 20}}};
    const Section lab{"CS 1101-AX01", "CS 1101", "Example Prof", {{Wed, 9 * 60, 9 * 60 + 50}}};

    std::cout << "GoatPlan engine v0.1.0\n";
    std::cout << calc.id << " vs " << cs.id << ": " << (conflicts(calc, cs) ? "conflict" : "ok") << '\n';
    std::cout << calc.id << " vs " << lab.id << ": " << (conflicts(calc, lab) ? "conflict" : "ok") << '\n';
    return 0;
}
