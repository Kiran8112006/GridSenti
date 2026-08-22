"""
GridSenti — Alert Service (Placeholder)

TODO: Implement alert delivery:
      - Push notifications (Firebase FCM)
      - Email / SMS (future)
      - In-app alerts via WebSocket
      - Alert acknowledgement workflow
"""


class AlertService:
    """
    Manages alert creation and delivery.
    """

    def create_alert(self, node_id: str, message: str, severity: str) -> dict:
        """
        Create and dispatch a new alert.

        TODO: Persist to database, push to Firebase / WebSocket.
        """
        raise NotImplementedError(
            "AlertService.create_alert() not yet implemented"
        )

    def get_active_alerts(self) -> list:
        """
        Return all unacknowledged alerts.

        TODO: Query from database.
        """
        raise NotImplementedError(
            "AlertService.get_active_alerts() not yet implemented"
        )
