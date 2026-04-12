import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [pending, done, errors] = await Promise.all([
    prisma.pipelineItem.count({ where: { status: "pending" } }),
    prisma.pipelineItem.count({ where: { status: "done" } }),
    prisma.pipelineItem.count({ where: { status: "error" } }),
  ]);
  return NextResponse.json({ pending, done, errors });
}
