import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM, LLMConfig } from "@/lib/ai";

export async function GET() {
  const cv = await prisma.cV.findFirst({ where: { isActive: true } });
  return NextResponse.json({ content: cv?.content || "" });
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    // Deactivate old versions
    await prisma.cV.updateMany({ where: { isActive: true }, data: { isActive: false } });

    const last = await prisma.cV.findFirst({ orderBy: { version: "desc" } });
    const cv = await prisma.cV.create({
      data: { content, version: (last?.version ?? 0) + 1, isActive: true },
    });

    return NextResponse.json(cv);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}

// ATS audit endpoint
export async function PUT(req: NextRequest) {
  try {
    const { content } = await req.json();
    const settings = await prisma.settings.findFirst();

    if (!settings?.llmApiKey && settings?.llmProvider !== "ollama") {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    const config: LLMConfig = {
      provider: (settings?.llmProvider as LLMConfig["provider"]) || "claude",
      model: settings?.llmModel || "claude-sonnet-4-6",
      apiKey: settings?.llmApiKey || "",
      baseUrl: settings?.llmBaseUrl || undefined,
    };

    const raw = await callLLM(config, [
      {
        role: "system",
        content: `You are an ATS expert. Audit a CV for ATS compatibility and quality. Return JSON only:
{
  "atsScore": <0-100>,
  "issues": [{"type": "error"|"warning", "message": "..."}],
  "bulletsWithoutMetrics": ["bullet text..."],
  "suggestions": ["suggestion..."]
}`,
      },
      {
        role: "user",
        content: `Audit this CV for ATS compatibility:\n\n${content}`,
      },
    ]);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (e: unknown) {
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
