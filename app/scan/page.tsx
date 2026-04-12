"use client";

import { useEffect, useState } from "react";

interface JobResult {
  title: string;
  company: string;
  url: string;
  location: string;
  postedAt: string | null;
  postedAtRaw: string | null;
  h1bFriendly: boolean | null;
  snippet: string;
  source: "greenhouse" | "lever" | "ashby" | "jina" | "other";
  alreadyTracked: boolean;
}

interface ScanMeta {
  portalsScanned: number;
  totalFound: number;
  query: string;
  breakdown: { greenhouse: number; lever: number; ashby: number; other: number };
}

interface Portal {
  id: number;
  name: string;
  company: string;
  url: string;
  enabled: boolean;
  h1bFriendly: boolean;
}

export default function ScanPage() {
  const [tab, setTab] = useState<"scan" | "portals">("scan");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [meta, setMeta] = useState<ScanMeta | null>(null);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState<Set<string>>(new Set());

  // Portal state
  const [portals, setPortals] = useState<Portal[]>([]);
  const [newPortal, setNewPortal] = useState({ name: "", company: "", url: "", h1bFriendly: false });
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetch("/api/portals").then((r) => r.json()).then(setPortals);
  }, []);

  async function scan() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setMeta(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Scan failed");
      const data = await res.json();
      setResults(data.results);
      setMeta(data.meta ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function addToQueue(url: string) {
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setQueued((prev) => new Set([...prev, url]));
  }

  async function loadDefaults() {
    setSeeding(true);
    try {
      await fetch("/api/portals/seed", { method: "POST" });
      const updated = await fetch("/api/portals").then((r) => r.json());
      setPortals(updated);
    } finally {
      setSeeding(false);
    }
  }

  async function addPortal() {
    if (!newPortal.name.trim()) return;
    const res = await fetch("/api/portals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(newPortal),
    });
    const portal = await res.json();
    setPortals((prev) => [...prev, portal]);
    setNewPortal({ name: "", company: "", url: "", h1bFriendly: false });
  }

  async function togglePortal(id: number, enabled: boolean) {
    await fetch("/api/portals", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    setPortals((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  }

  async function removePortal(id: number) {
    await fetch("/api/portals", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPortals((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Scanner</h1>
        <p className="text-[#888] text-sm mt-1">
          Search for jobs and manage your portal list
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#2a2a2a] pb-0">
        {(["scan", "portals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? "border-[#6366f1] text-[#6366f1]" : "border-transparent text-[#888] hover:text-[#ededed]"
            }`}
          >
            {t === "scan" ? "Search Jobs" : `Portals (${portals.length})`}
          </button>
        ))}
      </div>

      {tab === "scan" && (
        <>
          <div className="card space-y-4">
            <div>
              <label>Search query</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                placeholder="Senior Data Scientist, ML Engineer, AI Platform..."
              />
            </div>
            <button className="btn-primary w-full" onClick={scan} disabled={loading || !query.trim()}>
              {loading ? "Fetching from Greenhouse · Lever · Ashby…" : "Scan Now"}
            </button>
            {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              {/* Scan summary */}
              {meta && (
                <div className="card py-2 flex items-center justify-between text-xs text-[#888]">
                  <span>
                    <span className="text-[#ededed] font-medium">{meta.totalFound}</span> matching jobs
                    {" · "}
                    <span className="text-[#ededed] font-medium">{meta.portalsScanned}</span> portals scanned
                  </span>
                  <span className="flex gap-3">
                    {meta.breakdown.greenhouse > 0 && <span>🟢 GH {meta.breakdown.greenhouse}</span>}
                    {meta.breakdown.lever > 0 && <span>🟡 LV {meta.breakdown.lever}</span>}
                    {meta.breakdown.ashby > 0 && <span>🔵 AB {meta.breakdown.ashby}</span>}
                  </span>
                </div>
              )}

              {results.map((job, i) => (
                <div key={i} className="card space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{job.title}</div>
                      <div className="text-[#888] text-sm flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{job.company}</span>
                        {job.location && <><span className="text-[#555]">·</span><span>{job.location}</span></>}
                        {job.snippet && <><span className="text-[#555]">·</span><span className="text-[#666]">{job.snippet}</span></>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {job.alreadyTracked && <span className="badge badge-purple">Tracked</span>}
                        {job.h1bFriendly === true && <span className="badge badge-green">H1B</span>}
                        {job.h1bFriendly === false && <span className="badge badge-red">No Sponsor</span>}
                        <span className={`badge badge-gray text-[10px] ${
                          job.source === "greenhouse" ? "text-[#86efac]" :
                          job.source === "lever" ? "text-[#fde68a]" :
                          "text-[#93c5fd]"
                        }`}>
                          {job.source === "greenhouse" ? "Greenhouse" : job.source === "lever" ? "Lever" : "Ashby"}
                        </span>
                      </div>
                      {job.postedAt && (
                        <span className="text-xs text-[#888]">{job.postedAt}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1 px-3">
                      View
                    </a>
                    {job.alreadyTracked ? (
                      <span className="text-xs text-[#888] py-1">Already tracked</span>
                    ) : (
                      <>
                        <a
                          href={`/pipeline?url=${encodeURIComponent(job.url)}`}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Evaluate Now
                        </a>
                        {!queued.has(job.url) ? (
                          <button className="btn-ghost text-xs py-1 px-3" onClick={() => addToQueue(job.url)}>
                            + Queue
                          </button>
                        ) : (
                          <span className="text-xs text-[#86efac] py-1">Queued ✓</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "portals" && (
        <div className="space-y-4">
          {/* Add portal form */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Add Portal</div>
              <button className="btn-ghost text-xs py-1 px-3" onClick={loadDefaults} disabled={seeding}>
                {seeding ? "Loading…" : "Load Defaults (50+)"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label>Name</label>
                <input value={newPortal.name} onChange={(e) => setNewPortal({ ...newPortal, name: e.target.value })} placeholder="Google" />
              </div>
              <div>
                <label>Company</label>
                <input value={newPortal.company} onChange={(e) => setNewPortal({ ...newPortal, company: e.target.value })} placeholder="Alphabet" />
              </div>
              <div>
                <label>Careers URL</label>
                <input value={newPortal.url} onChange={(e) => setNewPortal({ ...newPortal, url: e.target.value })} placeholder="https://careers.google.com" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPortal.h1bFriendly}
                  onChange={(e) => setNewPortal({ ...newPortal, h1bFriendly: e.target.checked })}
                  className="w-4 h-4 accent-[#6366f1]"
                  style={{ width: "1rem", height: "1rem" }}
                />
                <span className="text-sm">Sponsors H1B</span>
              </label>
              <button className="btn-primary text-sm" onClick={addPortal} disabled={!newPortal.name.trim()}>
                Add
              </button>
            </div>
          </div>

          {/* Portal list */}
          {portals.length === 0 ? (
            <div className="card text-center text-[#888] text-sm py-6">
              No portals configured. Add companies above or run the migration script to import from CareerForge.
            </div>
          ) : (
            <div className="space-y-2">
              {portals.map((p) => (
                <div key={p.id} className="card flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => togglePortal(p.id, e.target.checked)}
                      className="w-4 h-4 accent-[#6366f1]"
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      {p.url && <div className="text-xs text-[#888] truncate max-w-xs">{p.url}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.h1bFriendly && <span className="badge badge-green">H1B</span>}
                    <button className="text-xs text-[#fca5a5] hover:underline" onClick={() => removePortal(p.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
