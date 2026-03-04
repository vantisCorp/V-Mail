/**
 * Admin Panel Types for V-Mail v1.2.0
 * 
 * This module defines comprehensive types for admin panel operations,
 * including user management, system monitoring, and audit logs.
 */

export type AdminAction = 
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_suspend'
  | 'user_reactivate'
  | 'team_create'
  | 'team_update'
  | 'team_delete'
  | 'settings_update'
  | 'billing_update'
  | 'security_alert'
  | 'login_attempt'
  | 'password_reset'
  | 'role_change'
  | 'permission_grant'
  | 'permission_revoke';

export type AuditLogSeverity = 
  | 'info'       // Informational events
  | 'warning'    // Warning events
  | 'error'      // Error events
  | 'critical';  // Critical security events

export type SystemHealthStatus = 
  | 'healthy'    // All systems operational
  | 'degraded'   // Some services degraded
  | 'outage';    // Major outage

export type AdminUserRole = 
  | 'super_admin'   // Full system access
  | 'admin'         // Administrative access
  | 'support';      // Support staff access

export type UserStatus = 
  | 'active'
  | 'suspended'
  | 'deleted'
  | 'pending';

/**
 * Admin user interface
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminUserRole;
  permissions: string[];
  lastLoginAt?: Date;
  loginCount: number;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  teamId?: string;
  teamName?: string;
  storageUsed: number;
  emailCount: number;
  twoFactorEnabled: boolean;
  avatar?: string;
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  action: AdminAction;
  severity: AuditLogSeverity;
  userId: string;
  userName: string;
  userEmail: string;
  targetId?: string;
  targetType?: 'user' | 'team' | 'system' | 'billing';
  targetName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * System metrics interface
 */
export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
}

/**
 * System health check interface
 */
export interface SystemHealthCheck {
  service: string;
  status: SystemHealthStatus;
  responseTime: number;
  lastChecked: Date;
  message?: string;
  uptime: number;
}

/**
 * System status interface
 */
export interface SystemStatus {
  overall: SystemHealthStatus;
  services: SystemHealthCheck[];
  lastIncident?: Date;
  uptime: number;
  version: string;
  lastDeployed: Date;
}

/**
 * Admin statistics interface
 */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalTeams: number;
  activeTeams: number;
  totalEmails: number;
  emailsToday: number;
  totalStorage: number;
  storageUsed: number;
  averageStoragePerUser: number;
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
}

/**
 * User creation payload
 */
export interface CreateUserPayload {
  email: string;
  name: string;
  role?: AdminUserRole;
  teamId?: string;
  sendInvite?: boolean;
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  name?: string;
  role?: AdminUserRole;
  status?: UserStatus;
  permissions?: string[];
  teamId?: string;
}

/**
 * Audit log filter
 */
export interface AuditLogFilter {
  action?: AdminAction[];
  severity?: AuditLogSeverity[];
  userId?: string;
  targetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy?: 'timestamp' | 'severity' | 'action';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Admin user filter
 */
export interface AdminUserFilter {
  status?: UserStatus[];
  role?: AdminUserRole[];
  teamId?: string;
  hasTeam?: boolean;
  search?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt' | 'storageUsed';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * System alert interface
 */
export interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'storage' | 'billing' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Maintenance window interface
 */
export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affectedServices: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin settings interface
 */
export interface AdminSettings {
  maxUsersPerTeam: number;
  defaultStorageLimit: number;
  defaultEmailLimit: number;
  allowedDomains: string[];
  blockedDomains: string[];
  requireEmailVerification: boolean;
  requireTwoFactor: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableMaintenanceMode: boolean;
  maintenanceMessage?: string;
  enableNewUserRegistration: boolean;
  enableTeamCreation: boolean;
  enablePublicApi: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
}

/**
 * Export data format
 */
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  fields: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeDeleted?: boolean;
}