import fs from "node:fs";
import { Memory, allProcessed } from "../src/lib/engine";
const j = (f: string) => JSON.parse(fs.readFileSync("src/generated/" + f, "utf8"));
const src = j("sources.json");
const m = new Memory(j("crm.json"), src, j("extraction.json"), allProcessed(src), "2026-07-10");
const q = m.queue().map((x, i) => ({ rank: i + 1, company: x.company, owner: x.owner, band: x.band, score: x.score, days: x.daysWaiting, due: x.nextDue, value: x.value, inCrm: x.inCrm,
  top: x.loops[0].summary, quote: x.loops[0].quote, source: x.loops[0].source, channel: m.sourceById.get(x.loops[0].source)?.channel, parts: x.parts, n: x.loops.length,
  crm: m.primaryLead(x.account) }));
fs.writeFileSync("/home/claude/queue.json", JSON.stringify({ queue: q, quiet: m.goneQuiet().map(g=>({company:g.company,days:g.days,comp:g.competition})), up: m.upcoming().map(u=>({company:u.company,days:u.days,s:u.signal.summary,st:u.signal.status})), props: m.allProposals().length, health: m.health(m.crm) }, null, 1));
