import React from 'react';
import { Patient } from '../types';
import { User, AlertCircle } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  const hasConditions = patient.medicalHistory.length > 0;
  const hasAllergies = patient.allergies.length > 0;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
    >
      {/* Avatar & Status */}
      <div className="flex items-start justify-between mb-3">
       
        {patient.riskLevel && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            patient.riskLevel === 'High' ? 'bg-destructive/10 text-destructive' :
            patient.riskLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-600' :
            'bg-green-500/10 text-green-600'
          }`}>
            {patient.riskLevel}
          </span>
        )}
      </div>

      {/* Patient Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground truncate">
          {patient.firstName} {patient.lastName}
        </h3>
      </div>

      {/* Quick Indicators */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        {hasConditions && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
            {patient.medicalHistory.length} condition{patient.medicalHistory.length > 1 ? 's' : ''}
          </span>
        )}
        {hasAllergies && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {patient.allergies.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default PatientCard;
