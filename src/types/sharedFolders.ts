/**
 * Shared Folders Types
 *
 * Defines types for folder sharing and collaboration features.
 * Supports granular permissions, sharing with users and teams,
 * and comprehensive activity tracking.
 */

/**
 * Permission levels for shared folders
 */
export type FolderPermission =
  | 'read'      // Can view emails only
  | 'write'     // Can view, compose, move, delete emails
  | 'admin';    // Full control including sharing management

/**
 * Status of a share invitation
 */
export type ShareStatus =
  | 'pending'    // Invitation sent, not yet accepted
  | 'accepted'   // Invitation accepted, active access
  | 'declined'   // Invitation declined
  | 'revoked';   // Access revoked by owner

/**
 * Type of share target
 */
export type ShareTargetType =
  | 'user'       // Individual user
  | 'team';      // Team/group

/**
 * Types of activities in shared folders
 */
export type SharedFolderActivityType =
  | 'shared'
  | 'unshared'
  | 'permission_changed'
  | 'email_added'
  | 'email_removed'
  | 'email_moved'
  | 'folder_renamed'
  | 'access_revoked';

/**
 * Represents a user or team that a folder is shared with
 */
export interface SharedFolderParticipant {
  id: string;
  folderId: string;
  targetType: ShareTargetType;
  targetId: string;           // User ID or Team ID
  targetName: string;         // User name or Team name
  targetEmail?: string;       // User email (for users)
  permission: FolderPermission;
  status: ShareStatus;
  sharedBy: string;           // User ID who shared
  sharedAt: string;           // ISO timestamp
  acceptedAt?: string;        // ISO timestamp when accepted
}

/**
 * Represents a shared folder
 */
export interface SharedFolder {
  id: string;
  folderId: string;           // Original folder ID
  folderName: string;
  ownerId: string;            // User ID who owns the folder
  ownerName: string;
  ownerEmail: string;
  description?: string;
  participants: SharedFolderParticipant[];
  isShared: boolean;
  sharedAt?: string;          // First shared at timestamp
  lastActivityAt?: string;
  emailCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statistics about shared folders
 */
export interface SharedFolderStats {
  totalSharedFolders: number;
  totalParticipants: number;
  foldersByPermission: {
    read: number;
    write: number;
    admin: number;
  };
  pendingInvitations: number;
  activeShares: number;
}

/**
 * Activity log entry for shared folder
 */
export interface SharedFolderActivity {
  id: string;
  folderId: string;
  type: SharedFolderActivityType;
  performedBy: string;        // User ID
  performedByName: string;
  targetId?: string;          // Target user/team ID
  targetName?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

/**
 * Invitation to share a folder
 */
export interface ShareInvitation {
  id: string;
  folderId: string;
  folderName: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toEmail: string;
  permission: FolderPermission;
  message?: string;
  status: ShareStatus;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Options for sharing a folder
 */
export interface ShareFolderOptions {
  folderId: string;
  targetType: ShareTargetType;
  targetId: string;
  targetName: string;
  targetEmail?: string;
  permission: FolderPermission;
  message?: string;
}

/**
 * Options for updating share permission
 */
export interface UpdatePermissionOptions {
  folderId: string;
  participantId: string;
  newPermission: FolderPermission;
}

/**
 * Filter options for shared folders list
 */
export interface SharedFolderFilter {
  ownerId?: string;           // Filter by owner
  participantId?: string;     // Filter by participant
  permission?: FolderPermission;
  status?: ShareStatus;
  search?: string;            // Search in folder name
}

/**
 * Sort options for shared folders
 */
export interface SharedFolderSort {
  field: 'folderName' | 'sharedAt' | 'lastActivityAt' | 'participantCount';
  order: 'asc' | 'desc';
}
