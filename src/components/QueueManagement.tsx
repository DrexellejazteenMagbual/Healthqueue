import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QueueItem, Patient } from '../types';
import { Search, UserPlus, Play, Pause, CheckCircle, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { getPermissions } from '../lib/permissions';
import { auditService } from '../lib/services/auditService';
import { useTranslation } from '../lib/translations';
import { settingsManager } from '../lib/settingsManager';
import { notificationService } from '../lib/notificationService';
import Tooltip from './Tooltip';

interface QueueManagementProps {
  queue: QueueItem[];
  patients: Patient[];
  addToQueue: (patientId: string, priority?: 'normal' | 'priority') => void;
  updateQueueStatus: (id: string, status: QueueItem['status']) => void;
  removeFromQueue: (id: string) => void;
  userRole: 'doctor' | 'staff';
}

const QueueManagement: React.FC<QueueManagementProps> = ({
  queue,
  patients,
  addToQueue,
  updateQueueStatus,
  removeFromQueue,
  userRole
}) => {
  const { t } = useTranslation();
  const permissions = getPermissions(userRole);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [queueSearchTerm, setQueueSearchTerm] = useState('');
  const [overrideModal, setOverrideModal] = useState<{ itemId: string; currentPriority: 'normal' | 'priority' } | null>(null);
  const [overrideJustification, setOverrideJustification] = useState('');

  const sortedQueue = [...queue].sort((a, b) => {
    if (a.priority === 'priority' && b.priority === 'normal') return -1;
    if (a.priority === 'normal' && b.priority === 'priority') return 1;
    return a.queueNumber - b.queueNumber;
  });

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    if (!patientSearchTerm) return true;
    const searchLower = patientSearchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.phone.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower)
    );
  });

  // Filter queue based on search term
  const filteredQueue = sortedQueue.filter(item => {
    if (!queueSearchTerm) return true;
    const searchLower = queueSearchTerm.toLowerCase();
    return (
      item.patientName.toLowerCase().includes(searchLower) ||
      item.queueNumber.toString().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower)
    );
  });

  const handleAddToQueue = () => {
    if (selectedPatient) {
      const patient = patients.find(p => p.id === selectedPatient);
      if (patient) {
        const settings = settingsManager.load();
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        
        // Check priority based on settings
        let isPriority = false;
        let priorityReasons: string[] = [];
        
        // Check if senior citizen priority is enabled
        if (settings.queue.priorityForSeniors && age >= 60) {
          isPriority = true;
          priorityReasons.push('Senior Citizen');
        }
        
        // Check if PWD priority is enabled
        if (settings.queue.priorityForPWD && patient.medicalHistory.some(condition => 
          condition.toLowerCase().includes('pwd') || condition.toLowerCase().includes('disability')
        )) {
          isPriority = true;
          priorityReasons.push('PWD');
        }
        
        // Check if pregnant priority is enabled
        if (settings.queue.priorityForPregnant && patient.medicalHistory.some(condition => 
          condition.toLowerCase().includes('pregnan')
        )) {
          isPriority = true;
          priorityReasons.push('Pregnant');
        }
        
        // Add to queue with appropriate priority
        addToQueue(selectedPatient, isPriority ? 'priority' : 'normal');
        
        // Show notification about priority assignment
        if (isPriority && priorityReasons.length > 0) {
          notificationService.notify({
            message: `Priority assigned: ${priorityReasons.join(', ')}`,
            type: 'info',
            duration: 4000
          });
        }
        
        setSelectedPatient('');
      }
    }
  };

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'waiting': return 'bg-amber-500';
      case 'called': return 'bg-blue-600';
      case 'serving': return 'bg-green-600';
      case 'completed': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'waiting': return t.waiting;
      case 'called': return t.called;
      case 'serving': return t.serving;
      case 'completed': return t.completed;
      default: return status;
    }
  };

  const handlePriorityOverride = (itemId: string, currentPriority: 'normal' | 'priority') => {
    if (!permissions.canOverridePriority) return;
    setOverrideModal({ itemId, currentPriority });
  };

  const confirmPriorityOverride = async () => {
    if (!overrideModal || !overrideJustification.trim()) return;
    
    const queueItem = queue.find(q => q.id === overrideModal.itemId);
    const newPriority = overrideModal.currentPriority === 'priority' ? 'normal' : 'priority';
    
    // Log the override for audit trail
    await auditService.logPriorityOverride(
      localStorage.getItem('userName') || 'unknown@clinic.com',
      userRole,
      overrideModal.itemId,
      overrideModal.currentPriority,
      newPriority,
      overrideJustification
    );
    
    // TODO: Update queue item priority in Supabase
    // For now, just close modal
    setOverrideModal(null);
    setOverrideJustification('');
    alert('Priority override recorded. This feature requires backend implementation.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-gray-600">Manage patient queue and service status</p>
      </motion.div>

      <motion.div 
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.addToQueue}</h3>
        <div className="space-y-3">
          {/* Search Patients */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or email..."
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Patient Selection */}
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">{t.selectPatient}</option>
              {filteredPatients.length === 0 ? (
                <option disabled>No patients found</option>
              ) : (
                filteredPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - {patient.phone}
                  </option>
                ))
              )}
            </select>

            <motion.button
              onClick={handleAddToQueue}
              disabled={!selectedPatient}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-auto w-full text-sm font-medium shadow-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addToQueue}</span>
            </motion.button>
          </div>

          {/* Patient count indicator */}
          {patientSearchTerm && (
            <p className="text-xs text-gray-600">
              {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </motion.div>

      <motion.div 
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t.currentQueueTitle}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{queue.length} patient{queue.length !== 1 ? 's' : ''} in queue</p>
          </div>
          <div className="relative md:w-80 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, number, or status..."
              value={queueSearchTerm}
              onChange={(e) => setQueueSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[500px]">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                {queueSearchTerm ? 'No patients found in queue' : 'No patients in queue'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {queueSearchTerm ? 'Try a different search term' : 'Add patients to get started'}
              </p>
            </div>
          ) : (
            filteredQueue.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Queue Number Badge */}
                  <div className={`flex items-center justify-center min-w-[64px] h-16 rounded-lg font-bold text-xl ${
                    item.priority === 'priority'
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                  }`}>
                    <div className="text-center">
                      <div className="text-xs font-medium opacity-70">#{item.queueNumber}</div>
                      {item.priority === 'priority' && (
                        <AlertTriangle className="w-4 h-4 mx-auto mt-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-base">{item.patientName}</p>
                      {item.priority === 'priority' && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                          Priority
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Added {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center gap-3 md:ml-auto">
                  <span className={`px-4 py-2 rounded-md text-white text-xs font-semibold uppercase tracking-wide shadow-sm ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                  
                  <div className="flex gap-2 flex-wrap">
                    {/* Priority Override Button (Doctor Only) */}
                    {permissions.canOverridePriority ? (
                      <Tooltip content={`Toggle priority: ${item.priority === 'priority' ? 'Remove priority' : 'Make priority'}`}>
                        <button
                          onClick={() => handlePriorityOverride(item.id, item.priority)}
                          className={`p-2 rounded-md transition-all shadow-sm ${
                            item.priority === 'priority'
                              ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Override Priority"
                        >
                          {item.priority === 'priority' ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </button>
                      </Tooltip>
                    ) : null}
                    
                    {item.status === 'waiting' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'called')}
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                        title="Call Patient"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    {item.status === 'called' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'serving')}
                        className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                        title="Start Serving"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    {item.status === 'serving' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'completed')}
                        className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
                        title="Complete Service"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
                      title="Remove from Queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Priority Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Override Queue Priority</h3>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="text-sm text-amber-900">
                  <strong>Current:</strong> {overrideModal.currentPriority === 'priority' ? 'Priority Queue' : 'Normal Queue'}
                </p>
                <p className="text-sm text-amber-900">
                  <strong>Change to:</strong> {overrideModal.currentPriority === 'priority' ? 'Normal Queue' : 'Priority Queue'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Justification (required for audit trail)
                </label>
                <textarea
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="Explain why this priority change is necessary..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmPriorityOverride}
                  disabled={!overrideJustification.trim()}
                  className="flex-1 bg-primary text-white px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Confirm Override
                </button>
                <button
                  onClick={() => {
                    setOverrideModal(null);
                    setOverrideJustification('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
