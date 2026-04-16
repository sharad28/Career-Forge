"use client";

import { useEffect, useState } from "react";

export interface SettingsForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  targetRoles: string;
  salaryMin: string;
  salaryMax: string;
  h1bFilter: boolean;
  llmProvider: string;
  llmModel: string;
  llmApiKey: string;
  llmBaseUrl: string;
  searchApiKey: string;
  autoApplyMethod: string;
  computerUseEnabled: boolean;
  onboardingDone: boolean;
}

const EMPTY: SettingsForm = {
  fullName: "", email: "", phone: "", location: "", timezone: "",
  linkedinUrl: "", portfolioUrl: "",
  targetRoles: "", salaryMin: "", salaryMax: "", h1bFilter: false,
  llmProvider: "claude", llmModel: "claude-sonnet-4-6",
  llmApiKey: "", llmBaseUrl: "", searchApiKey: "",
  autoApplyMethod: "auto", computerUseEnabled: false,
  onboardingDone: false,
};

export function useSettings() {
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      if (data) {
        setForm({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          timezone: data.timezone || "",
          linkedinUrl: data.linkedinUrl || "",
          portfolioUrl: data.portfolioUrl || "",
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
          autoApplyMethod: data.autoApplyMethod || "auto",
          computerUseEnabled: data.computerUseEnabled || false,
          onboardingDone: data.onboardingDone || false,
        });
      }
      setLoaded(true);
    });
  }, []);

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(fields: Partial<SettingsForm>) {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...fields, onboardingDone: true };
      if (fields.salaryMin !== undefined) payload.salaryMin = parseInt(fields.salaryMin) || 0;
      if (fields.salaryMax !== undefined) payload.salaryMax = parseInt(fields.salaryMax) || 0;
      if (fields.targetRoles !== undefined) {
        payload.targetRoles = JSON.stringify(
          fields.targetRoles.split(",").map((r) => r.trim()).filter(Boolean)
        );
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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

  return { form, update, save, saving, saved, error, loaded };
}
