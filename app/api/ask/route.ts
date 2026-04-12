import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callLLM } from "@/lib/ai";
import { getLLMConfig } from "@/lib/settings";
import { webSearch, formatSearchResults } from "@/lib/search";
import { decrypt } from "@/lib/crypto";
import { ASK_SYSTEM } from "@/lib/prompts/ask";

export async function POST(req: NextRequest) {
  try {
    const { question, company, role, jobDescription, useSearch } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const { config } = await getLLMConfig();
    const [cv, settings] = await Promise.all([
      prisma.cV.findFirst({ where: { isActive: true } }),
      prisma.settings.findFirst(),
    ]);

    // Build search query from the question + job context
    let searchContext = "";
    if (useSearch) {
      const searchQuery = [company, role, question].filter(Boolean).join(" ").slice(0, 200);
      try {
        const searchApiKey = settings?.searchApiKey ? decrypt(settings.searchApiKey) : undefined;
      const results = await webSearch(searchQuery, searchApiKey);
        searchContext = formatSearchResults(results);
      } catch (e) {
        console.error("Web search failed:", e);
        // Non-fatal — proceed without search results
      }
    }

    const jobContext = [
      company ? `Company: ${company}` : null,
      role ? `Role: ${role}` : null,
      jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 3000)}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const userPrompt = [
      jobContext ? `## Job Context\n${jobContext}` : null,
      searchContext || null,
      `## Candidate CV\n${cv?.content?.slice(0, 2000) || "Not available"}`,
      `## Question\n${question}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const answer = await callLLM(config, [
      { role: "system", content: ASK_SYSTEM },
      { role: "user", content: userPrompt },
    ]);

    return NextResponse.json({ answer, searchUsed: useSearch && !!searchContext });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to answer question" },
      { status: 500 }
    );
  }
}
