"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Report {
  id: number;
  num: number;
  slug: string;
  content: string;
  createdAt: string;
  applications: { company: string; role: string; score: number | null }[];
}

interface OutreachMessage {
  target: string;
  message: string;
}

interface OutreachResult {
  hiringManager: OutreachMessage;
  recruiter: OutreachMessage;
  peer: OutreachMessage;
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto mt-12 text-[#888]">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const params = useSearchParams();
  const reportId = params.get("id");
  const [report, setReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [outreach, setOutreach] = useState<OutreachResult | null>(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function generateOutreach() {
    if (!report) return;
    setGeneratingOutreach(true);
    setOutreachError("");
    try {
      const res = await fetch("/api/linkedin/outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Outreach generation failed");
      }
      setOutreach(await res.json());
    } catch (e: unknown) {
      setOutreachError(e instanceof Error ? e.message : "Failed to generate outreach");
    } finally {
      setGeneratingOutreach(false);
    }
  }

  function copyMessage(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => {
    if (reportId) {
      fetch(`/api/report?id=${reportId}`)
        .then((r) => r.json())
        .then((d) => { setReport(d); setLoading(false); });
    } else {
      fetch("/api/report")
        .then((r) => r.json())
        .then((d) => { setReports(d); setLoading(false); });
    }
  }, [reportId]);

  if (loading) {
    return <div className="max-w-3xl mx-auto mt-12 text-[#888]">Loading...</div>;
  }

  // Single report view
  if (reportId && report) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{report.slug}</h1>
            <p className="text-[#888] text-sm mt-1">
              Report #{report.num} — {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <a href="/report" className="btn-ghost text-sm">All Reports</a>
        </div>
        <div className="card">
          <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
            {report.content}
          </div>
        </div>

        {/* LinkedIn Outreach */}
        {!outreach ? (
          <div>
            <button
              className="btn-ghost w-full"
              onClick={generateOutreach}
              disabled={generatingOutreach}
            >
              {generatingOutreach ? "Generating outreach messages…" : "◈ Generate LinkedIn Outreach"}
            </button>
            {outreachError && <p className="text-[#fca5a5] text-sm mt-2">{outreachError}</p>}
          </div>
        ) : (
          <div className="card space-y-4">
            <div className="font-medium">LinkedIn Outreach Messages</div>
            <p className="text-xs text-[#888]">Each message is under 300 characters — ready to paste into LinkedIn.</p>
            {(["hiringManager", "recruiter", "peer"] as const).map((key) => {
              const item = outreach[key];
              const labels = { hiringManager: "Hiring Manager", recruiter: "Recruiter", peer: "Peer" };
              return (
                <div key={key} className="border border-[#2a2a2a] rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{labels[key]}</div>
                    <button
                      className="btn-ghost text-xs py-1 px-3"
                      onClick={() => copyMessage(key, item.message)}
                    >
                      {copied === key ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="text-xs text-[#888]">{item.target}</div>
                  <p className="text-sm text-[#ededed] bg-[#0f0f0f] rounded p-3">{item.message}</p>
                  <div className="text-xs text-[#888]">{item.message.length}/300 chars</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Report list
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluation Reports</h1>
        <p className="text-[#888] text-sm mt-1">{reports.length} reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center text-[#888] text-sm py-8">
          No reports yet. <a href="/evaluate" className="text-[#6366f1] hover:underline">Evaluate a job</a> and save it to create your first report.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const app = r.applications[0];
            return (
              <a
                key={r.id}
                href={`/report?id=${r.id}`}
                className="card block hover:border-[#6366f1]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{app?.company || r.slug}</div>
                    <div className="text-[#888] text-xs">{app?.role || "—"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app?.score != null && (
                      <span className={`badge ${app.score >= 4 ? "badge-green" : app.score >= 3 ? "badge-yellow" : "badge-red"}`}>
                        {app.score.toFixed(1)}/5
                      </span>
                    )}
                    <span className="text-xs text-[#888]">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
