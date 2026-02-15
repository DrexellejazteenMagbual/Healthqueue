# Supabase RLS Implementation Guide

## Overview
This guide explains how to implement Row Level Security (RLS) policies in your Supabase project to enforce backend authorization for the HealthQueue RBAC system.

---

## Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project created
2. **Database Tables**: All tables (patients, queue, patient_files, analytics) must exist
3. **User Authentication**: Supabase Auth configured with user metadata

---

## Step 1: Configure User Roles in Authentication

### Update User Metadata on Signup

Modify your signup/login logic to include role in user metadata:

```typescript
// In your Login.tsx or signup function
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      role: 'staff' // or 'doctor'
    }
  }
});
```

### Update Existing Users

If you have existing users, update their metadata:

```sql
-- In Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"doctor"'::jsonb
)
WHERE email = 'doctor@example.com';

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"staff"'::jsonb
)
WHERE email = 'staff@example.com';
```

---

## Step 2: Apply RLS Policies

### Execute SQL Script

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `SUPABASE_RLS_POLICIES.sql`
4. Execute the entire script

**Important**: Review each policy before execution. Test in development first!

### Verify Helper Functions

After execution, test the helper functions:

```sql
-- Should return your current role ('doctor' or 'staff')
SELECT get_user_role();

-- Should return true/false
SELECT is_doctor();
SELECT is_staff();
```

---

## Step 3: Create Audit Logs Table

Execute `AUDIT_LOGS_TABLE.sql` in Supabase SQL Editor:

```bash
1. Open SQL Editor
2. Load AUDIT_LOGS_TABLE.sql
3. Execute script
4. Verify table created: SELECT * FROM audit_logs LIMIT 1;
```

---

## Step 4: Update Frontend Authentication

### Modify App.tsx to Use JWT Role

```typescript
// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [userRole, setUserRole] = useState<'doctor' | 'staff' | null>(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserRole(session.user.user_metadata?.role || 'staff');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserRole(session.user.user_metadata?.role || 'staff');
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Continue with your routing logic...
}
```

---

## Step 5: Integrate Audit Logging

### Add Audit Logging to Permission Checks

```typescript
// Example in PatientProfiles.tsx
import { auditService } from '../lib/services/auditService';

const viewMedicalHistory = async (patient: Patient) => {
  const userEmail = user?.email || 'unknown';
  const canView = permissions.canViewAllPatientDetails;
  
  // Log the permission check
  await auditService.logPermissionCheck(
    userEmail,
    userRole,
    'canViewAllPatientDetails',
    canView,
    { type: 'patient', id: patient.id }
  );
  
  if (!canView) {
    // Show error toast
    return;
  }
  
  // Proceed with viewing
};
```

### Add Logging to Data Modifications

```typescript
// Example in FileManagement.tsx
const handleDeleteFile = async (fileId: string) => {
  const userEmail = user?.email || 'unknown';
  
  // Check permission
  if (!permissions.canDeleteFiles) {
    await auditService.logPermissionCheck(
      userEmail,
      userRole,
      'canDeleteFiles',
      false,
      { type: 'file', id: fileId }
    );
    alert('You do not have permission to delete files.');
    return;
  }
  
  // Log the deletion
  await auditService.logDataModification(
    userEmail,
    userRole,
    'file',
    fileId,
    'delete'
  );
  
  // Perform deletion
  const { error } = await supabase
    .from('patient_files')
    .delete()
    .eq('id', fileId);
    
  // Handle result...
};
```

---

## Step 6: Testing RLS Policies

### Test as Doctor

```sql
-- 1. Login as doctor in your app
-- 2. Open Supabase SQL Editor
-- 3. Run test queries:

-- Should return all patients including medical_history
SELECT * FROM patients;

-- Should return all files including sensitive ones
SELECT * FROM patient_files WHERE document_type = 'lab_result';

-- Should succeed
UPDATE queue SET priority = 'priority' WHERE id = 'some-queue-id';

-- Should succeed
DELETE FROM patient_files WHERE id = 'some-file-id';
```

### Test as Staff

