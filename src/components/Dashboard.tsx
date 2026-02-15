import React from 'react';
import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Patient, QueueItem, AnalyticsData } from '../types';
import { useTranslation } from '../lib/translations';
import StatCard from './StatCard';
import RecentPatients from './RecentPatients';
import QueueOverview from './QueueOverview';

interface DashboardProps {
  patients: Patient[];
  queue: QueueItem[];
  analyticsData: AnalyticsData;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, queue, analyticsData }) => {
  const { t } = useTranslation();
  const waitingCount = queue.filter(item => item.status === 'waiting').length;
  const servingCount = queue.filter(item => item.status === 'serving').length;
  const priorityCount = queue.filter(item => item.priority === 'priority' && item.status === 'waiting').length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.dashboard}</h1>
        <p className="text-sm md:text-base text-muted-foreground">Welcome to RHU Dupax Del Sur Patient Management System</p>
        <hr />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title={t.totalPatients}
          value={patients.length.toString()}
          icon={Users}
          trend="+12% from last month"
          color="primary"
        />
        <StatCard
          title={t.queuedPatients}
          value={waitingCount.toString()}
          icon={Clock}
          trend={`${priorityCount} priority cases`}
          color="secondary"
        />
        <StatCard
          title={t.serving}
          value={servingCount.toString()}
          icon={TrendingUp}
          trend="Average wait: 15 min"
          color="accent"
        />
        <StatCard
          title={t.servedToday}
          value={analyticsData.dailyVisits.toString()}
          icon={AlertTriangle}
          trend="+8% from yesterday"
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPatients patients={patients.slice(0, 5)} />
        <QueueOverview queue={queue} />
      </div>
    </div>
  );
};

export default Dashboard;
