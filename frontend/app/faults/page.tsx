"use client";

import { useGridSentiData } from "@/hooks/useGridSentiData";
import EventTimeline from "@/components/dashboard/EventTimeline";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";

export default function FaultsPage() {
  const { latestDetection, events, isConnected, lastUpdated } = useGridSentiData();

  const detectionObj = latestDetection?.detection;
  const riskObj = latestDetection?.risk;
  const multiclassObj = latestDetection?.faultClassification;
  const localizationObj = latestDetection?.localization;
  const explanationObj = latestDetection?.explanation;

  const isHifActive =
    detectionObj &&
    (detectionObj.classification === "HIF" ||
      detectionObj.rule_classification === "POSSIBLE_HIF" ||
      (detectionObj.model_probability?.HIF ?? 0) >= 0.7);

  const hifNodeId = latestDetection?.nodeId ?? "GS-NODE-001";
  const hifConfidence = detectionObj?.model_probability?.HIF ?? null;
  const hifRuleScore = detectionObj?.rule_score ?? null;
  const hifReasons = detectionObj?.reasons ?? [];

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>⚡</span> Faults &amp; Anomaly Intelligence Log
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
            Multi-class classification, risk scoring &amp; deterministic explanations · GET /api/detection/latest
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Localization Disclaimer Banner */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-amber-300 text-xs max-w-md">
          <span className="text-base shrink-0">📍</span>
          <span>
            {localizationObj?.disclaimer ?? "Current prototype provides node-level identification, not true multi-point section fault localization."}
          </span>
        </div>
      </div>

      {/* ── Two-Column Detection Status + Map ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HIFStatusPanel
          isDetecting={isHifActive}
          confidence={hifConfidence}
          ruleScore={hifRuleScore}
          nodeId={hifNodeId}
          detectionMethod="HYBRID"
          reasons={hifReasons}
        />
        <FaultLocation
          latitude={28.635}
          longitude={77.225}
          nodeId={isHifActive ? hifNodeId : null}
        />
      </div>

      {/* ── Fault Intelligence & Risk Matrix Card ─────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>🧠</span> Multi-Class Fault &amp; Risk Intelligence Output
          </h2>
          {latestDetection?.timestamp && (
            <span className="text-slate-400 text-xs font-mono">
              Timestamp: {latestDetection.timestamp}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-500 block mb-1">Multi-Class Fault Type</span>
            <span className="text-base font-bold text-cyan-300">
              {multiclassObj?.faultType ?? "Normal"}
            </span>
            <div className="mt-2 text-[11px] text-slate-400">
              Type Prob: <span className="text-emerald-400 font-bold">{((multiclassObj?.faultTypeProbability ?? 1) * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-500 block mb-1">Risk Level &amp; Score</span>
            <span className={`text-base font-bold ${riskObj?.level === "CRITICAL" ? "text-red-400" : riskObj?.level === "MEDIUM" ? "text-amber-400" : "text-emerald-400"}`}>
              {riskObj?.level ?? "LOW"} ({riskObj?.score ?? 0}/100)
            </span>
            <div className="mt-2 text-[11px] text-slate-400">
              Persistence: <span className="text-amber-300 font-bold">{riskObj?.persistenceCount ?? 0} pkts</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-500 block mb-1">Localization Output</span>
            <span className="text-base font-bold text-cyan-300">
              {localizationObj?.localizationType ?? "NODE_LEVEL"}
            </span>
            <div className="mt-2 text-[11px] text-slate-400 truncate">
              Node: <span className="text-slate-200 font-bold">{localizationObj?.nodeId ?? hifNodeId}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-500 block mb-1">Recommended Action</span>
            <span className="text-xs font-bold text-amber-300">
              {riskObj?.recommendedAction ?? "CONTINUE_MONITORING"}
            </span>
          </div>
        </div>

        {/* Explanation Summary Box */}
        <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/50 space-y-2">
          <span className="text-cyan-400 font-bold block uppercase text-[11px]">
            Deterministic Evidence Explanation:
          </span>
          <p className="text-slate-300 text-xs leading-relaxed">
            {explanationObj?.summary ?? "GridSenti verified nominal operating conditions. DWT energy feature ratios remain stable within steady-state bounds."}
          </p>
          {explanationObj?.evidence && explanationObj.evidence.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
              {explanationObj.evidence.map((ev: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-cyan-400">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Event Log Timeline ───────────────────────────────── */}
      <EventTimeline events={events} />
    </div>
  );
}
