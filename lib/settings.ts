import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { LLMConfig } from "@/lib/ai";

export async function getLLMConfig(): Promise<{ config: LLMConfig; settings: Awaited<ReturnType<typeof prisma.settings.findFirst>> }> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    throw new Error("No settings configured. Go to Settings to set up your profile and API key.");
  }

  const apiKey = decrypt(settings.llmApiKey);

  if (!apiKey && settings.llmProvider !== "ollama") {
    throw new Error("No API key configured. Go to Settings to add your LLM API key.");
  }

  const config: LLMConfig = {
    provider: (settings.llmProvider as LLMConfig["provider"]) || "claude",
    model: settings.llmModel || "claude-sonnet-4-6",
    apiKey,
    baseUrl: settings.llmBaseUrl || undefined,
  };

  return { config, settings };
}
