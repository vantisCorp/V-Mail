# Role-Based Access Control (RBAC) Documentation

## Overview

Role-Based Access Control (RBAC) provides granular permission management for users and resources in V-Mail. This feature enables administrators to define roles, assign permissions, and control access to various system resources.

---

## Features

### 1. Role Hierarchy

V-Mail implements a 6-level role hierarchy:

| Level | Role | Description |
|-------|------|-------------|
| 5 | Super Admin | Full system access, all permissions |
| 4 | Admin | Administrative access, user management |
| 3 | Manager | Team management, member invites |
| 2 | Member | Standard team member |
| 1 | Viewer | Read-only access |
| 0 | Guest | Limited email access |

### 2. Permission Categories

Permissions are organized into 8 categories:

#### Email Permissions
- `email:read` - Read emails
- `email:write` - Create/edit emails
- `email:send` - Send emails
- `email:delete` - Delete emails
- `email:archive` - Archive emails
- `email:forward` - Forward emails
- `email:reply` - Reply to emails

#### Contacts Permissions
- `contacts:read` - View contacts
- `contacts:write` - Create/edit contacts
- `contacts:delete` - Delete contacts
- `contacts:import` - Import contacts
- `contacts:export` - Export contacts

#### Calendar Permissions
- `calendar:read` - View calendar
- `calendar:write` - Create/edit events
- `calendar:share` - Share calendars
- `calendar:delete` - Delete events

#### Settings Permissions
- `settings:read` - View settings
- `settings:write` - Modify settings
- `settings:manage` - Manage settings

#### Team Permissions
- `team:read` - View team info
- `team:manage` - Manage team
- `team:invite` - Invite members
- `team:remove` - Remove members
- `team:assign_roles` - Assign roles

#### Admin Permissions
- `admin:panel_access` - Access admin panel
- `admin:user_manage` - Manage users
- `admin:audit_logs` - View audit logs
- `admin:system_config` - Configure system
- `admin:billing` - Manage billing

#### Reports Permissions
- `reports:view` - View reports
- `reports:export` - Export reports
- `reports:analytics` - Access analytics

#### Integrations Permissions
- `integrations:read` - View integrations
- `integrations:connect` - Connect integrations
- `integrations:disconnect` - Disconnect integrations
- `integrations:manage` - Manage integrations

### 3. Custom Permission Sets

Create custom permission sets for specific use cases:

```typescript
const { createCustomPermissionSet } = useRBAC();

await createCustomPermissionSet({
  name: 'Support Agent',
  displayName: 'Support Agent',
  description: 'Support team with email and contacts access',
  permissions: [
    Permission.EMAIL_READ,
    Permission.EMAIL_WRITE,
    Permission.EMAIL_SEND,
    Permission.CONTACTS_READ,
    Permission.CONTACTS_WRITE
  ],
  isDefault: false
});
```

### 4. Access Policies

Define access policies for resources:

```typescript
const { createAccessPolicy } = useRBAC();

await createAccessPolicy({
  name: 'Team Manager Policy',
  description: 'Access policy for team managers',
  resource: 'team',
  permissions: [Permission.TEAM_READ, Permission.TEAM_MANAGE, Permission.TEAM_INVITE],
  roles: [Role.MANAGER],
  isActive: true,
  priority: 1
});
```

### 5. Permission Requests

Users can request additional permissions:

```typescript
// User requests permissions
const request: PermissionRequest = {
  requestedBy: 'user-123',
  permissions: [Permission.REPORTS_EXPORT],
  reason: 'Need to export monthly reports'
};

// Admin approves/rejects
await approvePermissionRequest(requestId);
// or
await rejectPermissionRequest(requestId);
```

---

## Usage Examples

### Example 1: Check User Permission
```typescript
import { useRBAC, Permission } from '../hooks/useRBAC';

function DeleteEmailButton({ emailId }) {
  const { hasPermission } = useRBAC();
  const userId = getCurrentUserId();

  const canDelete = hasPermission(userId, Permission.EMAIL_DELETE);

  return (
    <button disabled={!canDelete.hasPermission}>
      Delete Email
    </button>
  );
}
```

### Example 2: Assign Role to User
```typescript
function RoleAssigner({ userId }) {
  const { assignRole, canAssignRole, rolePermissions } = useRBAC();
  const currentRole = getCurrentUserRole();

  const handleAssignRole = async (newRole: Role) => {
    if (canAssignRole(currentRole, newRole)) {
      await assignRole({
        userId,
        role: newRole,
        reason: 'Role update request'
      });
    } else {
      alert('You do not have permission to assign this role');
    }
  };

  return (
    <select onChange={(e) => handleAssignRole(e.target.value)}>
      {rolePermissions.map(rp => (
        <option key={rp.role} value={rp.role}>
          {rp.displayName}
        </option>
      ))}
    </select>
  );
}
```

