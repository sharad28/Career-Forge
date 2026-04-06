import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM, LLMConfig } from "@/lib/ai";

const CATEGORY_PROMPTS: Record<string, string> = {
  lesson: "Write 3 LinkedIn posts about a career lesson learned. Make them personal, specific, and valuable. No fluff.",
  insight: "Write 3 LinkedIn posts sharing an industry insight about AI/ML hiring or the job market. Data-driven and opinionated.",
  tool: "Write 3 LinkedIn posts about an AI tool or workflow that improved your work. Specific and practical.",
  hotTake: "Write 3 contrarian LinkedIn posts about job searching, AI, or careers. Provocative but defensible.",
  intro: "Write 3 LinkedIn reintroduction posts. First-person, authentic, builds curiosity.",
};

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();

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

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.lesson;

    const raw = await callLLM(config, [
      {
        role: "system",
        content: `You are a LinkedIn content strategist. Write posts that sound human, not AI-generated. Short paragraphs. No hashtag spam. Max 3 hashtags per post. Return JSON: { "posts": ["post1", "post2", "post3"] }`,
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
