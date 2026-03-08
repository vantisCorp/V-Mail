import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSharedFolders } from '../../src/hooks/useSharedFolders';
import type {
  SharedFolder,
  FolderPermission,
  ShareTargetType
} from '../../src/types/sharedFolders';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

describe('useSharedFolders', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useSharedFolders());

    expect(result.current.sharedFolders).toEqual([]);
    expect(result.current.activities).toEqual([]);
    expect(result.current.invitations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats).toEqual({
      totalSharedFolders: 0,
      totalParticipants: 0,
      foldersByPermission: { read: 0, write: 0, admin: 0 },
      pendingInvitations: 0,
      activeShares: 0
    });
  });

  it('should share a folder with a user', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          targetEmail: 'jane@example.com',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    expect(result.current.sharedFolders).toHaveLength(1);
    expect(result.current.sharedFolders[0].folderId).toBe(folderId);
    expect(result.current.sharedFolders[0].ownerId).toBe(currentUserId);
    expect(result.current.sharedFolders[0].ownerName).toBe(currentUserName);
    expect(result.current.sharedFolders[0].participants).toHaveLength(1);
    expect(result.current.sharedFolders[0].participants[0].targetName).toBe('Jane Smith');
    expect(result.current.sharedFolders[0].participants[0].permission).toBe('read');
    expect(result.current.sharedFolders[0].participants[0].status).toBe('pending');
  });

  it('should share a folder with a team', () => {
    const { result } = renderHook(() => useSharedFolders());

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'team',
          targetId: 'team-1',
          targetName: 'Engineering Team',
          permission: 'write'
        },
        'user-1',
        'John Doe'
      );
    });

    expect(result.current.sharedFolders).toHaveLength(1);
    expect(result.current.sharedFolders[0].participants[0].targetType).toBe('team');
    expect(result.current.sharedFolders[0].participants[0].targetName).toBe('Engineering Team');
    expect(result.current.sharedFolders[0].participants[0].permission).toBe('write');
  });

  it('should add multiple participants to a shared folder', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-3',
          targetName: 'Bob Johnson',
          permission: 'write'
        },
        currentUserId,
        currentUserName
      );
    });

    expect(result.current.sharedFolders).toHaveLength(1);
    expect(result.current.sharedFolders[0].participants).toHaveLength(2);
  });

  it('should not share folder with same target twice', () => {
    const { result } = renderHook(() => useSharedFolders());

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        'user-1',
        'John Doe'
      );
    });

    // Try to share with same user again
    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'write'
        },
        'user-1',
        'John Doe'
      );
    });

    expect(result.current.sharedFolders[0].participants).toHaveLength(1);
  });

  it('should unshare a folder from a participant', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    const participantId = result.current.sharedFolders[0].participants[0].id;

    act(() => {
      result.current.unshareFolder(folderId, participantId, currentUserId, currentUserName);
    });

    expect(result.current.sharedFolders[0].participants).toHaveLength(0);
    expect(result.current.sharedFolders[0].isShared).toBe(false);
  });

  it('should update participant permission', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    const participantId = result.current.sharedFolders[0].participants[0].id;

    act(() => {
      result.current.updatePermission(
        { folderId, participantId, newPermission: 'write' },
        currentUserId,
        currentUserName
      );
    });

    expect(result.current.sharedFolders[0].participants[0].permission).toBe('write');
  });

  it('should revoke access for a participant', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    const participantId = result.current.sharedFolders[0].participants[0].id;

    act(() => {
      result.current.revokeAccess(folderId, participantId, currentUserId, currentUserName);
    });

    expect(result.current.sharedFolders[0].participants[0].status).toBe('revoked');
  });

  it('should get folders shared with a user', () => {
    const { result } = renderHook(() => useSharedFolders());
    const userId = 'user-2';

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: userId,
          targetName: 'Jane Smith',
          permission: 'read'
        },
        'user-1',
        'John Doe'
      );
    });

    // Manually set participant status to accepted for this test
    // In real app, this would be done via acceptInvitation with proper invitation flow
    act(() => {
      result.current.sharedFolders[0].participants[0].status = 'accepted';
    });

    const sharedFolders = result.current.getFoldersSharedWithUser(userId);

    expect(sharedFolders).toHaveLength(1);
    expect(sharedFolders[0].folderId).toBe('folder-1');
  });

  it('should get folders owned by a user', () => {
    const { result } = renderHook(() => useSharedFolders());
    const ownerId = 'user-1';

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        ownerId,
        'John Doe'
      );
    });

    const ownedFolders = result.current.getFoldersOwnedByUser(ownerId);

    expect(ownedFolders).toHaveLength(1);
    expect(ownedFolders[0].ownerId).toBe(ownerId);
  });

  it('should get participants of a shared folder', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        'user-1',
        'John Doe'
      );
    });

    const participants = result.current.getFolderParticipants(folderId);

    expect(participants).toHaveLength(1);
    expect(participants[0].targetName).toBe('Jane Smith');
  });

  it('should check if user has permission', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const ownerId = 'user-1';
    const userId = 'user-2';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: userId,
          targetName: 'Jane Smith',
          permission: 'read'
        },
        ownerId,
        'John Doe'
      );
    });

    // Owner has all permissions
    expect(result.current.hasPermission(folderId, ownerId, 'admin')).toBe(true);
    expect(result.current.hasPermission(folderId, ownerId, 'write')).toBe(true);
    expect(result.current.hasPermission(folderId, ownerId, 'read')).toBe(true);

    // User with read permission
    expect(result.current.hasPermission(folderId, userId, 'read')).toBe(false); // Not accepted yet

    // Accept the invitation
    act(() => {
      const participant = result.current.sharedFolders[0].participants[0];
      // Manually update status for test
      result.current.sharedFolders[0].participants[0].status = 'accepted';
    });

    expect(result.current.hasPermission(folderId, userId, 'read')).toBe(true);
    expect(result.current.hasPermission(folderId, userId, 'write')).toBe(false);
    expect(result.current.hasPermission(folderId, userId, 'admin')).toBe(false);
  });

  it('should update folder information', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );
    });

    act(() => {
      result.current.updateFolderInfo(
        folderId,
        { folderName: 'New Folder Name', description: 'New description' },
        currentUserId,
        currentUserName
      );
    });

    expect(result.current.sharedFolders[0].folderName).toBe('New Folder Name');
    expect(result.current.sharedFolders[0].description).toBe('New description');
  });

  it('should filter shared folders', () => {
    const { result } = renderHook(() => useSharedFolders());
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );

      result.current.shareFolder(
        {
          folderId: 'folder-2',
          targetType: 'user',
          targetId: 'user-3',
          targetName: 'Bob Johnson',
          permission: 'write'
        },
        currentUserId,
        currentUserName
      );
    });

    const filtered = result.current.getFilteredFolders({ ownerId: currentUserId });

    expect(filtered).toHaveLength(2);

    const searchFiltered = result.current.getFilteredFolders({ search: 'Folder-1' });

    expect(searchFiltered).toHaveLength(1);
    expect(searchFiltered[0].folderId).toBe('folder-1');
  });

  it('should sort shared folders', () => {
    const { result } = renderHook(() => useSharedFolders());
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );

      result.current.shareFolder(
        {
          folderId: 'folder-2',
          targetType: 'user',
          targetId: 'user-3',
          targetName: 'Bob Johnson',
          permission: 'write'
        },
        currentUserId,
        currentUserName
      );
    });

    const sorted = result.current.getFilteredFolders(undefined, {
      field: 'folderName',
      order: 'desc'
    });

    expect(sorted[0].folderId).toBe('folder-2');
    expect(sorted[1].folderId).toBe('folder-1');
  });

  it('should update stats correctly', () => {
    const { result } = renderHook(() => useSharedFolders());
    const currentUserId = 'user-1';
    const currentUserName = 'John Doe';

    act(() => {
      result.current.shareFolder(
        {
          folderId: 'folder-1',
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        currentUserId,
        currentUserName
      );

      result.current.shareFolder(
        {
          folderId: 'folder-2',
          targetType: 'user',
          targetId: 'user-3',
          targetName: 'Bob Johnson',
          permission: 'write'
        },
        currentUserId,
        currentUserName
      );
    });

    expect(result.current.stats.totalSharedFolders).toBe(2);
    expect(result.current.stats.totalParticipants).toBe(0); // No accepted invitations yet
    expect(result.current.stats.pendingInvitations).toBe(2);
  });

  it('should log activities', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';

    act(() => {
      result.current.shareFolder(
        {
          folderId,
          targetType: 'user',
          targetId: 'user-2',
          targetName: 'Jane Smith',
          permission: 'read'
        },
        'user-1',
        'John Doe'
      );
    });

    const activities = result.current.getFolderActivities(folderId);

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('shared');
    expect(activities[0].performedByName).toBe('John Doe');
  });

  it('should keep only last 100 activities', () => {
    const { result } = renderHook(() => useSharedFolders());
    const folderId = 'folder-1';

    // Create 105 activities
    for (let i = 0; i < 105; i++) {
      act(() => {
        result.current.shareFolder(
          {
            folderId: `folder-${i}`,
            targetType: 'user',
            targetId: `user-${i}`,
            targetName: `User ${i}`,
            permission: 'read'
          },
          'user-1',
            'John Doe'
        );
      });
    }

    expect(result.current.activities.length).toBeLessThanOrEqual(100);
  });
});
