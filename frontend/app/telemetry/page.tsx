"use client";

import TelemetryCard from "@/components/telemetry/TelemetryCard";
import { useGridSentiData } from "@/hooks/useGridSentiData";
import type { TelemetryPacket } from "@/types";

export default function TelemetryPage() {
  const { nodes, isConnected, lastUpdated } = useGridSentiData();

  // Extract telemetry packets for all nodes
  const telemetryPackets: (TelemetryPacket & { rawEA?: number; rawEB?: number; rawEC?: number; simulationMode?: string; simulated?: boolean })[] =
    nodes.map((node) => {
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
        rawEA: rawTel?.ea ?? 0,
        rawEB: rawTel?.eb ?? 0,
        rawEC: rawTel?.ec ?? 0,
        simulationMode: rawTel?.simulationMode ?? (node.status === "ONLINE" ? "AUTO/DATASET" : "INACTIVE"),
        simulated: rawTel?.simulated ?? true,
        rssiDbm: node.status === "ONLINE" ? -65 : -99,
        timestamp: node.lastHeartbeat ?? new Date().toISOString(),
      };
    });

  return (
    <div className="p-6 space-y-8 max-w-screen-2xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>📡</span> Edge Telemetry Monitor
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
            Real-time DWT energy feature vector stream from edge monitoring nodes
            {lastUpdated && (
              <span className="text-slate-500 text-xs ml-2 font-mono">
                (Last sync: {lastUpdated})
              </span>
            )}
          </p>
        </div>

        {/* Explicit Mandatory Disclosure Banner */}
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-amber-200 text-xs max-w-xl shadow-md">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="space-y-1">
            <p className="font-bold text-amber-300 uppercase tracking-wide">
              SIMULATED DATA DISCLOSURE
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              EA, EB and EC are Discrete Wavelet Transform (DWT) energy features replayed from the public Mendeley HIF dataset (DOI: 10.17632/rvypj5rs5b.1). They are <strong>not direct electrical sensor readings</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Live Telemetry Cards Grid ────────────────────────── */}
      <section>
        <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>📡</span> Live Node Telemetry Streams
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {telemetryPackets.map((pkt) => (
            <TelemetryCard key={pkt.nodeId} packet={pkt} />
          ))}
        </div>
      </section>

      {/* ── Detailed DWT Energy Matrix Table ─────────────────── */}
      <section className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
          <h2 className="text-slate-200 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> DWT Energy Feature Vectors (EA, EB, EC)
          </h2>
          <span className="text-slate-500 text-xs font-mono">
            Source: Mendeley Dataset Replay
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4">Node ID</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">EA (Phase A DWT Energy)</th>
                <th className="py-3 px-4">EB (Phase B DWT Energy)</th>
                <th className="py-3 px-4">EC (Phase C DWT Energy)</th>
                <th className="py-3 px-4">Simulated Flag</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-slate-300">
              {telemetryPackets.map((pkt) => (
                <tr key={pkt.nodeId} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-300">{pkt.nodeId}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700 text-[11px]">
                      {pkt.simulationMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {pkt.rawEA ? pkt.rawEA.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {pkt.rawEB ? pkt.rawEB.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">
                    {pkt.rawEC ? pkt.rawEC.toExponential(3) : "0.000e+00"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-amber-400 font-bold">true (SIMULATED)</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{pkt.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
