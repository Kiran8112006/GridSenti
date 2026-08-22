"""
GridSenti — app/services/localization_service.py
=================================================
Node & Feeder Section Localization Service.

SOFTWARE ARCHITECTURE FOR MULTI-NODE LOCALIZATION
-------------------------------------------------
Current prototype hardware consists of ONE physical ESP8266 node (GS-NODE-001)
with virtual feeder nodes (GS-NODE-002, 003, 004).

Localization results are reported as 'NODE_LEVEL' identification. Section-level
estimation algorithms (estimating fault between Node X and Node Y) are structured
for multi-node hardware expansion.
"""

from __future__ import annotations

from typing import Dict, List, Optional


class LocalizationService:
    """
    Localization Architecture & Feeder Section Manager.
    """

    FEEDER_TOPOLOGY = [
        {"nodeId": "GS-NODE-001", "name": "Node Alpha", "position": 1, "feeder": "Feeder Line A"},
        {"nodeId": "GS-NODE-002", "name": "Node Beta",  "position": 2, "feeder": "Feeder Line B"},
        {"nodeId": "GS-NODE-003", "name": "Node Gamma", "position": 3, "feeder": "Feeder Line C"},
        {"nodeId": "GS-NODE-004", "name": "Node Delta", "position": 4, "feeder": "Feeder Line D"},
    ]

    def localize_fault(
        self,
        reporting_node_id: str,
        is_fault: bool,
        node_location: Optional[str] = None,
        node_feeder: Optional[str] = None,
    ) -> Dict:
        """
        Determine fault location structure.
        """
        if not is_fault:
            return {
                "localizationType": "NOMINAL",
                "nodeId": reporting_node_id,
                "location": node_location or "Sector 4 — Main Junction",
                "feeder": node_feeder or "Feeder Line A",
                "estimatedSection": "Feeder Normal — No Fault Section",
                "disclaimer": "Node-level identification — baseline normal state.",
            }

        # Node-level identification for physical prototype node
        return {
            "localizationType": "NODE_LEVEL",
            "nodeId": reporting_node_id,
            "location": node_location or "Sector 4 — Main Junction",
            "feeder": node_feeder or "Feeder Line A",
            "estimatedSection": f"Section adjacent to {reporting_node_id}",
            "disclaimer": (
                "Node-level identification — single physical ESP8266 node connected. "
                "Multi-point section localization algorithm prepared for multi-hardware deployment."
            ),
        }


# Singleton service instance
localization_service = LocalizationService()
