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
  LogOut,
  UserCircle,
  Shield,
  UserCog
} from 'lucide-react';
import { useTranslation } from '../lib/translations';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onNavigate?: () => void;
  userRole?: 'doctor' | 'staff';
  userName?: string;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, userRole, userName, onLogout }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(userName || 'User');
  
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
    { to: '/audit-logs', icon: Shield, label: t.auditLogs, roles: ['doctor'] }, // Only doctors can access audit logs
    { to: '/staff', icon: UserCog, label: t.staffManagement, roles: ['doctor'] }, // Only doctors can access staff management
    { to: '/settings', icon: Settings, label: t.settings, roles: ['doctor'] } // Only doctors can access settings
  ].filter(item => !userRole || item.roles.includes(userRole));

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen overflow-y-auto ">
      <div className="p-6 border-b border-border sticky top-0 bg-primary hidden md:block">
        <div className="flex items-center gap-3">
          <img 
            src="/mho-logo.png" 
            alt="Municipal Health Office Logo" 
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate text-white">HealthQueue</h1>
            <p className="text-xs text-white truncate"> <abbr title="Municipal Health Office">MHO</abbr></p>
            <p className="text-xs text-white truncate"> <abbr title="Dupax Del Sur Nueva Vizcaya">DDSNV</abbr></p>
          </div>
        </div>
      </div>

      {/* Role Badge Section */}
      {userRole && (
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <UserCircle className={`w-6 h-6 ${
                userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userRole === 'doctor' ? 'Dr. ' : ''}{displayName}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                userRole === 'doctor' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {userRole === 'doctor' ? 'Doctor' : 'Staff'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm md:text-base ">{t.logout}</span>
        </button>
      </div>    </div>
  );
};

export default Sidebar;