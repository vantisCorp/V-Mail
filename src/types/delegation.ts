/**
 * Email Delegation Types
 * 
 * Defines types for email delegation feature allowing users to grant
 * others permission to send emails on their behalf and manage their inbox.
 */

/**
 * Delegation permission levels
 */
export type DelegationPermission = 
  | 'send_as'        // Can send emails appearing to come from the owner
  | 'send_on_behalf' // Can send emails on behalf with "on behalf of" indicator
  | 'manage';        // Full inbox management (send, read, delete, organize)

/**
 * Status of a delegation
 */
export type DelegationStatus = 
  | 'pending'    // Invitation sent, not yet accepted
  | 'active'     // Delegation is active
  | 'suspended'  // Temporarily suspended
  | 'revoked'    // Delegation revoked
  | 'expired';   // Delegation expired

/**
 * Types of activities in delegation
 */
export type DelegationActivityType = 
  | 'delegation_granted'
  | 'delegation_accepted'
  | 'delegation_revoked'
  | 'delegation_suspended'
  | 'delegation_resumed'
  | 'permission_changed'
  | 'email_sent'
  | 'email_deleted'
  | 'folder_accessed'
  | 'settings_modified';

/**
 * Represents a delegation relationship
 */
export interface Delegation {
  id: string;
  ownerId: string;                  // User who owns the account
  ownerName: string;
  ownerEmail: string;
  delegateId: string;               // User granted delegation
  delegateName: string;
  delegateEmail: string;
  permission: DelegationPermission;
  status: DelegationStatus;
  grantedBy: string;                // User who granted the delegation (or owner)
  grantedAt: string;                // ISO timestamp
  acceptedAt?: string;              // ISO timestamp
  expiresAt?: string;               // ISO timestamp
  lastActivityAt?: string;
  allowedActions?: DelegationAction[];  // Specific actions allowed
  folders?: string[];               // Specific folders delegate can access
  notes?: string;                   // Notes about the delegation
}

/**
 * Specific actions that can be delegated
 */
export type DelegationAction = 
  | 'send_email'
  | 'read_emails'
  | 'delete_emails'
  | 'organize_folders'
  | 'manage_labels'
  | 'manage_filters'
  | 'view_attachments';

/**
 * Statistics about delegations
 */
export interface DelegationStats {
  totalDelegations: number;
  activeDelegations: number;
  pendingDelegations: number;
  sentAsCount: number;
  sendOnBehalfCount: number;
  manageCount: number;
  totalEmailsSent: number;
}

/**
 * Activity log entry for delegation
 */
export interface DelegationActivity {
  id: string;
  delegationId: string;
  type: DelegationActivityType;
  performedBy: string;              // User ID
  performedByName: string;
  actionDetails?: {
    emailId?: string;
    emailSubject?: string;
    folderId?: string;
    previousPermission?: DelegationPermission;
    newPermission?: DelegationPermission;
  };
  ipAddress?: string;
  timestamp: string;
}

/**
 * Delegation invitation
 */
export interface DelegationInvitation {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  delegateEmail: string;
  permission: DelegationPermission;
  message?: string;
  allowedActions?: DelegationAction[];
  folders?: string[];
  expiresAt?: string;
  status: DelegationStatus;
  createdAt: string;
  acceptedAt?: string;
}

/**
 * Options for granting delegation
 */
export interface GrantDelegationOptions {
  delegateEmail: string;
  delegateName: string;
  delegateId: string;
  permission: DelegationPermission;
  allowedActions?: DelegationAction[];
  folders?: string[];
  expiresAt?: string;
  notes?: string;
}

/**
 * Options for updating delegation
 */
export interface UpdateDelegationOptions {
  delegationId: string;
  permission?: DelegationPermission;
  allowedActions?: DelegationAction[];
  folders?: string[];
  expiresAt?: string;
  notes?: string;
}

/**
 * Email sent through delegation
 */
export interface DelegatedEmail {
  id: string;
  delegationId: string;
  originalEmailId: string;
  sentAs: boolean;                  // True if sent_as, false if send_on_behalf
  from: string;                     // The from address
  replyTo?: string;                 // Reply to address
  subject: string;
  body: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  sentBy: string;                   // Delegate user ID
  sentByName: string;
  sentAt: string;
}

/**
 * Filter options for delegations list
 */
export interface DelegationFilter {
  ownerId?: string;
  delegateId?: string;
  permission?: DelegationPermission;
  status?: DelegationStatus;
  search?: string;
}

/**
 * Sort options for delegations
 */
export interface DelegationSort {
  field: 'grantedAt' | 'acceptedAt' | 'lastActivityAt' | 'delegateName';
  order: 'asc' | 'desc';
}