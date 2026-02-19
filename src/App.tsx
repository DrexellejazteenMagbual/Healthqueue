import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import StaffManagement from './components/StaffManagement';
import { Patient, QueueItem, AnalyticsData } from './types';
import { patientService } from './lib/services/patientService';
import { queueService } from './lib/services/queueService';
import { auditService } from './lib/services/auditService';
import { analyticsService } from './lib/services/analyticsService';
import { settingsManager } from './lib/settingsManager';
import { notificationService } from './lib/notificationService';
import { supabase } from './lib/supabase';
import { ToastProvider } from './lib/ToastProvider';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'doctor' | 'staff' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
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

  // Fetch real-time analytics data
  const fetchAnalyticsData = async () => {
    try {
      // Get current visits
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await analyticsService.getDailyVisits(today);
      const { data: weeklyData } = await analyticsService.getWeeklyVisits();
      const { data: monthlyData } = await analyticsService.getMonthlyVisits();
      
      // Get previous period data for trend calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: yesterdayData } = await analyticsService.getDailyVisits(yesterday.toISOString().split('T')[0]);
      
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      const { data: lastWeekStats } = await analyticsService.getVisitStats(
        lastWeekStart.toISOString().split('T')[0],
        lastWeekEnd.toISOString().split('T')[0]
      );
      const lastWeekTotal = lastWeekStats ? Object.values(lastWeekStats).reduce((sum: number, val: any) => sum + val, 0) : 0;
      
      // Calculate trends
      const dailyTrend = yesterdayData ? ((dailyData || 0) - yesterdayData) / Math.max(yesterdayData, 1) * 100 : 0;
      const weeklyTrend = lastWeekTotal ? ((weeklyData || 0) - lastWeekTotal) / Math.max(lastWeekTotal, 1) * 100 : 0;
      const monthlyTrend = 15; // Placeholder for now
      
      // Get common illnesses
      const { data: illnesses } = await analyticsService.getCommonIllnesses(10);
      
      // Get patient volume data for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: volumeStats } = await analyticsService.getVisitStats(
        sevenDaysAgo.toISOString().split('T')[0],
        today
      );
      
      // Convert stats to array format
      const patientVolumeData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        patientVolumeData.push({
          date: dateStr,
          visits: volumeStats?.[dateStr] || 0
        });
      }
      
      setAnalyticsData({
        dailyVisits: dailyData || 0,
        weeklyVisits: weeklyData || 0,
        monthlyVisits: monthlyData || 0,
        dailyTrend: Math.round(dailyTrend * 10) / 10,
        weeklyTrend: Math.round(weeklyTrend * 10) / 10,
        monthlyTrend: Math.round(monthlyTrend * 10) / 10,
        commonIllnesses: illnesses || [],
        patientVolumeData
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

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
          riskLevel: p.risk_level,
          profilePicture: p.profile_picture
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
    fetchAnalyticsData();

    // Set up real-time subscription for analytics
    const analyticsChannel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analytics'
        },
        () => {
          fetchAnalyticsData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'illness_tracking'
        },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsChannel);
    };
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
          riskLevel: p.risk_level,
          profilePicture: p.profile_picture
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
      
      // Refresh analytics data
      await fetchAnalyticsData();
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
    const patient = patients.find(p => p.id === id);
    const { error } = await patientService.updatePatient(id, updates);
    
    if (error) {
      console.error('Error updating patient:', error);
      notificationService.notify({
        message: 'Failed to update patient. Please try again.',
        type: 'error',
        duration: 4000
      });
    } else {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (patient) {
        notificationService.notify({
          message: `Patient ${patient.firstName} ${patient.lastName} has been updated.`,
          type: 'success',
          duration: 3000
        });
      }
    }
  };

  const deletePatient = async (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    const { error } = await patientService.deletePatient(id);
    
    if (error) {
      console.error('Error deleting patient:', error);
      notificationService.notify({
        message: 'Failed to delete patient. Please try again.',
        type: 'error',
        duration: 4000
      });
    } else {
      setPatients(prev => prev.filter(p => p.id !== id));
      notificationService.notify({
        message: `Patient ${patient.firstName} ${patient.lastName} has been deleted.`,
        type: 'success',
        duration: 3000
      });
      
      // Log patient deletion
      const userEmail = localStorage.getItem('userEmail') || 'unknown@clinic.com';
      const currentRole = userRole || 'doctor';
      await auditService.logDataModification(
        userEmail,
        currentRole,
        'patient',
        id,
        'delete',
        {
          before: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            id: patient.id
          }
        }
      );
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

  return (
    <ToastProvider>
      <Router>
        <AppContent 
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          userName={userName}
          patients={patients}
          queue={queue}
          analyticsData={analyticsData}
          addPatient={addPatient}
          updatePatient={updatePatient}
          deletePatient={deletePatient}
          addToQueue={addToQueue}
          updateQueueStatus={updateQueueStatus}
          removeFromQueue={removeFromQueue}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
      </Router>
    </ToastProvider>
  );
};

// Separate component to access useLocation
const AppContent: React.FC<{
  isAuthenticated: boolean;
  userRole: 'doctor' | 'staff' | null;
  userName: string;
  patients: Patient[];
  queue: QueueItem[];
  analyticsData: AnalyticsData;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addToQueue: (patientId: string, priority?: 'normal' | 'priority') => void;
  updateQueueStatus: (id: string, status: 'waiting' | 'called' | 'serving' | 'completed') => void;
  removeFromQueue: (id: string) => void;
  handleLogin: (role: 'doctor' | 'staff', email: string) => void;
  handleLogout: () => void;
}> = ({
  isAuthenticated,
  userRole,
  userName,
  patients,
  queue,
  analyticsData,
  addPatient,
  updatePatient,
  deletePatient,
  addToQueue,
  updateQueueStatus,
  removeFromQueue,
  handleLogin,
  handleLogout
}) => {
  const location = useLocation();
  const isFullScreenRoute = location.pathname === '/tv' || location.pathname === '/setup';

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Full screen routes without navigation
  if (isFullScreenRoute) {
    return (
      <Routes>
        <Route 
          path="/tv" 
          element={<QueueDisplay queue={queue} />} 
        />
        <Route 
          path="/setup" 
          element={<SetupPage />} 
        />
      </Routes>
    );
  }

  // Main app routes with navigation
  return (
    <div className="flex flex-col h-screen bg-background pt-16">
      {/* Top Navigation */}
      <Sidebar 
        onNavigate={() => {}} 
        userRole={userRole!}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full lg:pl-20">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                patients={patients}
                queue={queue}
                analyticsData={analyticsData}
                userRole={userRole}
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
                deletePatient={deletePatient}
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
          <Route path="/settings" element={<Settings userRole={userRole!} onLogout={handleLogout} />} />
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
  );
};

export default App;