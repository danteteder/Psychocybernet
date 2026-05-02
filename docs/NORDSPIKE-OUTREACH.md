# Nordspike Outreach System

## Business Model
AI-powered technical sales outreach targeting Estonian businesses. Sales reps earn 25% commission on closed deals from warm leads generated through email campaigns.

## The Flow

### 1. Initial Contact
- **Email #1**: Sent via Instantly (12 accounts, 3 domains)
- **LinkedIn**: Connection request 1-2 days after email
- **Follow-up**: Direct call to engaged prospects

### 2. Lead Qualification
- Warm leads = replied to email OR accepted LinkedIn
- Instantly dashboard shows reply rates (~6% Estonian market baseline)
- Leads uploaded to Psychocybernet for tracking

### 3. Sales Handoff
- Technical sales specialist receives lead info
- Makes discovery call within 24 hours
- Proposes development project (AI agents, automation, web dev)

### 4. Commission Structure
- **25% of project value** to sales rep
- Paid upon client payment
- Tracked in Psychocybernet database
- Example: $10K project = $2,500 commission

## Tech Stack

### Email Infrastructure
- **12 email accounts** across 4 domains:
  - nordspikeconsulting.com (4 accounts)
  - nordspikeautomations.com (4 accounts)
  - nordspikepartners.com (4 accounts)
  - nordspikesolutions.com (4 accounts)
- **Instantly Plan**: Hyper Growth ($97/mo, ~10K emails included)
- **Warmup**: Active (11-17 emails/account/day, 30/day limit)
- **Daily capacity**: ~360-510 emails/day (12 accounts × 30-43/day)

### Campaign
- **Name**: "[AI SDR] Nordspike"
- **Sequence**: 4 emails
- **Target**: 20K Estonia businesses
- **Status**: Created, paused (waiting for lead upload)

### Lead List
- **Source**: 20K Estonia businesses CSV
- **Enrichment**: Instantly built-in (Hyper Growth plan)
- **Upload**: Via Psychocybernet outreach dashboard

## LinkedIn Automation

### Browser Use Setup
- **Account**: Brother's LinkedIn (logged in manually)
- **Tool**: Browser Use Cloud UI
- **Safety**: 20 invites/day week 1 (conservative)
- **Pacing**: Human-like delays (30-120 sec between actions)

### Workflow
```
Browser Use script runs:
1. Search target companies (Estonia, relevant industries)
2. Send 20 connection requests/day
3. Wait for acceptance
4. Send follow-up message with case study
5. Log activity in Psychocybernet
```

## Sales Rep Onboarding

### Access
1. Create Supabase account (role: `sales_rep`)
2. Login to Psychocybernet
3. View assigned warm leads
4. Track call outcomes

### Training
- Product knowledge (AI agents, automation, web dev)
- Objection handling scripts
- Commission tracker tutorial
- CRM best practices

## Metrics & KPIs

### Email Campaign
- Sent: 20,000
- Open rate: Target 40-50%
- Reply rate: Target 6% (1,200 replies)
- Positive replies: ~30% (360 qualified leads)

### LinkedIn
- Connection requests: 20/day = 100/week = 400/month
- Acceptance rate: ~25% (100 connections/month)
- Conversion to call: ~20% (20 calls/month)

### Sales
- Close rate from calls: ~30% (6 deals/month)
- Average project value: $10K
- Monthly revenue: $60K
- Commission payout: $15K (25%)

## Automation Schedule

### Daily (Hermes Cron)
- 8:00 AM: Check Instantly replies, send Telegram alerts
- 10:00 AM: LinkedIn automation (Browser Use)
- 4:00 PM: Update lead status, commission calc

### Weekly
- Monday: Review campaign metrics, adjust sequences
- Friday: Commission summary, payout prep

## Files & Scripts
- `src/lib/instantly.ts` - API client
- `src/app/api/webhooks/instantly/route.ts` - Reply handler
- `linkedin_outreach.py` - Browser Use script (TODO)
- `migrations/004_outreach_tables.sql` - Database schema
