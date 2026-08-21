"use client";

import { useGridSentiData } from "@/hooks/useGridSentiData";
import { timeAgo } from "@/utils";

export default function TelemetryPage() {
  const { nodes, latestDetection, isConnected, lastUpdated } = useGridSentiData();

  // Extract telemetry packets & detection results for all nodes
  const nodeTelemetryList = nodes.map((node) => {
    const rawTel = (node as any).latestTelemetry;
    const detRes = (node as any).latestDetectionResult ?? latestDetection?.detection;

    return {
      nodeId: node.nodeId || node.id || "GS-NODE-XXX",
      name: node.name,
      status: node.status,
      lastHeartbeat: node.lastHeartbeat,
      ea: rawTel?.ea ?? 0,
      eb: rawTel?.eb ?? 0,
      ec: rawTel?.ec ?? 0,
      simulationMode: rawTel?.simulationMode ?? (node.status === "ONLINE" ? "AUTO" : "INACTIVE"),
      simulated: rawTel?.simulated ?? true,
      timestamp: rawTel?.timestamp ?? node.lastHeartbeat ?? new Date().toISOString(),
      detection: detRes,
      faultClassification: node.faultClassification ?? latestDetection?.faultClassification,
      risk: node.risk ?? latestDetection?.risk,
      explanation: node.explanation ?? latestDetection?.explanation,
    };
  });

  // Primary node detection info (GS-NODE-001)
  const primaryNode = nodeTelemetryList.find((n) => n.nodeId === "GS-NODE-001") ?? nodeTelemetryList[0];
  const primaryDet = primaryNode?.detection ?? latestDetection?.detection;
  const primaryRisk = primaryNode?.risk ?? latestDetection?.risk;
  const primaryMulti = primaryNode?.faultClassification ?? latestDetection?.faultClassification;
  const primaryExp = primaryNode?.explanation ?? latestDetection?.explanation;

  const classification = primaryDet?.classification ?? "NON_HIF";
  const hifProb = Math.round((primaryDet?.model_probability?.HIF ?? 0) * 100);
  const ruleScore = Math.round(primaryDet?.rule_score ?? 0);
  const ruleClassification = primaryDet?.rule_classification ?? "NORMAL";
  const reasons: string[] = primaryDet?.reasons ?? [];

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>📡</span> Edge Telemetry Monitor
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              DATASET REPLAY
            </span>
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
            Real-time DWT energy feature vectors (EA, EB, EC) replayed from public Mendeley dataset
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── DWT Energy Feature Cards Grid ────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> Phase DWT Energy Vectors
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Feature Space: 15 DWT Derived Parameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {nodeTelemetryList.map((item) => (
            <div
              key={item.nodeId}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-300 font-mono text-sm font-bold block">
                    {item.nodeId}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {item.lastHeartbeat ? timeAgo(item.lastHeartbeat) : "No heartbeat"}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/80">
                  SIMULATION
                </span>
              </div>

              {/* DWT Feature Values (EA, EB, EC) */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-700/40 text-center font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">EA</span>
                  <span className="text-emerald-400 font-bold text-xs block truncate" title={item.ea.toExponential(3)}>
                    {item.ea ? item.ea.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-slate-500 text-[9px] block">Phase A</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">EB</span>
                  <span className="text-emerald-400 font-bold text-xs block truncate" title={item.eb.toExponential(3)}>
                    {item.eb ? item.eb.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-slate-500 text-[9px] block">Phase B</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">EC</span>
                  <span className="text-emerald-400 font-bold text-xs block truncate" title={item.ec.toExponential(3)}>
                    {item.ec ? item.ec.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-slate-500 text-[9px] block">Phase C</span>
                </div>
              </div>

              {/* Footer status & Risk */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Type: <strong className="text-cyan-300">{item.faultClassification?.faultType ?? "Normal"}</strong></span>
                <span className={item.risk?.level === "CRITICAL" ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                  Risk: {item.risk?.level ?? "LOW"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Real-Time Backend Detection & Risk Breakdown ──── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>🧠</span> Telemetry Detection, Multi-Class &amp; Risk Intelligence
            <span className="text-cyan-400 font-mono text-xs normal-case">
              ({primaryNode?.nodeId ?? "GS-NODE-001"})
            </span>
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Model: Random Forest Multi-Class + Binary
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
          {/* Classification Badge */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase tracking-wider">Classification</span>
            <span className={`text-lg font-bold ${classification === "HIF" ? "text-red-400" : "text-emerald-400"}`}>
              {classification === "HIF" ? "🔴 HIF" : "🟢 NORMAL"}
            </span>
            <span className="text-slate-500 text-[10px] mt-1 block">Binary Detector</span>
          </div>

          {/* Fault Type */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase tracking-wider">Fault Type</span>
            <span className="text-lg font-bold text-cyan-300">
              {primaryMulti?.faultType ?? "Normal"}
            </span>
            <span className="text-slate-500 text-[10px] mt-1 block">
              Prob: {((primaryMulti?.faultTypeProbability ?? 1) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Risk Level & Score */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase tracking-wider">Risk Score</span>
            <span className={`text-lg font-bold ${primaryRisk?.level === "CRITICAL" ? "text-red-400" : primaryRisk?.level === "MEDIUM" ? "text-amber-400" : "text-emerald-400"}`}>
              {primaryRisk?.level ?? "LOW"} ({primaryRisk?.score ?? 0}/100)
            </span>
            <span className="text-slate-500 text-[10px] mt-1 block">Composite Score</span>
          </div>

          {/* Persistence Count */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase tracking-wider">Persistence</span>
            <span className="text-lg font-bold text-amber-300">
              {primaryRisk?.persistenceCount ?? 0} pkts
            </span>
            <span className="text-slate-500 text-[10px] mt-1 block">Consecutive Packets</span>
          </div>

          {/* Rule Score */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50 flex flex-col justify-between">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase tracking-wider">Rule Score</span>
            <span className={`text-lg font-bold ${ruleScore > 50 ? "text-amber-400" : "text-emerald-400"}`}>
              {ruleScore} / 100
            </span>
            <span className="text-slate-500 text-[10px] mt-1 block">{ruleClassification}</span>
          </div>
        </div>

        {/* Explanation Summary Box */}
        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 text-xs">
          <span className="text-cyan-400 font-mono font-semibold block mb-1 uppercase text-[11px]">
            Deterministic Evidence Explanation:
          </span>
          <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
            {primaryExp?.summary ?? "GridSenti verified nominal operating conditions. DWT energy feature ratios remain stable within steady-state normal bounds."}
          </p>
        </div>
      </section>

      {/* ── Detailed DWT Energy Matrix Table ─────────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> DWT Energy Feature Register
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Mendeley HIF Dataset Replay
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4">Node ID</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">EA (Phase A Energy)</th>
                <th className="py-3 px-4">EB (Phase B Energy)</th>
                <th className="py-3 px-4">EC (Phase C Energy)</th>
                <th className="py-3 px-4">Fault Type</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {nodeTelemetryList.map((item) => (
                <tr key={item.nodeId} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-300">{item.nodeId}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700 text-[11px]">
                      {item.simulationMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {item.ea ? item.ea.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {item.eb ? item.eb.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {item.ec ? item.ec.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-300">
                    {item.faultClassification?.faultType ?? "Normal"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${item.risk?.level === "CRITICAL" ? "text-red-400" : "text-emerald-400"}`}>
                      {item.risk?.level ?? "LOW"} ({item.risk?.score ?? 0}/100)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
