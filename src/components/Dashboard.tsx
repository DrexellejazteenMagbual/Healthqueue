import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { Patient, QueueItem, AnalyticsData } from '../types';
import { useTranslation } from '../lib/translations';
import StatCard from './StatCard';
import Chart from './Chart';
import { getPermissions } from '../lib/permissions';

type PredictionPeriod = 'nextDay' | 'nextMonth' | 'nextYear';

interface DashboardProps {
  patients: Patient[];
  queue: QueueItem[];
  analyticsData: AnalyticsData;
  userRole?: 'doctor' | 'staff' | null;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, queue, analyticsData, userRole }) => {
  const { t } = useTranslation();
  const waitingCount = queue.filter(item => item.status === 'waiting').length;
  const servingCount = queue.filter(item => item.status === 'serving').length;
  const priorityCount = queue.filter(item => item.priority === 'priority' && item.status === 'waiting').length;

  const [predictionPeriod, setPredictionPeriod] = useState<PredictionPeriod>('nextDay');
  const [hoveredIllness, setHoveredIllness] = useState<string | null>(null);
  
  const permissions = getPermissions(userRole || 'staff');

  // Prepare chart data for patient volume trend
  const chartData = {
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
  };

  // Calculate illness trend predictions
  const illnessPredictions = useMemo(() => {
    return analyticsData.commonIllnesses.map(illness => {
      const baseCount = illness.count;
      const randomTrend = Math.sin(illness.name.length * 0.5) * 20;
      const volatility = Math.random() * 15 - 7.5;
      
      let predictedNextDay = baseCount + randomTrend * 0.3 + volatility;
      let predictedNextMonth = baseCount + randomTrend * 0.8 + volatility * 2;
      let predictedNextYear = baseCount + randomTrend * 2 + volatility * 3;

      predictedNextDay = Math.max(0, Math.round(predictedNextDay));
      predictedNextMonth = Math.max(0, Math.round(predictedNextMonth));
      predictedNextYear = Math.max(0, Math.round(predictedNextYear));

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
  }, [analyticsData.commonIllnesses]);

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

  // Calculate predicted patient volume for tomorrow
  const predictedVolume = useMemo(() => {
    if (!analyticsData.patientVolumeData || analyticsData.patientVolumeData.length === 0) {
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
  }, [analyticsData.patientVolumeData]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Teams-style Header */}


      {/* Key Metrics - Teams Style Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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
          title={t.totalPatients}
          value={patients.length.toString()}
          icon={Users}
          color="primary"
        />
        <StatCard
          title={t.queuedPatients}
          value={waitingCount.toString()}
          icon={Clock}
          color="secondary"
        />
        <StatCard
          title={t.serving}
          value={servingCount.toString()}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title={t.servedToday}
          value={analyticsData.dailyVisits.toString()}
          icon={AlertTriangle}
          color="primary"
        />
      </motion.div>

      {/* Analytics Section - Teams Style */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Patient Volume Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-600 mb-5">Weekly patient visit patterns</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <Chart type="line" data={chartData} />
          </div>
        </div>
        
        {/* Predictive Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-600 mb-5">AI-powered healthcare forecasts</p>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 hover:bg-blue-100/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Volume Prediction</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Expect approximately <strong className="text-primary">{predictedVolume.min}-{predictedVolume.max} patients</strong> tomorrow based on current trends.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 hover:bg-green-100/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-green-600 rounded-md flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Resource Allocation</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Monitor patient volume trends to optimize staffing and reduce wait times.
                  </p>
                </div>
              </div>
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
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
              <p className="text-xs text-gray-600">
                AI-powered forecasting of illness patterns
              </p>

              {/* Time Period Selection */}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setPredictionPeriod('nextDay')}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    predictionPeriod === 'nextDay'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next Day
                </motion.button>
                <motion.button
                  onClick={() => setPredictionPeriod('nextMonth')}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    predictionPeriod === 'nextMonth'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next Month
                </motion.button>
                <motion.button
                  onClick={() => setPredictionPeriod('nextYear')}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    predictionPeriod === 'nextYear'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next Year
                </motion.button>
              </div>
            </div>

            {/* Line Chart for Predictions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <div className="mb-3 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-gray-600 font-medium">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 font-medium">Predicted</span>
                </div>
              </div>
              <div className="h-80 relative bg-white rounded-md p-3">
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
                <motion.div 
                  className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border border-gray-300 p-4 max-w-sm z-10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const insights = getIllnessInsights(hoveredIllness);
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">{insights?.name}</span>
                          <button
                            onClick={() => setHoveredIllness(null)}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded w-6 h-6 flex items-center justify-center transition-colors text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Current:</span>
                            <span className="font-semibold text-gray-900">{insights?.current} cases</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Predicted ({insights?.timeframe}):</span>
                            <span className="font-semibold text-gray-900">{insights?.predicted} cases</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Change:</span>
                            <span className={`font-semibold ${
                              insights?.trendDirection === 'up' ? 'text-red-600' :
                              insights?.trendDirection === 'down' ? 'text-green-600' :
                              'text-yellow-600'
                            }`}>
                              {insights?.difference && insights.difference > 0 ? '+' : ''}{insights?.difference} ({insights?.change.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                          <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-xs text-gray-700 leading-relaxed">{insights?.insight}</p>
                          </div>
                          <div className="bg-blue-50 rounded-md p-3">
                            <p className="text-xs text-primary font-medium">💡 {insights?.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
              </div>
            </div>

            {/* Summary Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-gray-900">Prediction Summary</h4>
              </div>
              <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                {periodPredictions.filter(p => p.predicted.change > 2).length > 0 && (
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>
                    <p>
                      <strong className="text-red-600">{periodPredictions.filter(p => p.predicted.change > 2).length} illness(es)</strong> showing upward trend
                    </p>
                  </div>
                )}
                {periodPredictions.filter(p => p.predicted.change < -2).length > 0 && (
                  <div className="flex items-start gap-2">
                    <span>✓</span>
                    <p>
                      <strong className="text-green-600">{periodPredictions.filter(p => p.predicted.change < -2).length} illness(es)</strong> showing downward trend
                    </p>
                  </div>
                )}
                {periodPredictions.filter(p => p.predicted.change <= 2 && p.predicted.change >= -2).length > 0 && (
                  <div className="flex items-start gap-2">
                    <span>~</span>
                    <p>
                      <strong className="text-yellow-600">{periodPredictions.filter(p => p.predicted.change <= 2 && p.predicted.change >= -2).length} illness(es)</strong> remain stable
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Clickable Illness Items for Quick Insights */}
            <div>
              <p className="text-xs text-gray-600 font-medium mb-3">
                Click on an illness for detailed insights:
              </p>
              <div className="flex flex-wrap gap-2">
                {periodPredictions.map((illness) => (
                  <motion.button
                    key={illness.name}
                    onClick={() => setHoveredIllness(hoveredIllness === illness.name ? null : illness.name)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      hoveredIllness === illness.name
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Restricted Access</h3>
                <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                  Detailed illness trend predictions are only accessible to doctors for strategic healthcare planning.
                </p>
                <div className="bg-white/50 rounded-md p-3 border-l-2 border-primary">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    💡 Contact your system administrator for access to advanced analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
