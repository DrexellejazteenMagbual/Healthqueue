import React, { useRef, useState, useEffect } from 'react';
import { X, Mail, UserCircle, Briefcase, LogOut, Settings, Shield, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: 'doctor' | 'staff';
  userEmail: string;
  onLogout: () => void;
  onSettings: () => void;
  onProfilePictureUpdate?: (url: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userRole,
  userEmail,
  onLogout,
  onSettings,
  onProfilePictureUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile picture on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchProfilePicture = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('id, profile_picture')
          .eq('email', userEmail.toLowerCase())
          .single();

        if (!error && data) {
          setUserId(data.id);
          setProfilePicture(data.profile_picture);
        }
      } catch (err) {
        console.error('Error fetching profile picture:', err);
      }
    };

    fetchProfilePicture();
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Read and compress the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 800x800)
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;
          
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

          // Update database with base64 string
          const { error: updateError } = await supabase
            .from('staff_users')
            .update({ profile_picture: compressedBase64 })
            .eq('id', userId);

          if (updateError) throw updateError;

          setProfilePicture(compressedBase64);
          onProfilePictureUpdate?.(compressedBase64);
          setIsUploading(false);
          alert('Profile picture updated successfully!');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Invisible overlay for click-outside detection */}
      <div 
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />

      {/* Modal with slide-down animation */}
      <div className="fixed top-20 right-4 w-80 bg-card rounded-lg shadow-xl border border-border z-[9999] animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close profile modal"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 space-y-4">
          {/* User Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
                userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className={`w-12 h-12 ${
                    userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                )}
              </div>
              {/* Change Profile Picture Button */}
              <button
                onClick={handleProfilePictureClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Change profile picture"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload profile picture"
              />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-foreground">
                {userRole === 'doctor' ? 'Dr. ' : ''}{userName}
              </h3>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Shield className={`w-3 h-3 ${
                  userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <span className={`text-xs font-medium ${
                  userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {userRole === 'doctor' ? 'Doctor' : 'Staff'}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Mail className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-0.5">Email</p>
                <p className="text-xs text-foreground break-all">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-0.5">Role</p>
                <p className="text-xs text-foreground">
                  {userRole === 'doctor' ? 'Medical Doctor' : 'Healthcare Staff'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t border-border">
            <button
              onClick={() => {
                onSettings();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-xs">Account Settings</span>
            </button>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileModal;
