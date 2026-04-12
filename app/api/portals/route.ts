import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const portals = await prisma.portal.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(portals);
}

export async function POST(req: NextRequest) {
  try {
    const { name, company, url, h1bFriendly, keywords } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const portal = await prisma.portal.create({
      data: {
        name,
        company: company || name,
        url: url || "",
        h1bFriendly: h1bFriendly || false,
        keywords: JSON.stringify(keywords || []),
      },
    });
    return NextResponse.json(portal);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (data.keywords && Array.isArray(data.keywords)) {
      data.keywords = JSON.stringify(data.keywords);
    }
    const portal = await prisma.portal.update({ where: { id }, data });
    return NextResponse.json(portal);
  } catch (e: unknown) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.portal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
