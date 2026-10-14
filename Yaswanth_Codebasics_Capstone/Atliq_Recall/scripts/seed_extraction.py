# Seed extraction for the AtliQ dataset.
# Produced by Claude (via Claude Code) following the same instructions as the live
# /api/extract prompt (see api/_prompts.ts), then verified by scripts/verify.ts:
# every quote must appear verbatim in its source, or the build fails.
# Re-run live with ANTHROPIC_API_KEY set via `npm run extract` (scripts/extract-live.ts).
import json, os

signals = []
def S(src, account, typ, summary, quote, raised=None, due=None, owner=None,
      status="open", waiting="us", value=None):
    signals.append(dict(source=src, account=account, type=typ, summary=summary, quote=quote,
                        raised=raised or src[:10], due=due, owner=owner, status=status,
                        waiting_on=waiting if status == "open" else None, value_usd=value))

E = lambda s: "2026-" + s if len(s) == 5 else s

# ---------------- emails ----------------
src = "2025-09-30_quantia_lost_deal"
S(src, "quantia", "revisit", "Lost on timing, not fit. Client asked us to check back around Q2 2026 (after acquisition closes).",
  "Please do check back with us around then. I mean that.", due="2026-06-30", owner="Bhavin")
S(src, "quantia", "status_signal", "Loss reason is timing: mid-acquisition, nothing new signed until it closes.",
  "honestly it's a timing problem, not a fit problem", status="info")

src = "2026-01-15_vertex_ooo_stall"
S(src, "vertex", "commitment", "We said we'd reconnect after Naidu returns from leave on 2 Feb. Never happened.",
  "No problem — will reconnect in February. Safe travels.", raised="2026-01-20", due="2026-02-03", owner="Jay")

src = "2026-02-05_steelcore_pricing_objection"
S(src, "steelcore", "competitor", "Local freelancer quoted under a third of our 14-16k estimate.",
  "A local freelancer has quoted us less than a third of this", raised="2026-02-10", status="info")
S(src, "steelcore", "gone_quiet", "We answered the pricing objection and offered a call; no reply since 14 Feb.",
  "Happy to get on a call and walk through exactly what's included.", raised="2026-02-14", owner="Jay", waiting="client")

src = "2026-03-04_apexauto_cold_outreach"
S(src, "apexauto", "gone_quiet", "Two cold emails, no response.", "bumping this in case it got buried",
  raised="2026-03-20", owner="Jay", waiting="client")

src = "2026-03-26_finedge_compliance_docs"
S(src, "finedge", "status_signal", "Compliance has cleared AtliQ; deal moves to commercial discussion.",
  "good news, compliance has cleared AtliQ. We can move to the commercial discussion now.", raised="2026-06-19", status="info")
S(src, "finedge", "client_request", "Suresh asked us to confirm availability for a commercial call the week of 29 June. Unconfirmed.",
  "My assistant will find a slot the week of 29 June — please confirm your availability.",
  raised="2026-06-19", due="2026-06-26", owner="Bhavin", value=95000)

src = "2026-04-20_healthfirst_board_update"
S(src, "healthfirst", "deadline", "Board decision on the patient portal is on 14 July. Check in with Anita before it so she can champion the phased pricing.",
  "now scheduled for 14 July", raised="2026-04-20", due="2026-07-13", owner="Karandeep", value=30000)
S(src, "healthfirst", "budget", "Board prefers to clear under 20k in one go; we re-phased to 18k + 12k.",
  "Phase 1 (patient registration + appointments) at 18k, Phase 2 (records + billing integration) at 12k", raised="2026-04-22", status="info")

src = "2026-05-04_urbannest_no_response"
S(src, "urbannest", "gone_quiet", "Approach note for the site-visit booking app sent; no response.",
  "Happy to do a short demo whenever suits.", owner="Jay", waiting="client")

src = "2026-05-10_bytebridge_competitor"
S(src, "bytebridge", "competitor", "TalentGrid quoted about 15% below our rates; client still prefers a referred partner.",
  "TalentGrid has quoted us roughly 15% below your rates for the same three profiles", status="info")
S(src, "bytebridge", "commitment", "Karandeep promised two case studies plus a reference by Friday 15 May. Nothing sent.",
  "I'll send both, plus a reference, by Friday.", raised="2026-05-12", due="2026-05-15", owner="Karandeep")

src = "2026-05-18_freshcart_referral_followup"
S(src, "freshcart", "commitment", "Dhaval promised to call Ananya early the next week. The call never happened.",
  "I'll call you early next week to set things up.", raised="2026-05-20", due="2026-05-26", owner="Dhaval")
S(src, "freshcart", "client_request", "Ananya chased: talking to two other vendors, deciding by mid-July, still wants AtliQ in the mix.",
  "We're now in conversations with two other vendors and want to decide by mid-July.",
  raised="2026-06-16", due="2026-07-15", owner="Dhaval")

src = "2026-06-03_zenlytics_intro_call"
S(src, "zenlytics", "commitment", "Bhavin confirmed Wed 3pm and promised a calendar invite. No invite was sent.",
  "Wednesday 3pm it is. I'll send a calendar invite shortly.", raised="2026-06-05", due="2026-06-05", owner="Bhavin")
S(src, "zenlytics", "need", "Needs 2 data engineers with dbt + Snowflake, starting August.",
  "We're looking for 2 data engineers with dbt + Snowflake experience, ideally starting August.", raised="2026-06-04", status="info")

src = "2026-06-09_clearpath_budget_unfrozen"
S(src, "clearpath", "status_signal", "Lost deal is back: budget freeze lifted, project on the Q3 roadmap.",
  "The freeze lifted with the new financial year and the project is back on our roadmap for Q3.", status="info")
