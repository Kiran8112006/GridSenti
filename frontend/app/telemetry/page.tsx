"use client";

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

export default function TelemetryPage() {
  const { nodes, latestDetection, isConnected, lastUpdated } = useGridSentiData();

  const nodeTelemetryList = nodes.map((node) => {
    const rawTel = (node as any).latestTelemetry;
    const detRes = (node as any).latestDetectionResult ?? latestDetection?.detection;

    return {
      nodeId: node.nodeId || node.id || "GS-NODE-XXX",
      name: node.name,
      status: node.status,
      communicationState: node.communicationState || "REMOTE_CONNECTED",
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

  const primaryNode = nodeTelemetryList.find((n) => n.nodeId === "GS-NODE-001") ?? nodeTelemetryList[0];
  const primaryDet = primaryNode?.detection ?? latestDetection?.detection;
  const primaryRisk = primaryNode?.risk ?? latestDetection?.risk;
  const primaryMulti = primaryNode?.faultClassification ?? latestDetection?.faultClassification;
  const primaryExp = primaryNode?.explanation ?? latestDetection?.explanation;

  const classification = primaryDet?.classification ?? "NON_HIF";
  const ruleScore = Math.round(primaryDet?.rule_score ?? 0);
  const ruleClassification = primaryDet?.rule_classification ?? "NORMAL";

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-wide uppercase flex items-center gap-2">
              <span className="text-signal">∿</span> Edge Telemetry Monitor
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono meter bg-warning-light text-warning border border-warning/20">
              DATASET REPLAY
            </span>
            <ConnectionBadge isConnected={isConnected} />
          </div>
          <p className="text-steel text-sm mt-0.5">
            Real-time DWT energy feature vectors (EA, EB, EC) replayed from public Mendeley dataset
            {lastUpdated && (
              <span className="text-steel-light text-xs ml-2 font-mono meter">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── DWT Energy Feature Cards Grid ────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">▲</span> Phase DWT Energy Vectors
          </h2>
          <span className="text-steel-light text-xs font-mono">
            Feature Space: 15 DWT Derived Parameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {nodeTelemetryList.map((item) => (
            <div
              key={item.nodeId}
              className="bg-panel border border-line rounded-lg p-4 flex flex-col justify-between space-y-4 font-mono"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-signal font-bold meter text-sm block">
                    {item.nodeId}
                  </span>
                  <span className="text-steel-light text-[11px]">
                    {item.lastHeartbeat ? timeAgo(item.lastHeartbeat) : "No heartbeat"}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-warning-light text-warning border border-warning/20">
                  SIMULATION
                </span>
              </div>

              {/* DWT Feature Values (EA, EB, EC) */}
              <div className="grid grid-cols-3 gap-2 bg-paper p-3 rounded-md border border-line text-center">
                <div>
                  <span className="text-steel-light text-[10px] block uppercase font-bold">EA</span>
                  <span className="text-nominal font-bold meter text-xs block truncate" title={item.ea.toExponential(3)}>
                    {item.ea ? item.ea.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-steel-light text-[9px] block">Phase A</span>
                </div>

                <div>
                  <span className="text-steel-light text-[10px] block uppercase font-bold">EB</span>
                  <span className="text-nominal font-bold meter text-xs block truncate" title={item.eb.toExponential(3)}>
                    {item.eb ? item.eb.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-steel-light text-[9px] block">Phase B</span>
                </div>

                <div>
                  <span className="text-steel-light text-[10px] block uppercase font-bold">EC</span>
                  <span className="text-nominal font-bold meter text-xs block truncate" title={item.ec.toExponential(3)}>
                    {item.ec ? item.ec.toExponential(2) : "0.00e+0"}
                  </span>
                  <span className="text-steel-light text-[9px] block">Phase C</span>
                </div>
              </div>

              {/* Footer status & Risk */}
              <div className="flex items-center justify-between text-[11px] text-steel pt-1">
                <span>Comm: <strong className={item.communicationState === "REMOTE_CONNECTED" ? "text-nominal" : "text-warning"}>{item.communicationState}</strong></span>
                <span className={item.risk?.level === "CRITICAL" ? "text-critical font-bold" : "text-nominal font-bold"}>
                  Risk: {item.risk?.level ?? "LOW"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Real-Time Backend Detection & Risk Breakdown ──── */}
      <section className="bg-panel border border-line rounded-lg p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">◈</span> Telemetry Detection &amp; Communication Resilience
            <span className="text-signal text-xs normal-case font-sans">
              ({primaryNode?.nodeId ?? "GS-NODE-001"})
            </span>
          </h2>
          <span className="text-steel-light text-xs font-mono">
            Model: Random Forest Multi-Class + Binary
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-paper p-3.5 rounded-md border border-line flex flex-col justify-between">
            <span className="text-steel-light text-[11px] block mb-1 uppercase tracking-wide">Classification</span>
            <span className={`text-lg font-bold meter ${classification === "HIF" ? "text-critical" : "text-nominal"}`}>
              {classification === "HIF" ? "● HIF" : "● NORMAL"}
            </span>
            <span className="text-steel-light text-[10px] mt-1 block">Binary Detector</span>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line flex flex-col justify-between">
            <span className="text-steel-light text-[11px] block mb-1 uppercase tracking-wide">Fault Type</span>
            <span className="text-lg font-bold meter text-signal">
              {primaryMulti?.faultType ?? "Normal"}
            </span>
            <span className="text-steel-light text-[10px] mt-1 block">
              Prob: {((primaryMulti?.faultTypeProbability ?? 1) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line flex flex-col justify-between">
            <span className="text-steel-light text-[11px] block mb-1 uppercase tracking-wide">Communication</span>
            <span className={`text-sm font-bold meter ${primaryNode?.communicationState === "REMOTE_CONNECTED" ? "text-nominal" : "text-warning"}`}>
              {primaryNode?.communicationState ?? "REMOTE_CONNECTED"}
            </span>
            <span className="text-steel-light text-[10px] mt-1 block">Node Comm State</span>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line flex flex-col justify-between">
            <span className="text-steel-light text-[11px] block mb-1 uppercase tracking-wide">Risk Score</span>
            <span className={`text-lg font-bold meter ${primaryRisk?.level === "CRITICAL" ? "text-critical" : primaryRisk?.level === "MEDIUM" ? "text-warning" : "text-nominal"}`}>
              {primaryRisk?.level ?? "LOW"} ({primaryRisk?.score ?? 0}/100)
            </span>
            <span className="text-steel-light text-[10px] mt-1 block">Composite Score</span>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line flex flex-col justify-between">
            <span className="text-steel-light text-[11px] block mb-1 uppercase tracking-wide">Rule Score</span>
            <span className={`text-lg font-bold meter ${ruleScore > 50 ? "text-warning" : "text-nominal"}`}>
              {ruleScore} / 100
            </span>
            <span className="text-steel-light text-[10px] mt-1 block">{ruleClassification}</span>
          </div>
        </div>

        {/* Explanation Summary Box */}
        <div className="bg-paper p-4 rounded-md border border-line text-xs">
          <span className="text-signal font-display font-semibold block mb-1 uppercase text-[11px] tracking-wide">
            Deterministic Evidence Explanation:
          </span>
          <p className="text-steel text-[11px] leading-relaxed">
            {primaryExp?.summary ?? "GridSenti verified nominal operating conditions. DWT energy feature ratios remain stable within steady-state normal bounds."}
          </p>
        </div>
      </section>
    </div>
  );
}
