-- Row Level Security policies
-- Owner sees everything they own. Employees see only assigned tasks.

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Owner can read employee profiles they created
CREATE POLICY "Owner can read employee profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- ============================================
-- BUSINESSES
-- ============================================
-- Owner can do everything with their businesses
CREATE POLICY "Owner full access to businesses"
  ON public.businesses FOR ALL
  USING (owner_id = auth.uid());

-- Employees can read businesses (to see business badges on tasks)
CREATE POLICY "Employees can read businesses"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.business_id = businesses.id
        AND t.assigned_to = auth.uid()
    )
  );

-- ============================================
-- TASKS
-- ============================================
-- Owner sees all tasks they created
CREATE POLICY "Owner full access to own tasks"
  ON public.tasks FOR ALL
  USING (created_by = auth.uid());

-- Employees see tasks assigned to them
CREATE POLICY "Employees can read assigned tasks"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- Employees can update status on assigned tasks
CREATE POLICY "Employees can update assigned tasks"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- ============================================
-- GOALS
-- ============================================
-- Owner only (employees don't see strategic goals)
CREATE POLICY "Owner full access to goals"
  ON public.goals FOR ALL
  USING (owner_id = auth.uid());

-- ============================================
-- FOCUS SESSIONS
-- ============================================
-- Users manage their own sessions
CREATE POLICY "Users manage own focus sessions"
  ON public.focus_sessions FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- CALENDAR EVENTS
-- ============================================
-- Users see their own events
CREATE POLICY "Users manage own calendar events"
  ON public.calendar_events FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- ACTIVITY LOG
-- ============================================
-- Users see their own activity
CREATE POLICY "Users read own activity"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Insert is allowed for the user's own entries
CREATE POLICY "Users insert own activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- NOTES
-- ============================================
-- Users manage their own notes
CREATE POLICY "Users manage own notes"
  ON public.notes FOR ALL
  USING (user_id = auth.uid());
