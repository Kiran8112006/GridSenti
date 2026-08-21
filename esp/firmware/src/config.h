// ============================================================
// GridSenti — ESP8266 Configuration
// ============================================================
// ⚠ SAFETY NOTICE:
//   Do NOT connect this ESP8266 to mains electricity,
//   11 kV, 22 kV, 33 kV, or any distribution line.
//   This firmware uses SIMULATED telemetry only.
// ============================================================

#pragma once

// ── Node Identity ─────────────────────────────────────────────
#ifndef NODE_ID
  #define NODE_ID "GS-NODE-001"
#endif

#define NODE_LOCATION    "Sector 4, Feeder Line A"
#define NODE_LAT         28.6139f
#define NODE_LON         77.2090f
#define FIRMWARE_VERSION "0.1.0"

// ── Wi-Fi Credentials ─────────────────────────────────────────
// TODO: Move to secure provisioning (WiFiManager / NVS) before production
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ── Backend ───────────────────────────────────────────────────
#define BACKEND_HOST "192.168.1.100"
#define BACKEND_PORT 8000
#define TELEMETRY_ENDPOINT "/api/telemetry"
#define HEARTBEAT_ENDPOINT "/api/nodes/heartbeat"

// ── Timing ────────────────────────────────────────────────────
#define HEARTBEAT_INTERVAL_MS  5000   // 5 s
#define TELEMETRY_INTERVAL_MS  5000   // 5 s
#define WIFI_CONNECT_TIMEOUT_MS 15000 // 15 s

// ── Serial ────────────────────────────────────────────────────
#define BAUD_RATE 115200

// ── Simulation parameters ─────────────────────────────────────
// These values represent the SIMULATED electrical readings.
// No real sensors are attached.
#define SIM_CURRENT_NORMAL    24.8f
#define SIM_VOLTAGE_NORMAL   230.0f
#define SIM_ANOMALY_NORMAL     0.05f

#define SIM_CURRENT_HIF       26.1f
#define SIM_VOLTAGE_HIF      227.5f
#define SIM_ANOMALY_HIF        0.82f

// HIF simulation trigger: every N telemetry cycles
#define HIF_SIMULATE_EVERY_N  20
