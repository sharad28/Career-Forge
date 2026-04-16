"use client";

import { useSettings } from "../_lib/useSettings";

export default function AutomationPage() {
  const { form, update, save, saving, saved, error } = useSettings();

  function onSave() {
    save({
      autoApplyMethod: form.autoApplyMethod,
      computerUseEnabled: form.computerUseEnabled,
    });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold">Auto Apply Preferences</h2>
        <p className="text-[#888] text-sm">How applications get submitted when you use Auto Apply.</p>

        <div>
          <label>Default Apply Method</label>
          <select
            value={form.autoApplyMethod}
            onChange={(e) => update("autoApplyMethod", e.target.value)}
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
            onChange={(e) => update("computerUseEnabled", e.target.checked)}
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

      {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

      <button className="btn-primary w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
