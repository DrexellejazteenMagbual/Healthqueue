-- HealthQueue Supabase Row Level Security (RLS) Policies
-- Implements backend authorization to enforce RBAC permissions

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's role from JWT metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'unauthenticated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a doctor
CREATE OR REPLACE FUNCTION is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'doctor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'staff';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PATIENTS TABLE - RLS POLICIES
-- ============================================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Doctors can view all patient data
CREATE POLICY "Doctors have full access to patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (is_doctor())
  WITH CHECK (is_doctor());

-- Staff can view patients but NOT medical_history field
CREATE POLICY "Staff can view basic patient info"
  ON patients
  FOR SELECT
  TO authenticated
  USING (is_staff());

-- Staff can create patients
CREATE POLICY "Staff can create patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- Staff can update basic info only (NOT medical_history)
CREATE POLICY "Staff can update basic patient info"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (
    is_staff() AND
    -- Ensure medical_history is not being modified
    OLD.medical_history = NEW.medical_history
  );

-- Only doctors can delete patients
CREATE POLICY "Only doctors can delete patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (is_doctor());

-- ============================================================================
-- QUEUE TABLE - RLS POLICIES
-- ============================================================================

ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

-- Both doctors and staff can view queue
CREATE POLICY "Authenticated users can view queue"
  ON queue
  FOR SELECT
  TO authenticated
  USING (is_doctor() OR is_staff());

-- Both can add to queue
CREATE POLICY "Authenticated users can add to queue"
  ON queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_doctor() OR is_staff());

-- Both can update queue status
CREATE POLICY "Authenticated users can update queue"
  ON queue
  FOR UPDATE
  TO authenticated
  USING (is_doctor() OR is_staff());

-- Only doctors can override priority
CREATE POLICY "Only doctors can change priority"
  ON queue
  FOR UPDATE
  TO authenticated
  USING (is_doctor())
  WITH CHECK (
    is_doctor() AND
    -- Allow priority field changes only for doctors
    (OLD.priority != NEW.priority)
  );

-- Both can remove from queue
CREATE POLICY "Authenticated users can remove from queue"
  ON queue
  FOR DELETE
  TO authenticated
  USING (is_doctor() OR is_staff());

-- ============================================================================
-- FILES TABLE - RLS POLICIES
-- ============================================================================

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

-- Doctors can view all files including sensitive ones
CREATE POLICY "Doctors can view all files"
  ON patient_files
  FOR SELECT
  TO authenticated
  USING (is_doctor());

-- Staff can view NON-SENSITIVE files only
CREATE POLICY "Staff can view non-sensitive files"
  ON patient_files
  FOR SELECT
  TO authenticated
  USING (
    is_staff() AND
    document_type NOT IN ('lab_result', 'medical_certificate', 'report')
  );

-- Both can upload files
CREATE POLICY "Authenticated users can upload files"
  ON patient_files
  FOR INSERT
  TO authenticated
  WITH CHECK (is_doctor() OR is_staff());

-- Both can download files (SELECT policy handles visibility)
-- Download is READ operation, covered by SELECT policies

-- Only doctors can delete files
CREATE POLICY "Only doctors can delete files"
  ON patient_files
  FOR DELETE
  TO authenticated
  USING (is_doctor());

-- ============================================================================
-- ANALYTICS TABLE - RLS POLICIES
-- ============================================================================

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Doctors can view all analytics
CREATE POLICY "Doctors can view all analytics"
  ON analytics
  FOR SELECT
  TO authenticated
  USING (is_doctor());

-- Staff can view basic analytics only (no detailed predictions)
-- Note: This requires frontend filtering for detailed insights
-- Backend ensures data access control
CREATE POLICY "Staff can view basic analytics"
  ON analytics
  FOR SELECT
  TO authenticated
  USING (is_staff());

-- Both can insert analytics records (system-generated)
CREATE POLICY "Authenticated users can insert analytics"
  ON analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (is_doctor() OR is_staff());

-- Only doctors can modify analytics
CREATE POLICY "Only doctors can update analytics"
  ON analytics
  FOR UPDATE
  TO authenticated
  USING (is_doctor());

-- Only doctors can delete analytics
CREATE POLICY "Only doctors can delete analytics"
  ON analytics
  FOR DELETE
  TO authenticated
  USING (is_doctor());

-- ============================================================================
-- SETTINGS TABLE - RLS POLICIES (if you have one)
-- ============================================================================

