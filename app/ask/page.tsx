"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";

interface Application {
  id: number;
  company: string;
  role: string;
  status: string;
  url: string;
  notes: string;
  report: { content: string } | null;
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJobContext, setShowJobContext] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchUsed, setSearchUsed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  // Tracker jobs
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");

  useEffect(() => {
    fetch("/api/tracker")
      .then((r) => r.json())
      .then((data: Application[]) => setApplications(data))
      .catch(() => {});
  }, []);

  function selectApplication(id: string) {
    setSelectedAppId(id);
    if (!id) {
      setCompany("");
      setRole("");
      setJobDescription("");
      return;
    }
    const app = applications.find((a) => String(a.id) === id);
    if (!app) return;
    setCompany(app.company);
    setRole(app.role);
    // Use the evaluation report as job context — it contains fit analysis, keyword gaps, JD details
    const context = [
      app.report?.content || "",
      app.notes ? `\nNotes: ${app.notes}` : "",
      app.url ? `\nJob URL: ${app.url}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    setJobDescription(context.trim());
    setShowJobContext(true);
  }

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSearchUsed(false);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, company, role, jobDescription, useSearch }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to get answer");
      }
      const data = await res.json();
      setAnswer(data.answer);
      setSearchUsed(!!data.searchUsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const renderedAnswer = answer
    ? (marked(answer, { async: false }) as string)
    : "";

  // Group applications by status for the select
  const active = applications.filter((a) =>
    ["Evaluated", "Applied", "Interview", "Offer"].includes(a.status)
  );
  const other = applications.filter(
    (a) => !["Evaluated", "Applied", "Interview", "Offer"].includes(a.status)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ask a Question</h1>
        <p className="text-[#888] text-sm mt-1">
          Paste any question — application forms, interview prep, cover letter prompts. The LLM answers using your CV and job context.
        </p>
      </div>

      <div className="card space-y-4">
        {/* Job picker */}
        {applications.length > 0 && (
          <div>
            <label>Load job from tracker <span className="text-[#888] text-xs">(optional)</span></label>
            <select
              value={selectedAppId}
              onChange={(e) => selectApplication(e.target.value)}
            >
              <option value="">— type manually or pick a job —</option>
              {active.length > 0 && (
                <optgroup label="Active">
                  {active.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.company} — {a.role} ({a.status})
                    </option>
                  ))}
                </optgroup>
              )}
              {other.length > 0 && (
                <optgroup label="Other">
                  {other.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.company} — {a.role} ({a.status})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        <div>
          <label>Your question</label>
          <textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`e.g. "Why do you want to work at this company?"\n"Describe a time you led a cross-functional project."\n"What is your expected salary?"`}
            className="resize-none"
          />
        </div>

        <button
          type="button"
          className="text-xs text-[#6366f1] hover:underline text-left"
          onClick={() => setShowJobContext((v) => !v)}
        >
          {showJobContext ? "▲ Hide job context" : "▼ Add job context (company, role, JD)"}
        </button>

        {showJobContext && (
          <div className="space-y-3 border-t border-[#2a2a2a] pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Company <span className="text-[#888] text-xs">(optional)</span></label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Anthropic, Stripe..."
                />
              </div>
              <div>
                <label>Role <span className="text-[#888] text-xs">(optional)</span></label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Senior Engineer..."
                />
              </div>
            </div>
            <div>
              <label>
                Job context <span className="text-[#888] text-xs">(optional — paste JD or edit pre-filled content)</span>
              </label>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to get a more tailored answer…"
                className="font-mono text-sm resize-none"
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useSearch}
            onChange={(e) => setUseSearch(e.target.checked)}
            className="w-4 h-4 accent-[#6366f1]"
            style={{ width: "1rem", height: "1rem" }}
          />
          <span className="text-sm text-[#ededed]">
            Search the web
            <span className="text-[#888] text-xs ml-1">
              — fetches live context before answering
            </span>
          </span>
        </label>

        <button
          className="btn-primary w-full"
          onClick={ask}
          disabled={loading || !question.trim()}
        >
          {loading
            ? useSearch
              ? "Searching & thinking…"
              : "Thinking…"
            : "Get Answer"}
        </button>

        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {answer && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-[#6366f1] uppercase tracking-widest">Answer</div>
              {searchUsed && (
                <span className="badge badge-green text-[10px] py-0">⊕ web</span>
              )}
            </div>
            {(company || role) && (
              <div className="text-xs text-[#888]">
                {company}{company && role ? " — " : ""}{role}
              </div>
            )}
          </div>
          <div
            className="prose prose-invert prose-sm max-w-none text-[#ededed] [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:pl-4 [&_li]:my-0.5 [&_strong]:text-white [&_p]:text-[#ccc] [&_code]:text-[#c084fc] [&_code]:bg-[#2a2a2a] [&_code]:px-1 [&_code]:rounded"
            dangerouslySetInnerHTML={{ __html: renderedAnswer }}
          />
          <div className="pt-2 border-t border-[#2a2a2a] flex gap-2">
            <button
              className="btn-ghost text-xs py-1 px-3"
              onClick={() => navigator.clipboard.writeText(answer)}
            >
              Copy answer
            </button>
            <button
              className="btn-ghost text-xs py-1 px-3"
              onClick={() => { setAnswer(""); setQuestion(""); }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
