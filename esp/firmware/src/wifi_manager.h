/**
 * GridSenti — ESP8266 Wi-Fi Manager
 * =================================
 * Connects to configured Wi-Fi network and maintains connection in loop.
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <ESP8266WiFi.h>
#include "config.h"

class WiFiManager {
private:
    unsigned long lastReconnectAttempt = 0;

public:
    bool connectWiFi() {
        Serial.print("[WiFi] Connecting to: ");
        Serial.println(WIFI_SSID);

        WiFi.mode(WIFI_STA);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            Serial.print(".");
            attempts++;
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.println();
            Serial.print("[WiFi] Connected! Local IP: ");
            Serial.println(WiFi.localIP());
            return true;
        } else {
            Serial.println();
            Serial.println("[WiFi] Connection failed. Will retry in loop.");
            return false;
        }
    }

    void maintainWiFi() {
        if (WiFi.status() != WL_CONNECTED) {
            unsigned long now = millis();
            if (now - lastReconnectAttempt > 10000) {
                lastReconnectAttempt = now;
                Serial.println("[WiFi] Reconnecting...");
                WiFi.reconnect();
            }
        }
    }

    int32_t getRSSI() {
        return WiFi.RSSI();
    }
};

#endif // WIFI_MANAGER_H
