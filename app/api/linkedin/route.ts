import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM, LLMConfig } from "@/lib/ai";

const LINKEDIN_SYSTEM = `You are a LinkedIn optimization expert. Audit a LinkedIn profile and provide specific rewrites.

Return ONLY valid JSON in this exact shape:
{
  "headline": { "issue": "...", "rewrite": "..." },
  "about": { "issue": "...", "rewrite": "..." },
  "bullets": [{ "original": "...", "issue": "...", "rewrite": "..." }],
  "featured": "what to pin in featured section",
  "skills": ["missing skill 1", "missing skill 2"],
  "cta": "suggested call to action",
  "postIdeas": ["post idea 1", "post idea 2", "post idea 3"]
}

For bullets: flag max 3 weak bullets and rewrite them with [Action] + [What] + [Quantified Result].
For skills: list keywords missing for SEO and recruiter discoverability.`;

export async function POST(req: NextRequest) {
  try {
    const { profile, goal } = await req.json();
    if (!profile?.trim()) {
      return NextResponse.json({ error: "No profile content provided" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    if (!settings?.llmApiKey && settings?.llmProvider !== "ollama") {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    const config: LLMConfig = {
      provider: (settings?.llmProvider as LLMConfig["provider"]) || "claude",
      model: settings?.llmModel || "claude-sonnet-4-6",
      apiKey: settings?.llmApiKey || "",
      baseUrl: settings?.llmBaseUrl || undefined,
    };

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
