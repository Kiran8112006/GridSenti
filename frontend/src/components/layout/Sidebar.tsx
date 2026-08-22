"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "▣" },
  { href: "/nodes", label: "Nodes", icon: "◉" },
  { href: "/faults", label: "Faults", icon: "▲" },
  { href: "/alerts", label: "Alerts", icon: "◆" },
  { href: "/telemetry", label: "Telemetry", icon: "∿" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 lg:w-52 bg-panel border-r border-line flex flex-col shrink-0">
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 pl-3 pr-3 py-2.5 border-l-2 text-sm font-display font-medium uppercase tracking-wide transition-colors",
                active
                  ? "bg-signal-light text-signal border-signal"
                  : "text-steel border-transparent hover:text-ink hover:bg-paper hover:border-line-strong",
              )}
            >
              <span className="text-sm w-5 text-center shrink-0 font-normal">
                {item.icon}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-line">
        <div className="text-steel-light text-xs font-mono meter text-center lg:text-left">
          <span className="hidden lg:block">v0.2.0-prototype</span>
          <span className="lg:hidden">v0.2</span>
        </div>
      </div>
    </aside>
  );
}