```sql
-- 1. Login as staff in your app
-- 2. Open Supabase SQL Editor
-- 3. Run test queries:

-- Should return patients WITHOUT medical_history
SELECT * FROM patients;

-- Should return EMPTY (sensitive files blocked)
SELECT * FROM patient_files WHERE document_type = 'lab_result';

-- Should FAIL (priority override not allowed)
UPDATE queue SET priority = 'priority' WHERE id = 'some-queue-id';

-- Should FAIL (file deletion not allowed)
DELETE FROM patient_files WHERE id = 'some-file-id';
```

---

## Step 7: Monitoring & Alerts

### Create Audit Log Dashboard

```typescript
// components/AuditLogDashboard.tsx (Doctor only)
import { useEffect, useState } from 'react';
import { auditService } from '../lib/services/auditService';

const AuditLogDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [deniedAttempts, setDeniedAttempts] = useState([]);

  useEffect(() => {
    // Load recent logs
    auditService.getAuditLogs({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
    }).then(setLogs);

    // Load security alerts
    auditService.getSecurityAlerts(24).then(setDeniedAttempts);
  }, []);

  return (
    <div>
      <h2>Audit Log - Last 24 Hours</h2>
      {/* Display logs table */}
      
      <h3>Security Alerts (Repeated Denied Access)</h3>
      {/* Display alerts */}
    </div>
  );
};
```

### Set Up Notifications

```typescript
// Send email alert on repeated denial
const checkForSuspiciousActivity = async () => {
  const alerts = await auditService.getSecurityAlerts(1); // Last hour
  
  if (alerts.length > 0) {
    // Send notification to admin
    await sendEmailAlert(alerts);
  }
};

// Run every hour
setInterval(checkForSuspiciousActivity, 60 * 60 * 1000);
```

---

## Step 8: Storage Bucket Policies

### Configure File Storage RLS

1. Go to **Supabase Dashboard > Storage**
2. Create bucket `patient-files` if not exists
3. **Policies** tab → Add custom policies:

```sql
-- Doctor upload policy
CREATE POLICY "Doctors can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-files' AND
  (SELECT get_user_role()) = 'doctor'
);

-- Staff upload non-sensitive policy
CREATE POLICY "Staff can upload non-sensitive files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-files' AND
  (SELECT get_user_role()) = 'staff'
);

-- Doctor can view all
CREATE POLICY "Doctors can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-files' AND
  (SELECT get_user_role()) = 'doctor'
);

-- Only doctors can delete
CREATE POLICY "Only doctors can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-files' AND
  (SELECT get_user_role()) = 'doctor'
);
```

---

## Troubleshooting

### Issue: RLS Denying All Access

**Cause**: User role not set in JWT metadata

**Fix**:
```sql
-- Check user metadata
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your@email.com';

-- Should show: {"role": "doctor"}
```

### Issue: Policies Not Working

**Cause**: RLS not enabled on table

**Fix**:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
```

### Issue: Cannot Update Own Data

**Cause**: Missing UPDATE policy

**Fix**: Check `WITH CHECK` clause in policies allows the operation

---

## Security Checklist

- [ ] User roles stored in JWT metadata
- [ ] RLS enabled on all tables
- [ ] Helper functions created and tested
- [ ] Policies applied and verified
- [ ] Audit logs table created
- [ ] Frontend audit logging integrated
- [ ] Storage bucket policies configured
- [ ] Test scenarios passed (doctor & staff)
- [ ] Monitoring dashboard created
- [ ] Alert system configured

---

## Next Steps

1. **Implement MFA** for doctor accounts (Supabase Auth supports it)
2. **Add Session Timeout** (auto-logout after inactivity)
3. **Enable Password Complexity** requirements
4. **Set up Email Alerts** for security events
5. **Regular Audit Log Reviews** (weekly)
6. **Penetration Testing** before production launch

---

## Support

For issues with implementation:
1. Check Supabase logs: Dashboard > Logs > Postgres Logs
2. Review audit_logs for denied access patterns
3. Test with SQL Editor using different user contexts
4. Verify JWT token payload in browser DevTools

---

**Document Version**: 1.0  
**Last Updated**: February 12, 2026  
**Author**: HealthQueue Development Team
