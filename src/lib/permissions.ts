/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines what actions each role can perform in the system
 */

export type UserRole = 'doctor' | 'staff';

export interface Permissions {
  // Patient Management
  canViewAllPatientDetails: boolean;
  canCreatePatient: boolean;
  canEditPatientMedical: boolean;
  canEditPatientBasic: boolean;
  canDeletePatient: boolean;
  canExportPatientData: boolean;

  // Queue Management
  canViewQueue: boolean;
  canAddToQueue: boolean;
  canAddPriorityQueue: boolean;
  canUpdateQueueStatus: boolean;
  canRemoveFromQueue: boolean;
  canOverridePriority: boolean;
  canReorderQueue: boolean;

  // File Management
  canViewFiles: boolean;
  canUploadFiles: boolean;
  canDownloadFiles: boolean;
  canDeleteFiles: boolean;
  canViewSensitiveFiles: boolean;

  // Analytics & Reporting
  canViewBasicAnalytics: boolean;
  canViewDetailedAnalytics: boolean;
  canViewPredictiveInsights: boolean;
  canExportReports: boolean;

  // System Settings
  canManageUsers: boolean;
  canConfigureSystem: boolean;
  canAccessAuditLogs: boolean;
  canBackupRestore: boolean;
}

/**
 * Get permissions for a given user role
 */
export const getPermissions = (role: UserRole | null): Permissions => {
  if (role === 'doctor') {
    // Admin (Doctor) has full access
    return {
      // Patient Management - Full Access
      canViewAllPatientDetails: true,
      canCreatePatient: true,
      canEditPatientMedical: true,
      canEditPatientBasic: true,
      canDeletePatient: true,
      canExportPatientData: true,

      // Queue Management - Full Access
      canViewQueue: true,
      canAddToQueue: true,
      canAddPriorityQueue: true,
      canUpdateQueueStatus: true,
      canRemoveFromQueue: true,
      canOverridePriority: true,
      canReorderQueue: true,

      // File Management - Full Access
      canViewFiles: true,
      canUploadFiles: true,
      canDownloadFiles: true,
      canDeleteFiles: true,
      canViewSensitiveFiles: true,

      // Analytics & Reporting - Full Access
      canViewBasicAnalytics: true,
      canViewDetailedAnalytics: true,
      canViewPredictiveInsights: true,
      canExportReports: true,

      // System Settings - Full Access
      canManageUsers: true,
      canConfigureSystem: true,
      canAccessAuditLogs: true,
      canBackupRestore: true,
    };
  } else if (role === 'staff') {
    // Staff has limited access
    return {
      // Patient Management - Limited
      canViewAllPatientDetails: false, // Only basic info
      canCreatePatient: true,
      canEditPatientMedical: false,
      canEditPatientBasic: true,
      canDeletePatient: false,
      canExportPatientData: false,

      // Queue Management - Limited
      canViewQueue: true,
      canAddToQueue: true,
      canAddPriorityQueue: false, // Normal priority only
      canUpdateQueueStatus: true,
      canRemoveFromQueue: true,
      canOverridePriority: false,
      canReorderQueue: false,

      // File Management - Limited
      canViewFiles: true,
      canUploadFiles: true,
      canDownloadFiles: true,
      canDeleteFiles: false,
      canViewSensitiveFiles: false,

      // Analytics & Reporting - Limited
      canViewBasicAnalytics: true,
      canViewDetailedAnalytics: false,
      canViewPredictiveInsights: false,
      canExportReports: false,

      // System Settings - No Access
      canManageUsers: false,
      canConfigureSystem: false,
      canAccessAuditLogs: false,
      canBackupRestore: false,
    };
  }

  // Default: No permissions for unauthenticated users
  return {
    canViewAllPatientDetails: false,
    canCreatePatient: false,
    canEditPatientMedical: false,
    canEditPatientBasic: false,
    canDeletePatient: false,
    canExportPatientData: false,
    canViewQueue: false,
    canAddToQueue: false,
    canAddPriorityQueue: false,
    canUpdateQueueStatus: false,
    canRemoveFromQueue: false,
    canOverridePriority: false,
    canReorderQueue: false,
    canViewFiles: false,
    canUploadFiles: false,
    canDownloadFiles: false,
    canDeleteFiles: false,
    canViewSensitiveFiles: false,
    canViewBasicAnalytics: false,
    canViewDetailedAnalytics: false,
    canViewPredictiveInsights: false,
    canExportReports: false,
    canManageUsers: false,
    canConfigureSystem: false,
    canAccessAuditLogs: false,
    canBackupRestore: false,
  };
};

/**
 * Helper function to check a specific permission
 */
export const hasPermission = (
  role: UserRole | null,
  permission: keyof Permissions
): boolean => {
  const permissions = getPermissions(role);
  return permissions[permission];
};
