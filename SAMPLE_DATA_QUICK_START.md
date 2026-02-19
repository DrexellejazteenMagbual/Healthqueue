# 📊 Sample Analytics Datasets - Quick Start Guide

## What's Been Added

Comprehensive sample datasets have been created for testing and demonstrating the HealthQueue system's predictive analytics features.

## 📁 Files Created

| File | Location | Purpose |
|------|----------|---------|
| **SAMPLE_ANALYTICS_DATA.sql** | Root directory | Primary SQL import with 90 days of data |
| **analytics_dataset.json** | sample_data/ | JSON format for API testing |
| **visits_sample.csv** | sample_data/ | CSV for spreadsheet analysis |
| **generate_sample_data.py** | sample_data/ | Python script to generate custom data |
| **README.md** | sample_data/ | Comprehensive documentation |

## 🚀 Quick Start (3 Steps)

### Step 1: Import Sample Data

```bash
# Open Supabase SQL Editor
# Copy contents of SAMPLE_ANALYTICS_DATA.sql
# Paste and execute
```

### Step 2: View Results

Navigate to:
- **Dashboard** → See patient volume trends and predictive insights
- **Analytics** → View detailed illness predictions (doctor login required)

### Step 3: Explore Predictions

- Click illness cards for detailed insights
- Toggle prediction periods: Next Day / Next Month / Next Year
- View interactive line charts comparing current vs. predicted cases

## 📊 What You'll See

### Sample Data Includes:
- ✅ **2,400+ visit records** spanning 90 days
- ✅ **10 illness categories** with realistic distribution
- ✅ **15 sample patients** with diverse demographics
- ✅ **Seasonal trends** (flu season peaks)
- ✅ **Predictive scenarios** (increasing/decreasing/stable trends)
- ✅ **Weekday/weekend patterns** (30 vs. 15 patients/day)

### Illness Trends You'll Observe:
- 📈 **Flu:** Increasing (recent spike showing upward trend)
- 📉 **Stomach Pain:** Decreasing (fewer recent cases)
- ➡️ **Hypertension:** Stable (consistent pattern)
- 📈 **Common Cold:** Increasing (seasonal pattern)

## 🎯 Use Cases

| Use Case | Best File | Notes |
|----------|-----------|-------|
| Demo/Presentation | SAMPLE_ANALYTICS_DATA.sql | Shows full featured analytics |
| Development Testing | analytics_dataset.json | Mock API responses |
| Data Analysis | visits_sample.csv | Open in Excel/Google Sheets |
| Custom Volumes | generate_sample_data.py | Adjust patient volumes |
| API Integration | analytics_dataset.json | Structure reference |

## 🔧 Advanced Usage

### Generate Custom Data

```bash
# Install pandas first
pip install pandas

# Generate 30 days with higher volume
python sample_data/generate_sample_data.py --days 30 --weekday-volume 50 --weekend-volume 25 --format sql --output custom.sql

# Generate JSON with statistics
python sample_data/generate_sample_data.py --days 60 --format json --stats --output data.json

# Generate CSV for analysis
python sample_data/generate_sample_data.py --days 90 --format csv --output analysis.csv
```

### Verify Data Import

```sql
-- Check total records
SELECT COUNT(*) FROM analytics;
-- Expected: ~2,400

-- Check illness distribution
SELECT visit_type, COUNT(*) as total
FROM analytics
GROUP BY visit_type
ORDER BY total DESC;

-- Check date range
SELECT MIN(date) as start_date, MAX(date) as end_date
FROM analytics;
-- Expected: 90 days back to today
```

## 🎓 Dashboard Features to Test

### Main Dashboard
1. **Patient Volume Trend** (line chart)
   - 7-day historical data
   - Shows daily visit patterns
   
2. **Predictive Insights Panel**
   - Volume prediction: "28-32 patients tomorrow"
   - Resource allocation recommendations
   
3. **Illness Trend Predictions** (Doctor Only)
   - Interactive line chart
   - Period selection (day/month/year)
   - Clickable illness tags with insights

### Analytics Page (Doctor Only)
1. **Patient Volume Chart** (7-day trend)
2. **Common Illnesses** (doughnut chart)
3. **Illness Statistics** (sortable list with inline insights)
4. **Predictive Insights** (resource recommendations)
5. **Illness Trend Predictions** (full section with interactive charts)

## 📖 Documentation

- **Comprehensive Guide:** `sample_data/README.md`
- **System Overview:** `CURRENT_SYSTEM_OVERVIEW.md` (Section 6.5)
- **Python Script Help:** `python sample_data/generate_sample_data.py --help`

## ⚠️ Requirements

- Supabase database with tables created (`SUPABASE_TABLES.sql`)
- Doctor login for full analytics features:
  - Email: `doctor@clinic.com`
  - Password: `doctor123`

## 🆘 Troubleshooting

### Data Not Showing in Dashboard
```sql
-- Check if data exists
SELECT COUNT(*) FROM analytics WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Predictions Not Visible
- Ensure you're logged in as a doctor (staff users see restricted message)
- Check userRole in browser console: `localStorage.getItem('userRole')`

### SQL Import Errors
- Run `SUPABASE_TABLES.sql` first to create tables
- Execute DO blocks one at a time if full script fails
- Check Supabase logs for specific error messages

## 💡 Tips

1. **Best for Demos:** Use SQL import for complete dataset
2. **API Testing:** Reference JSON structure for mock data
3. **Excel Analysis:** Export CSV to create custom reports
4. **Custom Scenarios:** Modify Python script for specific illness trends
5. **Volume Testing:** Increase weekday-volume parameter to test high-traffic scenarios

## 🔄 Sample Data Patterns

### Designed to Show:
- ✅ Increasing trends (Flu, Common Cold, Fever)
- ✅ Decreasing trends (Stomach Pain)
- ✅ Stable patterns (Hypertension, Diabetes)
- ✅ Seasonal variations (recent 30 days higher for flu-like illnesses)
- ✅ Weekend vs. weekday differences (50% reduction on weekends)
- ✅ Peak hour distributions (9-11am, 2-4pm busiest)

## 📞 Support

For questions or issues:
1. Check `sample_data/README.md` for detailed documentation
2. Review SQL comments in `SAMPLE_ANALYTICS_DATA.sql`
3. Run verification queries to validate data import
4. Check browser console for JavaScript errors

---

**Generated:** February 18, 2026  
**Version:** 1.0  
**Compatible with:** HealthQueue System v1.0
