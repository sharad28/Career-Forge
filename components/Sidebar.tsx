"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/evaluate", label: "Evaluate", icon: "◎" },
  { href: "/tracker", label: "Tracker", icon: "▤" },
  { href: "/cv", label: "CV Editor", icon: "◻" },
  { href: "/scan", label: "Scanner", icon: "⊕" },
  { href: "/linkedin", label: "LinkedIn", icon: "◈" },
  { href: "/settings", label: "Settings", icon: "⊙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-[#2a2a2a] flex flex-col py-6 px-4 gap-1">
      <div className="px-3 mb-6">
        <span className="text-sm font-semibold tracking-widest text-[#6366f1] uppercase">
          career-ops
        </span>
      </div>
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-[#6366f1]/15 text-[#6366f1] font-medium"
                : "text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a]"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
