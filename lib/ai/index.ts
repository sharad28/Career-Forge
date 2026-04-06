export type LLMProvider = "claude" | "openai" | "gemini" | "ollama";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<string> {
  switch (config.provider) {
    case "claude":
      return callClaude(config, messages);
    case "openai":
      return callOpenAI(config, messages);
    case "gemini":
      return callGemini(config, messages);
    case "ollama":
      return callOllama(config, messages);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

async function callClaude(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemMsg?.content,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAI(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");

  const contents = userMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const model = config.model || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOllama(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const base = config.baseUrl || "http://localhost:11434";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: config.model || "llama3",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
  const data = await res.json();
  return data.message.content;
}
