# Psychocybernet + Hermes Agent Integration

## Overview
Psychocybernet is a Next.js/TypeScript business management platform integrated with Hermes Agent for AI-powered automation. This document covers the technical architecture, integration points, and setup guides.

## System Architecture

### Components
1. **Psychocybernet Platform** (Vercel)
   - Next.js 15 App Router
   - Supabase authentication & database
   - Business dashboard, outreach tracking, task management
   
2. **Hermes Agent** (WSL2 Laptop)
   - Gateway server (port 8080)
   - Telegram integration (user ID: 630921715)
   - Webhook handlers for real-time notifications
   - Cron job scheduler for automated tasks

3. **Integration Layer**
   - `/api/hermes/status` - Health check endpoint
   - `/api/webhooks/instantly` - Email reply notifications
   - Hermes dashboard at `/hermes`

### Data Flow
```
Email Campaign (Instantly) → Webhook → Psychocybernet → Telegram Alert
LinkedIn Automation (Browser Use) → Manual tracking → Commission calc
Sales Close → Database update → 25% commission recorded
```

## Key Features

### 1. Outreach Dashboard (`/outreach`)
- Warm leads management
- LinkedIn connection tracking
- Commission calculator for sales reps
- CSV upload for 20K Estonia leads

### 2. Hermes Control Panel (`/hermes`)
- Gateway health monitoring
- Active agent status
- Task queue visualization
- Quick actions (cron, sessions, settings)

### 3. Business Overview (`/business`)
- Card-based layout (40% viewport, tall cards)
- Revenue metrics, active campaigns
- Sales rep performance tracking

## Setup Guide

### Local Development
```bash
git clone https://github.com/danteteder/Psychocybernet.git
cd Psychocybernet
npm install
cp .env.local.example .env.local
# Add Supabase credentials
npm run dev
```

### Build Verification
Always run before pushing:
```bash
npm run build
```

### Deployment
- Automatic on push to `main` (Vercel)
- Production URL: `https://psychocybernet-v3vn.vercel.app`

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPERBASE_SERVICE_ROLE_KEY=your-service-role-key
INSTANTLY_API_KEY=your-api-key
HERMES_GATEWAY_URL=http://localhost:8080
```

## Database Schema
See `migrations/` folder:
- `004_outreach_tables.sql` - warm_leads, linkedin_outreach_log
- Sales rep user roles (Supabase auth)

## API Endpoints

### `/api/hermes/status`
Returns gateway health, connection status, active agents.

### `/api/webhooks/instantly`
Receives Instantly reply events, triggers Telegram notifications.

## Known Issues
1. **Instantly API warmup data** - Incomplete/stale, trust dashboard over API
2. **Hermes live integration** - Currently mock data, real gateway pending

## Future Enhancements
- [ ] Live Hermes gateway connection
- [ ] Browser Use LinkedIn automation
- [ ] Commission payout tracking
- [ ] Email campaign A/B testing
- [ ] Sales rep leaderboard
