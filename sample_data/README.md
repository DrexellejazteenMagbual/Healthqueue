# Sample Datasets for Predictive Analysis & Analytics

This directory contains comprehensive sample datasets designed to demonstrate and test the HealthQueue system's predictive analytics and illness trend forecasting features.

## 📁 Files Overview

### 1. **SAMPLE_ANALYTICS_DATA.sql** (Primary Dataset)
**Location:** Root directory  
**Format:** PostgreSQL/Supabase SQL  
**Purpose:** Complete database import with 90 days of historical data

**Contains:**
- 15 sample patients with diverse demographics
- ~2,400 visit records spanning 90 days
- 10 illness categories with realistic distributions
- Seasonal trend patterns (flu season peaks, etc.)
- Targeted predictive scenarios (increasing/decreasing/stable trends)
- Automatic verification queries

**Key Features:**
- Weighted illness probabilities matching real-world patterns
- Weekday vs. weekend volume variations
- Seasonal multipliers for flu-like illnesses
- Time-based randomization (8am-6pm visit times)

**Usage:**
```sql
-- Run in Supabase SQL Editor
-- Option 1: Run the entire file
-- Copy and paste the full content

-- Option 2: Run section by section
-- Execute each DO block separately for better control
```

### 2. **analytics_dataset.json**
**Location:** `sample_data/`  
**Format:** JSON  
**Purpose:** Structured data for API testing and reference

**Contains:**
- Illness categories with probability weights
- Sample patient profiles
- Daily volume patterns and peak hours
- Predictive scenarios with confidence levels
- Historical summary statistics
- Resource recommendations (staffing, inventory)
- Sample visit records

**Usage:**
```javascript
// Import in Node.js/React
import analyticsData from './sample_data/analytics_dataset.json';

// Use for testing
const illnessCategories = analyticsData.illness_categories;
const predictions = analyticsData.predictive_scenarios;

// Mock API responses
fetch('/api/analytics')
  .then(() => analyticsData);
```

### 3. **visits_sample.csv**
**Location:** `sample_data/`  
**Format:** CSV  
**Purpose:** Spreadsheet analysis and quick data review

**Columns:**
- date, patient_id, patient_name, age, gender
- visit_type, time, queue_number, wait_time_minutes

**Usage:**
- Open in Excel/Google Sheets for analysis
- Import into data visualization tools (Tableau, Power BI)
- Use for statistical analysis in Python/R
- Generate custom reports and charts

```python
# Python pandas example
import pandas as pd
df = pd.read_csv('sample_data/visits_sample.csv')
df.groupby('visit_type').size().plot(kind='bar')
```

## 🎯 Data Characteristics

### Illness Distribution (Designed for Predictive Insights)

| Illness | Weight | Trend | Seasonal Factor |
|---------|--------|-------|----------------|
| Common Cold | 18% | Increasing | 1.3x |
| Flu | 14% | Increasing | 1.8x |
| Hypertension | 13% | Stable | 1.0x |
| Diabetes | 12% | Stable | 1.0x |
| Fever | 11% | Increasing | 1.2x |
| Cough and Colds | 9% | Increasing | 1.4x |
| Headache | 7% | Stable | 1.0x |
| Stomach Pain | 6% | Decreasing | 0.8x |
| Allergies | 5% | Stable | 1.1x |
| Other | 5% | Stable | 1.0x |

### Volume Patterns

- **Weekday Average:** 30 patients/day
- **Weekend Average:** 15 patients/day
- **Peak Hours:** 9-11am, 2-4pm
- **Total 90-day Records:** ~2,400 visits

### Predictive Scenarios Included

1. **Flu Season Peak** (Increasing Trend)
   - Current: 8 cases/day → Predicted: 15 cases/month
   - Confidence: 85%

2. **Hypertension Management** (Stable Trend)
   - Current: 5 cases/day → Predicted: 5 cases/month
   - Confidence: 92%

3. **Stomach Pain Declining** (Decreasing Trend)
   - Current: 2 cases/day → Predicted: 0.5 cases/month
   - Confidence: 78%

4. **Common Cold Surge** (Increasing Trend)
   - Current: 7 cases/day → Predicted: 13 cases/month
   - Confidence: 81%

## 🚀 Quick Start

### Option 1: Full Database Import (Recommended)

1. Ensure your Supabase database has the required tables (run `SUPABASE_TABLES.sql` first)
2. Open Supabase SQL Editor
3. Copy and paste contents of `SAMPLE_ANALYTICS_DATA.sql`
4. Execute the script
5. Run verification queries at the end to confirm data

### Option 2: JSON Import via API

```javascript
// In your app or testing script
const sampleData = require('./sample_data/analytics_dataset.json');

// Insert via Supabase client
const { data, error } = await supabase
  .from('analytics')
  .insert(sampleData.sample_visit_records);
```

### Option 3: CSV Import

1. Open `visits_sample.csv` in Excel/Google Sheets
2. Use Supabase dashboard to import CSV to `analytics` table
3. Map columns: date→date, patient_id→patient_id, visit_type→visit_type

