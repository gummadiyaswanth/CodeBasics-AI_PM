import { useMemo, useState } from "react";
import Papa from "papaparse";
import type { Ctx } from "../App";
import type { UserState } from "../lib/engine";
import type { Proposal } from "../lib/types";
import { TODAY, ex } from "../data";
import { Memory, allProcessed, fmtDate } from "../lib/engine";
import { crm, sources } from "../data";
import { SourceLink } from "../ui";

const fieldName: Record<string, string> = {
  status: "Status", est_value_usd: "Est. value", owner: "Owner", notes: "Notes", service_interest: "Service",
  last_contact_date: "Last contact", next_followup_date: "Next follow-up", contact_email: "Contact email",
};
const show = (f: string, v: unknown) => (v === null || v === undefined || v === "" ? "(blank)" : f.endsWith("_date") ? fmtDate(String(v)) : f === "est_value_usd" ? `$${Number(v).toLocaleString()}` : String(v));

function download(name: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* download blocked in this context */ }
}

export function SyncView({ ctx, state }: { ctx: Ctx; state: UserState }) {
  const { m, dispatch } = ctx;
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const props = m.allProposals();
  const pending = props.filter((p) => !state.decisions[p.key!]);
  const shown = filter === "pending" ? pending : props;
  const byLead = new Map<string, Proposal[]>();
  for (const p of shown) byLead.set(p.lead_id, [...(byLead.get(p.lead_id) ?? []), p]);

  const before = useMemo(() => m.health(crm), [m]);
  const now = m.health(m.applied());
  const ifAll = useMemo(() => {
    const all: Record<string, "approved"> = {};
    for (const p of props) all[p.key!] = "approved";
    for (const n of ex.new_leads) all[`new:${n.account}`] = "approved";
    const mm = new Memory(crm, sources, ex, { ...state, decisions: { ...state.decisions, ...all } }, TODAY);
    return mm.health(mm.applied());
  }, [props, state]);
  void allProcessed;

  const safeKeys = pending.filter((p) => p.derived && p.confidence === "high").map((p) => p.key!);
  const decide = (key: string, v: "approved" | "rejected" | null) => dispatch({ t: "decide", key, v });

  const exportCsv = () => {
    download(`kaizen_crm_update_${TODAY}.csv`, Papa.unparse(m.applied()));
    const log = Object.entries(state.decisions).map(([key, v]) => {
      const p = props.find((x) => x.key === key);
      return { key, decision: v, field: p?.field ?? "", from: p?.from ?? "", to: p?.to ?? "", reason: p?.reason ?? "", evidence_source: p?.source ?? "", evidence_quote: p?.quote ?? "", decided_on: TODAY, decided_by: "founder (demo)" };
    });
    download(`recall_change_log_${TODAY}.csv`, Papa.unparse(log));
    ctx.toast("Exported the updated CRM and the change log");
  };

  return (
    <>
      <h1>Keep Kaizen honest without typing.</h1>
      <p className="lede">Every suggested change shows the words it came from. Nothing reaches the CRM until you approve it. Dates are worked out by rules from the conversations; status, value and notes are suggested by the AI.</p>
      <div className="health">
        <div><div className="big">{before.pct}%</div><div className="lbl">CRM up to date today</div></div>
        <div><div className="big">{now.pct}%</div><div className="lbl">after your approvals</div></div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="meter" aria-label={`CRM health ${now.pct} percent`}><i style={{ width: `${now.pct}%` }} /></div>
          <div className="lbl" style={{ marginTop: 6 }}>Live deals whose record has a next follow-up date and a current last-contact date: {now.ok} of {now.total}. Approving everything below reaches {ifAll.pct}%.</div>
        </div>
      </div>
      <div className="row">
        <button className="btn primary" disabled={!safeKeys.length} onClick={() => { dispatch({ t: "decideMany", keys: safeKeys }); ctx.toast(`Approved ${safeKeys.length} date fixes`); }}>
          Approve {safeKeys.length} rule-based date fixes
        </button>
        <button className="btn" onClick={exportCsv}>Export to Kaizen (CSV)</button>
        <span className="row" role="group" aria-label="Show">
          <button className="chip" aria-pressed={filter === "pending"} onClick={() => setFilter("pending")}>Pending ({pending.length})</button>
          <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({props.length})</button>
        </span>
      </div>
      <p className="small muted">AI suggestions (status, value, owner, notes) are never bulk-approved. Low-confidence ones are marked for a closer look.</p>

      <h2>Leads missing from the CRM</h2>
      <div className="panel">
        {ex.new_leads.map((n) => {
          const k = `new:${n.account}`; const d = state.decisions[k];
          return (
            <div className="line-item" key={k}>
              <div>
                <b>{n.company}</b> <span className="meta">{n.contact_name}, {n.contact_email}, {n.source}, owner {n.owner || "to assign"}</span>
                <div className="small">{n.notes}</div>
                <blockquote className="evidence"><q>{n.quote}</q><br /><SourceLink src={m.sourceById.get(n.evidence_source)} onOpen={ctx.openSource} /></blockquote>
                {!m.sourceById.get(n.evidence_source) && <span className="small warn">Pull in the channel items on Capture to see this source.</span>}
              </div>
              <Decide d={d} onApprove={() => decide(k, "approved")} onReject={() => decide(k, "rejected")} onUndo={() => decide(k, null)} approveLabel="Create lead" />
            </div>
          );
        })}
      </div>

      <h2>Possible duplicates</h2>
      <div className="panel">
        {m.duplicates().map(({ a, b, rule }) => {
          const k = `dup:${a.lead_id}/${b.lead_id}`; const d = state.decisions[k];
          return (
            <div className="line-item" key={k}>
              <div>
                <b>{a.company}</b> ({a.lead_id}, {a.owner || "no owner"}, {a.status}) and <b>{b.company}</b> ({b.lead_id}, {b.owner || "no owner"}, {b.status || "no status"})
                <div className="small muted">{rule}: {a.contact_email} / {b.contact_email}. {a.service_interest !== b.service_interest ? `Different services (${a.service_interest} vs ${b.service_interest}): consider keeping as a second opportunity on one account.` : "Same service: likely the same deal entered twice."}</div>
              </div>
              <Decide d={d} onApprove={() => decide(k, "approved")} onReject={() => decide(k, "rejected")} onUndo={() => decide(k, null)} approveLabel={`Merge into ${a.lead_id}`} rejectLabel="Keep both" />
            </div>
          );
        })}
      </div>

      <h2>Opportunities nobody logged</h2>
      <div className="panel">
        {ex.opportunities.map((o) => {
          const k = `opp:${o.lead_id}:${o.title}`; const d = state.decisions[k];
          return (
            <div className="line-item" key={k}>
              <div>
                <b>{o.title}</b> <span className="meta">{m.account(o.account).company}, {o.service}</span>
                <blockquote className="evidence"><q>{o.quote}</q><br /><SourceLink src={m.sourceById.get(o.source)} onOpen={ctx.openSource} /></blockquote>
              </div>
              <Decide d={d} onApprove={() => decide(k, "approved")} onReject={() => decide(k, "rejected")} onUndo={() => decide(k, null)} approveLabel="Log it" />
            </div>
          );
        })}
      </div>

      <h2>Field updates by lead</h2>
      {[...byLead.entries()].map(([lead, ps]) => {
        const row = m.crmById.get(lead);
        return (
          <section key={lead}>
            <div className="lead-h"><h3>{row?.company}</h3><span className="meta">{lead}, owner {row?.owner || "none"}, status {row?.status || "(blank)"}</span></div>
            <div className="panel" style={{ padding: "6px 10px" }}>
              <table className="diff">
                <thead><tr><th>Field</th><th>Now</th><th>Suggested</th><th>Why, and the evidence</th><th /></tr></thead>
                <tbody>
                  {ps.map((p) => {
                    const d = state.decisions[p.key!];
                    return (
                      <tr key={p.key} className={d ?? ""}>
                        <td>{fieldName[p.field] ?? p.field}<div className="small muted">{p.derived ? "rule" : "AI"}{p.confidence !== "high" ? `, ${p.confidence} confidence` : ""}</div></td>
                        <td className="from">{show(p.field, p.from)}</td>
                        <td className="to">{show(p.field, p.to)}</td>
                        <td>
                          <div className="small">{p.reason}</div>
                          <div className="small muted">“{p.quote}”</div>
                          <SourceLink src={m.sourceById.get(p.source)} onOpen={ctx.openSource} />
                        </td>
                        <td><Decide d={d} onApprove={() => decide(p.key!, "approved")} onReject={() => decide(p.key!, "rejected")} onUndo={() => decide(p.key!, null)} disabled={p.field === "contact_email" && !p.to} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {byLead.size === 0 && <p className="lede">No pending field updates. Export when you're ready.</p>}
    </>
  );
}

function Decide({ d, onApprove, onReject, onUndo, approveLabel = "Approve", rejectLabel = "Reject", disabled = false }:
  { d?: string; onApprove: () => void; onReject: () => void; onUndo: () => void; approveLabel?: string; rejectLabel?: string; disabled?: boolean }) {
  if (d) return <div className="row" style={{ flexWrap: "nowrap" }}><span className={`tag ${d === "approved" ? "ok" : ""}`}>{d}</span><button className="btn ghost small" onClick={onUndo}>Undo</button></div>;
  if (disabled) return <span className="small warn">Needs a human: add it in Kaizen</span>;
  return (
    <div className="row" style={{ flexWrap: "nowrap" }}>
      <button className="btn ok" onClick={onApprove}>{approveLabel}</button>
      <button className="btn ghost no" onClick={onReject}>{rejectLabel}</button>
    </div>
  );
}
