/**
 * Tests for useTeamAccounts Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTeamAccounts } from '../../src/hooks/useTeamAccounts';

// Mock useNotifications
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

describe('useTeamAccounts Hook', () => {
  const teamId = 'team-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTeamAccounts());

      expect(result.current.teamAccount).toBeNull();
      expect(result.current.members).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.activities).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Team Account Loading', () => {
    it('should load team account when teamId is provided', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.teamAccount).not.toBeNull();
      expect(result.current.teamAccount?.id).toBe('team-1');
      expect(result.current.teamAccount?.name).toBe('Vantis Corp');
    });

    it('should load members when teamId is provided', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      expect(result.current.members.length).toBe(5);
      expect(result.current.members[0].role).toBe('owner');
    });

    it('should load activities when teamId is provided', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(0);
      });

      expect(result.current.activities.length).toBe(5);
    });
  });

  describe('Team Account Actions', () => {
    it('should create a team account', async () => {
      const { result } = renderHook(() => useTeamAccounts());

      await act(async () => {
        const team = await result.current.createTeamAccount({
          name: 'New Team',
          slug: 'new-team',
          ownerId: 'user-1'
        });

        expect(team).not.toBeNull();
        expect(team?.name).toBe('New Team');
        expect(team?.slug).toBe('new-team');
      });

      expect(result.current.teamAccount).not.toBeNull();
    });

    it('should update a team account', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const updated = await result.current.updateTeamAccount(teamId, {
          name: 'Updated Team Name'
        });

        expect(updated).not.toBeNull();
      });

      expect(result.current.teamAccount?.name).toBe('Updated Team Name');
    });

    it('should delete a team account', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const deleted = await result.current.deleteTeamAccount(teamId);
        expect(deleted).toBe(true);
      });

      expect(result.current.teamAccount).toBeNull();
      expect(result.current.members).toEqual([]);
    });

    it('should regenerate invite link', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const link = await result.current.regenerateInviteLink(teamId);
        expect(link).not.toBeNull();
        expect(link).toContain('https://vmail.app/invite/');
      });
    });
  });

  describe('Member Actions', () => {
    it('should invite a new member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const invitation = await result.current.inviteMember({
          email: 'newuser@example.com',
          role: 'member'
        });

        expect(invitation).not.toBeNull();
        expect(invitation?.email).toBe('newuser@example.com');
        expect(invitation?.role).toBe('member');
        expect(invitation?.status).toBe('pending');
      });

      expect(result.current.invitations.length).toBe(1);
    });

    it('should remove a member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.members.length;
      const memberToRemove = result.current.members.find(m => m.role !== 'owner');

      await act(async () => {
        const removed = await result.current.removeMember(memberToRemove!.id);
        expect(removed).toBe(true);
      });

      expect(result.current.members.length).toBe(initialCount - 1);
    });

    it('should update a member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const memberToUpdate = result.current.members.find(m => m.role !== 'owner');

      await act(async () => {
        await result.current.updateMember(memberToUpdate!.id, {
          department: 'Engineering',
          jobTitle: 'Senior Developer'
        });
      });

      // Check the updated member in the state
      const updatedMember = result.current.members.find(m => m.id === memberToUpdate!.id);
      expect(updatedMember?.department).toBe('Engineering');
      expect(updatedMember?.jobTitle).toBe('Senior Developer');
    });

    it('should change member role', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const memberToUpdate = result.current.members.find(m => m.role === 'member');

      await act(async () => {
        const changed = await result.current.changeMemberRole(memberToUpdate!.id, 'manager');
        expect(changed).toBe(true);
      });

      const updatedMember = result.current.members.find(m => m.id === memberToUpdate!.id);
      expect(updatedMember?.role).toBe('manager');
    });

    it('should suspend a member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const memberToSuspend = result.current.members.find(m => m.status === 'active' && m.role !== 'owner');

      await act(async () => {
        const suspended = await result.current.suspendMember(memberToSuspend!.id);
        expect(suspended).toBe(true);
      });

      const suspendedMember = result.current.members.find(m => m.id === memberToSuspend!.id);
      expect(suspendedMember?.status).toBe('suspended');
    });

    it('should reactivate a suspended member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      // First suspend a member
      const memberToReactivate = result.current.members.find(m => m.status === 'active' && m.role !== 'owner');

      await act(async () => {
        await result.current.suspendMember(memberToReactivate!.id);
      });

      // Then reactivate
      await act(async () => {
        const reactivated = await result.current.reactivateMember(memberToReactivate!.id);
        expect(reactivated).toBe(true);
      });

      const reactivatedMember = result.current.members.find(m => m.id === memberToReactivate!.id);
      expect(reactivatedMember?.status).toBe('active');
    });
  });

  describe('Settings Actions', () => {
    it('should update team settings', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateSettings(teamId, {
          allowMemberInvites: false,
          requireApproval: false
        });
      });

      // Check the updated settings in the state
      expect(result.current.teamAccount?.settings.allowMemberInvites).toBe(false);
      expect(result.current.teamAccount?.settings.requireApproval).toBe(false);
    });

    it('should update password policy', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const updated = await result.current.updatePasswordPolicy(teamId, {
          minLength: 12,
          requireSpecialChars: true
        });

        expect(updated).toBe(true);
      });

      expect(result.current.teamAccount?.settings.passwordPolicy.minLength).toBe(12);
      expect(result.current.teamAccount?.settings.passwordPolicy.requireSpecialChars).toBe(true);
    });

    it('should update session policy', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const updated = await result.current.updateSessionPolicy(teamId, {
          maxDuration: 12,
          idleTimeout: 15
        });

        expect(updated).toBe(true);
      });

      expect(result.current.teamAccount?.settings.sessionPolicy.maxDuration).toBe(12);
      expect(result.current.teamAccount?.settings.sessionPolicy.idleTimeout).toBe(15);
    });
  });

  describe('Billing Actions', () => {
    it('should update plan', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        await result.current.updatePlan(teamId, 'enterprise');
      });

      expect(result.current.teamAccount?.billing.plan).toBe('enterprise');
    });

    it('should update payment method', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const updated = await result.current.updatePaymentMethod(teamId, {
          type: 'card',
          last4: '1234',
          brand: 'mastercard',
          expiryMonth: 6,
          expiryYear: 2026
        });

        expect(updated).toBe(true);
      });

      expect(result.current.teamAccount?.billing.paymentMethod.last4).toBe('1234');
      expect(result.current.teamAccount?.billing.paymentMethod.brand).toBe('mastercard');
    });

    it('should update billing contact', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        const updated = await result.current.updateBillingContact(teamId, {
          name: 'New Billing Contact',
          email: 'newbilling@company.com'
        });

        expect(updated).toBe(true);
      });

      expect(result.current.teamAccount?.billing.billingContact.name).toBe('New Billing Contact');
      expect(result.current.teamAccount?.billing.billingContact.email).toBe('newbilling@company.com');
    });
  });

  describe('Utility Functions', () => {
    it('should get members by role', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const admins = result.current.getMembersByRole('admin');
      expect(admins.length).toBe(1);
      expect(admins[0].role).toBe('admin');
    });

    it('should get members by status', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const activeMembers = result.current.getMembersByStatus('active');
      expect(activeMembers.length).toBeGreaterThan(0);
      activeMembers.forEach(m => expect(m.status).toBe('active'));
    });

    it('should get a specific member', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const member = result.current.members[0];
      const found = result.current.getMember(member.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(member.id);
    });

    it('should check if member has permission', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const owner = result.current.members.find(m => m.role === 'owner');
      const hasAllPermission = result.current.hasPermission(owner!.id, 'any_permission');

      expect(hasAllPermission).toBe(true);
    });

    it('should check if member can perform action', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const viewer = result.current.members.find(m => m.role === 'viewer');
      const canManageMembers = result.current.canPerformAction(viewer!.id, 'manage_members');
      const canViewEmails = result.current.canPerformAction(viewer!.id, 'view_emails');

      expect(canManageMembers).toBe(false);
      expect(canViewEmails).toBe(true);
    });

    it('should filter members', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const filtered = result.current.getFilteredMembers({
        role: ['admin', 'manager']
      });

      expect(filtered.length).toBe(2);
      filtered.forEach(m => {
        expect(['admin', 'manager']).toContain(m.role);
      });
    });

    it('should sort members', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      const sorted = result.current.getFilteredMembers({
        sortBy: 'name',
        sortOrder: 'asc'
      });

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should filter activities', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(0);
      });

      const filtered = result.current.getFilteredActivities({
        action: ['member_invited']
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(a => {
        expect(a.action).toBe('member_invited');
      });
    });

    it('should get stats', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      const stats = result.current.getStats(teamId);

      expect(stats).not.toBeNull();
      expect(stats?.totalMembers).toBe(5);
      expect(stats?.activeMembers).toBe(4);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh team account', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.teamAccount).not.toBeNull();
      });

      await act(async () => {
        await result.current.refreshTeamAccount();
      });

      expect(result.current.teamAccount).not.toBeNull();
    });

    it('should refresh members', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.members.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.refreshMembers();
      });

      expect(result.current.members.length).toBeGreaterThan(0);
    });

    it('should refresh activities', async () => {
      const { result } = renderHook(() => useTeamAccounts(teamId));

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.refreshActivities();
      });

      expect(result.current.activities.length).toBeGreaterThan(0);
    });
  });
});
