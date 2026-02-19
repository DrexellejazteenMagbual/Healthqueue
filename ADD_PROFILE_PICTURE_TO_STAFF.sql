-- ============================================
-- ADD PROFILE PICTURE SUPPORT TO STAFF USERS
-- ============================================
-- Run this SQL in Supabase SQL Editor to add profile picture functionality

-- 1. Add profile_picture column to staff_users table
-- Note: Storing as TEXT to hold base64-encoded image data (same as patient profiles)
ALTER TABLE staff_users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add comment to the column
COMMENT ON COLUMN staff_users.profile_picture IS 'Base64-encoded profile picture (compressed JPEG)';

-- ============================================
-- SQL PART COMPLETE!
-- ============================================
-- The database schema is now ready.
-- Profile pictures will be stored as base64-encoded strings directly in the database,
-- similar to how patient profile pictures are stored.
--
-- No additional Supabase Storage setup is required!

-- ============================================
-- USAGE IN APPLICATION:
-- ============================================
-- The profile picture is stored as a compressed base64-encoded JPEG string.
-- 
-- Upload process:
-- 1. User selects image file
-- 2. Image is resized to max 800x800 pixels
-- 3. Image is compressed to JPEG quality 0.7
-- 4. Result is converted to base64 string
-- 5. Base64 string is stored in staff_users.profile_picture
--
-- Display:
-- - Use the base64 string directly in <img src={profilePicture} />
--
-- Update example:
-- await supabase
--   .from('staff_users')
--   .update({ profile_picture: base64String })
--   .eq('id', userId);

-- ============================================
-- DONE! Profile picture support added
-- ============================================
