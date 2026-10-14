import { useState } from "react";
import type { Ctx } from "../App";
import { TODAY } from "../data";
import { askLive, modelLabel } from "../lib/api";
import { matchAccount, retrieve, whereWeStand } from "../lib/offline";
import { SourceLink } from "../ui";
import { fmtDate } from "../lib/engine";

const SUGGEST = [
  "Where are we with Meridian?",
  "What did we promise Northwind?",
  "Which deals have a competitor in them?",
  "Who referred FreshCart and what do they need?",
  "What's due before the end of next week?",
];

export function AskView({ ctx }: { ctx: Ctx }) {
  const { m } = ctx;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<{ q: string; lines: { text: string; cite?: string; at?: string }[]; mode: string; note?: string } | null>(null);

  async function ask(question: string) {
    setQ(question); setBusy(true);
    const docs = retrieve(m, question, 6);
    if (ctx.live) {
      try {
        const r = await askLive({ question, today: TODAY, excerpts: docs.map((d) => ({ id: d.id, date: d.date, body: d.body })) });
        const lines = r.answer.split("\n").filter(Boolean).map((t) => ({ text: t.replace(/\[([\w-]+)\]/g, "").trim(), cite: [...t.matchAll(/\[([\w-]+)\]/g)].map((x) => x[1]).find((c) => r.citations.includes(c)) }));
        setAns({ q: question, lines, mode: `${modelLabel(r.model)} over ${docs.length} retrieved conversations`, note: r.invalid.length ? `${r.invalid.length} citation(s) removed: they didn't match a retrieved source.` : undefined });
      } catch (e: any) {
        setAns({ q: question, lines: [{ text: `The AI call failed (${e.message}). Showing the matching conversations instead.` }, ...docs.map((d) => ({ text: d.title, cite: d.id }))], mode: "fallback" });
      }
    } else {
      setAns(offlineAnswer(question));
    }
    setBusy(false);
  }

  function offlineAnswer(question: string) {
    const ql = question.toLowerCase();
    const acct = matchAccount(question, m.ex.accounts);
    if (acct) return { q: question, lines: whereWeStand(m, acct).map((s) => ({ text: s.text, cite: s.cite, at: s.at })), mode: `Offline: assembled from ${m.account(acct).company}'s signals` };
    if (ql.includes("competit")) {
      const sig = m.signals.filter((s) => s.type === "competitor");
      return { q: question, lines: sig.map((s) => ({ text: `${m.account(s.account).company}: ${s.summary}`, cite: s.source, at: s.raised })), mode: "Offline: competitor signals" };
    }
    if (ql.includes("due") || ql.includes("week")) {
      const end = new Date(new Date(TODAY + "T00:00:00Z").getTime() + 9 * 86400000).toISOString().slice(0, 10);
      const sig = m.signals.filter((s) => m.isOpenLoop(s) && s.due && s.due >= TODAY && s.due <= end).sort((a, b) => a.due!.localeCompare(b.due!));
      return { q: question, lines: sig.map((s) => ({ text: `${fmtDate(s.due)}: ${m.account(s.account).company}. ${s.summary}`, cite: s.source, at: s.raised })), mode: "Offline: open items with a due date in the next 9 days" };
    }
    const docs = retrieve(m, question, 5);
    return { q: question, lines: docs.length ? docs.map((d) => ({ text: d.title, cite: d.id })) : [{ text: "I can't find that in the conversations I have." }], mode: "Offline: keyword match. Add an AI key for written answers." };
  }

  return (
    <>
      <h1>Ask about any client or deal.</h1>
      <p className="lede">Answers come only from captured conversations, and every line links to where it came from. If it isn't in the conversations, Recall says so instead of guessing.</p>
      <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q); }}>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What did Sanjay ask us?" aria-label="Question" />
        <button className="btn primary" disabled={busy || !q.trim()}>{busy ? "Looking..." : "Ask"}</button>
      </form>
      <div className="row" style={{ marginTop: 10 }}>
        {SUGGEST.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
      </div>
      {ans && (
        <section className="panel" style={{ marginTop: 18 }}>
          <h3>{ans.q}</h3>
          <p className="small muted" style={{ margin: "2px 0 10px" }}>{ans.mode}</p>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {ans.lines.map((l, i) => <li key={i} style={{ marginBottom: 6 }}>{l.text} {l.cite && <SourceLink src={m.sourceById.get(l.cite)} at={l.at} onOpen={ctx.openSource} />}</li>)}
            {ans.lines.length === 0 && <li>Nothing found for that.</li>}
          </ul>
          {ans.note && <p className="warn">{ans.note}</p>}
        </section>
      )}
    </>
  );
}
