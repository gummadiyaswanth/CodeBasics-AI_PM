# Stakeholder demo video script (about 5 minutes)

**Audience:** Bhavin, Dhaval, Karandeep. **Tone:** a PM pitching impact, not an engineer showing features.
**Setup before recording:** open the deployed Recall app, click "Reset demo" (bottom of the sidebar), set the browser to 1440x900, and record with Loom or OBS. Keep the deck open in another tab for the opening and closing.

| Time | Screen | What to say (adapt in your own words) |
|---|---|---|
| 0:00-0:30 | Deck, cover then slide 2 | "AtliQ doesn't have a lead problem; it has a memory problem. On 10 July, 33 clients were waiting on us. The median wait was 15 days, and not one of 40 CRM records had a next follow-up date. That's $663k of known deal value sitting in inboxes and in our heads." |
| 0:30-1:00 | Deck, slide 3 (stories) | "FinEdge, our biggest deal at $95k, cleared compliance on 19 June and asked us to confirm a call. Three weeks of silence. A referral from Acme, our happiest client, had to chase us twice. We've agreed to same-day CRM updates twice; it never sticks, because the people selling are also running the company." |
| 1:00-1:45 | App, Today | "This is Recall. Every morning it shows who is waiting on you, ranked by your own rules: urgency, deal value, competition, relationship." Click **Why #1** on FinEdge: "Every rank explains itself. No black box." Point at the quote and source link: "These are Suresh's exact words; click and you see the original email." Filter to **Bhavin**. |
| 1:45-2:30 | App, Capture | "Most of your calls happen on WhatsApp or the commute, and those can't be recorded. So after a call you dictate 30 seconds into your phone." Click **Pull in all 5**. "That's Karandeep's drive-home memo, a WhatsApp from Ridgeline, an iMessage from NovaPharma, a Slack referral. Recall pulled out what they asked, what we promised, and by when." Go back to **Today**: NovaPharma jumped from #9 to #2 because Lisa chased on iMessage, and Kestrel and Ridgeline now appear, leads that existed only in Slack and WhatsApp. |
| 2:30-3:15 | App, Draft follow-up on FinEdge | "One click drafts the reply, using only what's in the thread. Anything Recall can't know, like your free slots, stays in brackets, and you can't send until you fill them. Recall never sends anything itself." Fill a slot, then click **I've sent it**: FinEdge leaves the list. |
| 3:15-4:00 | App, CRM sync | "And Kaizen finally stays current without anyone typing. It goes from 0% up to date to 97% once the suggestions are approved." Show Kaveri: "The CRM says Lost; the client wrote back after the cheaper vendor failed. Recall proposes reopening it and quotes his email." Show **Leads missing from the CRM** (Harbor & Finch, Nimbus) and the **Meridian duplicate**: "This is the awkward booth conversation, prevented." Click **Export to Kaizen**. |
| 4:00-4:30 | App, How it works | "How it stays safe: the AI does one narrow job, reading messages and quoting them. Code checks every quote word for word, and 152 of 152 passed. Ranking and dates are rules. People approve every CRM change and send every message." |
| 4:30-5:00 | Deck, slides 16 and 19 | "We'll measure one thing: the share of client asks closed within two business days, from under 20% today to 90%. Running cost is about $26 a month; one saved deal pays for decades. The ask: an API key, 50 real messages to test on, and an hour a week from Karandeep for a two-week alpha in November." |

**Lines to have ready for questions**
* *Does it read all our email?* Only sales threads, one message at a time, with just the company list as context. Nothing personal is stored.
* *What if it gets something wrong?* It can't show anything it can't quote, and nothing reaches a client or the CRM without you.
* *Why not just a better CRM?* Kaizen works. The gap is capture, not the database.
* *Which AI model is this?* The demo runs on Gemini's free tier because the data is synthetic. For real client messages we switch one setting to a paid tier that doesn't train on our data; the guardrails stay the same.
