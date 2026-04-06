"use client";

import { useEffect, useState } from "react";

const PROVIDERS = [
  { value: "claude", label: "Claude (Anthropic)", models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"] },
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { value: "gemini", label: "Gemini (Google)", models: ["gemini-2.0-flash", "gemini-1.5-pro"] },
  { value: "ollama", label: "Ollama (local)", models: ["llama3", "mistral", "codellama"] },
];

const STATUSES = ["Evaluated", "Applied", "Responded", "Interview", "Offer", "Rejected", "Discarded", "SKIP"];

export default function SettingsPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", location: "", timezone: "",
    targetRoles: "", salaryMin: "", salaryMax: "",
    h1bFilter: false,
    llmProvider: "claude", llmModel: "claude-sonnet-4-6",
    llmApiKey: "", llmBaseUrl: "",
    onboardingDone: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      if (data) {
        setForm({
          fullName: data.fullName || "",
          email: data.email || "",
          location: data.location || "",
          timezone: data.timezone || "",
          targetRoles: Array.isArray(data.targetRoles)
            ? data.targetRoles.join(", ")
            : (data.targetRoles || ""),
          salaryMin: data.salaryMin?.toString() || "",
          salaryMax: data.salaryMax?.toString() || "",
          h1bFilter: data.h1bFilter || false,
          llmProvider: data.llmProvider || "claude",
          llmModel: data.llmModel || "claude-sonnet-4-6",
          llmApiKey: data.llmApiKey || "",
          llmBaseUrl: data.llmBaseUrl || "",
          onboardingDone: data.onboardingDone || false,
        });
      }
    });
  }, []);

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
      if (!res.ok) throw new Error("Save failed");
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
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" />
          </div>
          <div>
            <label>Timezone</label>
            <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="America/New_York" />
          </div>
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
              const p = PROVIDERS.find((p) => p.value === e.target.value);
              setForm({ ...form, llmProvider: e.target.value, llmModel: p?.models[0] || "" });
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Model</label>
          <select value={form.llmModel} onChange={(e) => setForm({ ...form, llmModel: e.target.value })}>
            {provider?.models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
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
            <input
              value={form.llmBaseUrl}
              onChange={(e) => setForm({ ...form, llmBaseUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          </div>
        )}
        <p className="text-[#888] text-xs">API keys are stored locally in your SQLite database and never sent anywhere except the LLM provider.</p>
      </div>

      {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

      <button className="btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
