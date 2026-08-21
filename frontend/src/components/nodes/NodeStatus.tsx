import type { MonitoringNode } from "@/types";
import {
  nodeStatusColor,
  nodeStatusDot,
  nodeStatusEmoji,
  timeAgo,
} from "@/utils";

interface NodeStatusProps {
  node: MonitoringNode;
}

export default function NodeStatus({ node }: NodeStatusProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-slate-100 font-mono text-sm font-semibold">
          {node.id}
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

      {/* Location */}
      {node.location && (
        <div className="text-slate-500 text-xs flex items-center gap-1">
          <span>📍</span>
          <span>{node.location}</span>
        </div>
      )}

      {/* Heartbeat */}
      <div className="text-slate-500 text-xs border-t border-slate-700/60 pt-2 mt-1 flex justify-between">
        <span>Last heartbeat</span>
        <span className="text-slate-400 font-mono">
          {timeAgo(node.lastHeartbeat)}
        </span>
      </div>

      {/* Coordinates placeholder */}
      <div className="text-slate-600 text-xs font-mono">
        {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
      </div>
    </div>
  );
}
