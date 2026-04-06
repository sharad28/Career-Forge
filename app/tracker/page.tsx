"use client";

import { useEffect, useState } from "react";

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
}

const STATUSES = ["Evaluated", "Applied", "Responded", "Interview", "Offer", "Rejected", "Discarded", "SKIP"];

const STATUS_COLORS: Record<string, string> = {
  Evaluated: "badge-blue",
  Applied: "badge-blue",
  Responded: "badge-yellow",
  Interview: "badge-green",
  Offer: "badge-green",
  Rejected: "badge-red",
  Discarded: "badge-gray",
  SKIP: "badge-gray",
};

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
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">H1B</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#888]">
                  No applications yet. <a href="/evaluate" className="text-[#6366f1] hover:underline">Evaluate your first job</a>.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#2a2a2a]/30 transition-colors">
                  <td className="px-4 py-3 text-[#888]">{app.num}</td>
                  <td className="px-4 py-3 font-medium">
                    {app.url ? (
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#6366f1] hover:underline">
                        {app.company}
                      </a>
                    ) : app.company}
                  </td>
                  <td className="px-4 py-3 text-[#888]">{app.role}</td>
                  <td className="px-4 py-3">
                    {app.score != null ? (
                      <span className={`badge ${scoreColor(app.score)}`}>{app.score.toFixed(1)}/5</span>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
