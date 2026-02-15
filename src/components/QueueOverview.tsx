import React from 'react';
import { QueueItem } from '../types';
import { Clock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from '../lib/translations';

interface QueueOverviewProps {
  queue: QueueItem[];
}

const QueueOverview: React.FC<QueueOverviewProps> = ({ queue }) => {
  const { t } = useTranslation();
  const waitingQueue = queue.filter(item => item.status === 'waiting');
  const servingQueue = queue.filter(item => item.status === 'serving');

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{t.queueOverview}</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">{t.waiting}</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{waitingQueue.length}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-secondary" />
            <span className="font-medium text-foreground">{t.serving}</span>
          </div>
          <span className="text-1xl font-bold text-foreground">{servingQueue.length}</span>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Next in Queue</h4>
          {waitingQueue.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                {item.priority === 'priority' && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm text-foreground">#{item.queueNumber}</span>
                <span className="text-sm text-muted-foreground">{item.patientName}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QueueOverview;
