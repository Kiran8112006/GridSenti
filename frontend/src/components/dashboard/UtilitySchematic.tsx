"use client";

import { useState } from "react";
import type { MonitoringNode } from "@/types";
import { timeAgo } from "@/utils";

interface UtilitySchematicProps {
  nodes: MonitoringNode[];
}

export default function UtilitySchematic({ nodes }: UtilitySchematicProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("GS-NODE-001");

  // Map nodes to dictionary
  const nodeMap = new Map<string, MonitoringNode>();
  nodes.forEach((n) => nodeMap.set(n.nodeId || n.id || "", n));

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  const schematicNodes = [
    { id: "GS-NODE-001", label: "P1", name: "Node Alpha", type: "PHYSICAL (ESP8266)" },
    { id: "GS-NODE-002", label: "P2", name: "Node Beta", type: "VIRTUAL NODE" },
    { id: "GS-NODE-003", label: "P3", name: "Node Gamma", type: "VIRTUAL NODE" },
    { id: "GS-NODE-004", label: "P4", name: "Node Delta", type: "VIRTUAL NODE" },
  ];

  const getNodeColor = (node: MonitoringNode | undefined) => {
    if (!node || node.status === "OFFLINE") return "bg-offline-light text-offline border-offline";
    if (node.isolationState?.status === "ISOLATED") return "bg-isolation-light text-isolation border-isolation ring-2 ring-isolation/40";
    const riskLevel = node.risk?.level;
    if (riskLevel === "CRITICAL" || node.lastDetection === "HIF") return "bg-critical-light text-critical border-critical";
    if (riskLevel === "MEDIUM" || node.status === "WARNING") return "bg-warning-light text-warning border-warning";
    return "bg-nominal-light text-nominal border-nominal";
  };

  const getNodeDot = (node: MonitoringNode | undefined) => {
    if (!node || node.status === "OFFLINE") return "bg-offline";
    if (node.isolationState?.status === "ISOLATED") return "bg-isolation";
    const riskLevel = node.risk?.level;
    if (riskLevel === "CRITICAL" || node.lastDetection === "HIF") return "bg-critical";
    if (riskLevel === "MEDIUM" || node.status === "WARNING") return "bg-warning";
    return "bg-nominal";
  };

  return (
    <section className="bg-panel border border-line rounded-lg p-5 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-line pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">▲</span> Feeder Topology &amp; Section Schematic
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono meter bg-signal-light text-signal border border-signal/20">
            FEEDER LINE A-D
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-steel flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-nominal" /> NORMAL</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" /> SUSPICIOUS</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-critical" /> CRITICAL</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-isolation" /> ISOLATED (SIM)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-offline" /> OFFLINE</span>
        </div>
      </div>

      {/* Schematic Feeder Line Diagram */}
      <div className="bg-paper border border-line rounded-lg p-6 overflow-x-auto">
        <div className="min-w-[650px] flex items-center justify-between relative py-4">
          {/* Main Bus Line */}
          <div className="absolute top-1/2 left-16 right-16 h-1 bg-line-strong -translate-y-1/2 z-0" />

          {/* Substation */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-md bg-panel border-2 border-signal flex items-center justify-center text-signal text-xl">
              ▣
            </div>
            <span className="text-[11px] font-mono meter font-bold text-signal uppercase">SUBSTATION</span>
            <span className="text-[9px] font-mono text-steel-light">11 kV / 415 V</span>
          </div>

          {/* Nodes along the feeder */}
          {schematicNodes.map((sNode) => {
            const actualNode = nodeMap.get(sNode.id);
            const isSelected = selectedNodeId === sNode.id;
            const colorClass = getNodeColor(actualNode);
            const dotClass = getNodeDot(actualNode);

            return (
              <button
                key={sNode.id}
                onClick={() => setSelectedNodeId(sNode.id)}
                className={`relative z-10 flex flex-col items-center gap-1.5 group transition-transform ${
                  isSelected ? "scale-110" : "hover:scale-105"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono meter font-bold text-xs transition-all ${colorClass} ${
                    isSelected ? "ring-2 ring-signal ring-offset-2 ring-offset-paper" : ""
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full mr-1 ${dotClass}`} />
                  {sNode.label}
                </div>
                <span className="text-[11px] font-mono meter font-semibold text-ink group-hover:text-signal">
                  {sNode.id}
                </span>
                <span className="text-[9px] font-mono text-steel-light">
                  {sNode.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="bg-paper border border-line rounded-lg p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-line pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-signal font-bold text-sm">
                {selectedNode.nodeId || selectedNode.id}
              </span>
              <span className="text-steel text-[11px]">— {selectedNode.name}</span>
              {selectedNode.nodeId === "GS-NODE-001" ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-signal-light text-signal border border-signal/20">
                  PHYSICAL ESP8266
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-offline-light text-offline border border-offline/20">
                  VIRTUAL NODE
                </span>
              )}
            </div>
            <span className="text-steel-light text-[11px]">
              Last Heartbeat: {selectedNode.lastHeartbeat ? timeAgo(selectedNode.lastHeartbeat) : "Never"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-steel text-[11px]">
            <div className="bg-panel p-2.5 rounded border border-line">
              <span className="text-steel-light block text-[10px] uppercase">Node Status</span>
              <span className={`font-bold meter ${selectedNode.status === "ONLINE" ? "text-nominal" : selectedNode.status === "WARNING" ? "text-warning" : "text-offline"}`}>
                {selectedNode.status}
              </span>
            </div>

            <div className="bg-panel p-2.5 rounded border border-line">
              <span className="text-steel-light block text-[10px] uppercase">Communication State</span>
              <span className={`font-bold meter ${selectedNode.communicationState === "REMOTE_CONNECTED" ? "text-nominal" : selectedNode.communicationState === "LOCAL_FALLBACK" ? "text-warning" : "text-offline"}`}>
                {selectedNode.communicationState ?? "REMOTE_CONNECTED"}
              </span>
            </div>

            <div className="bg-panel p-2.5 rounded border border-line">
              <span className="text-steel-light block text-[10px] uppercase">Isolation State</span>
              <span className={`font-bold meter ${selectedNode.isolationState?.status === "ISOLATED" ? "text-isolation" : selectedNode.isolationState?.status === "ISOLATION_RECOMMENDED" ? "text-warning" : "text-nominal"}`}>
                {selectedNode.isolationState?.status ?? "NOT_ISOLATED"}
              </span>
            </div>

            <div className="bg-panel p-2.5 rounded border border-line">
              <span className="text-steel-light block text-[10px] uppercase">Risk Level &amp; Score</span>
              <span className={`font-bold meter ${selectedNode.risk?.level === "CRITICAL" ? "text-critical" : selectedNode.risk?.level === "MEDIUM" ? "text-warning" : "text-nominal"}`}>
                {selectedNode.risk?.level ?? "LOW"} ({selectedNode.risk?.score ?? 0}/100)
              </span>
            </div>

            <div className="bg-panel p-2.5 rounded border border-line">
              <span className="text-steel-light block text-[10px] uppercase">Predicted Fault</span>
              <span className="font-bold text-signal">
                {selectedNode.faultClassification?.faultType ?? "Normal"}
              </span>
            </div>
          </div>

          {selectedNode.explanation && (
            <div className="bg-panel p-3 rounded border border-line text-[11px] text-steel space-y-1">
              <span className="text-steel-light font-bold block text-[10px] uppercase">Recommended Action:</span>
              <span className="text-warning font-bold">{selectedNode.explanation.recommendedAction}</span>
              <p className="text-steel-light mt-1 text-[10px] leading-relaxed">{selectedNode.explanation.summary}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
