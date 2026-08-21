"use client";

import { useEffect, useState, useRef } from "react";
import StatusCard from "@/components/dashboard/StatusCard";
import NodeGrid from "@/components/nodes/NodeGrid";
import AlertPanel from "@/components/alerts/AlertPanel";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";
import EventTimeline from "@/components/dashboard/EventTimeline";
import SystemHealth from "@/components/dashboard/SystemHealth";
import TelemetryCard from "@/components/telemetry/TelemetryCard";

import { getAllNodes } from "@/services/node.service";
import { getActiveAlerts } from "@/services/alert.service";
import { getRecentEvents, getLatestSystemDetection } from "@/services/fault.service";
import { APP_CONFIG } from "@/config/app.config";
import type { MonitoringNode, Alert, EventLogItem, TelemetryPacket, SystemStatus } from "@/types";

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [latestDetection, setLatestDetection] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Polling ref to prevent concurrent overlapping fetches
  const isPollingRef = useRef<boolean>(false);

  const fetchLiveData = async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const [fetchedNodes, fetchedAlerts, fetchedEvents, fetchedDetection] =
        await Promise.all([
          getAllNodes(),
          getActiveAlerts(),
          getRecentEvents(),
          getLatestSystemDetection(),
        ]);

      setNodes(fetchedNodes);
      setAlerts(fetchedAlerts);
      setEvents(fetchedEvents);
      setLatestDetection(fetchedDetection);
      setIsConnected(true);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.warn("[Dashboard] Backend disconnected:", error);
      setIsConnected(false);
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLiveData();

    // 2-second polling loop
    const interval = setInterval(fetchLiveData, APP_CONFIG.pollingIntervalMs);
    return () => clearInterval(interval);
  }, []);

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

  // Determine HIF active state from latest detection
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

  // Extract live telemetry cards for each node
  const liveTelemetryPackets: TelemetryPacket[] = nodes.map((node) => {
    const rawTel = (node as any).latestTelemetry;
    const cur = rawTel?.ea ? Number((rawTel.ea / 1e9).toFixed(2)) : 0;
    const volt = rawTel?.eb ? Number((rawTel.eb / 1e8).toFixed(2)) : 0;
    const anom = rawTel?.ec ? Number((rawTel.ec / 1e10).toFixed(2)) : 0;
    return {
      nodeId: node.nodeId || node.id || "GS-NODE-XXX",
      currentA: cur,
      voltageV: volt,
      anomalyIdx: anom,
      current: cur,
      voltage: volt,
      waveformAnomaly: anom,
      rssiDbm: node.status === "ONLINE" ? -65 : -99,
      timestamp: node.lastHeartbeat ?? new Date().toISOString(),
    };
  });

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
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
                BACKEND DISCONNECTED
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            High-Impedance Fault Detection &amp; Monitoring · Prototype v0.1.0
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
              <p className="font-semibold text-cyan-200">
                LIVE SIMULATED EDGE TELEMETRY
              </p>
              <p className="text-cyan-400/80 text-[11px] mt-0.5">
                ESP8266 replaying Mendeley HIF Dataset (DOI: 10.17632/rvypj5rs5b.1).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-500/50 rounded-lg px-4 py-2.5 text-red-200 text-xs max-w-md shadow-sm">
            <span className="text-base shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-red-300">
                BACKEND DISCONNECTED — STALE DATA
              </p>
              <p className="text-red-400/80 text-[11px] mt-0.5">
                Cannot reach FastAPI at {APP_CONFIG.api.baseUrl}. Ensure backend server is running.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Overall Grid Status cards ────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>⬡</span> Overall Grid Status
          {!isConnected && (
            <span className="text-red-400 text-xs font-mono font-normal">
              [STALE DATA]
            </span>
          )}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard
            title="Total Nodes"
            value={totalNodes}
            status="neutral"
            icon="◉"
          />
          <StatusCard
            title="Online"
            value={onlineNodes}
            status="nominal"
            icon="🟢"
          />
          <StatusCard
            title="Warning"
            value={warningNodes}
            status="warning"
            icon="🟡"
          />
          <StatusCard
            title="Offline"
            value={offlineNodes}
            status="offline"
            icon="⚫"
          />
        </div>
      </section>

      {/* ── Monitoring Nodes ─────────────────────────────────── */}
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

      {/* ── Telemetry Overview ───────────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>📡</span> Telemetry Overview
          <span className="text-slate-500 text-xs font-normal normal-case">
            (live DWT energy features from edge nodes)
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {liveTelemetryPackets.length > 0 ? (
            liveTelemetryPackets.map((pkt) => (
              <TelemetryCard key={pkt.nodeId} packet={pkt} />
            ))
          ) : (
            <div className="col-span-4 p-4 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 text-xs font-mono">
              Awaiting edge node telemetry packets...
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Events timeline ───────────────────────────── */}
      <EventTimeline events={events} />
    </div>
  );
}
