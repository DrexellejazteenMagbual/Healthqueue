import React, { useState } from 'react';
import { Patient } from '../types';
import { Search, Plus, Edit, UserPlus, ArrowUpDown, AlertCircle } from 'lucide-react';
import PatientForm from './PatientForm';
import PatientCard from './PatientCard';
import { getPermissions } from '../lib/permissions';
import { auditService } from '../lib/services/auditService';
import { useTranslation } from '../lib/translations';
import Tooltip from './Tooltip';

interface PatientProfilesProps {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addToQueue: (patientId: string, priority?: 'normal' | 'priority') => void;
  userRole: 'doctor' | 'staff';
}

const PatientProfiles: React.FC<PatientProfilesProps> = ({
  patients,
  addPatient,
  updatePatient,
  addToQueue,
  userRole
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk-high' | 'risk-low'>('name');
  
  const permissions = getPermissions(userRole);

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort patients based on selected option
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'risk-high') {
      // High risk first, then Medium, then Low, then no risk
      const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const aRisk = a.riskLevel ? riskOrder[a.riskLevel] : 3;
      const bRisk = b.riskLevel ? riskOrder[b.riskLevel] : 3;
      return aRisk - bRisk;
    } else if (sortBy === 'risk-low') {
      // Low risk first, then Medium, then High, then no risk
      const riskOrder = { 'Low': 0, 'Medium': 1, 'High': 2 };
      const aRisk = a.riskLevel ? riskOrder[a.riskLevel] : 3;
      const bRisk = b.riskLevel ? riskOrder[b.riskLevel] : 3;
      return aRisk - bRisk;
    } else {
      // Sort by name (default)
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    }
  });

  const handleSubmit = async (patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
    
    if (editingPatient) {
      // Log patient update
      await auditService.logDataModification(
        userEmail,
        userRole,
        'patient',
        editingPatient.id,
        'update',
        {
          before: editingPatient,
          after: patientData,
          changes: Object.keys(patientData).filter(key => 
            JSON.stringify(editingPatient[key as keyof Patient]) !== JSON.stringify(patientData[key as keyof Omit<Patient, 'id' | 'createdAt'>])
          )
        }
      );
      updatePatient(editingPatient.id, patientData);
      setEditingPatient(null);
    } else {
      // Log patient creation
      await auditService.logDataModification(
        userEmail,
        userRole,
        'patient',
        'new',
        'create',
        {
          after: {
            patientData,
            createdBy: userEmail
          }
        }
      );
      addPatient(patientData);
    }
    setShowForm(false);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleAddToQueue = (patientId: string, priority: 'normal' | 'priority' = 'normal') => {
    addToQueue(patientId, priority);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.patientProfiles}</h1>
          <p className="text-muted-foreground">Manage patient information and records</p>
          <hr />
        </div>
        <button
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.addPatient}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Sort By */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="risk-high">Sort by Risk (High First)</option>
            <option value="risk-low">Sort by Risk (Low First)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 gap-2 overflow-auto max-h-[70vh]">
        {sortedPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onClick={async () => {
              const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
              // Log patient data access
              await auditService.logDataAccess(
                userEmail,
                userRole,
                'patient',
                patient.id,
                'view',
                true
              );
              setSelectedPatient(patient);
            }}
          />
        ))}
      </div>

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onEdit={() => {
            setEditingPatient(selectedPatient);
            setSelectedPatient(null);
            setShowForm(true);
          }}
          onAddToQueue={handleAddToQueue}
          permissions={permissions}
        />
      )}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
};

// Patient Details Modal Component
interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
  onAddToQueue: (patientId: string, priority: 'normal' | 'priority') => void;
  permissions: ReturnType<typeof getPermissions>;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patient, onClose, onEdit, onAddToQueue, permissions }) => {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  const isPriority = age >= 60 || patient.medicalHistory.some(condition => 
    ['Hypertension', 'Diabetes', 'Heart Disease'].includes(condition)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              {patient.firstName} {patient.lastName}
            </h2>

          </div>
          {patient.riskLevel && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              patient.riskLevel === 'High' ? 'bg-destructive text-destructive-foreground' :
              patient.riskLevel === 'Medium' ? 'bg-yellow-500 text-white' :
              'bg-green-500 text-white'
            }`}>
              {patient.riskLevel} Risk
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="text-foreground">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="text-foreground">{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-foreground">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{patient.email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-foreground">{patient.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="text-foreground">{patient.emergencyContact}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="text-foreground">
                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical History */}
          {patient.medicalHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Medical History</h3>
              {permissions.canViewAllPatientDetails ? (
                <div className="flex flex-wrap gap-2">
                  {patient.medicalHistory.map((condition, index) => (
                    <span
                      key={index}
                      className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Restricted Access</p>
                    <p className="text-sm text-yellow-700 mt-1">Full medical history is only accessible to doctors for patient privacy.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          {patient.allergies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 flex-wrap">
          {permissions.canEditPatientMedical ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Patient
            </button>
          ) : (
            <Tooltip content="Only doctors can edit patient medical information">
              <button
                disabled
                className="flex items-center gap-2 bg-secondary/50 text-secondary-foreground/50 px-4 py-2 rounded-lg cursor-not-allowed"
              >
                <Edit className="w-4 h-4" />
                Edit Patient
              </button>
            </Tooltip>
          )}
          <button
            onClick={() => {
              onAddToQueue(patient.id, 'normal');
              onClose();
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add to Queue
          </button>
          {isPriority && (
            permissions.canAddPriorityQueue ? (
              <button
                onClick={() => {
                  onAddToQueue(patient.id, 'priority');
                  onClose();
                }}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Priority Queue
              </button>
            ) : (
              <Tooltip content="Only doctors can add patients to priority queue">
                <button
                  disabled
                  className="flex items-center gap-2 bg-destructive/50 text-destructive-foreground/50 px-4 py-2 rounded-lg cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  Priority Queue
                </button>
              </Tooltip>
            )
          )}
          <button
            onClick={onClose}
            className="ml-auto bg-card border border-border text-foreground px-4 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientProfiles;
