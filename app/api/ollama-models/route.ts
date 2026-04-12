import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl =
    req.nextUrl.searchParams.get("baseUrl") || "http://localhost:11434";

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${res.status}`, models: [] },
        { status: 502 }
      );
    }

    const data = await res.json();
    const models: string[] = (data.models || []).map(
      (m: { name: string }) => m.name
    );

    return NextResponse.json({ models });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Cannot reach Ollama instance";
    return NextResponse.json({ error: message, models: [] }, { status: 502 });
  }
}
