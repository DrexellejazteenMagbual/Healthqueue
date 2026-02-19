"""
Sample Analytics Data Generator
================================
Python script to generate customizable sample datasets for HealthQueue analytics.
Can generate SQL, JSON, and CSV formats with configurable parameters.

Requirements:
    pip install pandas

Usage:
    python generate_sample_data.py --days 90 --format sql
    python generate_sample_data.py --days 30 --format json --output custom_data.json
    python generate_sample_data.py --days 60 --format csv --weekday-volume 40
"""

import argparse
import json
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import uuid

# Illness configuration with probabilities and trends
ILLNESS_CONFIG = {
    'Common Cold': {'weight': 0.18, 'trend': 'up', 'seasonal': 1.3},
    'Flu': {'weight': 0.14, 'trend': 'up', 'seasonal': 1.8},
    'Hypertension': {'weight': 0.13, 'trend': 'stable', 'seasonal': 1.0},
    'Diabetes': {'weight': 0.12, 'trend': 'stable', 'seasonal': 1.0},
    'Fever': {'weight': 0.11, 'trend': 'up', 'seasonal': 1.2},
    'Cough and Colds': {'weight': 0.09, 'trend': 'up', 'seasonal': 1.4},
    'Headache': {'weight': 0.07, 'trend': 'stable', 'seasonal': 1.0},
    'Stomach Pain': {'weight': 0.06, 'trend': 'down', 'seasonal': 0.8},
    'Allergies': {'weight': 0.05, 'trend': 'stable', 'seasonal': 1.1},
    'Other': {'weight': 0.05, 'trend': 'stable', 'seasonal': 1.0}
}

# Sample patient pool
SAMPLE_PATIENTS = [
    {'id': 'p001', 'name': 'Maria Santos', 'age': 39, 'gender': 'Female'},
    {'id': 'p002', 'name': 'Juan Dela Cruz', 'age': 34, 'gender': 'Male'},
    {'id': 'p003', 'name': 'Rosa Garcia', 'age': 46, 'gender': 'Female'},
    {'id': 'p004', 'name': 'Pedro Reyes', 'age': 29, 'gender': 'Male'},
    {'id': 'p005', 'name': 'Ana Lopez', 'age': 36, 'gender': 'Female'},
    {'id': 'p006', 'name': 'Carlos Mendoza', 'age': 42, 'gender': 'Male'},
    {'id': 'p007', 'name': 'Elena Torres', 'age': 32, 'gender': 'Female'},
    {'id': 'p008', 'name': 'Miguel Ramos', 'age': 49, 'gender': 'Male'},
    {'id': 'p009', 'name': 'Sofia Cruz', 'age': 26, 'gender': 'Female'},
    {'id': 'p010', 'name': 'Diego Fernandez', 'age': 37, 'gender': 'Male'},
]


def select_illness() -> str:
    """Select an illness based on weighted probabilities."""
    rand = random.random()
    cumulative = 0
    
    for illness, config in ILLNESS_CONFIG.items():
        cumulative += config['weight']
        if rand <= cumulative:
            return illness
    
    return 'Other'


def calculate_daily_volume(day_offset: int, weekday_avg: int, weekend_avg: int, 
                          flu_season_days: int = 30) -> int:
    """Calculate number of visits for a specific day."""
    date = datetime.now() - timedelta(days=day_offset)
    is_weekend = date.weekday() in [5, 6]  # Saturday or Sunday
    
    base_volume = weekend_avg if is_weekend else weekday_avg
    
    # Apply seasonal multiplier for recent days (flu season)
    seasonal_multiplier = 1.5 if day_offset < flu_season_days else 1.0
    
    # Add random variation (±30%)
    variation = random.uniform(0.7, 1.3)
    
    return int(base_volume * seasonal_multiplier * variation)


def generate_visit_time() -> str:
    """Generate random visit time between 8am and 6pm."""
    hour = random.randint(8, 17)
    minute = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}:00"


def generate_records(days: int = 90, weekday_volume: int = 30, 
                    weekend_volume: int = 15) -> List[Dict]:
    """Generate sample analytics records."""
    records = []
    queue_counter = 1
    
    for day_offset in range(days):
        date = datetime.now() - timedelta(days=day_offset)
        date_str = date.strftime('%Y-%m-%d')
        
        daily_visits = calculate_daily_volume(day_offset, weekday_volume, weekend_volume)
        
        for _ in range(daily_visits):
            patient = random.choice(SAMPLE_PATIENTS)
            illness = select_illness()
            visit_time = generate_visit_time()
            wait_time = random.randint(5, 35)
            
            record = {
                'date': date_str,
                'patient_id': patient['id'],
                'patient_name': patient['name'],
                'age': patient['age'],
                'gender': patient['gender'],
                'visit_type': illness,
                'time': visit_time,
                'queue_number': queue_counter,
                'wait_time_minutes': wait_time
            }
            
            records.append(record)
            queue_counter += 1
        
        # Reset queue counter daily
        queue_counter = 1
    
    return records


