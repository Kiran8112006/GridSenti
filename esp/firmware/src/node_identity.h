// ============================================================
// GridSenti — Node Identity
// ============================================================
// Provides the node's unique ID and static metadata.
// ============================================================

#pragma once
#include "config.h"

namespace NodeIdentity {

  /**
   * Return the node's unique identifier string.
   * This is used in all telemetry and heartbeat payloads.
   */
  inline const char* getId() {
    return NODE_ID;
  }

  inline const char* getLocation() {
    return NODE_LOCATION;
  }

  inline float getLatitude() {
    return NODE_LAT;
  }

  inline float getLongitude() {
    return NODE_LON;
  }

  inline const char* getFirmwareVersion() {
    return FIRMWARE_VERSION;
  }

} // namespace NodeIdentity
