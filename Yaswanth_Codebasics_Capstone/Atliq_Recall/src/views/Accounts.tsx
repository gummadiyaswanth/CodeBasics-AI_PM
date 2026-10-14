import { useState } from "react";
import type { Ctx } from "../App";
import type { QueueItem } from "../lib/types";
import { TODAY, gold } from "../data";
import { fmtDate, money } from "../lib/engine";
import { whereWeStand } from "../lib/offline";
import { ChannelIcon, Highlight, SourceLink, channelName } from "../ui";

export function AccountsView({ ctx, queue }: { ctx: Ctx; queue: QueueItem[] }) {
  const { m } = ctx;
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>(ctx.arg ?? queue[0]?.account ?? "finedge");
  const [gt, setGt] = useState(false);
  const keys = Object.keys(m.ex.accounts).filter((k) => k !== "techsummit" && m.signalsFor(k).length > 0);
  const scoreOf = (k: string) => queue.find((x) => x.account === k)?.score ?? 0;
  const list = keys.filter((k) => m.account(k).company.toLowerCase().includes(q.toLowerCase())).sort((a, b) => scoreOf(b) - scoreOf(a));
  const acct = m.account(sel);
  const lead = m.primaryLead(sel);
  const item = queue.find((x) => x.account === sel);
  const stand = whereWeStand(m, sel);
  const srcIds = [...new Set(m.signalsFor(sel).map((s) => s.source))];
  const timeline = srcIds.map((id) => m.sourceById.get(id)!).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));
  const pend = m.allProposals().filter((p) => acct.leads.includes(p.lead_id));

  return (
    <>
      <h1>{acct.company}</h1>
      <p className="lede">
        {lead ? <>{lead.lead_id}, owner {lead.owner || "none"}, {lead.contact_name}{lead.contact_email ? ` (${lead.contact_email})` : ""}. CRM says <b>{lead.status || "no status"}</b>, last contact {lead.last_contact_date ? fmtDate(lead.last_contact_date) : "never"}.</> : <b>Not in the CRM yet.</b>}{" "}
        {item && <>Priority {item.score} ({item.band}), waiting {item.daysWaiting} days.</>}
      </p>
      <div className="cols">
        <section>
          <div className="panel">
            <h3>Where we stand</h3>
            <p className="small muted" style={{ margin: "2px 0 8px" }}>Built only from the conversations below. Each line links to its source.</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {stand.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s.text} <SourceLink src={m.sourceById.get(s.cite)} at={s.at} onOpen={ctx.openSource} /></li>)}
              {stand.length === 0 && <li>No signals captured yet.</li>}
            </ul>
            {item && <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={() => ctx.openDraft(item)}>Draft follow-up</button></div>}
          </div>
          {pend.length > 0 && (
            <div className="panel" style={{ marginTop: 14 }}>
              <h3>CRM is out of date on {pend.length} {pend.length === 1 ? "field" : "fields"}</h3>
              <ul className="small" style={{ paddingLeft: 18 }}>
                {pend.map((p) => <li key={p.key}>{p.field === "notes" ? <>add note: <b>{String(p.to)}</b></> : <>{p.field.replace(/_/g, " ")}: {p.field.endsWith("_date") ? (p.from ? fmtDate(String(p.from)) : "(blank)") : String(p.from || "(blank)")} → <b>{p.field === "est_value_usd" ? money(Number(p.to)) : p.field.endsWith("_date") ? fmtDate(String(p.to)) : String(p.to)}</b></>}</li>)}
              </ul>
              <button className="btn" onClick={() => ctx.go("sync")}>Review in CRM sync</button>
            </div>
          )}
          <h2>Conversations ({timeline.length})</h2>
          <div className="row" style={{ marginBottom: 8 }}>
            <button className="btn ghost small" onClick={() => setGt(!gt)}>{gt ? "Hide" : "Show"} dataset ground truth</button>
          </div>
          <div className="timeline">
            {timeline.map((s) => (
              <details className="srccard" key={s.id}>
                <summary>
                  <span className="ch"><ChannelIcon c={s.channel} /></span>
                  <span><b className="small">{s.title.replace(/^[^:—]+[:—]\s*/, "")}</b><br /><span className="meta">{channelName[s.channel]}, {fmtDate(s.date)}</span></span>
                </summary>
                <pre><Highlight text={s.body.replace(/^#.*\n/, "")} quote={m.signals.filter((x) => x.source === s.id).map((x) => x.quote)} /></pre>
                {gt && (gold[s.id] ?? []).length > 0 && <div className="gt">Not visible to the AI: {(gold[s.id] ?? []).join(" ")}</div>}
              </details>
            ))}
          </div>
        </section>
        <section className="panel">
          <input type="text" placeholder="Find an account" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find an account" />
          <div className="list" style={{ marginTop: 8, maxHeight: "70vh", overflow: "auto" }}>
            {list.map((k) => {
              const it = queue.find((x) => x.account === k);
              return (
                <button key={k} className="nav" aria-current={k === sel ? "page" : undefined} onClick={() => { setSel(k); window.scrollTo(0, 0); }}>
                  <span>{m.account(k).company}{m.account(k).leads.length === 0 && <span className="tag late" style={{ marginLeft: 6 }}>new</span>}</span>
                  {it ? <span className={`tag ${it.band === "P1" ? "late" : it.band === "P2" ? "soon" : ""}`}>{it.band}</span> : <span className="tag ok">clear</span>}
                </button>
              );
            })}
          </div>
          <p className="small muted">Dataset date {fmtDate(TODAY)} 2026.</p>
        </section>
      </div>
    </>
  );
}
