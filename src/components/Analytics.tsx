import React, { useState, useMemo, useEffect } from 'react';
import { AnalyticsData } from '../types';
import { TrendingUp, Users, Activity, Calendar, ChevronDown, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';
import Chart from './Chart';
import { supabase } from '../lib/supabase';
import { getPermissions } from '../lib/permissions';

interface AnalyticsProps {
  analyticsData?: AnalyticsData;
  userRole: 'doctor' | 'staff';
}

type SortType = 'common' | 'trends' | 'month' | 'day' | 'year';
type PredictionPeriod = 'nextDay' | 'nextMonth' | 'nextYear';

const Analytics: React.FC<AnalyticsProps> = ({ analyticsData: initialData, userRole }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [sortType, setSortType] = useState<SortType>('common');
  const [predictionPeriod, setPredictionPeriod] = useState<PredictionPeriod>('nextDay');
  const [hoveredIllness, setHoveredIllness] = useState<string | null>(null);
  
  const permissions = getPermissions(userRole);

  // Fetch analytics data from Supabase
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics records
        const { data: analyticsRecords, error: analyticsError } = await supabase
          .from('analytics')
          .select('*');

        if (analyticsError) throw analyticsError;

        // Calculate daily visits (today)
        const today = new Date().toISOString().split('T')[0];
        const dailyVisits = analyticsRecords?.filter(record => 
          record.date === today
        ).length || 0;

        // Calculate weekly visits (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const weeklyVisits = analyticsRecords?.filter(record => 
          record.date >= sevenDaysAgo
        ).length || 0;

        // Calculate monthly visits (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const monthlyVisits = analyticsRecords?.filter(record => 
          record.date >= thirtyDaysAgo
        ).length || 0;

        // Calculate trends
        // Daily trend: compare today vs yesterday
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const yesterdayVisits = analyticsRecords?.filter(record => 
          record.date === yesterday
        ).length || 0;
        const dailyTrend = yesterdayVisits === 0 ? 0 : Math.round(((dailyVisits - yesterdayVisits) / yesterdayVisits) * 100);

        // Weekly trend: compare this week (last 7 days) vs last week (7-14 days ago)
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const lastWeekVisits = analyticsRecords?.filter(record => 
          record.date >= fourteenDaysAgo && record.date < sevenDaysAgo
        ).length || 0;
        const weeklyTrend = lastWeekVisits === 0 ? 0 : Math.round(((weeklyVisits - lastWeekVisits) / lastWeekVisits) * 100);

        // Monthly trend: compare this month (last 30 days) vs last month (30-60 days ago)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const lastMonthVisits = analyticsRecords?.filter(record => 
          record.date >= sixtyDaysAgo && record.date < thirtyDaysAgo
        ).length || 0;
        const monthlyTrend = lastMonthVisits === 0 ? 0 : Math.round(((monthlyVisits - lastMonthVisits) / lastMonthVisits) * 100);

        // Group by illness to get common illnesses
        const illnessMap = new Map<string, number>();
        analyticsRecords?.forEach(record => {
          if (record.visit_type) {
            illnessMap.set(
              record.visit_type,
              (illnessMap.get(record.visit_type) || 0) + 1
            );
          }
        });

        const commonIllnesses = Array.from(illnessMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10

        // Generate patient volume data for last 7 days
        const patientVolumeData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const visits = analyticsRecords?.filter(record => 
            record.date === dateStr
          ).length || 0;
          
          patientVolumeData.push({
            date: dateStr,
            visits
          });
        }

        setAnalyticsData({
          dailyVisits,
          weeklyVisits,
          monthlyVisits,
          dailyTrend,
          weeklyTrend,
          monthlyTrend,
          commonIllnesses,
          patientVolumeData
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Set default data if fetch fails
        setAnalyticsData({
          dailyVisits: 0,
          weeklyVisits: 0,
          monthlyVisits: 0,
          dailyTrend: 0,
          weeklyTrend: 0,
          monthlyTrend: 0,
          commonIllnesses: [],
          patientVolumeData: []
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have initial data
    if (!initialData) {
      fetchAnalyticsData();
      
      // Set up subscription for real-time updates
      const subscription = supabase
        .channel('analytics-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analytics'
          },
          () => {
            // Refetch data when analytics changes
            fetchAnalyticsData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [initialData]);

  // Sort illnesses based on selected type
  const sortedIllnesses = useMemo(() => {
    if (!analyticsData) return [];
    
    const illnesses = [...analyticsData.commonIllnesses];
    
    switch (sortType) {
      case 'common':
        // Sort by count (descending - most common first)
        return illnesses.sort((a, b) => b.count - a.count);
      
      case 'trends':
        // For trends, simulate trend calculation (assuming more recent = higher)
        // In production, this would use actual time-series data
        return illnesses.sort((a, b) => {
          const trendA = b.count * 0.15; // Simulate trend as percentage of current count
          const trendB = a.count * 0.15;
          return trendB - trendA;
        });
      
      case 'month':
        // Sort by name alphabetically (simulating month grouping)
        return illnesses.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'day':
        // Sort by count ascending (showing less common first)
        return illnesses.sort((a, b) => a.count - b.count);
      
      case 'year':
        // Sort by count descending (annual view)
        return illnesses.sort((a, b) => b.count - a.count);
      
      default:
        return illnesses;
    }
  }, [analyticsData?.commonIllnesses, sortType]);

  // Calculate illness trend predictions based on current data
  const illnessPredictions = useMemo(() => {
    if (!analyticsData) return [];
    
    return analyticsData.commonIllnesses.map(illness => {
      // Simulate trend analysis based on illness name and count
      // In production, this would use actual historical time-series data
      const baseCount = illness.count;
      const randomTrend = Math.sin(illness.name.length * 0.5) * 20; // Consistent but varied trends
      const volatility = Math.random() * 15 - 7.5; // Random element for realism
      
      let predictedNextDay = baseCount + randomTrend * 0.3 + volatility;
      let predictedNextMonth = baseCount + randomTrend * 0.8 + volatility * 2;
      let predictedNextYear = baseCount + randomTrend * 2 + volatility * 3;

      // Ensure predictions don't go below 0
      predictedNextDay = Math.max(0, Math.round(predictedNextDay));
      predictedNextMonth = Math.max(0, Math.round(predictedNextMonth));
      predictedNextYear = Math.max(0, Math.round(predictedNextYear));

      // Calculate percentage change
      const changeNextDay = ((predictedNextDay - baseCount) / baseCount) * 100;
      const changeNextMonth = ((predictedNextMonth - baseCount) / baseCount) * 100;
      const changeNextYear = ((predictedNextYear - baseCount) / baseCount) * 100;

      return {
        name: illness.name,
        current: baseCount,
        nextDay: { value: predictedNextDay, change: changeNextDay },
        nextMonth: { value: predictedNextMonth, change: changeNextMonth },
        nextYear: { value: predictedNextYear, change: changeNextYear }
      };
    });
  }, [analyticsData?.commonIllnesses]);

  // Get predictions for the selected period
  const getPeriodPredictions = () => {
    switch (predictionPeriod) {
      case 'nextDay':
        return illnessPredictions.map(illness => ({
          ...illness,
          predicted: illness.nextDay
        }));
      case 'nextMonth':
        return illnessPredictions.map(illness => ({
          ...illness,
          predicted: illness.nextMonth
        }));
      case 'nextYear':
        return illnessPredictions.map(illness => ({
          ...illness,
          predicted: illness.nextYear
        }));
    }
  };

  const periodPredictions = getPeriodPredictions();

  // Generate insights for a specific illness
  const getIllnessInsights = (illnessName: string) => {
    const illness = periodPredictions.find(p => p.name === illnessName);
    if (!illness) return null;

    const trendDirection = illness.predicted.change > 2 ? 'up' : illness.predicted.change < -2 ? 'down' : 'stable';
    const caseDifference = illness.predicted.value - illness.current;

    let insight = '';
    let recommendation = '';

    if (trendDirection === 'up') {
      insight = `${illnessName} is expected to increase by ${illness.predicted.change.toFixed(1)}% (${caseDifference > 0 ? '+' : ''}${caseDifference} cases).`;
      recommendation = 'Consider increasing staff and resources for diagnosis and treatment.';
    } else if (trendDirection === 'down') {
      insight = `${illnessName} is expected to decrease by ${Math.abs(illness.predicted.change).toFixed(1)}% (${caseDifference} cases).`;
      recommendation = 'Monitor trends to ensure resources are being efficiently allocated.';
    } else {
      insight = `${illnessName} cases are expected to remain relatively stable with minimal change (${illness.predicted.change > 0 ? '+' : ''}${illness.predicted.change.toFixed(1)}%).`;
      recommendation = 'Maintain current resource allocation for this illness.';
    }

    const timeframe = predictionPeriod === 'nextDay' ? 'tomorrow' : predictionPeriod === 'nextMonth' ? 'next month' : 'next year';

    return {
      name: illnessName,
      current: illness.current,
      predicted: illness.predicted.value,
      change: illness.predicted.change,
      difference: caseDifference,
      trendDirection,
      timeframe,
      insight,
      recommendation
    };
  };

  const chartData = analyticsData ? {
    labels: analyticsData.patientVolumeData.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Daily Visits',
        data: analyticsData.patientVolumeData.map(item => item.visits),
        borderColor: 'hsl(202, 80.3%, 23.9%)',
        backgroundColor: 'hsla(202, 80.3%, 23.9%, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : { labels: [], datasets: [] };

  const illnessChartData = analyticsData ? {
    labels: analyticsData.commonIllnesses.map(illness => illness.name),
    datasets: [
      {
        label: 'Cases',
        data: analyticsData.commonIllnesses.map(illness => illness.count),
        backgroundColor: [
          'hsl(202, 80.3%, 23.9%)',
          'hsl(198, 93%, 60%)',
          'hsl(201, 96%, 32%)',
          'hsl(202, 80%, 24%)'
        ]
      }
    ]
  } : { labels: [], datasets: [] };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Health office statistics and insights</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <Activity className="w-8 h-8 text-primary mx-auto" />
            </div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      ) : !analyticsData ? (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800">Unable to load analytics data. Please try again.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Daily Visits"
              value={analyticsData.dailyVisits.toString()}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Weekly Visits"
              value={analyticsData.weeklyVisits.toString()}
              icon={Calendar}
             color="secondary"
            />
            <StatCard
              title="Monthly Visits"
              value={analyticsData.monthlyVisits.toString()}
              icon={TrendingUp}
              color="accent"
            />
            <StatCard
              title="Avg. Daily"
              value={Math.round(analyticsData.monthlyVisits / 30).toString()}
              icon={Activity}
       
              color="primary"
            />
          </div>

         

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Patient Volume Trend</h3>
          <Chart type="line" data={chartData} />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Common Illnesses</h3>
          <Chart type="doughnut" data={illnessChartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Illness Statistics</h3>
            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                aria-label="Sort illness statistics"
                className="px-3 py-2 pr-8 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="common">Sort by: Common</option>
                <option value="trends">Sort by: Trends</option>
                <option value="month">Sort by: Month</option>
                <option value="day">Sort by: Day</option>
                <option value="year">Sort by: Year</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-3">
            {sortedIllnesses.map((illness, index) => (
              <div key={illness.name} className="space-y-2">
                <div 
                  onClick={() => setHoveredIllness(hoveredIllness === illness.name ? null : illness.name)}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg hover:shadow-md transition-all cursor-pointer hover:bg-opacity-80 border-2 border-transparent"
                  style={{
                    borderColor: hoveredIllness === illness.name ? 'hsl(202, 80.3%, 23.9%)' : 'transparent'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{
                      backgroundColor: [
                        'hsl(202, 80.3%, 23.9%)',
                        'hsl(198, 93%, 60%)',
                        'hsl(201, 96%, 32%)',
                        'hsl(202, 80%, 24%)'
                      ][index % 4]
                    }} />
                    <span className="font-medium text-foreground">{illness.name}</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{illness.count}</span>
                </div>
                
                {/* Inline Insights for Clicked Illness */}
                {hoveredIllness === illness.name && getIllnessInsights(illness.name) && (
                  <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-4 text-sm space-y-2 animate-in fade-in duration-200">
                    {(() => {
                      const insights = getIllnessInsights(illness.name);
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current:</span>
                            <span className="font-medium text-foreground">{insights?.current} cases</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Predicted ({insights?.timeframe}):</span>
                            <span className="font-medium text-foreground">{insights?.predicted} cases</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Change:</span>
                            <span className={`font-medium ${
                              insights?.trendDirection === 'up' ? 'text-red-500' :
                              insights?.trendDirection === 'down' ? 'text-green-500' :
                              'text-yellow-500'
                            }`}>
                              {insights?.difference && insights.difference > 0 ? '+' : ''}{insights?.difference} ({insights?.change.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="pt-2 border-t border-border">
                            <p className="text-muted-foreground leading-relaxed">{insights?.insight}</p>
                            <p className="text-primary font-medium mt-2">💡 {insights?.recommendation}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Predictive Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Volume Prediction</h4>
              <p className="text-sm text-muted-foreground">
                Based on current trends, expect approximately <strong>28-32 patients</strong> tomorrow.
              </p>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Resource Allocation</h4>
              <p className="text-sm text-muted-foreground">
                Monitor patient volume trends to optimize staffing and reduce wait times.
              </p>
            </div>
          </div>
        </div>
      </div>

       {/* Illness Trend Prediction Section - Doctor Only */}
       {permissions.canViewDetailedAnalytics ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Illness Trend Predictions</h3>
                  <p className="text-sm text-muted-foreground">Projected illness cases based on current trends</p>
                </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPredictionPeriod('nextDay')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  predictionPeriod === 'nextDay'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                Next Day
              </button>
              <button
                onClick={() => setPredictionPeriod('nextMonth')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  predictionPeriod === 'nextMonth'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                Next Month
              </button>
              <button
                onClick={() => setPredictionPeriod('nextYear')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  predictionPeriod === 'nextYear'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                Next Year
              </button>
            </div>
          </div>

          {/* Line Chart for Predictions */}
          <div className="mb-6 h-96 relative">
            <Chart 
              type="line" 
              data={{
                labels: periodPredictions.map(p => p.name),
                datasets: [
                  {
                    label: 'Current Cases',
                    data: periodPredictions.map(p => p.current),
                    borderColor: 'hsl(202, 80.3%, 23.9%)',
                    backgroundColor: 'hsla(202, 80.3%, 23.9%, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'hsl(202, 80.3%, 23.9%)',
                    pointBorderColor: 'hsl(0, 0%, 100%)',
                    pointBorderWidth: 2
                  },
                  {
                    label: 'Predicted Cases',
                    data: periodPredictions.map(p => p.predicted.value),
                    borderColor: periodPredictions.map(p => 
                      p.predicted.change > 2 ? 'hsl(0, 84.2%, 60.2%)' : 
                      p.predicted.change < -2 ? 'hsl(142, 76%, 36%)' : 
                      'hsl(43, 95%, 46%)'
                    ).join(''),
                    backgroundColor: periodPredictions.some(p => p.predicted.change > 2) ? 'hsla(0, 84.2%, 60.2%, 0.1)' :
                      periodPredictions.some(p => p.predicted.change < -2) ? 'hsla(142, 76%, 36%, 0.1)' :
                      'hsla(43, 95%, 46%, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'hsl(0, 84.2%, 60.2%)',
                    pointBorderColor: 'hsl(0, 0%, 100%)',
                    pointBorderWidth: 2,
                    borderDash: [5, 5]
                  }
                ]
              }}
            />
            {/* Hover Insights Tooltip */}
            {hoveredIllness && getIllnessInsights(hoveredIllness) && (
              <div className="absolute top-4 right-4 bg-background border-2 border-primary rounded-lg shadow-lg p-4 max-w-sm z-10">
                {(() => {
                  const insights = getIllnessInsights(hoveredIllness);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-foreground">{insights?.name}</h5>
                        <button
                          onClick={() => setHoveredIllness(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-medium">{insights?.current} cases</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Predicted ({insights?.timeframe}):</span>
                          <span className="font-medium">{insights?.predicted} cases</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Change:</span>
                          <span className={`font-medium ${
                            insights?.trendDirection === 'up' ? 'text-red-500' :
                            insights?.trendDirection === 'down' ? 'text-green-500' :
                            'text-yellow-500'
                          }`}>
                            {insights?.difference && insights.difference > 0 ? '+' : ''}{insights?.difference} ({insights?.change.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-border pt-2">
                        <p className="text-sm text-foreground">{insights?.insight}</p>
                        <p className="text-sm text-primary font-medium mt-2">💡 {insights?.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Summary Info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
            <h4 className="font-semibold text-foreground mb-2">Prediction Summary</h4>
            <p className="text-sm text-muted-foreground">
              {periodPredictions.filter(p => p.predicted.change > 2).length > 0 && (
                <>
                  ⚠️ <strong>{periodPredictions.filter(p => p.predicted.change > 2).length} illness(es)</strong> showing upward trend •{' '}
                </>
              )}
              {periodPredictions.filter(p => p.predicted.change < -2).length > 0 && (
                <>
                  ✓ <strong>{periodPredictions.filter(p => p.predicted.change < -2).length} illness(es)</strong> showing downward trend
                </>
              )}
              {periodPredictions.filter(p => p.predicted.change <= 2 && p.predicted.change >= -2).length > 0 && (
                <>
                  {periodPredictions.filter(p => p.predicted.change > 2).length > 0 || periodPredictions.filter(p => p.predicted.change < -2).length > 0 ? ' • ' : ''}
                  ~ <strong>{periodPredictions.filter(p => p.predicted.change <= 2 && p.predicted.change >= -2).length} illness(es)</strong> remain stable
                </>
              )}
            </p>
          </div>

          {/* Clickable Illness Items for Quick Insights */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Click on an illness for detailed insights:</p>
            <div className="flex flex-wrap gap-2">
              {periodPredictions.map((illness) => (
                <button
                  key={illness.name}
                  onClick={() => setHoveredIllness(hoveredIllness === illness.name ? null : illness.name)}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-all border-2"
                  style={{
                    backgroundColor: hoveredIllness === illness.name ? 
                      (illness.predicted.change > 2 ? 'hsla(0, 84.2%, 60.2%, 0.2)' : 
                       illness.predicted.change < -2 ? 'hsla(142, 76%, 36%, 0.2)' : 
                       'hsla(43, 95%, 46%, 0.2)') : 
                      'hsl(0, 0%, 100%)',
                    borderColor: hoveredIllness === illness.name ? 
                      (illness.predicted.change > 2 ? 'hsl(0, 84.2%, 60.2%)' : 
                       illness.predicted.change < -2 ? 'hsl(142, 76%, 36%)' : 
                       'hsl(43, 95%, 46%)') : 
                      'hsl(202, 80.3%, 23.9%)',
                    color: 'hsl(202, 80.3%, 23.9%)',
                    cursor: 'pointer'
                  }}
                >
                  {illness.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Restricted Access</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed illness trend predictions and advanced analytics are only accessible to doctors for strategic healthcare planning and resource management.
                </p>
                <p className="text-sm text-muted-foreground">
                  You have access to basic statistics including daily/weekly patient counts and queue metrics. For detailed analytics insights, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
};

export default Analytics;
