import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Stub: in production this would use Playwright to scrape job portals
// For now returns a placeholder response pointing to real job search URLs
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    const encoded = encodeURIComponent(query);

    // Return search links to configured portals
    // Full Playwright scraping is wired in the Playwright integration layer
    const results = [
      {
        title: `Search: "${query}" on LinkedIn`,
        company: "LinkedIn Jobs",
        url: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&f_TPR=r86400`,
        location: "Various",
        postedAt: "Last 24h",
        h1bFriendly: null,
        snippet: "Click to search LinkedIn Jobs. Filter by 'Past 24 hours' for early applications.",
      },
      {
        title: `Search: "${query}" on Indeed`,
        company: "Indeed",
        url: `https://www.indeed.com/jobs?q=${encoded}&fromage=1`,
        location: "Various",
        postedAt: "Last 24h",
        h1bFriendly: null,
        snippet: "Indeed search filtered to last 24 hours.",
      },
      {
        title: `Search: "${query}" on Greenhouse`,
        company: "Greenhouse Job Board",
        url: `https://boards.greenhouse.io/search?q=${encoded}`,
        location: "Various",
        postedAt: null,
        h1bFriendly: null,
        snippet: "Direct company job boards via Greenhouse ATS.",
      },
    ];

    return NextResponse.json({ results });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
