/**
 * GridSenti — ESP8266 Telemetry Transmitter
 * =========================================
 * Constructs JSON payload and performs HTTP POST request to FastAPI backend.
 */

#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include "config.h"

class TelemetryTransmitter {
private:
    WiFiClient wifiClient;

public:
    bool sendTelemetry(const DatasetSample &sample, const String &mode) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[Telemetry] Error: Wi-Fi not connected.");
            return false;
        }

        HTTPClient http;
        String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + String(TELEMETRY_PATH);

        http.begin(wifiClient, url);
        http.addHeader("Content-Type", "application/json");

        // Construct JSON matching backend TelemetryRequest schema
        StaticJsonDocument<256> doc;
        doc["nodeId"] = NODE_ID;
        doc["timestamp"] = "2026-08-22T01:00:00Z"; // ESP timestamp placeholder
        doc["ea"] = sample.ea;
        doc["eb"] = sample.eb;
        doc["ec"] = sample.ec;
        doc["simulated"] = true; // Hardcoded safety indicator
        doc["simulationMode"] = mode;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        Serial.print("[POST] ");
        Serial.print(url);
        Serial.print(" -> ");
        Serial.println(jsonPayload);

        int httpResponseCode = http.POST(jsonPayload);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.print("[HTTP ");
            Serial.print(httpResponseCode);
            Serial.print("] Response: ");
            Serial.println(response);
            http.end();
            return (httpResponseCode == 200);
        } else {
            Serial.print("[HTTP ERROR] Failed code: ");
            Serial.println(httpResponseCode);
            http.end();
            return false;
        }
    }
};

#endif // TELEMETRY_H
