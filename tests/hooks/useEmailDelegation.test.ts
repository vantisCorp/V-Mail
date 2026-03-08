import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailDelegation } from '../../src/hooks/useEmailDelegation';
import type { DelegationPermission } from '../../src/types/delegation';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

describe('useEmailDelegation', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useEmailDelegation());

    expect(result.current.delegations).toEqual([]);
    expect(result.current.activities).toEqual([]);
    expect(result.current.invitations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats.totalDelegations).toBe(0);
    expect(result.current.stats.activeDelegations).toBe(0);
  });

  it('should grant delegation', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';
    const currentUserEmail = 'john@example.com';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        currentUserId,
        currentUserName,
        currentUserEmail
      );
    });

    expect(result.current.delegations).toHaveLength(1);
    expect(result.current.delegations[0].ownerId).toBe(currentUserId);
    expect(result.current.delegations[0].ownerName).toBe(currentUserName);
    expect(result.current.delegations[0].delegateId).toBe('user-2');
    expect(result.current.delegations[0].delegateName).toBe('Jane Smith');
    expect(result.current.delegations[0].permission).toBe('send_on_behalf');
    expect(result.current.delegations[0].status).toBe('pending');
  });

  it('should not grant duplicate delegation', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    // Try to grant the same delegation again
    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_as'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    expect(result.current.delegations).toHaveLength(1);
  });

  it('should accept delegation invitation', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const ownerId = 'user-1';
    const delegateId = 'user-2';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: delegateId,
          permission: 'send_on_behalf'
        },
        ownerId,
        'John Doe',
        'john@example.com'
      );
    });

    const invitation = result.current.invitations[0];

    act(() => {
      result.current.acceptDelegation(invitation.id, delegateId, 'Jane Smith');
    });

    expect(result.current.delegations[0].status).toBe('active');
    expect(result.current.delegations[0].acceptedAt).toBeDefined();
    expect(result.current.invitations[0].status).toBe('active');
  });

  it('should revoke delegation', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const currentUserId = 'user-1';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        currentUserId,
        'John Doe',
        'john@example.com'
      );
    });

    const delegationId = result.current.delegations[0].id;

    act(() => {
      result.current.revokeDelegation(delegationId, currentUserId, 'John Doe');
    });

    expect(result.current.delegations[0].status).toBe('revoked');
  });

  it('should suspend and resume delegation', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const currentUserId = 'user-1';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        currentUserId,
        'John Doe',
        'john@example.com'
      );
    });

    // Accept the delegation first
    const invitation = result.current.invitations[0];
    act(() => {
      result.current.acceptDelegation(invitation.id, 'user-2', 'Jane Smith');
    });

    const delegationId = result.current.delegations[0].id;

    // Suspend
    act(() => {
      result.current.suspendDelegation(delegationId, currentUserId, 'John Doe');
    });

    expect(result.current.delegations[0].status).toBe('suspended');

    // Resume
    act(() => {
      result.current.resumeDelegation(delegationId, currentUserId, 'John Doe');
    });

    expect(result.current.delegations[0].status).toBe('active');
  });

  it('should update delegation permission', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const currentUserId = 'user-1';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        currentUserId,
        'John Doe',
        'john@example.com'
      );
    });

    const delegationId = result.current.delegations[0].id;

    act(() => {
      result.current.updateDelegation(
        { delegationId, permission: 'manage' },
        currentUserId,
        'John Doe'
      );
    });

    expect(result.current.delegations[0].permission).toBe('manage');
  });

  it('should decline delegation invitation', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    const invitationId = result.current.invitations[0].id;

    act(() => {
      result.current.declineDelegation(invitationId);
    });

    expect(result.current.invitations[0].status).toBe('revoked');
    expect(result.current.delegations[0].status).toBe('revoked');
  });

  it('should get delegations owned by user', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const ownerId = 'user-1';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        ownerId,
        'John Doe',
        'john@example.com'
      );
    });

    const ownedDelegations = result.current.getDelegationsOwned(ownerId);

    expect(ownedDelegations).toHaveLength(1);
    expect(ownedDelegations[0].ownerId).toBe(ownerId);
  });

  it('should get delegations as delegate', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const delegateId = 'user-2';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: delegateId,
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    // Accept the delegation
    const invitation = result.current.invitations[0];
    act(() => {
      result.current.acceptDelegation(invitation.id, delegateId, 'Jane Smith');
    });

    const delegationsAsDelegate = result.current.getDelegationsAsDelegate(delegateId);

    expect(delegationsAsDelegate).toHaveLength(1);
    expect(delegationsAsDelegate[0].delegateId).toBe(delegateId);
  });

  it('should check delegation permission', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const ownerId = 'user-1';
    const delegateId = 'user-2';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: delegateId,
          permission: 'send_on_behalf'
        },
        ownerId,
        'John Doe',
        'john@example.com'
      );
    });

    // Before accepting, should not have permission
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'send_on_behalf')).toBe(false);

    // Accept the delegation
    const invitation = result.current.invitations[0];
    act(() => {
      result.current.acceptDelegation(invitation.id, delegateId, 'Jane Smith');
    });

    // Now should have permission for send_on_behalf
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'send_on_behalf')).toBe(true);
    // send_on_behalf (level 1) >= send_as (level 0), so should return true
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'send_as')).toBe(true);
    // But should not have manage permission (level 2)
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'manage')).toBe(false);
  });

  it('should check permission hierarchy correctly', () => {
    const { result } = renderHook(() => useEmailDelegation());
    const ownerId = 'user-1';
    const delegateId = 'user-2';

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: delegateId,
          permission: 'manage'
        },
        ownerId,
        'John Doe',
        'john@example.com'
      );
    });

    // Accept the delegation
    const invitation = result.current.invitations[0];
    act(() => {
      result.current.acceptDelegation(invitation.id, delegateId, 'Jane Smith');
    });

    // Manage permission should include all lower permissions
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'manage')).toBe(true);
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'send_on_behalf')).toBe(true);
    expect(result.current.hasDelegationPermission(ownerId, delegateId, 'send_as')).toBe(true);
  });

  it('should filter delegations', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );

      result.current.grantDelegation(
        {
          delegateEmail: 'bob@example.com',
          delegateName: 'Bob Johnson',
          delegateId: 'user-3',
          permission: 'manage'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    const filtered = result.current.getFilteredDelegations({ ownerId: 'user-1' });
    expect(filtered).toHaveLength(2);

    const searchFiltered = result.current.getFilteredDelegations({ search: 'Jane' });
    expect(searchFiltered).toHaveLength(1);
    expect(searchFiltered[0].delegateName).toBe('Jane Smith');
  });

  it('should sort delegations', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );

      result.current.grantDelegation(
        {
          delegateEmail: 'bob@example.com',
          delegateName: 'Bob Johnson',
          delegateId: 'user-3',
          permission: 'manage'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    const sorted = result.current.getFilteredDelegations(undefined, {
      field: 'delegateName',
      order: 'asc'
    });

    expect(sorted[0].delegateName).toBe('Bob Johnson');
    expect(sorted[1].delegateName).toBe('Jane Smith');
  });

  it('should update stats correctly', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    expect(result.current.stats.totalDelegations).toBe(1);
    expect(result.current.stats.activeDelegations).toBe(0);

    // Accept the delegation
    const invitation = result.current.invitations[0];
    act(() => {
      result.current.acceptDelegation(invitation.id, 'user-2', 'Jane Smith');
    });

    expect(result.current.stats.activeDelegations).toBe(1);
  });

  it('should log activities', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].type).toBe('delegation_granted');
    expect(result.current.activities[0].performedByName).toBe('John Doe');
  });

  it('should get pending invitations', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_on_behalf'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    const pending = result.current.getPendingInvitations('jane@example.com');

    expect(pending).toHaveLength(1);
    expect(pending[0].ownerName).toBe('John Doe');
  });

  it('should set default allowed actions based on permission', () => {
    const { result } = renderHook(() => useEmailDelegation());

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'jane@example.com',
          delegateName: 'Jane Smith',
          delegateId: 'user-2',
          permission: 'send_as'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    expect(result.current.delegations[0].allowedActions).toContain('send_email');
    expect(result.current.delegations[0].allowedActions?.length).toBe(1);

    act(() => {
      result.current.grantDelegation(
        {
          delegateEmail: 'bob@example.com',
          delegateName: 'Bob Johnson',
          delegateId: 'user-3',
          permission: 'manage'
        },
        'user-1',
        'John Doe',
        'john@example.com'
      );
    });

    const manageDelegation = result.current.delegations.find(d => d.delegateId === 'user-3');
    expect(manageDelegation?.allowedActions).toContain('send_email');
    expect(manageDelegation?.allowedActions).toContain('read_emails');
    expect(manageDelegation?.allowedActions).toContain('delete_emails');
    expect(manageDelegation?.allowedActions?.length).toBeGreaterThan(3);
  });
});
