// Thin client for the Vercel functions. Every call degrades to offline behaviour on failure.
async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j as T;
}
export const modelLabel = (m: string) => (m.startsWith("gemini") ? `Gemini (${m})` : m.startsWith("claude") ? `Claude (${m})` : m);
export async function health(): Promise<{ live: boolean; provider?: string; models?: Record<string, string> }> {
  try {
    const r = await fetch("/api/health");
    if (!r.ok) return { live: false };
    return await r.json();
  } catch {
    return { live: false };
  }
}
export const extractLive = (text: string, channel: string, date: string, accounts: string[]) =>
  post<{ company: string; contact_name?: string; contact_email?: string; signals: any[]; dropped: { quote: string; reason: string }[]; model: string }>(
    "/api/extract", { text, channel, date, accounts });
export const draftLive = (body: unknown) => post<{ draft: string; model: string }>("/api/draft", body);
export const askLive = (body: unknown) => post<{ answer: string; citations: string[]; invalid: string[]; model: string }>("/api/ask", body);