S(src, "clearpath", "client_request", "Deepa asks whether AtliQ is still interested and whether the 40k estimate holds. Unanswered.",
  "Is AtliQ still interested, and does the 40k estimate still hold?", owner="Dhaval", value=40000)

src = "2026-06-10_sunrise_foods_reactivation"
S(src, "sunrise", "client_request", "Existing client wants a v2 of the distributor portal (40 to 110 distributors).",
  "would AtliQ want to do a v2?", owner="Dhaval")
S(src, "sunrise", "commitment", "Dhaval said he'd set up a call after travelling. No call scheduled.",
  "let me set up a call when I'm back.", raised="2026-06-14", due="2026-06-19", owner="Dhaval")
S(src, "sunrise", "cross_sell", "CFO wants the portal data to feed a sales dashboard: a Power BI cross-sell.",
  "our CFO keeps asking if the portal data can feed into some kind of sales dashboard", status="info")

src = "2026-06-11_northwind_crosssell"
S(src, "northwind", "cross_sell", "CEO wants a Power BI dashboard layer on top of the pipeline we built.",
  "Does AtliQ also do the dashboard layer on top?", status="info")
S(src, "northwind", "commitment", "Dhaval promised sample dashboard concepts 'next week'. Not sent.",
  "Let me send you a few sample dashboard concepts next week to react to.", raised="2026-06-13", due="2026-06-19", owner="Dhaval")

src = "2026-06-15_voltenergy_competitor"
S(src, "voltenergy", "competitor", "Also evaluating a Tableau consultancy.",
  "we're also evaluating a Tableau consultancy for this", status="info")
S(src, "voltenergy", "client_request", "Marcus asked for a 3-year TCO comparison 'this week'. Unanswered.",
  "That TCO comparison would actually help a lot — board asks for 3-year numbers. Can you send it this week?",
  raised="2026-07-01", due="2026-07-03", owner="Karandeep", value=28000)

src = "2026-06-16_meridian_proposal_questions"
S(src, "meridian", "client_request", "IT director has two questions on the proposal: HL7 support, and whether the 14 weeks include clinician UAT. Unanswered.",
  "Two questions from our IT director before we can move ahead:", owner="Bhavin", due="2026-07-15", value=45000)
S(src, "meridian", "deadline", "They want to close before their budget review in mid-July.",
  "We'd like to close this out before our Q2 budget review in mid-July.", due="2026-07-15", status="info")

src = "2026-06-18_acme_retail_monthly_reports"
S(src, "acme", "commitment", "Dhaval promised a scope note for automating the monthly board pack 'this week' (Ayush copied). Not sent.",
  "we'll send you a short scope note this week", raised="2026-06-19", due="2026-06-26", owner="Ayush")
S(src, "acme", "cross_sell", "Ops team struggles with seasonal inventory forecasting: new opportunity.",
  "our ops team has been struggling with inventory forecasting for seasonal SKUs", status="info")
S(src, "acme", "referral", "Priya referred FreshCart (Ananya Desai).",
  "I passed your details to Ananya Desai at FreshCart", status="info")

src = "2026-06-20_lumino_fitness_case_study"
S(src, "lumino", "new_lead", "TechSummit contact never entered in CRM; budgeting for next quarter now.",
  "we're budgeting for next quarter right now", status="info")
S(src, "lumino", "client_request", "Carlos is waiting for the churn-prediction case study Jay promised at TechSummit.",
  "You mentioned you'd send over the case study about the member-churn prediction work you did for a fitness chain.",
  owner="Jay")

src = "2026-06-21_cloudnine_rates_references"
S(src, "cloudnine", "commitment", "Karandeep promised two reference names 'in a day or two'. Never sent.",
  "will revert with names in a day or two", raised="2026-06-22", due="2026-06-24", owner="Karandeep")
S(src, "cloudnine", "client_request", "Dev chased the references; comparing with one other vendor, closing by mid-July.",
  "We're comparing you with one other vendor and want to close this out by mid-July.",
  raised="2026-07-06", due="2026-07-15", owner="Karandeep")

src = "2026-06-23_kaveri_vendor_failed"
S(src, "kaveri", "status_signal", "Lost deal reopened: the cheaper local vendor failed; client wants to move quickly.",
  "Is your quote from November still valid? We'd want to move quickly this time.", status="info")

src = "2026-06-24_globalmart_pricing"
S(src, "globalmart", "client_request", "Neha asks us to choose: trim analytics to Phase 2, or full scope at a lower figure (number is ~20% over budget).",
  "Two options from our side: trim the analytics module to Phase 2, or hold the full scope at a lower figure. Which works better for you?",
  owner="Karandeep", due="2026-07-03", value=62000)
S(src, "globalmart", "commitment", "Karandeep promised a phasing answer by Friday 3 July. Not sent.",
  "(Will respond by Friday.)", raised="2026-06-26", due="2026-07-03", owner="Karandeep")
S(src, "globalmart", "cross_sell", "Supply-chain colleague asked if AtliQ does demand forecasting. Unanswered.",
  "my colleague in supply chain asked whether you do demand forecasting. Do you?", status="info")

src = "2026-06-25_novapharma_stakeholders"
S(src, "novapharma", "stakeholder", "Two new stakeholders gate the deal: Rajesh (IT security) and Emma (procurement).",
  "Copying Rajesh (IT security) and Emma (procurement).", status="info")
S(src, "novapharma", "client_request", "Emma needs three healthcare/pharma references.",
  "Emma will need three references from healthcare/pharma clients.", owner="Bhavin", due="2026-07-24", value=80000)
