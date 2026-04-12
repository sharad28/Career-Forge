"use client";

import { useEffect, useState } from "react";

interface ReportSummary {
  id: number;
  slug: string;
  applications: { company: string; role: string; score: number | null }[];
}

interface OfferScores {
  northStar: number;
  cvMatch: number;
  level: number;
  comp: number;
  growth: number;
  remote: number;
  reputation: number;
  techStack: number;
  timeToOffer: number;
  culture: number;
}

interface Offer {
  company: string;
  role: string;
  scores: OfferScores;
  weightedTotal: number;
  pros: string[];
  cons: string[];
}

interface CompareResult {
  offers: Offer[];
  bestFit: string;
  bestFitReason: string;
  recommendation: string;
  dimensionMeta: { key: string; label: string; weight: number }[];
}

function scoreCell(score: number) {
  const cls = score >= 4 ? "text-[#86efac]" : score >= 3 ? "text-[#fde68a]" : "text-[#fca5a5]";
  return <span className={`font-medium ${cls}`}>{score}/5</span>;
}

export default function ComparePage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/report").then((r) => r.json()).then(setReports);
  }, []);

  function toggleReport(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  async function compare() {
    if (selected.length < 2) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportIds: selected }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Comparison failed");
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Offer Comparison</h1>
        <p className="text-[#888] text-sm mt-1">Select 2–5 evaluated reports to compare side by side</p>
      </div>

      {/* Report selection */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Select Reports ({selected.length}/5)</div>
          <button
            className="btn-primary"
            onClick={compare}
            disabled={loading || selected.length < 2}
          >
            {loading ? "Comparing…" : "Compare Selected"}
          </button>
        </div>
        {reports.length === 0 ? (
          <p className="text-[#888] text-sm">No reports yet. <a href="/evaluate" className="text-[#6366f1] hover:underline">Evaluate jobs first</a>.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {reports.map((r) => {
              const app = r.applications[0];
              const isSelected = selected.includes(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggleReport(r.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[#6366f1] bg-[#6366f1]/10"
                      : "border-[#2a2a2a] hover:border-[#444]"
                  }`}
                >
                  <div className="text-sm font-medium">{app?.company || r.slug}</div>
                  <div className="text-xs text-[#888]">{app?.role || "—"}</div>
                  {app?.score != null && (
                    <div className="text-xs mt-1">
                      <span className={app.score >= 4 ? "text-[#86efac]" : app.score >= 3 ? "text-[#fde68a]" : "text-[#fca5a5]"}>
                        {app.score.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {/* Comparison Table */}
      {result && (
        <div className="space-y-4">
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-[#888] text-left">
                  <th className="px-4 py-3 font-medium">Dimension</th>
                  <th className="px-4 py-3 font-medium text-xs">Weight</th>
                  {result.offers.map((offer, i) => (
                    <th key={i} className="px-4 py-3 font-medium">
                      <div>{offer.company}</div>
                      <div className="text-xs text-[#888] font-normal">{offer.role}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.dimensionMeta.map((dim) => (
                  <tr key={dim.key} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="px-4 py-3 text-[#888]">{dim.label}</td>
                    <td className="px-4 py-3 text-xs text-[#888]">{Math.round(dim.weight * 100)}%</td>
                    {result.offers.map((offer, i) => (
                      <td key={i} className="px-4 py-3">
                        {scoreCell(offer.scores[dim.key as keyof OfferScores])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-[#2a2a2a] bg-[#1a1a1a]/50">
                  <td className="px-4 py-3 font-semibold">Weighted Total</td>
                  <td className="px-4 py-3"></td>
                  {result.offers.map((offer, i) => (
                    <td key={i} className="px-4 py-3">
                      <span className={`font-bold text-base ${offer.weightedTotal >= 4 ? "text-[#86efac]" : offer.weightedTotal >= 3 ? "text-[#fde68a]" : "text-[#fca5a5]"}`}>
                        {offer.weightedTotal.toFixed(2)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Best Fit */}
          <div className="card border-l-4 border-[#86efac] bg-[#14532d]/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge badge-green">Best Fit</span>
              <span className="font-medium">{result.bestFit}</span>
            </div>
            <p className="text-sm text-[#ededed]">{result.bestFitReason}</p>
            {result.recommendation && (
              <p className="text-sm text-[#888] mt-2">{result.recommendation}</p>
            )}
          </div>

          {/* Pros & Cons per offer */}
          <div className="grid grid-cols-2 gap-4">
            {result.offers.map((offer, i) => (
              <div key={i} className="card space-y-3">
                <div className="font-medium">{offer.company}</div>
                {offer.pros.length > 0 && (
                  <div>
                    <div className="text-xs text-[#888] mb-1">Pros</div>
                    <ul className="space-y-1">
                      {offer.pros.map((p, j) => (
                        <li key={j} className="text-xs text-[#86efac] flex gap-2"><span>+</span>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {offer.cons.length > 0 && (
                  <div>
                    <div className="text-xs text-[#888] mb-1">Cons</div>
                    <ul className="space-y-1">
                      {offer.cons.map((c, j) => (
                        <li key={j} className="text-xs text-[#fca5a5] flex gap-2"><span>−</span>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <a href={`/report?id=${reports.find(r => r.applications[0]?.company === offer.company)?.id}`}
                   className="text-xs text-[#6366f1] hover:underline">
                  View Report →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
