import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { RESEARCH_SYSTEM, buildResearchUserPrompt } from "@/lib/prompts/research";

export async function POST(req: NextRequest) {
  try {
    const { company, role, reportId } = await req.json();
    if (!company?.trim()) {
      return NextResponse.json({ error: "Company name required" }, { status: 400 });
    }

    const { config } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    let reportContext = "";
    if (reportId) {
      const report = await prisma.report.findUnique({ where: { id: reportId } });
      if (report) reportContext = report.content.slice(0, 600);
    }

    const userPrompt = buildResearchUserPrompt({
      company,
      role: role || "",
      cvSummary: cv?.content?.slice(0, 500) || "",
      reportContext,
    });

    const raw = await callLLM(config, [
      { role: "system", content: RESEARCH_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI returned unexpected format" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Research failed" },
      { status: 500 }
    );
  }
}