S(src, "novapharma", "deadline", "Everything must be wrapped by end of July to make this year's budget.",
  "Realistically we need everything wrapped by end of July to make this year's budget.", due="2026-07-31", status="info")

src = "2026-06-27_harborfinch_referral_intro"
S(src, "harborfinch", "new_lead", "Referral from Suresh (FinEdge): boutique advisory firm, ~120 manual client reports a quarter. Not in CRM.",
  "We produce ~120 client reports a quarter, all manual.", status="info")
S(src, "harborfinch", "client_request", "David asked for a call in the next couple of weeks. Unanswered.",
  "Do you have time in the next couple of weeks?", owner="Bhavin", due="2026-07-11")

src = "2026-06-28_oceanfreight_timezones"
S(src, "oceanfreight", "meeting", "Discovery call booked for 14 July, 8:00 CET / 11:30 IST.",
  "14 July 8:00 CET / 11:30 IST confirmed — invite sent.", raised="2026-07-03", due="2026-07-14", owner="Jay", status="scheduled", waiting=None)

src = "2026-06-29_pixelworks_partnership"
S(src, "pixelworks", "new_lead", "Design agency wants a standing white-label partner: potentially 3-4 projects a quarter. Not in CRM.",
  "Potentially 3–4 projects a quarter.", status="info")
S(src, "pixelworks", "client_request", "Tara asked who the right person to speak with is. Unanswered.",
  "Who's the right person to speak with?", owner="Jay")

src = "2026-06-29_shopswift_budget_confirmed"
S(src, "shopswift", "budget", "Leadership approved 55k for the recommendation engine.",
  "leadership has formally approved 55k for the recommendation engine this fiscal year", status="info")
S(src, "shopswift", "client_request", "Elena needs a statement of work by 15 July or budget slips a quarter.",
  "What I need from you: a statement of work by 15 July", owner="Bhavin", due="2026-07-15", value=55000)

src = "2026-06-30_datanest_renewal"
S(src, "datanest", "renewal", "Contract ends end of September; client wants to renew early.",
  "Our contract runs out end of September. Can we sort the renewal early so there's no gap?", status="info")
S(src, "datanest", "cross_sell", "Raised Series A; wants a third engineer strong on Kafka.",
  "want to add a third engineer, ideally someone strong on Kafka", status="info")
S(src, "datanest", "meeting", "Call proposed for Wed 8 July. Date has passed and no notes were captured: log the outcome.",
  "Let's do a call Wednesday 8 July to lock the renewal and discuss the Kafka profile.", raised="2026-07-02", due="2026-07-08",
  owner="Karandeep", status="needs_outcome", waiting=None)

src = "2026-06-30_novapharma_security_questionnaire"
S(src, "novapharma", "client_request", "78-question vendor security questionnaire due 24 July. Not started.",
  "We need the completed document back by 24 July to keep the procurement timeline.", owner="Bhavin", due="2026-07-24", value=80000)
S(src, "novapharma", "handoff", "Bhavin forwarded the questionnaire to Pranav on 1 July. No acknowledgement.",
  "Pranav — can you take a first pass at this?", raised="2026-07-01", status="info")

src = "2026-07-02_paytrack_phase2"
S(src, "paytrack", "cross_sell", "Ops team wants the fraud scoring applied to merchant onboarding.",
  "the ops team wants the same scoring applied to merchant onboarding, not just transactions", status="info")
S(src, "paytrack", "client_request", "Shreya asked for a merchant-risk one-pager before their August planning cycle.",
  "if you sent us a one-pager on what a merchant-risk module would look like, I could circulate it before our August planning cycle.",
  owner="Bhavin", due="2026-07-31")

src = "2026-07-03_greengrid_new_lead"
S(src, "greengrid", "status_signal", "Inbound website lead moved to discovery call on 9 July.", "Thursday works.", raised="2026-07-04", status="info")

src = "2026-07-03_trustline_approved"
S(src, "trustline", "status_signal", "Board approved the project on annual-license framing; wants revised contract to sign this month.",
  "the loan document automation project is approved", status="info")
S(src, "trustline", "commitment", "Dhaval promised the revised contract 'this week'. Closed: the 9 Jul call summary confirms Mohan received it on 8 July.",
  "Revised contract will be with you this week", raised="2026-07-06", due="2026-07-10", owner="Dhaval", status="info")

src = "2026-07-05_nimbus_lending_intro"
S(src, "nimbus", "new_lead", "Referral from Shreya (PayTrack): ~4,000 loan applications a month, all manual. Not in CRM.",
  "we process ~4,000 loan applications a month, all manually reviewed", raised="2026-07-06", status="info")
S(src, "nimbus", "client_request", "Rhea wants a call before her budget conversations the week of 20 July. Unanswered.",
  "I have budget conversations happening the week of 20 July, so a call before then would be ideal.",
  raised="2026-07-06", owner="Bhavin", due="2026-07-17")

src = "2026-07-06_citywide_referral"
S(src, "citywide", "meeting", "Intro call booked Monday 13 July, 11am (referral from Anita, HealthFirst).",
  "Monday 13th, 11am works. See you then.", raised="2026-07-07", due="2026-07-13", owner="Karandeep", status="scheduled", waiting=None)

src = "2026-07-07_mirahealth_quick_summary"
S(src, "mirahealth", "status_signal", "Second call done: scope UK ops first, ~35k confirmed verbally, CTO ex-NHS wants clinical safety docs.",
  "They want the triage assistant scoped for UK ops first, not India. Budget ~35k confirmed verbally.", raised="2026-07-06", status="info")
S(src, "mirahealth", "stakeholder", "CTO is ex-NHS and particular about clinical safety documentation.",
  "their CTO is ex-NHS and very particular about clinical safety docs", raised="2026-07-06", status="info")

