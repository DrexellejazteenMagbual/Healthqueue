-- ============================================
-- SAMPLE ANALYTICS & PREDICTIVE DATA
-- ============================================
-- This file contains comprehensive sample data for testing and demonstrating
-- the predictive analytics and illness trend forecasting features
-- 
-- Data includes:
-- - 90 days of historical analytics data
-- - Realistic illness patterns with seasonal trends
-- - Various patient visit types
-- - Data optimized for predictive analysis demonstrations
--
-- Usage: Run this in Supabase SQL Editor AFTER setting up patients table
-- ============================================

-- ============================================
-- SAMPLE PATIENTS FOR ANALYTICS (if not exist)
-- ============================================
INSERT INTO patients (first_name, last_name, date_of_birth, age, gender, phone, email, medical_history, blood_type)
SELECT * FROM (VALUES
  ('Maria', 'Santos', DATE '1985-03-15', 39, 'Female', '09171234567', 'maria.santos@email.com', ARRAY['Hypertension'], 'O+'),
  ('Juan', 'Dela Cruz', DATE '1990-07-22', 34, 'Male', '09181234567', 'juan.delacruz@email.com', ARRAY['Asthma'], 'A+'),
  ('Rosa', 'Garcia', DATE '1978-11-30', 46, 'Female', '09191234567', 'rosa.garcia@email.com', ARRAY['Diabetes Type 2'], 'B+'),
  ('Pedro', 'Reyes', DATE '1995-05-18', 29, 'Male', '09201234567', 'pedro.reyes@email.com', ARRAY[]::TEXT[], 'AB+'),
  ('Ana', 'Lopez', DATE '1988-09-10', 36, 'Female', '09211234567', 'ana.lopez@email.com', ARRAY['Allergic Rhinitis'], 'O-'),
  ('Carlos', 'Mendoza', DATE '1982-02-25', 42, 'Male', '09221234567', 'carlos.mendoza@email.com', ARRAY['Hypertension', 'High Cholesterol'], 'A-'),
  ('Elena', 'Torres', DATE '1992-12-08', 32, 'Female', '09231234567', 'elena.torres@email.com', ARRAY['Pregnant'], 'B-'),
  ('Miguel', 'Ramos', DATE '1975-06-14', 49, 'Male', '09241234567', 'miguel.ramos@email.com', ARRAY['Arthritis'], 'AB-'),
  ('Sofia', 'Cruz', DATE '1998-04-03', 26, 'Female', '09251234567', 'sofia.cruz@email.com', ARRAY[]::TEXT[], 'O+'),
  ('Diego', 'Fernandez', DATE '1987-08-21', 37, 'Male', '09261234567', 'diego.fernandez@email.com', ARRAY['Asthma', 'Allergies'], 'A+'),
  ('Carmen', 'Vargas', DATE '1993-01-17', 31, 'Female', '09271234567', 'carmen.vargas@email.com', ARRAY['Migraine'], 'B+'),
  ('Luis', 'Castro', DATE '1980-10-05', 44, 'Male', '09281234567', 'luis.castro@email.com', ARRAY['Diabetes Type 2'], 'AB+'),
  ('Isabella', 'Morales', DATE '1996-07-28', 28, 'Female', '09291234567', 'isabella.morales@email.com', ARRAY[]::TEXT[], 'O-'),
  ('Ricardo', 'Jimenez', DATE '1984-03-12', 40, 'Male', '09301234567', 'ricardo.jimenez@email.com', ARRAY['Hypertension'], 'A-'),
  ('Lucia', 'Herrera', DATE '1991-11-19', 33, 'Female', '09311234567', 'lucia.herrera@email.com', ARRAY['Thyroid Disorder'], 'B-')
) AS sample_patients(first_name, last_name, date_of_birth, age, gender, phone, email, medical_history, blood_type)
WHERE NOT EXISTS (
  SELECT 1 FROM patients WHERE email = sample_patients.email
);

-- ============================================
-- HISTORICAL ANALYTICS DATA (Last 90 Days)
-- ============================================
-- This generates realistic visit patterns with seasonal trends

DO $$
DECLARE
  patient_record RECORD;
  visit_date DATE;
  illness_type TEXT;
  num_visits INT;
  day_of_week INT;
  base_multiplier FLOAT;
  illness_probability FLOAT;
  i INT;
