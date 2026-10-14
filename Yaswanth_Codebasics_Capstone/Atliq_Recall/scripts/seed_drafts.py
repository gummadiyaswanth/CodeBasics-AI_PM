# Seed follow-up drafts (what /api/draft returns with Sonnet 5.5), authored under the same DRAFT_SYSTEM rules:
# only facts from the evidence; anything unknown is a [bracketed placeholder] the founder must fill.
import json
D = {}
def d(acct, channel, to, body, subject=None):
    D[acct] = dict(channel=channel, to=to, subject=subject, body=body.strip())

d("finedge", "email", "suresh.menon@finedge.com", """
Hi Suresh,

Thank you for the news that compliance has cleared AtliQ, and apologies that I never confirmed a slot for the week of 29 June. That one is on me, and I don't want it to cost us the momentum you mentioned.

For the commercial discussion I can do any of these: [Bhavin: add 2-3 slots]. If your assistant has already proposed times, send them over and I'll take the first that works.

And thank you for introducing David at Harbor & Finch.

Bhavin""", "FinEdge data platform: confirming the commercial discussion")

d("novapharma", "imessage", "Dr. Lisa Wong", """
Hi Lisa, sorry for the silence. ETA: first-pass security questionnaire to Rajesh by [Pranav to confirm a date before 24 Jul], and the three healthcare/pharma references to Emma by [Bhavin: date]. I'll update you the moment either goes out. Bhavin""")

d("freshcart", "email", "ananya@freshcart.in", """
Hi Ananya,

I owe you an apology. I promised you a call in May, didn't make it, and you had to chase. Thank you for keeping AtliQ in the mix anyway.

I know you're deciding by mid-July. Could we take 30 minutes on [Dhaval: day/time] to walk through the customer account portal (orders, subscriptions, wallet) across your three cities? I'll come with questions so we use your time well.

Dhaval""", "FreshCart customer portal: can we talk this week?")

d("agrolink", "email", "harpreet@agrolink.in", """
Hi Harpreet,

A quick update on the proposal for the mandi price data pipelines and price alerts for your trader network. [Dhaval: attach the proposal, or give a firm date that lands before your leave on 14 July.]

If it helps your CEO, I can walk you both through it in 30 minutes before you go.

Dhaval""", "AgroLink: your data project proposal")

d("cloudnine", "email", "dev@cloudnine.io", """
Hi Dev,

Apologies for the delay on the references. Here are two SaaS clients where our engineers embedded into an existing team. Both have agreed to take a call:

1. [Karandeep: name, company, email, confirmed with them. Candidate from your history: Sameer Kulkarni at DataNest, who wrote that both engineers "have been excellent".]
2. [Karandeep: second reference]

Since you're closing by mid-July, I'm happy to set up both calls this week.

Karandeep""", "References for senior backend and DevOps profiles")

d("globalmart", "email", "neha.shah@globalmart.com", """
Hi Neha,

Apologies. I promised you an answer on phasing by last Friday. Our recommendation: [Karandeep: choose (a) trim the analytics module to Phase 2 at [amount], or (b) full scope at [amount]].

On your supply-chain colleague's question about demand forecasting: [Karandeep to confirm the answer and who should run that conversation].

Karandeep""", "Vendor portal: phasing, and your forecasting question")

d("harborfinch", "email", "david@harborfinch.com", """
Hi David,

Thank you, and Suresh, for the introduction, and apologies for the slow reply. Automating around 120 client reports a quarter is very much our kind of problem.

Would [Bhavin: slot 1] or [slot 2] work for a 30-minute call? Send me a couple of example reports beforehand if you can, and we'll come prepared.

Bhavin""", "AtliQ <> Harbor & Finch: finding a time")

d("shopswift", "email", "elena@shopswift.com", """
Hi Elena,

Congratulations on getting the 55k approved. You'll have the statement of work for the recommendation engine by [Bhavin: date on or before 15 July], in time for procurement before your quarter closes.

If procurement needs a particular template or clauses, send them over and we'll write the SOW to fit.

Bhavin""", "ShopSwift recommendation engine: SOW timing")

d("voltenergy", "whatsapp", "Marcus Chen", """
Hi Marcus, confirming you'll have the 3-year TCO comparison (Power BI vs Tableau) by Tuesday 14 July, ahead of your board pack on the 15th. [Karandeep: time of day]. Karandeep""")

d("healthfirst", "email", "anita.rao@healthfirst.in", """
Hi Anita,

Good luck with the board on 14 July. Is there anything that would help you champion the portal: a one-page summary of the phased plan (Phase 1 at 18k, Phase 2 at 12k), or someone from our side on standby for questions on the day?

And thank you for introducing Rakesh at Citywide Diagnostics. We're speaking on Monday.

Karandeep""", "HealthFirst patient portal: ahead of your board on 14 July")

