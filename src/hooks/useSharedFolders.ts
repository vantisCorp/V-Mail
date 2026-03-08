import { useState, useCallback, useMemo } from 'react';
import { useNotifications } from './useNotifications';
import type {
  SharedFolder,
  SharedFolderParticipant,
  SharedFolderStats,
  SharedFolderActivity,
  ShareInvitation,
  FolderPermission,
  ShareTargetType,
  ShareStatus,
  ShareFolderOptions,
  UpdatePermissionOptions,
  SharedFolderFilter,
  SharedFolderSort
} from '../types/sharedFolders';

const generateId = () => `sf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Hook for managing shared folders functionality
 *
 * Provides comprehensive folder sharing capabilities including:
 * - Sharing folders with users and teams
 * - Permission management (read, write, admin)
 * - Activity tracking
 * - Invitation management
 */
export const useSharedFolders = () => {
  const { addNotification } = useNotifications();

  // State
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [activities, setActivities] = useState<SharedFolderActivity[]>([]);
  const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate statistics
  const stats = useMemo<SharedFolderStats>(() => {
    const totalParticipants = sharedFolders.reduce(
      (sum, folder) => sum + folder.participants.filter(p => p.status === 'accepted').length,
      0
    );

    const foldersByPermission = sharedFolders.reduce(
      (acc, folder) => {
        folder.participants.forEach(p => {
          if (p.status === 'accepted') {
            acc[p.permission]++;
          }
        });
        return acc;
      },
      { read: 0, write: 0, admin: 0 }
    );

    const pendingInvitations = sharedFolders.reduce(
      (sum, folder) => sum + folder.participants.filter(p => p.status === 'pending').length,
      0
    );

    return {
      totalSharedFolders: sharedFolders.length,
      totalParticipants,
      foldersByPermission,
      pendingInvitations,
      activeShares: totalParticipants
    };
  }, [sharedFolders]);

  // Log activity
  const logActivity = useCallback(
    (
      folderId: string,
      type: SharedFolderActivity['type'],
      performedBy: string,
      performedByName: string,
      targetId?: string,
      targetName?: string,
      previousValue?: string,
      newValue?: string
    ) => {
      const activity: SharedFolderActivity = {
        id: generateId(),
        folderId,
        type,
        performedBy,
        performedByName,
        targetId,
        targetName,
        previousValue,
        newValue,
        timestamp: new Date().toISOString()
      };
      setActivities(prev => [activity, ...prev].slice(0, 100)); // Keep last 100 activities
    },
    []
  );

  // Share a folder with a user or team
  const shareFolder = useCallback(
    (options: ShareFolderOptions, currentUserId: string, currentUserName: string) => {
      const { folderId, targetType, targetId, targetName, targetEmail, permission, message } = options;

      setSharedFolders(prevFolders => {
        const existingFolderIndex = prevFolders.findIndex(f => f.folderId === folderId);

        if (existingFolderIndex >= 0) {
          // Update existing shared folder
          const folder = prevFolders[existingFolderIndex];

          // Check if already shared with this target
          const existingParticipant = folder.participants.find(
            p => p.targetId === targetId && p.targetType === targetType
          );

          if (existingParticipant) {
            addNotification('warning', `Folder already shared with ${targetName}`);
            return prevFolders;
          }

          // Add new participant
          const newParticipant: SharedFolderParticipant = {
            id: generateId(),
            folderId,
            targetType,
            targetId,
            targetName,
            targetEmail,
            permission,
            status: 'pending',
            sharedBy: currentUserId,
            sharedAt: new Date().toISOString()
          };

          const updatedFolder: SharedFolder = {
            ...folder,
            participants: [...folder.participants, newParticipant],
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const newFolders = [...prevFolders];
          newFolders[existingFolderIndex] = updatedFolder;

          logActivity(folderId, 'shared', currentUserId, currentUserName, targetId, targetName, undefined, permission);
          addNotification('success', `Folder shared with ${targetName}`);
          return newFolders;
        } else {
          // Create new shared folder entry
          const newParticipant: SharedFolderParticipant = {
            id: generateId(),
            folderId,
            targetType,
            targetId,
            targetName,
            targetEmail,
            permission,
            status: 'pending',
            sharedBy: currentUserId,
            sharedAt: new Date().toISOString()
          };

          const now = new Date().toISOString();
          const newSharedFolder: SharedFolder = {
            id: generateId(),
            folderId,
            folderName: `Folder-${folderId}`, // Will be updated with actual name
            ownerId: currentUserId,
            ownerName: currentUserName,
            ownerEmail: '',
            participants: [newParticipant],
            isShared: true,
            sharedAt: now,
            lastActivityAt: now,
            emailCount: 0,
            createdAt: now,
            updatedAt: now
          };

          logActivity(folderId, 'shared', currentUserId, currentUserName, targetId, targetName, undefined, permission);
          addNotification('success', `Folder shared with ${targetName}`);
          return [...prevFolders, newSharedFolder];
        }
      });
    },
    [addNotification, logActivity]
  );

  // Unshare a folder from a participant
  const unshareFolder = useCallback(
    (folderId: string, participantId: string, currentUserId: string, currentUserName: string) => {
      setSharedFolders(prevFolders => {
        return prevFolders.map(folder => {
          if (folder.folderId !== folderId) {
return folder;
}

          const participant = folder.participants.find(p => p.id === participantId);
          if (!participant) {
return folder;
}

          const updatedParticipants = folder.participants.filter(p => p.id !== participantId);

          logActivity(
            folderId,
            'unshared',
            currentUserId,
            currentUserName,
            participant.targetId,
            participant.targetName
          );

          addNotification('success', `Folder unshared from ${participant.targetName}`);

          return {
            ...folder,
            participants: updatedParticipants,
            isShared: updatedParticipants.length > 0,
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      });
    },
    [addNotification, logActivity]
  );

  // Update participant permission
  const updatePermission = useCallback(
    (options: UpdatePermissionOptions, currentUserId: string, currentUserName: string) => {
      const { folderId, participantId, newPermission } = options;

      setSharedFolders(prevFolders => {
        return prevFolders.map(folder => {
          if (folder.folderId !== folderId) {
return folder;
}

          const participant = folder.participants.find(p => p.id === participantId);
          if (!participant) {
return folder;
}

          const oldPermission = participant.permission;

          const updatedParticipants = folder.participants.map(p =>
            p.id === participantId ? { ...p, permission: newPermission } : p
          );

          logActivity(
            folderId,
            'permission_changed',
            currentUserId,
            currentUserName,
            participant.targetId,
            participant.targetName,
            oldPermission,
            newPermission
          );

          addNotification('success', `Permission updated to ${newPermission} for ${participant.targetName}`);

          return {
            ...folder,
            participants: updatedParticipants,
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      });
    },
    [addNotification, logActivity]
  );

  // Accept a share invitation
  const acceptInvitation = useCallback(
    (invitationId: string) => {
      setInvitations(prev => {
        const invitation = prev.find(i => i.id === invitationId);
        if (!invitation) {
return prev;
}

        // Update the participant status in shared folders
        setSharedFolders(folders =>
          folders.map(folder => {
            if (folder.folderId !== invitation.folderId) {
return folder;
}

            return {
              ...folder,
              participants: folder.participants.map(p =>
                p.targetId === invitation.toEmail || p.targetEmail === invitation.toEmail
                  ? { ...p, status: 'accepted', acceptedAt: new Date().toISOString() }
                  : p
              ),
              lastActivityAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          })
        );

        addNotification('success', `You now have access to "${invitation.folderName}"`);
        return prev.map(i =>
          i.id === invitationId ? { ...i, status: 'accepted' } : i
        );
      });
    },
    [addNotification]
  );

  // Decline a share invitation
  const declineInvitation = useCallback(
    (invitationId: string) => {
      setInvitations(prev => {
        const invitation = prev.find(i => i.id === invitationId);
        if (invitation) {
          addNotification('info', `Invitation to "${invitation.folderName}" declined`);
        }
        return prev.map(i =>
          i.id === invitationId ? { ...i, status: 'declined' } : i
        );
      });
    },
    [addNotification]
  );

  // Revoke access for a participant
  const revokeAccess = useCallback(
    (folderId: string, participantId: string, currentUserId: string, currentUserName: string) => {
      setSharedFolders(prevFolders => {
        return prevFolders.map(folder => {
          if (folder.folderId !== folderId) {
return folder;
}

          const participant = folder.participants.find(p => p.id === participantId);
          if (!participant) {
return folder;
}

          const updatedParticipants = folder.participants.map(p =>
            p.id === participantId ? { ...p, status: 'revoked' as ShareStatus } : p
          );

          logActivity(
            folderId,
            'access_revoked',
            currentUserId,
            currentUserName,
            participant.targetId,
            participant.targetName
          );

          addNotification('success', `Access revoked for ${participant.targetName}`);

          return {
            ...folder,
            participants: updatedParticipants,
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });
      });
    },
    [addNotification, logActivity]
  );

  // Get folders shared with a specific user
  const getFoldersSharedWithUser = useCallback(
    (userId: string): SharedFolder[] => {
      return sharedFolders.filter(folder =>
        folder.participants.some(p => p.targetId === userId && p.status === 'accepted')
      );
    },
    [sharedFolders]
  );

  // Get folders owned by a user
  const getFoldersOwnedByUser = useCallback(
    (userId: string): SharedFolder[] => {
      return sharedFolders.filter(folder => folder.ownerId === userId);
    },
    [sharedFolders]
  );

  // Get participants of a shared folder
  const getFolderParticipants = useCallback(
    (folderId: string): SharedFolderParticipant[] => {
      const folder = sharedFolders.find(f => f.folderId === folderId);
      return folder?.participants || [];
    },
    [sharedFolders]
  );

  // Get activities for a folder
  const getFolderActivities = useCallback(
    (folderId: string): SharedFolderActivity[] => {
      return activities.filter(a => a.folderId === folderId);
    },
    [activities]
  );

  // Filter and sort shared folders
  const getFilteredFolders = useCallback(
    (filter?: SharedFolderFilter, sort?: SharedFolderSort): SharedFolder[] => {
      let result = [...sharedFolders];

      // Apply filters
      if (filter) {
        if (filter.ownerId) {
          result = result.filter(f => f.ownerId === filter.ownerId);
        }
        if (filter.participantId) {
          result = result.filter(f =>
            f.participants.some(p => p.targetId === filter.participantId)
          );
        }
        if (filter.permission) {
          result = result.filter(f =>
            f.participants.some(p => p.permission === filter.permission)
          );
        }
        if (filter.status) {
          result = result.filter(f =>
            f.participants.some(p => p.status === filter.status)
          );
        }
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          result = result.filter(f =>
            f.folderName.toLowerCase().includes(searchLower) ||
            f.ownerName.toLowerCase().includes(searchLower)
          );
        }
      }

      // Apply sort
      if (sort) {
        result.sort((a, b) => {
          let comparison = 0;

          switch (sort.field) {
            case 'folderName':
              comparison = a.folderName.localeCompare(b.folderName);
              break;
            case 'sharedAt':
              comparison = new Date(a.sharedAt || 0).getTime() - new Date(b.sharedAt || 0).getTime();
              break;
            case 'lastActivityAt':
              comparison = new Date(a.lastActivityAt || 0).getTime() - new Date(b.lastActivityAt || 0).getTime();
              break;
            case 'participantCount':
              comparison = a.participants.length - b.participants.length;
              break;
          }

          return sort.order === 'asc' ? comparison : -comparison;
        });
      }

      return result;
    },
    [sharedFolders]
  );

  // Check if user has permission for a folder
  const hasPermission = useCallback(
    (folderId: string, userId: string, requiredPermission: FolderPermission): boolean => {
      const folder = sharedFolders.find(f => f.folderId === folderId);
      if (!folder) {
return false;
}

      // Owner has all permissions
      if (folder.ownerId === userId) {
return true;
}

      const participant = folder.participants.find(
        p => p.targetId === userId && p.status === 'accepted'
      );
      if (!participant) {
return false;
}

      const permissionLevels: FolderPermission[] = ['read', 'write', 'admin'];
      const userLevel = permissionLevels.indexOf(participant.permission);
      const requiredLevel = permissionLevels.indexOf(requiredPermission);

      return userLevel >= requiredLevel;
    },
    [sharedFolders]
  );

  // Update folder info (name, description, etc.)
  const updateFolderInfo = useCallback(
    (folderId: string, updates: Partial<Pick<SharedFolder, 'folderName' | 'description'>>, currentUserId: string, currentUserName: string) => {
      setSharedFolders(prevFolders => {
        return prevFolders.map(folder => {
          if (folder.folderId !== folderId) {
return folder;
}

          if (updates.folderName && updates.folderName !== folder.folderName) {
            logActivity(
              folderId,
              'folder_renamed',
              currentUserId,
              currentUserName,
              undefined,
              undefined,
              folder.folderName,
              updates.folderName
            );
          }

          return {
            ...folder,
            ...updates,
            updatedAt: new Date().toISOString()
          };
        });
      });

      addNotification('success', 'Folder information updated');
    },
    [addNotification, logActivity]
  );

  return {
    // State
    sharedFolders,
    activities,
    invitations,
    stats,
    isLoading,

    // Actions
    shareFolder,
    unshareFolder,
    updatePermission,
    acceptInvitation,
    declineInvitation,
    revokeAccess,
    updateFolderInfo,

    // Queries
    getFoldersSharedWithUser,
    getFoldersOwnedByUser,
    getFolderParticipants,
    getFolderActivities,
    getFilteredFolders,
    hasPermission
  };
};
