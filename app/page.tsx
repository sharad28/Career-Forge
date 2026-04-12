import { prisma } from "@/lib/db";
import Link from "next/link";
import { scoreTier, TIER_STYLES } from "@/lib/scoring";

function scoreColor(score: number | null) {
  if (!score) return "badge-gray";
  if (score >= 4) return "badge-green";
  if (score >= 3) return "badge-yellow";
  return "badge-red";
}

export default async function Dashboard() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [applications, pending, settings, total, interviews, offers, avgScore, weeklyApps, portalCount, scoredApps] = await Promise.all([
    prisma.application.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.pipelineItem.count({ where: { status: "pending" } }),
    prisma.settings.findFirst(),
    prisma.application.count(),
    prisma.application.count({ where: { status: "Interview" } }),
    prisma.application.count({ where: { status: "Offer" } }),
    prisma.application.aggregate({ _avg: { score: true } }),
    prisma.application.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.portal.count({ where: { enabled: true } }),
    prisma.application.findMany({ select: { score: true }, where: { score: { not: null } } }),
  ]);

  const dist = { strong: 0, good: 0, marginal: 0, skip: 0 };
  for (const a of scoredApps) {
    if (a.score != null) dist[scoreTier(a.score)]++;
  }

  if (!settings?.onboardingDone) {
    return (
      <div className="max-w-lg mx-auto mt-24 card text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to CareerForge</h1>
        <p className="text-[#888] mb-6">
          AI-powered job search pipeline. Set up in 3 minutes.
        </p>
        <Link href="/settings?onboarding=1" className="btn-primary inline-block">
          Start Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[#888] text-sm mt-1">
          {settings?.fullName ? `Welcome back, ${settings.fullName.split(" ")[0]}` : "Your job search pipeline"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Applications", value: total, color: "text-[#6366f1]" },
          { label: "Avg Score", value: avgScore._avg.score ? `${avgScore._avg.score.toFixed(1)}/5` : "—", color: "text-[#ededed]" },
          { label: "Interviews", value: interviews, color: "text-[#86efac]" },
          { label: "Offers", value: offers, color: "text-[#fde68a]" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[#888] text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "This Week", value: weeklyApps, color: "text-[#c084fc]" },
          { label: "Active Portals", value: portalCount, color: "text-[#93c5fd]" },
          { label: "Pending Queue", value: pending, color: "text-[#fde68a]" },
          { label: "Scored", value: scoredApps.length, color: "text-[#ededed]" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[#888] text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {scoredApps.length > 0 && (
        <div className="card">
          <div className="text-sm font-medium mb-3">Score Distribution</div>
          <div className="flex gap-3 flex-wrap">
            {(["strong", "good", "marginal", "skip"] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-2">
                <span className={`badge ${TIER_STYLES[tier].badge}`}>{tier}</span>
                <span className="text-sm font-bold">{dist[tier]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card border-[#6366f1]/30 bg-[#6366f1]/5">
        <div className="flex items-start gap-3">
          <span className="text-[#6366f1] text-lg">◎</span>
          <div>
            <div className="text-sm font-medium text-[#6366f1] mb-1">AI Suggestion</div>
            <p className="text-sm text-[#ededed]">
              {pending > 0
                ? `You have ${pending} job${pending > 1 ? "s" : ""} in the queue. Evaluate them to keep your pipeline moving.`
                : total === 0
                ? "Add your first job URL to get started."
                : interviews === 0
                ? "No interviews yet. Try optimizing your CV keywords to improve ATS pass rate."
                : `You have ${interviews} active interview${interviews > 1 ? "s" : ""}. Check your story bank for prep.`}
            </p>
            <div className="mt-3 flex gap-2">
              {pending > 0 && (
                <Link href="/pipeline" className="btn-primary text-xs py-1 px-3">Open Job Inbox</Link>
              )}
              <Link href="/cv" className="btn-ghost text-xs py-1 px-3">Check CV</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Applications</h2>
          <Link href="/tracker" className="text-xs text-[#6366f1] hover:underline">View all</Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-[#888] text-sm">
            No applications yet.{" "}
            <Link href="/pipeline" className="text-[#6366f1] hover:underline">Evaluate your first job</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                <div>
                  <div className="font-medium text-sm">{app.company}</div>
                  <div className="text-[#888] text-xs">{app.role}</div>
                </div>
                <div className="flex items-center gap-3">
                  {app.score && (
                    <span className={`badge ${scoreColor(app.score)}`}>{app.score.toFixed(1)}/5</span>
                  )}
                  <span className="badge badge-gray">{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow guide */}
      <div>
        <h2 className="font-semibold text-sm text-[#888] uppercase tracking-widest mb-3">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border-[#6366f1]/20">
            <div className="text-xs font-semibold text-[#6366f1] uppercase tracking-widest mb-2">1 · Find Jobs</div>
            <div className="space-y-1.5">
              {[
                { href: "/scan", icon: "⊕", label: "Scanner", desc: "Discover openings from 50+ portals" },
                { href: "/pipeline", icon: "◎", label: "Job Inbox", desc: "Evaluate & triage jobs" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-start gap-2 py-1 hover:text-[#ededed] text-[#888] transition-colors group">
                  <span className="text-[#6366f1] mt-0.5 flex-shrink-0">{a.icon}</span>
                  <div>
                    <span className="text-sm text-[#ededed] group-hover:text-white font-medium">{a.label}</span>
                    <span className="text-xs text-[#666] ml-2">{a.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card border-[#86efac]/20">
            <div className="text-xs font-semibold text-[#86efac] uppercase tracking-widest mb-2">2 · Apply</div>
            <div className="space-y-1.5">
              {[
                { href: "/cv", icon: "◻", label: "CV Editor", desc: "Edit, tailor, and export as PDF" },
                { href: "/tracker", icon: "▤", label: "Tracker", desc: "Track every application & status" },
                { href: "/linkedin", icon: "◈", label: "LinkedIn", desc: "Generate outreach messages" },
                { href: "/stories", icon: "◇", label: "Stories", desc: "Build your STAR answer bank" },
                { href: "/ask", icon: "⁇", label: "Ask", desc: "Answer any application question" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-start gap-2 py-1 hover:text-[#ededed] text-[#888] transition-colors group">
                  <span className="text-[#86efac] mt-0.5 flex-shrink-0">{a.icon}</span>
                  <div>
                    <span className="text-sm text-[#ededed] group-hover:text-white font-medium">{a.label}</span>
                    <span className="text-xs text-[#666] ml-2">{a.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card border-[#c084fc]/20">
            <div className="text-xs font-semibold text-[#c084fc] uppercase tracking-widest mb-2">3 · Research & Learn</div>
            <div className="space-y-1.5">
              {[
                { href: "/research", icon: "⊛", label: "Research", desc: "6-axis company deep-dive" },
                { href: "/report", icon: "◉", label: "Reports", desc: "Saved evaluation reports" },
                { href: "/compare", icon: "⊟", label: "Compare", desc: "Side-by-side offer comparison" },
                { href: "/training", icon: "◑", label: "Training", desc: "Is this course worth it?" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-start gap-2 py-1 hover:text-[#ededed] text-[#888] transition-colors group">
                  <span className="text-[#c084fc] mt-0.5 flex-shrink-0">{a.icon}</span>
                  <div>
                    <span className="text-sm text-[#ededed] group-hover:text-white font-medium">{a.label}</span>
                    <span className="text-xs text-[#666] ml-2">{a.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
