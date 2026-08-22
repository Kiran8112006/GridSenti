import type { TelemetryPacket } from "@/types";
import { timeAgo } from "@/utils";

interface TelemetryCardProps {
  packet: TelemetryPacket;
}

function AnomScore({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct < 30 ? "bg-nominal" : pct < 60 ? "bg-warning" : "bg-critical";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono meter text-steel w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

export default function TelemetryCard({ packet }: TelemetryCardProps) {
  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-ink font-mono text-sm font-semibold">
          {packet.nodeId}
        </span>
        <span className="text-steel-light text-xs">{timeAgo(packet.timestamp)}</span>
      </div>

      {/* Simulated reading badge */}
      <span className="self-start px-1.5 py-0.5 rounded text-xs font-display uppercase tracking-wide bg-signal-light text-signal border border-signal/20">
        Simulated
      </span>

      {/* Readings — instrument meter boxes */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-steel">Current</span>
          <div className="meter text-ink font-mono font-semibold bg-paper border border-line rounded-md px-2 py-1 mt-0.5">
            {packet.current.toFixed(1)} A
          </div>
        </div>
        <div>
          <span className="text-steel">Voltage</span>
          <div className="meter text-ink font-mono font-semibold bg-paper border border-line rounded-md px-2 py-1 mt-0.5">
            {packet.voltage.toFixed(1)} V
          </div>
        </div>
      </div>

      {/* Anomaly bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-steel text-xs">Waveform Anomaly</span>
        </div>
        <AnomScore value={packet.waveformAnomaly} />
      </div>

      {/* RSSI */}
      {packet.rssi !== undefined && (
        <div className="text-steel-light text-xs font-mono meter">
          RSSI: {packet.rssi} dBm
        </div>
      )}
    </div>
  );
}
