import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { TRAINING_SYSTEM, buildTrainingUserPrompt } from "@/lib/prompts/training";

export async function POST(req: NextRequest) {
  try {
    const { name, url, description } = await req.json();
    if (!name?.trim() && !description?.trim()) {
      return NextResponse.json({ error: "Course name or description required" }, { status: 400 });
    }

    const { config, settings } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    const userPrompt = buildTrainingUserPrompt({
      targetRoles: settings?.targetRoles || "",
      cvSummary: cv?.content?.slice(0, 400) || "",
      name: name || "",
      url: url || "",
      description: description || "",
    });

    const raw = await callLLM(config, [
      { role: "system", content: TRAINING_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI returned unexpected format" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Training evaluation failed" },
      { status: 500 }
    );
  }
}
