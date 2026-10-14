import { useState } from "react";
import type { Ctx } from "../App";
import type { Signal, Source } from "../lib/types";
import { TODAY, ex } from "../data";
import { fmtDate } from "../lib/engine";
import { extractLive, modelLabel } from "../lib/api";
import { offlineExtract, matchAccount } from "../lib/offline";
import { ChannelIcon, Highlight, channelName, DueTag } from "../ui";

const typeName: Record<string, string> = {
  client_request: "They asked", commitment: "We promised", deadline: "Deadline", meeting: "Meeting", budget: "Budget",
  competitor: "Competition", cross_sell: "Cross-sell", renewal: "Renewal", referral: "Referral", stakeholder: "Stakeholder",
  new_lead: "New lead", status_signal: "Deal moved", need: "Need", followup: "Follow-up", revisit: "Revisit",
};

export function CaptureView({ ctx }: { ctx: Ctx }) {
  const { m } = ctx;
  const [justPulled, setJustPulled] = useState<string[]>([]);
  const [text, setText] = useState(ctx.arg ? `Notes from the ${m.account(ctx.arg).company} call: ` : "");
  const [channel, setChannel] = useState(ctx.arg ? "call_summary" : "voice_memo");
  const [owner, setOwner] = useState("Karandeep");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ signals: Signal[]; dropped: { quote: string }[]; mode: string; account: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const pull = (ids: string[]) => {
    ctx.dispatch({ t: "process", ids });
    const n = ex.signals.filter((s) => ids.includes(s.source)).length;
    setJustPulled((p) => [...p, ...ids]);
    ctx.toast(`${n} signals added to memory`);
  };

  async function run() {
    setBusy(true); setErr(null); setResult(null);
    try {
      if (ctx.live) {
        const r = await extractLive(text, channel, TODAY, Object.values(m.ex.accounts).map((a) => a.company));
        const acct = matchAccount(r.company || text, m.ex.accounts) ?? (r.company || "unassigned").toLowerCase().replace(/[^a-z]/g, "").slice(0, 12);
        const signals: Signal[] = r.signals.map((s: any, i: number) => {
          const open = ["client_request", "commitment", "deadline"].includes(s.type) && s.waiting_on === "us";
          return { id: `cap-${Date.now()}-${i}`, source: "", account: acct, type: s.type, summary: s.summary, quote: s.quote, raised: TODAY,
            due: s.due, owner: s.owner ?? owner, value_usd: s.value_usd, status: s.type === "meeting" ? "scheduled" : open ? "open" : "info", waiting_on: open ? "us" : null };
        });
        setResult({ signals, dropped: r.dropped, mode: modelLabel(r.model), account: acct });
      } else {
        const r = offlineExtract(text, channel, TODAY, m.ex.accounts, owner);
        setResult({ signals: r.signals.map((s, i) => ({ ...s, id: `cap-${Date.now()}-${i}` })), dropped: [], mode: "Offline rules (no AI key)", account: r.account });
      }
    } catch (e: any) {
      setErr(`${e.message}. Nothing was saved; your text is still here.`);
    }
    setBusy(false);
  }
  function save() {
    if (!result) return;
    const id = `capture-${Date.now()}`;
    const source: Source = { id, folder: "capture", channel: "capture", date: TODAY, title: `${channelName[channel]} captured by ${owner}`, body: text };
    ctx.dispatch({ t: "capture", source, signals: result.signals.map((s) => ({ ...s, source: id })) });
    ctx.toast(`Saved ${result.signals.length} signals to memory`);
    setResult(null); setText("");
  }

  return (
    <>
      <h1>Get it out of your head and into memory.</h1>
      <p className="lede">Forward, paste or dictate anything from a call or chat. Recall pulls out who asked what, what you promised, and by when, and quotes the exact words so you can check it.</p>
      <div className="cols">
        <section className="panel">
          <h3>New from your other channels</h3>
          <p className="small muted" style={{ margin: "4px 0 10px" }}>These arrived outside email. In production they flow in through WhatsApp Business, Slack, Teams/read.ai and phone dictation. Pull them in to see what changes.</p>
          {m.pending.length === 0 && <p className="small">All caught up. Everything from your channels is in memory.</p>}
          <div className="list">
            {m.pending.map((s) => (
              <div className="line-item" key={s.id}>
                <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <span className="ch"><ChannelIcon c={s.channel} /></span>
                  <div>
                    <b>{s.title.replace(/^[^:]+:\s*/, "")}</b>
                    <div className="meta">{channelName[s.channel]}, {fmtDate(s.date)}</div>
                  </div>
                </div>
                <button className="btn" onClick={() => pull([s.id])}>Pull in</button>
              </div>
            ))}
          </div>
          {m.pending.length > 1 && <button className="btn primary" style={{ marginTop: 10 }} onClick={() => pull(m.pending.map((s) => s.id))}>Pull in all {m.pending.length}</button>}
          {justPulled.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>What was added</h3>
              {justPulled.map((id) => {
                const src = m.sourceById.get(id);
                const sigs = m.signals.filter((s) => s.source === id);
                return (
                  <div key={id} style={{ marginTop: 10 }}>
                    <button className="src" onClick={() => ctx.openSource(id)}><ChannelIcon c={src?.channel ?? "capture"} /> {src?.title}</button>
                    <SignalList signals={sigs} m={ctx} />
                  </div>
                );
              })}
              <button className="btn" style={{ marginTop: 10 }} onClick={() => ctx.go("today")}>See updated priorities</button>
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Quick capture</h3>
          <div className="row" style={{ margin: "10px 0", flexWrap: "nowrap" }}>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Channel">
              {["voice_memo", "whatsapp", "imessage", "slack", "call_summary", "email"].map((c) => <option key={c} value={c}>{channelName[c]}</option>)}
            </select>
            <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Captured by">
              {["Bhavin", "Dhaval", "Karandeep", "Jay"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Just spoke to Neha at GlobalMart. She'll take the phased option if Phase 1 lands under 50k, and wants the revised proposal by Wednesday the 15th." aria-label="Text to capture" />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" disabled={!text.trim() || busy} onClick={run}>{busy ? "Reading..." : "Extract"}</button>
            <button className="btn ghost" onClick={() => { setText("Just spoke to Neha at GlobalMart on a WhatsApp call. She'll take the phased option if Phase 1 lands under 50k, and wants the revised proposal by Wednesday the 15th. Her supply chain colleague still wants to talk about demand forecasting. I'll send the proposal by Tuesday."); setChannel("voice_memo"); setOwner("Karandeep"); }}>Use an example</button>
          </div>
          {err && <p className="warn" role="alert">{err}</p>}
          {result && (
            <div style={{ marginTop: 14 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="small muted">Read by {result.mode}. Account: <b>{result.account ? m.account(result.account).company : "not matched"}</b></span>
              </div>
              {result.signals.length === 0 && <p className="small">No sales signals found. Nothing to save.</p>}
              <SignalList signals={result.signals} m={ctx} text={text} />
              {result.dropped.length > 0 && <p className="warn">{result.dropped.length} item(s) dropped: the quoted words weren't found in your text.</p>}
              {!result.account && <p className="warn">No known account matched. Mention the company name, or this will be filed as a new lead for review.</p>}
              {result.signals.length > 0 && <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={save}>Save to memory</button><button className="btn ghost" onClick={() => setResult(null)}>Discard</button></div>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function SignalList({ signals, m, text }: { signals: Signal[]; m: Ctx; text?: string }) {
  return (
    <div className="list" style={{ marginTop: 6 }}>
      {signals.map((s) => (
        <div key={s.id} className="line-item">
          <div>
            <span className="tag acc">{typeName[s.type] ?? s.type}</span> <span className="small">{s.summary}</span> <DueTag due={s.due} today={TODAY} />
            <blockquote className="evidence"><q>{text ? <Highlight text={s.quote} quote={s.quote} /> : s.quote}</q></blockquote>
          </div>
          <span className="meta">{s.owner ?? ""}</span>
        </div>
      ))}
      {void m}
    </div>
  );
}
