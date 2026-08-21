"use client";

import { useGridSentiData } from "@/hooks/useGridSentiData";
import EventTimeline from "@/components/dashboard/EventTimeline";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";
import { timeAgo } from "@/utils";

export default function FaultsPage() {
  const { latestDetection, events, isConnected, lastUpdated } = useGridSentiData();

  const detectionObj = latestDetection?.detection;
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
              <span>⚡</span> Faults &amp; Anomaly Detection Log
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
            Real-time HIF classification &amp; feature anomaly breakdown · GET /api/detection/latest
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Prototype disclaimer banner */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-amber-300 text-xs max-w-md">
          <span className="text-base shrink-0">📍</span>
          <span>
            Current prototype provides <strong>node-level identification</strong>, not true multi-point section fault localization.
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

      {/* ── Latest System Detection Breakdown Card ────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>🔍</span> Latest Detection Output Details
          </h2>
          {latestDetection?.timestamp && (
            <span className="text-slate-400 text-xs font-mono">
              Timestamp: {latestDetection.timestamp}
            </span>
          )}
        </div>

        {detectionObj ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Random Forest Prediction</span>
              <span className={`text-base font-bold ${detectionObj.classification === "HIF" ? "text-red-400" : "text-emerald-400"}`}>
                {detectionObj.classification}
              </span>
              <div className="mt-2 text-[11px] text-slate-400">
                HIF Voting Prob: <span className="text-cyan-300 font-bold">{((detectionObj.model_probability?.HIF ?? 0) * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Prototype Rule Engine</span>
              <span className={`text-base font-bold ${detectionObj.rule_classification === "POSSIBLE_HIF" ? "text-amber-400" : "text-emerald-400"}`}>
                {detectionObj.rule_classification}
              </span>
              <div className="mt-2 text-[11px] text-slate-400">
                Rule Anomaly Score: <span className="text-amber-300 font-bold">{detectionObj.rule_score?.toFixed(1) ?? "0.0"} / 100</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
              <span className="text-slate-500 block mb-1">Reporting Edge Node</span>
              <span className="text-base font-bold text-cyan-300">
                {latestDetection.nodeId ?? "GS-NODE-001"}
              </span>
              <div className="mt-2 text-[11px] text-slate-400">
                Node Status: <span className="text-emerald-400 font-bold">{latestDetection.nodeStatus ?? "ONLINE"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs font-mono">
            {isConnected ? "Awaiting detection telemetry from edge nodes..." : "Backend disconnected."}
          </div>
        )}
      </section>

      {/* ── Event Log Timeline ───────────────────────────────── */}
      <EventTimeline events={events} />
    </div>
  );
}
