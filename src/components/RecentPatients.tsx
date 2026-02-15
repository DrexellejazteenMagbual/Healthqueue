import React from 'react';
import { Patient } from '../types';
import { User, Calendar } from 'lucide-react';
import { useTranslation } from '../lib/translations';

interface RecentPatientsProps {
  patients: Patient[];
}

const RecentPatients: React.FC<RecentPatientsProps> = ({ patients }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{t.recentPatients}</h3>
      <div className="space-y-4">
        {patients.map((patient) => (
          <div key={patient.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {patient.firstName} {patient.lastName}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(patient.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{patient.bloodType}</p>
              {patient.riskLevel && (
                <span className={`text-xs px-2 py-1 rounded ${
                  patient.riskLevel === 'High' ? 'bg-destructive text-destructive-foreground' :
                  patient.riskLevel === 'Medium' ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {patient.riskLevel} Risk
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentPatients;
