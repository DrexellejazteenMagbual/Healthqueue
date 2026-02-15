import React, { useState, useRef, useEffect } from 'react';
import { Patient, PatientFile } from '../types';
import { X, Upload, File, Search, ChevronDown } from 'lucide-react';

interface FileUploadProps {
  patients: Patient[];
  onUpload: (file: PatientFile) => void;
  onCancel: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ patients, onUpload, onCancel }) => {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [documentType, setDocumentType] = useState<'medical_certificate' | 'lab_result' | 'prescription' | 'report' | 'other'>('medical_certificate');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const searchLower = patientSearchQuery.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower)
    );
  });

  // Get selected patient object
  const selectedPatientObj = patients.find(p => p.id === selectedPatient);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
    setShowPatientDropdown(false);
    setPatientSearchQuery('');
  };

  const validateFile = (selectedFile: File) => {
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Allowed: PDF, Images (JPEG/PNG), Word Documents');
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    try {
      // Generate a unique file URL (in production, this would handle actual file storage)
      // For demo purposes, we'll create a mock file URL
      const fileUrl = URL.createObjectURL(file);
      
      // Create the PatientFile object
      const newFile: PatientFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: selectedPatient,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        documentType: documentType,
        uploadedBy: 'Current User', // TODO: Get from authentication
        uploadedAt: new Date().toISOString(),
        description: description || undefined
      };

      onUpload(newFile);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Upload Document</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Patient Selection with Search */}
          <div ref={patientDropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Patient *
            </label>
            
            {/* Selected Patient Display or Search Input */}
            {selectedPatient && selectedPatientObj ? (
              <div className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {selectedPatientObj.firstName} {selectedPatientObj.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedPatientObj.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient('');
                    setPatientSearchQuery('');
                  }}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Search by name, phone, or email..."
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>

                {/* Dropdown List */}
                {showPatientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No patients found
                      </div>
                    ) : (
                      filteredPatients.map(patient => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient.id)}
                          className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
                        >
                          <p className="font-medium text-foreground">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-xs text-muted-foreground">{patient.phone}</p>
                            <p className="text-xs text-muted-foreground">{patient.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Document Type *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="medical_certificate">Medical Certificate</option>
              <option value="lab_result">Lab Result</option>
              <option value="prescription">Prescription</option>
              <option value="report">Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Add any notes about this document..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload File *
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : 'Drag and drop your file here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: PDF, Images (JPG, PNG), Word Documents (Max 10MB)
                </p>
              </label>
            </div>

            {/* File Preview */}
            {file && (
              <div className="mt-3 space-y-3">
                {/* File Info */}
                <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-secondary" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB - {file.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Preview */}
                {file.type.includes('image/') && (
                  <div className="border border-border rounded-lg p-3 bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 rounded-lg mx-auto object-contain bg-muted/20"
                    />
                  </div>
                )}

                {/* PDF Preview Indicator */}
                {file.type === 'application/pdf' && (
                  <div className="border border-border rounded-lg p-4 bg-card text-center">
                    <File className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">PDF document ready to upload</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !selectedPatient}
              className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-primary-foreground font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUpload;