src = "2026-07-08_eduspark_website_enquiry"
S(src, "eduspark", "client_request", "Website enquiry from 25 June never answered; Vikram followed up directly. Admissions spike Aug-Sep, budget closes mid-August.",
  "I submitted an enquiry through your website on 25 June about an AI assistant for student queries and haven't heard back",
  raised="2026-06-25", due="2026-08-14", owner="Jay")
S(src, "eduspark", "stakeholder", "Decision-maker is Prof. Meenakshi Iyer, Dean of Digital Learning.",
  "that's Prof. Meenakshi Iyer, our Dean of Digital Learning", status="info")

# ---------------- meeting notes ----------------
src = "2026-04-05_smartserve_intro_call"
S(src, "smartserve", "commitment", "Jay owed Arvind a reference call with a past client. Never arranged; account silent since 8 Apr.",
  "Reference call with a past client for Arvind — Jay", due="2026-04-15", owner="Jay")

src = "2026-05-19_globalmart_demo"
S(src, "globalmart", "status_signal", "Demo of Pranav's vendor-portal prototype landed; questions on SSO and audit logs.",
  "went down well, questions on SSO and audit logs", status="info")

src = "2026-06-03_trustline_negotiation"
S(src, "trustline", "status_signal", "CFO wants annual-license framing and ROI per loan file.",
  "we quoted per-document pricing, he wants annual license framing instead", status="info")

src = "2026-06-13_medtrack_scribble"
S(src, "medtrack", "commitment", "Promised intro deck + healthcare case studies 'this week'. Service interest unclear (lab ops dashboards or LIMS).",
  "asked for our intro deck + healthcare case studies", due="2026-06-19", owner="Jay")

src = "2026-06-14_techsummit_debrief"
S(src, "meridian", "duplicate", "Same hospital group entered twice (L-1003 Bhavin, L-1027 Jay).",
  "(Now sitting in CRM twice: L-1003 and L-1027.)", status="info")
S(src, "techsummit", "data_gap", "8-10 conference cards never processed.", "8–10 more cards in the drawer, not yet gone through",
  owner="Jay", due="2026-06-21")

src = "2026-06-19_blueorchid_call"
S(src, "blueorchid", "commitment", "Jay promised an approach note for review analytics across 12 properties; client asked about pilot cost. Blocked: email missing.",
  "said I'd send an approach note", due="2026-06-24", owner="Jay")

src = "2026-06-24_acme_quarterly_review"
S(src, "acme", "cross_sell", "Seasonal inventory forecasting: separate conversation with Acme's COO. Not logged anywhere.",
  "New opportunity, not logged anywhere.", status="info")
S(src, "acme", "renewal", "Support contract renewal due September; no issues signalled.",
  "Renewal of support contract due September. Priya signalled no issues.", status="info")
S(src, "acme", "commitment", "Intro conversation on forecasting with Acme's COO has no owner.",
  "Intro convo re: forecasting with Acme COO — ?", owner=None, due="2026-07-08")

src = "2026-06-26_loopmart_pricing_call"
S(src, "loopmart", "budget", "Ballpark 18-22k given for retail analytics dashboards (3 stores + Shopify).",
  "gave ballpark 18–22k for retail analytics dashboards, phase-able", status="info")

src = "2026-06-30_finserve_intro_call"
S(src, "finserve", "followup", "Arjun is travelling; ping after 15 July. Credit scoring for thin-file customers, explainability critical.",
  "arjun travelling first 2 wks of july, said ping him after 15th", due="2026-07-16", owner="Karandeep", status="scheduled", waiting=None)

src = "2026-07-01_agrolink_budget_call"
S(src, "agrolink", "budget", "~35-40k approved this FY; Harpreet + CEO decide, no committee.",
  "~35-40k approved for this FY", status="info")
S(src, "agrolink", "client_request", "Proposal wanted before 10 July (today). Harpreet on leave from 14 July.",
  "wants proposal before 10 July, he goes on leave 14th", owner="Dhaval", due="2026-07-10", value=37500)

src = "2026-07-02_internal_pipeline_review"
S(src, "novapharma", "handoff", "Owner of the NovaPharma questionnaire unresolved in the pipeline review.",
  "Who owns it? (Unresolved in meeting.)", status="info")

src = "2026-07-03_ridgeline_scribble"
S(src, "ridgeline", "new_lead", "Inbound call from Ridgeline Foods' ops head: wants a distributor portal like Sunrise's (~200 distributors). No contact details captured.",
  "wants same thing, distributor ordering portal, ~200 distributors", status="info")

src = "2026-07-06_meridian_check"
S(src, "meridian", "data_gap", "Nobody knows whether Sanjay's questions were answered.",
  "Nobody sure if we replied to Sanjay's proposal questions from 16 Jun.", status="info")

src = "2026-07-07_internal_prioritization"
S(src, "healthfirst", "data_gap", "Board date was found only by searching an inbox during the meeting.",
  "Nobody had this date until Karandeep searched his inbox during the meeting.", status="info")

src = "2026-07-08_kaveri_demo_round2"
S(src, "kaveri", "client_request", "Revised 2-plant quote requested by 15 July; budget flexibility signalled.",
  "Subbu asked for revised quote by 15 July.", owner="Jay", due="2026-07-15", value=15000)

src = "2026-07-09_greengrid_discovery"
S(src, "greengrid", "commitment", "Proposal due 17 July; Pranav to sanity-check SCADA API feasibility by 14 July.",
  "Proposal — Jay — by 17 Jul", due="2026-07-17", owner="Jay", value=22500)
