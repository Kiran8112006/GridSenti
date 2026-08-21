import type { TelemetryPacket } from "@/types";
import { timeAgo } from "@/utils";

interface TelemetryCardProps {
  packet: TelemetryPacket;
}

function AnomScore({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct < 30
      ? "bg-emerald-500"
      : pct < 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

export default function TelemetryCard({ packet }: TelemetryCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-slate-100 font-mono text-sm font-semibold">
          {packet.nodeId}
        </span>
        <span className="text-slate-500 text-xs">{timeAgo(packet.timestamp)}</span>
      </div>

      {/* Simulated reading badge */}
      <span className="self-start px-1.5 py-0.5 rounded text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20">
        SIMULATED
      </span>

      {/* Readings */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Current</span>
          <div className="text-slate-200 font-mono font-semibold">
            {packet.current.toFixed(1)} A
          </div>
        </div>
        <div>
          <span className="text-slate-500">Voltage</span>
          <div className="text-slate-200 font-mono font-semibold">
            {packet.voltage.toFixed(1)} V
          </div>
        </div>
      </div>

      {/* Anomaly bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-500 text-xs">Waveform Anomaly</span>
        </div>
        <AnomScore value={packet.waveformAnomaly} />
      </div>

      {/* RSSI */}
      {packet.rssi !== undefined && (
        <div className="text-slate-600 text-xs font-mono">
          RSSI: {packet.rssi} dBm
        </div>
      )}
    </div>
  );
}
