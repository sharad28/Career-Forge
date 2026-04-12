"use client";

import { useState } from "react";

interface Dimension {
  name: string;
  score: number;
  notes: string;
}

interface TrainingResult {
  verdict: "DO IT" | "SKIP" | "DO WITH TIMEBOX";
  verdictReason: string;
  dimensions: Dimension[];
  plan: string;
  timeboxWeeks: number | null;
}

const VERDICT_STYLES = {
  "DO IT":           { badge: "badge-green",  border: "border-[#86efac]", bg: "bg-[#14532d]/30" },
  "SKIP":            { badge: "badge-red",    border: "border-[#fca5a5]", bg: "bg-[#7f1d1d]/20" },
  "DO WITH TIMEBOX": { badge: "badge-yellow", border: "border-[#fde68a]", bg: "bg-[#713f12]/20" },
};

function scoreColor(score: number) {
  if (score >= 4) return "badge-green";
  if (score >= 3) return "badge-yellow";
  return "badge-red";
}

export default function TrainingPage() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [error, setError] = useState("");

  async function evaluate() {
    if (!name.trim() && !description.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, url, description }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Evaluation failed");
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training Evaluator</h1>
        <p className="text-[#888] text-sm mt-1">
          Should you take this course or certification? Get an AI verdict.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label>Course / Cert Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AWS Solutions Architect, LLM Engineering Bootcamp..."
          />
        </div>
        <div>
          <label>URL <span className="text-[#888] text-xs">(optional)</span></label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://coursera.org/..."
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does the course cover? Duration, provider, format..."
            className="resize-none"
          />
        </div>
        <button
          className="btn-primary w-full"
          onClick={evaluate}
          disabled={loading || (!name.trim() && !description.trim())}
        >
          {loading ? "Evaluating…" : "Evaluate Course"}
        </button>
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Verdict Banner */}
          {(() => {
            const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES["SKIP"];
            return (
              <div className={`card border-l-4 ${style.border} ${style.bg}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge ${style.badge} text-sm px-3 py-1`}>{result.verdict}</span>
                  {result.timeboxWeeks && (
                    <span className="text-xs text-[#888]">Max {result.timeboxWeeks} weeks</span>
                  )}
                </div>
                <p className="text-sm text-[#ededed]">{result.verdictReason}</p>
              </div>
            );
          })()}

          {/* Dimensions Grid */}
          {result.dimensions.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {result.dimensions.map((dim) => (
                <div key={dim.name} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-[#888]">{dim.name}</div>
                    <span className={`badge ${scoreColor(dim.score)}`}>{dim.score}/5</span>
                  </div>
                  <p className="text-xs text-[#ededed]">{dim.notes}</p>
                </div>
              ))}
            </div>
          )}

          {/* Plan */}
          {result.plan && (
            <div className="card">
              <div className="font-medium mb-2">
                {result.verdict === "SKIP" ? "Better Alternative" : "Action Plan"}
              </div>
              <p className="text-sm text-[#888] whitespace-pre-wrap">{result.plan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
