import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Role,
  Permission,
  PermissionCategory,
  RolePermissions,
  CustomPermissionSet,
  UserRoleAssignment,
  RoleHierarchy,
  PermissionCheck,
  AccessPolicy,
  PermissionAuditLog,
  RBACSettings,
  CreateRolePayload,
  UpdateRolePayload,
  AssignRolePayload,
  RevokeRolePayload,
  UpdatePermissionsPayload,
  RBACStats,
  PermissionRequest
} from '../types/rbac';

/**
 * Default role permissions configuration
 */
const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: Role.SUPER_ADMIN,
    permissions: Object.values(Permission),
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions'
  },
  {
    role: Role.ADMIN,
    permissions: [
      Permission.EMAIL_READ,
      Permission.EMAIL_WRITE,
      Permission.EMAIL_SEND,
      Permission.EMAIL_DELETE,
      Permission.CONTACTS_READ,
      Permission.CONTACTS_WRITE,
      Permission.CONTACTS_IMPORT,
      Permission.CONTACTS_EXPORT,
      Permission.CALENDAR_READ,
      Permission.CALENDAR_WRITE,
      Permission.CALENDAR_SHARE,
      Permission.SETTINGS_READ,
      Permission.SETTINGS_WRITE,
      Permission.TEAM_READ,
      Permission.TEAM_MANAGE,
      Permission.TEAM_INVITE,
      Permission.TEAM_ASSIGN_ROLES,
      Permission.ADMIN_PANEL_ACCESS,
      Permission.ADMIN_USER_MANAGE,
      Permission.ADMIN_AUDIT_LOGS,
      Permission.REPORTS_VIEW,
      Permission.REPORTS_EXPORT,
      Permission.REPORTS_ANALYTICS,
      Permission.INTEGRATIONS_READ,
      Permission.INTEGRATIONS_CONNECT,
      Permission.INTEGRATIONS_MANAGE
    ],
    displayName: 'Administrator',
    description: 'Administrative access with most system permissions'
  },
  {
    role: Role.MANAGER,
    permissions: [
      Permission.EMAIL_READ,
      Permission.EMAIL_WRITE,
      Permission.EMAIL_SEND,
      Permission.EMAIL_ARCHIVE,
      Permission.CONTACTS_READ,
      Permission.CONTACTS_WRITE,
      Permission.CALENDAR_READ,
      Permission.CALENDAR_WRITE,
      Permission.CALENDAR_SHARE,
      Permission.SETTINGS_READ,
      Permission.TEAM_READ,
      Permission.TEAM_INVITE,
      Permission.REPORTS_VIEW,
      Permission.REPORTS_EXPORT
    ],
    displayName: 'Manager',
    description: 'Team management with email, contacts, and reporting access'
  },
  {
    role: Role.MEMBER,
    permissions: [
      Permission.EMAIL_READ,
      Permission.EMAIL_WRITE,
      Permission.EMAIL_SEND,
      Permission.EMAIL_REPLY,
      Permission.CONTACTS_READ,
      Permission.CONTACTS_WRITE,
      Permission.CALENDAR_READ,
      Permission.CALENDAR_WRITE,
      Permission.SETTINGS_READ
    ],
    displayName: 'Member',
    description: 'Standard team member with email, contacts, and calendar access'
  },
  {
    role: Role.VIEWER,
    permissions: [
      Permission.EMAIL_READ,
      Permission.CONTACTS_READ,
      Permission.CALENDAR_READ,
      Permission.SETTINGS_READ,
      Permission.REPORTS_VIEW
    ],
    displayName: 'Viewer',
    description: 'Read-only access to view emails, contacts, and calendars'
  },
  {
    role: Role.GUEST,
    permissions: [Permission.EMAIL_READ],
    displayName: 'Guest',
    description: 'Limited read-only access to emails only'
  }
];

/**
 * Role hierarchy definition
 */
