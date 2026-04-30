# Nordspike Outreach System — MVP Design Spec

**Date:** 2026-04-30  
**Status:** Approved for build  
**Launch Target:** Weekend (May 3-4, 2026)  
**Full Campaign Launch:** Monday, May 5, 2026

---

## Overview

Multi-touch outreach system for 20K Estonia business leads:
1. **Cold email** via Instantly (12 warmed accounts, Hyper Growth plan)
2. **LinkedIn automation** via Browser Use (1 account, conservative pacing)
3. **Sales follow-up** via Psychocybernet dashboard (separate employee logins)

**Primary goal:** Launch campaign this weekend, achieve <10-minute reply notification SLA.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Psychocybernet Platform                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /outreach dashboard (new route)                                    │
│  ├── Email Campaign Stats (Instantly API polling)                   │
│  ├── LinkedIn Status (Browser Use script logs)                      │
│  ├── Sales Lead Queue (for employee logins)                         │
│  └── CSV Upload + Enrichment                                        │
│                                                                      │
│  Instantly Webhook → /api/webhooks/instantly → Telegram alert       │
│  (reply received in <10 min)                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├──► Instantly API (Hyper Growth plan, 12 accounts)
         │    - 1,700 emails/account/day
         │    - Built-in email verification
         │    - Webhook on reply
         │
         ├──► Browser Use Cloud (LinkedIn automation)
         │    - 1 profile (brother's account)
         │    - 20 invites/day week 1
         │    - Human-like pacing (random delays, scrolls)
         │
         └──► Supabase Auth (employee logins)
              - Separate accounts for sales reps
              - Role-based access (admin vs sales_view)
```

---

## Component 1: Instantly Integration

### API Polling
- **Endpoint:** `https://app.instantly.ai/api/v1/campaigns`
- **Poll interval:** Every 5 minutes
- **Metrics to pull:**
  - `sent_count`, `reply_count`, `bounce_count`, `spam_count`
  - Per-campaign status (active/paused)
  - Individual reply data (email, subject, message, timestamp)

### Webhook (CRITICAL - <10 min SLA)
- **Webhook URL:** `https://psychocybernet-v3vn.vercel.app/api/webhooks/instantly`
- **Trigger:** Reply received
- **Action:**
  1. Parse reply data
  2. Insert to `warm_leads` Supabase table
  3. Send Telegram alert to Dante + brother
  4. Mark lead as "needs_call" for sales team

### Email Verification
- Use Instantly Hyper Growth built-in verification
- Skip bounced emails from outreach
- Auto-pause campaigns with >3% bounce rate

---

## Component 2: LinkedIn Automation (Browser Use)

### Script Location
`~/.hermes/scripts/linkedin_outreach.py` (triggered via Hermes command)

### Pacing Schedule (Week 1)
| Time | Action | Volume |
|------|--------|--------|
| 10:00 AM | Run Browser Use task | 7 invites |
| 2:00 PM | Run Browser Use task | 7 invites |
| 6:00 PM | Run Browser Use task | 6 invites |
| **Total** | | **20 invites/day** |

### Workflow Per Profile
```python
1. Navigate to profile URL
2. Pause 4-9 seconds (random)
3. Scroll 0.5 pages (read About)
4. Pause 3-7 seconds
5. Click "Connect" (coordinate-based)
6. Click "Add note"
7. Type opener word-by-word (50-180ms/char)
8. Click "Send"
9. Pause 15-45 seconds
10. Log result to Psychocybernet DB
```

### Opener Template (Light Personalization)
```
"Hey {first_name}, saw your work at {company}. We just automated 
a similar client's operations - saved them 34 hrs/week. Worth a 
quick chat if you're open to it."
```

**No Nordspike mention in first touch.** Mention after they reply.

### Logging
Each invite logged to `linkedin_outreach_log` table:
- `profile_url`, `company`, `sent_at`, `status` (sent/accepted/replied)
- `opener_used`, `response_time` (if replied)

---

## Component 3: Employee Login System

### Roles
| Role | Access | Use Case |
|------|--------|----------|
| `admin` (Dante) | Full dashboard, settings, API keys | Manage campaigns |
| `sales_rep` (brother + hires) | Lead queue, call status, commission tracker | Call warm leads |

### Sales Rep View
- **Leads to call:** Filtered list (replied to email OR accepted LinkedIn)
- **Call status checkboxes:** `Called`, `Voicemail`, `Meeting Booked`, `Not Interested`
- **Commission tracker:** 25% of closed deals (manual entry by admin)
- **Daily goal:** 50 calls/day minimum

### Supabase Auth
- Use existing Supabase auth (already integrated in Psychocybernet)
- Add `role` column to `users` table (`admin` or `sales_rep`)
- Protect `/outreach` route with role-based middleware

---

## Component 4: Outreach Dashboard (`/outreach`)

### Layout (Single Page, Minimal)

```
┌──────────────────────────────────────────────────────────────────┐
│  Nordspike Outreach                     [ Upload CSV ] [ Export ] │
├──────────────────────────────────────────────────────────────────┤
│  📧 Email (Instantly)                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Sent: 1,247 / 14,000 weekly    │ Replies: 74 (6.0%) ✓     │  │
│  │ Bounces: 12 (0.9%) ✓           │ Spam: 2 (0.16%) ✓        │  │
│  │ Status: Sending                │ Next batch: 2:00 PM      │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  💼 LinkedIn (Browser Use)                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Invites: 18 / 100 weekly       │ Accepts: 9 (50%)         │  │
│  │ Replies: 4 (22%)               │ Status: Active           │  │
│  │ Next run: 2:00 PM EET                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  📞 Sales Leads (Warm - Call Within 10 Min)                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Kristjan K. | TechFlow | 5 min ago     [✓] Called         │  │
│  │ Mari S. | Enefit | 23 min ago         [ ] Needs call      │  │
│  │ ... (78 total warm leads)                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Commission Tracker (Sales Reps)                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Your brother: €0 closed (0 deals)                           │  │
│  │ Open reps: [Add Rep]                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Real-Time Updates
- Poll Instantly API every 5 min
- Poll `warm_leads` table every 30 sec (for new replies)
- Telegram push for instant reply alerts

---

## Component 5: CSV Upload & Lead Management

### Upload Flow
1. Upload 20K CSV to `/outreach`
2. Backend validates columns: `email`, `first_name`, `company`, `linkedin_url` (optional)
3. Instantly verifies emails (Hyper Growth plan feature)
4. Split leads across 12 accounts (evenly distributed)
5. Start campaign

### Database Schema (Supabase)

**`warm_leads` table:**
```sql
- id UUID
- email TEXT
- first_name TEXT
- company TEXT
- linkedin_url TEXT (nullable)
- source TEXT ('email' | 'linkedin')
- replied_at TIMESTAMPTZ
- call_status TEXT ('pending' | 'called' | 'meeting_booked' | 'not_interested')
- assigned_to UUID (sales rep user_id)
- created_at TIMESTAMPTZ
```

**`linkedin_outreach_log` table:**
```sql
- id UUID
- profile_url TEXT
- company TEXT
- invite_sent_at TIMESTAMPTZ
- accepted_at TIMESTAMPTZ (nullable)
- replied_at TIMESTAMPTZ (nullable)
- opener_used TEXT
```

---

## Implementation Plan

### Saturday (Day 1 - Today)
- [ ] Create `/outreach` page skeleton
- [ ] Instantly API integration (polling + webhook)
- [ ] Supabase tables (`warm_leads`, `linkedin_outreach_log`)
- [ ] Employee auth (role-based access)
- [ ] Telegram webhook for reply alerts

### Sunday (Day 2)
- [ ] Browser Use LinkedIn script (basic version)
- [ ] Sales rep view (lead queue + call status)
- [ ] CSV upload + validation
- [ ] Test with 100 leads

### Monday (Launch Day)
- [ ] Upload full 20K CSV
- [ ] Start Instantly campaigns (12 accounts)
- [ ] Start LinkedIn automation (20 invites)
- [ ] Onboard brother to sales dashboard
- [ ] Monitor <10 min reply SLA

---

## Metrics & Monitoring

### Daily Checkpoints
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Email sent | 2,000/day | <1,500 |
| Email reply rate | 6% | <4% |
| Email bounce rate | <1% | >3% (pause campaign) |
| LinkedIn invites | 20/day | N/A |
| LinkedIn accept rate | 50% | <30% |
| Reply → Call SLA | <10 min | >30 min |
| Call → Meeting rate | 30% | <20% |

### Telegram Alerts
- New reply received (instant)
- Bounce rate >3% (pause campaign)
- LinkedIn script failed (manual intervention needed)
- Daily summary (7 PM EET): sent, replies, calls, meetings

---

## Security & Anti-Bot Measures

### LinkedIn (Browser Use)
- ✅ Residential proxy (Estonia)
- ✅ Random delays (4-9 sec between actions)
- ✅ Scroll behavior (0.3-1.0 pages)
- ✅ Per-character typing (50-180ms)
- ✅ No 24/7 operation (9 AM - 7 PM EET only)
- ✅ Unique openers (LLM light personalization)

### Email (Instantly)
- ✅ 12 warmed accounts (already done)
- ✅ Hyper Growth plan (reputation management)
- ✅ Auto-pause on high bounce rate
- ✅ Spam complaint monitoring

---

## Out of Scope (MVP)
- ❌ Full CRM integration (use Supabase tables for now)
- ❌ Automated follow-up sequences (manual for now)
- ❌ Commission auto-calculation (manual entry by Dante)
- ❌ LinkedIn enrichment API (use Browser Use scraping)
- ❌ Advanced analytics (basic metrics only)

---

## Success Criteria (Week 1)
- ✅ 14,000 emails sent across 12 accounts
- ✅ 840+ replies (6% rate)
- ✅ 100 LinkedIn invites sent (20/day avg)
- ✅ 50+ acceptances (50% rate)
- ✅ 100% of replies notified via Telegram in <10 min
- ✅ 50%+ of warm leads called within 1 hour
- ✅ 20+ meetings booked

---

## Rollback Plan
If issues arise:
- **Email bounce rate >3%:** Pause Instantly campaigns, verify list quality
- **LinkedIn flag/ban:** Stop Browser Use immediately, wait 7 days, restart at 5/day
- **Webhook failures:** Manual Telegram alerts from Instantly dashboard
- **Sales rep no-shows:** Dante + brother handle calls manually

---

**Approved by:** Dante  
**Build Start:** 2026-04-30  
**Launch Date:** 2026-05-04 (Monday)
