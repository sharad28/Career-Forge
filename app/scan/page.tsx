"use client";

import { useState } from "react";

interface JobResult {
  title: string;
  company: string;
  url: string;
  location: string;
  postedAt: string;
  h1bFriendly: boolean | null;
  snippet: string;
}

export default function ScanPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState<Set<string>>(new Set());

  async function scan() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Scan failed");
      const data = await res.json();
      setResults(data.results);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Scanner</h1>
        <p className="text-[#888] text-sm mt-1">
          Search for jobs across configured portals. Results are deduplicated and filtered.
        </p>
      </div>

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
          {loading ? "Scanning…" : "Scan Now"}
        </button>
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-[#888]">{results.length} results found</div>
          {results.map((job, i) => (
            <div key={i} className="card space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-[#888] text-sm">{job.company} · {job.location}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.h1bFriendly === true && <span className="badge badge-green">H1B</span>}
                  {job.h1bFriendly === false && <span className="badge badge-red">No Sponsor</span>}
                  {job.postedAt && <span className="text-xs text-[#888]">{job.postedAt}</span>}
                </div>
              </div>
              {job.snippet && <p className="text-xs text-[#888]">{job.snippet}</p>}
              <div className="flex gap-2 pt-1">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs py-1 px-3"
                >
                  View Job
                </a>
                {!queued.has(job.url) ? (
                  <button
                    className="btn-primary text-xs py-1 px-3"
                    onClick={() => addToQueue(job.url)}
                  >
                    Add to Queue
                  </button>
                ) : (
                  <span className="text-xs text-[#86efac] py-1">Queued</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
