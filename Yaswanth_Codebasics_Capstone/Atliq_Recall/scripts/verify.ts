// Grounding check: every quote the AI layer relies on must appear verbatim in its source.
// Runs in `npm run build`; any mismatch fails the build (guardrail G1 in the PRD).
import fs from "node:fs";

const sources: { id: string; body: string }[] = JSON.parse(fs.readFileSync("src/generated/sources.json", "utf8"));
const crm: { lead_id: string }[] = JSON.parse(fs.readFileSync("src/generated/crm.json", "utf8"));
const ex = JSON.parse(fs.readFileSync("src/generated/extraction.json", "utf8"));
const byId = new Map(sources.map((s) => [s.id, s.body]));
const leads = new Set(crm.map((r) => r.lead_id));

const errors: string[] = [];
let checked = 0;
function check(where: string, src: string, quote: string) {
  checked++;
  const body = byId.get(src);
  if (!body) return errors.push(`${where}: unknown source ${src}`);
  if (!quote || !body.includes(quote)) errors.push(`${where}: quote not found in ${src}: "${quote}"`);
}
for (const s of ex.signals) {
  check(s.id, s.source, s.quote);
  if (!ex.accounts[s.account]) errors.push(`${s.id}: unknown account ${s.account}`);
}
for (const p of ex.proposals) {
  check(`proposal ${p.lead_id}.${p.field}`, p.source, p.quote);
  if (!leads.has(p.lead_id)) errors.push(`proposal: unknown lead ${p.lead_id}`);
}
for (const n of ex.new_leads) check(`new_lead ${n.company}`, n.evidence_source, n.quote);
for (const o of ex.opportunities) check(`opportunity ${o.title}`, o.source, o.quote);
for (const [k, [src, q]] of Object.entries(ex.competition_evidence) as [string, [string, string]][]) check(`competition ${k}`, src, q);
for (const [k, a] of Object.entries(ex.accounts) as [string, any][])
  for (const l of a.leads) if (!leads.has(l)) errors.push(`account ${k}: unknown lead ${l}`);

const report = { checked, failed: errors.length, exact_match_rate: (checked - errors.length) / checked };
fs.writeFileSync("src/generated/verify_report.json", JSON.stringify(report, null, 2));
if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`GROUNDING CHECK FAILED: ${errors.length}/${checked}`);
  process.exit(1);
}
console.log(`Grounding check passed: ${checked}/${checked} quotes found verbatim in their sources.`);
