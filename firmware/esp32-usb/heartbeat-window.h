#pragma once
#include <stdint.h>

class HeartbeatWindow {
 public:
  void sync(uint32_t now) {
    lastHeartbeat_ = now;
    armed_ = true;
  }

  bool renew(uint32_t now) {
    if (!active(now)) return false;
    lastHeartbeat_ = now;
    return true;
  }

  bool active(uint32_t now) {
    if (armed_ && uint32_t(now - lastHeartbeat_) >= 3000) stop();
    return armed_;
  }

  void stop() { armed_ = false; }

 private:
  uint32_t lastHeartbeat_ = 0;
  bool armed_ = false;
};
