-- Add CHECK constraint for email validation on organization_members table
-- This ensures that only valid email formats can be stored in the database

ALTER TABLE public.organization_members 
ADD CONSTRAINT valid_invited_email_format 
CHECK (invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');