S(src, "greengrid", "budget", "20-25k comfortable for phase 1; board review in September drives timing.",
  "Budget: Aditya indicated 20–25k comfortable for phase 1.", status="info")

# ---------------- extension (multi-channel) ----------------
src = "2026-07-08_novapharma_imessage"
S(src, "novapharma", "client_request", "Lisa (iMessage) wants an ETA today on the questionnaire and references.",
  "Can you give me an ETA today so I can calm them down?", owner="Bhavin", due="2026-07-08", value=80000)
S(src, "novapharma", "commitment", "Bhavin replied he'd confirm an ETA by tomorrow (9 July). Not sent.",
  "On it Lisa, will confirm ETA by tomorrow.", due="2026-07-09", owner="Bhavin")

src = "2026-07-09_ridgeline_whatsapp"
S(src, "ridgeline", "new_lead", "Prashant (Ridgeline Foods) resurfaced on WhatsApp with contact details; referral via Sunrise Foods.",
  "My email is prashant.rao@ridgelinefoods.in", status="info")
S(src, "ridgeline", "client_request", "MD wants an approach and rough budget before 25 July (annual IT plan).",
  "Our MD wants to see an approach and rough budget before 25 July", owner="Karandeep", due="2026-07-25")
S(src, "ridgeline", "commitment", "Karandeep replied he'd get back with next steps shortly. Nothing sent yet.",
  "Will get back with next steps shortly.", due="2026-07-10", owner="Karandeep")

src = "2026-07-07_slack_advisory_referral"
S(src, "kestrel", "new_lead", "Slack referral from Gabriel: Kestrel Logistics (~600 trucks) wants route profitability dashboards + DWH. Not in CRM.",
  "Kestrel Logistics (Pune, ~600 trucks) wants route-level profitability dashboards plus a data warehouse on top of their TMS.", status="info")
S(src, "kestrel", "commitment", "Karandeep said he'd reach out to Ishaan this week. Not done.",
  "Will ping him this week.", due="2026-07-10", owner="Karandeep")

src = "2026-07-09_trustline_readai_summary"
S(src, "trustline", "status_signal", "Annual license of $48k agreed verbally; target signature 20 July; kickoff 3 Aug.",
  "Agreed annual license of 48,000 USD for year one, billed quarterly.", status="info")
S(src, "trustline", "commitment", "Dhaval owes the quarterly billing schedule annex by 13 July; signature targeted 20 July.",
  "Dhaval to send the quarterly billing schedule annex by 13 July.", due="2026-07-13", owner="Dhaval", value=48000)

src = "2026-07-10_karandeep_voice_memo"
S(src, "voltenergy", "client_request", "Marcus (WhatsApp call) needs the 3-year TCO by Tue 14 July; board pack goes out on the 15th.",
  "he needs it by Tuesday the 14th because their board pack goes out on the 15th", owner="Karandeep", due="2026-07-14", value=28000)
S(src, "voltenergy", "competitor", "Tableau consultancy about 10% cheaper: still in the race.",
  "the Tableau consultancy came in about ten percent cheaper, so we're still in the race", status="info")
S(src, "loopmart", "client_request", "Sania is fine with ~20k if phased; wants a written proposal by end of July.",
  "she wants a written proposal by end of July", owner="Karandeep", due="2026-07-31", value=20000)

