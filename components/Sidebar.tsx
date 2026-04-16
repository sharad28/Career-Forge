"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Job Search",
    items: [
      { href: "/", label: "Dashboard", icon: "⬡", desc: "Overview & stats" },
      { href: "/scan", label: "Scanner", icon: "⊕", desc: "Find job openings" },
      { href: "/pipeline", label: "Job Inbox", icon: "◎", desc: "Evaluate & triage jobs" },
      { href: "/tracker", label: "Tracker", icon: "▤", desc: "Track applications" },
    ],
  },
  {
    label: "Application",
    items: [
      { href: "/linkedin", label: "LinkedIn", icon: "◈", desc: "Profile & outreach" },
      { href: "/stories", label: "Stories", icon: "◇", desc: "Interview answers" },
      { href: "/ask", label: "Ask", icon: "⁇", desc: "Answer any question" },
      { href: "/report", label: "Reports", icon: "◉", desc: "Deep-dive reports" },
    ],
  },
  {
    label: "Research & Learn",
    items: [
      { href: "/research", label: "Research", icon: "⊛", desc: "Company analysis" },
      { href: "/compare", label: "Compare", icon: "⊟", desc: "Compare offers" },
      { href: "/training", label: "Training", icon: "◑", desc: "Eval courses & certs" },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/profile", label: "Profile", icon: "⊙", desc: "CV, AI, target & more" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-[#2a2a2a] flex flex-col py-6 px-4 gap-4">
      <div className="px-2 mb-2">
        <span className="text-sm font-semibold tracking-widest text-[#6366f1] uppercase">
          CareerForge
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-[#555] uppercase">
            {group.label}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-colors group ${
                    active
                      ? "bg-[#6366f1]/15 text-[#6366f1] font-medium"
                      : "text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a]"
                  }`}
                  title={item.desc}
                >
                  <span className="text-base w-4 text-center flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="leading-tight">{item.label}</div>
                    <div className={`text-[10px] leading-tight truncate ${active ? "text-[#6366f1]/70" : "text-[#555] group-hover:text-[#666]"}`}>
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
