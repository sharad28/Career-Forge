import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { scoreTier } from "@/lib/scoring";
import { fetchPageText, looksLikeUrl } from "@/lib/scrape";
import { EVAL_SYSTEM, buildEvalUserPrompt } from "@/lib/prompts/evaluate";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input?.trim()) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const { config, settings } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    // If the input is a URL, fetch the actual page content so the LLM
    // sees the real job description instead of guessing from training data.
    let jobContent = input;
    if (looksLikeUrl(input)) {
      try {
        const pageText = await fetchPageText(input);
        if (pageText.length > 200) {
          jobContent = `Source URL: ${input}\n\n${pageText}`;
        }
      } catch {
        // Non-fatal — fall back to passing the URL as-is
      }
    }

    const userPrompt = buildEvalUserPrompt({
      cvContent: cv?.content || "",
      targetRoles: settings?.targetRoles || "",
      salaryMin: settings?.salaryMin?.toLocaleString() || "?",
      salaryMax: settings?.salaryMax?.toLocaleString() || "?",
      h1bFilter: !!settings?.h1bFilter,
      jobInput: jobContent,
    });

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
    const recommendation_tier = scoreTier(result.score);
    return NextResponse.json({ ...result, recommendation_tier });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
