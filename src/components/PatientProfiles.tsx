import React, { useState } from 'react';
import { Patient } from '../types';
import { Search, Plus, Edit, UserPlus, ArrowUpDown, AlertCircle, Trash2, User, FileText, Calendar, ClipboardList, Clock, FolderOpen } from 'lucide-react';
import PatientForm from './PatientForm';
import { getPermissions } from '../lib/permissions';
import { auditService } from '../lib/services/auditService';
import { useTranslation } from '../lib/translations';
import Tooltip from './Tooltip';

interface PatientProfilesProps {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addToQueue: (patientId: string, priority?: 'normal' | 'priority') => void;
  userRole: 'doctor' | 'staff';
}

const PatientProfiles: React.FC<PatientProfilesProps> = ({
  patients,
  addPatient,
  updatePatient,
  deletePatient,
  addToQueue,
  userRole
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk-high' | 'risk-low'>('name');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
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
      // Update patient first for faster UI response
      await updatePatient(editingPatient.id, patientData);
      
      // Log patient update in background (don't wait)
      auditService.logDataModification(
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
      ).catch(err => console.error('Audit logging failed:', err));
      
      setEditingPatient(null);
    } else {
      // Add patient first
      addPatient(patientData);
      
      // Log patient creation in background (don't wait)
      auditService.logDataModification(
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
      ).catch(err => console.error('Audit logging failed:', err));
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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">{t.patientProfiles}</h1>
        <p className="text-muted-foreground">Manage patient information and records</p>
        <hr />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
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
        <div className="relative w-full md:w-64">
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

        <button
          onClick={() => {
            setEditingPatient(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t.addPatient}
        </button>
      </div>

      <div className="overflow-auto max-h-[70vh]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPatients.map((patient) => {
            const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
            const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
            
            return (
              <div
                key={patient.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={async () => {
                  const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
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
              >
                {/* Card content - horizontal layout */}
                <div className="flex gap-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 ${
                      patient.riskLevel === 'High' ? 'border-red-500' :
                      patient.riskLevel === 'Medium' ? 'border-yellow-500' :
                      patient.riskLevel === 'Low' ? 'border-green-500' :
                      'border-border'
                    }`}>
                      {patient.profilePicture ? (
                        <img 
                          src={patient.profilePicture} 
                          alt={`${patient.firstName} ${patient.lastName}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary">{initials}</span>
                      )}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-foreground text-base">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{age} yrs</span>
                      <span>•</span>
                      <span>{patient.gender}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {patient.phone}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
          onDelete={() => {
            setDeleteConfirmId(selectedPatient.id);
            setSelectedPatient(null);
          }}
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

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Confirm Delete</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this patient? This action cannot be undone and will permanently remove all patient records.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePatient(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
  onDelete: () => void;
  permissions: ReturnType<typeof getPermissions>;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patient, onClose, onEdit, onAddToQueue, onDelete, permissions }) => {
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  const isPriority = age >= 60 || patient.medicalHistory.some(condition => 
    ['Hypertension', 'Diabetes', 'Heart Disease'].includes(condition)
  );
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'anamnesis' | 'files' | 'scheduled' | 'history' | 'treatments'>('profile');
  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'general' as const, label: 'General Info', icon: FileText },
    { id: 'anamnesis' as const, label: 'Anamnesis', icon: ClipboardList },
    { id: 'files' as const, label: 'Files', icon: FolderOpen },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Calendar },
    { id: 'history' as const, label: 'Visit History', icon: Clock },
    { id: 'treatments' as const, label: 'Treatments', icon: Edit },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{age} years old • {patient.gender}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-muted/50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 ${
                  patient.riskLevel === 'High' ? 'border-red-500' :
                  patient.riskLevel === 'Medium' ? 'border-yellow-500' :
                  patient.riskLevel === 'Low' ? 'border-green-500' :
                  'border-border'
                }`}>
                  {patient.profilePicture ? (
                    <img 
                      src={patient.profilePicture} 
                      alt={`${patient.firstName} ${patient.lastName}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{initials}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-muted-foreground">{patient.email}</p>
                  <p className="text-muted-foreground">{patient.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="text-lg font-semibold text-foreground">{patient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-lg font-semibold text-foreground">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p className="text-lg font-semibold text-foreground">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className="text-lg font-semibold text-foreground">{patient.riskLevel || 'Low'}</p>
                </div>
              </div>
            </div>
          )}

          {/* General Information Tab */}
          {activeTab === 'general' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">General Information</h3>
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
          )}

          {/* Anamnesis Tab */}
          {activeTab === 'anamnesis' && (
            <div className="space-y-6">
              {/* Medical History */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Medical History</h3>
                {permissions.canViewAllPatientDetails ? (
                  patient.medicalHistory.length > 0 ? (
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
                    <p className="text-muted-foreground">No medical history recorded</p>
                  )
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

              {/* Allergies */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Allergies</h3>
                {patient.allergies.length > 0 ? (
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
                ) : (
                  <p className="text-muted-foreground">No known allergies</p>
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Patient Files</h3>
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No files uploaded yet</p>
                <button className="mt-4 text-sm text-primary hover:underline">Upload File</button>
              </div>
            </div>
          )}

          {/* Scheduled Visits Tab */}
          {activeTab === 'scheduled' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Scheduled Appointments</h3>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scheduled appointments</p>
                <button className="mt-4 text-sm text-primary hover:underline">Schedule Appointment</button>
              </div>
            </div>
          )}

          {/* Visit History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Visit History</h3>
              <div className="space-y-3">
                {patient.lastVisit ? (
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">General Checkup</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(patient.lastVisit).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No visit history</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Planned Treatments Tab */}
          {activeTab === 'treatments' && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Planned Treatments</h3>
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No planned treatments</p>
                <button className="mt-4 text-sm text-primary hover:underline">Add Treatment Plan</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-card border-t border-border p-6 flex gap-3 items-center overflow-x-auto">
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
          {permissions.canEditPatientMedical && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Patient
            </button>
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
