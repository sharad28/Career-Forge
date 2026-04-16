"use client";

import { useState } from "react";
import ProfileGate from "@/components/ProfileGate";

interface LinkedInAudit {
  headline: { issue: string; rewrite: string };
  about: { issue: string; rewrite: string };
  bullets: { original: string; issue: string; rewrite: string }[];
  featured: string;
  skills: string[];
  cta: string;
  postIdeas: string[];
}

export default function LinkedInPage() {
  const [profile, setProfile] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkedInAudit | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"optimize" | "posts">("optimize");

  async function optimize() {
    if (!profile.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, goal }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Optimization failed");
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProfileGate requires={["llmApiKey", "fullName"]}>
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LinkedIn Optimizer</h1>
        <p className="text-[#888] text-sm mt-1">
          Optimize your profile for recruiter discovery and AI screening
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#2a2a2a] pb-0">
        {(["optimize", "posts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? "border-[#6366f1] text-[#6366f1]" : "border-transparent text-[#888] hover:text-[#ededed]"
            }`}
          >
            {t === "optimize" ? "Profile Optimizer" : "Post Generator"}
          </button>
        ))}
      </div>

      {tab === "optimize" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div>
              <label>Your goal</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., get recruited for Senior AI/ML Engineer roles at $175K+"
              />
            </div>
            <div>
              <label>Paste your LinkedIn profile text</label>
              <textarea
                rows={8}
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="Copy everything from your LinkedIn profile: headline, about, experience, skills..."
                className="resize-none"
              />
            </div>
            <button
              className="btn-primary w-full"
              onClick={optimize}
              disabled={loading || !profile.trim()}
            >
              {loading ? "Analyzing…" : "Optimize Profile"}
            </button>
            {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
          </div>

          {result && (
            <div className="space-y-4">
              <div className="card space-y-3">
                <div className="font-medium">Headline</div>
                <div className="text-[#888] text-sm">{result.headline.issue}</div>
                <div className="bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-lg p-3 text-sm">
                  {result.headline.rewrite}
                </div>
              </div>

              <div className="card space-y-3">
                <div className="font-medium">About / Summary</div>
                <div className="text-[#888] text-sm">{result.about.issue}</div>
                <div className="bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {result.about.rewrite}
                </div>
              </div>

              {result.bullets.length > 0 && (
                <div className="card space-y-4">
                  <div className="font-medium">Experience Bullets</div>
                  {result.bullets.map((b, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-xs text-[#888] line-through">{b.original}</div>
                      <div className="text-xs text-[#fde68a]">{b.issue}</div>
                      <div className="text-sm border-l-2 border-[#6366f1] pl-3">{b.rewrite}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.skills.length > 0 && (
                <div className="card space-y-3">
                  <div className="font-medium">Missing Skills to Add</div>
                  <div className="flex flex-wrap gap-2">
                    {result.skills.map((s) => (
                      <span key={s} className="badge badge-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card space-y-2">
                <div className="font-medium">Featured Section</div>
                <p className="text-sm text-[#888]">{result.featured}</p>
              </div>

              <div className="card space-y-2">
                <div className="font-medium">Call to Action</div>
                <p className="text-sm text-[#888]">{result.cta}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "posts" && (
        <PostGenerator />
      )}
    </div>
    </ProfileGate>
  );
}

function PostGenerator() {
  const [category, setCategory] = useState("lesson");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<string[]>([]);
  const [error, setError] = useState("");

  const CATEGORIES = [
    { value: "lesson", label: "Lesson Learned" },
    { value: "insight", label: "Industry Insight" },
    { value: "tool", label: "Tool & Workflow" },
    { value: "hotTake", label: "Hot Take" },
    { value: "intro", label: "Reintroduction" },
  ];

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setPosts(data.posts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div>
          <label>Post Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button className="btn-primary w-full" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : "Generate 3 Posts"}
        </button>
        {error && <p className="text-[#fca5a5] text-sm">{error}</p>}
      </div>

      {posts.map((post, i) => (
        <div key={i} className="card space-y-3">
          <div className="text-xs text-[#888]">Post {i + 1}</div>
          <p className="text-sm whitespace-pre-wrap">{post}</p>
          <button
            className="btn-ghost text-xs py-1 px-3"
            onClick={() => navigator.clipboard.writeText(post)}
          >
            Copy
          </button>
        </div>
      ))}
    </div>
  );
}
