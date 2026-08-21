"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/nodes", label: "Nodes", icon: "◉" },
  { href: "/faults", label: "Faults", icon: "⚡" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/telemetry", label: "Telemetry", icon: "📡" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 lg:w-52 bg-slate-900 border-r border-slate-700/60 flex flex-col shrink-0">
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
              )}
            >
              <span className="text-base w-5 text-center shrink-0">
                {item.icon}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/60">
        <div className="text-slate-500 text-xs text-center lg:text-left">
          <span className="hidden lg:block">v0.1.0-prototype</span>
          <span className="lg:hidden">v0.1</span>
        </div>
      </div>
    </aside>
  );
}