### Example 3: Get Users by Role
```typescript
function TeamMembersList() {
  const { getUsersByRole, Role } = useRBAC();
  const managers = getUsersByRole(Role.MANAGER);
  const members = getUsersByRole(Role.MEMBER);

  return (
    <div>
      <h3>Managers</h3>
      {managers.map(m => <span key={m.id}>{m.userName}</span>)}
      
      <h3>Members</h3>
      {members.map(m => <span key={m.id}>{m.userName}</span>)}
    </div>
  );
}
```

### Example 4: Audit Permission Changes
```typescript
function PermissionAuditViewer() {
  const { getFilteredAuditLogs } = useRBAC();
  
  const recentChanges = getFilteredAuditLogs({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    action: 'granted'
  });

  return (
    <div>
      {recentChanges.map(log => (
        <div key={log.id}>
          <strong>{log.actorUserName}</strong> {log.action} 
          permissions to <strong>{log.targetUserName}</strong>
          <span>{new Date(log.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### Hook: `useRBAC`

#### State
- `isLoading: boolean` - Loading state
- `rolePermissions: RolePermissions[]` - Default role permissions
- `userRoleAssignments: UserRoleAssignment[]` - User role assignments
- `customPermissionSets: CustomPermissionSet[]` - Custom permission sets
- `accessPolicies: AccessPolicy[]` - Access policies
- `auditLogs: PermissionAuditLog[]` - Audit logs
- `permissionRequests: PermissionRequest[]` - Permission requests
- `settings: RBACSettings` - RBAC settings
- `stats: RBACStats` - Statistics

#### Permission Checking Methods
- `hasPermission(userId: string, permission: Permission): PermissionCheck`
- `hasAllPermissions(userId: string, permissions: Permission[]): boolean`
- `hasAnyPermission(userId: string, permissions: Permission[]): boolean`

#### Role Hierarchy Methods
- `getRoleLevel(role: Role): number`
- `canAssignRole(assignerRole: Role, targetRole: Role): boolean`
- `isHigherRole(role1: Role, role2: Role): boolean`

#### User Role Management Methods
- `assignRole(payload: AssignRolePayload): Promise<UserRoleAssignment | null>`
- `revokeRole(payload: RevokeRolePayload): Promise<boolean>`
- `updatePermissions(payload: UpdatePermissionsPayload): Promise<boolean>`

#### Custom Permission Sets Methods
- `createCustomPermissionSet(payload: CreateRolePayload): Promise<CustomPermissionSet | null>`
- `updateCustomPermissionSet(id: string, payload: UpdateRolePayload): Promise<CustomPermissionSet | null>`
- `deleteCustomPermissionSet(id: string): Promise<boolean>`

#### Access Policies Methods
- `createAccessPolicy(policy: Omit<AccessPolicy, 'id'>): Promise<AccessPolicy | null>`
- `updateAccessPolicy(id: string, updates: Partial<AccessPolicy>): Promise<AccessPolicy | null>`
- `deleteAccessPolicy(id: string): Promise<boolean>`

#### Permission Requests Methods
- `approvePermissionRequest(requestId: string): Promise<boolean>`
- `rejectPermissionRequest(requestId: string): Promise<boolean>`

#### Utility Methods
- `getUsersByRole(role: Role): UserRoleAssignment[]`
- `getPermissionsByCategory(category: PermissionCategory): Permission[]`
- `getFilteredAuditLogs(filter?: AuditLogFilter): PermissionAuditLog[]`

---

## Types

```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

enum Permission {
  EMAIL_READ = 'email:read',
  EMAIL_WRITE = 'email:write',
  // ... (35+ permissions)
}

interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  grantedBy?: 'role' | 'custom' | 'explicit';
}

interface UserRoleAssignment {
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
```

---

## Best Practices

1. **Use role hierarchy** - Assign roles based on user responsibilities
2. **Implement custom permissions sparingly** - Prefer default roles for maintainability
3. **Enable audit logging** - Track all permission changes for compliance
4. **Set expiration dates** - Use temporary role assignments for contractors
5. **Require approval** - Enable approval workflow for role changes in production

---

## Security Considerations

- Always verify permissions on the server side
- Implement rate limiting for permission checks
- Log all permission changes for audit trails
- Use role expiration for temporary access
- Regularly audit user permissions

---

## Support

For issues or questions related to RBAC:
1. Check the [main documentation](../RELEASE_v1.2.0.md)
2. Review the [API reference](#api-reference)
3. Contact the development team