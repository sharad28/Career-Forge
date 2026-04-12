"use client";

import { useEffect, useState, useCallback } from "react";

const PROVIDERS = [
  { value: "claude", label: "Claude (Anthropic)", models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-3-5-sonnet-20241022", "claude-haiku-4-5-20251001"] },
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { value: "gemini", label: "Gemini (Google)", models: ["gemini-2.0-flash", "gemini-1.5-pro"] },
  { value: "ollama", label: "Ollama (local/cloud)", models: [] },
];

const STATUSES = ["Evaluated", "Applied", "Responded", "Interview", "Offer", "Rejected", "Discarded", "SKIP"];

export default function SettingsPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", location: "", timezone: "",
    targetRoles: "", salaryMin: "", salaryMax: "",
    h1bFilter: false,
    llmProvider: "claude", llmModel: "claude-sonnet-4-6",
    llmApiKey: "", llmBaseUrl: "",
    onboardingDone: false,
    autoApplyMethod: "auto",
    computerUseEnabled: false,
    linkedinUrl: "",
    portfolioUrl: "",
    searchApiKey: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
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
        // Auto-select the first model if current selection isn't in the list
        if (models.length > 0) {
          setForm((prev) => {
            if (!models.includes(prev.llmModel)) {
              return { ...prev, llmModel: models[0] };
            }
            return prev;
          });
        }
      }
    } catch {
      setOllamaError("Failed to fetch models from Ollama");
      setOllamaModels([]);
    } finally {
      setOllamaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      if (data) {
        const loadedForm = {
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          timezone: data.timezone || "",
          targetRoles: (() => {
            try {
              const parsed = JSON.parse(data.targetRoles || "[]");
              return Array.isArray(parsed) ? parsed.join(", ") : (data.targetRoles || "");
            } catch {
              return data.targetRoles || "";
            }
          })(),
          salaryMin: data.salaryMin?.toString() || "",
          salaryMax: data.salaryMax?.toString() || "",
          h1bFilter: data.h1bFilter || false,
          llmProvider: data.llmProvider || "claude",
          llmModel: data.llmModel || "claude-sonnet-4-6",
          llmApiKey: data.llmApiKey || "",
          llmBaseUrl: data.llmBaseUrl || "",
          searchApiKey: data.searchApiKey || "",
          onboardingDone: data.onboardingDone || false,
          autoApplyMethod: data.autoApplyMethod || "auto",
          computerUseEnabled: data.computerUseEnabled || false,
          linkedinUrl: data.linkedinUrl || "",
          portfolioUrl: data.portfolioUrl || "",
        };
        setForm(loadedForm);
        if (loadedForm.llmProvider === "ollama") {
          fetchOllamaModels(loadedForm.llmBaseUrl);
        }
      }
    });
  }, [fetchOllamaModels]);

  const provider = PROVIDERS.find((p) => p.value === form.llmProvider);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryMin: parseInt(form.salaryMin) || 0,
          salaryMax: parseInt(form.salaryMax) || 0,
          targetRoles: JSON.stringify(
            form.targetRoles.split(",").map((r) => r.trim()).filter(Boolean)
          ),
          onboardingDone: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[#888] text-sm mt-1">Configure your profile, LLM provider, and preferences</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Full Name</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" />
          </div>
          <div>
            <label>Timezone</label>
            <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="America/New_York" />
          </div>
          <div>
            <label>LinkedIn URL</label>
            <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div>
          <label>Portfolio URL</label>
          <input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="https://your-portfolio.com" />
        </div>
        <div>
          <label>Target Roles (comma-separated)</label>
          <input
            value={form.targetRoles}
            onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
            placeholder="Senior Data Scientist, ML Engineer, AI Platform Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Salary Min ($)</label>
            <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="175000" />
          </div>
          <div>
            <label>Salary Max ($)</label>
            <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="250000" />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.h1bFilter}
            onChange={(e) => setForm({ ...form, h1bFilter: e.target.checked })}
            className="w-4 h-4 accent-[#6366f1]"
            style={{ width: "1rem", height: "1rem" }}
          />
          <span className="text-sm text-[#ededed]">Require H1B sponsorship — auto-skip roles that say &quot;no sponsorship&quot;</span>
        </label>
      </div>

      {/* LLM */}
      <div className="card space-y-4">
        <h2 className="font-semibold">AI Provider</h2>
        <div>
          <label>Provider</label>
          <select
            value={form.llmProvider}
            onChange={(e) => {
              const newProvider = e.target.value;
              const p = PROVIDERS.find((p) => p.value === newProvider);
              setForm({ ...form, llmProvider: newProvider, llmModel: p?.models[0] || "" });
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
                  onChange={(e) => setForm({ ...form, llmModel: e.target.value })}
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
            <select value={form.llmModel} onChange={(e) => setForm({ ...form, llmModel: e.target.value })}>
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
              onChange={(e) => setForm({ ...form, llmApiKey: e.target.value })}
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
                onChange={(e) => setForm({ ...form, llmBaseUrl: e.target.value })}
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
        <p className="text-[#888] text-xs">API keys are stored locally in your SQLite database and never sent anywhere except the LLM provider.</p>
      </div>

      {/* Web Search */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Web Search</h2>
        <div>
          <label>
            Brave Search API Key <span className="text-[#888] text-xs">(optional — free tier: 2,000 queries/month)</span>
          </label>
          <input
            type="password"
            value={form.searchApiKey}
            onChange={(e) => setForm({ ...form, searchApiKey: e.target.value })}
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

      {/* Auto Apply Preferences */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Auto Apply Preferences</h2>
        <div>
          <label>Default Apply Method</label>
          <select
            value={form.autoApplyMethod}
            onChange={(e) => setForm({ ...form, autoApplyMethod: e.target.value })}
          >
            <option value="computer-use">Claude Computer Use (⚠️ experimental / WIP)</option>
            <option value="manual">Manual Copy &amp; Paste (✅ stable / recommended)</option>
          </select>
          <p className="text-[#888] text-xs mt-1">Computer Use opens a browser and fills the form for you (~$0.10/application). Manual generates the package and you paste it yourself.</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.computerUseEnabled}
            onChange={(e) => setForm({ ...form, computerUseEnabled: e.target.checked })}
            className="w-4 h-4 accent-[#6366f1]"
            style={{ width: "1rem", height: "1rem" }}
          />
          <span className="text-sm text-[#ededed]">Enable Claude Computer Use (~$0.10/application API cost) [WIP]</span>
        </label>
        {form.computerUseEnabled && form.llmProvider !== "claude" && (
          <p className="text-[#fde68a] text-xs">⚠️ Computer Use requires a Claude API key. Switch your provider to Claude or it won&apos;t be available.</p>
        )}
        <p className="text-[#888] text-xs">
          🟡 Computer Use costs ~$0.10/app and works on any job site — Claude fills the form in a real browser.
          ⚪ Manual is free — AI generates your cover letter and Q&amp;A, you paste it yourself.
        </p>
      </div>

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
