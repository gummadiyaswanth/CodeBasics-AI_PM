// Parses the raw AtliQ dataset (CRM CSV + markdown emails, notes and channel extension)
// into JSON the app and the eval use. Editorial "*( ... )*" lines are ground truth written
// by the dataset author: they are stripped from what the AI sees and kept for evaluation only.
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const DATA = path.resolve("data");
const OUT = path.resolve("src/generated");
fs.mkdirSync(OUT, { recursive: true });

// ---------- CRM ----------
const csv = fs.readFileSync(path.join(DATA, "crm_export.csv"), "utf8");
const crm = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data.map((r) => ({
  ...r,
  est_value_usd: r.est_value_usd ? Number(r.est_value_usd) : null,
}));
fs.writeFileSync(path.join(OUT, "crm.json"), JSON.stringify(crm, null, 2));

// ---------- Sources ----------
type Channel = "email" | "meeting_note" | "imessage" | "whatsapp" | "slack" | "call_summary" | "voice_memo";
const EDITORIAL = /\*\(([^)]*(?:\([^)]*\)[^)]*)*)\)\*/g;

function channelOf(folder: string, text: string): Channel {
  if (folder === "emails") return "email";
  if (folder === "meeting_notes") return "meeting_note";
  const c = (text.match(/\*\*Channel:\*\*\s*(.+)/)?.[1] || "").toLowerCase();
  if (c.includes("imessage")) return "imessage";
  if (c.includes("whatsapp")) return "whatsapp";
  if (c.includes("slack")) return "slack";
  if (c.includes("voice")) return "voice_memo";
  return "call_summary";
}

const sources: any[] = [];
const gold: Record<string, string[]> = {};
for (const folder of ["emails", "meeting_notes", "extension"]) {
  for (const f of fs.readdirSync(path.join(DATA, folder)).filter((x) => x.endsWith(".md")).sort()) {
    const raw = fs.readFileSync(path.join(DATA, folder, f), "utf8");
    const id = f.replace(/\.md$/, "");
    const notes: string[] = [];
    const body = raw
      .replace(EDITORIAL, (_m, inner) => {
        notes.push(inner.trim());
        return "";
      })
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    gold[id] = notes;
    const title = (raw.match(/^#\s+(.+)$/m)?.[1] || id).trim();
    const date = id.slice(0, 10);
    sources.push({ id, folder, channel: channelOf(folder, raw), date, title, body });
  }
}
sources.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify(sources, null, 2));
fs.writeFileSync(path.join(OUT, "gold_notes.json"), JSON.stringify(gold, null, 2));
console.log(`crm rows: ${crm.length}, sources: ${sources.length}, with editorial notes: ${Object.values(gold).filter((g) => g.length).length}`);
