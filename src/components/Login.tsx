import React, { useState } from 'react';
import { Heart, LogIn } from 'lucide-react';
import { auditService } from '../lib/services/auditService';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: (role: 'doctor' | 'staff', email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'staff' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      // Query staff_users table to validate credentials
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !data) {
        setError('Invalid email or password');
        await auditService.logAuth(email, selectedRole, 'login', false);
        return;
      }

      // Check if account is active
      if (!data.is_active) {
        setError('This account has been deactivated. Please contact an administrator.');
        await auditService.logAuth(email, selectedRole, 'login', false);
        return;
      }

      // Verify password (decode base64 and compare)
      const storedPassword = atob(data.password_hash);
      if (storedPassword !== password) {
        setError('Invalid email or password');
        await auditService.logAuth(email, selectedRole, 'login', false);
        return;
      }

      // Verify role matches
      if (data.role !== selectedRole) {
        setError(`You are not registered as a ${selectedRole}. You are a ${data.role}.`);
        await auditService.logAuth(email, selectedRole, 'login', false);
        return;
      }

      // Update last_login timestamp
      await supabase
        .from('staff_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      // Log successful login
      await auditService.logAuth(email, selectedRole, 'login', true);

      // Login successful
      onLogin(selectedRole, email);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      await auditService.logAuth(email, selectedRole, 'login', false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Logo and Branding */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/90 p-12 flex-col justify-center items-center relative overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/mho-logo.png" 
              alt="Municipal Health Office Logo" 
              className="w-64 h-64 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">HealthQueue</h1>
          <p className="text-xl text-white/90 mb-2">Municipal Health Office</p>
          <p className="text-lg text-white/80">Dupax Del Sur, Nueva Vizcaya</p>
          <div className="mt-8 h-1 w-32 bg-white/50 mx-auto rounded-full"></div>
          <p className="mt-6 text-white/70 max-w-md mx-auto">
            Modern patient queue management system for efficient healthcare delivery
          </p>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-gray-50"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden flex justify-center mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <img 
              src="/mho-logo.png" 
              alt="Municipal Health Office Logo" 
              className="w-24 h-24 object-contain"
            />
          </motion.div>

          {/* Form Card */}
          <motion.div 
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8 text-center text-sm">Sign in to access the system</p>

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => {
                    setSelectedRole('doctor');
                    setError('');
                  }}
                  className={`p-4 rounded-md border transition-all ${
                    selectedRole === 'doctor'
                      ? 'border-primary bg-blue-50 text-primary font-semibold shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  
                  <div className="text-sm">Doctor</div>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setError('');
                  }}
                  className={`p-4 rounded-md border transition-all ${
                    selectedRole === 'staff'
                      ? 'border-primary bg-blue-50 text-primary font-semibold shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                
                  <div className="text-sm">Staff</div>
                </motion.button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <LogIn className="w-5 h-5" />
              Login as {selectedRole ? (selectedRole === 'doctor' ? 'Doctor' : 'Staff') : 'User'}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>© 2026 Municipal Health Office - Dupax Del Sur</p>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
