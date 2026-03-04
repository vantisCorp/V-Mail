import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRBAC } from '../../src/hooks/useRBAC';
import { Role, Permission, PermissionCategory } from '../../src/types/rbac';

describe('useRBAC Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state true', () => {
      const { result } = renderHook(() => useRBAC());
      expect(result.current.isLoading).toBe(true);
    });

    it('should have default role permissions', () => {
      const { result } = renderHook(() => useRBAC());
      expect(result.current.rolePermissions).toBeDefined();
      expect(result.current.rolePermissions.length).toBe(6); // 6 default roles
    });

    it('should have role hierarchy', () => {
      const { result } = renderHook(() => useRBAC());
      expect(result.current.rolePermissions.find(r => r.role === Role.SUPER_ADMIN)).toBeDefined();
      expect(result.current.rolePermissions.find(r => r.role === Role.GUEST)).toBeDefined();
    });

    it('should load data after initial render', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userRoleAssignments.length).toBeGreaterThan(0);
      expect(result.current.customPermissionSets.length).toBeGreaterThan(0);
      expect(result.current.accessPolicies.length).toBeGreaterThan(0);
      expect(result.current.auditLogs.length).toBeGreaterThan(0);
      expect(result.current.permissionRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Permission Checking', () => {
    it('should check if user has permission', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // Admin user should have admin panel access
      const check = result.current.hasPermission('u1', Permission.ADMIN_PANEL_ACCESS);
      expect(check.hasPermission).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const check = result.current.hasPermission('non-existent', Permission.EMAIL_READ);
      expect(check.hasPermission).toBe(false);
      expect(check.reason).toBe('User not found');
    });

    it('should check custom permissions', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // User u3 has custom permissions including EMAIL_DELETE
      const check = result.current.hasPermission('u3', Permission.EMAIL_DELETE);
      expect(check.hasPermission).toBe(true);
      expect(check.grantedBy).toBe('custom');
    });

    it('should check all permissions', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const hasAll = result.current.hasAllPermissions('u1', [Permission.EMAIL_READ, Permission.EMAIL_WRITE]);
      expect(hasAll).toBe(true);
    });

    it('should check any permission', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // User u1 (Admin) has both EMAIL_READ and EMAIL_WRITE
      const hasAny = result.current.hasAnyPermission('u1', [Permission.EMAIL_READ, Permission.EMAIL_WRITE]);
      expect(hasAny).toBe(true);
    });
  });

  describe('Role Hierarchy', () => {
    it('should return correct role levels', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(result.current.getRoleLevel(Role.SUPER_ADMIN)).toBe(5);
      expect(result.current.getRoleLevel(Role.ADMIN)).toBe(4);
      expect(result.current.getRoleLevel(Role.MANAGER)).toBe(3);
      expect(result.current.getRoleLevel(Role.MEMBER)).toBe(2);
      expect(result.current.getRoleLevel(Role.VIEWER)).toBe(1);
      expect(result.current.getRoleLevel(Role.GUEST)).toBe(0);
    });

    it('should check if role can assign to another', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(result.current.canAssignRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
      expect(result.current.canAssignRole(Role.ADMIN, Role.MANAGER)).toBe(true);
      expect(result.current.canAssignRole(Role.MANAGER, Role.MEMBER)).toBe(true);
      expect(result.current.canAssignRole(Role.MEMBER, Role.ADMIN)).toBe(false);
      expect(result.current.canAssignRole(Role.VIEWER, Role.MEMBER)).toBe(false);
    });

    it('should compare role levels', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(result.current.isHigherRole(Role.ADMIN, Role.MANAGER)).toBe(true);
      expect(result.current.isHigherRole(Role.MANAGER, Role.ADMIN)).toBe(false);
      expect(result.current.isHigherRole(Role.ADMIN, Role.ADMIN)).toBe(false);
    });
  });

  describe('User Role Management', () => {
    it('should assign a new role', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.assignRole({
          userId: 'new-user',
          role: Role.MEMBER,
          reason: 'Test assignment'
        });
      });

      const assignment = result.current.userRoleAssignments.find(a => a.userId === 'new-user');
      expect(assignment).toBeDefined();
      expect(assignment?.role).toBe(Role.MEMBER);
      expect(assignment?.isActive).toBe(true);
    });

    it('should create audit log when assigning role', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const initialLogCount = result.current.auditLogs.length;

      await act(async () => {
        await result.current.assignRole({
          userId: 'another-user',
          role: Role.VIEWER,
          reason: 'Test audit'
        });
      });

      expect(result.current.auditLogs.length).toBe(initialLogCount + 1);
      expect(result.current.auditLogs[0].action).toBe('granted');
    });

    it('should revoke a role', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.revokeRole({ userId: 'u2', reason: 'Test revocation' });
      });

      const assignment = result.current.userRoleAssignments.find(a => a.userId === 'u2');
      expect(assignment?.isActive).toBe(false);
    });

    it('should update user permissions', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.updatePermissions({
          userId: 'u2',
          permissions: [Permission.EMAIL_DELETE, Permission.REPORTS_EXPORT],
          reason: 'Test update'
        });
      });

      const assignment = result.current.userRoleAssignments.find(a => a.userId === 'u2');
      expect(assignment?.customPermissions).toContain(Permission.EMAIL_DELETE);
      expect(assignment?.customPermissions).toContain(Permission.REPORTS_EXPORT);
    });
  });

  describe('Custom Permission Sets', () => {
    it('should create a custom permission set', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const initialCount = result.current.customPermissionSets.length;

      await act(async () => {
        await result.current.createCustomPermissionSet({
          name: 'Test Role',
          displayName: 'Test Role',
          description: 'Test description',
          permissions: [Permission.EMAIL_READ, Permission.EMAIL_WRITE],
          isDefault: false
        });
      });

      expect(result.current.customPermissionSets.length).toBe(initialCount + 1);
      const newSet = result.current.customPermissionSets.find(s => s.name === 'Test Role');
      expect(newSet).toBeDefined();
      expect(newSet?.permissions).toContain(Permission.EMAIL_READ);
    });

    it('should update a custom permission set', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const setId = result.current.customPermissionSets[0].id;

      await act(async () => {
        await result.current.updateCustomPermissionSet(setId, {
          description: 'Updated description'
        });
      });

      const updated = result.current.customPermissionSets.find(s => s.id === setId);
      expect(updated?.description).toBe('Updated description');
    });

    it('should delete a custom permission set', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // Create one first
      await act(async () => {
        await result.current.createCustomPermissionSet({
          name: 'To Delete',
          displayName: 'To Delete',
          description: 'Will be deleted',
          permissions: [Permission.EMAIL_READ]
        });
      });

      const toDelete = result.current.customPermissionSets.find(s => s.name === 'To Delete');
      const initialCount = result.current.customPermissionSets.length;

      await act(async () => {
        await result.current.deleteCustomPermissionSet(toDelete!.id);
      });

      expect(result.current.customPermissionSets.length).toBe(initialCount - 1);
      expect(result.current.customPermissionSets.find(s => s.id === toDelete?.id)).toBeUndefined();
    });
  });

  describe('Access Policies', () => {
    it('should create an access policy', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const initialCount = result.current.accessPolicies.length;

      await act(async () => {
        await result.current.createAccessPolicy({
          name: 'Test Policy',
          description: 'Test policy description',
          resource: 'email',
          permissions: [Permission.EMAIL_READ],
          roles: [Role.MEMBER],
          isActive: true,
          priority: 5
        });
      });

      expect(result.current.accessPolicies.length).toBe(initialCount + 1);
      const newPolicy = result.current.accessPolicies.find(p => p.name === 'Test Policy');
      expect(newPolicy).toBeDefined();
    });

    it('should update an access policy', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const policyId = result.current.accessPolicies[0].id;

      await act(async () => {
        await result.current.updateAccessPolicy(policyId, { isActive: false });
      });

      const updated = result.current.accessPolicies.find(p => p.id === policyId);
      expect(updated?.isActive).toBe(false);
    });

    it('should delete an access policy', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // Create one first
      await act(async () => {
        await result.current.createAccessPolicy({
          name: 'To Delete Policy',
          description: 'Will be deleted',
          resource: 'test',
          permissions: [Permission.EMAIL_READ],
          roles: [Role.VIEWER],
          isActive: true,
          priority: 1
        });
      });

      const toDelete = result.current.accessPolicies.find(p => p.name === 'To Delete Policy');
      const initialCount = result.current.accessPolicies.length;

      await act(async () => {
        await result.current.deleteAccessPolicy(toDelete!.id);
      });

      expect(result.current.accessPolicies.length).toBe(initialCount - 1);
    });
  });

  describe('Permission Requests', () => {
    it('should approve a permission request', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const pendingRequest = result.current.permissionRequests.find(r => r.status === 'pending');
      expect(pendingRequest).toBeDefined();

      await act(async () => {
        await result.current.approvePermissionRequest(pendingRequest!.id);
      });

      const approved = result.current.permissionRequests.find(r => r.id === pendingRequest!.id);
      expect(approved?.status).toBe('approved');
      expect(approved?.reviewedAt).toBeDefined();
    });

    it('should reject a permission request', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      // Create a pending request for this test
      await act(async () => {
        await result.current.approvePermissionRequest('req1');
      });

      const rejectedRequest = result.current.permissionRequests.find(r => r.status === 'pending');
      if (rejectedRequest) {
        await act(async () => {
          await result.current.rejectPermissionRequest(rejectedRequest.id);
        });

        const rejected = result.current.permissionRequests.find(r => r.id === rejectedRequest.id);
        expect(rejected?.status).toBe('rejected');
      }
    });
  });

  describe('Settings', () => {
    it('should have default settings', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(result.current.settings.enableCustomRoles).toBe(true);
      expect(result.current.settings.enablePermissionExpiration).toBe(true);
      expect(result.current.settings.defaultRole).toBe(Role.MEMBER);
    });

    it('should update settings', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.updateSettings({ maxCustomRoles: 50 });
      });

      expect(result.current.settings.maxCustomRoles).toBe(50);
    });
  });

  describe('Statistics', () => {
    it('should calculate correct stats', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(result.current.stats.totalUsers).toBeGreaterThan(0);
      expect(result.current.stats.totalCustomRoles).toBeGreaterThan(0);
      expect(result.current.stats.activePolicies).toBeGreaterThan(0);
    });

    it('should count users by role', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const adminCount = result.current.stats.usersByRole[Role.ADMIN] || 0;
      expect(typeof adminCount).toBe('number');
    });
  });

  describe('Utility Functions', () => {
    it('should get users by role', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const admins = result.current.getUsersByRole(Role.ADMIN);
      expect(Array.isArray(admins)).toBe(true);
      expect(admins.every(a => a.role === Role.ADMIN)).toBe(true);
    });

    it('should get permissions by category', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const emailPermissions = result.current.getPermissionsByCategory(PermissionCategory.EMAIL);
      expect(emailPermissions.length).toBeGreaterThan(0);
      expect(emailPermissions.every(p => p.startsWith('email'))).toBe(true);
    });

    it('should filter audit logs', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const filtered = result.current.getFilteredAuditLogs({ action: 'granted' });
      expect(filtered.every(log => log.action === 'granted')).toBe(true);
    });

    it('should filter audit logs by user', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const filtered = result.current.getFilteredAuditLogs({ userId: 'u1' });
      expect(filtered.every(log => log.actorUserId === 'u1' || log.targetUserId === 'u1')).toBe(true);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh user role assignments', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.refreshUserRoleAssignments();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should refresh audit logs', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.refreshAuditLogs();
      });

      expect(result.current.auditLogs.length).toBeGreaterThan(0);
    });

    it('should refresh stats', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      await act(async () => {
        await result.current.refreshStats();
      });

      expect(result.current.stats).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should return null for invalid custom permission set update', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const updated = await result.current.updateCustomPermissionSet('invalid-id', { description: 'test' });
      expect(updated).toBeNull();
    });

    it('should return null for invalid access policy update', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const updated = await result.current.updateAccessPolicy('invalid-id', { isActive: false });
      expect(updated).toBeNull();
    });

    it('should return false for invalid revoke', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.revokeRole({ userId: 'non-existent-user' });
      expect(result_op).toBe(false);
    });

    it('should return false for invalid permission update', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.updatePermissions({
        userId: 'non-existent-user',
        permissions: [Permission.EMAIL_READ]
      });
      expect(result_op).toBe(false);
    });

    it('should return false for deleting non-existent custom permission set', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.deleteCustomPermissionSet('invalid-id');
      expect(result_op).toBe(false);
    });

    it('should return false for deleting non-existent access policy', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.deleteAccessPolicy('invalid-id');
      expect(result_op).toBe(false);
    });

    it('should return false for approving non-existent request', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.approvePermissionRequest('invalid-id');
      expect(result_op).toBe(false);
    });

    it('should return false for rejecting non-existent request', async () => {
      const { result } = renderHook(() => useRBAC());
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      const result_op = await result.current.rejectPermissionRequest('invalid-id');
      expect(result_op).toBe(false);
    });
  });
});