const ROLE_HIERARCHY: RoleHierarchy[] = [
  {
    role: Role.SUPER_ADMIN,
    level: 5,
    canAssignTo: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER, Role.GUEST]
  },
  { role: Role.ADMIN, level: 4, canAssignTo: [Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER, Role.GUEST] },
  { role: Role.MANAGER, level: 3, canAssignTo: [Role.MEMBER, Role.VIEWER, Role.GUEST] },
  { role: Role.MEMBER, level: 2, canAssignTo: [] },
  { role: Role.VIEWER, level: 1, canAssignTo: [] },
  { role: Role.GUEST, level: 0, canAssignTo: [] }
];

/**
 * Default RBAC settings
 */
const DEFAULT_RBAC_SETTINGS: RBACSettings = {
  enableCustomRoles: true,
  enablePermissionExpiration: true,
  defaultRole: Role.MEMBER,
  maxCustomRoles: 20,
  requireApprovalForRoleChanges: true,
  auditLogRetentionDays: 90
};

// Mock data generators
const generateMockUserRoleAssignments = (): UserRoleAssignment[] => [
  {
    id: '1',
    userId: 'u1',
    userName: 'John Smith',
    userEmail: 'john.smith@example.com',
    role: Role.ADMIN,
    assignedAt: '2024-01-15T10:00:00Z',
    assignedBy: 'admin@vantis.ai',
    isActive: true
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Jane Doe',
    userEmail: 'jane.doe@example.com',
    role: Role.MANAGER,
    assignedAt: '2024-02-20T14:30:00Z',
    assignedBy: 'admin@vantis.ai',
    isActive: true
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Bob Johnson',
    userEmail: 'bob.johnson@example.com',
    role: Role.MEMBER,
    customPermissions: [Permission.EMAIL_DELETE, Permission.CONTACTS_EXPORT],
    assignedAt: '2024-03-10T09:15:00Z',
    assignedBy: 'u1',
    isActive: true
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Alice Williams',
    userEmail: 'alice.williams@example.com',
    role: Role.VIEWER,
    assignedAt: '2024-03-15T11:00:00Z',
    assignedBy: 'u2',
    isActive: true
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'Charlie Brown',
    userEmail: 'charlie.brown@example.com',
    role: Role.GUEST,
    customPermissions: [Permission.EMAIL_READ],
    assignedAt: '2024-04-01T08:30:00Z',
    assignedBy: 'u2',
    expiresAt: '2024-07-01T08:30:00Z',
    isActive: true
  }
];

const generateMockCustomPermissionSets = (): CustomPermissionSet[] => [
  {
    id: 'custom1',
    name: 'Support Agent',
    description: 'Support team with limited email management',
    permissions: [
      Permission.EMAIL_READ,
      Permission.EMAIL_WRITE,
      Permission.EMAIL_SEND,
      Permission.EMAIL_REPLY,
      Permission.CONTACTS_READ,
      Permission.CONTACTS_WRITE,
      Permission.SETTINGS_READ
    ],
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'custom2',
    name: 'Data Analyst',
    description: 'Analyst role with reporting and export permissions',
    permissions: [
      Permission.EMAIL_READ,
      Permission.CONTACTS_READ,
      Permission.CONTACTS_EXPORT,
      Permission.CALENDAR_READ,
      Permission.SETTINGS_READ,
      Permission.REPORTS_VIEW,
      Permission.REPORTS_EXPORT,
      Permission.REPORTS_ANALYTICS
    ],
    isDefault: false,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z'
  }
];

const generateMockAccessPolicies = (): AccessPolicy[] => [
  {
    id: 'policy1',
    name: 'Team Manager Access',
    description: 'Team managers can access team resources',
    resource: 'team',
    permissions: [Permission.TEAM_READ, Permission.TEAM_MANAGE, Permission.TEAM_INVITE],
    roles: [Role.MANAGER],
    isActive: true,
    priority: 1
  },
  {
    id: 'policy2',
    name: 'Admin Full Access',
    description: 'Administrators have full access to all resources',
    resource: '*',
    permissions: Object.values(Permission),
    roles: [Role.SUPER_ADMIN, Role.ADMIN],
    isActive: true,
    priority: 10
  }
];

