"use client";

import { useSettings } from "../_lib/useSettings";

export default function JobTargetPage() {
  const { form, update, save, saving, saved, error } = useSettings();

  function onSave() {
    save({
      targetRoles: form.targetRoles,
      salaryMin: form.salaryMin,
      salaryMax: form.salaryMax,
      h1bFilter: form.h1bFilter,
    });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold">Job Target</h2>
        <p className="text-[#888] text-sm">What you&apos;re looking for. Used to score and filter jobs in the scanner and inbox.</p>

        <div>
          <label>Target Roles (comma-separated)</label>
          <input
            value={form.targetRoles}
            onChange={(e) => update("targetRoles", e.target.value)}
            placeholder="Senior Data Scientist, ML Engineer, AI Platform Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Salary Min ($)</label>
            <input type="number" value={form.salaryMin} onChange={(e) => update("salaryMin", e.target.value)} placeholder="175000" />
          </div>
          <div>
            <label>Salary Max ($)</label>
            <input type="number" value={form.salaryMax} onChange={(e) => update("salaryMax", e.target.value)} placeholder="250000" />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.h1bFilter}
            onChange={(e) => update("h1bFilter", e.target.checked)}
            className="w-4 h-4 accent-[#6366f1]"
            style={{ width: "1rem", height: "1rem" }}
          />
          <span className="text-sm text-[#ededed]">Require H1B sponsorship — auto-skip roles that say &quot;no sponsorship&quot;</span>
        </label>
      </div>

      {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

      <button className="btn-primary w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
