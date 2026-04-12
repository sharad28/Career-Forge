"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreTier, TIER_STYLES } from "@/lib/scoring";

interface Application {
  id: number;
  num: number;
  date: string;
  company: string;
  role: string;
  score: number | null;
  status: string;
  hasPdf: boolean;
  notes: string;
  url: string;
  h1bFriendly: boolean | null;
  package?: { status: string } | null;
}

const STATUSES = ["Evaluated", "Applied", "Responded", "Interview", "Offer", "Rejected", "Discarded", "SKIP"];

function urlHealth(url: string): "ok" | "suspect" | "missing" {
  if (!url) return "missing";
  // Lever board URL without a job UUID = posting link is gone
  if (/jobs\.lever\.co\/[^/]+\/?$/.test(url)) return "suspect";
  // Ashby/Greenhouse board root without job ID
  if (/jobs\.ashbyhq\.com\/[^/]+\/?$/.test(url)) return "suspect";
  if (/boards\.greenhouse\.io\/[^/]+\/?$/.test(url)) return "suspect";
  return "ok";
}

function scoreColor(score: number | null) {
  if (!score) return "badge-gray";
  if (score >= 4) return "badge-green";
  if (score >= 3) return "badge-yellow";
  return "badge-red";
}

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [preparingId, setPreparingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tracker").then((r) => r.json()).then(setApps);
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    await fetch("/api/tracker", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setUpdatingId(null);
  }

  async function preparePackage(id: number) {
    setPreparingId(id);
    await fetch("/api/apply/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId: id }),
    });
    const data = await fetch("/api/tracker").then((r) => r.json());
    setApps(data);
    setPreparingId(null);
  }

  const filtered = apps.filter((a) => {
    const matchesText = !filter || `${a.company} ${a.role}`.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesText && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Tracker</h1>
          <p className="text-[#888] text-sm mt-1">{apps.length} applications tracked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          className="max-w-xs"
          placeholder="Search company or role..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[#888] text-left">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">H1B</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#888]">
                  No applications yet. <a href="/evaluate" className="text-[#6366f1] hover:underline">Evaluate your first job</a>.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#2a2a2a]/30 transition-colors">
                  <td className="px-4 py-3 text-[#888]">{app.num}</td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      {app.url ? (
                        <a href={app.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#6366f1] hover:underline">
                          {app.company}
                        </a>
                      ) : app.company}
                      {urlHealth(app.url) === "missing" && (
                        <span title="No job URL saved" className="text-[#555] text-xs">⊘</span>
                      )}
                      {urlHealth(app.url) === "suspect" && (
                        <span title="Job URL may be expired — links to company board, not a specific posting" className="text-[#fde68a] text-xs">⚠</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#888]">{app.role}</td>
                  <td className="px-4 py-3">
                    {app.score != null ? (
                      <span className={`badge ${scoreColor(app.score)}`}>{app.score.toFixed(1)}/5</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {app.score != null ? (
                      <span className={`badge ${TIER_STYLES[scoreTier(app.score)].badge}`}>
                        {scoreTier(app.score)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="text-xs py-1 px-2 w-32"
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {app.h1bFriendly === true && <span className="badge badge-green">Yes</span>}
                    {app.h1bFriendly === false && <span className="badge badge-red">No</span>}
                    {app.h1bFriendly === null && <span className="text-[#888]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#888] text-xs">
                    {new Date(app.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {app.status === "Evaluated" && app.score && app.score >= 3 ? (
                      app.package ? (
                        <Link
                          href={`/apply/${app.id}`}
                          className="text-xs text-[#6366f1] hover:underline font-medium"
                        >
                          ⚡ Apply
                        </Link>
                      ) : (
                        <button
                          className="text-xs text-[#888] hover:text-[#ededed]"
                          onClick={() => preparePackage(app.id)}
                          disabled={preparingId === app.id}
                        >
                          {preparingId === app.id ? "Preparing…" : "Prepare"}
                        </button>
                      )
                    ) : app.status === "Applied" ? (
                      <span className="text-xs text-[#86efac]">✓ Done</span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
