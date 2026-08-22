"""
GridSenti — Node Service (Placeholder)

TODO: Implement node registration, heartbeat tracking, and
      status management. Will integrate with database and
      support heartbeat timeout detection.
"""


class NodeService:
    """
    Manages monitoring node registry and heartbeat tracking.
    """

    def register_node(self, node_data: dict) -> dict:
        """
        Register a new edge node.

        TODO: Persist to database, initialize heartbeat timer.
        """
        raise NotImplementedError(
            "NodeService.register_node() not yet implemented"
        )

    def get_all_nodes(self) -> list:
        """
        Return all registered nodes with current status.

        TODO: Query from database.
        """
        raise NotImplementedError(
            "NodeService.get_all_nodes() not yet implemented"
        )

    def update_heartbeat(self, node_id: str) -> None:
        """
        Record a heartbeat from the specified node.

        TODO: Update last_heartbeat timestamp in database.
        """
        raise NotImplementedError(
            "NodeService.update_heartbeat() not yet implemented"
        )
