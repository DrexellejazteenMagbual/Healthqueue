import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideModal, setOverrideModal] = useState<{ itemId: string; currentPriority: 'normal' | 'priority' } | null>(null);
  const [overrideJustification, setOverrideJustification] = useState('');

  const sortedQueue = [...queue].sort((a, b) => {
    if (a.priority === 'priority' && b.priority === 'normal') return -1;
    if (a.priority === 'normal' && b.priority === 'priority') return 1;
    return a.queueNumber - b.queueNumber;
  });

  // Filter queue based on search term
  const filteredQueue = sortedQueue.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
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
      case 'waiting': return 'bg-yellow-700';
      case 'called': return 'bg-blue-500';
      case 'serving': return 'bg-green-800';
      case 'completed': return 'bg-gray-500';
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
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">{t.queueManagement}</h1>
        <p className="text-muted-foreground">Manage patient queue and service status</p> <hr />
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t.addToQueue}</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <select value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.selectPatient}</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName} - {patient.phone}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToQueue}
            disabled={!selectedPatient}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-auto w-full"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addToQueue}</span>
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t.currentQueueTitle}</h3>
          <div className="relative md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.search + '...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-96">
          {filteredQueue.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'No patients found in queue' : 'No patients in queue'}
            </p>
          ) : (
            filteredQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-accent rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">#{item.queueNumber}</span>
                    {item.priority === 'priority' && (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      Added: {new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-5 py-2 rounded-full text-white text-sm ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                  
                  <div className="flex gap-1">
                    {/* Priority Override Button (Doctor Only) */}
                    {permissions.canOverridePriority ? (
                      <Tooltip content={`Toggle priority: ${item.priority === 'priority' ? 'Remove priority' : 'Make priority'}`}>
                        <button
                          onClick={() => handlePriorityOverride(item.id, item.priority)}
                          className={`p-3 rounded transition-colors ${
                            item.priority === 'priority'
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Override Priority"
                        >
                          {item.priority === 'priority' ? (
                            <ArrowDown className="w-5 h-5" />
                          ) : (
                            <ArrowUp className="w-5 h-5" />
                          )}
                        </button>
                      </Tooltip>
                    ) : null}
                    
                    {item.status === 'waiting' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'called')}
                        className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="Call Patient"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    
                    {item.status === 'called' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'serving')}
                        className="p-3 bg-green-800 text-white rounded hover:bg-green-600 transition-colors"
                        title="Start Serving"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    
                    {item.status === 'serving' && (
                      <button
                        onClick={() => updateQueueStatus(item.id, 'completed')}
                        className="p-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        title="Complete Service"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-3 bg-red-800 text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                      title="Remove from Queue"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Priority Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Override Queue Priority</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Current:</strong> {overrideModal.currentPriority === 'priority' ? 'Priority Queue' : 'Normal Queue'}
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Change to:</strong> {overrideModal.currentPriority === 'priority' ? 'Normal Queue' : 'Priority Queue'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Justification (required for audit trail)
                </label>
                <textarea
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="Explain why this priority change is necessary..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmPriorityOverride}
                  disabled={!overrideJustification.trim()}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Override
                </button>
                <button
                  onClick={() => {
                    setOverrideModal(null);
                    setOverrideJustification('');
                  }}
                  className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
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
