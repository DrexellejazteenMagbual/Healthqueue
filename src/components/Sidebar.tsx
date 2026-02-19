import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
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
import AccountSettingsModal from './AccountSettingsModal';

interface SidebarProps {
  onNavigate?: () => void;
  userRole?: 'doctor' | 'staff';
  userName?: string;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, userRole, userName, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(userName || 'User');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  
  // Fetch full name and profile picture from staff_users table
  useEffect(() => {
    const fetchUserData = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setDisplayName(userName || 'User');
        setUserEmail('');
        return;
      }

      setUserEmail(email);

      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('full_name, profile_picture')
          .eq('email', email.toLowerCase())
          .single();

        if (!error && data) {
          setDisplayName(data.full_name);
          setProfilePictureUrl(data.profile_picture);
        } else {
          setDisplayName(userName || 'User');
        }
      } catch (err) {
        console.log('Could not fetch user data from staff_users, using default');
        setDisplayName(userName || 'User');
      }
    };

    fetchUserData();
  }, [userName]);

  // Refresh user data when modal closes (to pick up any changes)
  useEffect(() => {
    if (!profileModalOpen) {
      const email = localStorage.getItem('userEmail');
      if (email) {
        supabase
          .from('staff_users')
          .select('full_name, profile_picture')
          .eq('email', email.toLowerCase())
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setDisplayName(data.full_name);
              setProfilePictureUrl(data.profile_picture);
            }
          });
      }
    }
  }, [profileModalOpen]);
  
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.dashboard, roles: ['doctor', 'staff'] },
    { to: '/patients', icon: Users, label: t.patientProfiles, roles: ['doctor', 'staff'] },
    { to: '/queue', icon: Clock, label: t.queueManagement, roles: ['doctor', 'staff'] },
    { to: '/analytics', icon: BarChart3, label: t.analytics, roles: ['doctor', 'staff'] },
    { to: '/files', icon: FileText, label: t.fileManagement, roles: ['doctor', 'staff'] },
    { to: '/queue-display', icon: Monitor, label: t.queueDisplay, roles: ['doctor', 'staff'] },
    { to: '/staff', icon: UserCog, label: t.staffManagement, roles: ['doctor'] }, // Only doctors can access staff management
  ].filter(item => !userRole || item.roles.includes(userRole));

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    onNavigate?.();
  };

  return (
    <>
      {/* Top Bar - Logo and User - Fixed */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white border-b border-gray-200 h-14 z-50 shadow-sm">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/mho-logo.png" 
              alt="Municipal Health Office Logo" 
              className="w-9 h-9 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold text-gray-900">HealthQueue</h1>
              <p className="text-xs text-gray-500">
                <abbr title="Municipal Health Office">MHO</abbr> - <abbr title="Dupax Del Sur Nueva Vizcaya">DDSNV</abbr>
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <NavLink
              to="/settings"
              title={t.settings}
            >
              {({ isActive }) => (
                <div className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                  isActive
                    ? 'text-primary bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
              )}
            </NavLink>
            
            {/* User Badge - Desktop */}
            {userRole && (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="hidden md:flex items-center justify-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                title={`${userRole === 'doctor' ? 'Dr. ' : ''}${displayName}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                  userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {profilePictureUrl ? (
                    <img 
                      src={profilePictureUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className={`w-5 h-5 ${
                      userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  )}
                </div>
              </button>
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

      {/* Side Navigation - Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-20 bg-card border-r border-border z-40">
        <nav className="flex-1 flex flex-col items-center py-4 gap-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NavLink
                to={item.to}
                onClick={handleNavClick}
                title={item.label}
              >
                {({ isActive }) => (
                  <motion.div 
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[9px] mt-1 font-medium text-center leading-tight">{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-card w-64 h-full border-r border-border p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              {/* User Info - Mobile */}
              {userRole && (
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center justify-center p-3 mb-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  title={`${userRole === 'doctor' ? 'Dr. ' : ''}${displayName}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                    userRole === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {profilePictureUrl ? (
                      <img 
                        src={profilePictureUrl} 
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className={`w-6 h-6 ${
                        userRole === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    )}
                  </div>
                </button>
              )}

              {/* Mobile Navigation Links */}
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
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
        </div>
      )}

      {/* Account Settings Modal */}
      {userRole && (
        <AccountSettingsModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          userName={displayName}
          userEmail={userEmail}
          userRole={userRole}
          onLogout={onLogout}
        />
      )}
    </>
  );
};

export default Sidebar;