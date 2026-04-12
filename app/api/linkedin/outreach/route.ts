import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { OUTREACH_SYSTEM } from "@/lib/prompts/linkedin";

export async function POST(req: NextRequest) {
  try {
    const { reportId, company, role, jd } = await req.json();

    const { config, settings } = await getLLMConfig();

    let companyName = company || "this company";
    let roleName = role || "this role";
    let context = jd || "";

    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { applications: { take: 1 } },
      });
      if (report) {
        const app = report.applications[0];
        if (app) {
          companyName = app.company;
          roleName = app.role;
        }
        context = report.content;
      }
    }

    const cv = await prisma.cV.findFirst({ where: { isActive: true } });
    const cvSummary = cv?.content?.slice(0, 500) || "Experienced professional";

    const userPrompt = `
Company: ${companyName}
Role: ${roleName}
Candidate CV summary: ${cvSummary}
Report/JD context:
${context.slice(0, 1000)}

Generate 3 LinkedIn outreach messages. Each must be under 300 characters.`;

    const raw = await callLLM(config, [
      { role: "system", content: OUTREACH_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI returned unexpected format" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Outreach generation failed" },
      { status: 500 }
    );
  }
}