const generateMockAuditLogs = (): PermissionAuditLog[] => [
  {
    id: 'log1',
    timestamp: '2024-04-10T10:30:00Z',
    actorUserId: 'u1',
    actorUserName: 'John Smith',
    action: 'granted',
    targetUserId: 'u5',
    targetUserName: 'Charlie Brown',
    changes: { role: Role.GUEST },
    reason: 'Temporary guest access for project collaboration'
  },
  {
    id: 'log2',
    timestamp: '2024-04-09T14:15:00Z',
    actorUserId: 'u1',
    actorUserName: 'John Smith',
    action: 'modified',
    targetUserId: 'u3',
    targetUserName: 'Bob Johnson',
    changes: {
      permissions: [Permission.EMAIL_DELETE, Permission.CONTACTS_EXPORT]
    },
    reason: 'Added special permissions for data cleanup task'
  },
  {
    id: 'log3',
    timestamp: '2024-04-08T09:00:00Z',
    actorUserId: 'u2',
    actorUserName: 'Jane Doe',
    action: 'granted',
    targetUserId: 'u4',
    targetUserName: 'Alice Williams',
    changes: { role: Role.VIEWER },
    reason: 'New team member onboarded'
  }
];

const generateMockPermissionRequests = (): PermissionRequest[] => [
  {
    id: 'req1',
    requestedBy: 'u3',
    requestedByName: 'Bob Johnson',
    permissions: [Permission.EMAIL_DELETE, Permission.CONTACTS_EXPORT],
    reason: 'Need to clean up old emails and export contacts for migration',
    status: 'pending',
    requestedAt: '2024-04-10T12:00:00Z'
  },
  {
    id: 'req2',
    requestedBy: 'u4',
    requestedByName: 'Alice Williams',
    permissions: [Permission.REPORTS_EXPORT],
    reason: 'Monthly report generation',
    status: 'approved',
    requestedAt: '2024-04-08T10:00:00Z',
    reviewedBy: 'u1',
    reviewedByName: 'John Smith',
    reviewedAt: '2024-04-08T14:00:00Z'
  }
];