## 📊 Testing Predictive Features

After importing the sample data, you can test these features:

### Dashboard Features
- View 90-day patient volume trends
- See predictive insights (28-32 patients tomorrow)
- Analyze illness distribution charts

### Analytics Features (Doctor Only)
- Sort illnesses by common/trends/time period
- View illness trend predictions (next day/month/year)
- Click illness cards for detailed insights
- See prediction confidence levels
- Interactive line chart comparing current vs. predicted cases

### Expected Results
- **Flu:** Shows increasing trend (↑ 15-25%)
- **Stomach Pain:** Shows decreasing trend (↓ 10-20%)
- **Hypertension:** Shows stable trend (± 2%)
- **Common Cold:** Shows seasonal increase

## 🔍 Data Validation

Run these queries to verify data quality:

```sql
-- Check total records
SELECT COUNT(*) FROM analytics;
-- Expected: ~2,400 records

-- Check date range
SELECT MIN(date), MAX(date) FROM analytics;
-- Expected: ~90 days back to today

-- Check illness distribution
SELECT visit_type, COUNT(*) 
FROM analytics 
GROUP BY visit_type 
ORDER BY COUNT(*) DESC;
-- Expected: Common Cold highest, Other lowest

-- Check recent trends (last 7 days)
SELECT visit_type, COUNT(*) as cases
FROM analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY visit_type
ORDER BY cases DESC;
```

## 💡 Customization Tips

### Adjust Volume
Change `num_visits` calculation in SQL:
```sql
num_visits := FLOOR(15 + (RANDOM() * 30 * base_multiplier))::INT;
--                   ^min      ^range    ^seasonal factor
```

### Add New Illnesses
Modify illness probability distribution:
```sql
IF illness_probability < 0.XX THEN
  illness_type := 'Your New Illness';
```

### Extend Time Range
Change loop range:
```sql
FOR i IN 0..179 LOOP  -- 180 days instead of 90
```

## 📈 Analytics Formulas Used

### Trend Calculation
```javascript
// Percentage change
const change = ((predicted - current) / current) * 100;

// Trend direction
const trend = change > 2 ? 'increasing' : 
              change < -2 ? 'decreasing' : 'stable';
```

### Prediction Algorithm (as implemented in Analytics.tsx)
```javascript
const baseCount = illness.count;
const randomTrend = Math.sin(illness.name.length * 0.5) * 20;
const volatility = Math.random() * 15 - 7.5;

predictedNextDay = baseCount + randomTrend * 0.3 + volatility;
predictedNextMonth = baseCount + randomTrend * 0.8 + volatility * 2;
predictedNextYear = baseCount + randomTrend * 2 + volatility * 3;
```

## 🛠️ Troubleshooting

### No Data Showing in Dashboard
1. Check if analytics table exists: `SELECT * FROM analytics LIMIT 1;`
2. Verify date range matches filter: `SELECT MIN(date), MAX(date) FROM analytics;`
3. Clear browser cache and reload

### Predictions Not Appearing
1. Ensure you're logged in as a doctor (staff users can't see predictions)
2. Check permissions in `lib/permissions.ts`
3. Verify `userRole` prop is being passed correctly

### SQL Errors During Import
1. Ensure patients table exists first
2. Run `SUPABASE_TABLES.sql` before sample data
3. Check Supabase logs for specific error messages
4. Run DO blocks individually if full script fails

## 📚 Additional Resources

- **Dashboard Component:** `src/components/Dashboard.tsx`
- **Analytics Component:** `src/components/Analytics.tsx`
- **Prediction Logic:** See `illnessPredictions` useMemo in Analytics.tsx
- **Database Schema:** `SUPABASE_TABLES.sql`
- **Demo Data:** `DEMO_DATA.sql` (basic patient/queue records)

## 🎓 Use Cases

1. **Development Testing:** Use JSON data for component unit tests
2. **Demo/Presentation:** Import SQL data to show full featured analytics
3. **Data Analysis:** Export CSV to Excel for custom trend analysis
4. **API Testing:** Mock API responses with JSON structure
5. **Performance Testing:** Measure dashboard load time with 2,400+ records
6. **User Training:** Demonstrate predictive features with realistic data

## 📝 Notes

- All timestamps are randomized within 8am-6pm operating hours
- Patient IDs are auto-generated UUIDs by Supabase
- Illness names match exactly what's used in the UI
- Data includes both increasing and decreasing trends for demonstration
- Weekend volumes are automatically reduced to 50% of weekday traffic
- Seasonal factors simulate flu season (recent 30 days have 1.5x multiplier)

## 🤝 Contributing

To add more sample data:
1. Follow the existing illness distribution patterns
2. Maintain realistic date/time ranges
3. Include variety in trends (up, down, stable)
4. Update this README with new data characteristics

---

**Last Updated:** February 18, 2026  
**Version:** 1.0  
**Compatible With:** HealthQueue System v1.0
