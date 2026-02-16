# Profile Picture Update Fix

## Issue
You're seeing "Failed to update patient" because the database is missing the `profile_picture` column.

## Solution
Run the following SQL command in your Supabase SQL Editor:

### Step 1: Open Supabase
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration
Copy and paste this SQL command:

```sql
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

CREATE INDEX IF NOT EXISTS idx_patients_has_picture 
ON patients(profile_picture) 
WHERE profile_picture IS NOT NULL;
```

### Step 3: Execute
Click the "Run" button to execute the SQL

### Step 4: Verify
You can verify the column was added by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients';
```

You should see `profile_picture` with type `text` in the results.

## Alternative: Use the Migration File
The SQL commands are also available in the file:
- `ADD_PROFILE_PICTURE_COLUMN.sql`

## After Running the Migration
1. Refresh your application
2. Try updating a patient again
3. The profile picture upload should now work!

## Updated Schema
The main schema file `SUPABASE_TABLES.sql` has been updated to include the `profile_picture` column for future reference.
