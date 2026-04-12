import { prisma } from "@/lib/db";
import { callLLM, type LLMConfig } from "@/lib/ai";
import { scoreTier } from "@/lib/scoring";
import { EVAL_SYSTEM, buildEvalUserPrompt } from "@/lib/prompts/evaluate";

export interface EvalResult {
  company: string;
  role: string;
  score: number;
  summary: string;
  fitAnalysis: string;
  keywordGaps: string[];
  tailoredBullets: string[];
  h1bFriendly: boolean | null;
  recommendation: string;
  recommendation_tier: string;
}

export async function evaluateJob(
  input: string,
  cvContent: string,
  targetRoles: string,
  salaryMin: number,
  salaryMax: number,
  h1bFilter: boolean,
  config: LLMConfig
): Promise<EvalResult> {
  const userPrompt = buildEvalUserPrompt({
    cvContent,
    targetRoles,
    salaryMin: salaryMin?.toLocaleString() || "?",
    salaryMax: salaryMax?.toLocaleString() || "?",
    h1bFilter,
    jobInput: input,
  });

  const raw = await callLLM(config, [
    { role: "system", content: EVAL_SYSTEM },
    { role: "user", content: userPrompt },
  ]);

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned unexpected format");

  const result = JSON.parse(jsonMatch[0]);
  return { ...result, recommendation_tier: scoreTier(result.score) };
}

export async function saveEvaluationToTracker(input: string, result: EvalResult) {
  const company = result.company || "Unknown";
  const role = result.role || "Unknown Role";

  const lastApp = await prisma.application.findFirst({ orderBy: { num: "desc" } });
  const num = (lastApp?.num ?? 0) + 1;

  const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const date = new Date().toISOString().split("T")[0];

  const reportContent = [
    `# ${company} — ${role}`,
    "",
    `**Score:** ${result.score}/5`,
    `**Tier:** ${result.recommendation_tier}`,
    `**URL:** ${input.startsWith("http") ? input : "N/A"}`,
    `**H1B:** ${result.h1bFriendly === true ? "Yes" : result.h1bFriendly === false ? "No" : "Unknown"}`,
    "",
    "## Summary",
    result.summary || "",
    "",
    "## Fit Analysis",
    result.fitAnalysis || "",
    "",
    "## Recommendation",
    result.recommendation || "",
    "",
    "## Keyword Gaps",
    ...(result.keywordGaps || []).map((k: string) => `- ${k}`),
    "",
    "## Tailored Bullets",
    ...(result.tailoredBullets || []).map((b: string) => `- ${b}`),
  ].join("\n");

  const report = await prisma.report.create({
    data: {
      num,
      slug: `${String(num).padStart(3, "0")}-${slug}-${date}`,
      content: reportContent,
    },
  });

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
      reportId: report.id,
    },
  });

  return app;
}
