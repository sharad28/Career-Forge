import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const applications = await prisma.application.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  try {
    const { input, result } = await req.json();

    // Extract company/role from summary or use defaults
    const company = result.summary?.split(" at ")?.[1]?.split(" ")?.[0] || "Unknown";
    const role = result.summary?.split(" at ")?.[0]?.replace("Strong fit for ", "")
      ?.replace("Moderate fit for ", "")
      ?.replace("Weak fit for ", "") || "Unknown Role";

    const lastApp = await prisma.application.findFirst({ orderBy: { num: "desc" } });
    const num = (lastApp?.num ?? 0) + 1;

    const app = await prisma.application.create({
      data: {
        num,
        company,
        role,
        score: result.score,
        status: result.score >= 3 ? "Evaluated" : "SKIP",
        notes: result.recommendation,
        url: input.startsWith("http") ? input : "",
        h1bFriendly: result.h1bFriendly,
      },
    });

    return NextResponse.json(app);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const app = await prisma.application.update({ where: { id }, data });
    return NextResponse.json(app);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
