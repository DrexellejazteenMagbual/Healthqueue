import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientProfiles from './components/PatientProfiles';
import QueueManagement from './components/QueueManagement';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import QueueDisplay from './components/QueueDisplay';
import SetupPage from './components/SetupPage';
import Login from './components/Login';
import FileManagement from './components/FileManagement';
import AuditLogs from './components/AuditLogs';
import StaffManagement from './components/StaffManagement';
import { Patient, QueueItem, AnalyticsData } from './types';
import { patientService } from './lib/services/patientService';
import { queueService } from './lib/services/queueService';
import { auditService } from './lib/services/auditService';
import { settingsManager } from './lib/settingsManager';
import { notificationService } from './lib/notificationService';
import { ToastProvider } from './lib/ToastProvider';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'doctor' | 'staff' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyVisits: 0,
    weeklyVisits: 0,
    monthlyVisits: 0,
    dailyTrend: 0,
    weeklyTrend: 0,
    monthlyTrend: 0,
    commonIllnesses: [],
    patientVolumeData: []
  });

  // Handle login
  const handleLogin = (role: 'doctor' | 'staff', email: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    // Extract name from email (before @) and capitalize
    const name = email.split('@')[0].split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    setUserName(name);
    // In production, save authentication token to localStorage
    localStorage.setItem('authToken', 'demo_token');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
  };

  // Handle logout
  const handleLogout = async () => {
    // Log logout event before clearing session data
    const userEmail = localStorage.getItem('userEmail') || 'unknown@clinic.com';
    const currentRole = userRole || 'staff';
    
    await auditService.logAuth(userEmail, currentRole, 'logout', true);
    
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');
    
    if (savedToken && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole as 'doctor' | 'staff');
      setUserName(savedName || 'User');
    }
  }, []);

  // Load patients from Supabase on mount or when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPatients = async () => {
      const { data, error } = await patientService.getAllPatients();
      
      if (error) {
        console.error('Error loading patients:', error);
      } else if (data) {
        // Map Supabase data to Patient format
        const mappedPatients = data.map((p: any) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          age: p.age,
          gender: p.gender,
          address: p.address,
          phone: p.phone,
          email: p.email,
          emergencyContact: p.emergency_contact,
          medicalHistory: p.medical_history || [],
          allergies: p.allergies || [],
          bloodType: p.blood_type,
          createdAt: p.created_at,
          lastVisit: p.last_visit,
          riskLevel: p.risk_level
        }));
        setPatients(mappedPatients);
      }
    };

    const loadQueue = async () => {
      const { data, error } = await queueService.getQueue();
      
      if (error) {
        console.error('Error loading queue:', error);
      } else if (data) {
        // Map Supabase data to QueueItem format
        const mappedQueue = data.map((q: any) => ({
          id: q.id,
          patientId: q.patient_id,
          patientName: q.patient_name,
          queueNumber: q.queue_number,
          priority: q.priority,
          status: q.status,
          timestamp: q.timestamp
        }));
        setQueue(mappedQueue);
        
        // Get the highest queue number so far
        const maxQueueNumber = mappedQueue.reduce((max: number, item: QueueItem) => 
          Math.max(max, item.queueNumber), 0);
        setCurrentNumber(maxQueueNumber + 1);
      }
    };

    loadPatients();
    loadQueue();

    // Sample analytics data (static for now)
    setAnalyticsData({
      dailyVisits: 25,
      weeklyVisits: 150,
      monthlyVisits: 620,
      dailyTrend: 8,
      weeklyTrend: 12,
      monthlyTrend: 15,
      commonIllnesses: [
        { name: 'Hypertension', count: 45 },
        { name: 'Diabetes', count: 32 },
        { name: 'Common Cold', count: 28 },
        { name: 'Arthritis', count: 22 }
      ],
      patientVolumeData: [
        { date: '2024-01-01', visits: 20 },
        { date: '2024-01-02', visits: 25 },
        { date: '2024-01-03', visits: 18 },
        { date: '2024-01-04', visits: 30 },
        { date: '2024-01-05', visits: 22 },
        { date: '2024-01-06', visits: 28 },
        { date: '2024-01-07', visits: 15 }
      ]
    });
  }, [isAuthenticated]);

  // Auto-refresh functionality based on settings
  useEffect(() => {
    if (!isAuthenticated) return;

    const settings = settingsManager.load();
    if (!settings.display.autoRefresh) return;

    const refreshInterval = settings.display.refreshInterval * 1000; // Convert to milliseconds

    const loadData = async () => {
      // Reload patients
      const { data: patientsData } = await patientService.getAllPatients();
      if (patientsData) {
        const mappedPatients = patientsData.map((p: any) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          age: p.age,
          gender: p.gender,
          address: p.address,
          phone: p.phone,
          email: p.email,
          emergencyContact: p.emergency_contact,
          medicalHistory: p.medical_history || [],
          allergies: p.allergies || [],
          bloodType: p.blood_type,
          createdAt: p.created_at,
          lastVisit: p.last_visit,
          riskLevel: p.risk_level
        }));
        setPatients(mappedPatients);
      }

      // Reload queue
      const { data: queueData } = await queueService.getQueue();
      if (queueData) {
        const mappedQueue = queueData.map((q: any) => ({
          id: q.id,
          patientId: q.patient_id,
          patientName: q.patient_name,
          queueNumber: q.queue_number,
          priority: q.priority,
          status: q.status,
          timestamp: q.timestamp
        }));
        setQueue(mappedQueue);
      }
    };

    const intervalId = setInterval(loadData, refreshInterval);

    // Listen for settings changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      if (!newSettings.display.autoRefresh) {
        clearInterval(intervalId);
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [isAuthenticated]);

  const addPatient = async (patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const { data, error } = await patientService.createPatient(patient);
    
    if (error) {
      console.error('Error creating patient:', error);
      notificationService.notify({
        message: 'Failed to add patient. Please try again.',
        type: 'error',
        duration: 4000
      });
    } else if (data && data[0]) {
      const newPatient: Patient = {
        id: data[0].id,
        firstName: data[0].first_name,
        lastName: data[0].last_name,
        dateOfBirth: data[0].date_of_birth,
        age: data[0].age,
        gender: data[0].gender,
        address: data[0].address,
        phone: data[0].phone,
        email: data[0].email,
        emergencyContact: data[0].emergency_contact,
        medicalHistory: data[0].medical_history || [],
        allergies: data[0].allergies || [],
        bloodType: data[0].blood_type,
        createdAt: data[0].created_at,
        lastVisit: data[0].last_visit,
        riskLevel: data[0].risk_level
      };
      setPatients(prev => [...prev, newPatient]);
      notificationService.newPatient(`New patient added: ${newPatient.firstName} ${newPatient.lastName}`);
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const { error } = await patientService.updatePatient(id, updates);
    
    if (error) {
      console.error('Error updating patient:', error);
    } else {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const addToQueue = async (patientId: string, priority: 'normal' | 'priority' = 'normal') => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const queueItem = {
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      queueNumber: currentNumber,
      priority,
      status: 'waiting' as const,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await queueService.addToQueue(queueItem);
    
    if (error) {
      console.error('Error adding to queue:', error);
      notificationService.notify({
        message: 'Failed to add patient to queue.',
        type: 'error',
        duration: 4000
      });
    } else if (data && data[0]) {
      const newQueueItem: QueueItem = {
        id: data[0].id,
        patientId: data[0].patient_id,
        patientName: data[0].patient_name,
        queueNumber: data[0].queue_number,
        priority: data[0].priority,
        status: data[0].status,
        timestamp: data[0].timestamp
      };
      setQueue(prev => [...prev, newQueueItem]);
      setCurrentNumber(prev => prev + 1);
      
      const priorityText = priority === 'priority' ? ' (Priority)' : '';
      notificationService.queueUpdate(`${patient.firstName} ${patient.lastName} added to queue #${currentNumber}${priorityText}`);
    }
  };

  const updateQueueStatus = async (id: string, status: QueueItem['status']) => {
    const { error } = await queueService.updateQueueStatus(id, status);
    
    if (error) {
      console.error('Error updating queue status:', error);
    } else {
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const removeFromQueue = async (id: string) => {
    const { error } = await queueService.removeFromQueue(id);
    
    if (error) {
      console.error('Error removing from queue:', error);
    } else {
      setQueue(prev => prev.filter(item => item.id !== id));
    }
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
  return (
    <ToastProvider>
      <Router>
        <Login onLogin={handleLogin} />
      </Router>
    </ToastProvider>
  );
  }

  return (
    <ToastProvider>
      <Router>
      {/* TV Display Route - Full Screen Only */}
      <Routes>
        <Route 
          path="/tv" 
          element={<QueueDisplay queue={queue} />} 
        />
        
        {/* Setup Page - Home */}
        <Route 
          path="/setup" 
          element={<SetupPage />} 
        />
      </Routes>

      {/* Main App Routes */}
      <div className="flex flex-col md:flex-row h-screen bg-background">
        {/* Mobile Header */}
        <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <img 
              src="/mho-logo.png" 
              alt="MHO Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-lg font-semibold text-foreground">HealthQueue</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-screen w-64 transform transition-transform duration-300 z-40 md:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar 
            onNavigate={() => setSidebarOpen(false)} 
            userRole={userRole!}
            userName={userName}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  patients={patients}
                  queue={queue}
                  analyticsData={analyticsData}
                />
              } 
            />
            <Route 
              path="/patients" 
              element={
                <PatientProfiles 
                  patients={patients}
                  addPatient={addPatient}
                  updatePatient={updatePatient}
                  addToQueue={addToQueue}
                  userRole={userRole!}
                />
              } 
            />
            <Route 
              path="/queue" 
              element={
                <QueueManagement 
                  queue={queue}
                  patients={patients}
                  addToQueue={addToQueue}
                  updateQueueStatus={updateQueueStatus}
                  removeFromQueue={removeFromQueue}
                  userRole={userRole!}
                />
              } 
            />
            <Route 
              path="/analytics" 
              element={<Analytics analyticsData={analyticsData} userRole={userRole!} />} 
            />
            <Route 
              path="/files" 
              element={
                <FileManagement 
                  patients={patients}
                  userRole={userRole!}
                />
              } 
            />
            <Route path="/settings" element={<Settings userRole={userRole!} />} />
            <Route 
              path="/audit-logs" 
              element={<AuditLogs userRole={userRole!} />} 
            />
            <Route 
              path="/staff" 
              element={<StaffManagement userRole={userRole!} />} 
            />
            <Route 
              path="/queue-display" 
              element={<QueueDisplay queue={queue} />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
    </ToastProvider>
  );
};

export default App;
