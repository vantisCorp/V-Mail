import { useState, useCallback, useMemo } from 'react';
import { useNotifications } from './useNotifications';
import type {
  Delegation,
  DelegationPermission,
  DelegationStatus,
  DelegationStats,
  DelegationActivity,
  DelegationInvitation,
  GrantDelegationOptions,
  UpdateDelegationOptions,
  DelegationFilter,
  DelegationSort,
  DelegationAction,
  DelegationActivityType,
} from '../types/delegation';

const generateId = () => `del-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Hook for managing email delegation functionality
 * 
 * Provides comprehensive delegation capabilities including:
 * - Granting and revoking delegation access
 * - Permission management (send_as, send_on_behalf, manage)
 * - Activity tracking
 * - Invitation management
 */
export const useEmailDelegation = () => {
  const { addNotification } = useNotifications();
  
  // State
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [activities, setActivities] = useState<DelegationActivity[]>([]);
  const [invitations, setInvitations] = useState<DelegationInvitation[]>([]);
  const [delegatedEmails, setDelegatedEmails] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate statistics
  const stats = useMemo<DelegationStats>(() => {
    const activeDelegations = delegations.filter(d => d.status === 'active');
    const pendingDelegations = delegations.filter(d => d.status === 'pending');
    
    const permissionCounts = activeDelegations.reduce(
      (acc, d) => {
        if (d.permission === 'send_as') acc.sentAsCount++;
        else if (d.permission === 'send_on_behalf') acc.sendOnBehalfCount++;
        else if (d.permission === 'manage') acc.manageCount++;
        return acc;
      },
      { sentAsCount: 0, sendOnBehalfCount: 0, manageCount: 0 }
    );

    return {
      totalDelegations: delegations.length,
      activeDelegations: activeDelegations.length,
      pendingDelegations: pendingDelegations.length,
      ...permissionCounts,
      totalEmailsSent: delegatedEmails.length,
    };
  }, [delegations, delegatedEmails]);

  // Log activity
  const logActivity = useCallback(
    (
      delegationId: string,
      type: DelegationActivityType,
      performedBy: string,
      performedByName: string,
      actionDetails?: DelegationActivity['actionDetails']
    ) => {
      const activity: DelegationActivity = {
        id: generateId(),
        delegationId,
        type,
        performedBy,
        performedByName,
        actionDetails,
        timestamp: new Date().toISOString(),
      };
      setActivities(prev => [activity, ...prev].slice(0, 100));
    },
    []
  );

  // Grant delegation
  const grantDelegation = useCallback(
    (options: GrantDelegationOptions, currentUserId: string, currentUserName: string, currentUserEmail: string) => {
      const { delegateEmail, delegateName, delegateId, permission, allowedActions, folders, expiresAt, notes } = options;
      
      // Check if delegation already exists
      const existingDelegation = delegations.find(
        d => d.ownerId === currentUserId && d.delegateId === delegateId && !['revoked', 'expired'].includes(d.status)
      );
      
      if (existingDelegation) {
        addNotification('warning', `Delegation already exists for ${delegateName}`);
        return null;
      }
      
      const now = new Date().toISOString();
      const newDelegation: Delegation = {
        id: generateId(),
        ownerId: currentUserId,
        ownerName: currentUserName,
        ownerEmail: currentUserEmail,
        delegateId,
        delegateName,
        delegateEmail,
        permission,
        status: 'pending',
        grantedBy: currentUserId,
        grantedAt: now,
        expiresAt,
        allowedActions: allowedActions || getDefaultActions(permission),
        folders,
        notes,
      };
      
      // Create invitation
      const invitation: DelegationInvitation = {
        id: generateId(),
        ownerId: currentUserId,
        ownerName: currentUserName,
        ownerEmail: currentUserEmail,
        delegateEmail,
        permission,
        allowedActions: newDelegation.allowedActions,
        folders,
        expiresAt,
        status: 'pending',
        createdAt: now,
      };
      
      setDelegations(prev => [...prev, newDelegation]);
      setInvitations(prev => [...prev, invitation]);
      
      logActivity(newDelegation.id, 'delegation_granted', currentUserId, currentUserName);
      addNotification('success', `Delegation invitation sent to ${delegateName}`);
      
      return newDelegation;
    },
    [delegations, addNotification, logActivity]
  );

  // Accept delegation invitation
  const acceptDelegation = useCallback(
    (invitationId: string, delegateId: string, delegateName: string) => {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) {
        addNotification('error', 'Invitation not found');
        return;
      }
      
      const now = new Date().toISOString();
      
      // Update invitation
      setInvitations(prev =>
        prev.map(i => i.id === invitationId ? { ...i, status: 'active', acceptedAt: now } : i)
      );
      
      // Update delegation
      setDelegations(prev =>
        prev.map(d =>
          d.ownerId === invitation.ownerId && d.delegateEmail === invitation.delegateEmail
            ? { ...d, status: 'active', delegateId, delegateName, acceptedAt: now }
            : d
        )
      );
      
      logActivity(
        delegations.find(d => d.ownerId === invitation.ownerId)?.id || '',
        'delegation_accepted',
        delegateId,
        delegateName
      );
      
      addNotification('success', `You now have delegation access to ${invitation.ownerName}'s account`);
    },
    [invitations, delegations, addNotification, logActivity]
  );

  // Revoke delegation
  const revokeDelegation = useCallback(
    (delegationId: string, currentUserId: string, currentUserName: string) => {
      const delegation = delegations.find(d => d.id === delegationId);
      if (!delegation) {
        addNotification('error', 'Delegation not found');
        return;
      }
      
      setDelegations(prev =>
        prev.map(d => d.id === delegationId ? { ...d, status: 'revoked' } : d)
      );
      
      logActivity(delegationId, 'delegation_revoked', currentUserId, currentUserName);
      addNotification('success', `Delegation revoked for ${delegation.delegateName}`);
    },
    [delegations, addNotification, logActivity]
  );

  // Suspend delegation
  const suspendDelegation = useCallback(
    (delegationId: string, currentUserId: string, currentUserName: string) => {
      setDelegations(prev =>
        prev.map(d => d.id === delegationId ? { ...d, status: 'suspended' } : d)
      );
      
      logActivity(delegationId, 'delegation_suspended', currentUserId, currentUserName);
      addNotification('success', 'Delegation suspended');
    },
    [addNotification, logActivity]
  );

  // Resume delegation
  const resumeDelegation = useCallback(
    (delegationId: string, currentUserId: string, currentUserName: string) => {
      setDelegations(prev =>
        prev.map(d => d.id === delegationId ? { ...d, status: 'active' } : d)
      );
      
      logActivity(delegationId, 'delegation_resumed', currentUserId, currentUserName);
      addNotification('success', 'Delegation resumed');
    },
    [addNotification, logActivity]
  );

  // Update delegation permission
  const updateDelegation = useCallback(
    (options: UpdateDelegationOptions, currentUserId: string, currentUserName: string) => {
      const { delegationId, permission, allowedActions, folders, expiresAt, notes } = options;
      
      const delegation = delegations.find(d => d.id === delegationId);
      if (!delegation) {
        addNotification('error', 'Delegation not found');
        return;
      }
      
      const previousPermission = delegation.permission;
      
      setDelegations(prev =>
        prev.map(d => {
          if (d.id !== delegationId) return d;
          
          return {
            ...d,
            ...(permission && { permission }),
            ...(allowedActions && { allowedActions }),
            ...(folders && { folders }),
            ...(expiresAt && { expiresAt }),
            ...(notes !== undefined && { notes }),
          };
        })
      );
      
      if (permission && permission !== previousPermission) {
        logActivity(
          delegationId,
          'permission_changed',
          currentUserId,
          currentUserName,
          { previousPermission, newPermission: permission }
        );
      }
      
      addNotification('success', 'Delegation updated');
    },
    [delegations, addNotification, logActivity]
  );

  // Get delegations where user is the owner
  const getDelegationsOwned = useCallback(
    (userId: string): Delegation[] => {
      return delegations.filter(d => d.ownerId === userId);
    },
    [delegations]
  );

  // Get delegations where user is the delegate
  const getDelegationsAsDelegate = useCallback(
    (userId: string): Delegation[] => {
      return delegations.filter(d => d.delegateId === userId);
    },
    [delegations]
  );

  // Check if user has delegation permission
  const hasDelegationPermission = useCallback(
    (ownerId: string, delegateId: string, requiredPermission: DelegationPermission): boolean => {
      const delegation = delegations.find(
        d => d.ownerId === ownerId && d.delegateId === delegateId && d.status === 'active'
      );
      if (!delegation) return false;
      
      const permissionLevels: DelegationPermission[] = ['send_as', 'send_on_behalf', 'manage'];
      const userLevel = permissionLevels.indexOf(delegation.permission);
      const requiredLevel = permissionLevels.indexOf(requiredPermission);
      
      return userLevel >= requiredLevel;
    },
    [delegations]
  );

  // Check if action is allowed for delegate
  const isActionAllowed = useCallback(
    (delegationId: string, action: DelegationAction): boolean => {
      const delegation = delegations.find(d => d.id === delegationId && d.status === 'active');
      if (!delegation) return false;
      
      return delegation.allowedActions?.includes(action) ?? false;
    },
    [delegations]
  );

  // Get activities for a delegation
  const getDelegationActivities = useCallback(
    (delegationId: string): DelegationActivity[] => {
      return activities.filter(a => a.delegationId === delegationId);
    },
    [activities]
  );

  // Get pending invitations for a user
  const getPendingInvitations = useCallback(
    (email: string): DelegationInvitation[] => {
      return invitations.filter(i => i.delegateEmail === email && i.status === 'pending');
    },
    [invitations]
  );

  // Filter and sort delegations
  const getFilteredDelegations = useCallback(
    (filter?: DelegationFilter, sort?: DelegationSort): Delegation[] => {
      let result = [...delegations];
      
      if (filter) {
        if (filter.ownerId) {
          result = result.filter(d => d.ownerId === filter.ownerId);
        }
        if (filter.delegateId) {
          result = result.filter(d => d.delegateId === filter.delegateId);
        }
        if (filter.permission) {
          result = result.filter(d => d.permission === filter.permission);
        }
        if (filter.status) {
          result = result.filter(d => d.status === filter.status);
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          result = result.filter(d =>
            d.delegateName.toLowerCase().includes(searchLower) ||
            d.delegateEmail.toLowerCase().includes(searchLower) ||
            d.ownerName.toLowerCase().includes(searchLower)
          );
        }
      }
      
      if (sort) {
        result.sort((a, b) => {
          let comparison = 0;
          
          switch (sort.field) {
            case 'grantedAt':
              comparison = new Date(a.grantedAt).getTime() - new Date(b.grantedAt).getTime();
              break;
            case 'acceptedAt':
              comparison = new Date(a.acceptedAt || 0).getTime() - new Date(b.acceptedAt || 0).getTime();
              break;
            case 'lastActivityAt':
              comparison = new Date(a.lastActivityAt || 0).getTime() - new Date(b.lastActivityAt || 0).getTime();
              break;
            case 'delegateName':
              comparison = a.delegateName.localeCompare(b.delegateName);
              break;
          }
          
          return sort.order === 'asc' ? comparison : -comparison;
        });
      }
      
      return result;
    },
    [delegations]
  );

  // Record email sent through delegation
  const recordDelegatedEmail = useCallback(
    (delegationId: string, emailData: Partial<Delegation['id']>, sentBy: string, sentByName: string) => {
      logActivity(delegationId, 'email_sent', sentBy, sentByName);
    },
    [logActivity]
  );

  // Decline delegation invitation
  const declineDelegation = useCallback(
    (invitationId: string) => {
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) return;
      
      setInvitations(prev =>
        prev.map(i => i.id === invitationId ? { ...i, status: 'revoked' } : i)
      );
      
      setDelegations(prev =>
        prev.map(d =>
          d.ownerId === invitation.ownerId && d.delegateEmail === invitation.delegateEmail
            ? { ...d, status: 'revoked' }
            : d
        )
      );
      
      addNotification('info', 'Delegation invitation declined');
    },
    [invitations, addNotification]
  );

  return {
    // State
    delegations,
    activities,
    invitations,
    stats,
    isLoading,
    
    // Actions
    grantDelegation,
    acceptDelegation,
    revokeDelegation,
    suspendDelegation,
    resumeDelegation,
    updateDelegation,
    declineDelegation,
    recordDelegatedEmail,
    
    // Queries
    getDelegationsOwned,
    getDelegationsAsDelegate,
    hasDelegationPermission,
    isActionAllowed,
    getDelegationActivities,
    getPendingInvitations,
    getFilteredDelegations,
  };
};

// Helper function to get default actions based on permission
function getDefaultActions(permission: DelegationPermission): DelegationAction[] {
  switch (permission) {
    case 'send_as':
      return ['send_email'];
    case 'send_on_behalf':
      return ['send_email', 'read_emails'];
    case 'manage':
      return ['send_email', 'read_emails', 'delete_emails', 'organize_folders', 'manage_labels', 'view_attachments'];
    default:
      return ['send_email'];
  }
}