def generate_sql(records: List[Dict]) -> str:
    """Generate SQL INSERT statements."""
    sql_lines = [
        "-- Generated Sample Analytics Data",
        "-- Total Records: {}".format(len(records)),
        "-- Date Range: {} to {}".format(
            records[-1]['date'] if records else 'N/A',
            records[0]['date'] if records else 'N/A'
        ),
        "",
        "-- Insert analytics records",
        "INSERT INTO analytics (patient_id, visit_type, date, timestamp) VALUES"
    ]
    
    values = []
    for i, record in enumerate(records):
        timestamp = f"{record['date']} {record['time']}"
        value = f"  ('{record['patient_id']}', '{record['visit_type']}', '{record['date']}', '{timestamp}')"
        
        if i < len(records) - 1:
            value += ","
        else:
            value += ";"
        
        values.append(value)
    
    sql_lines.extend(values)
    sql_lines.extend([
        "",
        "-- Verification query",
        "SELECT visit_type, COUNT(*) as total",
        "FROM analytics",
        "GROUP BY visit_type",
        "ORDER BY total DESC;"
    ])
    
    return "\n".join(sql_lines)


def generate_json(records: List[Dict]) -> str:
    """Generate JSON output."""
    output = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'total_records': len(records),
            'date_range': {
                'start': records[-1]['date'] if records else None,
                'end': records[0]['date'] if records else None
            }
        },
        'illness_config': ILLNESS_CONFIG,
        'records': records
    }
    
    return json.dumps(output, indent=2)


def generate_csv(records: List[Dict]) -> str:
    """Generate CSV output."""
    if not records:
        return ""
    
    # CSV header
    headers = list(records[0].keys())
    csv_lines = [','.join(headers)]
    
    # CSV rows
    for record in records:
        row = ','.join(str(record[key]) for key in headers)
        csv_lines.append(row)
    
    return '\n'.join(csv_lines)


def calculate_statistics(records: List[Dict]) -> Dict:
    """Calculate summary statistics from records."""
    if not records:
        return {}
    
    illness_counts = {}
    daily_counts = {}
    
    for record in records:
        illness = record['visit_type']
        date = record['date']
        
        illness_counts[illness] = illness_counts.get(illness, 0) + 1
        daily_counts[date] = daily_counts.get(date, 0) + 1
    
    return {
        'total_visits': len(records),
        'unique_days': len(daily_counts),
        'avg_daily_visits': round(len(records) / len(daily_counts), 1),
        'illness_distribution': illness_counts,
        'most_common_illness': max(illness_counts.items(), key=lambda x: x[1])[0],
        'busiest_day': max(daily_counts.items(), key=lambda x: x[1])
    }


def main():
    parser = argparse.ArgumentParser(description='Generate sample analytics data')
    parser.add_argument('--days', type=int, default=90, 
                       help='Number of days of historical data (default: 90)')
    parser.add_argument('--format', type=str, choices=['sql', 'json', 'csv'], 
                       default='sql', help='Output format (default: sql)')
    parser.add_argument('--output', type=str, default=None, 
                       help='Output file path (default: stdout)')
    parser.add_argument('--weekday-volume', type=int, default=30, 
                       help='Average weekday patient volume (default: 30)')
    parser.add_argument('--weekend-volume', type=int, default=15, 
                       help='Average weekend patient volume (default: 15)')
    parser.add_argument('--stats', action='store_true', 
                       help='Print statistics summary')
    
    args = parser.parse_args()
    
    # Generate records
    print(f"Generating {args.days} days of sample data...")
    records = generate_records(
        days=args.days,
        weekday_volume=args.weekday_volume,
        weekend_volume=args.weekend_volume
    )
    
    # Generate output based on format
    if args.format == 'sql':
        output = generate_sql(records)
    elif args.format == 'json':
        output = generate_json(records)
    else:  # csv
        output = generate_csv(records)
    
    # Write output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"✓ Generated {len(records)} records → {args.output}")
    else:
        print(output)
    
    # Print statistics if requested
    if args.stats:
        stats = calculate_statistics(records)
        print("\n" + "="*50)
        print("STATISTICS SUMMARY")
        print("="*50)
        print(f"Total Visits: {stats['total_visits']}")
        print(f"Unique Days: {stats['unique_days']}")
        print(f"Avg Daily Visits: {stats['avg_daily_visits']}")
        print(f"Most Common Illness: {stats['most_common_illness']}")
        print(f"Busiest Day: {stats['busiest_day'][0]} ({stats['busiest_day'][1]} visits)")
        print("\nIllness Distribution:")
        for illness, count in sorted(stats['illness_distribution'].items(), 
                                     key=lambda x: x[1], reverse=True):
            percentage = (count / stats['total_visits']) * 100
            print(f"  {illness}: {count} ({percentage:.1f}%)")


if __name__ == '__main__':
    main()
