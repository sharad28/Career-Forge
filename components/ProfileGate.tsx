"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Requirement {
  field: string;
  label: string;
  tab: string;
  tabLabel: string;
}

const ALL_REQUIREMENTS: Requirement[] = [
  { field: "fullName", label: "Full Name", tab: "/profile/about", tabLabel: "About You" },
  { field: "email", label: "Email", tab: "/profile/about", tabLabel: "About You" },
  { field: "llmApiKey", label: "API Key", tab: "/profile/ai", tabLabel: "AI" },
  { field: "targetRoles", label: "Target Roles", tab: "/profile/job-target", tabLabel: "Job Target" },
  { field: "cv", label: "CV", tab: "/profile/cv", tabLabel: "CV" },
];

function isFilled(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "string") {
    if (value === "" || value === "0" || value === "[]") return false;
    if (value.startsWith("••••")) return true;
  }
  return true;
}

interface Props {
  requires: string[];
  children: React.ReactNode;
}

export default function ProfileGate({ requires, children }: Props) {
  const [missing, setMissing] = useState<Requirement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const needed = ALL_REQUIREMENTS.filter((r) => requires.includes(r.field));
    if (needed.length === 0) {
      setLoaded(true);
      return;
    }

    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      requires.includes("cv") ? fetch("/api/cv").then((r) => r.json()) : Promise.resolve(null),
    ]).then(([settings, cvData]) => {
      const gaps: Requirement[] = [];
      for (const req of needed) {
        if (req.field === "cv") {
          if (!cvData?.content) gaps.push(req);
        } else if (settings) {
          if (!isFilled(settings[req.field])) gaps.push(req);
        } else {
          gaps.push(req);
        }
      }
      setMissing(gaps);
      setLoaded(true);
    });
  }, [requires]);

  if (!loaded) return null;
  if (missing.length === 0) return <>{children}</>;

  const tabs = [...new Map(missing.map((m) => [m.tab, m])).values()];

  return (
    <>
      <div className="mb-6 rounded-lg border border-[#fde68a]/30 bg-[#fde68a]/5 px-4 py-3">
        <p className="text-sm text-[#fde68a] font-medium mb-1">Complete your profile to use this feature</p>
        <p className="text-xs text-[#888] mb-2">
          Missing: {missing.map((m) => m.label).join(", ")}
        </p>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.tab}
              href={t.tab}
              className="text-xs px-3 py-1 rounded bg-[#fde68a]/10 text-[#fde68a] hover:bg-[#fde68a]/20 transition-colors"
            >
              Go to {t.tabLabel} →
            </Link>
          ))}
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">{children}</div>
    </>
  );
}
