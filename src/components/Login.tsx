import React, { useState } from 'react';
import { Heart, LogIn } from 'lucide-react';
import { auditService } from '../lib/services/auditService';
import { supabase } from '../lib/supabase';

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
    <div className="min-h-screen flex">
      {/* Left Side - Logo and Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-middle to-primary-dark p-12 flex-col justify-center items-center relative overflow-hidden">
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
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src="/mho-logo.png" 
              alt="Municipal Health Office Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-foreground  text-center">Welcome Back</h2>
            <p className="text-muted-foreground mb-8 text-center">Sign in to access the system</p>

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('doctor');
                    setError('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'doctor'
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md'
                      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  
                  <div className="text-sm">Doctor</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setError('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'staff'
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md'
                      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                
                  <div className="text-sm">Staff</div>
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login as {selectedRole ? (selectedRole === 'doctor' ? 'Doctor' : 'Staff') : 'User'}
            </button>
          </form>

          
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Municipal Health Office - Dupax Del Sur</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
