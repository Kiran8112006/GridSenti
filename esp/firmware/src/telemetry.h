/**
 * GridSenti — ESP8266 Telemetry Transmitter & Local Fallback Engine
 * =================================================================
 * Constructs JSON payload, performs HTTP POST to FastAPI backend, and
 * maintains local fallback anomaly warning logic when backend is unavailable.
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
    String commState = "REMOTE_CONNECTED";

    void handleLocalFallback(const String &mode) {
        if (commState != "LOCAL_FALLBACK") {
            commState = "LOCAL_FALLBACK";
            Serial.println("[GridSenti LOCAL FALLBACK] Backend connection lost. Entering LOCAL FALLBACK MODE.");
        }

        Serial.print("[GridSenti LOCAL FALLBACK] Processing local simulated feature payload (Mode: ");
        Serial.print(mode);
        Serial.println(")...");

        if (mode == "HIF") {
            Serial.println("[GridSenti LOCAL FALLBACK] ⚠️ LOCAL SAFETY WARNING: Local anomaly detected during backend outage!");
        } else {
            Serial.println("[GridSenti LOCAL FALLBACK] Local steady-state nominal.");
        }
    }

    void handleConnectionRestored() {
        if (commState == "LOCAL_FALLBACK") {
            commState = "REMOTE_CONNECTED";
            Serial.println("[GridSenti] Backend connection restored — Returning to REMOTE MODE.");
        }
    }

public:
    String getCommunicationState() const {
        return commState;
    }

    bool sendTelemetry(const DatasetSample &sample, const String &mode) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[Telemetry] Error: Wi-Fi not connected.");
            handleLocalFallback(mode);
            return false;
        }

        HTTPClient http;
        String url = "http://" + String(BACKEND_HOST) + ":" + String(BACKEND_PORT) + String(TELEMETRY_PATH);

        http.begin(wifiClient, url);
        http.addHeader("Content-Type", "application/json");

        StaticJsonDocument<256> doc;
        doc["nodeId"] = NODE_ID;
        doc["timestamp"] = "2026-08-22T01:00:00Z";
        doc["ea"] = sample.ea;
        doc["eb"] = sample.eb;
        doc["ec"] = sample.ec;
        doc["simulated"] = true;
        doc["simulationMode"] = mode;

        String jsonPayload;
        serializeJson(doc, jsonPayload);

        Serial.print("[POST] ");
        Serial.print(url);
        Serial.print(" -> ");
        Serial.println(jsonPayload);

        int httpResponseCode = http.POST(jsonPayload);

        if (httpResponseCode == 200) {
            String response = http.getString();
            Serial.print("[HTTP 200] Response: ");
            Serial.println(response);
            handleConnectionRestored();
            http.end();
            return true;
        } else {
            Serial.print("[HTTP ERROR] Failed code: ");
            Serial.println(httpResponseCode);
            handleLocalFallback(mode);
            http.end();
            return false;
        }
    }
};

#endif // TELEMETRY_H
