/**
 * Fetch a web page and return its clean text content via Jina.ai Reader.
 * Free, no API key required. Works on any public URL.
 * https://jina.ai/reader/
 */
export async function fetchPageText(url: string, timeoutMs = 15000): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
      },
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);
    const text = await res.text();
    // Trim to a sensible limit — job descriptions rarely need more than 6k chars
    return text.slice(0, 6000).trim();
  } finally {
    clearTimeout(timer);
  }
}

export function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}
