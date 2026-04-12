import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { ATS_AUDIT_SYSTEM } from "@/lib/prompts/cv";

export async function GET() {
  const cv = await prisma.cV.findFirst({ where: { isActive: true } });
  return NextResponse.json({ content: cv?.content || "" });
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    const last = await prisma.cV.findFirst({ orderBy: { version: "desc" } });
    const cv = await prisma.$transaction(async (tx) => {
      await tx.cV.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.cV.create({
        data: { content, version: (last?.version ?? 0) + 1, isActive: true },
      });
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
    const { config } = await getLLMConfig();

    const raw = await callLLM(config, [
      {
        role: "system",
        content: ATS_AUDIT_SYSTEM,
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
    const message = e instanceof Error ? e.message : "Audit failed";
    console.error("ATS Audit error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
