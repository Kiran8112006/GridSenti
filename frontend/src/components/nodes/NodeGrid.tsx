import type { MonitoringNode } from "@/types";
import NodeStatus from "./NodeStatus";

interface NodeGridProps {
  nodes: MonitoringNode[];
}

export default function NodeGrid({ nodes }: NodeGridProps) {
  return (
    <section>
      <h2 className="text-steel text-sm font-display font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="text-signal">◉</span> Monitoring Nodes
        <span className="text-steel-light text-xs font-sans font-normal normal-case">
          ({nodes.length} registered)
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {nodes.map((node) => (
          <NodeStatus key={node.nodeId || node.id} node={node} />
        ))}
      </div>
    </section>
  );
}
