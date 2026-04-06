import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.pipelineItem.findMany({
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const { url, notes } = await req.json();
    if (!url?.trim()) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const existing = await prisma.pipelineItem.findFirst({ where: { url } });
    if (existing) {
      return NextResponse.json({ error: "Already in queue" }, { status: 409 });
    }

    const item = await prisma.pipelineItem.create({
      data: { url, notes: notes || "" },
    });
    return NextResponse.json(item);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Failed to add to queue" }, { status: 500 });
  }
}
