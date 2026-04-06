import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM, LLMConfig } from "@/lib/ai";

const EVAL_SYSTEM = `You are a senior career advisor and ATS expert. You evaluate job descriptions against a candidate's CV and profile.

Your output MUST be valid JSON in this exact shape:
{
  "score": <number 1-5 with one decimal>,
  "summary": "<one sentence>",
  "fitAnalysis": "<3-5 sentences on fit, gaps, strengths>",
  "keywordGaps": ["keyword1", "keyword2"],
  "tailoredBullets": ["bullet1", "bullet2", "bullet3"],
  "h1bFriendly": <true | false | null>,
  "recommendation": "<one clear action: apply, skip, or apply with changes>"
}

Scoring rubric:
5.0 = perfect fit, all requirements met, great culture match
4.0-4.9 = strong fit, minor gaps
3.0-3.9 = moderate fit, some significant gaps
2.0-2.9 = weak fit, major gaps
1.0-1.9 = poor fit, do not apply

For h1bFriendly:
- true = JD explicitly says will sponsor, or large company known to sponsor
- false = JD says "no sponsorship", "must be authorized", "US citizen/PR only"
- null = not mentioned

Tailored bullets: rewrite 3 of the candidate's existing bullets to better match the JD's keywords and language. Do NOT invent experience.

Keyword gaps: list keywords from the JD that are missing from the CV but relevant. Max 8.`;

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input?.trim()) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    if (!settings?.llmApiKey && settings?.llmProvider !== "ollama") {
      return NextResponse.json(
        { error: "No API key configured. Go to Settings to add your LLM API key." },
        { status: 400 }
      );
    }

    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    const config: LLMConfig = {
      provider: (settings?.llmProvider as LLMConfig["provider"]) || "claude",
      model: settings?.llmModel || "claude-sonnet-4-6",
      apiKey: settings?.llmApiKey || "",
      baseUrl: settings?.llmBaseUrl || undefined,
    };

    const userPrompt = `
## Candidate CV
${cv?.content || "No CV on file."}

## Target Role / Profile
${settings?.targetRoles || "Not specified"}
Salary target: $${settings?.salaryMin?.toLocaleString() || "?"} – $${settings?.salaryMax?.toLocaleString() || "?"}
H1B sponsorship required: ${settings?.h1bFilter ? "YES" : "unknown"}

## Job Input
${input}

Evaluate this job against the candidate's profile and CV. Return JSON only.`;

    const raw = await callLLM(config, [
      { role: "system", content: EVAL_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI returned unexpected format" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
