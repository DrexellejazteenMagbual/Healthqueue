-- Add profile_picture column to patients table
-- Run this in Supabase SQL Editor

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Optional: Create an index if you plan to query by profile picture existence
CREATE INDEX IF NOT EXISTS idx_patients_has_picture ON patients(profile_picture) WHERE profile_picture IS NOT NULL;

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients';