# ---------------- account facts (AI-extracted; feed the deterministic score) ----------------
# relationship: client (existing customer) | referral | inbound | conference | cold | partner
# competition: comparable (rival at similar price, client deciding) | much_lower (rival far cheaper)
#              | favoured (we are preferred / sole) | none_known
accounts = {
 "acme": dict(company="Acme Retail Group", leads=["L-1001"], relationship="client", competition="favoured"),
 "finserve": dict(company="FinServe Capital", leads=["L-1002"], relationship="inbound", competition="none_known"),
 "meridian": dict(company="Meridian Healthcare", leads=["L-1003", "L-1027"], relationship="inbound", competition="none_known"),
 "globalmart": dict(company="GlobalMart", leads=["L-1004", "L-1040"], relationship="conference", competition="none_known"),
 "northwind": dict(company="Northwind Logistics", leads=["L-1005"], relationship="client", competition="favoured"),
 "blueorchid": dict(company="BlueOrchid Hotels", leads=["L-1006"], relationship="conference", competition="none_known"),
 "kaveri": dict(company="Kaveri Textiles", leads=["L-1007"], relationship="cold", competition="favoured"),
 "zenlytics": dict(company="Zenlytics", leads=["L-1008"], relationship="inbound", competition="none_known"),
 "healthfirst": dict(company="HealthFirst Clinics", leads=["L-1009"], relationship="referral", competition="none_known"),
 "eduspark": dict(company="EduSpark", leads=["L-1010"], relationship="inbound", competition="none_known"),
 "agrolink": dict(company="AgroLink", leads=["L-1011"], relationship="conference", competition="favoured"),
 "urbannest": dict(company="UrbanNest Realty", leads=["L-1012"], relationship="inbound", competition="none_known"),
 "paytrack": dict(company="PayTrack", leads=["L-1013"], relationship="client", competition="favoured"),
 "voltenergy": dict(company="VoltEnergy", leads=["L-1014"], relationship="inbound", competition="comparable"),
 "clearpath": dict(company="ClearPath Insurance", leads=["L-1015"], relationship="cold", competition="favoured"),
 "medtrack": dict(company="MedTrack Labs", leads=["L-1016"], relationship="conference", competition="none_known"),
 "shopswift": dict(company="ShopSwift", leads=["L-1017"], relationship="inbound", competition="none_known"),
 "datanest": dict(company="DataNest", leads=["L-1018"], relationship="client", competition="favoured"),
 "freshcart": dict(company="FreshCart", leads=["L-1020"], relationship="referral", competition="comparable"),
 "steelcore": dict(company="SteelCore Industries", leads=["L-1021"], relationship="cold", competition="much_lower"),
 "finedge": dict(company="FinEdge Bank", leads=["L-1023"], relationship="referral", competition="none_known"),
 "cloudnine": dict(company="CloudNine SaaS", leads=["L-1025"], relationship="inbound", competition="comparable"),
 "sunrise": dict(company="Sunrise Foods", leads=["L-1026"], relationship="client", competition="favoured"),
 "apexauto": dict(company="ApexAuto Parts", leads=["L-1028"], relationship="cold", competition="none_known"),
 "novapharma": dict(company="NovaPharma", leads=["L-1029"], relationship="inbound", competition="favoured"),
 "greengrid": dict(company="GreenGrid Solar", leads=["L-1030"], relationship="inbound", competition="none_known"),
 "bytebridge": dict(company="ByteBridge", leads=["L-1031"], relationship="referral", competition="comparable"),
 "trustline": dict(company="Trustline NBFC", leads=["L-1032"], relationship="conference", competition="favoured"),
 "oceanfreight": dict(company="OceanFreight", leads=["L-1033"], relationship="inbound", competition="none_known"),
 "smartserve": dict(company="SmartServe Hospitality", leads=["L-1034"], relationship="inbound", competition="none_known"),
 "quantia": dict(company="Quantia Analytics", leads=["L-1035"], relationship="referral", competition="none_known"),
 "loopmart": dict(company="LoopMart", leads=["L-1036"], relationship="conference", competition="none_known"),
 "vertex": dict(company="Vertex Constructions", leads=["L-1037"], relationship="cold", competition="none_known"),
 "mirahealth": dict(company="MiraHealth", leads=["L-1038"], relationship="inbound", competition="none_known"),
 "citywide": dict(company="Citywide Diagnostics", leads=["L-1039"], relationship="referral", competition="none_known"),
 # not in CRM
 "harborfinch": dict(company="Harbor & Finch Advisory", leads=[], relationship="referral", competition="none_known"),
 "lumino": dict(company="Lumino Fitness", leads=[], relationship="conference", competition="none_known"),
 "pixelworks": dict(company="PixelWorks Agency", leads=[], relationship="partner", competition="none_known"),
 "nimbus": dict(company="Nimbus Lending", leads=[], relationship="referral", competition="none_known"),
 "ridgeline": dict(company="Ridgeline Foods", leads=[], relationship="referral", competition="none_known"),
 "kestrel": dict(company="Kestrel Logistics", leads=[], relationship="referral", competition="favoured"),
 "techsummit": dict(company="TechSummit Mumbai (unprocessed cards)", leads=[], relationship="conference", competition="none_known"),
}
# Evidence for the competition labels (shown in the score breakdown)
competition_evidence = {
 "voltenergy": ("2026-07-10_karandeep_voice_memo", "the Tableau consultancy came in about ten percent cheaper, so we're still in the race"),
 "freshcart": ("2026-05-18_freshcart_referral_followup", "We're now in conversations with two other vendors and want to decide by mid-July."),
 "cloudnine": ("2026-06-21_cloudnine_rates_references", "We're comparing you with one other vendor and want to close this out by mid-July."),
 "bytebridge": ("2026-05-10_bytebridge_competitor", "I'd still prefer to work with a referred partner"),
 "steelcore": ("2026-02-05_steelcore_pricing_objection", "A local freelancer has quoted us less than a third of this"),
 "clearpath": ("2026-06-09_clearpath_budget_unfrozen", "Your proposal was the strongest of the three we saw."),
 "kaveri": ("2026-06-23_kaveri_vendor_failed", "Lesson learnt about buying on price."),
 "novapharma": ("2026-06-25_novapharma_stakeholders", "On our side the science team is sold"),
 "kestrel": ("2026-07-07_slack_advisory_referral", "They are also talking to one of the big 4 consultancies but think it's overkill."),
 "agrolink": ("2026-07-01_agrolink_budget_call", "decision: him + their CEO, no committee"),
 "trustline": ("2026-07-03_trustline_approved", "the loan document automation project is approved"),
}

# ---------------- CRM change proposals (status / value / owner / contact / notes) ----------------
# Date fields (last_contact_date, next_followup_date) are NOT proposed by the model:
# code derives them from the dated signals above (see src/lib/engine.ts).
proposals = []
def P(lead, field, to, reason, src, quote, conf="high"):
    proposals.append(dict(lead_id=lead, field=field, to=to, reason=reason, source=src, quote=quote, confidence=conf))

