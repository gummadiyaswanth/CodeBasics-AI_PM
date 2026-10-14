// Offline fallbacks used when no model key (GEMINI_API_KEY or ANTHROPIC_API_KEY) is configured (or in the static preview).
// They are deliberately simple and labelled as such in the UI.
import type { Account, Signal, Source } from "./types";
import { Memory, fmtDate } from "./engine";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function parseDue(sentence: string, msgDate: string): string | null {
  const s = sentence.toLowerCase();
  const base = new Date(msgDate + "T00:00:00Z");
  let m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (m) return iso(new Date(Date.UTC(base.getUTCFullYear(), MONTHS.indexOf(m[2]), +m[1])));
  m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (m) return iso(new Date(Date.UTC(base.getUTCFullYear(), MONTHS.indexOf(m[1]), +m[2])));
  m = s.match(/end of (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (m) return iso(new Date(Date.UTC(base.getUTCFullYear(), MONTHS.indexOf(m[1]) + 1, 0)));
  m = s.match(/\bthe (\d{1,2})(?:st|nd|rd|th)\b/);
  if (m) return iso(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + (+m[1] < base.getUTCDate() ? 1 : 0), +m[1])));
  if (/\btomorrow\b/.test(s)) return iso(new Date(base.getTime() + 86400000));
  if (/\btoday\b/.test(s)) return msgDate;
  if (/\bthis week\b/.test(s)) return iso(new Date(base.getTime() + ((5 - base.getUTCDay() + 7) % 7) * 86400000));
  const dn = DAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(s));
  if (dn >= 0) return iso(new Date(base.getTime() + (((dn - base.getUTCDay() + 7) % 7) || 7) * 86400000));
  return null;
}

function money(s: string): number | null {
  const m = s.match(/\$?\s?(\d+(?:\.\d+)?)\s?k\b/i) || s.match(/(\d{2,3}),000/);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  const words: Record<string, number> = { ten: 10, fifteen: 15, twenty: 20, "twenty five": 25, thirty: 30, forty: 40, fifty: 50, sixty: 60 };
  const w = s.toLowerCase().match(/(ten|fifteen|twenty five|twenty|thirty|forty|fifty|sixty) thousand/);
  return w ? words[w[1]] * 1000 : null;
}

export function matchAccount(text: string, accounts: Record<string, Account>): string | null {
  const t = text.toLowerCase();
  let best: string | null = null, bestLen = 0;
  for (const [k, a] of Object.entries(accounts)) {
    const first = a.company.toLowerCase().split(/[ &]/)[0];
    if (first.length > 3 && t.includes(first) && first.length > bestLen) { best = k; bestLen = first.length; }
  }
  return best;
}

// Splits text into sentences while keeping exact substrings (so quotes stay verbatim).
function sentences(text: string): string[] {
  return (text.match(/[^.!?\n]+[.!?]?/g) || []).map((s) => s.trim()).filter((s) => s.length > 12);
}

export function offlineExtract(text: string, channel: string, date: string, accounts: Record<string, Account>, owner: string): { account: string | null; signals: Signal[] } {
  const out: Signal[] = [];
  let acct: string | null = null;
  for (const s of sentences(text)) {
    const a = matchAccount(s, accounts);
    if (a) acct = a;
    const due = parseDue(s, date);
    const v = money(s);
    const base = { source: "", account: acct || "unassigned", raised: date, due, owner, value_usd: v } as const;
    if (/\b(i'll|i will|we'll|we will|will send|will share|let me|remind me|promised)\b/i.test(s))
      out.push({ ...base, id: "", type: "commitment", summary: `Promise: ${s}`, quote: s, status: "open", waiting_on: "us" });
    else if (/\?|\b(wants|needs|asked|requested|can you|please send)\b/i.test(s))
      out.push({ ...base, id: "", type: "client_request", summary: `Request: ${s}`, quote: s, status: "open", waiting_on: "us" });
    else if (/\b(cheaper|competitor|other vendor|also evaluating|quoted)\b/i.test(s))
      out.push({ ...base, id: "", type: "competitor", summary: `Competition: ${s}`, quote: s, status: "info", waiting_on: null });
    else if (v) out.push({ ...base, id: "", type: "budget", summary: `Budget: ${s}`, quote: s, status: "info", waiting_on: null });
  }
  for (const s of out) if (s.account === "unassigned" && acct) s.account = acct;
  void channel;
  return { account: acct, signals: out };
}

export function templateDraft(company: string, contact: string, owner: string, loops: Signal[]): string {
  const first = (contact || "there").replace(/^(Dr\.|Mr\.|Ms\.)\s*/, "").split(" ")[0];
  const lines = loops.map((l) => `On "${l.quote}": [${owner}: your answer]`);
  return `Hi ${first},\n\nApologies for the delay in getting back to you.\n\n${lines.join("\n\n")}\n\n${owner}\n\n(Template draft: no AI key configured. Fill every [bracket] before sending. Account: ${company})`;
}

export function whereWeStand(m: Memory, key: string): { text: string; cite: string; at?: string }[] {
  const sig = m.signalsFor(key);
  const out: { text: string; cite: string; at?: string }[] = [];
  const latest = (types: string[]) => sig.filter((s) => types.includes(s.type)).sort((a, b) => b.raised.localeCompare(a.raised))[0];
  const st = latest(["status_signal"]);
  if (st) out.push({ text: st.summary, cite: st.source, at: st.raised });
  const bud = latest(["budget"]);
  if (bud) out.push({ text: bud.summary, cite: bud.source, at: bud.raised });
  const comp = latest(["competitor"]);
  if (comp) out.push({ text: comp.summary, cite: comp.source, at: comp.raised });
  for (const s of sig.filter((x) => m.isOpenLoop(x))) out.push({ text: `Open: ${s.summary}${s.due ? ` (due ${fmtDate(s.due)})` : ""}`, cite: s.source, at: s.raised });
  for (const s of sig.filter((x) => x.type === "stakeholder")) out.push({ text: s.summary, cite: s.source, at: s.raised });
  for (const s of sig.filter((x) => x.type === "cross_sell" || x.type === "renewal")) out.push({ text: s.summary, cite: s.source, at: s.raised });
  return out;
}

export function retrieve(m: Memory, q: string, k = 6): Source[] {
  const terms = q.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  const acct = matchAccount(q, m.ex.accounts);
  const scored = m.sources.map((s) => {
    const body = (s.title + " " + s.body).toLowerCase();
    let score = terms.reduce((a, t) => a + (body.includes(t) ? 1 : 0), 0);
    if (acct && m.signalsFor(acct).some((x) => x.source === s.id)) score += 5;
    return { s, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.s.date.localeCompare(a.s.date)).slice(0, k).map((x) => x.s);
}
