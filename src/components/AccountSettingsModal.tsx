import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Bell, Mail, Camera, Eye, EyeOff, Save, Loader, CheckCircle, AlertCircle, Shield, UserCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auditService } from '../lib/services/auditService';
import { useTranslation, Language } from '../lib/translations';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole: 'doctor' | 'staff';
  onLogout?: () => void;
}

type TabType = 'profile' | 'security' | 'preferences';

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  onLogout
}) => {
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: userName,
    email: userEmail,
    profilePicture: null as string | null,
    userId: null as string | null
  });
  const [isUploading, setIsUploading] = useState(false);
  
  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Preferences State
  const [preferences, setPreferences] = useState({
    language: language,
    emailNotifications: true,
    queueNotifications: true
  });
  
  // Status
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [preferencesStatus, setPreferencesStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Load user data
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('id, full_name, email, profile_picture')
          .eq('email', userEmail.toLowerCase())
          .single();

        if (!error && data) {
          setProfileData({
            fullName: data.full_name || userName,
            email: data.email,
            profilePicture: data.profile_picture,
            userId: data.id
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [isOpen, userEmail, userName]);

  if (!isOpen) return null;

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileData.userId) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
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
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          const { error: updateError } = await supabase
            .from('staff_users')
            .update({ profile_picture: compressedBase64 })
            .eq('id', profileData.userId);

          if (updateError) throw updateError;

          setProfileData({ ...profileData, profilePicture: compressedBase64 });
          setIsUploading(false);
          
          await auditService.logSettingsChange(
            profileData.email,
            userRole,
            'profile_picture_update',
            {},
            { timestamp: new Date().toISOString() }
          );
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

  const handleProfileUpdate = async () => {
    setProfileStatus('saving');
    setErrorMessage('');
    
    try {
      const { error: updateError } = await supabase
        .from('staff_users')
        .update({
          full_name: profileData.fullName,
          email: profileData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.userId);

      if (updateError) throw updateError;

      localStorage.setItem('userName', profileData.fullName);
      localStorage.setItem('userEmail', profileData.email);

      await auditService.logSettingsChange(
        profileData.email,
        userRole,
        'profile_update',
        { email: userEmail, name: userName },
        { email: profileData.email, name: profileData.fullName }
      );

      setProfileStatus('saved');
      setTimeout(() => setProfileStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message || 'Failed to update profile');
      setProfileStatus('error');
      setTimeout(() => setProfileStatus('idle'), 3000);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordStatus('saving');
    setErrorMessage('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('All password fields are required');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        setErrorMessage('Current password is incorrect');
        setPasswordStatus('error');
        setTimeout(() => setPasswordStatus('idle'), 3000);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      await supabase
        .from('staff_users')
        .update({
          password_hash: btoa(passwordData.newPassword),
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.userId);

      await auditService.logSettingsChange(
        profileData.email,
        userRole,
        'password_change',
        {},
        { timestamp: new Date().toISOString() }
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setPasswordStatus('saved');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setErrorMessage(error.message || 'Failed to update password');
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    }
  };

  const handlePreferencesUpdate = async () => {
    setPreferencesStatus('saving');
    
    try {
      // Update language
      if (preferences.language !== language) {
        setLanguage(preferences.language);
      }

      await auditService.logSettingsChange(
        profileData.email,
        userRole,
        'preferences_update',
        { language, notifications: { email: true, queue: true } },
        { language: preferences.language, notifications: { email: preferences.emailNotifications, queue: preferences.queueNotifications } }
      );

      setPreferencesStatus('saved');
      setTimeout(() => setPreferencesStatus('idle'), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setPreferencesStatus('error');
      setTimeout(() => setPreferencesStatus('idle'), 3000);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Bell className="w-4 h-4" /> }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ${
                          userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {profileData.profilePicture ? (
                            <img 
                              src={profileData.profilePicture} 
                              alt={profileData.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircle className={`w-16 h-16 ${
                              userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          )}
                        </div>
                        <button
                          onClick={handleProfilePictureClick}
                          disabled={isUploading}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Change profile picture"
                        >
                          {isUploading ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {userRole === 'doctor' ? 'Dr. ' : ''}{profileData.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className={`w-4 h-4 ${
                            userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <span className={`text-sm ${
                            userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {userRole === 'doctor' ? 'Doctor' : 'Staff'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Click the camera icon to update your profile picture</p>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="your.email@clinic.com"
                      />
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
                      <input
                        type="text"
                        value={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact an administrator to change your role</p>
                    </div>

                    {errorMessage && profileStatus === 'error' && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800">{errorMessage}</p>
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={handleProfileUpdate}
                      disabled={profileStatus === 'saving'}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium shadow-sm ${
                        profileStatus === 'saved'
                          ? 'bg-green-600 text-white'
                          : profileStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {profileStatus === 'saving' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Updating Profile...
                        </>
                      ) : profileStatus === 'saved' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Profile Updated!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Profile Changes
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Change Your Password</h3>
                      <p className="text-xs text-blue-800">
                        Use a strong password with at least 6 characters. Include letters, numbers, and symbols for better security.
                      </p>
                    </div>

                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {errorMessage && passwordStatus === 'error' && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800">{errorMessage}</p>
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={passwordStatus === 'saving'}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium shadow-sm ${
                        passwordStatus === 'saved'
                          ? 'bg-green-600 text-white'
                          : passwordStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {passwordStatus === 'saving' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : passwordStatus === 'saved' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Password Changed!
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Change Password
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">Language</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPreferences({ ...preferences, language: 'en' })}
                          className={`flex-1 px-4 py-3 rounded-md border transition-all text-sm font-medium ${
                            preferences.language === 'en'
                              ? 'border-primary bg-blue-50 text-primary shadow-sm'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50'
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, language: 'tl' })}
                          className={`flex-1 px-4 py-3 rounded-md border transition-all text-sm font-medium ${
                            preferences.language === 'tl'
                              ? 'border-primary bg-blue-50 text-primary shadow-sm'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50'
                          }`}
                        >
                          Tagalog
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Changes will take effect after saving</p>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <div>
                          <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                          <p className="text-xs text-gray-500 mt-0.5">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <div>
                          <label className="text-sm font-medium text-gray-900">Queue Notifications</label>
                          <p className="text-xs text-gray-500 mt-0.5">Get alerts about queue updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.queueNotifications}
                            onChange={(e) => setPreferences({ ...preferences, queueNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={preferencesStatus === 'saving'}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium shadow-sm ${
                        preferencesStatus === 'saved'
                          ? 'bg-green-600 text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {preferencesStatus === 'saving' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving Preferences...
                        </>
                      ) : preferencesStatus === 'saved' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Preferences Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
              
              {/* Footer with Logout Button */}
              {onLogout && (
                <div className="border-t border-gray-200 p-6">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to logout?')) {
                        onLogout();
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all text-sm font-medium border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountSettingsModal;
