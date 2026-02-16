import React, { useState } from 'react';
import { PatientFile, Patient } from '../types';
import { Upload, Download, Trash2, File, Calendar, FileText, Folder, ChevronDown, ChevronRight, ArrowUpDown, Eye, X, Shield } from 'lucide-react';
import FileUpload from './FileUpload';
import { getPermissions } from '../lib/permissions';
import { auditService } from '../lib/services/auditService';
import { useTranslation } from '../lib/translations';

interface FileManagementProps {
  patients: Patient[];
  userRole: 'doctor' | 'staff';
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

// Define sensitive file types that require special permissions
const SENSITIVE_FILE_TYPES = ['lab_result', 'medical_certificate', 'report'];

const FileManagement: React.FC<FileManagementProps> = ({ patients, userRole }) => {
  const { t } = useTranslation();
  const permissions = getPermissions(userRole);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['medical_certificate', 'lab_result', 'prescription', 'report', 'other']));
  const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);

  // Toggle folder expansion
  const toggleFolder = (folderType: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderType)) {
        newSet.delete(folderType);
      } else {
        newSet.add(folderType);
      }
      return newSet;
    });
  };

  // Filter and sort files
  const filteredFiles = files.filter(file => {
    const matchesPatient = !selectedPatient || file.patientId === selectedPatient;
    const matchesDocType = selectedDocType === 'all' || file.documentType === selectedDocType;
    const matchesSearch = !searchQuery || 
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patients.find(p => p.id === file.patientId)?.firstName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPatient && matchesDocType && matchesSearch;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      case 'date-asc':
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      case 'name-asc':
        return a.fileName.localeCompare(b.fileName);
      case 'name-desc':
        return b.fileName.localeCompare(a.fileName);
      case 'size-desc':
        return b.fileSize - a.fileSize;
      case 'size-asc':
        return a.fileSize - b.fileSize;
      default:
        return 0;
    }
  });

  // Filter out sensitive files for staff users
  const filesForDisplay = sortedFiles.filter(file => {
    if (!permissions.canViewSensitiveFiles) {
      return !SENSITIVE_FILE_TYPES.includes(file.documentType);
    }
    return true;
  });

  // Helper to check if a file is sensitive
  const isSensitiveFile = (documentType: string) => {
    return SENSITIVE_FILE_TYPES.includes(documentType);
  };

  // Group files by document type
  const filesByType = filesForDisplay.reduce((acc, file) => {
    if (!acc[file.documentType]) {
      acc[file.documentType] = [];
    }
    acc[file.documentType].push(file);
    return acc;
  }, {} as Record<string, PatientFile[]>);

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'medical_certificate': 'Medical Certificate',
      'lab_result': 'Lab Result',
      'prescription': 'Prescription',
      'report': 'Report',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'medical_certificate': 'bg-blue-100 text-blue-700',
      'lab_result': 'bg-green-100 text-green-700',
      'prescription': 'bg-purple-100 text-purple-700',
      'report': 'bg-orange-100 text-orange-700',
      'other': 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getDocumentTypeFolderColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'medical_certificate': 'text-blue-500',
      'lab_result': 'text-green-500',
      'prescription': 'text-purple-500',
      'report': 'text-orange-500',
      'other': 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  };

  const handleFileUpload = async (newFile: PatientFile) => {
    const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
    const patient = patients.find(p => p.id === newFile.patientId);
    
    // Log file upload
    await auditService.logDataModification(
      userEmail,
      userRole,
      'file',
      newFile.id,
      'create',
      {
        after: {
          fileName: newFile.fileName,
          documentType: newFile.documentType,
          patientId: newFile.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
          fileSize: newFile.fileSize,
          isSensitive: SENSITIVE_FILE_TYPES.includes(newFile.documentType)
        }
      }
    );
    
    setFiles(prev => [...prev, newFile]);
    setShowUploadModal(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
    const file = files.find(f => f.id === fileId);
    const patient = file ? patients.find(p => p.id === file.patientId) : null;
    
    if (file) {
      // Log file deletion
      await auditService.logDataModification(
        userEmail,
        userRole,
        'file',
        fileId,
        'delete',
        {
          before: {
            fileName: file.fileName,
            documentType: file.documentType,
            patientId: file.patientId,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
            isSensitive: SENSITIVE_FILE_TYPES.includes(file.documentType)
          }
        }
      );
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // TODO: Call fileService.deleteFile(fileId) when service is ready
  };

  const handlePreviewFile = async (file: PatientFile) => {
    const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
    const patient = patients.find(p => p.id === file.patientId);
    
    // Log file preview/access
    await auditService.logDataAccess(
      userEmail,
      userRole,
      'file',
      file.id,
      'preview',
      true
    );
    
    setPreviewFile(file);
  };

  const handleDownloadFile = async (file: PatientFile) => {
    const userEmail = localStorage.getItem('userName') || 'unknown@clinic.com';
    const patient = patients.find(p => p.id === file.patientId);
    
    // Log file download/access
    await auditService.logDataAccess(
      userEmail,
      userRole,
      'file',
      file.id,
      'download',
      true
    );
    
    // TODO: Implement file download logic
    console.log('Download file:', file.fileUrl);
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = file.fileUrl;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImageFile = (fileType: string) => {
    return fileType.includes('image/');
  };

  const isPDFFile = (fileType: string) => {
    return fileType === 'application/pdf';
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.fileManagementTitle}</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage patient medical documents and records</p>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 w-full md:w-auto"
      >
        <Upload className="w-5 h-5" />
        {t.uploadFile}
      </button>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Patient Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Filter by Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Patients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Filter by Type</label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="medical_certificate">Medical Certificate</option>
            <option value="lab_result">Lab Result</option>
            <option value="prescription">Prescription</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="size-desc">Size (Largest First)</option>
            <option value="size-asc">Size (Smallest First)</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or filename..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Files Organized by Folders */}
      <div className="space-y-4">
        {filesForDisplay.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No files found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render folders for each document type */}
            {['medical_certificate', 'lab_result', 'prescription', 'report', 'other'].map(docType => {
              const filesInFolder = filesByType[docType] || [];
              const isExpanded = expandedFolders.has(docType);

              // Only show folder if it has files or if type filter is active
              if (filesInFolder.length === 0 && selectedDocType === 'all') return null;

              return (
                <div key={docType} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Folder Header */}
                  <button
                    onClick={() => toggleFolder(docType)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <Folder className={`w-6 h-6 ${getDocumentTypeFolderColor(docType)}`} />
                      <div>
                        <h3 className="font-semibold text-foreground">{getDocumentTypeLabel(docType)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {filesInFolder.length} {filesInFolder.length === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(docType)}`}>
                      {filesInFolder.length}
                    </span>
                  </button>

                  {/* Folder Contents */}
                  {isExpanded && filesInFolder.length > 0 && (
                    <div className="border-t border-border">
                      {filesInFolder.map(file => {
                        const patient = patients.find(p => p.id === file.patientId);
                        return (
                          <div
                            key={file.id}
                            className="p-4 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  {/* Thumbnail or Icon */}
                                  {isImageFile(file.fileType) ? (
                                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden border border-border">
                                      <img
                                        src={file.fileUrl}
                                        alt={file.fileName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <File className="w-5 h-5 text-primary flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground truncate">{file.fileName}</h4>
                                      {isSensitiveFile(file.documentType) && permissions.canViewSensitiveFiles && (
                                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 flex-shrink-0">
                                          <Shield className="w-3 h-3" />
                                          Sensitive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Patient: {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
                                    </p>
                                    {file.description && (
                                      <p className="text-xs text-muted-foreground mt-1 italic">{file.description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex flex-col md:flex-row md:items-center gap-2">
                                {/* Date */}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </div>

                                {/* Size */}
                                <span className="text-xs text-muted-foreground">
                                  {(file.fileSize / 1024).toFixed(1)} KB
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 md:gap-1">
                                <button
                                  onClick={() => handlePreviewFile(file)}
                                  className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="md:hidden">View</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="flex-1 md:flex-none bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="md:hidden">Download</span>
                                </button>
                                {userRole === 'doctor' && (
                                  <button
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="flex-1 md:flex-none bg-destructive hover:bg-destructive/80 text-destructive-foreground px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="md:hidden">Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty folder message */}
                  {isExpanded && filesInFolder.length === 0 && (
                    <div className="p-6 text-center border-t border-border">
                      <p className="text-sm text-muted-foreground">No files in this folder</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-5xl max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-foreground truncate">{previewFile.fileName}</h2>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{getDocumentTypeLabel(previewFile.documentType)}</span>
                  <span>•</span>
                  <span>{(previewFile.fileSize / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{new Date(previewFile.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="ml-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-muted/20">
              {isImageFile(previewFile.fileType) ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={previewFile.fileUrl}
                    alt={previewFile.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : isPDFFile(previewFile.fileType) ? (
                <iframe
                  src={previewFile.fileUrl}
                  className="w-full h-full min-h-[600px] rounded-lg shadow-lg bg-white"
                  title={previewFile.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <File className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium mb-2">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This file type cannot be previewed in the browser
                  </p>
                  <button
                    onClick={() => handleDownloadFile(previewFile)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-card">
              {previewFile.description && (
                <p className="text-sm text-muted-foreground italic flex-1">
                  {previewFile.description}
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => handleDownloadFile(previewFile)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                {userRole === 'doctor' && (
                  <button
                    onClick={() => {
                      handleDeleteFile(previewFile.id);
                      setPreviewFile(null);
                    }}
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUpload
          patients={patients}
          onUpload={handleFileUpload}
          onCancel={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
};

export default FileManagement;
