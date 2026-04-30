// Database types matching the Supabase schema
// These are manually defined to match our migrations.
// Run `supabase gen types typescript` to auto-generate from the live DB.

export type UserRole = "owner" | "employee" | "sales_rep";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type GoalStatus = "active" | "achieved" | "dropped";
export type NoteSource = "manual" | "voice" | "ai";
export type LeadSource = "email" | "linkedin";
export type CallStatus = "pending" | "called" | "meeting_booked" | "not_interested" | "closed";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  short_code: string;
  owner_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  business_id: string | null;
  assigned_to: string | null;
  created_by: string;
  scheduled_date: string | null;
  status: TaskStatus;
  priority: number;
  parent_task_id: string | null;
  position: number;
  completed_at: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  business_id: string | null;
  quarter: number | null;
  year: number;
  status: GoalStatus;
  owner_id: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  reflection: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  source: string;
  external_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  source: NoteSource;
  task_id: string | null;
  business_id: string | null;
  created_at: string;
}

export interface WarmLead {
  id: string;
  email: string;
  first_name: string;
  company: string;
  linkedin_url: string | null;
  source: LeadSource;
  replied_at: string;
  call_status: CallStatus;
  assigned_to: string | null;
  created_at: string;
}

export interface LinkedInOutreachLog {
  id: string;
  profile_url: string;
  company: string;
  invite_sent_at: string;
  accepted_at: string | null;
  replied_at: string | null;
  opener_used: string;
  created_at: string;
}
