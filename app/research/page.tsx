"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

interface ResearchAxis {
  summary: string;
  details: string[];
}

interface ResearchResult {
  aiStrategy: ResearchAxis;
  recentMoves: ResearchAxis;
  engCulture: ResearchAxis;
  challenges: ResearchAxis;
  competitors: ResearchAxis;
  yourAngle: ResearchAxis;
}

const AXES = [
  { key: "aiStrategy",   icon: "◈", label: "AI Strategy" },
  { key: "recentMoves",  icon: "◉", label: "Recent Moves" },
  { key: "engCulture",   icon: "◇", label: "Engineering Culture" },
  { key: "challenges",   icon: "⊕", label: "Probable Challenges" },
  { key: "competitors",  icon: "⊞", label: "Competitors & Positioning" },
  { key: "yourAngle",    icon: "◎", label: "Your Angle" },
] as const;

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto mt-12 text-[#888]">Loading...</div>}>
      <ResearchContent />
    </Suspense>
  );
}

function ResearchContent() {
  const params = useSearchParams();
  const [company, setCompany] = useState(params.get("company") || "");
  const [role, setRole] = useState(params.get("role") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["yourAngle"]));

  async function research() {
    if (!company.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company, role }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Research failed");
      }
      const data = await res.json();
      setResult(data);
      setExpanded(new Set(["yourAngle"]));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleAxis(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Research</h1>
        <p className="text-[#888] text-sm mt-1">6-axis deep dive to prepare for interviews and applications</p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && research()}
              placeholder="Anthropic, OpenAI, Retool..."
            />
          </div>
          <div>
            <label>Role <span className="text-[#888] text-xs">(optional)</span></label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && research()}
              placeholder="Senior ML Engineer..."
            />
          </div>
        </div>
        <button
          className="btn-primary w-full"
          onClick={research}
          disabled={loading || !company.trim()}
        >
          {loading ? "Researching…" : "Research Company"}
        </button>
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="text-xs text-[#888] card py-2">
            ⚠ Based on training data — verify recent information before your interview.
          </div>
          {AXES.map(({ key, icon, label }) => {
            const axis = result[key as keyof ResearchResult];
            const isOpen = expanded.has(key);
            return (
              <div key={key} className="card p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#2a2a2a]/30 transition-colors text-left"
                  onClick={() => toggleAxis(key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#6366f1]">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      {!isOpen && <div className="text-xs text-[#888] mt-0.5">{axis.summary}</div>}
                    </div>
                  </div>
                  <span className="text-[#888] text-xs flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-[#2a2a2a] space-y-3 pt-3">
                    <p className="text-sm text-[#ededed]">{axis.summary}</p>
                    <ul className="space-y-1">
                      {axis.details.map((d, i) => (
                        <li key={i} className="text-sm text-[#888] flex gap-2">
                          <span className="text-[#6366f1] flex-shrink-0">·</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
