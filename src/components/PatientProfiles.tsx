import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Patient } from '../types';
import { Search, Plus, Edit, UserPlus, ArrowUpDown, AlertCircle, Trash2, User, FileText, Calendar, ClipboardList, Clock, FolderOpen, Eye } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-gray-600">Manage patient information and records</p>
      </motion.div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Sort By */}
        <div className="relative w-full md:w-64">
          <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
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
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t.addPatient}
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Profile
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Age
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Email
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No patients found</p>
                    <p className="text-sm text-gray-400 mt-1">Add a new patient to get started</p>
                  </td>
                </tr>
              ) : (
                sortedPatients.map((patient) => {
                  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
                  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                  
                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* Profile Picture */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 transition-all ${
                          patient.riskLevel === 'High' ? 'border-red-500' :
                          patient.riskLevel === 'Medium' ? 'border-amber-500' :
                          patient.riskLevel === 'Low' ? 'border-green-500' :
                          'border-gray-300'
                        }`}>
                          {patient.profilePicture ? (
                            <img 
                              src={patient.profilePicture} 
                              alt={`${patient.firstName} ${patient.lastName}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-primary">{initials}</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                      </td>
                      
                      {/* Age */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{age}</div>
                      </td>
                      
                      {/* Gender */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{patient.gender}</div>
                      </td>
                      
                      {/* Phone */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{patient.phone}</div>
                      </td>
                      
                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{patient.email}</div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip content="View Patient Details">
                            <button
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
                              className="text-gray-500 hover:text-primary transition-all p-2 hover:bg-blue-50 rounded-lg group-hover:bg-white"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          
                          {permissions.canEditPatientMedical ? (
                            <Tooltip content="Delete Patient">
                              <button
                                onClick={() => setDeleteConfirmId(patient.id)}
                                className="text-gray-500 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-lg group-hover:bg-white"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Only doctors can delete patients">
                              <button
                                disabled
                                className="text-gray-300 cursor-not-allowed p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-2xl border border-gray-200"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Patient?</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This action cannot be undone and will permanently remove all patient records, medical history, and associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePatient(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-sm"
              >
                Delete Patient
              </button>
            </div>
          </motion.div>
        </motion.div>
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative shadow-2xl border border-gray-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-6 flex items-start justify-between rounded-t-xl">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
              <span>{age} years old</span>
              <span className="text-gray-300">•</span>
              <span>{patient.gender}</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all relative ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
                  patient.riskLevel === 'Medium' ? 'border-amber-500' :
                  patient.riskLevel === 'Low' ? 'border-green-500' :
                  'border-gray-300'
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
                  <h3 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-gray-600">{patient.email}</p>
                  <p className="text-gray-600">{patient.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Blood Type</p>
                  <p className="text-lg font-semibold text-gray-900">{patient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <p className="text-lg font-semibold text-gray-900">{patient.riskLevel || 'Low'}</p>
                </div>
              </div>
            </div>
          )}

          {/* General Information Tab */}
          {activeTab === 'general' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-gray-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blood Type</p>
                  <p className="text-gray-900">{patient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{patient.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900">{patient.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emergency Contact</p>
                  <p className="text-gray-900">{patient.emergencyContact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-gray-900">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical History</h3>
                {permissions.canViewAllPatientDetails ? (
                  patient.medicalHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.medicalHistory.map((condition, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No medical history recorded</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Allergies</h3>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No known allergies</p>
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Files</h3>
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No files uploaded yet</p>
                <button className="mt-4 text-sm text-primary hover:underline">Upload File</button>
              </div>
            </div>
          )}

          {/* Scheduled Visits Tab */}
          {activeTab === 'scheduled' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Appointments</h3>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No scheduled appointments</p>
                <button className="mt-4 text-sm text-primary hover:underline">Schedule Appointment</button>
              </div>
            </div>
          )}

          {/* Visit History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit History</h3>
              <div className="space-y-3">
                {patient.lastVisit ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">General Checkup</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(patient.lastVisit).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No visit history</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Planned Treatments Tab */}
          {activeTab === 'treatments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Planned Treatments</h3>
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No planned treatments</p>
                <button className="mt-4 text-sm text-primary hover:underline">Add Treatment Plan</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 p-6 flex gap-3 items-center overflow-x-auto">
          {permissions.canEditPatientMedical ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Patient
            </button>
          ) : (
            <Tooltip content="Only doctors can edit patient medical information">
              <button
                disabled
                className="flex items-center gap-2 bg-gray-100/50 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
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
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
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
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Priority Queue
              </button>
            ) : (
              <Tooltip content="Only doctors can add patients to priority queue">
                <button
                  disabled
                  className="flex items-center gap-2 bg-red-300 text-white px-4 py-2 rounded-md cursor-not-allowed"
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
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Patient
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PatientProfiles;
