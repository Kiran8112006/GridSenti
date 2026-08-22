"use client";

import { useGridSentiData } from "@/hooks/useGridSentiData";
import EventTimeline from "@/components/dashboard/EventTimeline";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";
import PublicWarningPanel from "@/components/dashboard/PublicWarningPanel";

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

export default function FaultsPage() {
  const { latestDetection, events, publicWarnings, isConnected, lastUpdated, refresh } = useGridSentiData();

  const detectionObj = latestDetection?.detection;
  const riskObj = latestDetection?.risk;
  const multiclassObj = latestDetection?.faultClassification;
  const localizationObj = latestDetection?.localization;
  const explanationObj = latestDetection?.explanation;
  const isolationObj = latestDetection?.isolationState;
  const commStateObj = latestDetection?.communicationState || "REMOTE_CONNECTED";

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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-wide uppercase flex items-center gap-2">
              <span className="text-warning">▲</span> Faults &amp; Safety Response Intelligence Log
            </h1>
            <ConnectionBadge isConnected={isConnected} />
          </div>
          <p className="text-steel text-sm mt-0.5">
            Multi-class classification, software isolation &amp; public hazard warnings · GET /api/detection/latest
            {lastUpdated && (
              <span className="text-steel-light text-xs ml-2 font-mono meter">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Localization Disclaimer Banner */}
        <div className="flex items-center gap-2.5 bg-warning-light border-l-4 border-warning rounded-r-md pl-3 pr-4 py-2 text-warning text-xs max-w-md">
          <span className="text-sm shrink-0">◎</span>
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

      {/* ── Fault Intelligence & Safety Matrix Card ─────────── */}
      <section className="bg-panel border border-line rounded-lg p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="text-signal">◈</span> Multi-Class Fault &amp; Safety Response Output
          </h2>
          {latestDetection?.timestamp && (
            <span className="text-steel-light text-xs font-mono">
              Timestamp: {latestDetection.timestamp}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-paper p-3.5 rounded-md border border-line">
            <span className="text-steel-light block mb-1">Multi-Class Fault Type</span>
            <span className="text-base font-bold meter text-signal">
              {multiclassObj?.faultType ?? "Normal"}
            </span>
            <div className="mt-2 text-[11px] text-steel">
              Prob: <span className="text-nominal font-bold">{((multiclassObj?.faultTypeProbability ?? 1) * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line">
            <span className="text-steel-light block mb-1">Risk Level &amp; Score</span>
            <span className={`text-base font-bold meter ${riskObj?.level === "CRITICAL" ? "text-critical" : riskObj?.level === "MEDIUM" ? "text-warning" : "text-nominal"}`}>
              {riskObj?.level ?? "LOW"} ({riskObj?.score ?? 0}/100)
            </span>
            <div className="mt-2 text-[11px] text-steel">
              Persistence: <span className="text-warning font-bold">{riskObj?.persistenceCount ?? 0} pkts</span>
            </div>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line">
            <span className="text-steel-light block mb-1">Communication State</span>
            <span className={`text-sm font-bold meter ${commStateObj === "REMOTE_CONNECTED" ? "text-nominal" : commStateObj === "LOCAL_FALLBACK" ? "text-warning" : "text-offline"}`}>
              {commStateObj}
            </span>
            <div className="mt-2 text-[11px] text-steel">
              {commStateObj === "LOCAL_FALLBACK" ? "Local Fallback Active" : "Remote Telemetry"}
            </div>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line">
            <span className="text-steel-light block mb-1">Software Isolation</span>
            <span className={`text-sm font-bold meter ${isolationObj?.status === "ISOLATED" ? "text-isolation" : isolationObj?.status === "ISOLATION_RECOMMENDED" ? "text-warning" : "text-nominal"}`}>
              {isolationObj?.status ?? "NOT_ISOLATED"}
            </span>
            <div className="mt-2 text-[11px] text-steel">
              Software Simulation
            </div>
          </div>

          <div className="bg-paper p-3.5 rounded-md border border-line">
            <span className="text-steel-light block mb-1">Recommended Action</span>
            <span className="text-xs font-bold text-warning">
              {riskObj?.recommendedAction ?? "CONTINUE_MONITORING"}
            </span>
          </div>
        </div>

        {/* Explanation Summary Box */}
        <div className="bg-paper p-4 rounded-md border border-line space-y-2">
          <span className="text-signal font-display font-bold block uppercase text-[11px] tracking-wide">
            Deterministic Evidence Explanation:
          </span>
          <p className="text-steel text-xs leading-relaxed">
            {explanationObj?.summary ?? "GridSenti verified nominal operating conditions. DWT energy feature ratios remain stable within steady-state bounds."}
          </p>
        </div>
      </section>

      {/* ── Public Warning Simulation Panel ───────────── */}
      <PublicWarningPanel
        warnings={publicWarnings}
        activeNodeId={hifNodeId}
        onRefresh={refresh}
      />

      {/* ── Event Log Timeline ───────────────────────────────── */}
      <EventTimeline events={events} />
    </div>
  );
}
