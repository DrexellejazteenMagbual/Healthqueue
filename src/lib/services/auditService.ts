import { supabase } from '../supabase';

export interface AuditLogEntry {
  userId?: string;
  userEmail: string;
  userRole: 'doctor' | 'staff';
  eventType: 'permission_check' | 'data_access' | 'data_modification' | 'login' | 'logout' | 'priority_override' | 'settings_change';
  action: string;
  resourceType?: 'patient' | 'queue' | 'file' | 'settings' | 'analytics' | 'user';
  resourceId?: string;
  permissionRequired?: string;
  accessGranted: boolean;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Service - Handles all security event logging
 */
class AuditService {
  /**
   * Log a security event to the audit trail
   */
  async logEvent(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          user_email: entry.userEmail,
          user_role: entry.userRole,
          event_type: entry.eventType,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          permission_required: entry.permissionRequired,
          access_granted: entry.accessGranted,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent || navigator.userAgent,
        });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw - audit logging should never break app functionality
      }
    } catch (err) {
      console.error('Audit logging error:', err);
    }
  }

  /**
   * Log a permission check (successful or denied)
   */
  async logPermissionCheck(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    permission: string,
    accessGranted: boolean,
    resource?: { type: string; id: string }
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: 'permission_check',
      action: `check_${permission}`,
      permissionRequired: permission,
      accessGranted,
      resourceType: resource?.type as any,
      resourceId: resource?.id,
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    resourceType: 'patient' | 'queue' | 'file' | 'analytics',
    resourceId: string,
    action: string,
    granted: boolean = true
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: 'data_access',
      action,
      resourceType,
      resourceId,
      accessGranted: granted,
    });
  }

  /**
   * Log data modification event (create, update, delete)  */
  async logDataModification(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    resourceType: 'patient' | 'queue' | 'file' | 'settings',
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    details?: { before?: any; after?: any; changes?: string[] }
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: 'data_modification',
      action: `${action}_${resourceType}`,
      resourceType,
      resourceId,
      accessGranted: true,
      details,
    });
  }

  /**
   * Log queue priority override (sensitive operation)
   */
  async logPriorityOverride(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    queueItemId: string,
    fromPriority: 'normal' | 'priority',
    toPriority: 'normal' | 'priority',
    justification: string
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: 'priority_override',
      action: 'override_queue_priority',
      resourceType: 'queue',
      resourceId: queueItemId,
      accessGranted: true,
      details: {
        from: fromPriority,
        to: toPriority,
        justification,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    action: 'login' | 'logout',
    success: boolean = true
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: action,
      action,
      accessGranted: success,
    });
  }

  /**
   * Log settings changes (admin operations)
   */
  async logSettingsChange(
    userEmail: string,
    userRole: 'doctor' | 'staff',
    settingName: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.logEvent({
      userEmail,
      userRole,
      eventType: 'settings_change',
      action: `update_setting_${settingName}`,
      resourceType: 'settings',
      accessGranted: true,
      details: {
        setting: settingName,
        oldValue,
        newValue,
      },
    });
  }

  /**
   * Retrieve audit logs (doctors only)
   */
  async getAuditLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
    userId?: string;
    accessGrantedOnly?: boolean;
  }) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.accessGrantedOnly !== undefined) {
      query = query.eq('access_granted', filters.accessGrantedOnly);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get security alerts (repeated denied access attempts)
   */
  async getSecurityAlerts(sinceHours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - sinceHours);

    // Use RPC call or raw query for GROUP BY
    // For now, fetch denied attempts and group in JavaScript
    const { data, error } = await supabase
      .from('audit_logs')
      .select('user_email, action, created_at')
      .eq('access_granted', false)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to retrieve security alerts:', error);
      return [];
    }

    // Group by user_email and action, count occurrences
    const grouped = data.reduce((acc: any, log: any) => {
      const key = `${log.user_email}:${log.action}`;
      if (!acc[key]) {
        acc[key] = {
          user_email: log.user_email,
          action: log.action,
          count: 0,
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Filter for more than 3 attempts
    return Object.values(grouped).filter((alert: any) => alert.count > 3);
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;
