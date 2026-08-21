"use client";

import AlertPanel from "@/components/alerts/AlertPanel";
import StatusCard from "@/components/dashboard/StatusCard";
import { useGridSentiData } from "@/hooks/useGridSentiData";
import { timeAgo } from "@/utils";

export default function AlertsPage() {
  const { alerts, isConnected, lastUpdated } = useGridSentiData();

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;
  const infoCount = alerts.filter((a) => a.severity === "INFO").length;

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🔔</span> Active Grid Emergency Alerts
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
            Real-time emergency warning &amp; alert dispatch log · GET /api/alerts
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Alert Counters ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard title="Total Active" value={alerts.length} status={alerts.length > 0 ? "warning" : "nominal"} icon="🔔" />
        <StatusCard title="Critical HIF" value={criticalCount} status={criticalCount > 0 ? "offline" : "nominal"} icon="🔴" />
        <StatusCard title="Warnings" value={warningCount} status={warningCount > 0 ? "warning" : "nominal"} icon="🟡" />
        <StatusCard title="Info Events" value={infoCount} status="neutral" icon="🔵" />
      </div>

      {/* ── Alert List Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel alerts={alerts} />

        {/* Detailed Alert Summary Card */}
        <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <span>🛡</span> Safety Protocol Guidelines
          </h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-red-950/30 border border-red-500/30 p-3 rounded-lg">
              <p className="font-bold text-red-400 mb-1 flex items-center gap-1.5">
                <span>🔴</span> CRITICAL HIF ALERT PROTOCOL
              </p>
              <p className="text-slate-300 leading-relaxed">
                When a CRITICAL alert is triggered for a node, an electrical conductor may be down or contacting high-impedance ground. Despatch field crew for visual inspection immediately. Do NOT approach suspected site.
              </p>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg">
              <p className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <span>🟡</span> WARNING &amp; IMBALANCE PROTOCOL
              </p>
              <p className="text-slate-300 leading-relaxed">
                Indicates moderate phase energy shift or heartbeat delay. Monitor telemetry for subsequent escalation.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-slate-400 text-[11px]">
              Note: This is a hackathon prototype warning system based on simulated research telemetry.
            </div>
          </div>
        </section>
      </div>

      {/* ── Detailed Alerts Table ─────────────────────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Active Alerts Detailed Register
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Count: {alerts.length}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {isConnected ? "✓ No active alerts. All grid nodes operating normally." : "Backend disconnected."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Node ID</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] ${
                          a.severity === "CRITICAL"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : a.severity === "WARNING"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-sky-950 text-sky-400 border border-sky-800"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">{a.severity}</td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{a.nodeId}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{a.message}</td>
                    <td className="py-3 px-4 text-slate-400">{timeAgo(a.timestamp)}</td>
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
