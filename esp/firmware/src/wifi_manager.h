// ============================================================
// GridSenti — Wi-Fi Manager
// ============================================================
// Handles connecting the ESP8266 to a Wi-Fi network.
// TODO: Replace hardcoded credentials with WiFiManager or NVS
//       provisioning before deploying in the field.
// ============================================================

#pragma once
#include <ESP8266WiFi.h>
#include "config.h"

namespace WiFiManager {

  /**
   * Connect to the configured Wi-Fi network.
   * Blocks until connected or timeout is reached.
   *
   * @return true if connected successfully, false on timeout.
   */
  inline bool connect() {
    Serial.print("[WiFi] Connecting to: ");
    Serial.println(WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
      if (millis() - start > WIFI_CONNECT_TIMEOUT_MS) {
        Serial.println("[WiFi] Connection timed out!");
        return false;
      }
      delay(500);
      Serial.print(".");
    }

    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  /**
   * Check whether Wi-Fi is still connected.
   */
  inline bool isConnected() {
    return WiFi.status() == WL_CONNECTED;
  }

  /**
   * Return signal strength in dBm.
   */
  inline int32_t getRSSI() {
    return WiFi.RSSI();
  }

} // namespace WiFiManager
