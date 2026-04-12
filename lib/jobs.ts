/**
 * Real job fetchers for known ATS providers.
 * All APIs used here are public — no auth required.
 */

export interface LiveJob {
  title: string;
  company: string;
  url: string;
  location: string;
  postedAt: string | null;      // human-readable, e.g. "2d ago"
  postedAtRaw: string | null;   // ISO-8601 for sorting
  snippet: string;
  source: "greenhouse" | "lever" | "ashby" | "jina";
}

// ─── URL type detection ───────────────────────────────────────────────────────

export type PortalType = "greenhouse" | "lever" | "ashby" | "other";

export function detectPortalType(url: string): PortalType {
  if (/boards\.greenhouse\.io|job-boards\.greenhouse\.io/i.test(url)) return "greenhouse";
  if (/jobs\.lever\.co/i.test(url)) return "lever";
  if (/jobs\.ashbyhq\.com/i.test(url)) return "ashby";
  return "other";
}

function extractSlug(url: string, type: PortalType): string {
  try {
    const path = new URL(url).pathname.replace(/^\//, "").split("/")[0];
    return path;
  } catch {
    return "";
  }
}

// ─── Greenhouse ───────────────────────────────────────────────────────────────

async function fetchGreenhouse(portalUrl: string, company: string, h1bFriendly: boolean): Promise<LiveJob[]> {
  const slug = extractSlug(portalUrl, "greenhouse");
  if (!slug) return [];

  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.jobs ?? []).map((j: {
    title: string;
    absolute_url: string;
    location?: { name: string };
    updated_at?: string;
    departments?: Array<{ name: string }>;
  }) => ({
    title: j.title,
    company,
    url: j.absolute_url,
    location: j.location?.name ?? "",
    postedAt: j.updated_at ? formatDate(j.updated_at) : null,
    postedAtRaw: j.updated_at ?? null,
    snippet: j.departments?.map((d) => d.name).join(", ") ?? "",
    source: "greenhouse" as const,
  }));
}

// ─── Lever ────────────────────────────────────────────────────────────────────

async function fetchLever(portalUrl: string, company: string, h1bFriendly: boolean): Promise<LiveJob[]> {
  const slug = extractSlug(portalUrl, "lever");
  if (!slug) return [];

  const res = await fetch(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (Array.isArray(data) ? data : []).map((j: {
    text: string;
    hostedUrl: string;
    categories?: { location?: string; team?: string };
    createdAt?: number;
    descriptionPlain?: string;
  }) => {
    const iso = j.createdAt ? new Date(j.createdAt).toISOString() : null;
    return {
      title: j.text,
      company,
      url: j.hostedUrl,
      location: j.categories?.location ?? "",
      postedAt: iso ? formatDate(iso) : null,
      postedAtRaw: iso,
      snippet: j.categories?.team ?? "",
      source: "lever" as const,
    };
  });
}

// ─── Ashby ────────────────────────────────────────────────────────────────────

async function fetchAshby(portalUrl: string, company: string, h1bFriendly: boolean): Promise<LiveJob[]> {
  const slug = extractSlug(portalUrl, "ashby");
  if (!slug) return [];

  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    { signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.jobPostings ?? [])
    .filter((j: { jobPostingState?: string }) => j.jobPostingState === "Published" || !j.jobPostingState)
    .map((j: {
      title: string;
      externalLink?: string;
      jobPostingUrl?: string;
      locationName?: string;
      publishedDate?: string;
      descriptionHtml?: string;
      departmentName?: string;
    }) => ({
      title: j.title,
      company,
      url: j.externalLink ?? j.jobPostingUrl ?? portalUrl,
      location: j.locationName ?? "",
      postedAt: j.publishedDate ? formatDate(j.publishedDate) : null,
      postedAtRaw: j.publishedDate ?? null,
      snippet: j.departmentName ?? "",
      source: "ashby" as const,
    }));
}

// ─── Jina fallback (unknown portals) ─────────────────────────────────────────

async function fetchViaJina(portalUrl: string, company: string): Promise<LiveJob[]> {
  // For unknown portals we can't reliably parse job listings without a browser,
  // so we return a single "search link" entry so the portal still appears in results.
  return [{
    title: `Open roles at ${company}`,
    company,
    url: portalUrl,
    location: "",
    postedAt: null,
    postedAtRaw: null,
    snippet: "Visit the careers page — live job listing could not be fetched automatically.",
    source: "jina" as const,
  }];
}

// ─── Keyword filter ───────────────────────────────────────────────────────────

export function matchesQuery(job: LiveJob, query: string): boolean {
  if (!query.trim()) return true;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${job.title} ${job.snippet} ${job.location}`.toLowerCase();
  return words.every((w) => haystack.includes(w));
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export interface PortalInput {
  url: string;
  company: string;
  h1bFriendly: boolean;
}

/**
 * Fetch live jobs from a single portal.
 * Returns an empty array on error — never throws.
 */
export async function fetchPortalJobs(portal: PortalInput): Promise<LiveJob[]> {
  const type = detectPortalType(portal.url);
  try {
    switch (type) {
      case "greenhouse": return await fetchGreenhouse(portal.url, portal.company, portal.h1bFriendly);
      case "lever":      return await fetchLever(portal.url, portal.company, portal.h1bFriendly);
      case "ashby":      return await fetchAshby(portal.url, portal.company, portal.h1bFriendly);
      default:           return await fetchViaJina(portal.url, portal.company);
    }
  } catch {
    return [];
  }
}

/**
 * Fan out to multiple portals with a concurrency cap.
 */
export async function fetchAllPortals(
  portals: PortalInput[],
  concurrency = 6
): Promise<LiveJob[]> {
  const results: LiveJob[] = [];
  for (let i = 0; i < portals.length; i += concurrency) {
    const batch = portals.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(fetchPortalJobs));
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(...r.value);
    }
  }
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
  } catch {
    return "";
  }
}
