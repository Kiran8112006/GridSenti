// ============================================================
// GridSenti — Telemetry
// ============================================================
// Builds and sends telemetry JSON payloads to the backend.
// TODO: Add MQTT transport option in later phase.
// ============================================================

#pragma once
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "node_identity.h"
#include "fault_simulator.h"

namespace Telemetry {

  /**
   * Build a telemetry JSON document from current simulation state.
   *
   * NOTE: All values are SIMULATED. No real sensors attached.
   */
  inline void buildPayload(JsonDocument& doc, FaultSimulator::SimMode mode) {
    doc["nodeId"]          = NodeIdentity::getId();
    doc["firmwareVersion"] = NodeIdentity::getFirmwareVersion();
    doc["current"]         = FaultSimulator::getCurrent(mode);
    doc["voltage"]         = FaultSimulator::getVoltage(mode);
    doc["waveformAnomaly"] = FaultSimulator::getWaveformAnomaly(mode);
    doc["status"]          = FaultSimulator::getStatusString(mode);
    doc["rssi"]            = WiFi.RSSI();
    doc["simulated"]       = true; // Always flag as simulated
  }

  /**
   * Build a heartbeat JSON document.
   */
  inline void buildHeartbeat(JsonDocument& doc) {
    doc["nodeId"]          = NodeIdentity::getId();
    doc["firmwareVersion"] = NodeIdentity::getFirmwareVersion();
    doc["rssi"]            = WiFi.RSSI();
    doc["uptime"]          = millis();
  }

  /**
   * Send a JSON payload to the given endpoint via HTTP POST.
   *
   * @return HTTP response code, or -1 on failure.
   */
  inline int postJSON(const char* endpoint, const String& payload) {
    WiFiClient client;
    HTTPClient http;

    String url = String("http://") + BACKEND_HOST + ":" +
                 String(BACKEND_PORT) + endpoint;

    if (!http.begin(client, url)) {
      Serial.println("[HTTP] Connection failed");
      return -1;
    }

    http.addHeader("Content-Type", "application/json");
    int code = http.POST(payload);
    http.end();
    return code;
  }

  /**
   * Send telemetry to the backend.
   */
  inline void sendTelemetry() {
    FaultSimulator::SimMode mode = FaultSimulator::getCurrentMode();

    JsonDocument doc;
    buildPayload(doc, mode);

    String payload;
    serializeJson(doc, payload);

    Serial.print("[Telemetry] Sending: ");
    Serial.println(payload);

    int code = postJSON(TELEMETRY_ENDPOINT, payload);
    Serial.print("[Telemetry] Response: ");
    Serial.println(code);
  }

  /**
   * Send heartbeat to the backend.
   */
  inline void sendHeartbeat() {
    JsonDocument doc;
    buildHeartbeat(doc);

    String payload;
    serializeJson(doc, payload);

    Serial.print("[Heartbeat] Sending: ");
    Serial.println(payload);

    int code = postJSON(HEARTBEAT_ENDPOINT, payload);
    Serial.print("[Heartbeat] Response: ");
    Serial.println(code);
  }

} // namespace Telemetry