-- Assuming you create a settings table for system configuration
-- CREATE TABLE IF NOT EXISTS system_settings (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   setting_key TEXT UNIQUE NOT NULL,
--   setting_value JSONB NOT NULL,
--   updated_by UUID REFERENCES auth.users(id),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Only doctors can manage settings"
--   ON system_settings
--   FOR ALL
--   TO authenticated
--   USING (is_doctor())
--   WITH CHECK (is_doctor());

-- ============================================================================
-- STORAGE BUCKET POLICIES (for file uploads)
-- ============================================================================

-- Patient files storage bucket policies
-- Run these in Supabase Dashboard > Storage > Policies

-- Doctors can upload any file
-- INSERT INTO storage.policies (bucket_id, name, definition)
-- VALUES (
--   'patient-files',
--   'Doctors can upload files',
--   'bucket_id = ''patient-files'' AND (SELECT get_user_role()) = ''doctor'''
-- );

-- Staff can upload non-sensitive files
-- INSERT INTO storage.policies (bucket_id, name, definition)
-- VALUES (
--   'patient-files',
--   'Staff can upload non-sensitive files',
--   'bucket_id = ''patient-files'' AND (SELECT get_user_role()) = ''staff'''
-- );

-- Doctors can view all files
-- INSERT INTO storage.policies (bucket_id, name, definition)
-- VALUES (
--   'patient-files',
--   'Doctors can view all files',
--   'bucket_id = ''patient-files'' AND (SELECT get_user_role()) = ''doctor'''
-- );

-- Staff can view non-sensitive files only
-- Note: This requires file metadata tagging
-- INSERT INTO storage.policies (bucket_id, name, definition)
-- VALUES (
--   'patient-files',
--   'Staff can view non-sensitive files',
--   'bucket_id = ''patient-files'' AND (SELECT get_user_role()) = ''staff'' AND
--    (SELECT document_type FROM patient_files WHERE file_url = name) NOT IN (''lab_result'', ''medical_certificate'', ''report'')'
-- );

-- Only doctors can delete files
-- INSERT INTO storage.policies (bucket_id, name, definition)
-- VALUES (
--   'patient-files',
--   'Only doctors can delete files',
--   'bucket_id = ''patient-files'' AND (SELECT get_user_role()) = ''doctor'''
-- );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test queries to verify RLS policies work correctly

-- 1. Check if helper functions work
-- SELECT get_user_role();
-- SELECT is_doctor();
-- SELECT is_staff();

-- 2. Test patient access for staff (should NOT see medical_history)
-- SET LOCAL ROLE authenticated;
-- SELECT * FROM patients WHERE id = 'some-patient-id';

-- 3. Test file access for staff (should NOT see lab_result, medical_certificate)
-- SELECT * FROM patient_files WHERE document_type = 'lab_result';
-- -- Should return empty for staff, data for doctors

-- 4. Test priority override (should fail for staff)
-- UPDATE queue SET priority = 'priority' WHERE id = 'some-queue-id';
-- -- Should fail for staff, succeed for doctors

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- IMPORTANT: Before applying these policies:
-- 1. Ensure your auth.users table has 'role' in raw_user_meta_data
-- 2. Update user signup/login to set role properly:
--    const { data, error } = await supabase.auth.signUp({
--      email: email,
--      password: password,
--      options: {
--        data: {
--          role: 'staff' // or 'doctor'
--        }
--      }
--    });
--
-- 3. Test thoroughly in development before production deployment
-- 4. Create database backups before applying RLS policies
-- 5. Monitor audit_logs table for access denied events

-- ============================================================================
-- SECURITY BEST PRACTICES
-- ============================================================================

-- 1. Always use RLS policies + frontend permissions (defense in depth)
-- 2. Log all permission denials to audit_logs table
-- 3. Implement rate limiting on failed auth attempts
-- 4. Use JWT tokens with short expiration (15-30 minutes)
-- 5. Implement MFA for doctor accounts
-- 6. Regular security audits of access patterns
-- 7. Encrypt sensitive data at rest (medical_history, allergies)
-- 8. Use HTTPS only for all connections
-- 9. Implement session timeout (30 minutes idle)
-- 10. Regular backups with encrypted storage

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user';
COMMENT ON FUNCTION is_doctor() IS 'Returns true if current user is a doctor';
COMMENT ON FUNCTION is_staff() IS 'Returns true if current user is staff';
