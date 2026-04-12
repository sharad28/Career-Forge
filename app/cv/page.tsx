"use client";

import { useEffect, useState } from "react";

interface AuditResult {
  atsScore: number;
  issues: { type: "error" | "warning"; message: string }[];
  bulletsWithoutMetrics: string[];
  suggestions: string[];
}

export default function CVPage() {
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/cv").then((r) => r.json()).then((d) => {
      setContent(d.content || "");
      setOriginal(d.content || "");
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOriginal(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save CV");
    } finally {
      setSaving(false);
    }
  }

  async function runAudit() {
    setAuditing(true);
    setAudit(null);
    try {
      const res = await fetch("/api/cv", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAudit({
          atsScore: data.atsScore || 0,
          issues: data.issues || [],
          bulletsWithoutMetrics: data.bulletsWithoutMetrics || [],
          suggestions: data.suggestions || []
        });
      }
    } catch (e) {
      console.error("Audit failed", e);
      alert("Failed to run audit");
    }
    setAuditing(false);
  }

  const isDirty = content !== original;

  function atsColor(score: number) {
    if (score >= 80) return "text-[#86efac]";
    if (score >= 60) return "text-[#fde68a]";
    return "text-[#fca5a5]";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CV Editor</h1>
          <p className="text-[#888] text-sm mt-1">Edit your canonical CV. Run ATS audit to check compatibility.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={runAudit} disabled={auditing || !content}>
            {auditing ? "Auditing…" : "ATS Audit"}
          </button>
          <button
            className="btn-primary"
            onClick={() => window.open("/api/cv/pdf", "_blank")}
            disabled={!content}
          >
            ↓ Download PDF
          </button>
          <button
            className="btn-ghost"
            onClick={() => window.open("/cv/print", "_blank")}
            disabled={!content}
          >
            Print View
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !isDirty}>
            {saving ? "Saving…" : saved ? "Saved!" : isDirty ? "Save Changes" : "No Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="card space-y-3">
          <div className="text-sm font-medium text-[#888]">Markdown Editor</div>
          <textarea
            className="font-mono text-xs resize-none h-[600px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your CV in markdown format..."
          />
        </div>

        {/* Audit / Preview */}
        <div className="space-y-4">
          {!audit && (
            <div className="card text-center text-[#888] text-sm py-12">
              Click &quot;ATS Audit&quot; to analyze your CV for ATS compatibility and keyword coverage.
            </div>
          )}

          {audit && (
            <>
              <div className="card flex items-center justify-between">
                <div>
                  <div className="text-[#888] text-sm">ATS Score</div>
                  <div className={`text-4xl font-bold mt-1 ${atsColor(audit.atsScore)}`}>
                    {audit.atsScore}<span className="text-lg text-[#888]">/100</span>
                  </div>
                </div>
                <div className="text-right text-sm text-[#888]">
                  {audit.issues.filter((i) => i.type === "error").length} errors ·{" "}
                  {audit.issues.filter((i) => i.type === "warning").length} warnings
                </div>
              </div>

              {audit.issues.length > 0 && (
                <div className="card space-y-2">
                  <div className="font-medium text-sm">Issues</div>
                  {audit.issues.map((issue, i) => (
                    <div key={i} className={`flex gap-2 text-sm ${issue.type === "error" ? "text-[#fca5a5]" : "text-[#fde68a]"}`}>
                      <span>{issue.type === "error" ? "✗" : "⚠"}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {audit.bulletsWithoutMetrics.length > 0 && (
                <div className="card space-y-2">
                  <div className="font-medium text-sm">Bullets Missing Metrics</div>
                  <p className="text-[#888] text-xs">Rewrite these with [Action] + [What] + [Result with numbers]</p>
                  <ul className="space-y-1">
                    {audit.bulletsWithoutMetrics.map((b, i) => (
                      <li key={i} className="text-sm text-[#fde68a] border-l-2 border-[#fde68a]/50 pl-3">{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {audit.suggestions.length > 0 && (
                <div className="card space-y-2">
                  <div className="font-medium text-sm">Suggestions</div>
                  <ul className="space-y-1">
                    {audit.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-[#888] flex gap-2">
                        <span className="text-[#6366f1]">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
