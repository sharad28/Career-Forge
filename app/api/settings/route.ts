import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await prisma.settings.findFirst();
  if (s) {
    const realLlmKey = decrypt(s.llmApiKey);
    const realSearchKey = decrypt(s.searchApiKey);
    return NextResponse.json({
      ...s,
      llmApiKey: realLlmKey ? "••••••••" + realLlmKey.slice(-4) : "",
      searchApiKey: realSearchKey ? "••••••••" + realSearchKey.slice(-4) : "",
    });
  }
  return NextResponse.json(null);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Don't overwrite keys if masked value sent
    if (body.llmApiKey?.startsWith("••••")) {
      delete body.llmApiKey;
    } else if (body.llmApiKey) {
      body.llmApiKey = encrypt(body.llmApiKey);
    }

    if (body.searchApiKey?.startsWith("••••")) {
      delete body.searchApiKey;
    } else if (body.searchApiKey) {
      body.searchApiKey = encrypt(body.searchApiKey);
    }

    // Remove fields Prisma manages automatically
    delete body.id;
    delete body.updatedAt;

    const existing = await prisma.settings.findFirst();

    if (existing) {
      await prisma.settings.update({ where: { id: existing.id }, data: body });
    } else {
      await prisma.settings.create({ data: { id: 1, ...body } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[settings POST]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
