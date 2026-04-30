# Nordspike Outreach - Weekend Build Progress

**Started:** 2026-04-30 (Saturday)  
**Target Launch:** Monday, May 5, 2026

---

## ✅ **COMPLETED (Phase 1-2)**

### Database & Types
- [x] Design spec written (`docs/superprofits/specs/2026-04-30--nordspike-outreach.md`)
- [x] Database schema created (warm_leads, linkedin_outreach_log)
- [x] TypeScript types added (WarmLead, LinkedInOutreachLog, CallStatus, LeadSource)
- [x] Migration 004 created with RLS policies
- [x] Added `sales_rep` role to UserRole enum

### Instantly Integration
- [x] Instantly API client (`src/lib/instantly.ts`)
- [x] Webhook endpoint for instant reply notifications (`/api/webhooks/instantly`)
- [x] Reply aggregation and stats calculation

### Outreach Dashboard
- [x] New `/outreach` route created
- [x] Dashboard UI with:
  - Email stats (Instantly real-time data)
  - LinkedIn stats section (placeholder)
  - Warm leads queue (call within 10 min)
  - Upload CSV button
- [x] Added Mail icon to sidebar nav
- [x] Auto-refresh every 30 seconds

### Build Status
- [x] Build verified ✅ (0 errors)
- [x] All changes committed and pushed

---

## 🚧 **TODO (Phase 3-5)**

### Browser Use LinkedIn Script
- [ ] **TODO:** User needs to log into Browser Use Cloud with brother's LinkedIn account
- [ ] Create persistent profile "linkedin-nordspike"
- [ ] Write `linkedin_outreach.py` script:
  - [ ] Navigate to profile URLs
  - [ ] Scroll naturally (0.3-0.8 pages)
  - [ ] Click Connect (coordinate-based)
  - [ ] Add personalized note
  - [ ] Log results to Psychocybernet DB
- [ ] Set up schedule: 3×/day (10am, 2pm, 6pm EET)
- [ ] Start with 20 invites/day (week 1 warm-up)

### Employee Auth + Sales Rep Portal
- [ ] Add `sales_rep` role to Supabase users table
- [ ] Create login for brother (and future sales reps)
- [ ] Sales rep view:
  - [ ] Assigned warm leads only
  - [ ] Call status checkboxes (Called, Meeting Booked, Not Interested)
  - [ ] Commission tracker (25% of closed deals)
- [ ] Role-based middleware for /outreach route

### Telegram Alerts
- [ ] Test webhook: `/api/webhooks/telegram` with reply alerts
- [ ] Configure Instantly to send webhooks to `https://psychocybernet-v3vn.vercel.app/api/webhooks/instantly`
- [ ] Alert format:
  ```
  📧 New email reply received!
  
  From: Kristjan (kristjan@techflow.ee)
  Company: TechFlow
  Subject: Re: Your automation question
  Time: 30 Apr 14:23
  
  ⏱️ Call within 10 minutes!
  ```
- [ ] Daily summary at 7 PM EET (sent, replies, calls, meetings)

### CSV Upload & Lead Enrichment
- [ ] Upload 20K Estonia leads CSV
- [ ] Instantly Hyper Growth plan verification (built-in)
- [ ] Distribute leads across 12 email accounts
- [ ] Start campaigns (1,700 emails/account over 2 weeks)

### Testing & Launch
- [ ] Test with 100 leads first (Sunday)
- [ ] Verify webhook delivery (<10 min SLA)
- [ ] Test LinkedIn script (10 invites, monitor for flags)
- [ ] Full launch: Monday morning (2,000 emails + 20 LinkedIn invites)
- [ ] Onboard brother to sales dashboard
- [ ] Interview & hire sales reps (Monday afternoon)

---

## 📊 **Metrics to Track (Week 1)**

| Metric | Target | Actual |
|--------|--------|--------|
| Emails sent | 14,000 | — |
| Email reply rate | 6% | — |
| Email bounce rate | <1% | — |
| LinkedIn invites | 100 | — |
| LinkedIn accept rate | 50% | — |
| Reply → Call SLA | <10 min | — |
| Call → Meeting rate | 30% | — |
| Meetings booked | 20+ | — |

---

## 🚨 **Blockers**

1. **Browser Use Login** — User needs to authenticate brother's LinkedIn account in Browser Use Cloud UI
2. **Instantly Webhook Config** — Need to configure webhook URL in Instantly dashboard
3. **CSV File** — User has 20K leads, needs to upload to dashboard

---

## 📝 **Next Steps (Immediate)**

1. **User action:** Log into Browser Use Cloud with brother's LinkedIn (one-time, 5 min)
2. **User action:** Configure Instantly webhook URL in Instantly dashboard
3. **Continue build:** Write Browser Use LinkedIn script (Phase 4)
4. **Continue build:** Add employee auth + sales rep portal (Phase 5)

---

**Current Time:** ~4 hours into build  
**Estimated remaining:** 3-4 hours  
**Confidence:** 🟢 High (on track for Monday launch)
