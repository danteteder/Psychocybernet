-- Nordspike Outreach System Tables
-- Created: 2026-04-30
-- Purpose: Track warm leads from email/LinkedIn replies and sales follow-up

-- Warm leads table (replies from Instantly + LinkedIn)
CREATE TABLE IF NOT EXISTS warm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  company TEXT NOT NULL,
  linkedin_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('email', 'linkedin')),
  replied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  call_status TEXT NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'called', 'meeting_booked', 'not_interested', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast filtering by call status
CREATE INDEX IF NOT EXISTS idx_warm_leads_call_status ON warm_leads(call_status);
CREATE INDEX IF NOT EXISTS idx_warm_leads_assigned_to ON warm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_warm_leads_source ON warm_leads(source);
CREATE INDEX IF NOT EXISTS idx_warm_leads_replied_at ON warm_leads(replied_at DESC);

-- LinkedIn outreach log (track invites, accepts, replies)
CREATE TABLE IF NOT EXISTS linkedin_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_url TEXT NOT NULL,
  company TEXT NOT NULL,
  invite_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  opener_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_profile_url ON linkedin_outreach_log(profile_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_invite_sent ON linkedin_outreach_log(invite_sent_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE warm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_outreach_log ENABLE ROW LEVEL SECURITY;

-- Sales reps can see assigned leads
CREATE POLICY sales_reps_can_view_assigned_leads ON warm_leads
  FOR SELECT
  USING (
    assigned_to = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Sales reps can update their assigned leads
CREATE POLICY sales_reps_can_update_assigned_leads ON warm_leads
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Everyone can insert warm leads (webhook, Browser Use scripts)
CREATE POLICY everyone_can_insert_warm_leads ON warm_leads
  FOR INSERT
  WITH CHECK (true);

-- Everyone can view LinkedIn logs
CREATE POLICY everyone_can_view_linkedin_logs ON linkedin_outreach_log
  FOR SELECT
  USING (true);

-- Only admin/owner can insert LinkedIn logs (Browser Use webhook)
CREATE POLICY admin_can_insert_linkedin_logs ON linkedin_outreach_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Add sales_rep role to user_role enum (handled in migration 004 if needed)
-- This is a placeholder in case the enum needs updating
