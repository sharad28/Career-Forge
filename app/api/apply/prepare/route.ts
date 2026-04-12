import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { detectATS, getAdapter, hasAdapter } from "@/lib/ats";
import { fetchPageText } from "@/lib/scrape";
import { COVER_LETTER_PROMPT, SCREENING_QA_PROMPT } from "@/lib/prompts/apply";

export const maxDuration = 120; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { report: true, package: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Get user data
    const { config, settings } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    if (!cv?.content) {
      return NextResponse.json({ error: "No active CV found. Go to CV Editor to add your CV." }, { status: 400 });
    }

    // Detect ATS type from URL pattern
    const detection = detectATS(application.url, settings?.computerUseEnabled ?? false);
    let jobDescription = application.report?.content || "";

    // 1. Try fetching the live job page via Jina reader (works for any URL)
    if (application.url?.startsWith("http")) {
      try {
        const pageText = await fetchPageText(application.url);
        if (pageText.length > 300) {
          jobDescription = pageText;
        }
      } catch {
        // Fall through to ATS API fallback
      }
    }

    // 2. If we have an ATS adapter, try fetching the live job description as fallback
    if (detection.atsType && detection.jobId && hasAdapter(detection.atsType)) {
      try {
        const adapter = getAdapter(detection.atsType);
        const job = await adapter.fetchJob(detection.boardToken, detection.jobId);
        if (jobDescription.length < 300 && job.description) {
          jobDescription = `# ${job.title} at ${job.company}\n${job.location}\n\n${job.description}`;
        }
      } catch {
        // Job may be expired or private — non-fatal
      }
    }

    // Generate cover letter and screening Q&A in parallel
    const [coverLetterRaw, qaRaw] = await Promise.all([
      callLLM(config, [
        { role: "system", content: COVER_LETTER_PROMPT },
        {
          role: "user",
          content: `## Candidate CV\n${cv.content}\n\n## Job Description\n${jobDescription}\n\n## Company: ${application.company}\n## Role: ${application.role}\n\nWrite a tailored cover letter.`,
        },
      ]),
      callLLM(config, [
        { role: "system", content: SCREENING_QA_PROMPT },
        {
          role: "user",
          content: `## Candidate CV\n${cv.content}\n\n## Candidate Info\nName: ${settings?.fullName || ""}\nLocation: ${settings?.location || ""}\nH1B needed: ${settings?.h1bFilter ? "Yes" : "No"}\nSalary range: $${settings?.salaryMin?.toLocaleString() || "?"} – $${settings?.salaryMax?.toLocaleString() || "?"}\n\n## Job Description\n${jobDescription}\n\nGenerate screening Q&A JSON.`,
        },
      ]),
    ]);

    // Parse Q&A
    let screeningQA: Array<{ question: string; answer: string }> = [];
    try {
      const jsonMatch = qaRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        screeningQA = JSON.parse(jsonMatch[0]);
      }
    } catch {
      screeningQA = [{ question: "Error parsing", answer: qaRaw }];
    }

    // Determine recommended method — API only if preflight confirmed the job is live
    const recommended = detection.availableMethods.find((m) => m.recommended && m.available);
    const method = recommended?.method || "manual";

    // Create or update package
    const packageData = {
      method,
      atsType: detection.atsType || "",
      atsJobId: detection.jobId,
      atsBoardToken: detection.boardToken,
      coverLetter: coverLetterRaw.trim(),
      screeningQA: JSON.stringify(screeningQA),
      status: "ready",
    };

    const pkg = await prisma.applicationPackage.upsert({
      where: { applicationId },
      update: packageData,
      create: { ...packageData, applicationId },
    });

    return NextResponse.json({
      package: pkg,
      coverLetter: coverLetterRaw.trim(),
      screeningQA,
      detection,
    });
  } catch (e: unknown) {
    console.error("Prepare error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Package preparation failed" },
      { status: 500 }
    );
  }
}
