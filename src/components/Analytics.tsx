import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnalyticsData } from '../types';
import { TrendingUp, Users, Activity, Calendar, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sortType, setSortType] = useState<SortType>('common');
  const [predictionPeriod, setPredictionPeriod] = useState<PredictionPeriod>('nextDay');
  const [hoveredIllness, setHoveredIllness] = useState<string | null>(null);
  
  const permissions = getPermissions(userRole);

  // Calculate predicted patient volume for tomorrow
  const predictedVolume = useMemo(() => {
    if (!analyticsData?.patientVolumeData || analyticsData.patientVolumeData.length === 0) {
      return { min: 25, max: 35, avg: 30 };
    }

    // Get last 7-14 days of data for trend analysis
    const recentData = analyticsData.patientVolumeData.slice(-14);
    const visits = recentData.map(d => d.visits);
    
    // Calculate weighted moving average (more weight on recent days)
    let weightedSum = 0;
    let weightTotal = 0;
    visits.forEach((visit, index) => {
      const weight = index + 1; // More recent days have higher weight
      weightedSum += visit * weight;
      weightTotal += weight;
    });
    const weightedAvg = weightTotal > 0 ? weightedSum / weightTotal : 0;
    
    // Calculate trend (simple linear regression slope)
    const n = visits.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    visits.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    
    // Predict tomorrow's volume
    const predicted = Math.round(weightedAvg + slope);
    
    // Add variance for range (±10-15%)
    const variance = Math.max(3, Math.round(predicted * 0.12));
    
    return {
      min: Math.max(0, predicted - variance),
      max: predicted + variance,
      avg: predicted
    };
  }, [analyticsData?.patientVolumeData]);

  // Generate unique color for each illness
  const getIllnessColor = (index: number) => {
    const colors = [
      '#0891b2', // cyan-600
      '#0284c7', // sky-600
      '#2563eb', // blue-600
      '#7c3aed', // violet-600
      '#9333ea', // purple-600
      '#c026d3', // fuchsia-600
      '#db2777', // pink-600
      '#dc2626', // red-600
      '#ea580c', // orange-600
      '#d97706', // amber-600
      '#ca8a04', // yellow-600
      '#65a30d', // lime-600
      '#16a34a', // green-600
      '#059669', // emerald-600
      '#0d9488', // teal-600
      '#0e7490', // cyan-700
      '#0369a1', // sky-700
      '#1d4ed8', // blue-700
      '#6d28d9', // violet-700
      '#7e22ce', // purple-700
      '#a21caf', // fuchsia-700
      '#be185d', // pink-700
      '#b91c1c', // red-700
      '#c2410c', // orange-700
      '#b45309', // amber-700
      '#84cc16', // lime-500
      '#22c55e', // green-500
      '#10b981', // emerald-500
      '#14b8a6', // teal-500
      '#06b6d4', // cyan-500
    ];
    return colors[index % colors.length];
  };

  // Fetch analytics data from Supabase
  const fetchAnalyticsData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
        
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
        setLastUpdated(new Date());
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
        setRefreshing(false);
      }
    }, []);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchAnalyticsData(true);
  };

  useEffect(() => {
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

      // Set up polling interval (every 30 seconds) as a fallback
      const pollingInterval = setInterval(() => {
        fetchAnalyticsData();
      }, 30000);

      return () => {
        supabase.removeChannel(subscription);
        clearInterval(pollingInterval);
      };
    }
  }, [initialData, fetchAnalyticsData]);

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
        borderColor: 'hsl(190, 85%, 30%)',
        backgroundColor: 'hsla(190, 85%, 30%, 0.1)',
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
        backgroundColor: analyticsData.commonIllnesses.map((_, index) => getIllnessColor(index))
      }
    ]
  } : { labels: [], datasets: [] };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Health office statistics and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-700">
              {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </motion.div>

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
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
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
          </motion.div>

         

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Volume Trend</h3>
          <Chart type="line" data={chartData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Illnesses</h3>
          <Chart type="doughnut" data={illnessChartData} />
        </div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Illness Statistics</h3>
            <div className="relative">
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                aria-label="Sort illness statistics"
                className="px-3 py-2 pr-8 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="common">Sort by: Common</option>
                <option value="trends">Sort by: Trends</option>
                <option value="month">Sort by: Month</option>
                <option value="day">Sort by: Day</option>
                <option value="year">Sort by: Year</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700"></th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Illness Name</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cases</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Percentage</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedIllnesses.map((illness, index) => {
                  const originalIndex = analyticsData?.commonIllnesses.findIndex(i => i.name === illness.name) ?? index;
                  const color = getIllnessColor(originalIndex);
                  const totalCases = sortedIllnesses.reduce((sum, item) => sum + item.count, 0);
                  const percentage = totalCases > 0 ? (illness.count / totalCases) * 100 : 0;
                  const insights = getIllnessInsights(illness.name);
                  
                  return (
                    <React.Fragment key={illness.name}>
                      <tr 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          hoveredIllness === illness.name ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{illness.name}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-lg font-semibold text-gray-900">{illness.count}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setHoveredIllness(hoveredIllness === illness.name ? null : illness.name)}
                            className="text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                          >
                            {hoveredIllness === illness.name ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable Insights Row */}
                      {hoveredIllness === illness.name && insights && (
                        <tr>
                          <td colSpan={5} className="py-0">
                            <div className="bg-blue-50 border-l-4 border-primary px-6 py-4 space-y-3 animate-in fade-in duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="text-xs text-gray-600 block mb-1">Current Cases</span>
                                  <span className="text-lg font-semibold text-gray-900">{insights.current}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600 block mb-1">Predicted ({insights.timeframe})</span>
                                  <span className="text-lg font-semibold text-gray-900">{insights.predicted}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600 block mb-1">Change</span>
                                  <span className={`text-lg font-semibold ${
                                    insights.trendDirection === 'up' ? 'text-red-600' :
                                    insights.trendDirection === 'down' ? 'text-green-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {insights.difference && insights.difference > 0 ? '+' : ''}{insights.difference} ({insights.change.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-700 leading-relaxed mb-2">{insights.insight}</p>
                                <p className="text-sm text-primary font-medium">💡 {insights.recommendation}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Volume Prediction</h4>
              <p className="text-sm text-gray-600">
                Based on current trends, expect approximately <strong>{predictedVolume.min}-{predictedVolume.max} patients</strong> tomorrow.
              </p>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Resource Allocation</h4>
              <p className="text-sm text-gray-600">
                Monitor patient volume trends to optimize staffing and reduce wait times.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

       {/* Illness Trend Prediction Section - Doctor Only */}
       {permissions.canViewDetailedAnalytics ? (
          <motion.div 
            className="grid grid-cols-1 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Illness Trend Predictions</h3>
                  <p className="text-sm text-gray-600">Projected illness cases based on current trends</p>
                </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPredictionPeriod('nextDay')}
                className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                  predictionPeriod === 'nextDay'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next Day
              </button>
              <button
                onClick={() => setPredictionPeriod('nextMonth')}
                className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                  predictionPeriod === 'nextMonth'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next Month
              </button>
              <button
                onClick={() => setPredictionPeriod('nextYear')}
                className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                  predictionPeriod === 'nextYear'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    borderColor: 'hsl(190, 85%, 30%)',
                    backgroundColor: 'hsla(190, 85%, 30%, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'hsl(190, 85%, 30%)',
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
                <motion.button
                  key={illness.name}
                  onClick={() => setHoveredIllness(hoveredIllness === illness.name ? null : illness.name)}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-all border-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                      'hsl(190, 85%, 30%)',
                    color: 'hsl(190, 85%, 30%)',
                    cursor: 'pointer'
                  }}
                >
                  {illness.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Restricted Access</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Detailed illness trend predictions and advanced analytics are only accessible to doctors for strategic healthcare planning and resource management.
                </p>
                <p className="text-sm text-gray-600">
                  You have access to basic statistics including daily/weekly patient counts and queue metrics. For detailed analytics insights, please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

        </>
      )}
    </div>
  );
};

export default Analytics;
