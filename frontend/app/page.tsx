// GridSenti — Main Dashboard Page
// Data is MOCK / SIMULATED for the skeleton prototype

import StatusCard from "@/components/dashboard/StatusCard";
import NodeGrid from "@/components/nodes/NodeGrid";
import AlertPanel from "@/components/alerts/AlertPanel";
import HIFStatusPanel from "@/components/dashboard/HIFStatusPanel";
import FaultLocation from "@/components/dashboard/FaultLocation";
import EventTimeline from "@/components/dashboard/EventTimeline";
import SystemHealth from "@/components/dashboard/SystemHealth";
import TelemetryCard from "@/components/telemetry/TelemetryCard";

import {
  MOCK_NODES,
  MOCK_TELEMETRY,
  MOCK_ALERTS,
  MOCK_FAULTS,
  MOCK_EVENTS,
  MOCK_SYSTEM_STATUS,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const activeFault = MOCK_FAULTS[0];

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page title ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Grid Operations Center
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            High-Impedance Fault Detection &amp; Monitoring · Prototype v0.1.0
          </p>
        </div>

        {/* Mock-data warning banner */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-400 text-xs max-w-sm">
          <span className="text-base shrink-0">⚠</span>
          <span>
            All electrical readings are <strong>SIMULATED</strong>. No physical
            sensors connected.
          </span>
        </div>
      </div>

      {/* ── Overall Grid Status cards ────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>⬡</span> Overall Grid Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard
            title="Total Nodes"
            value={MOCK_SYSTEM_STATUS.totalNodes}
            status="neutral"
            icon="◉"
          />
          <StatusCard
            title="Online"
            value={MOCK_SYSTEM_STATUS.onlineNodes}
            status="nominal"
            icon="🟢"
          />
          <StatusCard
            title="Warning"
            value={MOCK_SYSTEM_STATUS.warningNodes}
            status="warning"
            icon="🟡"
          />
          <StatusCard
            title="Offline"
            value={MOCK_SYSTEM_STATUS.offlineNodes}
            status="offline"
            icon="⚫"
          />
        </div>
      </section>

      {/* ── Monitoring Nodes ─────────────────────────────────── */}
      <NodeGrid nodes={MOCK_NODES} />

      {/* ── Two-column: Alerts + HIF Detection ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertPanel alerts={MOCK_ALERTS} />
        <HIFStatusPanel
          isDetecting={!!activeFault}
          confidence={activeFault?.confidence}
          nodeId={activeFault?.nodeId}
          detectionMethod="PENDING"
        />
      </div>

      {/* ── Two-column: Fault Location + System Health ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FaultLocation
          latitude={activeFault?.estimatedLatitude}
          longitude={activeFault?.estimatedLongitude}
          nodeId={activeFault?.nodeId}
        />
        <SystemHealth status={MOCK_SYSTEM_STATUS} />
      </div>

      {/* ── Telemetry Overview ───────────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>📡</span> Telemetry Overview
          <span className="text-slate-500 text-xs font-normal normal-case">
            (simulated readings)
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {MOCK_TELEMETRY.map((pkt) => (
            <TelemetryCard key={pkt.nodeId} packet={pkt} />
          ))}
        </div>
      </section>

      {/* ── Recent Events timeline ───────────────────────────── */}
      <EventTimeline events={MOCK_EVENTS} />
    </div>
  );
}
