# Supabase Credentials Setup - Quick Start

## ⚡ Quick Summary: What You Need to Do

### YES, you will need to provide credentials! Here's how:

## 5-Minute Setup

### 1️⃣ Go to Supabase.com
```
https://app.supabase.com → Sign up (free)
```

### 2️⃣ Create a Project
- Project name: `HealthQueue`
- Database password: Create a strong one (save it)
- Region: Pick your nearest location

### 3️⃣ Copy These Two Credentials (after project creates)
Settings → API

```
REACT_APP_SUPABASE_URL = https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOi...
```

### 4️⃣ Create `.env.local` File
In your project root (same folder as package.json):

```
# File: .env.local

REACT_APP_SUPABASE_URL=your_url_here
REACT_APP_SUPABASE_ANON_KEY=your_key_here
```

### 5️⃣ Create Database Tables
In Supabase, go to **SQL Editor** and paste/run the SQL from [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 6️⃣ Restart Dev Server
```bash
npm start
```

## 📋 Checklist

- [ ] Created Supabase account at supabase.com
- [ ] Created new project
- [ ] Copied URL to REACT_APP_SUPABASE_URL
- [ ] Copied Anon Key to REACT_APP_SUPABASE_ANON_KEY
- [ ] Created `.env.local` file with credentials
- [ ] Added `.env.local` to `.gitignore` (don't commit it!)
- [ ] Created 4 tables in Supabase (patients, queue, analytics, illness_tracking)
- [ ] Restarted npm dev server

## 🔐 Keep Your Credentials Secret!

```
❌ Don't share credentials publicly
❌ Don't commit .env.local to GitHub
❌ Don't use in production without RLS policies
✅ Always use ANON_KEY in frontend (not SERVICE_ROLE_KEY)
✅ Generate new keys if you accidentally expose them
```

## ✨ What You'll Get

Once set up, all your data is:
- **Stored securely** in PostgreSQL database
- **Real-time** - changes sync instantly
- **Scalable** - handles 1000s of patients
- **Backed up** - automatic daily backups
- **Accessible** - from anywhere with internet

## 🆘 Stuck?

1. Check that `.env.local` file exists
2. Verify credentials are correct (copy-paste from Supabase)
3. Make sure tables exist in Supabase SQL Editor
4. Restart development server after adding `.env.local`
5. Check browser console for error messages

## 📚 Full Documentation

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for:
- Detailed step-by-step guide
- Database schema details
- All available services/functions
- Security best practices
- Troubleshooting guide
