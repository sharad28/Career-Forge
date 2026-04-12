import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchAllPortals, matchesQuery } from "@/lib/jobs";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const [settings, portals, existingApps] = await Promise.all([
      prisma.settings.findFirst(),
      prisma.portal.findMany({ where: { enabled: true } }),
      prisma.application.findMany({ select: { url: true }, where: { url: { not: "" } } }),
    ]);

    const trackedUrls = new Set(existingApps.map((a) => a.url));

    // Only fetch from Greenhouse / Lever / Ashby portals — skip unknowns
    const activePortals = portals.filter((p) => {
      if (settings?.h1bFilter && !p.h1bFriendly) return false;
      return /boards\.greenhouse\.io|job-boards\.greenhouse\.io|jobs\.lever\.co|jobs\.ashbyhq\.com/i.test(p.url);
    });

    const liveJobs = activePortals.length > 0
      ? await fetchAllPortals(
          activePortals.map((p) => ({
            url: p.url,
            company: p.company || p.name,
            h1bFriendly: p.h1bFriendly,
          }))
        )
      : [];

    // Filter by query keywords
    const matched = liveJobs.filter((j) => matchesQuery(j, query));

    // Annotate with h1bFriendly + alreadyTracked
    const results = matched.map((job) => {
      const portal = activePortals.find((p) => {
        try {
          return job.url.includes(new URL(p.url).hostname.replace("www.", ""));
        } catch { return false; }
      });
      return {
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        postedAt: job.postedAt,
        postedAtRaw: job.postedAtRaw,
        h1bFriendly: portal?.h1bFriendly ?? null,
        snippet: job.snippet,
        source: job.source,
        alreadyTracked: trackedUrls.has(job.url),
      };
    });

    // Sort by publish date — newest first, nulls last
    results.sort((a, b) => {
      if (!a.postedAtRaw && !b.postedAtRaw) return 0;
      if (!a.postedAtRaw) return 1;
      if (!b.postedAtRaw) return -1;
      return new Date(b.postedAtRaw).getTime() - new Date(a.postedAtRaw).getTime();
    });

    const breakdown = {
      greenhouse: liveJobs.filter((j) => j.source === "greenhouse").length,
      lever:      liveJobs.filter((j) => j.source === "lever").length,
      ashby:      liveJobs.filter((j) => j.source === "ashby").length,
    };

    return NextResponse.json({
      results,
      meta: {
        portalsScanned: activePortals.length,
        totalFound: matched.length,
        query,
        breakdown,
      },
    });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
