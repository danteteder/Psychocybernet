# Instantly Integration Fix Plan

**Problem:** Instantly API returns stale/incomplete data (shows 0 warmup when dashboard shows 11-17)

**Solution:** Multi-source data aggregation

---

## Architecture

```
Psychocybernet Dashboard
    ├── Primary: Instantly API (campaign stats, replies, bounces)
    ├── Secondary: Manual entry override (for warmup data until API fixed)
    └── Fallback: Screenshot parsing (future: browser automation)
```

---

## Fixes Needed

### 1. Update Psychocybernet Instantly Client
**File:** `src/lib/instantly.ts`

**Change:** Add manual override fields for warmup data
```typescript
interface InstantlyAccount {
  email: string;
  dailyLimit: number;
  emailsSent: number;      // From API
  warmupEmails: number;    // MANUAL OVERRIDE (API unreliable)
  healthScore: number;     // MANUAL OVERRIDE
  warmupEnabled: boolean;  // MANUAL OVERRIDE
}
```

**UI:** Add "Refresh from Instantly" button + manual edit mode

---

### 2. Create Real-Time Account Overview Page
**Route:** `/outreach/accounts`

**Features:**
- Grid view of all 12 accounts
- Live warmup counters (manual update until API fixed)
- Health score indicators
- Today's sent count vs limit
- Quick actions: Pause, Enable Warmup, View in Instantly

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│  Email Accounts (12)                              [Sync] [+] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📧 dante.teder@nordspikeautomations.com  [Gen-2]           │
│     Sent: 0/30  |  Warmup: 11  |  Health: 100% ✅           │
│     [Pause] [Edit Warmup Count] [View in Instantly]         │
│                                                              │
│  📧 dante@nordspikeconsulting.com  [Gen-2]                  │
│     Sent: 0/30  |  Warmup: 14  |  Health: 100% ✅           │
│     ... (10 more accounts)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Automated Daily Warmup Tracker
**File:** `src/app/api/cron/warmup-tracker/route.ts`

**Job:** Every hour, prompt user via Telegram:
```
"Update warmup counts for 12 accounts? 
Reply with: 11,17,15,15,16,14,15,13,11,16,15,13"
```

**Store:** Supabase `daily_warmup_log` table

---

### 4. Campaign Launch Readiness Dashboard
**Route:** `/outreach/launch`

**Shows:**
- ✅ 12 accounts connected
- ✅ Warmup active (11-17 emails each)
- ✅ 100% health scores
- ⚠️ 0 leads loaded (need 20K CSV)
- ⚠️ Campaign paused
- **Next:** Upload leads → Activate campaign

---

## Implementation Order

1. **Fix Instantly client** (30 min) - Add manual override fields
2. **Build account overview page** (1 hour) - Grid view with manual edit
3. **Add Telegram daily reminder** (30 min) - Hourly warmup count prompt
4. **Create launch readiness dashboard** (30 min) - Pre-flight checklist
5. **Test with live data** (30 min) - You verify counts match dashboard
6. **Deploy** → Test on Vercel

**Total:** ~3.5 hours

---

## Long-term: Browser Automation Solution

**Goal:** Never manually enter warmup counts

**Build:** Browser Use script that:
1. Logs into Instantly dashboard
2. Scrapes Email Accounts page
3. Extracts warmup counts for all 12 accounts
4. Pushes to Psychocybernet DB via webhook

**Timeline:** Phase 2 (after campaign launch)

---

## Decision Needed

**For manual override approach:**
- ✅ Fast (3.5 hours)
- ✅ Accurate (you control the data)
- ❌ Requires daily manual input (or hourly Telegram prompts)

**For full automation (Browser Use scraper):**
- ❌ Slower (1-2 days to build + test)
- ✅ Zero manual work after setup
- ⚠️ Breaks if Instantly changes UI

**Recommendation:** Do **manual override now** (launch campaign this weekend), then **build automation next week**.

**Proceed with manual approach?**
