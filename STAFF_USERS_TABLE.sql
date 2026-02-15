-- ============================================
-- STAFF USERS TABLE SETUP
-- ============================================
-- Run this SQL in Supabase SQL Editor to create the staff_users table
-- This table is required for the Staff Management feature

-- Create staff_users table
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'staff')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);

-- Disable Row Level Security for development
-- NOTE: In production, enable RLS and use proper Supabase Auth
ALTER TABLE staff_users DISABLE ROW LEVEL SECURITY;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS staff_users_updated_at ON staff_users;

CREATE TRIGGER staff_users_updated_at
  BEFORE UPDATE ON staff_users
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_users_updated_at();

-- ============================================
-- OPTIONAL: Insert sample admin account
-- ============================================
-- Password: admin123 (encoded in base64 for demo purposes)
-- In production, use proper bcrypt hashing on the backend!

INSERT INTO staff_users (email, full_name, role, password_hash, is_active)
VALUES 
  ('admin@clinic.com', 'Admin Doctor', 'doctor', 'YWRtaW4xMjM=', true),
  ('staff@clinic.com', 'Staff Member', 'staff', 'c3RhZmYxMjM=', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- DONE! Staff users table created successfully
-- ============================================

-- IMPORTANT SECURITY NOTES:
-- 1. The password hashing in this demo uses simple Base64 encoding
-- 2. In production, implement proper bcrypt/argon2 hashing on the backend
-- 3. Consider implementing rate limiting for login attempts
-- 4. Add email verification for new accounts
-- 5. Implement password reset functionality
-- 6. Consider using Supabase Auth instead of custom user table
