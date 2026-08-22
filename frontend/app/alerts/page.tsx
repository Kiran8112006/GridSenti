"use client";

import AlertPanel from "@/components/alerts/AlertPanel";
import StatusCard from "@/components/dashboard/StatusCard";
import PublicWarningPanel from "@/components/dashboard/PublicWarningPanel";
import { useGridSentiData } from "@/hooks/useGridSentiData";
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

export default function AlertsPage() {
  const { alerts, publicWarnings, isConnected, lastUpdated, refresh } = useGridSentiData();

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;
  const infoCount = alerts.filter((a) => a.severity === "INFO").length;

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-wide uppercase flex items-center gap-2">
              <span className="text-critical">◆</span> Active Grid Emergency Alerts &amp; Safety Response
            </h1>
            <ConnectionBadge isConnected={isConnected} />
          </div>
          <p className="text-steel text-sm mt-0.5">
            Real-time emergency warning, isolation recommendations &amp; public safety notifications · GET /api/alerts
            {lastUpdated && (
              <span className="text-steel-light text-xs ml-2 font-mono meter">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Alert Counters ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard title="Total Active" value={alerts.length} status={alerts.length > 0 ? "warning" : "nominal"} icon="◆" />
        <StatusCard title="Critical Risk" value={criticalCount} status={criticalCount > 0 ? "critical" : "nominal"} icon="●" />
        <StatusCard title="Medium Risk Warnings" value={warningCount} status={warningCount > 0 ? "warning" : "nominal"} icon="●" />
        <StatusCard title="Info Events" value={infoCount} status="neutral" icon="●" />
      </div>

      {/* ── Public Hazard Warning Panel ─────────────────────── */}
      <PublicWarningPanel
        warnings={publicWarnings}
        activeNodeId="GS-NODE-001"
        onRefresh={refresh}
      />

      {/* ── Alert List Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel alerts={alerts} />

        {/* Detailed Alert Summary Card */}
        <section className="bg-panel border border-line rounded-lg p-5 space-y-4 font-mono text-xs">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2 border-b border-line pb-3">
            <span className="text-warning">▲</span> Safety Protocol Guidelines
          </h2>

          <div className="space-y-3 text-xs text-steel">
            <div className="bg-critical-light border border-critical/20 p-3 rounded-md">
              <p className="font-bold text-critical mb-1 flex items-center gap-1.5">
                <span>●</span> CRITICAL RISK PROTOCOL (Score 70-100)
              </p>
              <p className="text-steel leading-relaxed">
                Persistent HIF or high-risk line fault confirmed. Despatch field crew for visual inspection immediately. Action: UTILITY_ALERT_AND_ISOLATION_RECOMMENDATION.
              </p>
            </div>

            <div className="bg-warning-light border border-warning/20 p-3 rounded-md">
              <p className="font-bold text-warning mb-1 flex items-center gap-1.5">
                <span>●</span> MEDIUM RISK PROTOCOL (Score 35-69)
              </p>
              <p className="text-steel leading-relaxed">
                Indicates moderate phase energy shift or heartbeat delay. Action: INVESTIGATE_NODE.
              </p>
            </div>

            <div className="bg-paper p-3 rounded-md border border-line text-steel-light text-[11px]">
              Note: Software simulation prototype. Does NOT control physical relay hardware or real-world emergency broadcast services.
            </div>
          </div>
        </section>
      </div>

      {/* ── Detailed Alerts Table ─────────────────────────────── */}
      <section className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">▤</span> Active Emergency Alerts Detailed Register
          </h2>
          <span className="text-steel-light text-xs font-mono meter">
            Count: {alerts.length}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-steel-light text-sm font-mono">
            {isConnected ? "✓ No active alerts. All grid nodes operating normally." : "Backend disconnected."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-paper text-steel-light uppercase tracking-wide text-[11px] border-b border-line">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Fault Type</th>
                  <th className="py-3 px-4">Risk &amp; Score</th>
                  <th className="py-3 px-4">Node ID</th>
                  <th className="py-3 px-4">Isolation Status</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-steel">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] border ${
                          a.severity === "CRITICAL"
                            ? "bg-critical-light text-critical border-critical/20"
                            : a.severity === "WARNING"
                              ? "bg-warning-light text-warning border-warning/20"
                              : "bg-signal-light text-signal border-signal/20"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold meter text-signal">{a.faultType ?? "HIF"}</td>
                    <td className="py-3 px-4 font-bold meter text-warning">
                      {a.riskLevel ?? a.severity} ({a.riskScore ?? 0}/100)
                    </td>
                    <td className="py-3 px-4 text-signal font-bold meter">{a.nodeId}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold meter ${a.isolationStatus === "ISOLATED" ? "text-isolation" : "text-warning"}`}>
                        {a.isolationStatus ?? "ISOLATION_RECOMMENDED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel max-w-xs truncate">{a.recommendedAction ?? "UTILITY_ALERT"}</td>
                    <td className="py-3 px-4 text-steel-light">{timeAgo(a.timestamp)}</td>
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
