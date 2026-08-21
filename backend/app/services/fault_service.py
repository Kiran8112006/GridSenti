"""
GridSenti — Fault Service (Placeholder)

TODO: Implement fault event CRUD:
      - Create fault events when HIF is detected
      - Update status (INVESTIGATING → CONFIRMED / RESOLVED)
      - Persist to database
      - Trigger alert pipeline
"""


class FaultService:
    """
    Manages fault event lifecycle.
    """

    def create_fault(self, node_id: str, detection_result: dict) -> dict:
        """
        Create a new fault event record.

        TODO: Persist to database and emit alert.
        """
        raise NotImplementedError(
            "FaultService.create_fault() not yet implemented"
        )

    def get_active_faults(self) -> list:
        """
        Return all currently active (unresolved) fault events.

        TODO: Query from database.
        """
        raise NotImplementedError(
            "FaultService.get_active_faults() not yet implemented"
        )