BEGIN
  -- Loop through last 90 days
  FOR i IN 0..89 LOOP
    visit_date := CURRENT_DATE - (i || ' days')::INTERVAL;
    day_of_week := EXTRACT(DOW FROM visit_date); -- 0=Sunday, 6=Saturday
    
    -- Base multiplier: fewer visits on weekends
    IF day_of_week = 0 OR day_of_week = 6 THEN
      base_multiplier := 0.5;
    ELSE
      base_multiplier := 1.0;
    END IF;
    
    -- Seasonal multiplier for flu/cold (more common in certain periods)
    IF i < 30 THEN -- Recent 30 days - flu season
      base_multiplier := base_multiplier * 1.5;
    END IF;
    
    -- Determine number of visits for this day (15-45 patients/day)
    num_visits := FLOOR(15 + (RANDOM() * 30 * base_multiplier))::INT;
    
    -- Insert visits for this day
    FOR j IN 1..num_visits LOOP
      -- Select random patient
      SELECT * INTO patient_record FROM patients ORDER BY RANDOM() LIMIT 1;
      
      -- Determine illness type based on weighted probabilities
      illness_probability := RANDOM();
      
      IF illness_probability < 0.18 THEN
        illness_type := 'Common Cold';
      ELSIF illness_probability < 0.32 THEN
        illness_type := 'Flu';
      ELSIF illness_probability < 0.45 THEN
        illness_type := 'Hypertension';
      ELSIF illness_probability < 0.57 THEN
        illness_type := 'Diabetes';
      ELSIF illness_probability < 0.68 THEN
        illness_type := 'Fever';
      ELSIF illness_probability < 0.77 THEN
        illness_type := 'Cough and Colds';
      ELSIF illness_probability < 0.84 THEN
        illness_type := 'Headache';
      ELSIF illness_probability < 0.90 THEN
        illness_type := 'Stomach Pain';
      ELSIF illness_probability < 0.95 THEN
        illness_type := 'Allergies';
      ELSE
        illness_type := 'Other';
      END IF;
      
      -- Insert analytics record
      INSERT INTO analytics (patient_id, visit_type, date, timestamp)
      VALUES (
        patient_record.id,
        illness_type,
        visit_date,
        visit_date + (RANDOM() * INTERVAL '10 hours') + INTERVAL '8 hours' -- Random time between 8am-6pm
      );
      
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted 90 days of historical analytics data';
END $$;

-- ============================================
-- ILLNESS TRACKING DATA (Detailed Illness Records)
-- ============================================
-- This creates detailed illness tracking records for trend analysis

INSERT INTO illness_tracking (patient_id, illness_name, date, timestamp)
SELECT 
  a.patient_id,
  a.visit_type,
  a.date,
  a.timestamp
FROM analytics a
WHERE a.visit_type IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- PREDICTIVE DATA SCENARIOS
-- ============================================
-- Additional targeted data to demonstrate specific predictive scenarios

-- Scenario 1: Increasing Flu Trend (Recent spike)
DO $$
DECLARE
  patient_record RECORD;
  i INT;
BEGIN
  FOR i IN 1..25 LOOP
    SELECT * INTO patient_record FROM patients ORDER BY RANDOM() LIMIT 1;
    
    INSERT INTO analytics (patient_id, visit_type, date, timestamp)
    VALUES (
      patient_record.id,
      'Flu',
      CURRENT_DATE - (i % 7 || ' days')::INTERVAL,
      CURRENT_TIMESTAMP - (i % 7 || ' days')::INTERVAL
    );
  END LOOP;
END $$;

-- Scenario 2: Decreasing Stomach Pain Trend
DO $$
DECLARE
  patient_record RECORD;
  i INT;
BEGIN
  -- More cases 30-60 days ago, fewer recently
  FOR i IN 30..60 LOOP
    IF RANDOM() < 0.7 THEN -- 70% chance to add
      SELECT * INTO patient_record FROM patients ORDER BY RANDOM() LIMIT 1;
      
      INSERT INTO analytics (patient_id, visit_type, date, timestamp)
      VALUES (
        patient_record.id,
        'Stomach Pain',
        CURRENT_DATE - (i || ' days')::INTERVAL,
        CURRENT_TIMESTAMP - (i || ' days')::INTERVAL
      );
    END IF;
  END LOOP;
  
  -- Very few recent cases
  FOR i IN 1..10 LOOP
    IF RANDOM() < 0.2 THEN -- 20% chance only
      SELECT * INTO patient_record FROM patients ORDER BY RANDOM() LIMIT 1;
      
      INSERT INTO analytics (patient_id, visit_type, date, timestamp)
      VALUES (
        patient_record.id,
        'Stomach Pain',
        CURRENT_DATE - (i || ' days')::INTERVAL,
        CURRENT_TIMESTAMP - (i || ' days')::INTERVAL
      );
    END IF;
  END LOOP;
END $$;

-- Scenario 3: Stable Hypertension Pattern (consistent)
DO $$
DECLARE
  patient_record RECORD;
  i INT;
BEGIN
  FOR i IN 1..60 LOOP
    IF i % 2 = 0 THEN -- Every other day
      SELECT * INTO patient_record FROM patients WHERE medical_history @> ARRAY['Hypertension'] ORDER BY RANDOM() LIMIT 1;
      
      INSERT INTO analytics (patient_id, visit_type, date, timestamp)
      VALUES (
        patient_record.id,
        'Hypertension',
        CURRENT_DATE - (i || ' days')::INTERVAL,
        CURRENT_TIMESTAMP - (i || ' days')::INTERVAL
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify data was inserted successfully

SELECT 
  visit_type,
  COUNT(*) as total_cases,
  MIN(date) as earliest_record,
  MAX(date) as latest_record,
  ROUND(AVG(CASE 
    WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 
    ELSE 0 
  END) * COUNT(*), 0) as recent_7_days_estimate
FROM analytics
WHERE visit_type IS NOT NULL
GROUP BY visit_type
ORDER BY total_cases DESC;

-- ============================================
-- SUMMARY STATISTICS
-- ============================================
SELECT 
  COUNT(DISTINCT patient_id) as unique_patients,
  COUNT(*) as total_visits,
  COUNT(DISTINCT date) as days_with_data,
  MIN(date) as data_start_date,
  MAX(date) as data_end_date
FROM analytics;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Sample analytics data setup complete!';
  RAISE NOTICE 'Navigate to Dashboard or Analytics page to see predictive insights.';
END $$;
