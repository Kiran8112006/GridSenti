import type { MonitoringNode } from "@/types";
import NodeStatus from "./NodeStatus";

interface NodeGridProps {
  nodes: MonitoringNode[];
}

export default function NodeGrid({ nodes }: NodeGridProps) {
  return (
    <section>
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>◉</span> Monitoring Nodes
        <span className="text-slate-500 text-xs font-normal normal-case">
          ({nodes.length} registered)
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {nodes.map((node) => (
          <NodeStatus key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}
