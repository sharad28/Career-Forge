export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Search the web for relevant context.
 * Uses Brave Search if an API key is provided, otherwise falls back to
 * DuckDuckGo's free Instant Answer API (no key required).
 */
export async function webSearch(
  query: string,
  apiKey?: string
): Promise<SearchResult[]> {
  if (apiKey?.trim()) {
    return braveSearch(query, apiKey.trim());
  }
  return ddgSearch(query);
}

async function braveSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&text_decorations=false`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!res.ok) throw new Error(`Brave Search error: ${res.status}`);
  const data = await res.json();

  const hits = (data.web?.results ?? []) as Array<{
    title: string;
    url: string;
    description?: string;
  }>;

  return hits.slice(0, 5).map((h) => ({
    title: h.title,
    url: h.url,
    snippet: h.description || "",
  }));
}

async function ddgSearch(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=careerforge`;
  const res = await fetch(url, { headers: { "User-Agent": "careerforge/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();

  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || "",
      snippet: data.AbstractText,
    });
  }

  const related: Array<{ Text?: string; FirstURL?: string; Name?: string }> =
    data.RelatedTopics ?? [];
  for (const t of related) {
    if (!t.Text) continue;
    results.push({
      title: t.Name || t.Text.split(" – ")[0] || query,
      url: t.FirstURL || "",
      snippet: t.Text,
    });
    if (results.length >= 5) break;
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return [
    "## Web Search Results",
    ...results.map(
      (r, i) =>
        `### [${i + 1}] ${r.title}\nSource: ${r.url}\n${r.snippet}`
    ),
  ].join("\n\n");
}
