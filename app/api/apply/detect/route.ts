import { NextRequest, NextResponse } from "next/server";
import { detectATS } from "@/lib/ats";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    const computerUseEnabled = settings?.computerUseEnabled ?? false;

    const detection = detectATS(url, computerUseEnabled);

    return NextResponse.json(detection);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Detection failed" },
      { status: 500 }
    );
  }
}
