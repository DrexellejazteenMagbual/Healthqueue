# HealthQueue Patient Queue Management System

This project is a comprehensive patient queue management system designed for healthcare facilities, featuring predictive analytics, real-time queue updates, and role-based access control.

## 🚀 Quick Start

### Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.
---

## 📊 Sample Analytics Datasets

The system includes comprehensive sample datasets for testing predictive analytics and illness trend forecasting features.

### Quick Import

```bash
# 1. Open Supabase SQL Editor
# 2. Run SAMPLE_ANALYTICS_DATA.sql
# 3. Navigate to Dashboard or Analytics to see results
```

### What's Included

- **90 days** of historical data (~2,400 visit records)
- **10 illness categories** with realistic distribution patterns
- **Seasonal trends** (flu season peaks, stable conditions, declining illnesses)
- **Predictive scenarios** for testing forecasting features
- **Multiple formats:** SQL, JSON, CSV, and Python generator

### Files

| File | Purpose |
|------|---------|
| `SAMPLE_ANALYTICS_DATA.sql` | Primary SQL import (root directory) |
| `sample_data/analytics_dataset.json` | JSON format for API testing |
| `sample_data/visits_sample.csv` | CSV for spreadsheet analysis |
| `sample_data/generate_sample_data.py` | Custom data generator |
| `sample_data/README.md` | Comprehensive documentation |
| `SAMPLE_DATA_QUICK_START.md` | Quick start guide |

### Demo Credentials

```
Doctor Account (Full Analytics Access):
  Email: doctor@clinic.com
  Password: doctor123

Staff Account (Basic Access):
  Email: staff@clinic.com
  Password: staff123
```

**📖 Full Documentation:** See [SAMPLE_DATA_QUICK_START.md](SAMPLE_DATA_QUICK_START.md) or [sample_data/README.md](sample_data/README.md)

---

## 🏥 System Features

- **Patient Management** - Profile creation, medical history, demographics
- **Queue Management** - Real-time updates, priority handling, status tracking
- **Analytics Dashboard** - Patient volume trends, predictive insights, illness forecasting
- **File Management** - Secure document upload and storage
- **Audit Logging** - Comprehensive activity tracking for compliance
- **Role-Based Access Control** - Doctor and staff permissions
- **TV Display Mode** - Public queue display with audio announcements
- **Settings Management** - Customizable clinic information

---

## 📚 Documentation

- **System Overview:** [CURRENT_SYSTEM_OVERVIEW.md](CURRENT_SYSTEM_OVERVIEW.md)
- **Sample Data Guide:** [SAMPLE_DATA_QUICK_START.md](SAMPLE_DATA_QUICK_START.md)
- **Supabase Setup:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Database Schema:** [SUPABASE_TABLES.sql](SUPABASE_TABLES.sql)
- **Staff Management:** [STAFF_MANAGEMENT_GUIDE.md](STAFF_MANAGEMENT_GUIDE.md)
- **Audit Logging:** [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md)

---

## 🛠️ Technology Stack

- **Frontend:** React 19.2.4, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Charts:** Chart.js
- **Icons:** Lucide React
- **Audio:** Web Speech API

---

## 📦 Project Structure

```
healthqueue-system/
├── src/
│   ├── components/        # React components
│   ├── lib/              # Services and utilities
│   ├── types/            # TypeScript type definitions
│   └── styles.css        # Global styles
├── sample_data/          # Sample datasets and generator
├── public/               # Static assets
└── [documentation].md    # Various documentation files
```

---
## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
