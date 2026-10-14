import type { ReactNode } from "react";
import type { Channel, Signal, Source } from "./lib/types";
import { daysBetween, fmtDate } from "./lib/engine";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export function ChannelIcon({ c }: { c: Channel | string }) {
  const paths: Record<string, ReactNode> = {
    email: <><rect x="3" y="5" width="18" height="14" rx="2" {...P} /><path d="M3 7l9 6 9-6" {...P} /></>,
    meeting_note: <><path d="M6 3h9l4 4v14H6z" {...P} /><path d="M9 11h7M9 15h7M9 7h4" {...P} /></>,
    whatsapp: <><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" {...P} /><path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1-1.2 2 .9c-.3 1.3-1.3 2-2.6 1.8C11 15 9 13 8.5 10.1c-.2-1.3.5-2.3 1.8-2.6l.9 2z" {...P} strokeWidth={1.2} /></>,
    imessage: <><path d="M12 4c4.9 0 9 3.1 9 7s-4.1 7-9 7c-1 0-2-.1-2.9-.4L5 19.5l1-3.3C4.2 14.9 3 13 3 11c0-3.9 4.1-7 9-7z" {...P} /></>,
    slack: <><path d="M9 3v8M15 13v8M3 15h8M13 9h8" {...P} strokeWidth={2.4} /></>,
    call_summary: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" {...P} /></>,
    voice_memo: <><rect x="9" y="3" width="6" height="11" rx="3" {...P} /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...P} /></>,
    capture: <><path d="M12 5v14M5 12h14" {...P} /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[c] ?? paths.meeting_note}</svg>;
}
export const channelName: Record<string, string> = {
  email: "Email", meeting_note: "Meeting note", whatsapp: "WhatsApp", imessage: "iMessage", slack: "Slack",
  call_summary: "Call summary", voice_memo: "Voice memo", capture: "Quick capture",
};

export function SourceLink({ src, onOpen, at }: { src: Source | undefined; onOpen: (id: string) => void; at?: string }) {
  if (!src) return null;
  return (
    <button className="src" onClick={() => onOpen(src.id)} title={src.title}>
      <ChannelIcon c={src.channel} /> {channelName[src.channel]}, {fmtDate(at ?? src.date)}
    </button>
  );
}

export function DueTag({ due, today }: { due: string | null; today: string }) {
  if (!due) return null;
  const d = daysBetween(today, due);
  if (d < 0) return <span className="tag late">{-d}d overdue</span>;
  if (d === 0) return <span className="tag late">due today</span>;
  if (d <= 5) return <span className="tag soon">due {fmtDate(due)}</span>;
  return <span className="tag">due {fmtDate(due)}</span>;
}

// The signature element: how long the client has waited, and where the deadline sits.
export function WaitBar({ loops, today }: { loops: Signal[]; today: string }) {
  const PAST = 42, FUTURE = 21, span = PAST + FUTURE;
  const pos = (d: string) => Math.min(100, Math.max(0, ((daysBetween(today, d) + PAST) / span) * 100));
  const starts = loops.filter((l) => l.type !== "deadline").map((l) => (l.type === "revisit" ? l.due ?? l.raised : l.raised));
  const start = starts.sort()[0];
  const dues = [...new Set(loops.map((l) => l.due).filter(Boolean) as string[])];
  const todayX = pos(today);
  const waited = start ? daysBetween(start, today) : 0;
  return (
    <div className="wait" aria-label={start ? `Waiting ${waited} days` : "Upcoming deadline"}>
      <div className="wait-track">
        <div className="wait-axis" />
        {start && <div className={`wait-bar ${waited >= 14 ? "long" : ""}`} style={{ left: `${pos(start)}%`, width: `${Math.max(1, todayX - pos(start))}%` }} />}
        <div className="wait-today" style={{ left: `${todayX}%` }} />
        {dues.map((d) => <div key={d} className={`wait-due ${d < today ? "passed" : ""}`} style={{ left: `${pos(d)}%` }} title={`Due ${fmtDate(d)}`} />)}
      </div>
      <div className="wait-legend"><span>{waited > PAST ? `${waited} days ago` : "6 weeks ago"}</span><span>today</span><span>+3 weeks</span></div>
    </div>
  );
}

export function Highlight({ text, quote }: { text: string; quote?: string | string[] }) {
  const qs = (Array.isArray(quote) ? quote : quote ? [quote] : []).filter((q) => q && text.includes(q));
  if (!qs.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let rest = text, k = 0;
  while (rest) {
    let best = -1, bq = "";
    for (const q of qs) { const i = rest.indexOf(q); if (i >= 0 && (best < 0 || i < best)) { best = i; bq = q; } }
    if (best < 0) { parts.push(rest); break; }
    parts.push(rest.slice(0, best), <mark key={k++}>{bq}</mark>);
    rest = rest.slice(best + bq.length);
  }
  return <>{parts}</>;
}
