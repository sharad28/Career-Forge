"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { scoreTier, TIER_STYLES } from "@/lib/scoring";
import ProfileGate from "@/components/ProfileGate";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineItem {
  id: number;
  url: string;
  notes: string;
  status: string;
  addedAt: string;
}

interface TrackerApp {
  id: number;
  company: string;
  role: string;
  score: number | null;
  status: string;
  url: string;
  h1bFriendly: boolean | null;
}

interface EvalResult {
  company: string;
  role: string;
  score: number;
  summary: string;
  fitAnalysis: string;
  keywordGaps: string[];
  tailoredBullets: string[];
  h1bFriendly: boolean | null;
  recommendation: string;
  recommendation_tier?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 4) return "text-[#86efac]";
  if (score >= 3) return "text-[#fde68a]";
  return "text-[#fca5a5]";
}

function scoreBadgeClass(score: number | null) {
  if (!score) return "badge-gray";
  if (score >= 4) return "badge-green";
  if (score >= 3) return "badge-yellow";
  return "badge-red";
}

function domainLabel(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url.slice(0, 40); }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FullResultPanel({
  result, url, appId,
  selectedBullets, toggleBullet, selectAllBullets,
  applyBullets, applyingBullets, bulletsApplied,
  onSkip,
}: {
  result: EvalResult;
  url: string;
  appId?: number;
  selectedBullets: Set<number>;
  toggleBullet: (i: number) => void;
  selectAllBullets: () => void;
  applyBullets: () => void;
  applyingBullets: boolean;
  bulletsApplied: boolean;
  onSkip: () => void;
}) {
  const tier = (result.recommendation_tier || scoreTier(result.score)) as keyof typeof TIER_STYLES;
  const style = TIER_STYLES[tier] || TIER_STYLES.skip;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{result.company}</h2>
          <p className="text-[#888] text-sm">{result.role}</p>
        </div>
        <div className="flex items-center gap-3">
          {result.h1bFriendly === true && <span className="badge badge-green">H1B Friendly</span>}
          {result.h1bFriendly === false && <span className="badge badge-red">No Sponsorship</span>}
          {result.h1bFriendly === null && <span className="badge badge-gray">Sponsorship Unknown</span>}
          <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>
            {result.score.toFixed(1)}<span className="text-lg text-[#888]">/5</span>
          </div>
        </div>
      </div>

      {/* Tier banner */}
      <div className={`card border-l-4 ${style.border} ${style.bg} py-3`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`badge ${style.badge}`}>{style.label}</span>
        </div>
        <p className="text-sm text-[#ededed] mt-1">{result.recommendation}</p>
      </div>

      {/* Fit analysis */}
      <div className="card">
        <div className="font-medium mb-2 text-sm">Fit Analysis</div>
        <p className="text-sm text-[#888] whitespace-pre-wrap">{result.fitAnalysis}</p>
      </div>

      {/* Keyword gaps */}
      {result.keywordGaps.length > 0 && (
        <div className="card">
          <div className="font-medium mb-3 text-sm">Keyword Gaps</div>
          <div className="flex flex-wrap gap-2">
            {result.keywordGaps.map((kw) => (
              <span key={kw} className="badge badge-yellow">{kw}</span>
            ))}
          </div>
          <p className="text-[#888] text-xs mt-3">In the JD but missing from your CV. Add where accurate.</p>
        </div>
      )}

      {/* Tailored bullets */}
      {result.tailoredBullets.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">Suggested CV Bullets</div>
            {!bulletsApplied && (
              <button className="text-xs text-[#6366f1] hover:underline" onClick={selectAllBullets}>
                {selectedBullets.size === result.tailoredBullets.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {result.tailoredBullets.map((b, i) => (
              <li
                key={i}
                onClick={() => !bulletsApplied && toggleBullet(i)}
                className={`flex items-start gap-3 text-sm rounded-lg p-3 transition-colors ${
                  bulletsApplied ? "cursor-default" : "cursor-pointer"
                } ${
                  selectedBullets.has(i)
                    ? "bg-[#6366f1]/10 border border-[#6366f1]/30"
                    : "border border-[#2a2a2a] hover:border-[#444]"
                }`}
              >
                {!bulletsApplied && (
                  <input
                    type="checkbox"
                    checked={selectedBullets.has(i)}
                    onChange={() => toggleBullet(i)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 w-4 h-4 accent-[#6366f1] flex-shrink-0 cursor-pointer"
                    style={{ width: "1rem", height: "1rem" }}
                  />
                )}
                {bulletsApplied && selectedBullets.has(i) && (
                  <span className="text-[#86efac] flex-shrink-0 mt-0.5">✓</span>
                )}
                <span className={bulletsApplied && !selectedBullets.has(i) ? "text-[#888]" : "text-[#ededed]"}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
          {!bulletsApplied ? (
            <button
              className="btn-primary w-full text-sm"
              onClick={applyBullets}
              disabled={applyingBullets || selectedBullets.size === 0}
            >
              {applyingBullets
                ? "Applying…"
                : selectedBullets.size === 0
                ? "Select bullets to apply to CV"
                : `Apply ${selectedBullets.size} bullet${selectedBullets.size > 1 ? "s" : ""} to CV`}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                className="btn-primary flex-1 text-sm"
                onClick={() => {
                  const params = new URLSearchParams({ company: result.company, role: result.role });
                  window.open(`/cv/print?${params}`, "_blank");
                }}
              >
                Download Tailored PDF
              </button>
              <Link href="/cv" className="btn-ghost flex-1 text-center text-sm">View in CV Editor</Link>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {appId ? (
          <Link href={`/apply/${appId}`} className="btn-primary flex-1 text-center text-sm">
            Prepare Application →
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        <Link
          href={`/research?company=${encodeURIComponent(result.company)}&role=${encodeURIComponent(result.role)}`}
          className="btn-ghost text-sm"
        >
          Research →
        </Link>
        <button className="btn-ghost text-sm text-[#fca5a5] border-[#fca5a5]/30" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}

function TrackerOnlyPanel({
  app, onReEvaluate,
}: {
  app: TrackerApp;
  onReEvaluate: () => void;
}) {
  const tier = app.score ? scoreTier(app.score) : null;
  const style = tier ? TIER_STYLES[tier] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{app.company}</h2>
          <p className="text-[#888] text-sm">{app.role}</p>
        </div>
        {app.score && (
          <div className={`text-4xl font-bold ${scoreColor(app.score)}`}>
            {app.score.toFixed(1)}<span className="text-lg text-[#888]">/5</span>
          </div>
        )}
      </div>

      {style && tier && (
        <div className={`card border-l-4 ${style.border} ${style.bg} py-3`}>
          <span className={`badge ${style.badge}`}>{style.label}</span>
          <p className="text-xs text-[#888] mt-2">
            Full analysis (gaps, bullets, fit breakdown) is available — re-evaluate to load it.
          </p>
        </div>
      )}

      <div className="card border-[#2a2a2a] text-center py-8 space-y-3">
        <p className="text-[#888] text-sm">This job was previously evaluated.</p>
        <p className="text-[#555] text-xs">Re-evaluate to see keyword gaps, tailored bullets, and fit analysis against your current CV.</p>
        <button className="btn-primary text-sm" onClick={onReEvaluate}>
          ◎ Re-evaluate
        </button>
      </div>

      <div className="flex gap-3">
        <Link href={`/apply/${app.id}`} className="btn-primary flex-1 text-center text-sm">
          Prepare Application →
        </Link>
        <Link
          href={`/research?company=${encodeURIComponent(app.company)}&role=${encodeURIComponent(app.role)}`}
          className="btn-ghost text-sm"
        >
          Research →
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [trackerApps, setTrackerApps] = useState<TrackerApp[]>([]);

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedTrackerOnlyId, setSelectedTrackerOnlyId] = useState<number | null>(null);

  const [evalCache, setEvalCache] = useState<Map<string, EvalResult>>(new Map());
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [evalError, setEvalError] = useState("");

  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState("");

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ pending: number; done: number; errors: number } | null>(null);

  const [savedAppIds, setSavedAppIds] = useState<Map<string, number>>(new Map());

  const [selectedBullets, setSelectedBullets] = useState<Set<number>>(new Set());
  const [applyingBullets, setApplyingBullets] = useState(false);
  const [bulletsApplied, setBulletsApplied] = useState(false);

  const didAutoEval = useRef(false);

  useEffect(() => {
    loadData().then(() => {
      const urlParam = new URLSearchParams(window.location.search).get("url") ?? "";
      if (urlParam && !didAutoEval.current) {
        didAutoEval.current = true;
        addAndEvaluate(urlParam);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const [pipelineData, trackerData] = await Promise.all([
      fetch("/api/pipeline").then((r) => r.json()),
      fetch("/api/tracker").then((r) => r.json()),
    ]);
    setItems(pipelineData);
    setTrackerApps(trackerData.slice(0, 30));
    const idMap = new Map<string, number>();
    for (const a of trackerData) { if (a.url) idMap.set(a.url, a.id); }
    setSavedAppIds(idMap);
  }

  async function addAndEvaluate(url: string) {
    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    // 409 = already in queue, still fine
    if (res.ok || res.status === 409) {
      const data = res.ok ? await res.json() : null;
      if (data) setItems((prev) => [data, ...prev.filter((i) => i.url !== url)]);
      selectAndEvaluate(url);
    }
  }

  function selectAndEvaluate(url: string) {
    setSelectedUrl(url);
    setSelectedTrackerOnlyId(null);
    setEvalError("");
    setBulletsApplied(false);
    setSelectedBullets(new Set());
    if (!evalCache.has(url)) {
      runEvaluation(url);
    }
  }

  function selectTrackerOnly(app: TrackerApp) {
    setSelectedUrl(app.url || null);
    setSelectedTrackerOnlyId(app.id);
    setEvalError("");
    setBulletsApplied(false);
    setSelectedBullets(new Set());
    // If we have a URL and it's in cache, show full result
    if (app.url && evalCache.has(app.url)) return;
    // Otherwise show tracker-only panel
  }

  async function runEvaluation(url: string) {
    setEvaluating(url);
    setEvalError("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: url }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Evaluation failed");
      }
      const result: EvalResult = await res.json();
      setEvalCache((prev) => new Map(prev).set(url, result));

      // Auto-save to tracker
      const saveRes = await fetch("/api/tracker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: url, result }),
      });
      const saved = await saveRes.json();
      if (saved?.id) {
        setSavedAppIds((prev) => new Map(prev).set(url, saved.id));
      }

      // Refresh both lists
      const [pipelineData, trackerData] = await Promise.all([
        fetch("/api/pipeline").then((r) => r.json()),
        fetch("/api/tracker").then((r) => r.json()),
      ]);
      setItems(pipelineData);
      setTrackerApps(trackerData.slice(0, 30));
      const idMap = new Map<string, number>();
      for (const a of trackerData) { if (a.url) idMap.set(a.url, a.id); }
      setSavedAppIds(idMap);
    } catch (e: unknown) {
      setEvalError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setEvaluating(null);
    }
  }

  async function skipItem(url: string) {
    const item = items.find((i) => i.url === url);
    if (!item) return;
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id, status: "skipped" }),
    });
    setItems((prev) => prev.map((i) => (i.url === url ? { ...i, status: "skipped" } : i)));
    setSelectedUrl(null);
  }

  async function addUrl() {
    if (!newUrl.trim()) return;
    setAddError("");
    await addAndEvaluate(newUrl.trim());
    setNewUrl("");
  }

  async function runBatch() {
    setBatchRunning(true);
    setBatchProgress(null);
    const pollInterval = setInterval(async () => {
      const s = await fetch("/api/pipeline/batch/status").then((r) => r.json());
      setBatchProgress(s);
    }, 2000);
    try {
      const res = await fetch("/api/pipeline/batch", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Batch failed");
      await loadData();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Batch failed");
    } finally {
      clearInterval(pollInterval);
      setBatchRunning(false);
      setBatchProgress(null);
    }
  }

  function toggleBullet(i: number) {
    setSelectedBullets((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function applyBullets(result: EvalResult) {
    if (selectedBullets.size === 0) return;
    setApplyingBullets(true);
    try {
      const bullets = result.tailoredBullets.filter((_, i) => selectedBullets.has(i));
      await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bullets, company: result.company, role: result.role }),
      });
      setBulletsApplied(true);
    } finally {
      setApplyingBullets(false);
    }
  }

  const pending = items.filter((i) => i.status === "pending");
  const skipped = items.filter((i) => i.status === "skipped");
  const trackerUrls = new Set(items.map((i) => i.url));

  // Jobs in tracker that are NOT in the pipeline queue (evaluated from elsewhere)
  const trackerOnly = trackerApps.filter((a) => !a.url || !trackerUrls.has(a.url));

  const selectedResult = selectedUrl ? evalCache.get(selectedUrl) : undefined;
  const selectedTrackerApp = selectedUrl
    ? trackerApps.find((a) => a.url === selectedUrl)
    : selectedTrackerOnlyId
    ? trackerApps.find((a) => a.id === selectedTrackerOnlyId)
    : undefined;
  const isEvaluatingSelected = evaluating === selectedUrl;

  return (
    <ProfileGate requires={["llmApiKey", "cv", "targetRoles"]}>
    {/* Break out of main's p-8 padding to fill full height */}
    <div className="-m-8 flex" style={{ height: "calc(100vh - 0px)" }}>

      {/* ── LEFT PANE ── */}
      <div className="w-72 flex-shrink-0 border-r border-[#2a2a2a] flex flex-col overflow-hidden h-full">

        {/* Add URL + Batch */}
        <div className="p-3 border-b border-[#2a2a2a] space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm py-1.5 px-2"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="Paste job URL to evaluate…"
            />
            <button
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
              onClick={addUrl}
              disabled={!newUrl.trim()}
            >
              Add
            </button>
          </div>
          {addError && <p className="text-[#fca5a5] text-xs">{addError}</p>}
          {pending.length > 0 && (
            <button
              className="btn-ghost text-xs w-full py-1.5"
              onClick={runBatch}
              disabled={batchRunning}
            >
              {batchRunning
                ? batchProgress
                  ? `Evaluating… ${batchProgress.done} done, ${batchProgress.pending} left`
                  : "Starting…"
                : `⚡ Evaluate All (${pending.length})`}
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">

          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                Pending ({pending.length})
              </div>
              {pending.map((item) => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#1a1a1a] transition-colors ${
                    selectedUrl === item.url
                      ? "bg-[#6366f1]/15 border-l-2 border-l-[#6366f1]"
                      : "hover:bg-[#1f1f1f]"
                  }`}
                  onClick={() => selectAndEvaluate(item.url)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-[#aaa] truncate flex-1">{domainLabel(item.url)}</span>
                    {evaluating === item.url
                      ? <span className="text-[10px] text-[#6366f1] flex-shrink-0 animate-pulse">scoring…</span>
                      : <span className="text-[10px] text-[#444] flex-shrink-0">new</span>
                    }
                  </div>
                  <div className="text-[11px] text-[#444] truncate mt-0.5">
                    {new URL(item.url).pathname.split("/").filter(Boolean).slice(-2).join(" / ")}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Evaluated from pipeline (done) */}
          {items.filter((i) => i.status === "done").length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                Evaluated
              </div>
              {items.filter((i) => i.status === "done").map((item) => {
                const app = trackerApps.find((a) => a.url === item.url);
                const tier = app?.score ? scoreTier(app.score) : null;
                return (
                  <button
                    key={item.id}
                    className={`w-full text-left px-3 py-2.5 border-b border-[#1a1a1a] transition-colors ${
                      selectedUrl === item.url
                        ? "bg-[#6366f1]/15 border-l-2 border-l-[#6366f1]"
                        : "hover:bg-[#1f1f1f]"
                    }`}
                    onClick={() => app ? selectTrackerOnly(app) : selectAndEvaluate(item.url)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-[#ededed] font-medium truncate flex-1">
                        {app?.company || domainLabel(item.url)}
                      </span>
                      {app?.score && tier && (
                        <span className={`badge ${TIER_STYLES[tier].badge} text-[10px] py-0 flex-shrink-0`}>
                          {app.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {app?.role && (
                      <div className="text-[11px] text-[#555] truncate mt-0.5">{app.role}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tracker-only (evaluated outside this queue) */}
          {trackerOnly.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                Previously Evaluated
              </div>
              {trackerOnly.map((app) => {
                const tier = app.score ? scoreTier(app.score) : null;
                const isSelected = selectedTrackerOnlyId === app.id || selectedUrl === app.url;
                return (
                  <button
                    key={app.id}
                    className={`w-full text-left px-3 py-2.5 border-b border-[#1a1a1a] transition-colors ${
                      isSelected
                        ? "bg-[#6366f1]/15 border-l-2 border-l-[#6366f1]"
                        : "hover:bg-[#1f1f1f]"
                    }`}
                    onClick={() => selectTrackerOnly(app)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-[#ededed] font-medium truncate flex-1">{app.company}</span>
                      {app.score && tier && (
                        <span className={`badge ${TIER_STYLES[tier].badge} text-[10px] py-0 flex-shrink-0`}>
                          {app.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#555] truncate mt-0.5">{app.role}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Skipped */}
          {skipped.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#555]">
                Skipped ({skipped.length})
              </div>
              {skipped.map((item) => (
                <div key={item.id} className="px-3 py-2 border-b border-[#1a1a1a] opacity-30">
                  <span className="text-xs text-[#888] truncate block">{domainLabel(item.url)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {items.length === 0 && trackerApps.length === 0 && (
            <div className="p-6 text-center space-y-2">
              <div className="text-3xl text-[#2a2a2a]">◎</div>
              <p className="text-[#555] text-xs">No jobs yet.</p>
              <Link href="/scan" className="text-[#6366f1] text-xs hover:underline">
                Scan for jobs →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANE ── */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* Nothing selected */}
        {!selectedUrl && !selectedTrackerOnlyId && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-5xl mb-4 text-[#1f1f1f]">◎</div>
              <p className="text-[#555] text-sm">Select a job from the list to evaluate it</p>
              <p className="text-[#444] text-xs mt-2">
                Or{" "}
                <Link href="/scan" className="text-[#6366f1] hover:underline">
                  scan for new jobs
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Evaluating spinner */}
        {isEvaluatingSelected && (
          <div className="max-w-2xl">
            <div className="card text-center py-16 space-y-3">
              <div className="text-[#6366f1] text-3xl animate-pulse">◎</div>
              <p className="text-[#888] text-sm">Scoring against your CV…</p>
              <p className="text-[#444] text-xs truncate max-w-sm mx-auto">{selectedUrl}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {selectedUrl && !isEvaluatingSelected && evalError && (
          <div className="max-w-2xl">
            <div className="card border-[#fca5a5]/30 space-y-3">
              <p className="text-[#fca5a5] text-sm">{evalError}</p>
              <button className="btn-ghost text-xs" onClick={() => selectedUrl && runEvaluation(selectedUrl)}>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Full result */}
        {selectedUrl && !isEvaluatingSelected && !evalError && selectedResult && (
          <div className="max-w-2xl">
            <FullResultPanel
              result={selectedResult}
              url={selectedUrl}
              appId={savedAppIds.get(selectedUrl)}
              selectedBullets={selectedBullets}
              toggleBullet={toggleBullet}
              selectAllBullets={() => {
                if (selectedBullets.size === selectedResult.tailoredBullets.length) {
                  setSelectedBullets(new Set());
                } else {
                  setSelectedBullets(new Set(selectedResult.tailoredBullets.map((_, i) => i)));
                }
              }}
              applyBullets={() => applyBullets(selectedResult)}
              applyingBullets={applyingBullets}
              bulletsApplied={bulletsApplied}
              onSkip={() => selectedUrl && skipItem(selectedUrl)}
            />
          </div>
        )}

        {/* Tracker-only result (no cache) */}
        {!isEvaluatingSelected && !evalError && !selectedResult && selectedTrackerApp && (
          <div className="max-w-2xl">
            <TrackerOnlyPanel
              app={selectedTrackerApp}
              onReEvaluate={() => {
                const url = selectedTrackerApp.url || `tracker-${selectedTrackerApp.id}`;
                setSelectedUrl(url);
                runEvaluation(url);
              }}
            />
          </div>
        )}
      </div>
    </div>
    </ProfileGate>
  );
}
