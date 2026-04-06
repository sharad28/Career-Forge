"use client";

import { useState } from "react";

interface EvalResult {
  score: number;
  summary: string;
  fitAnalysis: string;
  keywordGaps: string[];
  tailoredBullets: string[];
  h1bFriendly: boolean | null;
  recommendation: string;
}

export default function EvaluatePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function evaluate() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Evaluation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function saveToTracker() {
    if (!result) return;
    try {
      await fetch("/api/tracker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      setSaved(true);
    } catch {
      setError("Failed to save");
    }
  }

  function scoreColor(score: number) {
    if (score >= 4) return "text-[#86efac]";
    if (score >= 3) return "text-[#fde68a]";
    return "text-[#fca5a5]";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluate a Job</h1>
        <p className="text-[#888] text-sm mt-1">Paste a job URL or full job description</p>
      </div>

      <div className="card space-y-4">
        <div>
          <label>Job URL or description</label>
          <textarea
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://company.com/jobs/123 &#10;&#10;— or paste the full job description —"
            className="font-mono text-sm resize-none"
          />
        </div>
        <button
          className="btn-primary w-full"
          onClick={evaluate}
          disabled={loading || !input.trim()}
        >
          {loading ? "Evaluating…" : "Evaluate"}
        </button>
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Score */}
          <div className="card flex items-center justify-between">
            <div>
              <div className="text-[#888] text-sm">Match Score</div>
              <div className={`text-5xl font-bold mt-1 ${scoreColor(result.score)}`}>
                {result.score.toFixed(1)}<span className="text-2xl text-[#888]">/5</span>
              </div>
            </div>
            <div className="text-right">
              {result.h1bFriendly === true && <span className="badge badge-green">H1B Friendly</span>}
              {result.h1bFriendly === false && <span className="badge badge-red">No Sponsorship</span>}
              {result.h1bFriendly === null && <span className="badge badge-gray">Sponsorship Unknown</span>}
            </div>
          </div>

          {/* Recommendation */}
          <div className={`card border-l-4 ${result.score >= 3 ? "border-[#86efac]" : "border-[#fca5a5]"}`}>
            <div className="text-sm font-medium mb-1">Recommendation</div>
            <p className="text-sm text-[#ededed]">{result.recommendation}</p>
          </div>

          {/* Fit Analysis */}
          <div className="card">
            <div className="font-medium mb-2">Fit Analysis</div>
            <p className="text-sm text-[#888] whitespace-pre-wrap">{result.fitAnalysis}</p>
          </div>

          {/* Keyword Gaps */}
          {result.keywordGaps.length > 0 && (
            <div className="card">
              <div className="font-medium mb-3">Keyword Gaps</div>
              <div className="flex flex-wrap gap-2">
                {result.keywordGaps.map((kw) => (
                  <span key={kw} className="badge badge-yellow">{kw}</span>
                ))}
              </div>
              <p className="text-[#888] text-xs mt-3">
                These keywords are in the JD but missing from your CV. Add them where accurate.
              </p>
            </div>
          )}

          {/* Tailored Bullets */}
          {result.tailoredBullets.length > 0 && (
            <div className="card">
              <div className="font-medium mb-3">Suggested CV Bullets</div>
              <ul className="space-y-2">
                {result.tailoredBullets.map((b, i) => (
                  <li key={i} className="text-sm text-[#ededed] border-l-2 border-[#6366f1] pl-3">
                    {b}
                  </li>
                ))}
              </ul>
              <p className="text-[#888] text-xs mt-3">
                Rewritten from your existing experience to match this JD&apos;s language.
              </p>
            </div>
          )}

          {/* Save */}
          {!saved ? (
            <button className="btn-primary w-full" onClick={saveToTracker}>
              Save to Tracker
            </button>
          ) : (
            <div className="card text-center text-[#86efac] text-sm">
              Saved to tracker
            </div>
          )}
        </div>
      )}
    </div>
  );
}
