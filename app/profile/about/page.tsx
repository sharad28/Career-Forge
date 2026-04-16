"use client";

import { useSettings } from "../_lib/useSettings";

export default function AboutPage() {
  const { form, update, save, saving, saved, error } = useSettings();

  function onSave() {
    save({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      location: form.location,
      timezone: form.timezone,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl,
    });
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold">About You</h2>
        <p className="text-[#888] text-sm">Personal details used in cover letters, applications, and outreach.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Full Name</label>
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label>Location</label>
            <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, State" />
          </div>
          <div>
            <label>Timezone</label>
            <input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} placeholder="America/New_York" />
          </div>
          <div>
            <label>LinkedIn URL</label>
            <input value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div>
          <label>Portfolio URL</label>
          <input value={form.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} placeholder="https://your-portfolio.com" />
        </div>
      </div>

      {error && <p className="text-[#fca5a5] text-sm">{error}</p>}

      <button className="btn-primary w-full" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
