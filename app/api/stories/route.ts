import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const stories = await prisma.storyBank.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(stories);
}

export async function POST(req: NextRequest) {
  try {
    const { company, role, situation, task, action, result, reflection, tags } = await req.json();
    if (!situation?.trim() || !action?.trim()) {
      return NextResponse.json({ error: "Situation and action required" }, { status: 400 });
    }
    const story = await prisma.storyBank.create({
      data: {
        company: company || "",
        role: role || "",
        situation,
        task: task || "",
        action,
        result: result || "",
        reflection: reflection || "",
        tags: JSON.stringify(tags || []),
      },
    });
    return NextResponse.json(story);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.storyBank.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
