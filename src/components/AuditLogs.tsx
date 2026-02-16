import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, AlertTriangle } from 'lucide-react';
import { auditService } from '../lib/services/auditService';
import { useTranslation } from '../lib/translations';
import StatCard from './StatCard';

interface AuditLogsProps {
  userRole: 'doctor' | 'staff';
}

interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  event_type: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  permission_required?: string;
  access_granted: boolean;
  details?: any;
  created_at: string;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [showDeniedOnly, setShowDeniedOnly] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (userRole === 'doctor') {
      loadAuditLogs();
      loadSecurityAlerts();
    }
  }, [userRole, showDeniedOnly, eventTypeFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (eventTypeFilter !== 'all') {
        filters.eventType = eventTypeFilter;
      }
      
      if (showDeniedOnly) {
        filters.accessGrantedOnly = false;
      }

      const data = await auditService.getAuditLogs(filters);
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const alerts = await auditService.getSecurityAlerts(24);
      setSecurityAlerts(alerts || []);
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.event_type?.toLowerCase().includes(searchLower) ||
      log.resource_type?.toLowerCase().includes(searchLower)
    );
  });

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'login', label: 'Login/Logout' },
    { value: 'permission_check', label: 'Permission Checks' },
    { value: 'data_access', label: 'Data Access' },
    { value: 'data_modification', label: 'Data Modifications' },
    { value: 'priority_override', label: 'Priority Overrides' },
    { value: 'settings_change', label: 'Settings Changes' },
  ];

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'login':
      case 'logout':
        return 'bg-blue-100 text-blue-800';
      case 'permission_check':
        return 'bg-yellow-100 text-yellow-800';
      case 'data_access':
        return 'bg-green-100 text-green-800';
      case 'data_modification':
        return 'bg-orange-100 text-orange-800';
      case 'priority_override':
        return 'bg-purple-100 text-purple-800';
      case 'settings_change':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  if (userRole !== 'doctor') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">Only doctors can access audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-foreground">{t.auditLogsTitle}</h1>
          <p className="text-muted-foreground">{t.auditLogsDescription}</p>
        </div>
        <button
          onClick={() => {
            const csv = [
              ['Timestamp', 'User', 'Role', 'Event Type', 'Action', 'Resource Type', 'Resource ID', 'Status', 'Details'].join(','),
              ...filteredLogs.map(log => [
                log.created_at,
                log.user_email,
                log.user_role,
                log.event_type,
                log.action,
                log.resource_type || '',
                log.resource_id || '',
                log.access_granted ? 'Granted' : 'Denied',
                JSON.stringify(log.details || {})
              ].join(','))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString()}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t.exportToCsv}
        </button>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-2">Security Alerts (Last 24 hours)</h3>
              <div className="space-y-2">
                {securityAlerts.map((alert, index) => (
                  <div key={index} className="text-sm text-destructive">
                    <strong>{alert.user_email}</strong> - {alert.action} ({alert.count} failed attempts)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title={t.totalEvents}
          value={logs.length.toString()}
          icon={Shield}
          color="primary"
        />
        <StatCard
          title={t.deniedAccess}
          value={logs.filter(l => !l.access_granted).length.toString()}
          icon={AlertTriangle}
          color="accent"
        />
        <StatCard
          title={t.loginEvents}
          value={logs.filter(l => l.event_type === 'login').length.toString()}
          icon={Shield}
          color="secondary"
        />
        <StatCard
          title={t.dataModifications}
          value={logs.filter(l => l.event_type === 'data_modification').length.toString()}
          icon={Shield}
          color="primary"
        />
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
            />
          </div>

          {/* Event Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground appearance-none"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Denied Only Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deniedOnly"
              checked={showDeniedOnly}
              onChange={(e) => setShowDeniedOnly(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="deniedOnly" className="text-sm text-foreground cursor-pointer">
              Show denied access only
            </label>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-foreground font-medium">{log.user_email}</div>
                      <div className="text-muted-foreground text-xs">
                        {log.user_role === 'doctor' ? '👨‍⚕️ Doctor' : '👔 Staff'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeBadgeColor(log.event_type)}`}>
                        {log.event_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.resource_type ? (
                        <div>
                          <div className="font-medium text-foreground">{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs truncate max-w-xs">{log.resource_id}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.access_granted ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Granted
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.details ? (
                        <button
                          onClick={() => alert(JSON.stringify(log.details, null, 2))}
                          className="text-primary hover:underline text-xs"
                        >
                          View Details
                        </button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default AuditLogs;
