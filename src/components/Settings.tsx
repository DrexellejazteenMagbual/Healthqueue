import React, { useState, useEffect } from 'react';
import { Save, Bell, Monitor, Users, Shield, AlertCircle, Globe, Database, Download, Upload, Loader, CheckCircle, LogOut } from 'lucide-react';
import { getPermissions } from '../lib/permissions';
import { auditService } from '../lib/services/auditService';
import { useTranslation, Language } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { settingsManager, AppSettings } from '../lib/settingsManager';

interface SettingsProps {
  userRole: 'doctor' | 'staff';
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userRole, onLogout }) => {
  const permissions = getPermissions(userRole);
  const { language, setLanguage, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  useEffect(() => {
    const handleLanguageChange = () => {
      window.location.reload();
    };
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);
  
  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    setLanguage(lang);
  };
  
  const [initialSettings, setInitialSettings] = useState<AppSettings>(settingsManager.getDefaults());
  const [settings, setSettings] = useState<AppSettings>(settingsManager.load());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = settingsManager.load();
    setSettings(loadedSettings);
    setInitialSettings(JSON.parse(JSON.stringify(loadedSettings))); // Deep copy for comparison
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('userName') || 'unknown@clinic.com';
    
    try {
      // Save to localStorage
      settingsManager.save(settings);
      
      // Log settings change
      await auditService.logSettingsChange(
        userEmail,
        userRole,
        'system_settings',
        initialSettings,
        settings
      );
      
      // Update initial settings for comparison
      setInitialSettings(JSON.parse(JSON.stringify(settings)));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
      setSaveStatus('idle');
    }
  };

  const handleDatabaseBackup = async () => {
    setIsBackingUp(true);
    const userEmail = localStorage.getItem('userEmail') || 'unknown@clinic.com';
    
    try {
      // Fetch all data from all tables
      const tables = [
        'patients',
        'queue',
        'analytics',
        'illness_tracking',
        'patient_files',
        'audit_logs',
        'staff_users'
      ];

      const backup: any = {
        backup_date: new Date().toISOString(),
        backup_by: userEmail,
        version: '1.0',
        data: {}
      };

      // Fetch data from each table
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          backup.data[table] = [];
        } else {
          backup.data[table] = data || [];
        }
      }

      // Create backup file
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthqueue_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log backup action
      await auditService.logSettingsChange(
        userEmail,
        userRole,
        'database_backup',
        {},
        { backup_date: backup.backup_date, tables: tables.length }
      );

      alert('Database backup completed successfully!');
    } catch (err) {
      console.error('Backup error:', err);
      alert('Failed to create database backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDatabaseRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON backup file.');
      return;
    }

    // Confirm restore action
    if (!window.confirm(
      '⚠️ WARNING: This will overwrite all existing data!\n\n' +
      'All current patient records, queue data, and settings will be replaced with the backup data.\n\n' +
      'Are you absolutely sure you want to continue?'
    )) {
      event.target.value = ''; // Reset file input
      return;
    }

    setIsRestoring(true);
    const userEmail = localStorage.getItem('userEmail') || 'unknown@clinic.com';

    try {
      // Read and parse backup file
      const fileContent = await file.text();
      const backup = JSON.parse(fileContent);

      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      const tables = [
        'patients',
        'queue',
        'analytics',
        'illness_tracking',
        'patient_files',
        'audit_logs',
        'staff_users'
      ];

      let restoredCount = 0;
      const errors: string[] = [];

      // Restore each table
      for (const table of tables) {
        const tableData = backup.data[table];
        if (!tableData || tableData.length === 0) {
          console.log(`Skipping empty table: ${table}`);
          continue;
        }

        try {
          // Delete existing data (except current user from staff_users)
          if (table === 'staff_users') {
            // Keep current user's account
            const { error: deleteError } = await supabase
              .from(table)
              .delete()
              .neq('email', userEmail);
            
            if (deleteError) {
              console.error(`Error clearing ${table}:`, deleteError);
            }
          } else {
            const { error: deleteError } = await supabase
              .from(table)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
            
            if (deleteError) {
              console.error(`Error clearing ${table}:`, deleteError);
            }
          }

          // Insert backup data
          const { error: insertError } = await supabase
            .from(table)
            .insert(tableData);

          if (insertError) {
            console.error(`Error restoring ${table}:`, insertError);
            errors.push(`${table}: ${insertError.message}`);
          } else {
            restoredCount++;
            console.log(`Restored ${tableData.length} rows to ${table}`);
          }
        } catch (tableError) {
          console.error(`Error processing ${table}:`, tableError);
          errors.push(`${table}: Processing error`);
        }
      }

      // Log restore action
      await auditService.logSettingsChange(
        userEmail,
        userRole,
        'database_restore',
        { backup_file: file.name },
        { 
          restored_tables: restoredCount,
          backup_date: backup.backup_date,
          original_backup_by: backup.backup_by
        }
      );

      if (errors.length > 0) {
        alert(
          `Database restore completed with errors:\n\n` +
          `Successfully restored: ${restoredCount} tables\n` +
          `Errors: ${errors.length}\n\n` +
          `${errors.join('\n')}\n\n` +
          `Please refresh the page.`
        );
      } else {
        alert(
          `✅ Database restore completed successfully!\n\n` +
          `Restored ${restoredCount} tables from backup.\n\n` +
          `The page will now reload to reflect the restored data.`
        );
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error('Restore error:', err);
      alert(
        '❌ Failed to restore database backup.\n\n' +
        (err instanceof Error ? err.message : 'Unknown error') +
        '\n\nPlease ensure you selected a valid backup file.'
      );
    } finally {
      setIsRestoring(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-foreground">{t.settingsTitle}</h1>
          <p className="text-muted-foreground">{t.settingsDescription}</p>
        </div>
        {permissions.canConfigureSystem && (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t.saveChanges}
              </>
            )}
          </button>
        )}
      </div>

      {!permissions.canConfigureSystem && (
        <div className="space-y-6">
          {/* Staff Language Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t.language}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    currentLanguage === 'en'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t.english}
                </button>
                <button
                  onClick={() => handleLanguageChange('tl')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    currentLanguage === 'tl'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t.tagalog}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Select your preferred language for the interface. Changes will take effect after page reload.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Staff Settings</h3>
                <p className="text-sm text-blue-800 mb-3">
                  As a staff member, you can change your language preference here.
                </p>
                <p className="text-sm text-blue-800">
                  Advanced system settings are only accessible to doctors and administrators. If you need assistance, please contact your supervisor.
                </p>
              </div>
            </div>
          </div>

          {/* Logout Section - Staff */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Logout</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account. You will need to log in again to access the system.
            </p>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              {t.logout}
            </button>
          </div>
        </div>
      )}

      {permissions.canConfigureSystem && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Queue Updates</label>
              <input
                type="checkbox"
                checked={settings.notifications.queueUpdates}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, queueUpdates: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">New Patients</label>
              <input
                type="checkbox"
                checked={settings.notifications.newPatients}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, newPatients: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">System Alerts</label>
              <input
                type="checkbox"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, systemAlerts: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Display Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Auto Refresh</label>
              <input
                type="checkbox"
                checked={settings.display.autoRefresh}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, autoRefresh: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.display.refreshInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, refreshInterval: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Display Items
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={settings.display.maxDisplayItems}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, maxDisplayItems: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                {t.language}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    currentLanguage === 'en'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t.english}
                </button>
                <button
                  onClick={() => handleLanguageChange('tl')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    currentLanguage === 'tl'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t.tagalog}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Management */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Queue Management</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Priority for Senior Citizens</label>
              <input
                type="checkbox"
                checked={settings.queue.priorityForSeniors}
                onChange={(e) => setSettings({
                  ...settings,
                  queue: { ...settings.queue, priorityForSeniors: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Priority for PWDs</label>
              <input
                type="checkbox"
                checked={settings.queue.priorityForPWD}
                onChange={(e) => setSettings({
                  ...settings,
                  queue: { ...settings.queue, priorityForPWD: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Priority for Pregnant Women</label>
              <input
                type="checkbox"
                checked={settings.queue.priorityForPregnant}
                onChange={(e) => setSettings({
                  ...settings,
                  queue: { ...settings.queue, priorityForPregnant: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Auto Advance Queue</label>
              <input
                type="checkbox"
                checked={settings.queue.autoAdvance}
                onChange={(e) => setSettings({
                  ...settings,
                  queue: { ...settings.queue, autoAdvance: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">System Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Backup Frequency
              </label>
              <select
                value={settings.system.backupFrequency}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, backupFrequency: e.target.value as 'hourly' | 'daily' | 'weekly' }
                })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="30"
                max="3650"
                value={settings.system.dataRetention}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, dataRetention: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Enable Audit Log</label>
              <input
                type="checkbox"
                checked={settings.system.auditLog}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, auditLog: e.target.checked }
                })}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Database Backup */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Database Backup & Restore</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Backup Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Download className="w-4 h-4" />
                Backup Database
              </h4>
              <p className="text-sm text-muted-foreground">
                Create a complete backup of all system data. The backup will be downloaded as a JSON file.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-blue-900 mb-2">Backup includes:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Patient records
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Queue & Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Files & Audit logs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Staff accounts
                  </li>
                </ul>
              </div>
              <button
                onClick={handleDatabaseBackup}
                disabled={isBackingUp || isRestoring}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full justify-center"
              >
                {isBackingUp ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating backup...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Backup
                  </>
                )}
              </button>
            </div>

            {/* Restore Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Restore Database
              </h4>
              <p className="text-sm text-muted-foreground">
                Upload a backup file to restore all data. This will overwrite current data.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-red-900 mb-2">⚠️ Warning:</h5>
                <ul className="text-sm text-red-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    All current data will be replaced
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    This action cannot be undone
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Create a backup first!
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Your account will be preserved
                  </li>
                </ul>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleDatabaseRestore}
                  disabled={isBackingUp || isRestoring}
                  className="hidden"
                  id="restore-file-input"
                />
                <label
                  htmlFor="restore-file-input"
                  className={`flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer w-full justify-center ${
                    isBackingUp || isRestoring ? 'bg-gray-400 cursor-not-allowed' : ''
                  }`}
                >
                  {isRestoring ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Restoring data...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Restore Backup
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Best Practice:</strong> Create regular backups and store them securely in multiple locations (cloud storage, external drives).
              Always test restored backups to ensure data integrity.
            </p>
          </div>
        </div>

        {/* Logout Section - Doctor */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">Logout</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account. You will need to log in again to access the system.
          </p>
          <button
            onClick={onLogout}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t.logout}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default Settings;
