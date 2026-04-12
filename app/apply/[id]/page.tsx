"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { marked } from "marked";

interface Package {
  id: number;
  applicationId: number;
  method: string;
  atsType: string;
  coverLetter: string;
  screeningQA: string;
  status: string;
  errorMessage: string;
  application: {
    id: number;
    company: string;
    role: string;
    score: number | null;
    url: string;
    h1bFriendly: boolean | null;
    report?: { content: string } | null;
  };
}

interface MethodOption {
  method: string;
  label: string;
  description: string;
  cost: string;
  recommended: boolean;
  available: boolean;
  reason?: string;
}

const METHOD_INFO: Record<string, { icon: string; color: string; actionLabel: string }> = {
  "computer-use": { icon: "🟡", color: "border-[#fde68a]/30 bg-[#fde68a]/5", actionLabel: "Launch Browser Apply" },
  manual: { icon: "⚪", color: "border-[#9ca3af]/30 bg-[#9ca3af]/5", actionLabel: "Copy & Open Job Page" },
};

export default function ApplyReviewPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<MethodOption[]>([
    {
      method: "computer-use",
      label: "Claude Computer Use",
      description: "Claude fills the form in a browser for you",
      cost: "~$0.10 API cost",
      recommended: false,
      available: false,
      reason: "Enable Computer Use in Settings → Auto Apply Preferences",
    },
    {
      method: "manual",
      label: "Manual (Copy & Paste)",
      description: "AI generates package, you paste it yourself",
      cost: "Free",
      recommended: true,
      available: true,
    },
  ]);
  const [selectedMethod, setSelectedMethod] = useState("manual");
  const [coverLetter, setCoverLetter] = useState("");
  const [screeningQA, setScreeningQA] = useState<Array<{ question: string; answer: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitConfirmation, setSubmitConfirmation] = useState<{
    reference?: string;
    message?: string;
    method?: string;
    timestamp?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  // Ask a question
  const [showAsk, setShowAsk] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");
  const [askUseSearch, setAskUseSearch] = useState(false);
  const [askSearchUsed, setAskSearchUsed] = useState(false);
  const [askCopied, setAskCopied] = useState(false);

  const [computerUseResult, setComputerUseResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    screenshot?: string;
    totalSteps?: number;
  } | null>(null);
  // Prevent async loadPackage from overwriting a method the user has already clicked
  const methodLockedRef = useRef(false);

  useEffect(() => {
    methodLockedRef.current = false;
    loadPackage();
  }, [appId]);

  async function loadPackage() {
    setLoading(true);
    try {
      // First check if package exists via tracker
      const trackerRes = await fetch("/api/tracker");
      const apps = await trackerRes.json();
      const app = apps.find((a: { id: number }) => a.id === parseInt(appId));

      if (!app) {
        setError("Application not found");
        setLoading(false);
        return;
      }

      // Detect ATS methods (always run; detector handles missing URLs gracefully)
      try {
        const detectRes = await fetch("/api/apply/detect", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: app.url || "" }),
        });
        const detection = await detectRes.json();
        if (detection.availableMethods?.length) {
          setMethods(detection.availableMethods);
        }
      } catch {
        // leave default methods in place
      }

      // Check for existing package
      const pkgRes = await fetch(`/api/apply/package?id=${appId}`);
      if (pkgRes.ok) {
        const data = await pkgRes.json();
        if (!data.error) {
          setPkg(data);
          setCoverLetter(data.coverLetter || "");
          if (!methodLockedRef.current) {
            setSelectedMethod(data.method || "manual");
          }
          try {
            setScreeningQA(JSON.parse(data.screeningQA || "[]"));
          } catch {
            setScreeningQA([]);
          }
          if (data.status === "submitted") setSubmitted(true);
          setLoading(false);
          return;
        }
      }

      // No package yet — need to prepare first
      setPkg(null);
      setError("No package prepared yet. Preparing now...");

      const prepRes = await fetch("/api/apply/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId: parseInt(appId) }),
      });
      const prepData = await prepRes.json();
      if (prepData.error) {
        setError(prepData.error);
      } else {
        setError("");
        // Reload
        await loadPackage();
        return;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch("/api/apply/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId: parseInt(appId) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoverLetter(data.coverLetter || "");
      setScreeningQA(data.screeningQA || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }

  async function saveEdits() {
    if (!pkg) return;
    await fetch("/api/apply/package", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: pkg.id,
        coverLetter,
        screeningQA: JSON.stringify(screeningQA),
        method: selectedMethod,
      }),
    });
  }

  async function handleSubmit() {
    if (!pkg) return;
    setSubmitting(true);
    setError("");

    // Save edits first
    await saveEdits();

    try {
      const res = await fetch("/api/apply/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, method: selectedMethod }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || "Submission failed");
      }

      if (selectedMethod === "computer-use") {
        setComputerUseResult({
          success: data.success,
          status: data.status,
          message: data.message,
          screenshot: data.screenshot,
          totalSteps: data.totalSteps,
        });
        if (data.success) {
          setSubmitConfirmation({
            method: "computer-use",
            message: data.message,
            timestamp: new Date().toISOString(),
          });
          setSubmitted(true);
        }
        return;
      }

      // Manual — mark package as submitted
      await fetch("/api/apply/package", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: pkg.id, status: "submitted" }),
      });

      setSubmitConfirmation({
        message: "Marked as applied",
        method: "manual",
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  function updateQA(index: number, answer: string) {
    setScreeningQA((prev) =>
      prev.map((qa, i) => (i === index ? { ...qa, answer } : qa))
    );
  }

  async function handleAsk() {
    if (!askQuestion.trim()) return;
    setAskLoading(true);
    setAskError("");
    setAskAnswer("");
    setAskSearchUsed(false);
    try {
      const jobDescription = pkg?.application?.report?.content || "";
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: askQuestion,
          company: pkg?.application?.company,
          role: pkg?.application?.role,
          jobDescription,
          useSearch: askUseSearch,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to get answer");
      }
      const data = await res.json();
      setAskAnswer(data.answer);
      setAskSearchUsed(!!data.searchUsed);
    } catch (e: unknown) {
      setAskError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAskLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center text-[#888] py-12">Loading package…</div>
      </div>
    );
  }

  const app = pkg?.application;
  const info = METHOD_INFO[selectedMethod] || METHOD_INFO.manual;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/tracker")}
            className="text-[#888] text-sm hover:text-[#ededed] mb-2 block"
          >
            ← Back to Tracker
          </button>
          <h1 className="text-2xl font-bold">
            {app?.company || "Unknown Company"}
          </h1>
          <p className="text-[#888] text-sm">{app?.role || "Unknown Role"}</p>
        </div>
        {app?.score && (
          <div
            className={`text-4xl font-bold ${
              app.score >= 4
                ? "text-[#86efac]"
                : app.score >= 3
                ? "text-[#fde68a]"
                : "text-[#fca5a5]"
            }`}
          >
            {app.score.toFixed(1)}
            <span className="text-lg text-[#888]">/5</span>
          </div>
        )}
      </div>

      {/* Computer Use result panel */}
      {computerUseResult && (
        <div className={`card space-y-4 ${computerUseResult.success ? "border-[#86efac]/30 bg-[#86efac]/5" : "border-[#fca5a5]/30 bg-[#7f1d1d]/10"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{computerUseResult.success ? "✓" : "⚠"}</span>
            <div>
              <div className={`font-medium ${computerUseResult.success ? "text-[#86efac]" : "text-[#fca5a5]"}`}>
                {computerUseResult.status === "ready_to_submit" && "Form filled — marked as Applied"}
                {computerUseResult.status === "submitted" && "Form submitted via Computer Use"}
                {computerUseResult.status === "captcha" && "CAPTCHA detected"}
                {computerUseResult.status === "login_required" && "Login required"}
                {computerUseResult.status === "needs_help" && "Agent needs help"}
                {computerUseResult.status === "error" && "Agent error"}
              </div>
              <p className="text-sm text-[#888] mt-0.5">{computerUseResult.message}</p>
              {computerUseResult.totalSteps && (
                <p className="text-xs text-[#888] mt-0.5">Completed in {computerUseResult.totalSteps} steps</p>
              )}
            </div>
          </div>

          {/* Final screenshot */}
          {computerUseResult.screenshot && (
            <div className="space-y-1">
              <div className="text-xs text-[#888]">Final browser state</div>
              <img
                src={`data:image/png;base64,${computerUseResult.screenshot}`}
                alt="Final browser state"
                className="w-full rounded border border-[#2a2a2a]"
                style={{ maxHeight: "400px", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Action buttons based on status */}
          <div className="flex gap-3">
            {computerUseResult.success ? (
              <button className="btn-primary" onClick={() => router.push("/tracker")}>
                View Tracker
              </button>
            ) : (
              <>
                {app?.url && (
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Open Job Page Manually
                  </a>
                )}
                <button className="btn-ghost" onClick={() => { setComputerUseResult(null); setSelectedMethod("manual"); }}>
                  Switch to Manual
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {submitted && !computerUseResult && (
        <div className="card border-[#86efac]/30 bg-[#86efac]/5">
          <div className="text-center">
            <div className="text-2xl mb-2">✓</div>
            <div className="font-medium text-[#86efac]">Application Submitted</div>
            <p className="text-sm text-[#888] mt-1">
              This job has been moved to &quot;Applied&quot; in your tracker.
            </p>
          </div>

          {/* Confirmation details */}
          {submitConfirmation && (
            <div className="mt-4 border-t border-[#86efac]/15 pt-4 space-y-2">
              <div className="text-xs font-medium text-[#86efac]/80 uppercase tracking-wider mb-2">Submission Proof</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {submitConfirmation.reference && (
                  <>
                    <span className="text-[#888]">Reference ID</span>
                    <span className="font-mono text-[#86efac]">{submitConfirmation.reference}</span>
                  </>
                )}
                <span className="text-[#888]">Method</span>
                <span className="capitalize">
                  {submitConfirmation.method === "computer-use"
                    ? "Claude Computer Use"
                    : "Manual"}
                </span>
                <span className="text-[#888]">Status</span>
                <span className="text-[#86efac]">✓ Confirmed</span>
                {submitConfirmation.message && (
                  <>
                    <span className="text-[#888]">Response</span>
                    <span className="text-[#ccc]">{submitConfirmation.message}</span>
                  </>
                )}
                {submitConfirmation.timestamp && (
                  <>
                    <span className="text-[#888]">Submitted at</span>
                    <span className="text-[#ccc]">
                      {new Date(submitConfirmation.timestamp).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-4">
            <button
              className="btn-primary text-sm"
              onClick={() => router.push("/tracker")}
            >
              Back to Tracker
            </button>
            <button
              className="btn-ghost text-sm"
              onClick={() => router.push("/tracker")}
            >
              View Tracker
            </button>
          </div>
        </div>
      )}

      {!submitted && (
        <>
          {/* Method Selector */}
          <div className="card space-y-3">
            <div className="font-medium">Choose apply method</div>
            <div className="space-y-2">
              {methods.map((m) => (
                <div
                  key={m.method}
                  role="radio"
                  aria-checked={selectedMethod === m.method}
                  onClick={() => {
                    if (m.available) {
                      methodLockedRef.current = true;
                      setSelectedMethod(m.method);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors select-none ${
                    m.available ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                  } ${
                    selectedMethod === m.method
                      ? METHOD_INFO[m.method]?.color || "border-[#6366f1]/30 bg-[#6366f1]/5"
                      : "border-[#2a2a2a] hover:border-[#444]"
                  }`}
                >
                  <div
                    className="mt-1 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                    style={{
                      width: "1rem",
                      height: "1rem",
                      borderColor: selectedMethod === m.method ? "#6366f1" : "#555",
                      backgroundColor: selectedMethod === m.method ? "#6366f1" : "transparent",
                    }}
                  >
                    {selectedMethod === m.method && (
                      <div style={{ width: "0.35rem", height: "0.35rem", borderRadius: "50%", backgroundColor: "#fff" }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{METHOD_INFO[m.method]?.icon || "⚪"}</span>
                      <span className="font-medium text-sm">{m.label}</span>
                      {m.recommended && (
                        <span className="text-xs text-[#6366f1]">← recommended</span>
                      )}
                    </div>
                    <div className="text-xs text-[#888] mt-0.5">{m.description}</div>
                    <div className="text-xs text-[#888]">{m.cost} · {m.available ? "Available" : m.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Cover Letter</div>
              <div className="flex gap-2">
                <button
                  className="text-xs text-[#6366f1] hover:underline"
                  onClick={regenerate}
                  disabled={regenerating}
                >
                  {regenerating ? "Regenerating…" : "🔄 Regenerate"}
                </button>
                <button
                  className="text-xs text-[#6366f1] hover:underline"
                  onClick={() => copyToClipboard(coverLetter, "cover")}
                >
                  {copied === "cover" ? "Copied! ✓" : "📋 Copy"}
                </button>
              </div>
            </div>
            <textarea
              rows={10}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="font-mono text-sm resize-y"
            />
          </div>

          {/* Screening Q&A */}
          {screeningQA.length > 0 && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Screening Q&A</div>
                <button
                  className="text-xs text-[#6366f1] hover:underline"
                  onClick={() =>
                    copyToClipboard(
                      screeningQA
                        .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
                        .join("\n\n"),
                      "qa"
                    )
                  }
                >
                  {copied === "qa" ? "Copied! ✓" : "📋 Copy All"}
                </button>
              </div>
              {screeningQA.map((qa, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-xs">{qa.question}</label>
                  <textarea
                    rows={2}
                    value={qa.answer}
                    onChange={(e) => updateQA(i, e.target.value)}
                    className="text-sm resize-y"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ask a question */}
          <div className="card space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-between text-left"
              onClick={() => { setShowAsk((v) => !v); setAskAnswer(""); setAskError(""); }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#6366f1]">⁇</span>
                <span className="font-medium text-sm">Ask a question about this application</span>
              </div>
              <span className="text-[#888] text-xs">{showAsk ? "▲" : "▼"}</span>
            </button>

            {showAsk && (
              <div className="space-y-3 border-t border-[#2a2a2a] pt-3">
                <textarea
                  rows={3}
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder={`e.g. "How should I answer the 'why us?' question?"\n"What salary should I ask for?"\n"How do I explain my career gap?"`}
                  className="resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk();
                  }}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={askUseSearch}
                      onChange={(e) => setAskUseSearch(e.target.checked)}
                      className="w-4 h-4 accent-[#6366f1]"
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <span className="text-xs text-[#888]">Search web for fresh context</span>
                  </label>
                  <button
                    className="btn-primary text-xs py-1 px-4"
                    onClick={handleAsk}
                    disabled={askLoading || !askQuestion.trim()}
                  >
                    {askLoading ? (askUseSearch ? "Searching…" : "Thinking…") : "Ask"}
                  </button>
                </div>

                {askError && <p className="text-[#fca5a5] text-xs">{askError}</p>}

                {askAnswer && (
                  <div className="space-y-2 border-t border-[#2a2a2a] pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#888]">Answer</span>
                        {askSearchUsed && <span className="badge badge-green text-[10px] py-0">⊕ web</span>}
                      </div>
                      <button
                        className="text-xs text-[#6366f1] hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(askAnswer);
                          setAskCopied(true);
                          setTimeout(() => setAskCopied(false), 2000);
                        }}
                      >
                        {askCopied ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div
                      className="text-sm text-[#ccc] [&_strong]:text-white [&_ul]:pl-4 [&_li]:my-0.5 [&_p]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[#ededed] [&_code]:text-[#c084fc] [&_code]:bg-[#2a2a2a] [&_code]:px-1 [&_code]:rounded"
                      dangerouslySetInnerHTML={{ __html: marked(askAnswer, { async: false }) as string }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className={`card ${info.color} text-sm`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{info.icon}</span>
              <span className="font-medium">
                {selectedMethod === "computer-use"
                  ? "Claude will fill the form in a browser — you approve before submitting"
                  : "Copy your materials and paste them on the job page"}
              </span>
            </div>
            {selectedMethod === "manual" && app?.url && (
              <p className="text-[#888] text-xs mt-1">
                Click &quot;Copy &amp; Open&quot; below to copy your cover letter and open the job posting.
              </p>
            )}
          </div>

          {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {selectedMethod === "manual" ? (
              <>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (app?.company) params.set("company", app.company);
                    if (app?.role) params.set("role", app.role);
                    window.open(`/cv/print?${params.toString()}`, "_blank");
                  }}
                >
                  ↓ Download CV PDF
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    copyToClipboard(coverLetter, "cover");
                    if (app?.url) window.open(app.url, "_blank");
                  }}
                >
                  📋 Copy Cover Letter & Open Job Page
                </button>
                <button
                  className="btn-ghost"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "✓ Mark as Applied"}
                </button>
              </>
            ) : (
              <button
                className="btn-primary w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && selectedMethod === "computer-use"
                  ? "Claude is filling the form… (up to 2 min)"
                  : submitting
                  ? "Submitting…"
                  : `${info.icon} ${info.actionLabel}`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
