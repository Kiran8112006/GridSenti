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
    if (!node || node.status === "OFFLINE") return "bg-slate-700 text-slate-400 border-slate-600";
    const riskLevel = node.risk?.level;
    if (riskLevel === "CRITICAL" || node.lastDetection === "HIF") return "bg-red-950 text-red-400 border-red-500 animate-pulse";
    if (riskLevel === "MEDIUM" || node.status === "WARNING") return "bg-amber-950 text-amber-400 border-amber-500";
    return "bg-emerald-950 text-emerald-400 border-emerald-500";
  };

  const getNodeDot = (node: MonitoringNode | undefined) => {
    if (!node || node.status === "OFFLINE") return "bg-slate-500";
    const riskLevel = node.risk?.level;
    if (riskLevel === "CRITICAL" || node.lastDetection === "HIF") return "bg-red-400";
    if (riskLevel === "MEDIUM" || node.status === "WARNING") return "bg-amber-400";
    return "bg-emerald-400";
  };

  return (
    <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> Feeder Topology &amp; Section Schematic
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
            FEEDER LINE A-D
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> NORMAL</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> SUSPICIOUS</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> CRITICAL</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> OFFLINE</span>
        </div>
      </div>

      {/* Schematic Feeder Line Diagram */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 overflow-x-auto">
        <div className="min-w-[650px] flex items-center justify-between relative py-4">
          {/* Main Bus Line */}
          <div className="absolute top-1/2 left-16 right-16 h-1 bg-slate-700/80 -translate-y-1/2 z-0" />

          {/* Substation */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/10">
              🏬
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase">SUBSTATION</span>
            <span className="text-[9px] font-mono text-slate-500">11 kV / 415 V</span>
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
                  className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs shadow-md transition-all ${colorClass} ${
                    isSelected ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : ""
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full mr-1 ${dotClass}`} />
                  {sNode.label}
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-200 group-hover:text-cyan-300">
                  {sNode.id}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {sNode.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3 font-mono text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-bold text-sm">
                {selectedNode.nodeId || selectedNode.id}
              </span>
              <span className="text-slate-400 text-[11px]">— {selectedNode.name}</span>
              {selectedNode.nodeId === "GS-NODE-001" ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                  PHYSICAL ESP8266
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                  VIRTUAL NODE
                </span>
              )}
            </div>
            <span className="text-slate-500 text-[11px]">
              Last Heartbeat: {selectedNode.lastHeartbeat ? timeAgo(selectedNode.lastHeartbeat) : "Never"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 text-[11px]">
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/40">
              <span className="text-slate-500 block text-[10px] uppercase">Status</span>
              <span className={`font-bold ${selectedNode.status === "ONLINE" ? "text-emerald-400" : selectedNode.status === "WARNING" ? "text-amber-400" : "text-slate-500"}`}>
                {selectedNode.status}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/40">
              <span className="text-slate-500 block text-[10px] uppercase">Predicted Fault Type</span>
              <span className="font-bold text-cyan-300">
                {selectedNode.faultClassification?.faultType ?? "Normal"}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/40">
              <span className="text-slate-500 block text-[10px] uppercase">Risk Level &amp; Score</span>
              <span className={`font-bold ${selectedNode.risk?.level === "CRITICAL" ? "text-red-400" : selectedNode.risk?.level === "MEDIUM" ? "text-amber-400" : "text-emerald-400"}`}>
                {selectedNode.risk?.level ?? "LOW"} ({selectedNode.risk?.score ?? 0}/100)
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/40">
              <span className="text-slate-500 block text-[10px] uppercase">Packet Persistence</span>
              <span className="font-bold text-amber-300">
                {selectedNode.risk?.persistenceCount ?? 0} packet(s)
              </span>
            </div>
          </div>

          {selectedNode.explanation && (
            <div className="bg-slate-800/40 p-3 rounded border border-slate-700/40 text-[11px] text-slate-300 space-y-1">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Recommended Action:</span>
              <span className="text-amber-300 font-bold">{selectedNode.explanation.recommendedAction}</span>
              <p className="text-slate-400 mt-1 text-[10px] leading-relaxed">{selectedNode.explanation.summary}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
