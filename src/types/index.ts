export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age?: string | number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
  medicalHistory: string[];
  allergies: string[];
  bloodType: string;
  createdAt: string;
  lastVisit?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  queueNumber: number;
  priority: 'normal' | 'priority';
  status: 'waiting' | 'called' | 'serving' | 'completed';
  timestamp: string;
}

export interface IllnessData {
  name: string;
  count: number;
}

export interface PatientVolumeData {
  date: string;
  visits: number;
}

export interface AnalyticsData {
  dailyVisits: number;
  weeklyVisits: number;
  monthlyVisits: number;
  dailyTrend: number;
  weeklyTrend: number;
  monthlyTrend: number;
  commonIllnesses: IllnessData[];
  patientVolumeData: PatientVolumeData[];
}
export interface User {
  id: string;
  email: string;
  role: 'doctor' | 'staff';
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface PatientFile {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: 'medical_certificate' | 'lab_result' | 'prescription' | 'report' | 'other';
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}