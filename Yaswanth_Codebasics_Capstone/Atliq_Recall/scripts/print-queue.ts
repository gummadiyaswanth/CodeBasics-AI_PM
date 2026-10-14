import fs from "node:fs";
import { Memory, allProcessed } from "../src/lib/engine";
const j = (f: string) => JSON.parse(fs.readFileSync("src/generated/" + f, "utf8"));
const m = new Memory(j("crm.json"), j("sources.json"), j("extraction.json"), allProcessed(j("sources.json")), "2026-07-10");
for (const q of m.queue())
  console.log(q.band, q.score, q.company.padEnd(24), q.owner.padEnd(10), "wait", q.daysWaiting, "due", q.nextDue, q.parts.map((p) => p.points).join("/"), "|", q.parts[0].why);
console.log("gone quiet", m.goneQuiet().map((g) => g.company + ":" + g.days));
console.log("upcoming", m.upcoming().map((g) => g.company + ":" + g.days + ":" + g.signal.status));
const p = m.allProposals();
console.log("proposals", p.length, p.filter((x) => x.derived).length, "derived");
console.log("dups", m.duplicates().map((d) => d.a.lead_id + "/" + d.b.lead_id + " " + d.rule));
console.log("health", m.health(m.crm));
