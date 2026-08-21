/**
 * GridSenti — ESP8266 Main Firmware Entry Point
 * =============================================
 * Connects to Wi-Fi, initializes dataset replay simulator, and transmits
 * periodic telemetry to the GridSenti FastAPI backend.
 */

#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "fault_simulator.h"
#include "telemetry.h"

WiFiManager wifiManager;
FaultSimulator simulator;
TelemetryTransmitter transmitter;

unsigned long lastTransmitTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("   GridSenti Edge Node Prototype (ESP8266)       ");
    Serial.println("==================================================");
    Serial.print("Node ID        : "); Serial.println(NODE_ID);
    Serial.print("Backend Host   : "); Serial.println(BACKEND_HOST);
    Serial.print("Backend Port   : "); Serial.println(BACKEND_PORT);
    Serial.print("Simulation Mode: "); Serial.println(SIMULATION_MODE);
    Serial.println("--------------------------------------------------");
    Serial.println("SAFETY NOTICE: All telemetry values are SIMULATED");
    Serial.println("from Mendeley Dataset (DOI: 10.17632/rvypj5rs5b.1)");
    Serial.println("==================================================");

    wifiManager.connectWiFi();
}

void loop() {
    wifiManager.maintainWiFi();

    unsigned long now = millis();
    if (now - lastTransmitTime >= TELEMETRY_INTERVAL_MS) {
        lastTransmitTime = now;

        String effectiveMode;
        DatasetSample sample = simulator.getNextSample(SIMULATION_MODE, effectiveMode);

        Serial.print("[Sim] Mode=");
        Serial.print(effectiveMode);
        Serial.print(" | EA="); Serial.print(sample.ea, 2);
        Serial.print(" EB="); Serial.print(sample.eb, 2);
        Serial.print(" EC="); Serial.println(sample.ec, 2);

        transmitter.sendTelemetry(sample, effectiveMode);
    }
}
