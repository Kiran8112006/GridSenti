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

  const handleSimulateIsolationConfirm = async () => {
    await simulateIsolation(hifNodeId);
    await refresh();
  };

  const handleResetIsolation = async () => {
    await resetIsolation(hifNodeId);
    await refresh();
  };

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto font-sans">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Grid Operations Center
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
            High-Impedance Fault Detection, Safety Response &amp; Isolation Simulation · v0.2.0
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Dynamic Warning / Status Banner */}
        {isConnected ? (
          <div className="flex items-center gap-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-4 py-2.5 text-cyan-300 text-xs max-w-md shadow-sm">
            <span className="text-base shrink-0">📡</span>
            <div>
              <p className="font-semibold text-cyan-200 uppercase font-mono">
                LIVE EDGE TELEMETRY STREAM
              </p>
              <p className="text-cyan-400/80 text-[11px] mt-0.5 font-mono">
                ESP8266 replaying Mendeley HIF Dataset (DOI: 10.17632/rvypj5rs5b.1).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-500/50 rounded-lg px-4 py-2.5 text-red-200 text-xs max-w-md shadow-sm">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-red-300 font-mono uppercase">
                BACKEND DISCONNECTED — STALE DATA
              </p>
              <p className="text-red-400/80 text-[11px] mt-0.5 font-mono">
                Cannot reach FastAPI at {APP_CONFIG.api.baseUrl}. Ensure backend server is running.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Overall Grid Status cards ────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
          <span>⬡</span> Overall Grid Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard title="Total Nodes" value={totalNodes} status="neutral" icon="◉" />
          <StatusCard title="Online" value={onlineNodes} status="nominal" icon="🟢" />
          <StatusCard title="Warning" value={warningNodes} status="warning" icon="🟡" />
          <StatusCard title="Offline" value={offlineNodes} status="offline" icon="⚫" />
        </div>
      </section>

      {/* ── Batch 2 Safety Response & Risk Intelligence Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Risk Score */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase font-bold text-[11px]">System Risk Score</span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                riskObj?.level === "CRITICAL"
                  ? "bg-red-950 text-red-400 border border-red-800"
                  : riskObj?.level === "MEDIUM"
                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                    : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }`}
            >
              {riskObj?.level ?? "LOW"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              {riskObj?.score ?? 0} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              Persistence: <strong className="text-amber-300">{riskObj?.persistenceCount ?? 0}</strong> pkts
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                riskObj?.level === "CRITICAL"
                  ? "bg-red-500"
                  : riskObj?.level === "MEDIUM"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${riskObj?.score ?? 0}%` }}
            />
          </div>

          <span className="text-[10px] text-slate-400 block truncate">
            Action: <strong className="text-cyan-300">{riskObj?.recommendedAction ?? "CONTINUE_MONITORING"}</strong>
          </span>
        </div>

        {/* Multi-Class Fault Type */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 font-mono text-xs space-y-3">
          <span className="text-slate-400 uppercase font-bold text-[11px] block">Predicted Fault Type</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${multiclassObj?.faultType === "HIF" ? "text-red-400" : "text-cyan-300"}`}>
              {multiclassObj?.faultType ?? "Normal"}
            </span>
            <span className="text-slate-400 text-[11px]">
              Prob: <strong className="text-emerald-400">{((multiclassObj?.faultTypeProbability ?? 1) * 100).toFixed(0)}%</strong>
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Trained Classes: Normal, LG, LLG, LLLG, LL, HIF, CS, LS
          </p>
        </div>

        {/* Communication State */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 font-mono text-xs space-y-3">
          <span className="text-slate-400 uppercase font-bold text-[11px] block">Communication State</span>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${commStateObj === "REMOTE_CONNECTED" ? "bg-emerald-400" : commStateObj === "LOCAL_FALLBACK" ? "bg-amber-400 animate-pulse" : "bg-slate-500"}`} />
            <span className={`text-base font-bold ${commStateObj === "REMOTE_CONNECTED" ? "text-emerald-400" : commStateObj === "LOCAL_FALLBACK" ? "text-amber-400" : "text-slate-400"}`}>
              {commStateObj === "REMOTE_CONNECTED" ? "REMOTE CONNECTED" : commStateObj === "LOCAL_FALLBACK" ? "LOCAL FALLBACK" : "UNAVAILABLE"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {commStateObj === "LOCAL_FALLBACK"
              ? "ESP8266 local fallback anomaly detection active."
              : "ESP8266 transmitting telemetry to FastAPI."}
          </p>
        </div>

        {/* Safe Isolation Simulation Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 font-mono text-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 uppercase font-bold text-[11px]">Software Isolation</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-purple-400 border border-purple-800">
                SIMULATION
              </span>
            </div>

            <span className={`text-sm font-bold block ${isolationObj?.status === "ISOLATED" ? "text-purple-400" : isolationObj?.status === "ISOLATION_RECOMMENDED" ? "text-amber-400" : "text-emerald-400"}`}>
              {isolationObj?.status === "ISOLATED"
                ? "🔴 SECTION ISOLATED (SIM)"
                : isolationObj?.status === "ISOLATION_RECOMMENDED"
                  ? "🟡 ISOLATION RECOMMENDED"
                  : "🟢 NOT ISOLATED"}
            </span>
          </div>

          <div>
            {isolationObj?.status === "ISOLATED" ? (
              <button
                onClick={handleResetIsolation}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all"
              >
                [ RESET ISOLATION ]
              </button>
            ) : (
              <button
                onClick={() => setIsIsolationModalOpen(true)}
                className={`w-full py-1.5 rounded text-[11px] font-bold transition-all border ${
                  riskObj?.level === "CRITICAL"
                    ? "bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-md shadow-red-600/20"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                [ SIMULATE ISOLATION ]
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
