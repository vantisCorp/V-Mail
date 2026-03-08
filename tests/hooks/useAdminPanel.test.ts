/**
 * Tests for useAdminPanel Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminPanel } from '../../src/hooks/useAdminPanel';

// Mock useNotifications
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

describe('useAdminPanel Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAdminPanel());

      expect(result.current.users).toEqual([]);
      expect(result.current.auditLogs).toEqual([]);
      expect(result.current.systemStatus).toBeNull();
      expect(result.current.alerts).toEqual([]);
      expect(result.current.stats).toBeNull();
      expect(result.current.settings).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should load users on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      expect(result.current.users.length).toBe(5);
    });

    it('should load audit logs on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      expect(result.current.auditLogs.length).toBe(5);
    });

    it('should load system status on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.systemStatus).not.toBeNull();
      });

      expect(result.current.systemStatus?.overall).toBe('healthy');
      expect(result.current.systemStatus?.services.length).toBe(5);
    });

    it('should load alerts on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      });

      expect(result.current.alerts.length).toBe(3);
    });

    it('should load stats on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull();
      });

      expect(result.current.stats?.totalUsers).toBe(1250);
      expect(result.current.stats?.activeUsers).toBe(980);
    });

    it('should load settings on mount', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.settings).not.toBeNull();
      });

      expect(result.current.settings?.maxUsersPerTeam).toBe(50);
      expect(result.current.settings?.requireEmailVerification).toBe(true);
    });
  });

  describe('User Management', () => {
    it('should create a new user', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.users.length;

      await act(async () => {
        const user = await result.current.createUser({
          email: 'newuser@test.com',
          name: 'New User',
          role: 'support'
        });

        expect(user).not.toBeNull();
        expect(user?.email).toBe('newuser@test.com');
        expect(user?.name).toBe('New User');
      });

      expect(result.current.users.length).toBe(initialCount + 1);
    });

    it('should update a user', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const userToUpdate = result.current.users[0];

      await act(async () => {
        await result.current.updateUser(userToUpdate.id, {
          name: 'Updated Name'
        });
      });

      const updatedUser = result.current.users.find(u => u.id === userToUpdate.id);
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should delete a user', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.users.length;
      const userToDelete = result.current.users[result.current.users.length - 1];

      await act(async () => {
        const deleted = await result.current.deleteUser(userToDelete.id);
        expect(deleted).toBe(true);
      });

      expect(result.current.users.length).toBe(initialCount - 1);
    });

    it('should suspend a user', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const userToSuspend = result.current.users.find(u => u.status === 'active');

      await act(async () => {
        const suspended = await result.current.suspendUser(userToSuspend!.id);
        expect(suspended).toBe(true);
      });

      const suspendedUser = result.current.users.find(u => u.id === userToSuspend!.id);
      expect(suspendedUser?.status).toBe('suspended');
    });

    it('should reactivate a user', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      // First suspend a user
      const userToReactivate = result.current.users.find(u => u.status === 'active');

      await act(async () => {
        await result.current.suspendUser(userToReactivate!.id);
      });

      // Then reactivate
      await act(async () => {
        const reactivated = await result.current.reactivateUser(userToReactivate!.id);
        expect(reactivated).toBe(true);
      });

      const reactivatedUser = result.current.users.find(u => u.id === userToReactivate!.id);
      expect(reactivatedUser?.status).toBe('active');
    });

    it('should bulk delete users', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const usersToDelete = result.current.users.slice(0, 2).map(u => u.id);

      await act(async () => {
        const result_data = await result.current.bulkDeleteUsers(usersToDelete);
        expect(result_data.successful.length).toBe(2);
      });

      // Verify users are deleted
      const remainingUsers = result.current.users.filter(u => !usersToDelete.includes(u.id));
      expect(result.current.users.length).toBe(remainingUsers.length);
    });
  });

  describe('Audit Logs', () => {
    it('should get audit logs', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      const logs = await result.current.getAuditLogs();
      expect(logs.length).toBe(5);
    });

    it('should get a specific audit log', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      const log = await result.current.getAuditLog('log-1');
      expect(log).not.toBeNull();
      expect(log?.action).toBe('user_create');
    });
  });

  describe('System Operations', () => {
    it('should get system status', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.systemStatus).not.toBeNull();
      });

      const status = await result.current.getSystemStatus();
      expect(status.overall).toBe('healthy');
      expect(status.services.length).toBe(5);
    });

    it('should get system metrics', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.systemMetrics.length).toBeGreaterThan(0);
      });

      const metrics = await result.current.getSystemMetrics(12);
      expect(metrics.length).toBe(12);
    });

    it('should get alerts', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      });

      const alerts = await result.current.getAlerts();
      expect(alerts.length).toBe(3);
    });

    it('should resolve an alert', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      });

      const alertToResolve = result.current.alerts.find(a => !a.isResolved);

      await act(async () => {
        const resolved = await result.current.resolveAlert(alertToResolve!.id);
        expect(resolved).toBe(true);
      });

      const resolvedAlert = result.current.alerts.find(a => a.id === alertToResolve!.id);
      expect(resolvedAlert?.isResolved).toBe(true);
    });

    it('should dismiss an alert', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      });

      const alertToDismiss = result.current.alerts.find(a => !a.isRead);

      await act(async () => {
        const dismissed = await result.current.dismissAlert(alertToDismiss!.id);
        expect(dismissed).toBe(true);
      });

      const dismissedAlert = result.current.alerts.find(a => a.id === alertToDismiss!.id);
      expect(dismissedAlert?.isRead).toBe(true);
    });
  });

  describe('Settings', () => {
    it('should get settings', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.settings).not.toBeNull();
      });

      const settings = await result.current.getSettings();
      expect(settings.maxUsersPerTeam).toBe(50);
    });

    it('should update settings', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.settings).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateSettings({
          maxUsersPerTeam: 100
        });
      });

      expect(result.current.settings?.maxUsersPerTeam).toBe(100);
    });
  });

  describe('Statistics', () => {
    it('should get stats', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.stats).not.toBeNull();
      });

      const stats = await result.current.getStats();
      expect(stats.totalUsers).toBe(1250);
      expect(stats.activeUsers).toBe(980);
    });
  });

  describe('Maintenance', () => {
    it('should schedule maintenance', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await act(async () => {
        const maintenance = await result.current.scheduleMaintenance({
          title: 'Scheduled Maintenance',
          description: 'System upgrade',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          status: 'scheduled',
          affectedServices: ['API', 'Database'],
          createdBy: 'admin'
        });

        expect(maintenance).not.toBeNull();
        expect(maintenance?.title).toBe('Scheduled Maintenance');
      });
    });

    it('should cancel maintenance', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await act(async () => {
        const cancelled = await result.current.cancelMaintenance('maintenance-1');
        expect(cancelled).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should filter users', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const filtered = result.current.getFilteredUsers({
        status: ['active']
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(u => expect(u.status).toBe('active'));
    });

    it('should sort users', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const sorted = result.current.getFilteredUsers({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should filter audit logs', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      const filtered = result.current.getFilteredAuditLogs({
        severity: ['critical']
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(l => expect(l.severity).toBe('critical'));
    });

    it('should search users', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const results = result.current.searchUsers('admin');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Export Functions', () => {
    it('should export users as JSON', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const exported = await result.current.exportUsers({
        format: 'json',
        fields: ['name', 'email']
      });

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('email');
    });

    it('should export users as CSV', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      const exported = await result.current.exportUsers({
        format: 'csv',
        fields: ['name', 'email']
      });

      expect(exported).toContain('name,email');
    });

    it('should export audit logs', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      const exported = await result.current.exportAuditLogs({
        format: 'json',
        fields: ['action', 'severity', 'timestamp']
      });

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh users', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.users.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.refreshUsers();
      });

      expect(result.current.users.length).toBeGreaterThan(0);
    });

    it('should refresh audit logs', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.auditLogs.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.refreshAuditLogs();
      });

      expect(result.current.auditLogs.length).toBeGreaterThan(0);
    });

    it('should refresh system status', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.systemStatus).not.toBeNull();
      });

      await act(async () => {
        await result.current.refreshSystemStatus();
      });

      expect(result.current.systemStatus).not.toBeNull();
    });

    it('should refresh alerts', async () => {
      const { result } = renderHook(() => useAdminPanel());

      await waitFor(() => {
        expect(result.current.alerts.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.refreshAlerts();
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);
    });
  });
});
