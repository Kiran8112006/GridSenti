"""
GridSenti — Sensor Service (Placeholder)

NOTE: There are NO physical sensors in the current prototype.
      The ESP8266 sends SIMULATED telemetry values.
      This service will process those simulated readings.

TODO: In a future phase, this will handle real ADC data from
      current transformers (CTs) and voltage transformers (PTs)
      attached to the edge node.
"""


class SensorService:
    """
    Processes incoming sensor (or simulated sensor) data from edge nodes.
    """

    def ingest(self, raw_payload: dict) -> dict:
        """
        Validate and normalise an incoming telemetry payload.

        Args:
            raw_payload: raw dict received from edge node

        Returns:
            normalised telemetry dict
        """
        # TODO: Validate schema with Pydantic, normalise units
        raise NotImplementedError(
            "SensorService.ingest() not yet implemented"
        )
