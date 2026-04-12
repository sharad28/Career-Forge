import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const applications = await prisma.application.findMany({
    orderBy: { date: "desc" },
    include: { report: true, package: true },
  });
  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  try {
    const { input, result } = await req.json();

    const company = result.company || "Unknown";
    const role = result.role || "Unknown Role";

    const lastApp = await prisma.application.findFirst({ orderBy: { num: "desc" } });
    const num = (lastApp?.num ?? 0) + 1;

    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const date = new Date().toISOString().split("T")[0];

    // Build markdown report content
    const reportContent = [
      `# ${company} — ${role}`,
      "",
      `**Score:** ${result.score}/5`,
      `**URL:** ${input.startsWith("http") ? input : "N/A"}`,
      `**H1B:** ${result.h1bFriendly === true ? "Yes" : result.h1bFriendly === false ? "No" : "Unknown"}`,
      "",
      "## Summary",
      result.summary || "",
      "",
      "## Fit Analysis",
      result.fitAnalysis || "",
      "",
      "## Recommendation",
      result.recommendation || "",
      "",
      "## Keyword Gaps",
      ...(result.keywordGaps || []).map((k: string) => `- ${k}`),
      "",
      "## Tailored Bullets",
      ...(result.tailoredBullets || []).map((b: string) => `- ${b}`),
    ].join("\n");

    // Create report
    const report = await prisma.report.create({
      data: {
        num,
        slug: `${String(num).padStart(3, "0")}-${slug}-${date}`,
        content: reportContent,
      },
    });

    // Create application linked to report
    const jobUrl = input.startsWith("http") ? input : "";
    const app = await prisma.application.create({
      data: {
        num,
        company,
        role,
        score: result.score,
        status: result.score >= 3 ? "Evaluated" : "SKIP",
        notes: result.recommendation,
        url: jobUrl,
        h1bFriendly: result.h1bFriendly,
        reportId: report.id,
      },
    });

    // Mark any matching pipeline item as done
    if (jobUrl) {
      await prisma.pipelineItem.updateMany({
        where: { url: jobUrl, status: "pending" },
        data: { status: "done", processedAt: new Date() },
      });
    }

    return NextResponse.json(app);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const app = await prisma.application.update({ where: { id }, data });
    return NextResponse.json(app);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
