// Role-Based Access Control Types for V-Mail

/**
 * Available roles in the system
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

/**
 * Permission categories
 */
export enum PermissionCategory {
  EMAIL = 'email',
  CONTACTS = 'contacts',
  CALENDAR = 'calendar',
  SETTINGS = 'settings',
  TEAM = 'team',
  ADMIN = 'admin',
  REPORTS = 'reports',
  INTEGRATIONS = 'integrations'
}

/**
 * Individual permissions
 */
export enum Permission {
  // Email permissions
  EMAIL_READ = 'email:read',
  EMAIL_WRITE = 'email:write',
  EMAIL_SEND = 'email:send',
  EMAIL_DELETE = 'email:delete',
  EMAIL_ARCHIVE = 'email:archive',
  EMAIL_FORWARD = 'email:forward',
  EMAIL_REPLY = 'email:reply',

  // Contact permissions
  CONTACTS_READ = 'contacts:read',
  CONTACTS_WRITE = 'contacts:write',
  CONTACTS_DELETE = 'contacts:delete',
  CONTACTS_IMPORT = 'contacts:import',
  CONTACTS_EXPORT = 'contacts:export',

  // Calendar permissions
  CALENDAR_READ = 'calendar:read',
  CALENDAR_WRITE = 'calendar:write',
  CALENDAR_SHARE = 'calendar:share',
  CALENDAR_DELETE = 'calendar:delete',

  // Settings permissions
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',
  SETTINGS_MANAGE = 'settings:manage',

  // Team permissions
  TEAM_READ = 'team:read',
  TEAM_MANAGE = 'team:manage',
  TEAM_INVITE = 'team:invite',
  TEAM_REMOVE = 'team:remove',
  TEAM_ASSIGN_ROLES = 'team:assign_roles',

  // Admin permissions
  ADMIN_PANEL_ACCESS = 'admin:panel_access',
  ADMIN_USER_MANAGE = 'admin:user_manage',
  ADMIN_AUDIT_LOGS = 'admin:audit_logs',
  ADMIN_SYSTEM_CONFIG = 'admin:system_config',
  ADMIN_BILLING = 'admin:billing',

  // Reports permissions
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  REPORTS_ANALYTICS = 'reports:analytics',

  // Integration permissions
  INTEGRATIONS_READ = 'integrations:read',
  INTEGRATIONS_CONNECT = 'integrations:connect',
  INTEGRATIONS_DISCONNECT = 'integrations:disconnect',
  INTEGRATIONS_MANAGE = 'integrations:manage'
}

/**
 * Permission set for a role
 */
export interface RolePermissions {
  role: Role;
  permissions: Permission[];
  displayName: string;
  description: string;
}

/**
 * Custom permission set
 */
export interface CustomPermissionSet {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User role assignment
 */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  customPermissions?: Permission[];
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Role hierarchy level
 */
export interface RoleHierarchy {
  role: Role;
  level: number;
  canAssignTo: Role[];
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  grantedBy?: 'role' | 'custom' | 'explicit';
}

/**
 * Access control policy
 */
export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  resource: string;
  permissions: Permission[];
  roles: Role[];
  isActive: boolean;
  priority: number;
}

/**
 * Audit log entry for permission changes
 */
export interface PermissionAuditLog {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorUserName: string;
  action: 'granted' | 'revoked' | 'modified' | 'expired';
  targetUserId: string;
  targetUserName: string;
  changes: {
    role?: Role;
    permissions?: Permission[];
    customSetId?: string;
  };
  reason?: string;
}

/**
 * RBAC settings
 */
export interface RBACSettings {
  enableCustomRoles: boolean;
  enablePermissionExpiration: boolean;
  defaultRole: Role;
  maxCustomRoles: number;
  requireApprovalForRoleChanges: boolean;
  auditLogRetentionDays: number;
}

/**
 * Create role payload
 */
export interface CreateRolePayload {
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isDefault?: boolean;
}

/**
 * Update role payload
 */
export interface UpdateRolePayload {
  name?: string;
  displayName?: string;
  description?: string;
  permissions?: Permission[];
  isDefault?: boolean;
}

/**
 * Assign role payload
 */
export interface AssignRolePayload {
  userId: string;
  role: Role;
  customPermissions?: Permission[];
  expiresAt?: string;
  reason?: string;
}

/**
 * Revoke role payload
 */
export interface RevokeRolePayload {
  userId: string;
  reason?: string;
}

/**
 * Update permissions payload
 */
export interface UpdatePermissionsPayload {
  userId: string;
  permissions: Permission[];
  reason?: string;
}

/**
 * Permission filter
 */
export interface PermissionFilter {
  category?: PermissionCategory;
  resource?: string;
  role?: Role;
  isActive?: boolean;
}

/**
 * RBAC statistics
 */
export interface RBACStats {
  totalUsers: number;
  usersByRole: Record<Role, number>;
  totalCustomRoles: number;
  activePolicies: number;
  auditLogEntries: number;
  permissionChangesThisWeek: number;
  expiringAssignments: number;
}

/**
 * Permission request
 */
export interface PermissionRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  permissions: Permission[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  expiresAt?: string;
}
