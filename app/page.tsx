import { prisma } from "@/lib/db";
import Link from "next/link";

function scoreColor(score: number | null) {
  if (!score) return "badge-gray";
  if (score >= 4) return "badge-green";
  if (score >= 3) return "badge-yellow";
  return "badge-red";
}

export default async function Dashboard() {
  const [applications, pending, settings] = await Promise.all([
    prisma.application.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.pipelineItem.count({ where: { status: "pending" } }),
    prisma.settings.findFirst(),
  ]);

  const total = await prisma.application.count();
  const interviews = await prisma.application.count({ where: { status: "Interview" } });
  const offers = await prisma.application.count({ where: { status: "Offer" } });
  const avgScore = await prisma.application.aggregate({ _avg: { score: true } });

  if (!settings?.onboardingDone) {
    return (
      <div className="max-w-lg mx-auto mt-24 card text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to career-ops</h1>
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
                <Link href="/evaluate" className="btn-primary text-xs py-1 px-3">Evaluate Now</Link>
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
            <Link href="/evaluate" className="text-[#6366f1] hover:underline">Evaluate your first job</Link>.
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

      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/evaluate", label: "Evaluate a Job", desc: "Paste URL or JD text", icon: "◎" },
          { href: "/scan", label: "Scan Portals", desc: "Find new openings", icon: "⊕" },
          { href: "/linkedin", label: "Optimize LinkedIn", desc: "Improve your profile", icon: "◈" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="card hover:border-[#6366f1]/50 transition-colors cursor-pointer block">
            <div className="text-2xl mb-2 text-[#6366f1]">{a.icon}</div>
            <div className="font-medium text-sm">{a.label}</div>
            <div className="text-[#888] text-xs mt-1">{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
