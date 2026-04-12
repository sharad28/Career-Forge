"use client";

import { useEffect, useState } from "react";

interface Story {
  id: number;
  company: string;
  role: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  tags: string;
  createdAt: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company: "", role: "", situation: "", task: "", action: "", result: "", reflection: "", tags: "",
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stories").then((r) => r.json()).then(setStories);
  }, []);

  async function save() {
    if (!form.situation.trim() || !form.action.trim()) return;
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    const story = await res.json();
    setStories((prev) => [story, ...prev]);
    setForm({ company: "", role: "", situation: "", task: "", action: "", result: "", reflection: "", tags: "" });
    setShowForm(false);
  }

  async function remove(id: number) {
    await fetch("/api/stories", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  function parseTags(raw: string): string[] {
    try { return JSON.parse(raw); } catch { return []; }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Bank</h1>
          <p className="text-[#888] text-sm mt-1">STAR+R stories for interview prep — {stories.length} stories</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Story"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label>Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
          </div>
          <div>
            <label>Situation *</label>
            <textarea rows={2} value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })} className="resize-none" placeholder="Context and challenge you faced" />
          </div>
          <div>
            <label>Task</label>
            <textarea rows={2} value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} className="resize-none" placeholder="Your specific responsibility" />
          </div>
          <div>
            <label>Action *</label>
            <textarea rows={2} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="resize-none" placeholder="What you did — be specific" />
          </div>
          <div>
            <label>Result</label>
            <textarea rows={2} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className="resize-none" placeholder="Measurable outcome" />
          </div>
          <div>
            <label>Reflection</label>
            <textarea rows={2} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} className="resize-none" placeholder="What you learned" />
          </div>
          <div>
            <label>Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="leadership, debugging, cross-team" />
          </div>
          <button className="btn-primary w-full" onClick={save} disabled={!form.situation.trim() || !form.action.trim()}>
            Save Story
          </button>
        </div>
      )}

      {/* Story list */}
      {stories.length === 0 && !showForm && (
        <div className="card text-center text-[#888] text-sm py-8">
          No stories yet. Add your first STAR+R story for interview prep.
        </div>
      )}

      {stories.map((s) => {
        const tags = parseTags(s.tags);
        const expanded = expandedId === s.id;
        return (
          <div key={s.id} className="card space-y-2">
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(expanded ? null : s.id)}
            >
              <div>
                <div className="font-medium text-sm">{s.situation.slice(0, 100)}{s.situation.length > 100 ? "..." : ""}</div>
                <div className="text-xs text-[#888] mt-1">
                  {s.company && `${s.company} · `}{s.role && `${s.role} · `}
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span className="text-[#888] text-sm flex-shrink-0">{expanded ? "−" : "+"}</span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => <span key={t} className="badge badge-blue">{t}</span>)}
              </div>
            )}

            {expanded && (
              <div className="space-y-3 pt-2 border-t border-[#2a2a2a]">
                <div>
                  <div className="text-xs font-medium text-[#6366f1] mb-1">Situation</div>
                  <p className="text-sm text-[#ededed]">{s.situation}</p>
                </div>
                {s.task && (
                  <div>
                    <div className="text-xs font-medium text-[#6366f1] mb-1">Task</div>
                    <p className="text-sm text-[#ededed]">{s.task}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium text-[#6366f1] mb-1">Action</div>
                  <p className="text-sm text-[#ededed]">{s.action}</p>
                </div>
                {s.result && (
                  <div>
                    <div className="text-xs font-medium text-[#6366f1] mb-1">Result</div>
                    <p className="text-sm text-[#ededed]">{s.result}</p>
                  </div>
                )}
                {s.reflection && (
                  <div>
                    <div className="text-xs font-medium text-[#6366f1] mb-1">Reflection</div>
                    <p className="text-sm text-[#ededed]">{s.reflection}</p>
                  </div>
                )}
                <button
                  className="text-xs text-[#fca5a5] hover:underline"
                  onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                >
                  Delete story
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
