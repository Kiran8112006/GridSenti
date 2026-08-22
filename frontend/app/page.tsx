"use client";

import { useState } from "react";
import StatusCard from "@/components/dashboard/StatusCard";
import NodeGrid from "@/components/nodes/NodeGrid";
import AlertPanel from "@/components/alerts/AlertPanel";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";
import EventTimeline from "@/components/dashboard/EventTimeline";
import SystemHealth from "@/components/dashboard/SystemHealth";
import UtilitySchematic from "@/components/dashboard/UtilitySchematic";
import PublicWarningPanel from "@/components/dashboard/PublicWarningPanel";
import SimulateIsolationModal from "@/components/dashboard/SimulateIsolationModal";

import { useGridSentiData } from "@/hooks/useGridSentiData";
import { simulateIsolation, resetIsolation } from "@/services/isolation.service";
import { APP_CONFIG } from "@/config/app.config";
import type { SystemStatus } from "@/types";

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

export default function DashboardPage() {
  const {
    nodes,
    alerts,
    events,
    latestDetection,
    publicWarnings,
    isConnected,
    lastUpdated,
    refresh,
  } = useGridSentiData();

  const [isIsolationModalOpen, setIsIsolationModalOpen] = useState(false);

  // Compute live system metrics
  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((n) => n.status === "ONLINE").length;
  const warningNodes = nodes.filter((n) => n.status === "WARNING").length;
  const offlineNodes = nodes.filter((n) => n.status === "OFFLINE").length;

  const systemState: SystemStatus["state"] =
    !isConnected
      ? "CRITICAL"
      : warningNodes > 0 || offlineNodes > 0
        ? "DEGRADED"
        : "NOMINAL";

  const systemStatusObj: SystemStatus = {
    state: systemState,
    totalNodes,
    onlineNodes,
    warningNodes,
    offlineNodes,
    activeAlerts: alerts.length,
  };

  // Extract latest detection & risk information
  const detectionObj = latestDetection?.detection;
  const riskObj = latestDetection?.risk;
  const multiclassObj = latestDetection?.faultClassification;
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

  const handleSimulateIsolationConfirm = async () => {
    await simulateIsolation(hifNodeId);
    await refresh();
  };

  const handleResetIsolation = async () => {
    await resetIsolation(hifNodeId);
    await refresh();
  };

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-semibold text-ink tracking-wide uppercase">
              Grid Operations Center
            </h1>
            <ConnectionBadge isConnected={isConnected} />
          </div>
          <p className="text-steel text-sm mt-0.5">
            High-Impedance Fault Detection, Safety Response &amp; Isolation Simulation · v0.2.0
            {lastUpdated && (
              <span className="text-steel-light text-xs ml-2 font-mono meter">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Dynamic Warning / Status Banner */}
        {isConnected ? (
          <div className="flex items-center gap-2.5 bg-signal-light border-l-4 border-signal rounded-r-md pl-3 pr-4 py-2 text-signal text-xs max-w-md">
            <span className="text-sm shrink-0">∿</span>
            <div>
              <p className="font-display font-semibold uppercase tracking-wide">
                Live Edge Telemetry Stream
              </p>
              <p className="text-signal/80 text-[11px] mt-0.5 font-mono">
                ESP8266 replaying Mendeley HIF Dataset (DOI: 10.17632/rvypj5rs5b.1).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-critical-light border-l-4 border-critical rounded-r-md pl-3 pr-4 py-2 text-critical text-xs max-w-md">
            <span className="text-sm shrink-0">▲</span>
            <div>
              <p className="font-display font-semibold uppercase tracking-wide">
                Backend Disconnected — Stale Data
              </p>
              <p className="text-critical/80 text-[11px] mt-0.5 font-mono">
                Cannot reach FastAPI at {APP_CONFIG.api.baseUrl}. Ensure backend server is running.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Overall Grid Status cards ────────────────────────── */}
      <section>
        <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
          <span className="text-signal">▣</span> Overall Grid Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard title="Total Nodes" value={totalNodes} status="neutral" icon="▣" />
          <StatusCard title="Online" value={onlineNodes} status="nominal" icon="●" />
          <StatusCard title="Warning" value={warningNodes} status="warning" icon="●" />
          <StatusCard title="Offline" value={offlineNodes} status="offline" icon="●" />
        </div>
      </section>

      {/* ── Batch 2 Safety Response & Risk Intelligence Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Risk Score */}
        <div className="bg-panel border border-line rounded-lg p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-steel uppercase font-display font-bold text-[11px] tracking-wide">System Risk Score</span>
            <span
              className={`px-2 py-0.5 rounded font-bold meter border ${
                riskObj?.level === "CRITICAL"
                  ? "bg-critical-light text-critical border-critical/20"
                  : riskObj?.level === "MEDIUM"
                    ? "bg-warning-light text-warning border-warning/20"
                    : "bg-nominal-light text-nominal border-nominal/20"
              }`}
            >
              {riskObj?.level ?? "LOW"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold meter text-ink">
              {riskObj?.score ?? 0} <span className="text-xs text-steel-light font-normal">/ 100</span>
            </span>
            <span className="text-steel text-[11px]">
              Persistence: <strong className="text-warning">{riskObj?.persistenceCount ?? 0}</strong> pkts
            </span>
          </div>

          <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                riskObj?.level === "CRITICAL"
                  ? "bg-critical"
                  : riskObj?.level === "MEDIUM"
                    ? "bg-warning"
                    : "bg-nominal"
              }`}
              style={{ width: `${riskObj?.score ?? 0}%` }}
            />
          </div>

          <span className="text-[10px] text-steel block truncate">
            Action: <strong className="text-signal">{riskObj?.recommendedAction ?? "CONTINUE_MONITORING"}</strong>
          </span>
        </div>

        {/* Multi-Class Fault Type */}
        <div className="bg-panel border border-line rounded-lg p-4 font-mono text-xs space-y-3">
          <span className="text-steel uppercase font-display font-bold text-[11px] tracking-wide block">Predicted Fault Type</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold meter ${multiclassObj?.faultType === "HIF" ? "text-critical" : "text-signal"}`}>
              {multiclassObj?.faultType ?? "Normal"}
            </span>
            <span className="text-steel text-[11px]">
              Prob: <strong className="text-nominal">{((multiclassObj?.faultTypeProbability ?? 1) * 100).toFixed(0)}%</strong>
            </span>
          </div>
          <p className="text-[10px] text-steel-light">
            Trained Classes: Normal, LG, LLG, LLLG, LL, HIF, CS, LS
          </p>
        </div>

        {/* Communication State */}
        <div className="bg-panel border border-line rounded-lg p-4 font-mono text-xs space-y-3">
          <span className="text-steel uppercase font-display font-bold text-[11px] tracking-wide block">Communication State</span>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${commStateObj === "REMOTE_CONNECTED" ? "bg-nominal" : commStateObj === "LOCAL_FALLBACK" ? "bg-warning" : "bg-offline"}`} />
            <span className={`text-base font-bold meter ${commStateObj === "REMOTE_CONNECTED" ? "text-nominal" : commStateObj === "LOCAL_FALLBACK" ? "text-warning" : "text-offline"}`}>
              {commStateObj === "REMOTE_CONNECTED" ? "REMOTE CONNECTED" : commStateObj === "LOCAL_FALLBACK" ? "LOCAL FALLBACK" : "UNAVAILABLE"}
            </span>
          </div>
          <p className="text-[10px] text-steel-light">
            {commStateObj === "LOCAL_FALLBACK"
              ? "ESP8266 local fallback anomaly detection active."
              : "ESP8266 transmitting telemetry to FastAPI."}
          </p>
        </div>

        {/* Safe Isolation Simulation Card */}
        <div className="bg-panel border border-line rounded-lg p-4 font-mono text-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-steel uppercase font-display font-bold text-[11px] tracking-wide">Software Isolation</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-isolation-light text-isolation border border-isolation/20">
                SIMULATION
              </span>
            </div>

            <span className={`text-sm font-bold meter flex items-center gap-1.5 ${isolationObj?.status === "ISOLATED" ? "text-isolation" : isolationObj?.status === "ISOLATION_RECOMMENDED" ? "text-warning" : "text-nominal"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isolationObj?.status === "ISOLATED" ? "bg-isolation" : isolationObj?.status === "ISOLATION_RECOMMENDED" ? "bg-warning" : "bg-nominal"}`} />
              {isolationObj?.status === "ISOLATED"
                ? "SECTION ISOLATED (SIM)"
                : isolationObj?.status === "ISOLATION_RECOMMENDED"
                  ? "ISOLATION RECOMMENDED"
                  : "NOT ISOLATED"}
            </span>
          </div>

          <div>
            {isolationObj?.status === "ISOLATED" ? (
              <button
                onClick={handleResetIsolation}
                className="w-full py-1.5 rounded bg-paper hover:bg-line text-signal border border-signal/30 text-[11px] font-display font-bold uppercase tracking-wide transition-colors"
              >
                [ Reset Isolation ]
              </button>
            ) : (
              <button
                onClick={() => setIsIsolationModalOpen(true)}
                className={`w-full py-1.5 rounded text-[11px] font-display font-bold uppercase tracking-wide transition-colors border ${
                  riskObj?.level === "CRITICAL"
                    ? "bg-critical hover:bg-critical/90 text-white border-critical"
                    : "bg-paper hover:bg-line text-steel border-line"
                }`}
              >
                [ Simulate Isolation ]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Public Hazard Warning Simulation Panel ───────────── */}
      <PublicWarningPanel
        warnings={publicWarnings}
        activeNodeId={hifNodeId}
        onRefresh={refresh}
      />

      {/* ── Feeder Topology Schematic ───────────────────────── */}
      <UtilitySchematic nodes={nodes} />

      {/* ── Monitoring Nodes Grid ───────────────────────────── */}
      <NodeGrid nodes={nodes} />

      {/* ── Two-column: Alerts + HIF Detection ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel alerts={alerts} />
        <HIFStatusPanel
          isDetecting={isHifActive}
          confidence={hifConfidence}
          ruleScore={hifRuleScore}
          nodeId={hifNodeId}
          detectionMethod="HYBRID"
          reasons={hifReasons}
        />
      </div>

      {/* ── Two-column: Fault Location + System Health ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FaultLocation
          latitude={28.635}
          longitude={77.225}
          nodeId={isHifActive ? hifNodeId : null}
        />
        <SystemHealth
          status={systemStatusObj}
          backendStatus={isConnected ? "CONNECTED" : "DISCONNECTED"}
          mlModelStatus="READY"
        />
      </div>

      {/* ── Recent Events timeline ───────────────────────────── */}
      <EventTimeline events={events} />

      {/* ── Simulate Isolation Confirmation Modal ────────────── */}
      <SimulateIsolationModal
        isOpen={isIsolationModalOpen}
        nodeId={hifNodeId}
        onClose={() => setIsIsolationModalOpen(false)}
        onConfirm={handleSimulateIsolationConfirm}
      />
    </div>
  );
}
