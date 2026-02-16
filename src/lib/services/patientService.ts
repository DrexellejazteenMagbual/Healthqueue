import { supabase } from '../supabase';
import { Patient } from '../../types';

// PATIENTS TABLE OPERATIONS

export const patientService = {
  // Create a new patient
  async createPatient(patient: Omit<Patient, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([
          {
            first_name: patient.firstName,
            last_name: patient.lastName,
            date_of_birth: patient.dateOfBirth,
            age: patient.age || null,
            gender: patient.gender,
            address: patient.address,
            phone: patient.phone,
            email: patient.email,
            emergency_contact: patient.emergencyContact,
            medical_history: patient.medicalHistory,
            allergies: patient.allergies,
            blood_type: patient.bloodType,
            last_visit: patient.lastVisit || null,
            risk_level: patient.riskLevel || 'Low',
            profile_picture: patient.profilePicture || null,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all patients
  async getAllPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get patient by ID
  async getPatientById(id: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update patient
  async updatePatient(id: string, patient: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
    try {
      const updateData: any = {};
      
      if (patient.firstName) updateData.first_name = patient.firstName;
      if (patient.lastName) updateData.last_name = patient.lastName;
      if (patient.dateOfBirth) updateData.date_of_birth = patient.dateOfBirth;
      if (patient.age !== undefined) updateData.age = patient.age;
      if (patient.gender) updateData.gender = patient.gender;
      if (patient.address) updateData.address = patient.address;
      if (patient.phone) updateData.phone = patient.phone;
      if (patient.email) updateData.email = patient.email;
      if (patient.emergencyContact) updateData.emergency_contact = patient.emergencyContact;
      if (patient.medicalHistory) updateData.medical_history = patient.medicalHistory;
      if (patient.allergies) updateData.allergies = patient.allergies;
      if (patient.bloodType) updateData.blood_type = patient.bloodType;
      if (patient.lastVisit) updateData.last_visit = patient.lastVisit;
      if (patient.riskLevel) updateData.risk_level = patient.riskLevel;
      if (patient.profilePicture !== undefined) updateData.profile_picture = patient.profilePicture;

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete patient
  async deletePatient(id: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Search patients
  async searchPatients(searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
