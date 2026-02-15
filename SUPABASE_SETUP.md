# Supabase Backend Integration

## Overview
HealthQueue system uses **Supabase** as the backend database. Supabase is an open-source Firebase alternative that provides:
- PostgreSQL database
- Real-time subscriptions
- Authentication
- Edge functions
- File storage

## What You Need to Set Up

### Step 1: Create a Supabase Account
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"Sign up"** and create an account
3. Verify your email

### Step 2: Create a New Project
1. Click **"New Project"**
2. Fill in the project details:
   - **Project Name**: e.g., "HealthQueue"
   - **Database Password**: Create a strong password (you'll need this)
   - **Region**: Choose closest to your location
3. Click **"Create new project"** (takes 1-2 minutes)

### Step 3: Get Your Credentials
1. Once project is created, go to **Settings** → **API** in the sidebar
2. Copy these credentials:
   - **Project URL**: This is your `REACT_APP_SUPABASE_URL`
   - **Anon Key**: This is your `REACT_APP_SUPABASE_ANON_KEY`
   - **Service Role Key**: Keep this SECRET (for backend operations)

### Step 4: Create Environment Variables
1. Create a `.env.local` file in your project root (next to package.json)
2. Add these variables:

```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxx
```

**Important**: Replace with your actual credentials from Step 3.

## Database Schema

### Tables to Create in Supabase

#### 1. **patients** table

```sql
CREATE TABLE patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INT,
  gender VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  emergency_contact TEXT,
  medical_history TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  blood_type VARCHAR(10),
  last_visit TIMESTAMP,
  risk_level VARCHAR(50) DEFAULT 'Low',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **queue** table

```sql
CREATE TABLE queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  queue_number INT NOT NULL,
  priority VARCHAR(50) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'waiting',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **analytics** table

```sql
CREATE TABLE analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_type VARCHAR(50) DEFAULT 'regular',
  date DATE NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. **illness_tracking** table

```sql
CREATE TABLE illness_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  illness_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Creating Tables in Supabase UI

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the sidebar
3. Click **"New Query"**
4. Copy and paste each table creation SQL above (one at a time)
5. Click **"Run"** for each

## File Structure

```
src/
├── lib/
│   ├── supabase.ts                    # Supabase client configuration
│   └── services/
│       ├── patientService.ts          # Patient CRUD operations
│       ├── queueService.ts            # Queue management operations
│       └── analyticsService.ts        # Analytics operations
├── types/
│   └── index.ts                       # TypeScript interfaces
└── components/
    └── [your components]
```

## Available Services

### Patient Service (`patientService.ts`)

```typescript
import { patientService } from '../lib/services/patientService';

// Create patient
const { data, error } = await patientService.createPatient(patientData);

// Get all patients
const { data, error } = await patientService.getAllPatients();

// Get patient by ID
const { data, error } = await patientService.getPatientById(patientId);

// Update patient
const { data, error } = await patientService.updatePatient(patientId, updates);

// Delete patient
const { data, error } = await patientService.deletePatient(patientId);

// Search patients
const { data, error } = await patientService.searchPatients('John');
```

### Queue Service (`queueService.ts`)

```typescript
import { queueService } from '../lib/services/queueService';

// Add to queue
const { data, error } = await queueService.addToQueue(queueItem);

// Get current queue
const { data, error } = await queueService.getQueue();

// Update queue status
const { data, error } = await queueService.updateQueueStatus(queueId, 'serving');

// Remove from queue
const { data, error } = await queueService.removeFromQueue(queueId);

// Get queue statistics
const { data, error } = await queueService.getQueueStats();

// Get queue history
const { data, error } = await queueService.getQueueHistory();
```

### Analytics Service (`analyticsService.ts`)

```typescript
import { analyticsService } from '../lib/services/analyticsService';

// Log visit
const { data, error } = await analyticsService.logPatientVisit(patientId);

// Get daily visits
const { data, error } = await analyticsService.getDailyVisits('2024-02-10');

// Get weekly visits
const { data, error } = await analyticsService.getWeeklyVisits();

// Get monthly visits
const { data, error } = await analyticsService.getMonthlyVisits();

// Get visit statistics
const { data, error } = await analyticsService.getVisitStats('2024-02-01', '2024-02-10');

// Track illness
const { data, error } = await analyticsService.trackIllness(patientId, 'Hypertension');

// Get common illnesses
const { data, error } = await analyticsService.getCommonIllnesses();
```

## Security Best Practices

### 🔒 Never expose credentials:
- ❌ Don't commit `.env.local` to git
- ❌ Don't share your Service Role Key
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use only the Anon Key in frontend code

### 🛡️ Row Level Security (RLS) - Recommended

In Supabase **SQL Editor**, run:

```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE illness_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies (example - public read/write for now)
CREATE POLICY "Allow public read" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON patients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON patients FOR DELETE USING (true);

-- Repeat for queue and analytics tables
```

## Integration with React Components

### Example: Using Patient Service in a Component

```typescript
import { patientService } from '../lib/services/patientService';

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const { data, error } = await patientService.getAllPatients();
      
      if (error) {
        console.error('Error fetching patients:', error);
      } else {
        setPatients(data || []);
      }
      
      setLoading(false);
    };

    fetchPatients();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {patients.map(patient => (
        <div key={patient.id}>
          <h3>{patient.firstName} {patient.lastName}</h3>
          <p>Phone: {patient.phone}</p>
        </div>
      ))}
    </div>
  );
};
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Solution: Make sure `.env.local` file exists with correct credentials
- Restart your development server after adding .env variables

### Error: "Cannot read property 'select' of undefined"
- Solution: Check that `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are correctly set
- Verify credentials from your Supabase project settings

### Error: "Relation does not exist"
- Solution: Tables haven't been created in Supabase. Run the SQL scripts in SQL Editor

### Error: "403 Forbidden"
- Solution: Check Row Level Security (RLS) policies or use Service Role Key
- Start with public access, then implement RLS after testing

## Next Steps

1. ✅ Create Supabase account and project
2. ✅ Copy credentials to `.env.local`
3. ✅ Create tables using SQL Editor
4. ✅ Update React components to use services
5. ✅ Test database operations
6. ✅ Implement authentication (optional)
7. ✅ Set up RLS policies for production

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | `https://abcd1234.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Public client key | `eyJhbGciOi...` |
| `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` | Secret admin key (don't expose) | `eyJhbGciOi...` |

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://github.com/supabase/supabase-js)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
