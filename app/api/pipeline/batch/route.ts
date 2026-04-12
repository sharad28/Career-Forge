import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLLMConfig } from "@/lib/settings";
import { evaluateJob, saveEvaluationToTracker } from "@/lib/evaluate";

export const maxDuration = 300;

export async function POST() {
  try {
    const items = await prisma.pipelineItem.findMany({ where: { status: "pending" } });

    if (items.length === 0) {
      return NextResponse.json({ processed: 0, skipped: 0, results: [] });
    }

    const { config, settings } = await getLLMConfig();
    const cv = await prisma.cV.findFirst({ where: { isActive: true } });

    let processed = 0;
    let skipped = 0;
    const results: { url: string; status: string; company?: string; role?: string; score?: number }[] = [];

    for (const item of items) {
      try {
        const result = await evaluateJob(
          item.url,
          cv?.content || "",
          settings?.targetRoles || "",
          settings?.salaryMin || 0,
          settings?.salaryMax || 0,
          settings?.h1bFilter || false,
          config
        );

        await saveEvaluationToTracker(item.url, result);

        await prisma.pipelineItem.update({
          where: { id: item.id },
          data: { status: "done", processedAt: new Date() },
        });

        results.push({ url: item.url, status: "done", company: result.company, role: result.role, score: result.score });
        processed++;
      } catch (e) {
        console.error(`Batch: failed to process ${item.url}`, e);
        await prisma.pipelineItem.update({
          where: { id: item.id },
          data: { status: "error", processedAt: new Date() },
        });
        results.push({ url: item.url, status: "error" });
        skipped++;
      }
    }

    return NextResponse.json({ processed, skipped, results });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Batch failed" },
      { status: 500 }
    );
  }
}
