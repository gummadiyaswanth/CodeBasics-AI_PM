// Deterministic layer. The model only extracts signals with quotes; everything that ranks,
// schedules or changes dates is plain code, so every number on screen can be explained.
import type { Account, CrmRow, Extraction, Proposal, QueueItem, ScorePart, Signal, Source } from "./types";

export const DAY = 86_400_000;
export const toDate = (s: string) => new Date(s + "T00:00:00Z");
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
export const fmtDate = (s: string | null) =>
  s ? toDate(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "";
export const money = (v: number | null) => (v == null ? "value unknown" : `$${Math.round(v / 1000)}k`);

const LOOP_TYPES = new Set(["client_request", "commitment", "deadline", "revisit"]);
const INTERNAL_TYPES = new Set(["handoff", "data_gap", "duplicate"]);
const INTERNAL_SOURCES = ["internal_", "meridian_check", "techsummit_debrief"];

export interface UserState {
  done: Record<string, string>; // signal id -> date handled
  snoozed: Record<string, string>; // account -> until date
  decisions: Record<string, "approved" | "rejected">; // proposal key -> decision
  captured: { source: Source; signals: Signal[] }[];
  processed: string[]; // channel-extension items the user has pulled into memory
}
export const emptyState = (): UserState => ({ done: {}, snoozed: {}, decisions: {}, captured: [], processed: [] });
export const allProcessed = (sources: Source[]): UserState => ({ ...emptyState(), processed: sources.filter((s) => s.folder === "extension").map((s) => s.id) });

// ---------- scoring: the founder's own rules from Client Meeting 2 ----------
// "cost, urgency, and the competition I'm feeling" + existing clients/referrals protected.
const REL_POINTS: Record<string, [number, string]> = {
  client: [15, "Existing client: protect the relationship"],
  referral: [13, "Referral: the referrer's reputation is on the line"],
  inbound: [8, "Inbound enquiry"],
  partner: [8, "Partner channel"],
  conference: [6, "Conference contact"],
  cold: [3, "Cold / revived lead"],
};
const COMP_POINTS: Record<string, [number, string]> = {
  comparable: [15, "Rival at a similar price and the client is deciding: act fast to stay in the race"],
  favoured: [10, "We are preferred or sole vendor: book it before it cools"],
  none_known: [6, "No competition signal captured"],
  much_lower: [0, "Rival is far cheaper: founder's rule is to stop chasing"],
};

function deadlinePoints(d: number): number {
  if (d < 0) return 36;
  if (d <= 2) return 40;
  if (d <= 5) return 36;
  if (d <= 10) return 28;
  if (d <= 21) return 18;
  return 8;
}
function waitPoints(w: number): number {
  if (w >= 21) return 30;
  if (w >= 14) return 24;
  if (w >= 7) return 18;
  if (w >= 3) return 10;
  return 4;
}
function promisePoints(d: number): number {
  if (d <= 1 && d >= 0) return 30;
  if (d <= 5 && d > 1) return 22;
  return 10;
}

export function scoreAccount(
  loops: Signal[], acct: Account, value: number | null, lastActivity: string, today: string,
): { score: number; parts: ScorePart[]; daysWaiting: number; nextDue: string | null } {
  let urgency = 0;
  let why = "";
  let daysWaiting = 0;
  let nextDue: string | null = null;
  let hasLiveClock = false;
  for (const l of loops) {
    if (l.due && (!nextDue || l.due < nextDue)) nextDue = l.due;
    const d = l.due ? daysBetween(today, l.due) : null;
    if (d != null && d >= 0) hasLiveClock = true;
    const external = l.type === "client_request" || l.type === "deadline";
    if (external && d != null) {
      const p = deadlinePoints(d);
      if (p > urgency) { urgency = p; why = d < 0 ? `Client deadline passed ${-d}d ago (${fmtDate(l.due)})` : d === 0 ? `Client deadline is today` : `Client deadline in ${d}d (${fmtDate(l.due)})`; }
    }
    if (l.type === "commitment" && d != null && d >= 0) {
      const p = promisePoints(d);
      if (p > urgency) { urgency = p; why = `We promised this by ${fmtDate(l.due)}`; }
    }
    const start = l.type === "revisit" ? l.due ?? l.raised : l.raised;
    if (l.type !== "deadline") {
      const w = Math.max(0, daysBetween(start, today));
      daysWaiting = Math.max(daysWaiting, w);
      const p = waitPoints(w);
      if (p > urgency) { urgency = p; why = `Waiting on us for ${w} days`; }
    }
  }
  const idle = daysBetween(lastActivity, today);
  if (!hasLiveClock && idle > 45 && urgency > 14) {
    urgency = 14;
    why = `No client activity for ${idle} days: revive, don't firefight`;
  }
  const v = value == null ? 8 : Math.round(Math.min(1, value / 100_000) * 300) / 10;
  const [rp, rwhy] = REL_POINTS[acct.relationship] ?? [6, ""];
  const [cp, cwhy] = COMP_POINTS[acct.competition] ?? [6, ""];
  const parts: ScorePart[] = [
    { label: "Urgency", points: urgency, max: 40, why },
    { label: "Deal value", points: v, max: 30, why: value == null ? "Value not captured yet (neutral 8)" : `${money(value)} (linear to $100k)` },
    { label: "Competition", points: cp, max: 15, why: cwhy },
    { label: "Relationship", points: rp, max: 15, why: rwhy },
  ];
  const score = Math.round(parts.reduce((a, p) => a + p.points, 0));
  return { score, parts, daysWaiting, nextDue };
}
export const band = (s: number): "P1" | "P2" | "P3" => (s >= 65 ? "P1" : s >= 50 ? "P2" : "P3");

// ---------- core model ----------
export class Memory {
  today: string;
  crm: CrmRow[];
  sources: Source[];
  ex: Extraction;
  state: UserState;
  signals: Signal[];
  sourceById: Map<string, Source>;
  pending: Source[];
  crmById: Map<string, CrmRow>;

  constructor(crm: CrmRow[], sources: Source[], ex: Extraction, state: UserState, today: string) {
    this.today = today;
    this.crm = crm;
    this.ex = ex;
    this.state = state;
    const pending = new Set(sources.filter((s) => s.folder === "extension" && !(state.processed ?? []).includes(s.id)).map((s) => s.id));
    this.pending = sources.filter((s) => pending.has(s.id));
    this.sources = [...sources.filter((s) => !pending.has(s.id)), ...state.captured.map((c) => c.source)];
    this.signals = [...ex.signals.filter((s) => !pending.has(s.source)), ...state.captured.flatMap((c) => c.signals)];
    this.sourceById = new Map(this.sources.map((s) => [s.id, s]));
    this.crmById = new Map(crm.map((r) => [r.lead_id, r]));
  }

  account(key: string): Account {
    return this.ex.accounts[key] ?? { company: key, leads: [], relationship: "inbound", competition: "none_known" };
  }
  primaryLead(key: string): CrmRow | undefined {
    const a = this.account(key);
    return a.leads.map((l) => this.crmById.get(l)).find(Boolean);
  }
  signalsFor(key: string) {
    return this.signals.filter((s) => s.account === key);
  }
  isOpenLoop(s: Signal) {
    return s.status === "open" && s.waiting_on === "us" && LOOP_TYPES.has(s.type) && !this.state.done[s.id];
  }
  lastActivity(key: string): string {
    const ds = this.signalsFor(key)
      .filter((s) => !INTERNAL_TYPES.has(s.type) && !INTERNAL_SOURCES.some((p) => s.source.includes(p)))
      .map((s) => s.raised);
    return ds.sort().at(-1) ?? "2000-01-01";
  }
  lastActivitySignal(key: string): Signal | undefined {
    const d = this.lastActivity(key);
    return this.signalsFor(key).find((s) => s.raised === d && !INTERNAL_TYPES.has(s.type) && !INTERNAL_SOURCES.some((p) => s.source.includes(p)));
  }
  accountValue(key: string): [number | null, string] {
    const loops = this.signalsFor(key).filter((s) => s.value_usd);
    const fromSignals = loops.length ? Math.max(...loops.map((s) => s.value_usd as number)) : null;
    const approved = this.applied().find((r) => this.account(key).leads.includes(r.lead_id) && r.status !== "Won" && r.est_value_usd);
    if (fromSignals) return [fromSignals, "from conversation"];
    if (approved?.est_value_usd) return [approved.est_value_usd, "CRM estimate"];
    return [null, "unknown"];
  }

  queue(): QueueItem[] {
    const byAcct = new Map<string, Signal[]>();
    for (const s of this.signals) if (this.isOpenLoop(s)) byAcct.set(s.account, [...(byAcct.get(s.account) ?? []), s]);
    const items: QueueItem[] = [];
    for (const [key, loops] of byAcct) {
      if (key === "techsummit") continue;
      const snooze = this.state.snoozed[key];
      if (snooze && snooze > this.today) continue;
      const acct = this.account(key);
      const lead = this.primaryLead(key);
      const nl = this.ex.new_leads.find((n) => n.account === key);
      const [value, valueBasis] = this.accountValue(key);
      const { score, parts, daysWaiting, nextDue } = scoreAccount(loops, acct, value, this.lastActivity(key), this.today);
      const owners = loops.map((l) => l.owner).filter(Boolean) as string[];
      const owner = lead?.owner || owners[0] || nl?.owner || "Unassigned";
      items.push({
        account: key, company: acct.company, owner, loops: loops.sort((a, b) => (a.due ?? "9") < (b.due ?? "9") ? -1 : 1),
        value, valueBasis, daysWaiting, nextDue, daysToDue: nextDue ? daysBetween(this.today, nextDue) : null,
        score, band: band(score), parts, inCrm: acct.leads.length > 0,
        contactName: lead?.contact_name || nl?.contact_name || "", contactEmail: lead?.contact_email || nl?.contact_email || "",
      });
    }
    return items.sort((a, b) => b.score - a.score || a.company.localeCompare(b.company));
  }

  goneQuiet() {
    return this.signals
      .filter((s) => s.type === "gone_quiet" && !this.state.done[s.id])
      .map((s) => ({ signal: s, company: this.account(s.account).company, days: daysBetween(s.raised, this.today), competition: this.account(s.account).competition }))
      .sort((a, b) => a.days - b.days);
  }
  upcoming() {
    return this.signals
      .filter((s) => (s.status === "scheduled" || s.status === "needs_outcome") && !this.state.done[s.id])
      .map((s) => ({ signal: s, company: this.account(s.account).company, days: s.due ? daysBetween(this.today, s.due) : 0 }))
      .sort((a, b) => a.days - b.days);
  }

  // ---------- CRM proposals: model-suggested fields + code-derived dates ----------
  derivedProposals(): Proposal[] {
    const out: Proposal[] = [];
    for (const [key, acct] of Object.entries(this.ex.accounts)) {
      const lead = this.primaryLead(key);
      if (!lead) continue;
      const last = this.lastActivity(key);
      const lastSig = this.lastActivitySignal(key);
      if (lastSig && (!lead.last_contact_date || last > lead.last_contact_date)) {
        out.push({ lead_id: lead.lead_id, field: "last_contact_date", from: lead.last_contact_date, to: last, derived: true, confidence: "high",
          reason: `Latest conversation found is ${fmtDate(last)}; CRM shows ${lead.last_contact_date ? fmtDate(lead.last_contact_date) : "nothing"}.`,
          source: lastSig.source, quote: lastSig.quote });
      }
      const loops = this.signalsFor(key).filter((s) => (this.isOpenLoop(s) || s.status === "scheduled") && s.due);
      let next = loops.sort((a, b) => (a.due! < b.due! ? -1 : 1))[0];
      const undated = this.signalsFor(key).find((s) => this.isOpenLoop(s) && !s.due);
      if (!next && undated) next = { ...undated, due: this.today };
      if (next) {
        const target = next.due! < this.today ? this.today : next.due!;
        if (lead.next_followup_date !== target) {
          out.push({ lead_id: lead.lead_id, field: "next_followup_date", from: lead.next_followup_date, to: target, derived: true, confidence: "high",
            reason: next.due! < this.today ? `Overdue since ${fmtDate(next.due)}: follow up today.` : `Next dated item: ${next.summary}`,
            source: next.source, quote: next.quote });
        }
      }
      void acct;
    }
    return out;
  }
  allProposals(): Proposal[] {
    const model = this.ex.proposals.map((p) => ({ ...p, from: (this.crmById.get(p.lead_id) as any)?.[p.field] ?? null }));
    return [...model, ...this.derivedProposals()]
      .filter((p) => String(p.from ?? "") !== String(p.to))
      .map((p) => ({ ...p, key: `${p.lead_id}:${p.field}` }));
  }
  applied(): CrmRow[] {
    const rows = this.crm.map((r) => ({ ...r }));
    const idx = new Map(rows.map((r) => [r.lead_id, r]));
    const props = [...this.ex.proposals.map((p) => ({ ...p, key: `${p.lead_id}:${p.field}` })), ...this.derivedProposals().map((p) => ({ ...p, key: `${p.lead_id}:${p.field}` }))];
    for (const p of props) {
      if (this.state.decisions[p.key!] !== "approved") continue;
      const r = idx.get(p.lead_id) as any;
      if (!r) continue;
      if (p.field === "notes") r.notes = r.notes ? `${r.notes} | ${p.to}` : String(p.to);
      else r[p.field] = p.to;
    }
    for (const o of this.ex.opportunities) {
      if (this.state.decisions[`opp:${o.lead_id}:${o.title}`] !== "approved") continue;
      const r = idx.get(o.lead_id);
      if (r) r.notes = `${r.notes ? r.notes + " | " : ""}Opportunity (${this.today}): ${o.title} [${o.service}]`;
    }
    // approved new leads become new CRM rows, with dates derived from their conversations
    let n = 41;
    for (const nl of this.ex.new_leads) {
      if (this.state.decisions[`new:${nl.account}`] !== "approved") continue;
      const loops = this.signalsFor(nl.account).filter((s) => this.isOpenLoop(s) && s.due).map((s) => s.due!).sort();
      const next = loops[0] ? (loops[0] < this.today ? this.today : loops[0]) : this.today;
      rows.push({ lead_id: `L-10${n++}`, company: nl.company, contact_name: nl.contact_name, contact_email: nl.contact_email,
        source: nl.source, service_interest: nl.service_interest, status: "New", est_value_usd: null, owner: nl.owner,
        created_date: this.today, last_contact_date: this.lastActivity(nl.account), next_followup_date: next, notes: nl.notes });
    }
    // approved duplicate merges: keep the older record, carry a note, drop the newer row
    for (const d of this.duplicates()) {
      if (this.state.decisions[`dup:${d.a.lead_id}/${d.b.lead_id}`] !== "approved") continue;
      const keep = rows.find((r) => r.lead_id === d.a.lead_id);
      if (keep) keep.notes = `${keep.notes ? keep.notes + " | " : ""}Merged ${d.b.lead_id} (${d.b.owner || "no owner"}, ${d.b.service_interest || "no service"}): ${d.b.notes}`;
      const i = rows.findIndex((r) => r.lead_id === d.b.lead_id);
      if (i >= 0) rows.splice(i, 1);
    }
    return rows;
  }

  duplicates() {
    const out: { a: CrmRow; b: CrmRow; rule: string }[] = [];
    const dom = (e: string) => e.split("@")[1] ?? "";
    const tokens = (c: string) => new Set(c.toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter((t) => t.length > 3));
    for (let i = 0; i < this.crm.length; i++)
      for (let j = i + 1; j < this.crm.length; j++) {
        const a = this.crm[i], b = this.crm[j];
        if (a.contact_email && a.contact_email === b.contact_email) out.push({ a, b, rule: "Same contact email" });
        else if (a.contact_email && b.contact_email && dom(a.contact_email) === dom(b.contact_email)) out.push({ a, b, rule: "Same email domain" });
        else {
          const ta = tokens(a.company), tb = tokens(b.company);
          if ([...ta].some((t) => tb.has(t))) out.push({ a, b, rule: "Company names overlap" });
        }
      }
    return out;
  }

  health(rows: CrmRow[]) {
    // Share of live leads whose CRM record matches the evidence: follow-up date set and last contact current.
    const live = Object.entries(this.ex.accounts).filter(([k]) => this.signalsFor(k).some((s) => this.isOpenLoop(s) || s.status === "scheduled" || s.status === "needs_outcome"));
    let ok = 0, total = 0;
    for (const [key] of live) {
      const a = this.account(key);
      const lead = rows.find((r) => a.leads.includes(r.lead_id) || r.company === a.company);
      total++;
      if (!lead) continue; // missing from CRM entirely
      const last = this.lastActivity(key);
      if (lead.next_followup_date && lead.last_contact_date && lead.last_contact_date >= last) ok++;
    }
    return { ok, total, pct: total ? Math.round((ok / total) * 100) : 100 };
  }
}
