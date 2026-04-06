import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await prisma.settings.findFirst();
  // Never expose the API key in full
  if (s) {
    return NextResponse.json({
      ...s,
      llmApiKey: s.llmApiKey ? "••••••••" + s.llmApiKey.slice(-4) : "",
    });
  }
  return NextResponse.json(null);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Don't overwrite key if masked value sent
    if (body.llmApiKey?.startsWith("••••")) {
      delete body.llmApiKey;
    }

    const existing = await prisma.settings.findFirst();
    let settings;

    if (existing) {
      settings = await prisma.settings.update({ where: { id: 1 }, data: body });
    } else {
      settings = await prisma.settings.create({ data: { id: 1, ...body } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
