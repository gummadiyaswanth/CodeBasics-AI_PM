export type Channel = "email" | "meeting_note" | "imessage" | "whatsapp" | "slack" | "call_summary" | "voice_memo" | "capture";

export interface Source {
  id: string;
  folder: string;
  channel: Channel;
  date: string;
  title: string;
  body: string;
}

export interface CrmRow {
  lead_id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  source: string;
  service_interest: string;
  status: string;
  est_value_usd: number | null;
  owner: string;
  created_date: string;
  last_contact_date: string;
  next_followup_date: string;
  notes: string;
}

export type SignalType =
  | "client_request" | "commitment" | "deadline" | "revisit" | "meeting" | "followup"
  | "gone_quiet" | "status_signal" | "budget" | "competitor" | "cross_sell" | "renewal"
  | "referral" | "stakeholder" | "new_lead" | "need" | "handoff" | "duplicate" | "data_gap";

export interface Signal {
  id: string;
  source: string;
  account: string;
  type: SignalType;
  summary: string;
  quote: string;
  raised: string;
  due: string | null;
  owner: string | null;
  status: "open" | "info" | "scheduled" | "needs_outcome";
  waiting_on: "us" | "client" | null;
  value_usd: number | null;
}

export type Relationship = "client" | "referral" | "inbound" | "conference" | "cold" | "partner";
export type Competition = "comparable" | "much_lower" | "favoured" | "none_known";

export interface Account {
  company: string;
  leads: string[];
  relationship: Relationship;
  competition: Competition;
}

export interface Proposal {
  lead_id: string;
  field: keyof CrmRow;
  to: string | number;
  reason: string;
  source: string;
  quote: string;
  confidence: "high" | "medium" | "low";
  from?: string | number | null;
  derived?: boolean;
  key?: string;
}

export interface NewLead {
  account: string;
  company: string;
  contact_name: string;
  contact_email: string;
  source: string;
  service_interest: string;
  owner: string;
  notes: string;
  evidence_source: string;
  quote: string;
}

export interface Opportunity {
  account: string;
  lead_id: string;
  title: string;
  service: string;
  source: string;
  quote: string;
}

export interface Extraction {
  signals: Signal[];
  accounts: Record<string, Account>;
  competition_evidence: Record<string, [string, string]>;
  proposals: Proposal[];
  new_leads: NewLead[];
  opportunities: Opportunity[];
  meta: { today: string; generator: string };
}

export interface ScorePart { label: string; points: number; max: number; why: string }

export interface QueueItem {
  account: string;
  company: string;
  owner: string;
  loops: Signal[];
  value: number | null;
  valueBasis: string;
  daysWaiting: number;
  nextDue: string | null;
  daysToDue: number | null;
  score: number;
  band: "P1" | "P2" | "P3";
  parts: ScorePart[];
  inCrm: boolean;
  contactName: string;
  contactEmail: string;
}
