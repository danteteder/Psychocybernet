-- Seed the 4 businesses
-- These will be linked to the owner once they sign up
-- For now, we insert without owner_id (will be updated on first login)

-- Note: Run this AFTER the owner has signed up, or update owner_id manually
-- This is a convenience seed for development

-- The owner should update these with their actual user ID after signing up
-- Example: UPDATE businesses SET owner_id = 'your-user-uuid' WHERE owner_id IS NULL;

INSERT INTO public.businesses (name, short_code) VALUES
  ('Optimal Offspring', 'OO'),
  ('NordSpike', 'NS'),
  ('Writer', 'W'),
  ('Real Estate', 'RE')
ON CONFLICT DO NOTHING;
