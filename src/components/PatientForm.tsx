import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types';
import { X, User, Phone, ClipboardList, Camera, Trash2 } from 'lucide-react';

interface PatientFormProps {
  patient?: Patient | null;
  onSubmit: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
    medicalHistory: [] as string[],
    allergies: [] as string[],
    bloodType: '',
    lastVisit: '',
    riskLevel: 'Low' as 'Low' | 'Medium' | 'High',
    profilePicture: ''
  });

  const [medicalHistoryInput, setMedicalHistoryInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'medical'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: User },
    { id: 'contact' as const, label: 'Contact', icon: Phone },
    { id: 'medical' as const, label: 'Medical', icon: ClipboardList },
  ];

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        age: patient.age ? String(patient.age) : '',
        gender: patient.gender,
        address: patient.address,
        phone: patient.phone,
        email: patient.email,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        bloodType: patient.bloodType,
        lastVisit: patient.lastVisit || '',
        riskLevel: patient.riskLevel || 'Low',
        profilePicture: patient.profilePicture || ''
      });
      setMedicalHistoryInput(patient.medicalHistory.join(', '));
      setAllergiesInput(patient.allergies.join(', '));
    }
  }, [patient]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      // Convert to base64 with compression
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions (reduce for faster upload)
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality for JPEG)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, profilePicture: compressedBase64 });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, profilePicture: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const medicalHistory = medicalHistoryInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      const allergies = allergiesInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      await onSubmit({
        ...formData,
        medicalHistory,
        allergies,
        profilePicture: formData.profilePicture
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-muted/50">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-card'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <>
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 ${
                      formData.riskLevel === 'High' ? 'border-red-500' :
                      formData.riskLevel === 'Medium' ? 'border-yellow-500' :
                      formData.riskLevel === 'Low' ? 'border-green-500' :
                      'border-border'
                    }`}>
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {formData.firstName && formData.lastName 
                            ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
                            : '?'}
                        </span>
                      )}
                    </div>
                    {/* Upload/Remove buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                        title="Upload photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {formData.profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Age (years) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter age"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Blood Type
            </label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
              </>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <>
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 ${
                      formData.riskLevel === 'High' ? 'border-red-500' :
                      formData.riskLevel === 'Medium' ? 'border-yellow-500' :
                      formData.riskLevel === 'Low' ? 'border-green-500' :
                      'border-border'
                    }`}>
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {formData.firstName && formData.lastName 
                            ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
                            : '?'}
                        </span>
                      )}
                    </div>
                    {/* Upload/Remove buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                        title="Upload photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {formData.profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Address *
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Name - Phone"
              />
            </div>
          </div>
              </>
            )}

            {/* Medical Tab */}
            {activeTab === 'medical' && (
              <>
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 ${
                      formData.riskLevel === 'High' ? 'border-red-500' :
                      formData.riskLevel === 'Medium' ? 'border-yellow-500' :
                      formData.riskLevel === 'Low' ? 'border-green-500' :
                      'border-border'
                    }`}>
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {formData.firstName && formData.lastName 
                            ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase()
                            : '?'}
                        </span>
                      )}
                    </div>
                    {/* Upload/Remove buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                        title="Upload photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {formData.profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Medical History
            </label>
            <input
              type="text"
              value={medicalHistoryInput}
              onChange={(e) => setMedicalHistoryInput(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Separate conditions with commas (e.g., Hypertension, Diabetes)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Allergies
            </label>
            <input
              type="text"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Separate allergies with commas (e.g., Penicillin, Peanuts)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Risk Level
            </label>
            <select
              value={formData.riskLevel}
              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as 'Low' | 'Medium' | 'High' })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border p-4 md:p-6 flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {patient ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                patient ? 'Update Patient' : 'Add Patient'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
