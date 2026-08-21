# GridSenti — ESP8266 Firmware

## ⚠ SAFETY NOTICE

**NEVER connect the ESP8266 to mains electricity (120V / 230V), 11kV, 22kV, 33kV, or any distribution line.**

This firmware uses **SIMULATED telemetry only**. No physical current or voltage sensors are attached.

---

## Purpose

The ESP8266 acts as a prototype **edge monitoring node** (`GS-NODE-001`) for the GridSenti system.

In this prototype phase it:
1. Connects to Wi-Fi
2. Identifies itself with `NODE_ID`
3. Sends periodic **heartbeat** messages
4. Sends **simulated telemetry** (current, voltage, waveform anomaly)
5. Simulates NORMAL and POSSIBLE_HIF events on a cycle

---

## Prerequisites

- [PlatformIO](https://platformio.org/) (VS Code extension or CLI)
- ESP8266 NodeMCU board (or similar)

---

## Setup

### 1. Configure credentials

Edit `src/config.h`:

```c
#define WIFI_SSID     "your_wifi"
#define WIFI_PASSWORD "your_password"
#define BACKEND_HOST  "192.168.1.100"  // your PC's LAN IP
```

### 2. Build

```bash
pio run -e nodemcuv2
```

### 3. Flash

Connect ESP8266 via USB, then:

```bash
pio run -e nodemcuv2 --target upload
```

### 4. Monitor

```bash
pio device monitor --baud 115200
```

---

## Simulated Telemetry Packets

**Normal state:**
```json
{
  "nodeId": "GS-NODE-001",
  "current": 24.8,
  "voltage": 230.0,
  "waveformAnomaly": 0.05,
  "status": "NORMAL",
  "simulated": true
}
```

**HIF simulation:**
```json
{
  "nodeId": "GS-NODE-001",
  "current": 26.1,
  "voltage": 227.5,
  "waveformAnomaly": 0.82,
  "status": "POSSIBLE_HIF",
  "simulated": true
}
```

---

## Planned Future Architecture

Real sensors (CT/PT) → ESP8266 ADC → Feature extraction → GridSenti backend → HIF detection
