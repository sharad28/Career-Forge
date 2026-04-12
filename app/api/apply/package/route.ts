import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const pkg = await prisma.applicationPackage.findUnique({
      where: { applicationId: parseInt(id) },
      include: { application: { include: { report: true } } },
    });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(pkg);
  }

  // Return all packages with their applications
  const packages = await prisma.applicationPackage.findMany({
    include: { application: true },
    orderBy: { generatedAt: "desc" },
  });
  return NextResponse.json(packages);
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowed: Record<string, unknown> = {};
    if (data.coverLetter !== undefined) allowed.coverLetter = data.coverLetter;
    if (data.screeningQA !== undefined) allowed.screeningQA = typeof data.screeningQA === "string" ? data.screeningQA : JSON.stringify(data.screeningQA);
    if (data.method !== undefined) allowed.method = data.method;
    if (data.status !== undefined) allowed.status = data.status;

    const pkg = await prisma.applicationPackage.update({
      where: { id },
      data: allowed,
    });

    // If marking as submitted manually, update application status too
    if (data.status === "submitted") {
      await prisma.applicationPackage.update({
        where: { id },
        data: { submittedAt: new Date() },
      });
      await prisma.application.update({
        where: { id: pkg.applicationId },
        data: { status: "Applied" },
      });
    }

    return NextResponse.json(pkg);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
