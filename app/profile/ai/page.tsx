"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../_lib/useSettings";

const PROVIDERS = [
  { value: "claude", label: "Claude (Anthropic)", models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-3-5-sonnet-20241022", "claude-haiku-4-5-20251001"] },
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { value: "gemini", label: "Gemini (Google)", models: ["gemini-2.0-flash", "gemini-1.5-pro"] },
  { value: "ollama", label: "Ollama (local/cloud)", models: [] },
];

export default function AIPage() {
  const { form, update, save, saving, saved, error, loaded } = useSettings();
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState("");

  const fetchOllamaModels = useCallback(async (baseUrl?: string) => {
    setOllamaLoading(true);
    setOllamaError("");
    try {
      const url = baseUrl || "http://localhost:11434";
      const res = await fetch(`/api/ollama-models?baseUrl=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) {
        setOllamaError(data.error);
        setOllamaModels([]);
      } else {
        const models = data.models || [];
        setOllamaModels(models);
        if (models.length > 0 && !models.includes(form.llmModel)) {
          update("llmModel", models[0]);
        }
      }
    } catch {
      setOllamaError("Failed to fetch models from Ollama");
      setOllamaModels([]);
    } finally {
      setOllamaLoading(false);
    }
  }, [form.llmModel, update]);

  useEffect(() => {
    if (loaded && form.llmProvider === "ollama") {
      fetchOllamaModels(form.llmBaseUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const provider = PROVIDERS.find((p) => p.value === form.llmProvider);

  function onSave() {
    save({
      llmProvider: form.llmProvider,
      llmModel: form.llmModel,
      llmApiKey: form.llmApiKey,
      llmBaseUrl: form.llmBaseUrl,
      searchApiKey: form.searchApiKey,
    });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold">AI Provider</h2>
        <p className="text-[#888] text-sm">Which LLM powers evaluation, audits, cover letters, and Ask. Keys are stored locally and only sent to the provider.</p>

        <div>
          <label>Provider</label>
          <select
            value={form.llmProvider}
            onChange={(e) => {
              const newProvider = e.target.value;
              const p = PROVIDERS.find((p) => p.value === newProvider);
              update("llmProvider", newProvider);
              update("llmModel", p?.models[0] || "");
              if (newProvider === "ollama") {
                fetchOllamaModels(form.llmBaseUrl);
              } else {
                setOllamaModels([]);
                setOllamaError("");
              }
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Model</label>
          {form.llmProvider === "ollama" ? (
            <>
              <div className="flex gap-2">
                <select
                  className="flex-1"
                  value={form.llmModel}
                  onChange={(e) => update("llmModel", e.target.value)}
                  disabled={ollamaLoading}
                >
                  {ollamaLoading && <option value="">Loading models…</option>}
                  {!ollamaLoading && ollamaModels.length === 0 && (
                    <option value="">No models found</option>
                  )}
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ghost text-xs px-3"
                  onClick={() => fetchOllamaModels(form.llmBaseUrl)}
                  disabled={ollamaLoading}
                >
                  {ollamaLoading ? "…" : "↻"}
                </button>
              </div>
              {ollamaError && (
                <p className="text-[#fca5a5] text-xs mt-1">{ollamaError}</p>
              )}
            </>
          ) : (
            <select value={form.llmModel} onChange={(e) => update("llmModel", e.target.value)}>
              {provider?.models
                .filter((m) => !form.computerUseEnabled || form.llmProvider !== "claude" || ["claude-sonnet-4-6", "claude-opus-4-6", "claude-3-5-sonnet-20241022"].includes(m))
                .map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
        {form.llmProvider !== "ollama" && (
          <div>
            <label>API Key</label>
            <input
              type="password"
              value={form.llmApiKey}
              onChange={(e) => update("llmApiKey", e.target.value)}
              placeholder="Your API key (stored locally)"
            />
          </div>
        )}
        {form.llmProvider === "ollama" && (
          <div>
            <label>Base URL</label>
            <div className="flex gap-2">
              <input
                className="flex-1"
                value={form.llmBaseUrl}
                onChange={(e) => update("llmBaseUrl", e.target.value)}
                placeholder="http://localhost:11434"
              />
              <button
                type="button"
                className="btn-ghost text-xs px-3"
                onClick={() => fetchOllamaModels(form.llmBaseUrl)}
                disabled={ollamaLoading}
              >
                {ollamaLoading ? "Checking…" : "Detect Models"}
              </button>
            </div>
            <p className="text-[#888] text-xs mt-1">Enter your Ollama URL then click Detect Models to populate the model list.</p>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Web Search</h2>
        <div>
          <label>
            Brave Search API Key <span className="text-[#888] text-xs">(optional — free tier: 2,000 queries/month)</span>
          </label>
          <input
            type="password"
            value={form.searchApiKey}
            onChange={(e) => update("searchApiKey", e.target.value)}
            placeholder="BSA... (leave blank to use DuckDuckGo fallback)"
          />
          <p className="text-[#888] text-xs mt-1">
            Used by <strong className="text-[#ededed]">Ask</strong> when &quot;Search web&quot; is enabled.
            Without a key, DuckDuckGo instant answers are used (free, no key, limited results).
            Get a free Brave Search key at api.search.brave.com.
          </p>
        </div>
      </div>

      {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

      <button className="btn-primary w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
