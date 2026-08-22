"use client";

import NodeGrid from "@/components/nodes/NodeGrid";
import StatusCard from "@/components/dashboard/StatusCard";
import { useGridSentiData } from "@/hooks/useGridSentiData";
import { APP_CONFIG } from "@/config/app.config";
import { timeAgo } from "@/utils";

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  return isConnected ? (
    <span className="pl-2.5 pr-2 py-0.5 border-l-4 border-nominal bg-nominal-light text-nominal text-xs font-display font-semibold uppercase tracking-wide flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-nominal" />
      Live Backend Connected
    </span>
  ) : (
    <span className="pl-2.5 pr-2 py-0.5 border-l-4 border-critical bg-critical-light text-critical text-xs font-display font-semibold uppercase tracking-wide flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-critical" />
      Backend Disconnected — Stale Data
    </span>
  );
}

export default function NodesPage() {
  const { nodes, isConnected, lastUpdated } = useGridSentiData();

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const warningNodes = nodes.filter((n) => n.status === "WARNING").length;
  const offlineNodes = nodes.filter((n) => n.status === "OFFLINE").length;

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-wide uppercase flex items-center gap-2">
              <span className="text-signal">◉</span> Monitoring Nodes Registry
            </h1>
            <ConnectionBadge isConnected={isConnected} />
          </div>
          <p className="text-steel text-sm mt-0.5">
            Real-time edge node telemetry, communication resilience, risk &amp; isolation statuses · GET /api/nodes
            {lastUpdated && (
              <span className="text-steel-light text-xs ml-2 font-mono meter">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Node Status Summary ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard title="Total Registered" value={totalNodes} status="neutral" icon="◉" />
        <StatusCard title="Active (Online)" value={onlineNodes} status="nominal" icon="●" />
        <StatusCard title="Imbalance Warning" value={warningNodes} status="warning" icon="●" />
        <StatusCard title="Heartbeat Timeout" value={offlineNodes} status="offline" icon="●" />
      </div>

      {/* ── Node Cards Grid ─────────────────────────────────── */}
      <NodeGrid nodes={nodes} />

      {/* ── Detailed Node Inventory Table ───────────────────── */}
      <section className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">▤</span> Node Inventory, Resilience &amp; Safety Register
          </h2>
          <span className="text-steel-light text-xs font-mono meter">
            Timeout Threshold: {APP_CONFIG.heartbeatTimeoutMs / 1000}s
          </span>
        </div>

        {nodes.length === 0 ? (
          <div className="p-8 text-center text-steel-light text-sm font-mono">
            {isConnected ? "Awaiting node registration..." : "Backend disconnected. No node data available."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-steel-light uppercase tracking-wide text-[11px] border-b border-line">
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
              <tbody className="divide-y divide-line text-steel">
                {nodes.map((node) => (
                  <tr key={node.nodeId || node.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 font-bold meter text-signal">
                      {node.nodeId || node.id}
                    </td>
                    <td className="py-3 px-4 text-steel">
                      {node.location ?? node.feeder ?? "Unmapped"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-semibold text-[11px] border ${
                          node.status === "ONLINE"
                            ? "bg-nominal-light text-nominal border-nominal/20"
                            : node.status === "WARNING"
                              ? "bg-warning-light text-warning border-warning/20"
                              : "bg-offline-light text-offline border-offline/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            node.status === "ONLINE"
                              ? "bg-nominal"
                              : node.status === "WARNING"
                                ? "bg-warning"
                                : "bg-offline"
                          }`}
                        />
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold meter ${
                          node.communicationState === "REMOTE_CONNECTED"
                            ? "text-nominal"
                            : node.communicationState === "LOCAL_FALLBACK"
                              ? "text-warning"
                              : "text-offline"
                        }`}
                      >
                        {node.communicationState ?? "REMOTE_CONNECTED"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold meter ${
                          node.isolationState?.status === "ISOLATED"
                            ? "text-isolation"
                            : node.isolationState?.status === "ISOLATION_RECOMMENDED"
                              ? "text-warning"
                              : "text-nominal"
                        }`}
                      >
                        {node.isolationState?.status ?? "NOT_ISOLATED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold meter text-signal">
                      {node.faultClassification?.faultType ?? (node.lastDetection === "HIF" ? "HIF" : "Normal")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold meter ${
                          node.risk?.level === "CRITICAL"
                            ? "text-critical"
                            : node.risk?.level === "MEDIUM"
                              ? "text-warning"
                              : "text-nominal"
                        }`}
                      >
                        {node.risk?.level ?? "LOW"} ({node.risk?.score ?? 0}/100)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel-light">
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
