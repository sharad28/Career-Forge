import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCVPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });
    const settings = await prisma.settings.findFirst();

    if (!cv?.content) {
      return NextResponse.json({ error: "No CV found. Add your CV in the CV Editor first." }, { status: 404 });
    }

    const candidateName = settings?.fullName || "Candidate";
    const pdfBuffer = await generateCVPdf(cv.content, candidateName);

    const slug = candidateName.toLowerCase().replace(/\s+/g, "-");
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cv-${slug}-${date}.pdf"`,
      },
    });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
