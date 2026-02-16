import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  BarChart3, 
  Settings,
  Monitor,
  Heart,
  FileText,
  UserCircle,
  UserCog,
  Menu,
  X
} from 'lucide-react';
import { useTranslation } from '../lib/translations';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onNavigate?: () => void;
  userRole?: 'doctor' | 'staff';
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, userRole, userName }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(userName || 'User');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch full name from staff_users table
  useEffect(() => {
    const fetchFullName = async () => {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setDisplayName(userName || 'User');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('full_name')
          .eq('email', userEmail.toLowerCase())
          .single();

        if (!error && data) {
          setDisplayName(data.full_name);
        } else {
          setDisplayName(userName || 'User');
        }
      } catch (err) {
        console.log('Could not fetch user name from staff_users, using default');
        setDisplayName(userName || 'User');
      }
    };

    fetchFullName();
  }, [userName]);
  
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.dashboard, roles: ['doctor', 'staff'] },
    { to: '/patients', icon: Users, label: t.patientProfiles, roles: ['doctor', 'staff'] },
    { to: '/queue', icon: Clock, label: t.queueManagement, roles: ['doctor', 'staff'] },
    { to: '/analytics', icon: BarChart3, label: t.analytics, roles: ['doctor', 'staff'] },
    { to: '/files', icon: FileText, label: t.fileManagement, roles: ['doctor', 'staff'] },
    { to: '/queue-display', icon: Monitor, label: t.queueDisplay, roles: ['doctor', 'staff'] },
    { to: '/staff', icon: UserCog, label: t.staffManagement, roles: ['doctor'] }, // Only doctors can access staff management
    { to: '/settings', icon: Settings, label: t.settings, roles: ['doctor', 'staff'] } // Settings accessible to both doctor and staff
  ].filter(item => !userRole || item.roles.includes(userRole));

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    onNavigate?.();
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="w-full bg-card border-b border-border">
        <div className="px-4 lg:px-6">
          <div className="flex items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 flex-shrink-0 w-64">
              <img 
                src="/mho-logo.png" 
                alt="Municipal Health Office Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">HealthQueue</h1>
                <p className="text-xs text-muted-foreground">
                  <abbr title="Municipal Health Office">MHO</abbr> - <abbr title="Dupax Del Sur Nueva Vizcaya">DDSNV</abbr>
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Icon Only - Centered */}
            <div className="hidden lg:flex items-center justify-center gap-1 flex-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                </NavLink>
              ))}
            </div>

            {/* User Info */}
            <div className="flex items-center justify-end gap-3 w-64">
              {/* User Badge - Desktop */}
              {userRole && (
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary/30">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <UserCircle className={`w-5 h-5 ${
                      userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground whitespace-nowrap">
                      {userRole === 'doctor' ? 'Dr. ' : ''}{displayName}
                    </p>
                    <span className={`text-xs ${
                      userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {userRole === 'doctor' ? 'Doctor' : 'Staff'}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <div className="px-4 py-3 space-y-1">
              {/* User Info - Mobile */}
              {userRole && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-secondary/30">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <UserCircle className={`w-6 h-6 ${
                      userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {userRole === 'doctor' ? 'Dr. ' : ''}{displayName}
                    </p>
                    <span className={`text-xs ${
                      userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {userRole === 'doctor' ? 'Doctor' : 'Staff'}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Sidebar;