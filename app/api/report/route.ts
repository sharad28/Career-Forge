import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: { applications: true },
    });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(report);
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { applications: { select: { company: true, role: true, score: true } } },
  });
  return NextResponse.json(reports);
}
