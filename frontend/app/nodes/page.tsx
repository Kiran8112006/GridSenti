"use client";

import NodeGrid from "@/components/nodes/NodeGrid";
import StatusCard from "@/components/dashboard/StatusCard";
import { useGridSentiData } from "@/hooks/useGridSentiData";
import { APP_CONFIG } from "@/config/app.config";
import { timeAgo } from "@/utils";

export default function NodesPage() {
  const { nodes, isConnected, lastUpdated } = useGridSentiData();

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const warningNodes = nodes.filter((n) => n.status === "WARNING").length;
  const offlineNodes = nodes.filter((n) => n.status === "OFFLINE").length;

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto font-sans">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>◉</span> Monitoring Nodes Registry
            </h1>
            {isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE BACKEND CONNECTED
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                BACKEND DISCONNECTED — STALE DATA
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time edge node telemetry, communication resilience, risk &amp; isolation statuses · GET /api/nodes
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Node Status Summary ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard title="Total Registered" value={totalNodes} status="neutral" icon="◉" />
        <StatusCard title="Active (Online)" value={onlineNodes} status="nominal" icon="🟢" />
        <StatusCard title="Imbalance Warning" value={warningNodes} status="warning" icon="🟡" />
        <StatusCard title="Heartbeat Timeout" value={offlineNodes} status="offline" icon="⚫" />
      </div>

      {/* ── Node Cards Grid ─────────────────────────────────── */}
      <NodeGrid nodes={nodes} />

      {/* ── Detailed Node Inventory Table ───────────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 font-mono">
            <span>📋</span> Node Inventory, Resilience &amp; Safety Register
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Timeout Threshold: {APP_CONFIG.heartbeatTimeoutMs / 1000}s
          </span>
        </div>

        {nodes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-mono">
            {isConnected ? "Awaiting node registration..." : "Backend disconnected. No node data available."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                <tr>
                  <th className="py-3 px-4">Node ID</th>
                  <th className="py-3 px-4">Location / Feeder</th>
                  <th className="py-3 px-4">Node Status</th>
                  <th className="py-3 px-4">Communication State</th>
                  <th className="py-3 px-4">Isolation State</th>
                  <th className="py-3 px-4">Predicted Fault</th>
                  <th className="py-3 px-4">Risk &amp; Score</th>
                  <th className="py-3 px-4">Last Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {nodes.map((node) => (
                  <tr key={node.nodeId || node.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-300">
                      {node.nodeId || node.id}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {node.location ?? node.feeder ?? "Unmapped"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          node.status === "ONLINE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : node.status === "WARNING"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-slate-900 text-slate-500 border border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            node.status === "ONLINE"
                              ? "bg-emerald-400"
                              : node.status === "WARNING"
                                ? "bg-amber-400"
                                : "bg-slate-500"
                          }`}
                        />
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          node.communicationState === "REMOTE_CONNECTED"
                            ? "text-emerald-400"
                            : node.communicationState === "LOCAL_FALLBACK"
                              ? "text-amber-400"
                              : "text-slate-500"
                        }`}
                      >
                        {node.communicationState ?? "REMOTE_CONNECTED"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          node.isolationState?.status === "ISOLATED"
                            ? "text-purple-400"
                            : node.isolationState?.status === "ISOLATION_RECOMMENDED"
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {node.isolationState?.status ?? "NOT_ISOLATED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-300">
                      {node.faultClassification?.faultType ?? (node.lastDetection === "HIF" ? "HIF" : "Normal")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          node.risk?.level === "CRITICAL"
                            ? "text-red-400"
                            : node.risk?.level === "MEDIUM"
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {node.risk?.level ?? "LOW"} ({node.risk?.score ?? 0}/100)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {node.lastHeartbeat ? timeAgo(node.lastHeartbeat) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