d("meridian", "email", "sanjay.k@meridianhealth.com", """
Dear Sanjay,

Apologies for the delay in answering your IT director's two questions.

1. HL7 feeds from your older lab systems: [Pranav to confirm whether the ingestion layer supports HL7 v2 alongside FHIR].
2. Clinician UAT: [Bhavin to confirm whether UAT is inside the 14 weeks or added on top].

I know you'd like to close before your budget review in mid-July. I'm glad to take a 20-minute call with your IT director this week if that's quicker. And since you met Jay at TechSummit too: I'm your single point of contact at AtliQ.

Bhavin""", "Clinical Data Platform: answers to your IT director's questions")

d("sunrise", "email", "meera@sunrisefoods.in", """
Hi Meera,

I said I'd set up a call when I was back, and I didn't. Sorry about that. Growing from 40 to 110 distributors is a great problem to have, and we'd love to do the v2, starting with order reconciliation.

Could we do 45 minutes on [Dhaval: slot]? I'd like to cover the portal fixes and your CFO's idea of a sales dashboard on the portal data in the same conversation.

Dhaval""", "Distributor portal v2")

d("northwind", "email", "tbeckett@northwindlog.com", """
Hi Tom,

Thanks again for the kind words on the pipeline. I promised you sample dashboard concepts and they're late. [Dhaval/Pranav: attach 2-3 concepts built on the freight margin numbers].

Since your clean warehouse is already in place, this should be a small, fast project. Happy to walk your CEO through them.

Dhaval""", "Dashboard concepts for your freight margin data")

d("acme", "email", "priya.raman@acmeretail.com", """
Hi Priya,

Apologies that the scope note on automating your monthly board pack slipped. [Ayush: attach scope note, or date].

On the seasonal inventory forecasting challenge Vikas raised: would you be open to introducing us to your COO for a separate conversation?

And thank you again for the FreshCart introduction.

Dhaval""", "Board-pack automation scope, and forecasting")

d("kestrel", "email", "ishaan@kestrellogistics.in", """
Hi Ishaan,

Gabriel Ortiz suggested we speak. He mentioned you're looking at route-level profitability dashboards and a data warehouse on top of your TMS for the fleet.

That's the kind of work we do at AtliQ, and we can scope it without a big-consultancy footprint. Would [Karandeep: slot] work for a 30-minute call?

Karandeep""", "Introduction via Gabriel: route profitability dashboards")

d("ridgeline", "whatsapp", "Prashant Rao", """
Hi Prashant, thanks for your patience. Next step: a 30-minute call on [Karandeep: slot] to understand your 200-distributor ordering flow. We'll send an approach and a rough budget before your 25 July deadline. Karandeep""")

d("clearpath", "email", "deepa.nair@clearpathins.com", """
Hi Deepa,

Yes, AtliQ is very much still interested, and it's good to hear the claims data warehouse is back on the Q3 roadmap. Apologies for the slow reply.

On the 40k estimate: [Dhaval to confirm whether it still holds, or what changed in scope]. Could we take 30 minutes on [slot] to refresh the requirements?

Dhaval""", "Claims data warehouse: picking up where we left off")

d("nimbus", "email", "rhea@nimbuslending.in", """
Hi Rhea,

Thank you, and Shreya, for the introduction. Manually reviewing ~4,000 loan applications a month is exactly the kind of document-heavy underwriting problem we've worked on.

Would [Bhavin: slot before 17 July] work for a call, ahead of your budget conversations the week of 20 July?

Bhavin""", "AtliQ <> Nimbus Lending")

d("zenlytics", "email", "maya@zenlytics.io", """
Hi Maya,

I owe you an apology. I confirmed Wednesday 3pm and never sent the invite. If you're still looking for 2 data engineers with dbt + Snowflake for an August start, could we try [Bhavin: two slots, 2-5pm IST]? The invite will come from me straight after.

Bhavin""", "Staff augmentation: rescheduling our intro call")

d("kaveri", "email", "subbu@kaveritextiles.in", """
Mr. Subramaniam,

Thank you for the time on 8 July. The revised quote for the two-plant scope will be with you by [Jay: date on or before 15 July], including the Tally and Access data extraction work Senthil described.

Jay""", "Revised quote: two-plant dashboard")

json.dump(D, open("src/generated/drafts.json", "w"), indent=1, ensure_ascii=False)
print(len(D), "drafts")