P("L-1007", "status", "Contacted", "Lost deal reopened by the client; round-2 demo held 8 Jul.", "2026-06-23_kaveri_vendor_failed", "Is your quote from November still valid? We'd want to move quickly this time.")
P("L-1015", "status", "Contacted", "Client came back: budget freeze lifted, project back on Q3 roadmap.", "2026-06-09_clearpath_budget_unfrozen", "The freeze lifted with the new financial year and the project is back on our roadmap for Q3.")
P("L-1003", "status", "Proposal Sent", "Client is asking questions about AtliQ's proposal.", "2026-06-16_meridian_proposal_questions", "Thanks for the proposal. It looks solid overall.")
P("L-1017", "status", "Proposal Sent", "Budget approved; client requested an SOW (closest CRM stage).", "2026-06-29_shopswift_budget_confirmed", "What I need from you: a statement of work by 15 July", conf="medium")
P("L-1011", "status", "Contacted", "Status blank, but a budget call was held on 1 Jul.", "2026-07-01_agrolink_budget_call", "finally connected after techsummit (2.5 weeks!)")
P("L-1030", "status", "Contacted", "Discovery call held 9 Jul.", "2026-07-09_greengrid_discovery", "Want: generation vs. forecast, inverter uptime, soiling loss tracking, one view across farms.")
P("L-1036", "status", "Contacted", "Pricing call held 26 Jun.", "2026-06-26_loopmart_pricing_call", "gave ballpark 18–22k for retail analytics dashboards, phase-able")
P("L-1006", "status", "Contacted", "Follow-up call held 19 Jun.", "2026-06-19_blueorchid_call", "wants sentiment + theme dashboards, maybe alerts for bad reviews")
P("L-1032", "notes", "Board approved 3 Jul on annual-license framing. $48k/yr agreed 9 Jul; signature targeted 20 Jul; kickoff 3 Aug. Keep 'Proposal Sent' until signed.", "Approved verbally but unsigned: the status changes to Won only on signature.", "2026-07-09_trustline_readai_summary", "target signature by 20 July")
P("L-1032", "est_value_usd", 48000, "Agreed annual license value.", "2026-07-09_trustline_readai_summary", "Agreed annual license of 48,000 USD for year one, billed quarterly.")
P("L-1011", "est_value_usd", 37500, "Midpoint of the budget the client revealed (35-40k).", "2026-07-01_agrolink_budget_call", "~35-40k approved for this FY", conf="medium")
P("L-1030", "est_value_usd", 22500, "Midpoint of 20-25k phase-1 budget.", "2026-07-09_greengrid_discovery", "Budget: Aditya indicated 20–25k comfortable for phase 1.", conf="medium")
P("L-1036", "est_value_usd", 20000, "Client fine with ~20k if phased.", "2026-07-10_karandeep_voice_memo", "they are fine with around twenty thousand if we phase it")
P("L-1017", "est_value_usd", 55000, "Budget formally approved at 55k (matches CRM).", "2026-06-29_shopswift_budget_confirmed", "leadership has formally approved 55k for the recommendation engine this fiscal year")
P("L-1007", "est_value_usd", 15000, "Keep last quote as floor; scope grew to 2 plants, re-quote due 15 Jul.", "2026-07-08_kaveri_demo_round2", "Scope grew since Nov: they've added a second unit, want both plants in one view.", conf="low")
P("L-1034", "est_value_usd", 25000, "Budget stated in intro call.", "2026-04-05_smartserve_intro_call", "Pooja estimated 25k budget \"if the scope is right\".")
P("L-1033", "owner", "Jay", "Jay is running the 14 Jul call.", "2026-06-28_oceanfreight_timezones", "14 July 8:00 CET / 11:30 IST confirmed — invite sent.")
P("L-1039", "owner", "Karandeep", "Karandeep booked and is taking the 13 Jul call.", "2026-07-06_citywide_referral", "How about Monday 13 July, 11am?")
P("L-1010", "owner", "Jay", "Client wrote to Jay directly.", "2026-07-08_eduspark_website_enquiry", "found your email via LinkedIn, hope you don't mind the direct note", conf="medium")
P("L-1016", "service_interest", "Power BI Dashboards", "Lab ops dashboards (possibly LIMS integration); confirm with client.", "2026-06-13_medtrack_scribble", "lab ops dashboards? or was it LIMS integration. both?", conf="low")
P("L-1006", "service_interest", "AI/ML Solutions", "Review sentiment + theme dashboards.", "2026-06-19_blueorchid_call", "wants sentiment + theme dashboards, maybe alerts for bad reviews", conf="medium")
P("L-1038", "notes", "2nd call 6 Jul: scope UK ops first (not India). ~35k confirmed verbally. CTO ex-NHS: needs clinical safety docs.", "Dhaval asked Jay to log this; never done.", "2026-07-07_mirahealth_quick_summary", "They want the triage assistant scoped for UK ops first, not India. Budget ~35k confirmed verbally.")
P("L-1010", "notes", "Admissions season Aug-Sep (10x queries); budget window closes mid-Aug. Decision-maker: Prof. Meenakshi Iyer (Dean of Digital Learning).", "Clarified need, timing and decision-maker.", "2026-07-08_eduspark_website_enquiry", "our budget window closes mid-August")
P("L-1018", "notes", "Renewal due end Sep (client wants early). Series A raised; wants 3rd engineer (Kafka). Call proposed 8 Jul: outcome not logged.", "Renewal + expansion signals.", "2026-06-30_datanest_renewal", "We've raised a Series A and want to add a third engineer, ideally someone strong on Kafka.")
P("L-1023", "notes", "Compliance cleared 19 Jun. Client asked to schedule the commercial call (wk of 29 Jun): not confirmed. Largest data initiative for them this year.", "Stage moved; CRM still reflects March.", "2026-03-26_finedge_compliance_docs", "This is our largest data initiative this year, so let's not lose momentum.")
P("L-1029", "notes", "Stakeholders: Rajesh Patel (IT security), Emma Stone (procurement). 78-question security questionnaire due 24 Jul; 3 healthcare refs needed; all wrapped by end Jul.", "Gating items for an 80k deal.", "2026-06-30_novapharma_security_questionnaire", "We need the completed document back by 24 July to keep the procurement timeline.")
P("L-1001", "notes", "QBR 24 Jun: 40+ WAU. Asks: automate monthly board pack (~5 person-days/mo). New opp: seasonal inventory forecasting (intro with COO). Support renewal Sept. Referred FreshCart.", "Two cross-sells and a renewal not logged.", "2026-06-24_acme_quarterly_review", "Pain point raised (again): monthly board pack is assembled manually from dashboard screenshots.")
P("L-1006", "contact_email", "", "Email still missing: it's on a business card. Ask Jay to add it.", "2026-06-19_blueorchid_call", "need her email first, it's on her card", conf="low")

