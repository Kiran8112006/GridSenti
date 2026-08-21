// ============================================================
// GridSenti — ESP8266 Firmware Entry Point
// ============================================================
// ⚠ SAFETY NOTICE:
//   This firmware uses SIMULATED electrical telemetry only.
//   Do NOT connect the ESP8266 to mains electricity,
//   11kV, 22kV, 33kV, or any high-voltage source.
// ============================================================

#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "node_identity.h"
#include "fault_simulator.h"
#include "telemetry.h"

// ── Timing state ─────────────────────────────────────────────
static unsigned long lastTelemetryMs  = 0;
static unsigned long lastHeartbeatMs  = 0;

void setup() {
  Serial.begin(BAUD_RATE);
  delay(500);

  Serial.println();
  Serial.println("============================================");
  Serial.println("  GridSenti — Edge Node Firmware v" FIRMWARE_VERSION);
  Serial.println("  Node ID: " NODE_ID);
  Serial.println("  WARNING: Simulated telemetry only.");
  Serial.println("  No real sensors connected.");
  Serial.println("============================================");

  // Connect to Wi-Fi
  if (!WiFiManager::connect()) {
    Serial.println("[Setup] Wi-Fi failed. Entering error loop.");
    // Blink LED to indicate error (built-in LED on D4)
    pinMode(LED_BUILTIN, OUTPUT);
    while (true) {
      digitalWrite(LED_BUILTIN, LOW);
      delay(200);
      digitalWrite(LED_BUILTIN, HIGH);
      delay(200);
    }
  }

  Serial.println("[Setup] Node ready. Starting telemetry loop.");
}

void loop() {
  unsigned long now = millis();

  // ── Reconnect Wi-Fi if dropped ──────────────────────────
  if (!WiFiManager::isConnected()) {
    Serial.println("[Loop] Wi-Fi lost. Reconnecting…");
    WiFiManager::connect();
    return;
  }

  // ── Send heartbeat ───────────────────────────────────────
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    Telemetry::sendHeartbeat();
  }

  // ── Send telemetry ───────────────────────────────────────
  if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = now;
    Telemetry::sendTelemetry();
  }
}
