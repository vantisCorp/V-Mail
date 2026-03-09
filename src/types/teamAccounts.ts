/**
 * Team Account Types for V-Mail v1.2.0
 *
 * This module defines comprehensive types for team account management,
 * including member roles, team settings, and billing information.
 */

export type TeamMemberRole =
  | 'owner' // Team owner - full access
  | 'admin' // Team administrator - can manage members and settings
  | 'manager' // Team manager - can manage members and view reports
  | 'member' // Team member - standard access
  | 'viewer'; // Team viewer - read-only access

export type TeamMemberStatus =
  | 'active' // Member is active in the team
  | 'pending' // Invitation sent, not yet accepted
  | 'suspended' // Member temporarily suspended
  | 'removed'; // Member has been removed from team

export type TeamBillingPlan =
  | 'free' // Free plan with limited members
  | 'starter' // Starter plan - up to 10 members
  | 'professional' // Professional plan - up to 50 members
  | 'enterprise'; // Enterprise plan - unlimited members

export type TeamSubscriptionStatus =
  | 'trial' // Trial period
  | 'active' // Active subscription
  | 'past_due' // Payment past due
  | 'cancelled' // Subscription cancelled
  | 'expired'; // Subscription expired

/**
 * Team member interface
 */
export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  email: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  lastActiveAt: Date;
  permissions: string[];
  department?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

/**
 * Team invitation interface
 */
export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamMemberRole;
  invitedBy: string;
  invitedByMember: TeamMember;
  status: TeamMemberStatus;
  invitedAt: Date;
  expiresAt: Date;
  message?: string;
  acceptedAt?: Date;
}

/**
 * Team settings interface
 */
export interface TeamSettings {
  id: string;
  teamId: string;
  allowMemberInvites: boolean;
  requireApproval: boolean;
  defaultRole: TeamMemberRole;
  allowMemberCreation: boolean;
  allowFolderSharing: boolean;
  allowEmailDelegation: boolean;
  enforceTwoFactor: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiry: number; // days, 0 = no expiry
  };
  sessionPolicy: {
    maxDuration: number; // hours
    idleTimeout: number; // minutes
    concurrentSessions: number;
  };
  retentionPolicy: {
    emailRetentionDays: number;
    trashRetentionDays: number;
    archiveAfterDays: number;
  };
  notificationSettings: {
    emailNotifications: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
    memberActivity: boolean;
  };
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Team billing interface
 */
export interface TeamBilling {
  id: string;
  teamId: string;
  plan: TeamBillingPlan;
  status: TeamSubscriptionStatus;
  memberLimit: number;
  memberCount: number;
  storageLimit: number; // GB
  storageUsed: number; // GB
  trialEndsAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
  paymentMethod: {
    type: 'card' | 'bank_account' | 'paypal';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    bankName?: string;
  };
  billingContact: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  invoices: TeamInvoice[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team invoice interface
 */
export interface TeamInvoice {
  id: string;
  teamBillingId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
}

/**
 * Team statistics interface
 */
export interface TeamStats {
  teamId: string;
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  suspendedMembers: number;
  totalEmails: number;
  emailsThisMonth: number;
  storageUsed: number;
  storageLimit: number;
  activeFolders: number;
  sharedFolders: number;
  activeDelegations: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team activity log interface
 */
export interface TeamActivity {
  id: string;
  teamId: string;
  memberId: string;
  member: TeamMember;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Complete team account interface
 */
export interface TeamAccount {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string; // e.g., "1-10", "11-50", "51-200", etc.
  ownerId: string;
  owner: TeamMember;
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
  billing: TeamBilling;
  stats: TeamStats;
}

/**
 * Team account creation payload
 */
export interface CreateTeamAccountPayload {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  ownerId: string;
  plan?: TeamBillingPlan;
}

/**
 * Team update payload
 */
export interface UpdateTeamAccountPayload {
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  logo?: string;
}

/**
 * Invite member payload
 */
export interface InviteMemberPayload {
  email: string;
  role: TeamMemberRole;
  message?: string;
  department?: string;
  jobTitle?: string;
}

/**
 * Update member payload
 */
export interface UpdateMemberPayload {
  role?: TeamMemberRole;
  status?: TeamMemberStatus;
  department?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  bio?: string;
  permissions?: string[];
}

/**
 * Team member filter options
 */
export interface TeamMemberFilter {
  status?: TeamMemberStatus[];
  role?: TeamMemberRole[];
  department?: string[];
  search?: string;
  sortBy?: 'name' | 'email' | 'role' | 'joinedAt' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Team activity filter options
 */
export interface TeamActivityFilter {
  action?: string[];
  memberId?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy?: 'timestamp' | 'action';
  sortOrder?: 'asc' | 'desc';
}
