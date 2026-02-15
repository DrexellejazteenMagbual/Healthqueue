import { supabase } from '../supabase';
import { PatientFile } from '../../types';

// FILE MANAGEMENT OPERATIONS

export const fileService = {
  // Upload a new file
  async uploadFile(file: PatientFile) {
    try {
      // First, upload the actual file to Supabase storage
      const fileExt = file.fileName.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `patient_files/${file.patientId}/${fileName}`;

      // Note: In a real scenario, you would upload the actual file blob
      // For now, we'll just create the database record

      // Insert file metadata into database
      const { data, error } = await supabase
        .from('patient_files')
        .insert([
          {
            patient_id: file.patientId,
            file_name: file.fileName,
            file_type: file.fileType,
            file_size: file.fileSize,
            file_url: file.fileUrl, // In production, this would be the storage URL
            document_type: file.documentType,
            uploaded_by: file.uploadedBy,
            uploaded_at: file.uploadedAt,
            description: file.description || null
          }
        ])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all files for a patient
  async getPatientFiles(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all files (for file management page)
  async getAllFiles() {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get files by document type
  async getFilesByType(documentType: string) {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('document_type', documentType)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update file information
  async updateFile(fileId: string, updates: Partial<PatientFile>) {
    try {
      const { error } = await supabase
        .from('patient_files')
        .update({
          ...(updates.fileName && { file_name: updates.fileName }),
          ...(updates.description !== undefined && { description: updates.description })
        })
        .eq('id', fileId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Delete a file
  async deleteFile(fileId: string) {
    try {
      // Get file info first to delete from storage
      const { data: fileData } = await supabase
        .from('patient_files')
        .select('file_url, patient_id, file_name')
        .eq('id', fileId)
        .single();

      if (fileData) {
        // Delete from storage if needed
        const filePath = `patient_files/${fileData.patient_id}/${fileData.file_name}`;
        
        // Note: In production, you would also delete from storage here
        // await supabase.storage.from('patient_files').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('patient_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Download a file (get signed URL)
  async getFileDownloadUrl(fileId: string) {
    try {
      const { data: fileData } = await supabase
        .from('patient_files')
        .select('file_url, patient_id, file_name')
        .eq('id', fileId)
        .single();

      if (!fileData) {
        return { url: null, error: new Error('File not found') };
      }

      // In production, generate a signed URL for secure download
      // For now, return the file URL directly
      return { url: fileData.file_url, error: null };
    } catch (error) {
      return { url: null, error };
    }
  },

  // Search files by name
  async searchFiles(searchQuery: string) {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .ilike('file_name', `%${searchQuery}%`)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
