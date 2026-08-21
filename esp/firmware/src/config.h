/**
 * GridSenti — ESP8266 Prototype Firmware Configuration
 * ===================================================
 * IMPORTANT SAFETY NOTICE:
 * This firmware runs on an ESP8266 NodeMCU micro-controller.
 * The ESP8266 has NO PHYSICAL ELECTRICAL SENSORS attached and is NOT connected
 * to any high voltage (11 kV / 22 kV / 33 kV / mains).
 *
 * The ESP8266 functions as a SIMULATED EDGE MONITORING NODE, replaying verified
 * sample values from the public Mendeley HIF dataset
 * (DOI: 10.17632/rvypj5rs5b.1).
 */

#ifndef CONFIG_H
#define CONFIG_H

// ── Wi-Fi Configuration ─────────────────────────────────────────────────────
#define WIFI_SSID "Nothing Phone (4b)"
#define WIFI_PASSWORD "Kiran@123"

// ── Backend FastAPI Server Configuration ────────────────────────────────────
// NOTE: ESP8266 cannot connect to 'localhost'. Set BACKEND_HOST to your
// computer's LAN IP address.
#define BACKEND_HOST "10.109.126.209"
#define BACKEND_PORT 8000
#define TELEMETRY_PATH "/api/telemetry"

// ── Node Identity ───────────────────────────────────────────────────────────
#define NODE_ID "GS-NODE-001"
#define NODE_NAME "Node Alpha (ESP8266 Prototype)"
#define NODE_SECTOR "Sector 4 — Main Junction"

// ── Simulation Settings ─────────────────────────────────────────────────────
// Options: "NORMAL", "HIF", or "AUTO"
// AUTO alternates between 5 NORMAL packets and 3 HIF packets
#define SIMULATION_MODE "AUTO"

// Telemetry transmit interval (in milliseconds)
#define TELEMETRY_INTERVAL_MS 2000

// ── Benchmark Dataset Replay Samples ────────────────────────────────────────
// Samples drawn directly from Mendeley Fault Dataset (Class == "Normal")
struct DatasetSample {
  double ea;
  double eb;
  double ec;
};

const int NUM_NORMAL_SAMPLES = 5;
const DatasetSample DATASET_NORMAL_SAMPLES[NUM_NORMAL_SAMPLES] = {
    {4.23e10, 4.84e9, 1.52e10},
    {4.20e10, 4.84e9, 1.51e10},
    {4.23e10, 4.85e9, 1.52e10},
    {4.21e10, 4.84e9, 1.51e10},
    {4.22e10, 4.84e9, 1.52e10}};

// Samples drawn directly from Mendeley Fault Dataset (Class == "HIF")
const int NUM_HIF_SAMPLES = 5;
const DatasetSample DATASET_HIF_SAMPLES[NUM_HIF_SAMPLES] = {
    {5.28e10, 4.86e9, 1.51e10}, // HIF Phase A elevated
    {5.57e10, 4.88e9, 1.51e10}, // HIF Phase A peak
    {4.22e10, 7.86e9, 1.52e10}, // HIF Phase B elevated
    {4.22e10, 8.72e9, 1.52e10}, // HIF Phase B peak
    {4.25e10, 4.84e9, 2.39e10}  // HIF Phase C elevated
};

#endif // CONFIG_H
