import type { MonitoringNode } from "@/types";
import {
  nodeStatusColor,
  nodeStatusDot,
  timeAgo,
} from "@/utils";

interface NodeStatusProps {
  node: MonitoringNode;
}

export default function NodeStatus({ node }: NodeStatusProps) {
  const displayId = node.nodeId || node.id || "GS-NODE-XXX";
  const lat = node.latitude ?? 28.635;
  const lng = node.longitude ?? 77.225;

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-slate-100 font-mono text-sm font-semibold">
          {displayId}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${nodeStatusDot(node.status)}`}
          />
          <span className={`text-xs font-semibold ${nodeStatusColor(node.status)}`}>
            {node.status}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="text-slate-400 text-xs">{node.name}</div>

      {/* Location / Feeder */}
      {(node.location || node.feeder) && (
        <div className="text-slate-500 text-xs flex items-center gap-1">
          <span>📍</span>
          <span>{node.location ?? node.feeder}</span>
        </div>
      )}

      {/* Heartbeat */}
      <div className="text-slate-500 text-xs border-t border-slate-700/60 pt-2 mt-1 flex justify-between">
        <span>Last heartbeat</span>
        <span className="text-slate-400 font-mono">
          {node.lastHeartbeat ? timeAgo(node.lastHeartbeat) : "Never"}
        </span>
      </div>

      {/* Coordinates */}
      <div className="text-slate-600 text-xs font-mono">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}
