# Hermes Agent Integration

## Overview
Hermes Agent is the AI automation backbone of Psychocybernet, running on a WSL2 laptop with Telegram integration for voice commands and real-time notifications.

## Architecture

### Components
```
┌─────────────────┐
│  Telegram Bot   │ ← User voice commands, notifications
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Hermes Gateway │ ← Port 8080, WebSocket + REST API
│  (WSL2 Laptop)  │
└────────┬────────┘
         │
         ├──→ Cron Jobs (scheduled tasks)
         ├──→ Webhooks (Instantly replies)
         └──→ Subagents (delegate_task)
```

### Connection Status
- **Telegram**: Connected ✓ (User ID: 630921715)
- **Webhook**: Connected ✓ (Instantly, Browser Use)
- **Gateway**: Running on port 8080

## Setup

### Installation
Hermes is already installed and configured. Key commands:

```bash
# Check status
hermes status

# View logs
hermes logs

# Restart gateway
hermes restart

# List cron jobs
hermes cron list
```

### Configuration
Config file: `~/.hermes/config.yaml`

Key settings:
```yaml
telegram:
  bot_token: [REDACTED]
  home_channel: 630921715

gateway:
  port: 8080
  webhook_url: https://psychocybernet-v3vn.vercel.app/api/webhooks

cron:
  enabled: true
  timezone: UTC
```

## Webhooks

### Incoming Webhooks
Psychocybernet sends events to Hermes:

**Endpoint**: `http://localhost:8080/webhook`

**Event Types**:
- `user.login` - Sales rep logs in
- `lead.qualified` - New warm lead ready
- `campaign.started` - Email campaign activated

### Outgoing Webhooks
Hermes sends to Psychocybernet:

**Endpoint**: `https://psychocybernet-v3vn.vercel.app/api/webhooks/instantly`

**Payload**:
```json
{
  "event": "email.reply",
  "campaign": "[AI SDR] Nordspike",
  "prospect": {
    "email": "prospect@example.com",
    "company": "Estonian Business OÜ",
    "reply_text": "Interested in learning more..."
  },
  "timestamp": "2026-04-30T10:30:00Z"
}
```

## Cron Jobs

### Active Jobs

#### 1. Reply Monitor
**Schedule**: Every 10 minutes
**Task**: Check Instantly for new replies, send Telegram alerts
**Prompt**:
```
Check Instantly API for new email replies in "[AI SDR] Nordspike" campaign.
For each reply:
1. Extract prospect email, company, message
2. Send Telegram alert to @dante
3. Log in Psychocybernet database
```

#### 2. LinkedIn Automation
**Schedule**: Daily at 10:00 AM
**Task**: Run Browser Use script for LinkedIn outreach
**Prompt**:
```
Execute LinkedIn outreach via Browser Use:
1. Login to brother's account (session cookie)
2. Send 20 connection requests (Estonia target)
3. Accept pending requests
4. Send follow-up messages
5. Log all actions in Psychocybernet
```

#### 3. Commission Calc
**Schedule**: Weekly on Friday at 4:00 PM
**Task**: Calculate sales rep commissions
**Prompt**:
```
Query Psychocybernet for closed deals this week.
Calculate 25% commission per sales rep.
Send summary to Telegram with breakdown.
Update commission_tracker table.
```

## Skills Used

### Custom Skills
- `wealth-health-optimization` - Personal wealth tracking
- `webhook-subscriptions` - Event-driven agent runs
- `hermes-agent` - Configuration, troubleshooting

### Built-in Tools
- `web_search` - Prospect research
- `browser_navigate` - LinkedIn automation
- `terminal` - Local scripts, API calls
- `send_message` - Telegram notifications

## Dashboard Integration

### `/hermes` Route
Psychocybernet shows real-time Hermes status:

- Gateway health (healthy/degraded/down)
- Telegram connection status
- Webhook connection status
- Active agents count
- Task queue length
- Last activity timestamp

### API Endpoint
`GET /api/hermes/status`

**Response**:
```json
{
  "gateway_health": "healthy",
  "active_agents": 1,
  "task_queue_length": 3,
  "last_task_time": "2026-04-30T10:25:00Z",
  "telegram_connected": true,
  "webhook_connected": true
}
```

## Troubleshooting

### Gateway Not Responding
```bash
# Check if running
hermes status

# Restart
hermes restart

# Check logs
hermes logs --last 100
```

### Telegram Disconnected
1. Check bot token in config
2. Verify internet connection
3. Restart gateway

### Webhooks Not Firing
1. Check Vercel deployment is live
2. Verify endpoint URL in Hermes config
3. Test manually:
```bash
curl -X POST https://psychocybernet-v3vn.vercel.app/api/webhooks/instantly \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Security

### Authentication
- Telegram: Bot token (env variable)
- Webhooks: HMAC signature verification (TODO)
- API: Supabase JWT for authenticated routes

### Rate Limiting
- Telegram: 30 messages/second (bot API limit)
- Webhooks: 100 requests/minute (Vercel limit)
- Cron: Max 1 concurrent job per schedule

## Future Enhancements
- [ ] Multi-agent orchestration (sales + delivery agents)
- [ ] Voice command interface (Telegram voice messages)
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Advanced analytics (conversion funnels, cohort analysis)
