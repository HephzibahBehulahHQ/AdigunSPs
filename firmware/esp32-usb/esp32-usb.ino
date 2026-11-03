#include <Arduino.h>
#include <ArduinoJson.h>
#include <soc/gpio_reg.h>
#include <soc/soc.h>
#include "heartbeat-window.h"

constexpr uint8_t relayPins[] = {16, 17, 18, 19};
constexpr uint8_t emergencyStop = 4;
constexpr uint32_t relayMask = (1UL << 16) | (1UL << 17) | (1UL << 18) | (1UL << 19);
HeartbeatWindow heartbeat;
hw_timer_t* watchdog = nullptr;
volatile bool watchdogExpired = false;

void ARDUINO_ISR_ATTR watchdogInterrupt() {
  REG_WRITE(GPIO_OUT_W1TS_REG, relayMask);
  watchdogExpired = true;
}
bool hardFault = false;
char frame[128];
size_t length = 0;
bool overflow = false;

bool stopOutputs() {
  heartbeat.stop();
  if (watchdog) timerStop(watchdog);
  for (auto pin : relayPins) digitalWrite(pin, HIGH);
  for (auto pin : relayPins) {
    if (digitalRead(pin) != HIGH) return false;
  }
  return true;
}

void checkEmergencyStop() {
  if (hardFault || digitalRead(emergencyStop) != HIGH) return;
  hardFault = true;
  stopOutputs();
  Serial.println("{\"type\":\"HARD_FAULT\"}");
}

void handleFrame() {
  JsonDocument message;
  if (deserializeJson(message, frame, length) || !message["id"].is<uint32_t>()) return;
  const uint32_t id = message["id"];
  if (id == 0) return;
  const char* command = message["command"] | "";
  const char* reason = nullptr;
  checkEmergencyStop();
  if (strcmp(command, "STOP_ALL") == 0) {
    if (!stopOutputs()) reason = "GPIO readback failed";
  } else if (hardFault) {
    reason = "HARD_FAULT";
  } else if (strcmp(command, "SYNC") == 0) {
    if (!watchdog) reason = "Watchdog unavailable";
    else if (stopOutputs()) {
      watchdogExpired = false;
      timerWrite(watchdog, 0);
      timerAlarm(watchdog, 3000000, false, 0);
      timerStart(watchdog);
      heartbeat.sync(millis());
    }
    else reason = "GPIO readback failed";
  } else if (strcmp(command, "HEARTBEAT") == 0) {
    if (watchdogExpired || !heartbeat.renew(millis())) {
      stopOutputs();
      reason = "SYNC required";
    } else {
      timerWrite(watchdog, 0);
    }
  } else {
    reason = "Unsupported command";
  }

  JsonDocument reply;
  reply["type"] = reason ? "NACK" : "ACK";
  reply["id"] = id;
  if (reason) reply["reason"] = reason;
  serializeJson(reply, Serial);
  Serial.println();
}

void setup() {
  for (auto pin : relayPins) {
    digitalWrite(pin, HIGH);
    pinMode(pin, OUTPUT);
  }
  // GPIO4 requires a defined inactive LOW from the isolated monitor circuit.
  pinMode(emergencyStop, INPUT_PULLDOWN);
  Serial.begin(115200);
  watchdog = timerBegin(1000000);
  if (watchdog) timerAttachInterrupt(watchdog, watchdogInterrupt);
  stopOutputs();
}

void loop() {
  checkEmergencyStop();
  if (watchdogExpired || !heartbeat.active(millis())) stopOutputs();
  if (!Serial.available()) return;
  const int byte = Serial.read();
  if (byte == '\n') {
    if (!overflow && length) handleFrame();
    length = 0;
    overflow = false;
  } else if (length < sizeof(frame)) {
    frame[length++] = char(byte);
  } else {
    overflow = true;
  }
}