# ---------------- new leads (not in CRM) ----------------
new_leads = [
 dict(account="harborfinch", company="Harbor & Finch Advisory", contact_name="David Harbor", contact_email="david@harborfinch.com", source="Referral", service_interest="Power BI Dashboards", owner="Bhavin", notes="Referred by Suresh Menon (FinEdge). ~120 manual client reports/quarter; wants reporting automation.", evidence_source="2026-06-27_harborfinch_referral_intro", quote="We produce ~120 client reports a quarter, all manual."),
 dict(account="lumino", company="Lumino Fitness", contact_name="Carlos Mendes", contact_email="carlos@luminofitness.com", source="Conference", service_interest="AI/ML Solutions", owner="Jay", notes="TechSummit Mumbai. Wants member-churn prediction case study; budgeting next quarter.", evidence_source="2026-06-20_lumino_fitness_case_study", quote="we're budgeting for next quarter right now"),
 dict(account="pixelworks", company="PixelWorks Agency", contact_name="Tara Bose", contact_email="tara@pixelworks.agency", source="Website", service_interest="Partnership (white-label)", owner="", notes="30-person design agency seeking standing white-label partner for dashboards + AI features; 3-4 projects/quarter.", evidence_source="2026-06-29_pixelworks_partnership", quote="Potentially 3–4 projects a quarter."),
 dict(account="nimbus", company="Nimbus Lending", contact_name="Rhea Sharma", contact_email="rhea@nimbuslending.in", source="Referral", service_interest="AI/ML Solutions", owner="Bhavin", notes="Referred by Shreya Iyer (PayTrack). ~4,000 loan applications/month, manual review. Budget talks week of 20 Jul.", evidence_source="2026-07-05_nimbus_lending_intro", quote="we process ~4,000 loan applications a month, all manually reviewed"),
 dict(account="ridgeline", company="Ridgeline Foods", contact_name="Prashant Rao", contact_email="prashant.rao@ridgelinefoods.in", source="Referral", service_interest="Custom Web App", owner="Karandeep", notes="Heard of us via Sunrise Foods. Distributor ordering portal, ~200 distributors (KA + KL). Approach + budget before 25 Jul.", evidence_source="2026-07-09_ridgeline_whatsapp", quote="My email is prashant.rao@ridgelinefoods.in"),
 dict(account="kestrel", company="Kestrel Logistics", contact_name="Ishaan Verma", contact_email="ishaan@kestrellogistics.in", source="Referral", service_interest="Data Engineering", owner="Karandeep", notes="Slack referral from Gabriel Ortiz. ~600 trucks; route profitability dashboards + DWH on TMS. Also talking to a Big 4 firm.", evidence_source="2026-07-07_slack_advisory_referral", quote="Kestrel Logistics (Pune, ~600 trucks) wants route-level profitability dashboards plus a data warehouse on top of their TMS."),
]

# ---------------- new opportunities on existing accounts (cross-sell / expansion) ----------------
opportunities = [
 dict(account="acme", lead_id="L-1001", title="Board-pack report automation", service="Power BI Dashboards", source="2026-06-18_acme_retail_monthly_reports", quote="Our analysts still spend the first week of every month manually assembling the board reporting pack from the dashboards."),
 dict(account="acme", lead_id="L-1001", title="Seasonal inventory forecasting", service="AI/ML Solutions", source="2026-06-24_acme_quarterly_review", quote="Vikas mentioned ops side struggles with seasonal inventory forecasting"),
 dict(account="northwind", lead_id="L-1005", title="Power BI dashboard layer on existing pipeline", service="Power BI Dashboards", source="2026-06-11_northwind_crosssell", quote="Does AtliQ also do the dashboard layer on top?"),
 dict(account="sunrise", lead_id="L-1026", title="Distributor portal v2 (order reconciliation)", service="Custom Web App", source="2026-06-10_sunrise_foods_reactivation", quote="would AtliQ want to do a v2?"),
 dict(account="sunrise", lead_id="L-1026", title="Sales dashboard on portal data", service="Power BI Dashboards", source="2026-06-10_sunrise_foods_reactivation", quote="our CFO keeps asking if the portal data can feed into some kind of sales dashboard"),
 dict(account="globalmart", lead_id="L-1004", title="Demand forecasting (supply chain)", service="AI/ML Solutions", source="2026-06-24_globalmart_pricing", quote="my colleague in supply chain asked whether you do demand forecasting. Do you?"),
 dict(account="paytrack", lead_id="L-1013", title="Merchant-risk scoring module", service="AI/ML Solutions", source="2026-07-02_paytrack_phase2", quote="the ops team wants the same scoring applied to merchant onboarding, not just transactions"),
 dict(account="datanest", lead_id="L-1018", title="Third engineer (Kafka) + early renewal", service="Staff Augmentation", source="2026-06-30_datanest_renewal", quote="want to add a third engineer, ideally someone strong on Kafka"),
]

out = dict(signals=signals, accounts=accounts, competition_evidence=competition_evidence,
           proposals=proposals, new_leads=new_leads, opportunities=opportunities,
           meta=dict(today="2026-07-10", generator="seed: Claude via Claude Code, same schema as /api/extract"))
for i, s in enumerate(signals):
    s["id"] = f"sig-{i+1:03d}"
os.makedirs("src/generated", exist_ok=True)
json.dump(out, open("src/generated/extraction.json", "w"), indent=1, ensure_ascii=False)
print(len(signals), "signals,", len(proposals), "proposals,", len(new_leads), "new leads,", len(opportunities), "opportunities")
