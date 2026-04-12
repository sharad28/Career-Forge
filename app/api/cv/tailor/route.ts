import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { TAILOR_SYSTEM } from "@/lib/prompts/cv";

export async function POST(req: NextRequest) {
  try {
    const { bullets, company, role } = await req.json();

    if (!bullets?.length) {
      return NextResponse.json(
        { error: "No bullets selected" },
        { status: 400 }
      );
    }

    const { config } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    if (!cv?.content) {
      return NextResponse.json(
        { error: "No active CV found. Please add your CV first." },
        { status: 400 }
      );
    }

    const userPrompt = `## Current CV (Markdown)
${cv.content}

## Target Job
Company: ${company || "Unknown"}
Role: ${role || "Unknown"}

## Tailored Bullets to Apply
${bullets.map((b: string, i: number) => `${i + 1}. ${b}`).join("\n")}

Replace the weakest matching bullets in the CV with these tailored versions. Return the COMPLETE updated CV markdown.`;

    const updatedContent = await callLLM(config, [
      { role: "system", content: TAILOR_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    // Clean up potential markdown code fences the LLM might add
    let cleaned = updatedContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
    }

    // Save as new CV version atomically
    const last = await prisma.cV.findFirst({ orderBy: { version: "desc" } });
    const newCv = await prisma.$transaction(async (tx) => {
      await tx.cV.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.cV.create({
        data: {
          content: cleaned,
          version: (last?.version ?? 0) + 1,
          isActive: true,
        },
      });
    });

    return NextResponse.json({
      content: cleaned,
      version: newCv.version,
      company,
      role,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to tailor CV";
    console.error("CV Tailor error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
