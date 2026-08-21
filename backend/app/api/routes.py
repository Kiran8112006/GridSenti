"""
GridSenti Backend — API Routes
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint.

    Returns a simple status object confirming the API is reachable.
    """
    return {"status": "ok", "service": "gridsenti-backend"}


# ── Future route placeholders ─────────────────────────────────
# TODO: Add /nodes routes (node.service)
# TODO: Add /telemetry routes (telemetry_processor)
# TODO: Add /faults routes (fault_service)
# TODO: Add /alerts routes (alert_service)
# TODO: Add /hif routes (hif_detector)
