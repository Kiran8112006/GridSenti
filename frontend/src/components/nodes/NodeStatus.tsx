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
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-2 hover:border-line-strong transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-ink font-mono text-sm font-semibold">
          {displayId}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${nodeStatusDot(node.status)}`}
          />
          <span
            className={`text-xs font-display font-semibold uppercase tracking-wide ${nodeStatusColor(node.status)}`}
          >
            {node.status}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="text-steel text-xs">{node.name}</div>

      {/* Location / Feeder */}
      {(node.location || node.feeder) && (
        <div className="text-steel-light text-xs flex items-center gap-1.5">
          <span className="text-[10px]">▪</span>
          <span>{node.location ?? node.feeder}</span>
        </div>
      )}

      {/* Heartbeat */}
      <div className="text-steel-light text-xs border-t border-line pt-2 mt-1 flex justify-between">
        <span>Last heartbeat</span>
        <span className="text-steel font-mono meter">
          {node.lastHeartbeat ? timeAgo(node.lastHeartbeat) : "Never"}
        </span>
      </div>

      {/* Coordinates — instrument readout */}
      <div className="text-steel-light text-xs font-mono meter bg-paper border border-line rounded px-2 py-1 w-fit">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}
