import React, { useState, useEffect } from 'react';
import { UserPlus, Users as UsersIcon, Shield, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/translations';
import Toast from './Toast';

/*
  IMPORTANT: Before using this component, create the staff_users table in Supabase:

  -- Run this SQL in Supabase SQL Editor:
  CREATE TABLE IF NOT EXISTS staff_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'staff')),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
  );

  CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
  CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
*/

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'staff';
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

interface StaffManagementProps {
  userRole?: 'doctor' | 'staff';
}

const StaffManagement: React.FC<StaffManagementProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'staff' as 'doctor' | 'staff',
    password: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStaffUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading staff users:', error);
        showToast('Failed to load staff users', 'error');
      } else if (data) {
        setStaffUsers(data);
      }
    } catch (err) {
      console.error('Error:', err);
      showToast('An error occurred while loading staff users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load staff users on mount
  useEffect(() => {
    if (userRole === 'doctor') {
      loadStaffUsers();
    }
  }, [userRole]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.fullName || !formData.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      // Simple password hashing (in production, use proper bcrypt on backend)
      const passwordHash = btoa(formData.password); // Base64 encoding (NOT secure for production!)

      const { data, error } = await supabase
        .from('staff_users')
        .insert([
          {
            email: formData.email.toLowerCase(),
            full_name: formData.fullName,
            role: formData.role,
            password_hash: passwordHash,
            is_active: true
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') {
          showToast('This email is already registered', 'error');
        } else {
          console.error('Error adding staff:', error);
          showToast('Failed to add staff member', 'error');
        }
      } else {
        showToast('Staff member added successfully', 'success');
        setFormData({ email: '', fullName: '', role: 'staff', password: '' });
        setShowAddForm(false);
        loadStaffUsers();
      }
    } catch (err) {
      console.error('Error:', err);
      showToast('An error occurred', 'error');
    }
  };

  const handleDeleteStaff = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete the account for ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting staff:', error);
        showToast('Failed to delete staff member', 'error');
      } else {
        showToast('Staff member deleted successfully', 'success');
        loadStaffUsers();
      }
    } catch (err) {
      console.error('Error:', err);
      showToast('An error occurred', 'error');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_users')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating staff status:', error);
        showToast('Failed to update status', 'error');
      } else {
        showToast('Status updated successfully', 'success');
        loadStaffUsers();
      }
    } catch (err) {
      console.error('Error:', err);
      showToast('An error occurred', 'error');
    }
  };

  // Check if user has access (doctor-only)
  if (userRole !== 'doctor') {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">{t.accessRestricted}</h2>
          <p className="text-muted-foreground">Only doctors can access staff management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.staffManagement}</h1>
          <p className="text-muted-foreground mt-1">{t.staffManagementDescription}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {t.addStaff}
        </button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">{t.addNewStaff}</h2>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t.fullName} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t.email} <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  placeholder="example@clinic.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t.password} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground pr-10"
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t.role} <span className="text-destructive">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ email: '', fullName: '', role: 'staff', password: '' });
                }}
                className="px-4 py-2 border border-input rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t.addStaff}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {t.staffAccounts} ({staffUsers.length})
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t.loading}...</div>
        ) : staffUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t.noStaffAccounts}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.fullName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.role}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.createdDate}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'doctor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role === 'doctor' ? 'Doctor' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStaff(user.id, user.email)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default StaffManagement;
