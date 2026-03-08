/**
 * useAdminPanel Hook for V-Mail v1.2.0
 *
 * Comprehensive hook for admin panel operations.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import type {
  AdminUser,
  AuditLogEntry,
  SystemMetrics,
  SystemStatus,
  AdminStats,
  SystemAlert,
  MaintenanceWindow,
  AdminSettings,
  CreateUserPayload,
  UpdateUserPayload,
  AuditLogFilter,
  AdminUserFilter,
  BulkOperationResult,
  ExportConfig,
  AdminAction,
  AuditLogSeverity,
  AdminUserRole,
  UserStatus
} from '../types/adminPanel';

// Mock data generators
const generateMockUsers = (): AdminUser[] => {
  const now = new Date();
  return [
    {
      id: 'user-1',
      email: 'admin@vmail.app',
      name: 'System Admin',
      role: 'super_admin',
      permissions: ['all'],
      lastLoginAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      loginCount: 156,
      status: 'active',
      createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      storageUsed: 2.5,
      emailCount: 1250,
      twoFactorEnabled: true
    },
    {
      id: 'user-2',
      email: 'john@example.com',
      name: 'John Doe',
      role: 'admin',
      permissions: ['manage_users', 'view_reports', 'manage_teams'],
      lastLoginAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      loginCount: 89,
      status: 'active',
      createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      teamId: 'team-1',
      teamName: 'Vantis Corp',
      storageUsed: 5.2,
      emailCount: 3200,
      twoFactorEnabled: true
    },
    {
      id: 'user-3',
      email: 'jane@example.com',
      name: 'Jane Smith',
      role: 'support',
      permissions: ['view_users', 'view_reports'],
      lastLoginAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      loginCount: 45,
      status: 'active',
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      teamId: 'team-1',
      teamName: 'Vantis Corp',
      storageUsed: 1.8,
      emailCount: 890,
      twoFactorEnabled: false
    },
    {
      id: 'user-4',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      role: 'admin',
      permissions: ['manage_users', 'view_reports'],
      lastLoginAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      loginCount: 23,
      status: 'suspended',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      storageUsed: 0.5,
      emailCount: 150,
      twoFactorEnabled: false
    },
    {
      id: 'user-5',
      email: 'alice@example.com',
      name: 'Alice Williams',
      role: 'support',
      permissions: ['view_users'],
      lastLoginAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      loginCount: 12,
      status: 'active',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      teamId: 'team-2',
      teamName: 'Tech Solutions',
      storageUsed: 3.1,
      emailCount: 750,
      twoFactorEnabled: true
    }
  ];
};

const generateMockAuditLogs = (): AuditLogEntry[] => {
  const now = new Date();
  return [
    {
      id: 'log-1',
      action: 'user_create',
      severity: 'info',
      userId: 'user-1',
      userName: 'System Admin',
      userEmail: 'admin@vmail.app',
      targetId: 'user-5',
      targetType: 'user',
      targetName: 'Alice Williams',
      details: 'Created new user account',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'log-2',
      action: 'user_suspend',
      severity: 'warning',
      userId: 'user-2',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      targetId: 'user-4',
      targetType: 'user',
      targetName: 'Bob Johnson',
      details: 'User account suspended due to policy violation',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000)
    },
    {
      id: 'log-3',
      action: 'security_alert',
      severity: 'critical',
      userId: 'system',
      userName: 'System',
      userEmail: 'system@vmail.app',
      details: 'Multiple failed login attempts detected from IP 203.0.113.1',
      ipAddress: '203.0.113.1',
      userAgent: 'Unknown',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000)
    },
    {
      id: 'log-4',
      action: 'settings_update',
      severity: 'info',
      userId: 'user-1',
      userName: 'System Admin',
      userEmail: 'admin@vmail.app',
      details: 'Updated system password policy settings',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    },
    {
      id: 'log-5',
      action: 'role_change',
      severity: 'warning',
      userId: 'user-2',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      targetId: 'user-3',
      targetType: 'user',
      targetName: 'Jane Smith',
      details: 'Changed user role from support to admin',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  ];
};

const generateMockSystemStatus = (): SystemStatus => {
  const now = new Date();
  return {
    overall: 'healthy',
    services: [
      {
        service: 'API',
        status: 'healthy',
        responseTime: 45,
        lastChecked: now,
        uptime: 99.99
      },
      {
        service: 'Database',
        status: 'healthy',
        responseTime: 12,
        lastChecked: now,
        uptime: 99.98
      },
      {
        service: 'Email Service',
        status: 'healthy',
        responseTime: 85,
        lastChecked: now,
        uptime: 99.95
      },
      {
        service: 'Storage',
        status: 'healthy',
        responseTime: 25,
        lastChecked: now,
        uptime: 99.99
      },
      {
        service: 'Authentication',
        status: 'healthy',
        responseTime: 35,
        lastChecked: now,
        uptime: 99.99
      }
    ],
    uptime: 99.97,
    version: '1.2.0',
    lastDeployed: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  };
};

const generateMockMetrics = (): SystemMetrics[] => {
  const now = new Date();
  const metrics: SystemMetrics[] = [];

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    metrics.push({
      timestamp,
      cpuUsage: Math.random() * 40 + 20,
      memoryUsage: Math.random() * 30 + 50,
      diskUsage: 65 + Math.random() * 5,
      networkIn: Math.random() * 500 + 100,
      networkOut: Math.random() * 300 + 50,
      activeConnections: Math.floor(Math.random() * 500 + 200),
      requestCount: Math.floor(Math.random() * 10000 + 5000),
      averageResponseTime: Math.random() * 100 + 50,
      errorRate: Math.random() * 0.5
    });
  }

  return metrics.reverse();
};

const generateMockAlerts = (): SystemAlert[] => {
  const now = new Date();
  return [
    {
      id: 'alert-1',
      type: 'security',
      severity: 'critical',
      title: 'Multiple Failed Login Attempts',
      message: 'Over 50 failed login attempts detected from IP 203.0.113.1 in the last hour',
      isRead: false,
      isResolved: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      metadata: { ip: '203.0.113.1', attempts: 52 }
    },
    {
      id: 'alert-2',
      type: 'storage',
      severity: 'warning',
      title: 'Storage Threshold Exceeded',
      message: 'System storage usage has exceeded 80% threshold',
      isRead: true,
      isResolved: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    },
    {
      id: 'alert-3',
      type: 'performance',
      severity: 'warning',
      title: 'High CPU Usage',
      message: 'CPU usage has been above 80% for the last 30 minutes',
      isRead: true,
      isResolved: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      resolvedBy: 'user-1'
    }
  ];
};

const generateMockStats = (): AdminStats => ({
  totalUsers: 1250,
  activeUsers: 980,
  suspendedUsers: 45,
  newUsersToday: 12,
  newUsersThisWeek: 67,
  newUsersThisMonth: 234,
  totalTeams: 156,
  activeTeams: 142,
  totalEmails: 15600000,
  emailsToday: 45000,
  totalStorage: 50000,
  storageUsed: 35250,
  averageStoragePerUser: 28.2,
  revenue: {
    mrr: 45600,
    arr: 547200,
    growth: 12.5
  }
});

const generateMockSettings = (): AdminSettings => ({
  maxUsersPerTeam: 50,
  defaultStorageLimit: 10,
  defaultEmailLimit: 10000,
  allowedDomains: [],
  blockedDomains: ['spam.com', 'tempmail.com'],
  requireEmailVerification: true,
  requireTwoFactor: false,
  passwordMinLength: 8,
  sessionTimeout: 1440,
  maxLoginAttempts: 5,
  enableMaintenanceMode: false,
  maintenanceMessage: '',
  enableNewUserRegistration: true,
  enableTeamCreation: true,
  enablePublicApi: true,
  rateLimitRequests: 1000,
  rateLimitWindow: 60
});

export interface UseAdminPanelReturn {
  // State
  users: AdminUser[];
  auditLogs: AuditLogEntry[];
  systemStatus: SystemStatus | null;
  systemMetrics: SystemMetrics[];
  alerts: SystemAlert[];
  stats: AdminStats | null;
  settings: AdminSettings | null;
  isLoading: boolean;
  error: string | null;

  // User Management
  getUsers: (filter?: AdminUserFilter) => Promise<AdminUser[]>;
  getUser: (userId: string) => Promise<AdminUser | null>;
  createUser: (payload: CreateUserPayload) => Promise<AdminUser | null>;
  updateUser: (userId: string, payload: UpdateUserPayload) => Promise<AdminUser | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  suspendUser: (userId: string) => Promise<boolean>;
  reactivateUser: (userId: string) => Promise<boolean>;
  bulkUpdateUsers: (userIds: string[], payload: UpdateUserPayload) => Promise<BulkOperationResult>;
  bulkDeleteUsers: (userIds: string[]) => Promise<BulkOperationResult>;
  exportUsers: (config: ExportConfig) => Promise<string>;

  // Audit Logs
  getAuditLogs: (filter?: AuditLogFilter) => Promise<AuditLogEntry[]>;
  getAuditLog: (logId: string) => Promise<AuditLogEntry | null>;
  exportAuditLogs: (config: ExportConfig) => Promise<string>;

  // System Operations
  getSystemStatus: () => Promise<SystemStatus>;
  getSystemMetrics: (hours?: number) => Promise<SystemMetrics[]>;
  getAlerts: () => Promise<SystemAlert[]>;
  resolveAlert: (alertId: string) => Promise<boolean>;
  dismissAlert: (alertId: string) => Promise<boolean>;

  // Settings
  getSettings: () => Promise<AdminSettings>;
  updateSettings: (settings: Partial<AdminSettings>) => Promise<AdminSettings | null>;

  // Statistics
  getStats: () => Promise<AdminStats>;

  // Maintenance
  scheduleMaintenance: (window: Omit<MaintenanceWindow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MaintenanceWindow | null>;
  cancelMaintenance: (maintenanceId: string) => Promise<boolean>;
  getActiveMaintenance: () => Promise<MaintenanceWindow | null>;

  // Utility Functions
  getFilteredUsers: (filter: AdminUserFilter) => AdminUser[];
  getFilteredAuditLogs: (filter: AuditLogFilter) => AuditLogEntry[];
  searchUsers: (query: string) => AdminUser[];

  // Refresh Functions
  refreshUsers: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

export function useAdminPanel(): UseAdminPanelReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addNotification } = useNotifications();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        setUsers(generateMockUsers());
        setAuditLogs(generateMockAuditLogs());
        setSystemStatus(generateMockSystemStatus());
        setSystemMetrics(generateMockMetrics());
        setAlerts(generateMockAlerts());
        setStats(generateMockStats());
        setSettings(generateMockSettings());
      } catch (err) {
        setError('Failed to load admin panel data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // User Management
  const getUsers = useCallback(async (filter?: AdminUserFilter): Promise<AdminUser[]> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const filtered = filter ? getFilteredUsers(filter) : users;
      return filtered;
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  const getUser = useCallback(async (userId: string): Promise<AdminUser | null> => {
    return users.find(u => u.id === userId) || null;
  }, [users]);

  const createUser = useCallback(async (payload: CreateUserPayload): Promise<AdminUser | null> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newUser: AdminUser = {
        id: `user-${Date.now()}`,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'support',
        permissions: [],
        loginCount: 0,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        teamId: payload.teamId,
        storageUsed: 0,
        emailCount: 0,
        twoFactorEnabled: false
      };

      setUsers(prev => [...prev, newUser]);

      addNotification('success', `User "${payload.name}" has been created successfully.`);

      return newUser;
    } catch (err) {
      setError('Failed to create user');
      addNotification('error', 'Failed to create user. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const updateUser = useCallback(async (userId: string, payload: UpdateUserPayload): Promise<AdminUser | null> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user first
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        addNotification('error', 'User not found');
        return null;
      }

      const updatedUser: AdminUser = { ...userToUpdate, ...payload, updatedAt: new Date() };

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

      addNotification('success', `User "${updatedUser.name}" has been updated successfully.`);

      return updatedUser;
    } catch (err) {
      setError('Failed to update user');
      addNotification('error', 'Failed to update user. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, users]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.filter(u => u.id !== userId));

      addNotification('success', 'User has been deleted successfully.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to delete user. Please try again.');
      return false;
    }
  }, [addNotification]);

  const suspendUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: 'suspended' as UserStatus, updatedAt: new Date() } : u
      ));

      addNotification('warning', 'User has been suspended successfully.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to suspend user. Please try again.');
      return false;
    }
  }, [addNotification]);

  const reactivateUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: 'active' as UserStatus, updatedAt: new Date() } : u
      ));

      addNotification('success', 'User has been reactivated successfully.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to reactivate user. Please try again.');
      return false;
    }
  }, [addNotification]);

  const bulkUpdateUsers = useCallback(async (userIds: string[], payload: UpdateUserPayload): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: userIds.length
    };

    for (const userId of userIds) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, ...payload, updatedAt: new Date() } : u
        ));
        result.successful.push(userId);
      } catch (err) {
        result.failed.push({ id: userId, error: 'Failed to update user' });
      }
    }

    addNotification('success', `${result.successful.length} users updated successfully.`);

    return result;
  }, [addNotification]);

  const bulkDeleteUsers = useCallback(async (userIds: string[]): Promise<BulkOperationResult> => {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: userIds.length
    };

    for (const userId of userIds) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUsers(prev => prev.filter(u => u.id !== userId));
        result.successful.push(userId);
      } catch (err) {
        result.failed.push({ id: userId, error: 'Failed to delete user' });
      }
    }

    addNotification('success', `${result.successful.length} users deleted successfully.`);

    return result;
  }, [addNotification]);

  const exportUsers = useCallback(async (config: ExportConfig): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const data = users.map(u => {
      const row: Record<string, any> = {};
      config.fields.forEach(field => {
        row[field] = (u as any)[field];
      });
      return row;
    });

    if (config.format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = config.fields.join(',');
    const rows = data.map(row => config.fields.map(f => row[f]).join(','));
    return [headers, ...rows].join('\n');
  }, [users]);

  // Audit Logs
  const getAuditLogs = useCallback(async (filter?: AuditLogFilter): Promise<AuditLogEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return filter ? getFilteredAuditLogs(filter) : auditLogs;
  }, [auditLogs]);

  const getAuditLog = useCallback(async (logId: string): Promise<AuditLogEntry | null> => {
    return auditLogs.find(l => l.id === logId) || null;
  }, [auditLogs]);

  const exportAuditLogs = useCallback(async (config: ExportConfig): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const data = auditLogs.map(l => {
      const row: Record<string, any> = {};
      config.fields.forEach(field => {
        row[field] = (l as any)[field];
      });
      return row;
    });

    if (config.format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    const headers = config.fields.join(',');
    const rows = data.map(row => config.fields.map(f => row[f]).join(','));
    return [headers, ...rows].join('\n');
  }, [auditLogs]);

  // System Operations
  const getSystemStatus = useCallback(async (): Promise<SystemStatus> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const status = generateMockSystemStatus();
    setSystemStatus(status);
    return status;
  }, []);

  const getSystemMetrics = useCallback(async (hours: number = 24): Promise<SystemMetrics[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const metrics = generateMockMetrics().slice(-hours);
    setSystemMetrics(metrics);
    return metrics;
  }, []);

  const getAlerts = useCallback(async (): Promise<SystemAlert[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return alerts;
  }, [alerts]);

  const resolveAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, isResolved: true, resolvedAt: new Date(), resolvedBy: 'current-user' } : a
      ));

      addNotification('success', 'The alert has been resolved successfully.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to resolve alert. Please try again.');
      return false;
    }
  }, [addNotification]);

  const dismissAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, isRead: true } : a
      ));

      return true;
    } catch (err) {
      return false;
    }
  }, []);

  // Settings
  const getSettings = useCallback(async (): Promise<AdminSettings> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return settings || generateMockSettings();
  }, [settings]);

  const updateSettings = useCallback(async (newSettings: Partial<AdminSettings>): Promise<AdminSettings | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedSettings: AdminSettings | null = null;

      setSettings(prev => {
        if (!prev) {
return null;
}
        updatedSettings = { ...prev, ...newSettings };
        return updatedSettings;
      });

      addNotification('success', 'Admin settings have been updated successfully.');

      return updatedSettings;
    } catch (err) {
      addNotification('error', 'Failed to update settings. Please try again.');
      return null;
    }
  }, [addNotification]);

  // Statistics
  const getStats = useCallback(async (): Promise<AdminStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return stats || generateMockStats();
  }, [stats]);

  // Maintenance
  const scheduleMaintenance = useCallback(async (window: Omit<MaintenanceWindow, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceWindow | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newWindow: MaintenanceWindow = {
        ...window,
        id: `maintenance-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      addNotification('info', `Maintenance window scheduled for ${new Date(window.startTime).toLocaleDateString()}.`);

      return newWindow;
    } catch (err) {
      addNotification('error', 'Failed to schedule maintenance. Please try again.');
      return null;
    }
  }, [addNotification]);

  const cancelMaintenance = useCallback(async (maintenanceId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      addNotification('info', 'Maintenance window has been cancelled.');

      return true;
    } catch (err) {
      return false;
    }
  }, [addNotification]);

  const getActiveMaintenance = useCallback(async (): Promise<MaintenanceWindow | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return null;
  }, []);

  // Utility Functions
  const getFilteredUsers = useCallback((filter: AdminUserFilter): AdminUser[] => {
    let result = [...users];

    if (filter.status && filter.status.length > 0) {
      result = result.filter(u => filter.status!.includes(u.status));
    }

    if (filter.role && filter.role.length > 0) {
      result = result.filter(u => filter.role!.includes(u.role));
    }

    if (filter.teamId) {
      result = result.filter(u => u.teamId === filter.teamId);
    }

    if (filter.hasTeam !== undefined) {
      result = result.filter(u => filter.hasTeam ? !!u.teamId : !u.teamId);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    if (filter.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (filter.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'email':
            comparison = a.email.localeCompare(b.email);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'lastLoginAt':
            comparison = (a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0) -
                        (b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0);
            break;
          case 'storageUsed':
            comparison = a.storageUsed - b.storageUsed;
            break;
        }
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    if (filter.offset !== undefined) {
      result = result.slice(filter.offset);
    }

    if (filter.limit !== undefined) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }, [users]);

  const getFilteredAuditLogs = useCallback((filter: AuditLogFilter): AuditLogEntry[] => {
    let result = [...auditLogs];

    if (filter.action && filter.action.length > 0) {
      result = result.filter(l => filter.action!.includes(l.action));
    }

    if (filter.severity && filter.severity.length > 0) {
      result = result.filter(l => filter.severity!.includes(l.severity));
    }

    if (filter.userId) {
      result = result.filter(l => l.userId === filter.userId);
    }

    if (filter.targetId) {
      result = result.filter(l => l.targetId === filter.targetId);
    }

    if (filter.dateFrom) {
      result = result.filter(l => new Date(l.timestamp) >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      result = result.filter(l => new Date(l.timestamp) <= filter.dateTo!);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(l =>
        l.action.toLowerCase().includes(searchLower) ||
        l.details.toLowerCase().includes(searchLower) ||
        l.userName.toLowerCase().includes(searchLower)
      );
    }

    if (filter.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (filter.sortBy) {
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'severity': {
            const severityOrder: AuditLogSeverity[] = ['info', 'warning', 'error', 'critical'];
            comparison = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
            break;
          }
          case 'action':
            comparison = a.action.localeCompare(b.action);
            break;
        }
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    if (filter.offset !== undefined) {
      result = result.slice(filter.offset);
    }

    if (filter.limit !== undefined) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }, [auditLogs]);

  const searchUsers = useCallback((query: string): AdminUser[] => {
    const queryLower = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(queryLower) ||
      u.email.toLowerCase().includes(queryLower) ||
      (u.teamName && u.teamName.toLowerCase().includes(queryLower))
    );
  }, [users]);

  // Refresh Functions
  const refreshUsers = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setUsers(generateMockUsers());
  }, []);

  const refreshAuditLogs = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setAuditLogs(generateMockAuditLogs());
  }, []);

  const refreshSystemStatus = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setSystemStatus(generateMockSystemStatus());
  }, []);

  const refreshAlerts = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setAlerts(generateMockAlerts());
  }, []);

  return {
    users,
    auditLogs,
    systemStatus,
    systemMetrics,
    alerts,
    stats,
    settings,
    isLoading,
    error,

    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
    bulkUpdateUsers,
    bulkDeleteUsers,
    exportUsers,

    getAuditLogs,
    getAuditLog,
    exportAuditLogs,

    getSystemStatus,
    getSystemMetrics,
    getAlerts,
    resolveAlert,
    dismissAlert,

    getSettings,
    updateSettings,

    getStats,

    scheduleMaintenance,
    cancelMaintenance,
    getActiveMaintenance,

    getFilteredUsers,
    getFilteredAuditLogs,
    searchUsers,

    refreshUsers,
    refreshAuditLogs,
    refreshSystemStatus,
    refreshAlerts
  };
}
