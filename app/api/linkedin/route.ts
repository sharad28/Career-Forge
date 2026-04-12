import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { LINKEDIN_SYSTEM } from "@/lib/prompts/linkedin";

export async function POST(req: NextRequest) {
  try {
    const { profile, goal } = await req.json();
    if (!profile?.trim()) {
      return NextResponse.json({ error: "No profile content provided" }, { status: 400 });
    }

    const { config, settings } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    const prompt = `
## User Goal
${goal || settings?.targetRoles || "Land a senior AI/ML engineering role"}

## Candidate CV (source of truth for experience)
${cv?.content || "Not provided"}

## LinkedIn Profile to Audit
${profile}

Audit this LinkedIn profile across all 7 dimensions. Cross-reference with the CV to identify experience that should be added or better highlighted. Return JSON only.`;

    const raw = await callLLM(config, [
      { role: "system", content: LINKEDIN_SYSTEM },
      { role: "user", content: prompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
