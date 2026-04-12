import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { CATEGORY_PROMPTS, POSTS_SYSTEM } from "@/lib/prompts/linkedin";

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();

    const { config } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.lesson;

    const raw = await callLLM(config, [
      {
        role: "system",
        content: POSTS_SYSTEM,
      },
      {
        role: "user",
        content: `${categoryPrompt}\n\nBase them on this person's background:\n${cv?.content?.slice(0, 1000) || "Senior AI/ML Engineer with experience in RAG systems, agentic AI, and data pipelines."}\n\nReturn JSON only.`,
      },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Invalid response" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
