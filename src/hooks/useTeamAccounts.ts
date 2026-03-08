/**
 * useTeamAccounts Hook for V-Mail v1.2.0
 *
 * Comprehensive hook for team account management operations.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import type {
  TeamAccount,
  TeamMember,
  TeamInvitation,
  TeamSettings,
  TeamBilling,
  TeamStats,
  TeamActivity,
  CreateTeamAccountPayload,
  UpdateTeamAccountPayload,
  InviteMemberPayload,
  UpdateMemberPayload,
  TeamMemberFilter,
  TeamActivityFilter,
  TeamMemberRole,
  TeamMemberStatus
} from '../types/teamAccounts';

// Mock data for development
const generateMockTeamAccount = (): TeamAccount => {
  const now = new Date();
  const teamId = 'team-1';
  const ownerId = 'user-owner';

  const mockMembers: TeamMember[] = [
    {
      id: 'member-1',
      userId: ownerId,
      teamId,
      role: 'owner',
      status: 'active',
      email: 'owner@example.com',
      name: 'John Owner',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
      joinedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      lastActiveAt: now,
      permissions: ['all'],
      department: 'Executive',
      jobTitle: 'CEO'
    },
    {
      id: 'member-2',
      userId: 'user-admin',
      teamId,
      role: 'admin',
      status: 'active',
      email: 'admin@example.com',
      name: 'Jane Admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      joinedAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      permissions: ['manage_members', 'manage_settings', 'view_reports'],
      department: 'IT',
      jobTitle: 'IT Manager'
    },
    {
      id: 'member-3',
      userId: 'user-manager',
      teamId,
      role: 'manager',
      status: 'active',
      email: 'manager@example.com',
      name: 'Bob Manager',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
      joinedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      permissions: ['manage_members', 'view_reports'],
      department: 'Operations',
      jobTitle: 'Operations Manager'
    },
    {
      id: 'member-4',
      userId: 'user-member',
      teamId,
      role: 'member',
      status: 'active',
      email: 'member@example.com',
      name: 'Alice Member',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
      joinedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      permissions: ['send_emails', 'create_folders'],
      department: 'Sales',
      jobTitle: 'Sales Representative'
    },
    {
      id: 'member-5',
      userId: 'user-viewer',
      teamId,
      role: 'viewer',
      status: 'pending',
      email: 'viewer@example.com',
      name: 'Charlie Viewer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
      joinedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      permissions: ['view_emails'],
      department: 'Finance',
      jobTitle: 'Finance Analyst'
    }
  ];

  return {
    id: teamId,
    name: 'Vantis Corp',
    slug: 'vantis-corp',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=vantis',
    description: 'Technology company specializing in email solutions',
    website: 'https://vantis.com',
    industry: 'Technology',
    size: '11-50',
    ownerId,
    owner: mockMembers[0],
    createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    settings: {
      id: 'settings-1',
      teamId,
      allowMemberInvites: true,
      requireApproval: true,
      defaultRole: 'member',
      allowMemberCreation: true,
      allowFolderSharing: true,
      allowEmailDelegation: true,
      enforceTwoFactor: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordExpiry: 90
      },
      sessionPolicy: {
        maxDuration: 24,
        idleTimeout: 30,
        concurrentSessions: 3
      },
      retentionPolicy: {
        emailRetentionDays: 365,
        trashRetentionDays: 30,
        archiveAfterDays: 180
      },
      notificationSettings: {
        emailNotifications: true,
        securityAlerts: true,
        weeklyReports: true,
        memberActivity: false
      },
      updatedAt: now,
      updatedBy: ownerId
    },
    billing: {
      id: 'billing-1',
      teamId,
      plan: 'professional',
      status: 'active',
      memberLimit: 50,
      memberCount: 5,
      storageLimit: 100,
      storageUsed: 35.5,
      currentPeriodStart: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      amount: 99,
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025
      },
      billingContact: {
        name: 'John Owner',
        email: 'billing@vantis.com',
        phone: '+1-555-0123',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA'
      },
      invoices: [],
      createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      updatedAt: now
    },
    stats: {
      teamId,
      totalMembers: 5,
      activeMembers: 4,
      pendingInvitations: 1,
      suspendedMembers: 0,
      totalEmails: 15000,
      emailsThisMonth: 2500,
      storageUsed: 35.5,
      storageLimit: 100,
      activeFolders: 25,
      sharedFolders: 8,
      activeDelegations: 3,
      createdAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      updatedAt: now
    }
  };
};

const generateMockActivities = (): TeamActivity[] => {
  const now = new Date();
  const teamId = 'team-1';

  return [
    {
      id: 'activity-1',
      teamId,
      memberId: 'member-2',
      member: {} as TeamMember,
      action: 'member_invited',
      details: 'Invited charlie@example.com to join the team',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'activity-2',
      teamId,
      memberId: 'member-1',
      member: {} as TeamMember,
      action: 'settings_updated',
      details: 'Updated team security settings',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'activity-3',
      teamId,
      memberId: 'member-3',
      member: {} as TeamMember,
      action: 'folder_shared',
      details: 'Shared "Marketing Materials" folder with 3 members',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'activity-4',
      teamId,
      memberId: 'member-4',
      member: {} as TeamMember,
      action: 'email_delegated',
      details: 'Delegated email access to Jane Admin',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'activity-5',
      teamId,
      memberId: 'member-2',
      member: {} as TeamMember,
      action: 'member_role_changed',
      details: 'Changed Bob Manager\'s role from member to manager',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  ];
};

export interface UseTeamAccountsReturn {
  // State
  teamAccount: TeamAccount | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  activities: TeamActivity[];
  isLoading: boolean;
  error: string | null;

  // Team Account Actions
  createTeamAccount: (payload: CreateTeamAccountPayload) => Promise<TeamAccount | null>;
  updateTeamAccount: (teamId: string, payload: UpdateTeamAccountPayload) => Promise<TeamAccount | null>;
  deleteTeamAccount: (teamId: string) => Promise<boolean>;
  regenerateInviteLink: (teamId: string) => Promise<string | null>;

  // Member Actions
  inviteMember: (payload: InviteMemberPayload) => Promise<TeamInvitation | null>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  declineInvitation: (invitationId: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMember: (memberId: string, payload: UpdateMemberPayload) => Promise<TeamMember | null>;
  changeMemberRole: (memberId: string, role: TeamMemberRole) => Promise<boolean>;
  suspendMember: (memberId: string) => Promise<boolean>;
  reactivateMember: (memberId: string) => Promise<boolean>;

  // Settings Actions
  updateSettings: (teamId: string, settings: Partial<TeamSettings>) => Promise<TeamSettings | null>;
  updatePasswordPolicy: (teamId: string, policy: Partial<TeamSettings['passwordPolicy']>) => Promise<boolean>;
  updateSessionPolicy: (teamId: string, policy: Partial<TeamSettings['sessionPolicy']>) => Promise<boolean>;
  updateRetentionPolicy: (teamId: string, policy: Partial<TeamSettings['retentionPolicy']>) => Promise<boolean>;

  // Billing Actions
  updatePlan: (teamId: string, plan: TeamBilling['plan']) => Promise<TeamBilling | null>;
  updatePaymentMethod: (teamId: string, paymentMethod: TeamBilling['paymentMethod']) => Promise<boolean>;
  updateBillingContact: (teamId: string, contact: Partial<TeamBilling['billingContact']>) => Promise<boolean>;
  getInvoices: (teamId: string) => Promise<TeamBilling['invoices']>;

  // Utility Functions
  getMembersByRole: (role: TeamMemberRole) => TeamMember[];
  getMembersByStatus: (status: TeamMemberStatus) => TeamMember[];
  getMember: (memberId: string) => TeamMember | undefined;
  hasPermission: (memberId: string, permission: string) => boolean;
  canPerformAction: (memberId: string, action: string) => boolean;
  getFilteredMembers: (filter: TeamMemberFilter) => TeamMember[];
  getFilteredActivities: (filter: TeamActivityFilter) => TeamActivity[];
  getStats: (teamId: string) => TeamStats | null;

  // Refresh Functions
  refreshTeamAccount: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshActivities: () => Promise<void>;
}

export function useTeamAccounts(teamId?: string): UseTeamAccountsReturn {
  const [teamAccount, setTeamAccount] = useState<TeamAccount | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addNotification } = useNotifications();

  // Load initial data
  useEffect(() => {
    const loadTeamAccount = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockTeam = generateMockTeamAccount();
        setTeamAccount(mockTeam);
        setMembers([
          mockTeam.owner,
          {
            id: 'member-2',
            userId: 'user-admin',
            teamId: mockTeam.id,
            role: 'admin',
            status: 'active',
            email: 'admin@example.com',
            name: 'Jane Admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
            joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            permissions: ['manage_members', 'manage_settings', 'view_reports'],
            department: 'IT',
            jobTitle: 'IT Manager'
          },
          {
            id: 'member-3',
            userId: 'user-manager',
            teamId: mockTeam.id,
            role: 'manager',
            status: 'active',
            email: 'manager@example.com',
            name: 'Bob Manager',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
            joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            lastActiveAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            permissions: ['manage_members', 'view_reports'],
            department: 'Operations',
            jobTitle: 'Operations Manager'
          },
          {
            id: 'member-4',
            userId: 'user-member',
            teamId: mockTeam.id,
            role: 'member',
            status: 'active',
            email: 'member@example.com',
            name: 'Alice Member',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member',
            joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            permissions: ['send_emails', 'create_folders'],
            department: 'Sales',
            jobTitle: 'Sales Representative'
          },
          {
            id: 'member-5',
            userId: 'user-viewer',
            teamId: mockTeam.id,
            role: 'viewer',
            status: 'pending',
            email: 'viewer@example.com',
            name: 'Charlie Viewer',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lastActiveAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            permissions: ['view_emails'],
            department: 'Finance',
            jobTitle: 'Finance Analyst'
          }
        ]);
        setActivities(generateMockActivities());
      } catch (err) {
        setError('Failed to load team account');
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      loadTeamAccount();
    }
  }, [teamId]);

  // Team Account Actions
  const createTeamAccount = useCallback(async (payload: CreateTeamAccountPayload): Promise<TeamAccount | null> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newTeam: TeamAccount = {
        id: `team-${Date.now()}`,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        website: payload.website,
        industry: payload.industry,
        size: payload.size,
        ownerId: payload.ownerId,
        owner: {
          id: `member-${Date.now()}`,
          userId: payload.ownerId,
          teamId: `team-${Date.now()}`,
          role: 'owner',
          status: 'active',
          email: 'owner@example.com',
          name: 'Team Owner',
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          permissions: ['all']
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {} as TeamSettings,
        billing: {} as TeamBilling,
        stats: {} as TeamStats
      };

      setTeamAccount(newTeam);
      addNotification('success', `Team "${payload.name}" has been created successfully.`);

      return newTeam;
    } catch (err) {
      setError('Failed to create team account');
      addNotification('error', 'Failed to create team account. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const updateTeamAccount = useCallback(async (teamId: string, payload: UpdateTeamAccountPayload): Promise<TeamAccount | null> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          ...payload,
          updatedAt: new Date()
        };
      });

      addNotification('success', 'Team account has been updated successfully.');

      return teamAccount;
    } catch (err) {
      setError('Failed to update team account');
      addNotification('error', 'Failed to update team account. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, teamAccount]);

  const deleteTeamAccount = useCallback(async (teamId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setTeamAccount(null);
      setMembers([]);
      setInvitations([]);
      setActivities([]);

      addNotification('success', 'Team account has been deleted successfully.');

      return true;
    } catch (err) {
      setError('Failed to delete team account');
      addNotification('error', 'Failed to delete team account. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const regenerateInviteLink = useCallback(async (teamId: string): Promise<string | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newLink = `https://vmail.app/invite/${teamId}/${Date.now().toString(36)}`;

      addNotification('success', 'New invite link has been generated.');

      return newLink;
    } catch (err) {
      addNotification('error', 'Failed to generate invite link.');
      return null;
    }
  }, [addNotification]);

  // Member Actions
  const inviteMember = useCallback(async (payload: InviteMemberPayload): Promise<TeamInvitation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const invitation: TeamInvitation = {
        id: `invitation-${Date.now()}`,
        teamId: teamAccount?.id || '',
        email: payload.email,
        role: payload.role,
        invitedBy: 'current-user',
        invitedByMember: {} as TeamMember,
        status: 'pending',
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: payload.message
      };

      setInvitations(prev => [...prev, invitation]);

      addNotification('success', `Invitation has been sent to ${payload.email}.`);

      return invitation;
    } catch (err) {
      setError('Failed to send invitation');
      addNotification('error', 'Failed to send invitation. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, teamAccount]);

  const acceptInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setInvitations(prev => prev.map(inv =>
        inv.id === invitationId
          ? { ...inv, status: 'active' as TeamMemberStatus, acceptedAt: new Date() }
          : inv
      ));

      addNotification('success', 'You have joined the team successfully.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to accept invitation.');
      return false;
    }
  }, [addNotification]);

  const declineInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

      addNotification('info', 'The invitation has been declined.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to decline invitation.');
      return false;
    }
  }, [addNotification]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(prev => prev.filter(m => m.id !== memberId));

      addNotification('success', 'Member has been removed from the team.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to remove member.');
      return false;
    }
  }, [addNotification]);

  const updateMember = useCallback(async (memberId: string, payload: UpdateMemberPayload): Promise<TeamMember | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedMember: TeamMember | null = null;

      setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
          updatedMember = { ...m, ...payload };
          return updatedMember;
        }
        return m;
      }));

      addNotification('success', 'Member information has been updated.');

      return updatedMember;
    } catch (err) {
      addNotification('error', 'Failed to update member.');
      return null;
    }
  }, [addNotification]);

  const changeMemberRole = useCallback(async (memberId: string, role: TeamMemberRole): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role } : m
      ));

      addNotification('success', `Member role has been changed to ${role}.`);

      return true;
    } catch (err) {
      addNotification('error', 'Failed to change member role.');
      return false;
    }
  }, [addNotification]);

  const suspendMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: 'suspended' as TeamMemberStatus } : m
      ));

      addNotification('warning', 'Member has been suspended.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to suspend member.');
      return false;
    }
  }, [addNotification]);

  const reactivateMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, status: 'active' as TeamMemberStatus } : m
      ));

      addNotification('success', 'Member has been reactivated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to reactivate member.');
      return false;
    }
  }, [addNotification]);

  // Settings Actions
  const updateSettings = useCallback(async (teamId: string, settings: Partial<TeamSettings>): Promise<TeamSettings | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedSettings: TeamSettings | null = null;

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        updatedSettings = { ...prev.settings, ...settings, updatedAt: new Date() };
        return {
          ...prev,
          settings: updatedSettings!
        };
      });

      addNotification('success', 'Team settings have been updated.');

      return updatedSettings;
    } catch (err) {
      addNotification('error', 'Failed to update team settings.');
      return null;
    }
  }, [addNotification]);

  const updatePasswordPolicy = useCallback(async (teamId: string, policy: Partial<TeamSettings['passwordPolicy']>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          settings: {
            ...prev.settings,
            passwordPolicy: { ...prev.settings.passwordPolicy, ...policy }
          }
        };
      });

      addNotification('success', 'Password policy has been updated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to update password policy.');
      return false;
    }
  }, [addNotification]);

  const updateSessionPolicy = useCallback(async (teamId: string, policy: Partial<TeamSettings['sessionPolicy']>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          settings: {
            ...prev.settings,
            sessionPolicy: { ...prev.settings.sessionPolicy, ...policy }
          }
        };
      });

      addNotification('success', 'Session policy has been updated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to update session policy.');
      return false;
    }
  }, [addNotification]);

  const updateRetentionPolicy = useCallback(async (teamId: string, policy: Partial<TeamSettings['retentionPolicy']>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          settings: {
            ...prev.settings,
            retentionPolicy: { ...prev.settings.retentionPolicy, ...policy }
          }
        };
      });

      addNotification('success', 'Retention policy has been updated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to update retention policy.');
      return false;
    }
  }, [addNotification]);

  // Billing Actions
  const updatePlan = useCallback(async (teamId: string, plan: TeamBilling['plan']): Promise<TeamBilling | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedBilling: TeamBilling | null = null;

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        const planLimits: Record<TeamBilling['plan'], { members: number; storage: number; amount: number }> = {
          free: { members: 3, storage: 5, amount: 0 },
          starter: { members: 10, storage: 25, amount: 29 },
          professional: { members: 50, storage: 100, amount: 99 },
          enterprise: { members: 999999, storage: 1000, amount: 299 }
        };

        updatedBilling = {
          ...prev.billing,
          plan,
          memberLimit: planLimits[plan].members,
          storageLimit: planLimits[plan].storage,
          amount: planLimits[plan].amount
        };

        return {
          ...prev,
          billing: updatedBilling!
        };
      });

      addNotification('success', `Your plan has been changed to ${plan}.`);

      return updatedBilling;
    } catch (err) {
      addNotification('error', 'Failed to update plan.');
      return null;
    }
  }, [addNotification]);

  const updatePaymentMethod = useCallback(async (teamId: string, paymentMethod: TeamBilling['paymentMethod']): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          billing: {
            ...prev.billing,
            paymentMethod
          }
        };
      });

      addNotification('success', 'Payment method has been updated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to update payment method.');
      return false;
    }
  }, [addNotification]);

  const updateBillingContact = useCallback(async (teamId: string, contact: Partial<TeamBilling['billingContact']>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setTeamAccount(prev => {
        if (!prev) {
return null;
}
        return {
          ...prev,
          billing: {
            ...prev.billing,
            billingContact: {
              ...prev.billing.billingContact,
              ...contact
            }
          }
        };
      });

      addNotification('success', 'Billing contact has been updated.');

      return true;
    } catch (err) {
      addNotification('error', 'Failed to update billing contact.');
      return false;
    }
  }, [addNotification]);

  const getInvoices = useCallback(async (teamId: string): Promise<TeamBilling['invoices']> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return teamAccount?.billing.invoices || [];
  }, [teamAccount]);

  // Utility Functions
  const getMembersByRole = useCallback((role: TeamMemberRole): TeamMember[] => {
    return members.filter(m => m.role === role);
  }, [members]);

  const getMembersByStatus = useCallback((status: TeamMemberStatus): TeamMember[] => {
    return members.filter(m => m.status === status);
  }, [members]);

  const getMember = useCallback((memberId: string): TeamMember | undefined => {
    return members.find(m => m.id === memberId);
  }, [members]);

  const hasPermission = useCallback((memberId: string, permission: string): boolean => {
    const member = members.find(m => m.id === memberId);
    if (!member) {
return false;
}
    return member.permissions.includes('all') || member.permissions.includes(permission);
  }, [members]);

  const canPerformAction = useCallback((memberId: string, action: string): boolean => {
    const member = members.find(m => m.id === memberId);
    if (!member) {
return false;
}

    const actionPermissions: Record<string, TeamMemberRole[]> = {
      'manage_team': ['owner', 'admin'],
      'manage_members': ['owner', 'admin', 'manager'],
      'manage_settings': ['owner', 'admin'],
      'view_reports': ['owner', 'admin', 'manager'],
      'send_emails': ['owner', 'admin', 'manager', 'member'],
      'create_folders': ['owner', 'admin', 'manager', 'member'],
      'view_emails': ['owner', 'admin', 'manager', 'member', 'viewer']
    };

    const requiredRoles = actionPermissions[action];
    if (!requiredRoles) {
return false;
}

    return requiredRoles.includes(member.role);
  }, [members]);

  const getFilteredMembers = useCallback((filter: TeamMemberFilter): TeamMember[] => {
    let result = [...members];

    if (filter.status && filter.status.length > 0) {
      result = result.filter(m => filter.status!.includes(m.status));
    }

    if (filter.role && filter.role.length > 0) {
      result = result.filter(m => filter.role!.includes(m.role));
    }

    if (filter.department && filter.department.length > 0) {
      result = result.filter(m => m.department && filter.department!.includes(m.department));
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower) ||
        (m.department && m.department.toLowerCase().includes(searchLower))
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
          case 'role':
            comparison = a.role.localeCompare(b.role);
            break;
          case 'joinedAt':
            comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
            break;
          case 'lastActiveAt':
            comparison = new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime();
            break;
        }
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [members]);

  const getFilteredActivities = useCallback((filter: TeamActivityFilter): TeamActivity[] => {
    let result = [...activities];

    if (filter.action && filter.action.length > 0) {
      result = result.filter(a => filter.action!.includes(a.action));
    }

    if (filter.memberId && filter.memberId.length > 0) {
      result = result.filter(a => filter.memberId!.includes(a.memberId));
    }

    if (filter.dateFrom) {
      result = result.filter(a => new Date(a.timestamp) >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      result = result.filter(a => new Date(a.timestamp) <= filter.dateTo!);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(a =>
        a.action.toLowerCase().includes(searchLower) ||
        a.details.toLowerCase().includes(searchLower)
      );
    }

    if (filter.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (filter.sortBy) {
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'action':
            comparison = a.action.localeCompare(b.action);
            break;
        }
        return filter.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [activities]);

  const getStats = useCallback((teamId: string): TeamStats | null => {
    return teamAccount?.stats || null;
  }, [teamAccount]);

  // Refresh Functions
  const refreshTeamAccount = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setTeamAccount(generateMockTeamAccount());
    setIsLoading(false);
  }, []);

  const refreshMembers = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockTeam = generateMockTeamAccount();
    setMembers([mockTeam.owner]);
  }, []);

  const refreshActivities = useCallback(async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setActivities(generateMockActivities());
  }, []);

  return {
    teamAccount,
    members,
    invitations,
    activities,
    isLoading,
    error,

    createTeamAccount,
    updateTeamAccount,
    deleteTeamAccount,
    regenerateInviteLink,

    inviteMember,
    acceptInvitation,
    declineInvitation,
    removeMember,
    updateMember,
    changeMemberRole,
    suspendMember,
    reactivateMember,

    updateSettings,
    updatePasswordPolicy,
    updateSessionPolicy,
    updateRetentionPolicy,

    updatePlan,
    updatePaymentMethod,
    updateBillingContact,
    getInvoices,

    getMembersByRole,
    getMembersByStatus,
    getMember,
    hasPermission,
    canPerformAction,
    getFilteredMembers,
    getFilteredActivities,
    getStats,

    refreshTeamAccount,
    refreshMembers,
    refreshActivities
  };
}
