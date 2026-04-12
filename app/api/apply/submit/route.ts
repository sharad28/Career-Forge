import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { generateCVPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 120; // computer-use can take up to 2 minutes

export async function POST(req: NextRequest) {
  try {
    const { packageId, method: overrideMethod } = await req.json();
    if (!packageId) {
      return NextResponse.json({ error: "packageId required" }, { status: 400 });
    }

    const pkg = await prisma.applicationPackage.findUnique({
      where: { id: packageId },
      include: { application: true },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const method = overrideMethod || pkg.method;
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    // Parse name
    const nameParts = (settings.fullName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Parse screening answers
    const answers: Record<string, string> = {};
    try {
      const qa = JSON.parse(pkg.screeningQA || "[]");
      for (const item of qa) {
        if (item.question && item.answer) {
          answers[item.question] = item.answer;
        }
      }
    } catch {
      // ignore parse errors
    }

    // Get active CV content
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    // Generate a real PDF for the resume — critical for ATS acceptance
    let resumePdfBuffer: Uint8Array | undefined;
    if (cv?.content && settings.fullName) {
      try {
        resumePdfBuffer = await generateCVPdf(cv.content, settings.fullName);
      } catch (pdfErr) {
        console.warn("PDF generation failed, will send text fallback:", pdfErr);
      }
    }

    // ─── Tier 1: Computer Use ────────────────────────────────────────────────
    if (method === "computer-use") {
      const apiKey = decrypt(settings.llmApiKey);

      // Computer Use only works with Claude (Anthropic API)
      if (!apiKey || settings.llmProvider !== "claude") {
        return NextResponse.json(
          { error: "Computer Use requires a Claude (Anthropic) API key. Set it in Settings." },
          { status: 400 }
        );
      }

      if (!pkg.application.url) {
        return NextResponse.json(
          { error: "No job URL stored for this application. Cannot launch Computer Use." },
          { status: 400 }
        );
      }

      const { ComputerUseAgent } = await import("@/lib/computer-use/agent");
      const agent = new ComputerUseAgent(apiKey, settings.llmModel);

      const steps: { step: number; action: string; screenshot: string }[] = [];

      const agentResult = await agent.fillApplicationForm(
        pkg.application.url,
        {
          name: settings.fullName || `${firstName} ${lastName}`.trim(),
          email: settings.email || "",
          phone: settings.phone || "",
          coverLetter: pkg.coverLetter || "",
          linkedinUrl: settings.linkedinUrl || undefined,
          portfolioUrl: settings.portfolioUrl || undefined,
          answers: JSON.parse(pkg.screeningQA || "[]"),
        },
        (step, action, screenshot) => {
          steps.push({ step, action, screenshot });
        }
      );

      // Update package status based on result
      const succeeded = agentResult.status === "ready_to_submit" || agentResult.status === "submitted";
      await prisma.applicationPackage.update({
        where: { id: packageId },
        data: {
          status: succeeded ? "submitted" : "failed",
          submittedAt: succeeded ? new Date() : null,
          errorMessage: succeeded ? "" : agentResult.message,
          method: "computer-use",
        },
      });

      if (succeeded) {
        await prisma.application.update({
          where: { id: pkg.applicationId },
          data: { status: "Applied" },
        });
      }

      return NextResponse.json({
        success: agentResult.success,
        status: agentResult.status,
        message: agentResult.message,
        screenshot: agentResult.screenshot, // base64 PNG of final state
        steps: steps.slice(-5), // last 5 steps to avoid huge response
        totalSteps: agentResult.steps,
      });
    }

    // ─── Tier 3: Manual ───────────────────────────────────────────────────────
    await prisma.applicationPackage.update({
      where: { id: packageId },
      data: { method: "manual", status: "ready" },
    });

    return NextResponse.json({
      success: true,
      method: "manual",
      message: "Package ready. Copy your cover letter and open the job page to apply manually.",
    });
  } catch (e: unknown) {
    console.error("Submit error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Submission failed" },
      { status: 500 }
    );
  }
}
