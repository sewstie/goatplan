#pragma once

#include <memory>
#include <string>
#include <string_view>

namespace goatplan {

class AuditEngine {
public:
    AuditEngine();
    std::string handle(std::string_view requestJson) const;

private:
    struct Impl;
    std::shared_ptr<Impl> impl_;
};

}
