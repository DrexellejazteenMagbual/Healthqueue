# Staff Management Feature

## Overview
The Staff Management feature allows doctors/administrators to create, view, and manage staff accounts in the HealthQueue system.

## Features

### 1. **Add Staff Accounts**
- Create new doctor or staff accounts
- Set full name, email, password, and role
- Password validation (minimum 6 characters)
- Duplicate email detection

### 2. **View Staff Accounts**
- List all staff members in a table view
- See user details: name, email, role, status, creation date
- Visual role badges (Doctor = blue, Staff = gray)

### 3. **Manage Account Status**
- Toggle account active/inactive status
- Click on status badge to change
- Active accounts can log in, inactive cannot

### 4. **Delete Accounts**
- Remove staff accounts permanently
- Confirmation dialog to prevent accidents

## Setup Instructions

### Step 1: Create Database Table
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `STAFF_USERS_TABLE.sql`
4. Run the SQL script
5. Verify the `staff_users` table is created

### Step 2: Access the Feature
1. Log in as a doctor account
2. Navigate to "Staff Management" in the sidebar
3. Start adding staff accounts

## Usage Guide

### Adding a New Staff Member
1. Click "Add Staff" button
2. Fill in the form:
   - **Full Name**: Employee's complete name
   - **Email**: Must be unique (used for login)
   - **Password**: Minimum 6 characters
   - **Role**: Choose "Staff" or "Doctor"
3. Click "Add Staff" to save

### Managing Existing Staff
- **View Details**: All information visible in the table
- **Change Status**: Click the status badge (green/red) to toggle active/inactive
- **Delete Account**: Click the trash icon and confirm deletion

## Access Control

### Doctor Role
- ✅ Full access to Staff Management
- ✅ Can add new staff accounts
- ✅ Can view all staff accounts
- ✅ Can activate/deactivate accounts
- ✅ Can delete accounts

### Staff Role
- ❌ Cannot access Staff Management
- Shows "Access Restricted" message if attempted

## Security Considerations

### Current Implementation (Demo)
- Passwords are encoded using Base64 (NOT secure for production)
- Suitable for development and testing only

### Production Recommendations
1. **Use Supabase Auth** instead of custom user table
2. **Implement bcrypt/argon2** password hashing on the backend
3. **Add email verification** for new accounts
4. **Implement rate limiting** for login attempts
5. **Add password reset** functionality
6. **Enable 2FA** (Two-Factor Authentication)
7. **Add session management** with JWT tokens
8. **Implement password strength requirements**
9. **Add audit logging** for staff management actions

## Database Schema

```sql
staff_users
├── id (UUID, Primary Key)
├── email (VARCHAR, Unique, NOT NULL)
├── full_name (VARCHAR, NOT NULL)
├── role (VARCHAR, 'doctor' or 'staff')
├── password_hash (TEXT, NOT NULL)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── last_login (TIMESTAMP, nullable)
└── is_active (BOOLEAN, default: true)
```

## Sample Accounts

The setup script creates two sample accounts:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@clinic.com | admin123 | Doctor | Active |
| staff@clinic.com | staff123 | Staff | Active |

## Translations

The feature supports both English and Tagalog:

| English | Tagalog |
|---------|---------|
| Staff Management | Pamamahala ng Staff |
| Add Staff | Magdagdag ng Staff |
| Staff Accounts | Mga Account ng Staff |
| Full Name | Buong Pangalan |
| Password | Password |
| Role | Tungkulin |
| Status | Katayuan |
| Actions | Mga Aksyon |

## Troubleshooting

### "Failed to load staff users"
- Check Supabase connection
- Verify `staff_users` table exists
- Check RLS policies are enabled

### "This email is already registered"
- Email must be unique
- Check existing accounts
- Use different email address

### "Access Restricted" message
- Only doctors can access this feature
- Log in with a doctor account
- Contact administrator for role change

### Table doesn't exist error
- Run the `STAFF_USERS_TABLE.sql` script
- Verify table creation in Supabase
- Check for SQL syntax errors

## Future Enhancements

Potential improvements for production:
- [ ] Password reset via email
- [ ] Email verification
- [ ] Role-based permissions matrix
- [ ] Activity logs for staff actions
- [ ] Bulk import from CSV
- [ ] Export staff list
- [ ] Advanced filtering and search
- [ ] User profile editing
- [ ] Password change functionality
- [ ] Session timeout configuration
- [ ] Login attempt monitoring
- [ ] IP whitelisting
