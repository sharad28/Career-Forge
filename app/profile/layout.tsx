"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface TabDef {
  href: string;
  label: string;
  desc: string;
  fields: string[];
}

const TABS: TabDef[] = [
  { href: "/profile/about", label: "About You", desc: "Name, contact, links", fields: ["fullName", "email", "phone", "location", "timezone", "linkedinUrl"] },
  { href: "/profile/cv", label: "CV", desc: "Resume & ATS audit", fields: ["cv"] },
  { href: "/profile/job-target", label: "Job Target", desc: "Roles, salary, filters", fields: ["targetRoles", "salaryMin"] },
  { href: "/profile/ai", label: "AI", desc: "LLM provider & web search", fields: ["llmProvider", "llmApiKey"] },
  { href: "/profile/automation", label: "Automation", desc: "Auto-apply preferences", fields: ["autoApplyMethod"] },
];

function computeTabFill(tab: TabDef, settings: Record<string, unknown>, hasCv: boolean): number {
  if (tab.fields.length === 0) return 1;
  let filled = 0;
  for (const f of tab.fields) {
    if (f === "cv") {
      if (hasCv) filled++;
    } else {
      const v = settings[f];
      if (v && v !== "" && v !== "0" && v !== "[]") filled++;
    }
  }
  return filled / tab.fields.length;
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [hasCv, setHasCv] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      if (data) setSettings(data);
    });
    fetch("/api/cv").then((r) => r.json()).then((data) => {
      setHasCv(!!(data?.content));
    });
  }, []);

  const tabFills = settings
    ? TABS.map((tab) => computeTabFill(tab, settings, hasCv))
    : null;

  const overallPct = tabFills
    ? Math.round((tabFills.reduce((a, b) => a + b, 0) / tabFills.length) * 100)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-[#888] text-sm mt-1">Everything about you in one place — used across every feature.</p>
        </div>
        {overallPct !== null && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallPct}%`,
                  backgroundColor: overallPct >= 80 ? "#86efac" : overallPct >= 50 ? "#fde68a" : "#fca5a5",
                }}
              />
            </div>
            <span className="text-xs text-[#888]">{overallPct}%</span>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        <nav className="w-56 flex-shrink-0">
          <div className="flex flex-col gap-1 sticky top-0">
            {TABS.map((tab, i) => {
              const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
              const fill = tabFills?.[i];
              const dotColor =
                fill === undefined ? "bg-[#333]"
                : fill >= 1 ? "bg-[#86efac]"
                : fill > 0 ? "bg-[#fde68a]"
                : "bg-[#555]";

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[#6366f1]/15 text-[#6366f1] font-medium"
                      : "text-[#888] hover:text-[#ededed] hover:bg-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="leading-tight">{tab.label}</div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                  </div>
                  <div className={`text-[10px] leading-tight mt-0.5 ${active ? "text-[#6366f1]/70" : "text-[#555]"}`}>
                    {tab.desc}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
