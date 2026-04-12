import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { COMPARE_SYSTEM, DIMENSION_META, buildCompareUserPrompt } from "@/lib/prompts/compare";

export { DIMENSION_META };

export async function POST(req: NextRequest) {
  try {
    const { reportIds } = await req.json();
    if (!Array.isArray(reportIds) || reportIds.length < 2 || reportIds.length > 5) {
      return NextResponse.json({ error: "Select 2-5 reports to compare" }, { status: 400 });
    }

    const { config } = await getLLMConfig();

    const reports = await prisma.report.findMany({
      where: { id: { in: reportIds } },
      include: { applications: { take: 1 } },
    });

    if (reports.length < 2) {
      return NextResponse.json({ error: "Could not find enough reports" }, { status: 404 });
    }

    const offersContext = reports.map((r, i) => {
      const app = r.applications[0];
      return `--- Offer ${i + 1}: ${app?.company || "Unknown"} — ${app?.role || "Unknown"} ---\nScore: ${app?.score ?? "N/A"}/5\n${r.content.slice(0, 800)}`;
    }).join("\n\n");

    const userPrompt = buildCompareUserPrompt(offersContext, reports.length);

    const raw = await callLLM(config, [
      { role: "system", content: COMPARE_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI returned unexpected format" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...result, dimensionMeta: DIMENSION_META });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Comparison failed" },
      { status: 500 }
    );
  }
}
