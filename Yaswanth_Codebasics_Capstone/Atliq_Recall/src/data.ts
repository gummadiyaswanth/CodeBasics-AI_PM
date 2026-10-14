import crmData from "./generated/crm.json";
import sourcesData from "./generated/sources.json";
import extractionData from "./generated/extraction.json";
import draftsData from "./generated/drafts.json";
import goldNotes from "./generated/gold_notes.json";
import evalReport from "./generated/eval_report.json";
import type { CrmRow, Extraction, Source } from "./lib/types";

export const crm = crmData as CrmRow[];
export const sources = sourcesData as Source[];
export const ex = extractionData as unknown as Extraction;
export const TODAY = ex.meta.today;
export const drafts = draftsData as Record<string, { channel: string; to: string; subject: string | null; body: string }>;
export const gold = goldNotes as Record<string, string[]>;
export const evals = evalReport as any;