export const useRBAC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rolePermissions] = useState<RolePermissions[]>(DEFAULT_ROLE_PERMISSIONS);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [customPermissionSets, setCustomPermissionSets] = useState<CustomPermissionSet[]>([]);
  const [accessPolicies, setAccessPolicies] = useState<AccessPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [settings, setSettings] = useState<RBACSettings>(DEFAULT_RBAC_SETTINGS);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUserRoleAssignments(generateMockUserRoleAssignments());
      setCustomPermissionSets(generateMockCustomPermissionSets());
      setAccessPolicies(generateMockAccessPolicies());
      setAuditLogs(generateMockAuditLogs());
      setPermissionRequests(generateMockPermissionRequests());

      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // Permission checking
  const hasPermission = useCallback(
    (userId: string, permission: Permission): PermissionCheck => {
      const assignment = userRoleAssignments.find((a) => a.userId === userId);

      if (!assignment) {
        return { hasPermission: false, reason: 'User not found' };
      }

      if (!assignment.isActive) {
        return { hasPermission: false, reason: 'User assignment is inactive' };
      }

      // Check if assignment is expired
      if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
        return { hasPermission: false, reason: 'Assignment has expired' };
      }

      // Check custom permissions first
      if (assignment.customPermissions?.includes(permission)) {
        return { hasPermission: true, grantedBy: 'custom' };
      }

      // Check role permissions
      const roleConfig = rolePermissions.find((r) => r.role === assignment.role);
      if (roleConfig?.permissions.includes(permission)) {
        return { hasPermission: true, grantedBy: 'role' };
      }

      return { hasPermission: false, reason: 'Permission not granted' };
    },
    [userRoleAssignments, rolePermissions]
  );

  const hasAllPermissions = useCallback(
    (userId: string, permissions: Permission[]): boolean => {
      return permissions.every((perm) => hasPermission(userId, perm).hasPermission);
    },
    [hasPermission]
  );

  const hasAnyPermission = useCallback(
    (userId: string, permissions: Permission[]): boolean => {
      return permissions.some((perm) => hasPermission(userId, perm).hasPermission);
    },
    [hasPermission]
  );

  // Role hierarchy checks
  const getRoleLevel = useCallback((role: Role): number => {
    return ROLE_HIERARCHY.find((h) => h.role === role)?.level || 0;
  }, []);

  const canAssignRole = useCallback((assignerRole: Role, targetRole: Role): boolean => {
    const assignerHierarchy = ROLE_HIERARCHY.find((h) => h.role === assignerRole);
    return assignerHierarchy?.canAssignTo.includes(targetRole) || false;
  }, []);

  const isHigherRole = useCallback(
    (role1: Role, role2: Role): boolean => {
      return getRoleLevel(role1) > getRoleLevel(role2);
    },
    [getRoleLevel]
  );

  // User role management
  const assignRole = useCallback(
    async (payload: AssignRolePayload): Promise<UserRoleAssignment | null> => {
      // Check if user already has a role assignment
      const existingIndex = userRoleAssignments.findIndex((a) => a.userId === payload.userId);

      const newAssignment: UserRoleAssignment = {
        id: existingIndex >= 0 ? userRoleAssignments[existingIndex].id : Date.now().toString(),
        userId: payload.userId,
        userName: userRoleAssignments.find((a) => a.userId === payload.userId)?.userName || 'Unknown',
        userEmail: userRoleAssignments.find((a) => a.userId === payload.userId)?.userEmail || '',
        role: payload.role,
        customPermissions: payload.customPermissions,
        assignedAt: new Date().toISOString(),
        assignedBy: 'current_user',
        expiresAt: payload.expiresAt,
        isActive: true
      };

      // Create audit log entry
      const auditLog: PermissionAuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorUserId: 'current_user',
        actorUserName: 'Current User',
        action: 'granted',
        targetUserId: payload.userId,
        targetUserName: newAssignment.userName,
        changes: { role: payload.role, permissions: payload.customPermissions },
        reason: payload.reason
      };

      if (existingIndex >= 0) {
        const updated = [...userRoleAssignments];
        updated[existingIndex] = newAssignment;
        setUserRoleAssignments(updated);
      } else {
        setUserRoleAssignments([...userRoleAssignments, newAssignment]);
      }

      setAuditLogs([auditLog, ...auditLogs]);
      return newAssignment;
    },
    [userRoleAssignments, auditLogs]
  );

  const revokeRole = useCallback(
    async (payload: RevokeRolePayload): Promise<boolean> => {
      const index = userRoleAssignments.findIndex((a) => a.userId === payload.userId);
      if (index === -1) {
        return false;
      }

      const assignment = userRoleAssignments[index];
      const auditLog: PermissionAuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorUserId: 'current_user',
        actorUserName: 'Current User',
        action: 'revoked',
        targetUserId: payload.userId,
        targetUserName: assignment.userName,
        changes: { role: assignment.role },
        reason: payload.reason
      };

      const updated = [...userRoleAssignments];
      updated[index] = { ...assignment, isActive: false };
      setUserRoleAssignments(updated);
      setAuditLogs([auditLog, ...auditLogs]);

      return true;
    },
    [userRoleAssignments, auditLogs]
  );

  const updatePermissions = useCallback(
    async (payload: UpdatePermissionsPayload): Promise<boolean> => {
      const index = userRoleAssignments.findIndex((a) => a.userId === payload.userId);
      if (index === -1) {
        return false;
      }

      const assignment = userRoleAssignments[index];
      const auditLog: PermissionAuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorUserId: 'current_user',
        actorUserName: 'Current User',
        action: 'modified',
        targetUserId: payload.userId,
        targetUserName: assignment.userName,
        changes: { permissions: payload.permissions },
        reason: payload.reason
      };

      const updated = [...userRoleAssignments];
      updated[index] = { ...assignment, customPermissions: payload.permissions };
      setUserRoleAssignments(updated);
      setAuditLogs([auditLog, ...auditLogs]);

      return true;
    },
    [userRoleAssignments, auditLogs]
  );

  // Custom permission sets management
  const createCustomPermissionSet = useCallback(
    async (payload: CreateRolePayload): Promise<CustomPermissionSet | null> => {
      const customSet: CustomPermissionSet = {
        id: `custom_${Date.now()}`,
        name: payload.name,
        description: payload.description || '',
        permissions: payload.permissions,
        isDefault: payload.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCustomPermissionSets([...customPermissionSets, customSet]);
      return customSet;
    },
    [customPermissionSets]
  );

  const updateCustomPermissionSet = useCallback(
    async (id: string, payload: UpdateRolePayload): Promise<CustomPermissionSet | null> => {
      const index = customPermissionSets.findIndex((s) => s.id === id);
      if (index === -1) {
        return null;
      }

      const updated: CustomPermissionSet = {
        ...customPermissionSets[index],
        ...(payload.name && { name: payload.name }),
        ...(payload.displayName && { displayName: payload.displayName }),
        ...(payload.description && { description: payload.description }),
        ...(payload.permissions && { permissions: payload.permissions }),
        ...(payload.isDefault !== undefined && { isDefault: payload.isDefault }),
        updatedAt: new Date().toISOString()
      };

      const updatedSets = [...customPermissionSets];
      updatedSets[index] = updated;
      setCustomPermissionSets(updatedSets);

      return updated;
    },
    [customPermissionSets]
  );

  const deleteCustomPermissionSet = useCallback(
    async (id: string): Promise<boolean> => {
      const index = customPermissionSets.findIndex((s) => s.id === id);
      if (index === -1) {
        return false;
      }

      const updated = customPermissionSets.filter((s) => s.id !== id);
      setCustomPermissionSets(updated);

      return true;
    },
    [customPermissionSets]
  );

  // Access policies management
  const createAccessPolicy = useCallback(
    async (policy: Omit<AccessPolicy, 'id'>): Promise<AccessPolicy | null> => {
      const newPolicy: AccessPolicy = {
        ...policy,
        id: `policy_${Date.now()}`
      };

      setAccessPolicies([...accessPolicies, newPolicy]);
      return newPolicy;
    },
    [accessPolicies]
  );

  const updateAccessPolicy = useCallback(
    async (id: string, updates: Partial<AccessPolicy>): Promise<AccessPolicy | null> => {
      const index = accessPolicies.findIndex((p) => p.id === id);
      if (index === -1) {
        return null;
      }

      const updated = { ...accessPolicies[index], ...updates };
      const updatedPolicies = [...accessPolicies];
      updatedPolicies[index] = updated;
      setAccessPolicies(updatedPolicies);

      return updated;
    },
    [accessPolicies]
  );

  const deleteAccessPolicy = useCallback(
    async (id: string): Promise<boolean> => {
      const index = accessPolicies.findIndex((p) => p.id === id);
      if (index === -1) {
        return false;
      }

      const updated = accessPolicies.filter((p) => p.id !== id);
      setAccessPolicies(updated);

      return true;
    },
    [accessPolicies]
  );

  // Permission requests management
  const approvePermissionRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      const index = permissionRequests.findIndex((r) => r.id === requestId);
      if (index === -1) {
        return false;
      }

      const request = permissionRequests[index];
      const updated: PermissionRequest = {
        ...request,
        status: 'approved',
        reviewedBy: 'current_user',
        reviewedByName: 'Current User',
        reviewedAt: new Date().toISOString()
      };

      const updatedRequests = [...permissionRequests];
      updatedRequests[index] = updated;
      setPermissionRequests(updatedRequests);

      // Apply the permissions
      await updatePermissions({
        userId: request.requestedBy,
        permissions: request.permissions,
        reason: `Approved permission request: ${request.reason}`
      });

      return true;
    },
    [permissionRequests, updatePermissions]
  );

  const rejectPermissionRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      const index = permissionRequests.findIndex((r) => r.id === requestId);
      if (index === -1) {
        return false;
      }

      const request = permissionRequests[index];
      const updated: PermissionRequest = {
        ...request,
        status: 'rejected',
        reviewedBy: 'current_user',
        reviewedByName: 'Current User',
        reviewedAt: new Date().toISOString()
      };

      const updatedRequests = [...permissionRequests];
      updatedRequests[index] = updated;
      setPermissionRequests(updatedRequests);

      return true;
    },
    [permissionRequests]
  );

  // Settings management
  const updateSettings = useCallback(
    async (updates: Partial<RBACSettings>): Promise<RBACSettings> => {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      return updated;
    },
    [settings]
  );

  // Statistics
  const stats = useMemo((): RBACStats => {
    const usersByRole = userRoleAssignments.reduce(
      (acc, assignment) => {
        acc[assignment.role] = (acc[assignment.role] || 0) + 1;
        return acc;
      },
      {} as Record<Role, number>
    );

    const expiringAssignments = userRoleAssignments.filter(
      (a) => a.expiresAt && new Date(a.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalUsers: userRoleAssignments.length,
      usersByRole,
      totalCustomRoles: customPermissionSets.length,
      activePolicies: accessPolicies.filter((p) => p.isActive).length,
      auditLogEntries: auditLogs.length,
      permissionChangesThisWeek: auditLogs.filter(
        (log) => new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      expiringAssignments
    };
  }, [userRoleAssignments, customPermissionSets, accessPolicies, auditLogs]);

  // Utility functions
  const getUsersByRole = useCallback(
    (role: Role): UserRoleAssignment[] => {
      return userRoleAssignments.filter((a) => a.role === role && a.isActive);
    },
    [userRoleAssignments]
  );

  const getPermissionsByCategory = useCallback((category: PermissionCategory): Permission[] => {
    const prefix = category.toLowerCase();
    return Object.values(Permission).filter((p) => p.startsWith(prefix));
  }, []);

  const getFilteredAuditLogs = useCallback(
    (filter?: { userId?: string; action?: string; startDate?: Date; endDate?: Date }): PermissionAuditLog[] => {
      let filtered = [...auditLogs];

      if (filter?.userId) {
        filtered = filtered.filter((log) => log.targetUserId === filter.userId || log.actorUserId === filter.userId);
      }

      if (filter?.action) {
        filtered = filtered.filter((log) => log.action === filter.action);
      }

      if (filter?.startDate) {
        filtered = filtered.filter((log) => new Date(log.timestamp) >= filter.startDate!);
      }

      if (filter?.endDate) {
        filtered = filtered.filter((log) => new Date(log.timestamp) <= filter.endDate!);
      }

      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    [auditLogs]
  );

  // Refresh functions
  const refreshUserRoleAssignments = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setUserRoleAssignments(generateMockUserRoleAssignments());
    setIsLoading(false);
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setAuditLogs(generateMockAuditLogs());
  }, []);

  const refreshStats = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Stats are computed from current state
  }, []);

  return {
    // State
    isLoading,
    rolePermissions,
    userRoleAssignments,
    customPermissionSets,
    accessPolicies,
    auditLogs,
    permissionRequests,
    settings,
    stats,

    // Permission checks
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Role hierarchy
    getRoleLevel,
    canAssignRole,
    isHigherRole,

    // User role management
    assignRole,
    revokeRole,
    updatePermissions,

    // Custom permission sets
    createCustomPermissionSet,
    updateCustomPermissionSet,
    deleteCustomPermissionSet,

    // Access policies
    createAccessPolicy,
    updateAccessPolicy,
    deleteAccessPolicy,

    // Permission requests
    approvePermissionRequest,
    rejectPermissionRequest,

    // Settings
    updateSettings,

    // Utility functions
    getUsersByRole,
    getPermissionsByCategory,
    getFilteredAuditLogs,

    // Refresh functions
    refreshUserRoleAssignments,
    refreshAuditLogs,
    refreshStats
  };
};
