// ============================================================
// GridSenti — Fault Simulator
// ============================================================
// ⚠ IMPORTANT:
//   This module SIMULATES electrical telemetry values.
//   No physical current or voltage sensors are connected.
//   All values are mathematical approximations for testing
//   the communication and detection pipeline.
//   Do NOT connect to mains or high-voltage circuits.
// ============================================================

#pragma once
#include "config.h"

namespace FaultSimulator {

  enum class SimMode {
    NORMAL,
    POSSIBLE_HIF,
  };

  static uint32_t cycleCount = 0;

  /**
   * Determine the current simulation mode based on cycle count.
   * Every HIF_SIMULATE_EVERY_N cycles, a HIF event is simulated.
   */
  inline SimMode getCurrentMode() {
    cycleCount++;
    // Simulate a HIF event for 3 cycles out of every N
    uint32_t phase = cycleCount % HIF_SIMULATE_EVERY_N;
    if (phase >= (HIF_SIMULATE_EVERY_N - 3)) {
      return SimMode::POSSIBLE_HIF;
    }
    return SimMode::NORMAL;
  }

  /** Simulated RMS current in Amperes (FAKE — not from sensors) */
  inline float getCurrent(SimMode mode) {
    if (mode == SimMode::POSSIBLE_HIF) return SIM_CURRENT_HIF;
    return SIM_CURRENT_NORMAL;
  }

  /** Simulated RMS voltage in Volts (FAKE — not from sensors) */
  inline float getVoltage(SimMode mode) {
    if (mode == SimMode::POSSIBLE_HIF) return SIM_VOLTAGE_HIF;
    return SIM_VOLTAGE_NORMAL;
  }

  /** Simulated waveform anomaly index [0.0–1.0] (FAKE) */
  inline float getWaveformAnomaly(SimMode mode) {
    if (mode == SimMode::POSSIBLE_HIF) return SIM_ANOMALY_HIF;
    return SIM_ANOMALY_NORMAL;
  }

  /** Human-readable status string */
  inline const char* getStatusString(SimMode mode) {
    if (mode == SimMode::POSSIBLE_HIF) return "POSSIBLE_HIF";
    return "NORMAL";
  }

} // namespace FaultSimulator
