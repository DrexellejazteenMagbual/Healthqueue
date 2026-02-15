-- HealthQueue Audit Logging System
-- This table tracks all security-relevant events in the system

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT CHECK (user_role IN ('doctor', 'staff')),
  
  -- Event Information
  event_type TEXT NOT NULL, -- 'permission_check', 'data_access', 'data_modification', 'login', 'logout', 'priority_override', etc.
  action TEXT NOT NULL, -- The specific action attempted (e.g., 'view_patient_medical_history', 'delete_file')
  resource_type TEXT, -- 'patient', 'queue', 'file', 'settings', etc.
  resource_id TEXT, -- ID of the affected resource
  
  -- Access Control
  permission_required TEXT, -- The permission that was checked (e.g., 'canViewAllPatientDetails')
  access_granted BOOLEAN NOT NULL, -- Whether the action was allowed
  
  -- Context & Details
  details JSONB, -- Additional context (e.g., old/new values, justification for priority override)
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_access_granted ON audit_logs(access_granted) WHERE access_granted = false; -- Focus on denied access
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Row Level Security (RLS) Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only doctors can view audit logs
CREATE POLICY "Doctors can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'doctor'
  );

-- All authenticated users can insert audit logs (system logging)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- This ensures audit trail integrity

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all security-relevant events';
COMMENT ON COLUMN audit_logs.event_type IS 'Category of event (permission_check, data_access, etc.)';
COMMENT ON COLUMN audit_logs.access_granted IS 'Whether the attempted action was allowed';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with additional context specific to the event type';
