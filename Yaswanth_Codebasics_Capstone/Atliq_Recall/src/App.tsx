import { useEffect, useMemo, useReducer, useState } from "react";
import { Memory, emptyState, fmtDate, daysBetween, type UserState } from "./lib/engine";
import type { QueueItem, Signal, Source } from "./lib/types";
import { crm as crmData, sources as sourcesData, ex as extractionData, TODAY, gold } from "./data";
import { health, modelLabel } from "./lib/api";
import { ChannelIcon, Highlight, channelName } from "./ui";
import { TodayView } from "./views/Today";
import { CaptureView } from "./views/Capture";
import { SyncView } from "./views/Sync";
import { AccountsView } from "./views/Accounts";
import { AskView } from "./views/Ask";
import { TrustView } from "./views/Trust";
import { DraftModal } from "./views/Draft";


const KEY = "recall-state-v1";
function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch { /* storage unavailable: start fresh */ }
  return emptyState();
}
export type Action =
  | { t: "done"; ids: string[] } | { t: "snooze"; account: string; until: string }
  | { t: "decide"; key: string; v: "approved" | "rejected" | null } | { t: "decideMany"; keys: string[] }
  | { t: "capture"; source: Source; signals: Signal[] } | { t: "process"; ids: string[] } | { t: "reset" };
function reducer(s: UserState, a: Action): UserState {
  switch (a.t) {
    case "done": return { ...s, done: { ...s.done, ...Object.fromEntries(a.ids.map((i) => [i, TODAY])) } };
    case "snooze": return { ...s, snoozed: { ...s.snoozed, [a.account]: a.until } };
    case "decide": { const d = { ...s.decisions }; if (a.v) d[a.key] = a.v; else delete d[a.key]; return { ...s, decisions: d }; }
    case "decideMany": return { ...s, decisions: { ...s.decisions, ...Object.fromEntries(a.keys.map((k) => [k, "approved" as const])) } };
    case "capture": return { ...s, captured: [...s.captured, { source: a.source, signals: a.signals }] };
    case "process": return { ...s, processed: [...new Set([...(s.processed ?? []), ...a.ids])] };
    case "reset": return emptyState();
  }
}

export interface Ctx {
  m: Memory;
  live: boolean;
  dispatch: (a: Action) => void;
  openSource: (id: string) => void;
  openDraft: (q: QueueItem) => void;
  toast: (t: string) => void;
  go: (v: View, arg?: string) => void;
  arg?: string;
}
export type View = "today" | "capture" | "sync" | "accounts" | "ask" | "trust";

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [view, setView] = useState<View>("today");
  const [arg, setArg] = useState<string | undefined>();
  const [live, setLive] = useState(false);
  const [models, setModels] = useState<Record<string, string> | undefined>();
  const [srcOpen, setSrcOpen] = useState<string | null>(null);
  const [draftFor, setDraftFor] = useState<QueueItem | null>(null);
  const [toastMsg, setToast] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);
  useEffect(() => { health().then((h) => { setLive(h.live); setModels(h.models); }); }, []);
  useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toastMsg]);

  const m = useMemo(() => new Memory(crmData, sourcesData, extractionData, state, TODAY), [state]);
  const queue = useMemo(() => m.queue(), [m]);
  const pendingProps = m.allProposals().filter((p) => !state.decisions[p.key!]).length;

  const ctx: Ctx = {
    m, live, dispatch, arg,
    openSource: setSrcOpen, openDraft: setDraftFor, toast: setToast,
    go: (v, a) => { setView(v); setArg(a); window.scrollTo(0, 0); },
  };
  const nav: [View, string, number | null][] = [
    ["today", "Today", queue.length], ["capture", "Capture", m.pending.length || null], ["sync", "CRM sync", pendingProps || null],
    ["accounts", "Accounts", null], ["ask", "Ask", null], ["trust", "How it works", null],
  ];

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <div className="brand">Recall<small>Sales memory for Kaizen CRM</small></div>
        {nav.map(([v, label, n]) => (
          <button key={v} className="nav" aria-current={view === v ? "page" : undefined} onClick={() => ctx.go(v)}>
            {label}{n != null && <span className="count">{n}</span>}
          </button>
        ))}
        <div className="rail-foot">
          <span className={`mode ${live ? "live" : ""}`}>{live ? "Live AI on" : "Offline demo"}</span>
          <span>{live && models ? `New text is read by ${modelLabel(models.extract)}; drafts and answers by ${modelLabel(models.draft)}.` : "Seeded AI results for the dataset. Add GEMINI_API_KEY (free tier) or ANTHROPIC_API_KEY on Vercel for live capture, drafts and answers."}</span>
          <span>Dataset date: {fmtDate(TODAY)} 2026</span>
          <button className="btn ghost small" onClick={() => { dispatch({ t: "reset" }); setToast("Demo reset"); }}>Reset demo</button>
        </div>
      </nav>
      <main>
        {view === "today" && <TodayView ctx={ctx} queue={queue} />}
        {view === "capture" && <CaptureView ctx={ctx} />}
        {view === "sync" && <SyncView ctx={ctx} state={state} />}
        {view === "accounts" && <AccountsView ctx={ctx} queue={queue} />}
        {view === "ask" && <AskView ctx={ctx} />}
        {view === "trust" && <TrustView ctx={ctx} />}
      </main>
      {srcOpen && <SourceModal m={m} id={srcOpen} onClose={() => setSrcOpen(null)} />}
      {draftFor && <DraftModal ctx={ctx} item={draftFor} onClose={() => setDraftFor(null)} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}

function SourceModal({ m, id, onClose }: { m: Memory; id: string; onClose: () => void }) {
  const [showGt, setShowGt] = useState(false);
  const src = m.sourceById.get(id) ?? sourcesData.find((s) => s.id === id);
  if (!src) return null;
  const quotes = m.signals.filter((s) => s.source === id).map((s) => s.quote);
  const notes = gold[id] ?? [];
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={src.title} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="row"><span className="ch"><ChannelIcon c={src.channel} /></span><span className="muted small">{channelName[src.channel]}, {fmtDate(src.date)} ({daysBetween(src.date, TODAY)} days ago)</span></span>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <h2 style={{ marginTop: 10 }}>{src.title.replace(/^#\s*/, "")}</h2>
        <p className="small muted">Highlighted text is what the AI extracted. Every highlight is checked to appear word for word in this source.</p>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14 }}><Highlight text={src.body.replace(/^#.*\n/, "")} quote={quotes} /></pre>
        {notes.length > 0 && (
          <div>
            <button className="btn ghost small" onClick={() => setShowGt(!showGt)}>{showGt ? "Hide" : "Show"} dataset ground truth</button>
            {showGt && <div className="gt">Editorial notes from the dataset author. The AI never sees these; they are used only to evaluate it.<ul>{notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>}
          </div>
        )}
      </div>
    </div>
  );
}
