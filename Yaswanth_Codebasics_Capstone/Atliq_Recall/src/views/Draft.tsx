import { useEffect, useState } from "react";
import type { Ctx } from "../App";
import type { QueueItem } from "../lib/types";
import { TODAY, drafts } from "../data";
import { draftLive, modelLabel } from "../lib/api";
import { templateDraft } from "../lib/offline";
import { SourceLink } from "../ui";

export function DraftModal({ ctx, item, onClose }: { ctx: Ctx; item: QueueItem; onClose: () => void }) {
  const { m } = ctx;
  const seeded = drafts[item.account];
  const [text, setText] = useState("");
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function go() {
      if (ctx.live) {
        try {
          const ids = [...new Set(item.loops.map((l) => l.source))].slice(0, 4);
          const r = await draftLive({
            company: item.company, contactName: item.contactName, owner: item.owner, channel: seeded?.channel ?? "email", today: TODAY,
            loops: item.loops.map((l) => ({ summary: l.summary, quote: l.quote, due: l.due })),
            excerpts: ids.map((id) => { const s = m.sourceById.get(id)!; return { id, date: s.date, body: s.body }; }),
          });
          if (!cancelled) { setText(r.draft); setMode(`Written by ${modelLabel(r.model)} from ${ids.length} conversation(s)`); setBusy(false); }
          return;
        } catch (e: any) {
          if (!cancelled) setMode(`AI call failed (${e.message}). `);
        }
      }
      if (cancelled) return;
      if (seeded) { setText((seeded.subject ? `Subject: ${seeded.subject}\n\n` : "") + seeded.body); setMode((x) => x + "Pre-generated AI draft for the demo dataset"); }
      else { setText(templateDraft(item.company, item.contactName, item.owner, item.loops)); setMode((x) => x + "Template (no AI key): fill the brackets"); }
      setBusy(false);
    }
    go();
    return () => { cancelled = true; };
  }, [item.account]);

  const holes = (text.match(/\[[^\]]+\]/g) || []).length;
  const subject = text.match(/^Subject: (.*)$/m)?.[1] ?? "";
  const body = text.replace(/^Subject: .*\n+/, "");
  const to = seeded?.to?.includes("@") ? seeded.to : item.contactEmail;
  const channel = seeded?.channel ?? "email";

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Draft for ${item.company}`} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Follow-up to {item.contactName || item.company}</h2>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <p className="small muted">{channel === "email" ? `Email to ${to || "(no address on file)"}` : `${channel === "whatsapp" ? "WhatsApp" : "iMessage"} to ${seeded?.to}`}, from {item.owner}. {busy ? "Writing..." : mode}.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Draft text" disabled={busy} />
        {holes > 0 ? <p className="warn">{holes} bracketed {holes === 1 ? "gap" : "gaps"} to fill. Recall leaves facts it can't find as brackets instead of guessing.</p> : !busy && <p className="small" style={{ color: "var(--ok)" }}>No gaps left. Read it once more, then send it yourself.</p>}
        <div className="note" style={{ margin: "8px 0" }}>
          Based on: {item.loops.map((l) => <span key={l.id} style={{ marginRight: 10 }}><SourceLink src={m.sourceById.get(l.source)} at={l.raised} onOpen={ctx.openSource} /></span>)}
        </div>
        <div className="row">
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(text).then(() => ctx.toast("Copied"), () => ctx.toast("Copy blocked: select the text instead")); }}>Copy</button>
          {channel === "email" && (
            <a className="btn primary" aria-disabled={holes > 0} style={holes > 0 ? { pointerEvents: "none", opacity: 0.45 } : {}}
              href={`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open in email</a>
          )}
          <button className="btn ok" disabled={holes > 0} onClick={() => { ctx.dispatch({ t: "done", ids: item.loops.map((l) => l.id) }); ctx.toast(`${item.company} marked as replied`); onClose(); }}>I've sent it</button>
        </div>
        <p className="small muted">Recall never sends anything itself. Marking it sent clears these open items and sets the follow-up clock.</p>
      </div>
    </div>
  );
}
