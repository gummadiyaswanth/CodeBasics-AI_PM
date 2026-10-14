import { useState } from "react";
import type { Ctx } from "../App";
import type { QueueItem } from "../lib/types";
import { TODAY } from "../data";
import { fmtDate, money } from "../lib/engine";
import { DueTag, SourceLink, WaitBar } from "../ui";

const OWNERS = ["Everyone", "Bhavin", "Dhaval", "Karandeep", "Jay", "Unassigned"];
const typeLabel: Record<string, string> = { client_request: "They asked", commitment: "We promised", deadline: "Their deadline", revisit: "Revisit" };

export function TodayView({ ctx, queue }: { ctx: Ctx; queue: QueueItem[] }) {
  const [owner, setOwner] = useState("Everyone");
  const [showLater, setShowLater] = useState(false);
  const { m } = ctx;
  const q = owner === "Everyone" ? queue : queue.filter((x) => x.owner === owner);
  const p1 = q.filter((x) => x.band === "P1"), p2 = q.filter((x) => x.band === "P2"), p3 = q.filter((x) => x.band === "P3");
  const longest = [...q].filter((x) => x.band !== "P3").sort((a, b) => b.daysWaiting - a.daysWaiting)[0];
  const atRisk = q.filter((x) => x.band !== "P3").reduce((a, x) => a + (x.value ?? 0), 0);
  const quiet = m.goneQuiet();
  const upcoming = m.upcoming();
  const subject = owner === "Everyone" ? "AtliQ" : owner;

  return (
    <>
      <h1>
        {q.length} {q.length === 1 ? "client is" : "clients are"} waiting on {subject}.{" "}
        <span className="quiet">{p1.length} {p1.length === 1 ? "is" : "are"} urgent.</span>
      </h1>
      <p className="lede">
        Read from email, meeting notes, WhatsApp, iMessage, Slack, call summaries and voice memos, then ranked by your rules:
        urgency, deal value, competition and relationship. {atRisk > 0 && <>{money(atRisk)} of known deal value sits in the urgent and next lists. </>}
        {longest && <>Longest wait among them: {longest.company}, {longest.daysWaiting} days.</>}
      </p>
      {m.pending.length > 0 && (
        <div className="note" style={{ marginBottom: 14 }}>
          {m.pending.length} new items from WhatsApp, iMessage, Slack, a call summary and a voice memo aren't in memory yet.{" "}
          <button className="btn small" onClick={() => ctx.go("capture")}>Review them</button>
        </div>
      )}
      <div className="row" role="group" aria-label="Filter by owner">
        {OWNERS.map((o) => (
          <button key={o} className="chip" aria-pressed={owner === o} onClick={() => setOwner(o)}>{o}</button>
        ))}
      </div>

      {q.length === 0 && <p className="lede" style={{ marginTop: 20 }}>Nobody is waiting on {subject}. Capture a call or message to keep it that way.</p>}
      {p1.length > 0 && <><h2>Urgent</h2><List items={p1} start={1} ctx={ctx} /></>}
      {p2.length > 0 && <><h2>Next</h2><List items={p2} start={p1.length + 1} ctx={ctx} /></>}
      {p3.length > 0 && (
        <>
          <h2>Later</h2>
          {showLater ? <List items={p3} start={p1.length + p2.length + 1} ctx={ctx} /> :
            <button className="btn" onClick={() => setShowLater(true)}>Show {p3.length} lower-priority clients</button>}
        </>
      )}

      <div className="cols" style={{ marginTop: 30 }}>
        <section className="panel">
          <h3>Booked and coming up</h3>
          <div className="list" style={{ marginTop: 8 }}>
            {upcoming.map(({ signal: s, company, days }) => (
              <div className="line-item" key={s.id}>
                <div>
                  <b>{company}</b> <span className="meta">{s.owner}</span>
                  <div className="small">{s.summary}</div>
                  <SourceLink src={m.sourceById.get(s.source)} at={s.raised} onOpen={ctx.openSource} />
                </div>
                <div style={{ textAlign: "right" }}>
                  {s.status === "needs_outcome" ? <span className="tag soon">log outcome</span> : <span className="tag ok">{days === 0 ? "today" : `in ${days}d`}</span>}
                  {s.status === "needs_outcome" && <div><button className="btn small" style={{ marginTop: 6 }} onClick={() => ctx.go("capture", s.account)}>Add notes</button></div>}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h3>Gone quiet: the ball is in their court</h3>
          <p className="small muted" style={{ margin: "4px 0 6px" }}>Not urgent, but someone should decide: nudge or close.</p>
          <div className="list">
            {quiet.map(({ signal: s, company, days, competition }) => (
              <div className="line-item" key={s.id}>
                <div>
                  <b>{company}</b> <span className="meta">{s.owner}, silent {days} days</span>
                  <div className="small">{competition === "much_lower" ? "A rival quoted far below us. Your rule: don't chase on price. Suggest closing as lost." : "Suggest one short nudge, then close if there's no reply in a week."}</div>
                  <SourceLink src={m.sourceById.get(s.source)} at={s.raised} onOpen={ctx.openSource} />
                </div>
                <button className="btn ghost small" onClick={() => { ctx.dispatch({ t: "done", ids: [s.id] }); ctx.toast(`${company} cleared from the list`); }}>Clear</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function List({ items, start, ctx }: { items: QueueItem[]; start: number; ctx: Ctx }) {
  return <div className="queue">{items.map((it, i) => <Item key={it.account} it={it} rank={start + i} ctx={ctx} />)}</div>;
}

function Item({ it, rank, ctx }: { it: QueueItem; rank: number; ctx: Ctx }) {
  const [why, setWhy] = useState(false);
  const [all, setAll] = useState(false);
  const { m } = ctx;
  const top = it.loops.find((l) => l.type === "client_request" && l.due && l.due >= TODAY) ?? it.loops.find((l) => l.type === "client_request") ?? it.loops[0];
  const others = it.loops.filter((l) => l !== top);
  return (
    <article className={`item ${it.band.toLowerCase()}`} aria-label={`${it.company}, ${it.band}`}>
      <div className="item-head">
        <div className="rank">{rank}</div>
        <div>
          <div className="who">
            <h3>{it.company}</h3>
            <span className="meta">{it.owner}{it.contactName ? `, with ${it.contactName}` : ""}</span>
          </div>
          <div className="row" style={{ marginTop: 4, gap: 6 }}>
            <span className={`tag ${it.band === "P1" ? "late" : it.band === "P2" ? "soon" : ""}`}>{it.band}</span>
            <span className="tag">waiting {it.daysWaiting}d</span>
            <DueTag due={it.nextDue} today={TODAY} />
            {it.value != null && <span className="tag acc">{money(it.value)}</span>}
            {!it.inCrm && <span className="tag late">not in CRM</span>}
          </div>
        </div>
        <div className="score"><b>{it.score}</b><span>priority</span></div>
      </div>
      <div className="ask">
        <p><b>{typeLabel[top.type] ?? "Open"}:</b> {top.summary}</p>
        <blockquote className="evidence"><q>{top.quote}</q><br /><SourceLink src={m.sourceById.get(top.source)} at={top.raised} onOpen={ctx.openSource} /></blockquote>
      </div>
      <WaitBar loops={it.loops} today={TODAY} />
      {why && (
        <div className="breakdown" aria-label="Why this rank">
          {it.parts.map((p) => (
            <div className="bd-row" key={p.label}>
              <span>{p.label} <b>{Math.round(p.points)}</b>/{p.max}</span>
              <span className="bd-bar"><i style={{ width: `${(p.points / p.max) * 100}%` }} /></span>
              <span className="bd-why muted">{p.why}</span>
            </div>
          ))}
        </div>
      )}
      {all && others.length > 0 && (
        <div className="loops">
          {others.map((l) => (
            <div className="loop" key={l.id}>
              <div>
                <b>{typeLabel[l.type] ?? "Open"}:</b> {l.summary} <DueTag due={l.due} today={TODAY} />
                <div><SourceLink src={m.sourceById.get(l.source)} at={l.raised} onOpen={ctx.openSource} /></div>
              </div>
              <button className="btn ghost small" onClick={() => { ctx.dispatch({ t: "done", ids: [l.id] }); ctx.toast("Marked handled"); }}>Handled</button>
            </div>
          ))}
        </div>
      )}
      <div className="actions">
        <button className="btn primary" onClick={() => ctx.openDraft(it)}>Draft follow-up</button>
        <button className="btn" onClick={() => setWhy(!why)} aria-expanded={why}>Why #{rank}</button>
        {others.length > 0 && <button className="btn" onClick={() => setAll(!all)} aria-expanded={all}>{all ? "Hide" : "Show"} {others.length} more open {others.length === 1 ? "item" : "items"}</button>}
        <button className="btn ghost" onClick={() => ctx.go("accounts", it.account)}>Open account</button>
        <button className="btn ghost" onClick={() => { ctx.dispatch({ t: "snooze", account: it.account, until: addDays(TODAY, 2) }); ctx.toast(`${it.company} snoozed until ${fmtDate(addDays(TODAY, 2))}`); }}>Snooze 2 days</button>
      </div>
    </article>
  );
}
export const addDays = (d: string, n: number) => new Date(new Date(d + "T00:00:00Z").getTime() + n * 86400000).toISOString().slice(0, 10);
