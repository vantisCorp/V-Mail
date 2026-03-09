// CRM Integration Type Definitions for V-Mail v1.3.0

/**
 * CRM Platform types
 */
export enum CRMProvider {
  SALESFORCE = 'salesforce',
  HUBSPOT = 'hubspot',
  PIPEDRIVE = 'pipedrive',
  ZOHO = 'zoho',
  MICROSOFT_DYNAMICS = 'microsoft_dynamics',
  CUSTOM = 'custom'
}

/**
 * Contact status
 */
export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  CUSTOMER = 'customer',
  LEAD = 'lead',
  OPPORTUNITY = 'opportunity'
}

/**
 * Deal stage
 */
export enum DealStage {
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost'
}

/**
 * Sync status
 */
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Field mapping type
 */
export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  URL = 'url'
}

/**
 * CRM Account connection
 */
export interface CRMAccount {
  id: string;
  provider: CRMProvider;
  name: string;
  email: string;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: string;
  syncFrequency: number; // in minutes
  apiCredentials?: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    instanceUrl?: string;
    expiresAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * CRM Contact
 */
export interface CRMContact {
  id: string;
  provider: CRMProvider;
  providerContactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: ContactStatus;
  source?: string; // Where the contact came from
  lastContacted?: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

/**
 * CRM Deal
 */
export interface CRMDeal {
  id: string;
  provider: CRMProvider;
  providerDealId: string;
  contactId: string;
  contactName: string;
  dealName: string;
  value: number;
  currency: string;
  stage: DealStage;
  expectedCloseDate?: string;
  probability: number; // 0-100
  description?: string;
  source?: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

/**
 * Field mapping for sync
 */
export interface FieldMapping {
  id: string;
  sourceField: string; // Email field
  targetField: string; // CRM field
  fieldType: FieldType;
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'none';
  defaultValue?: string;
  isRequired: boolean;
}

/**
 * Sync configuration
 */
export interface SyncConfiguration {
  id: string;
  accountId: string;
  contactMappings: FieldMapping[];
  dealMappings: FieldMapping[];
  autoCreateContacts: boolean;
  autoCreateDeals: boolean;
  syncFilters: {
    emailFolder?: string;
    emailLabel?: string;
    emailFromDomain?: string;
    emailSubjectContains?: string;
  };
  conflictResolution: 'overwrite' | 'merge' | 'skip';
}

/**
 * Email to CRM activity
 */
export interface EmailActivity {
  id: string;
  provider: CRMProvider;
  activityId?: string; // ID in CRM system
  emailId: string;
  emailSubject: string;
  emailBody?: string;
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails?: string[];
  sentAt: string;
  contactId?: string;
  dealId?: string;
  activityType: 'email_sent' | 'email_received' | 'email_opened' | 'email_clicked';
  notes?: string;
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

/**
 * Sync job record
 */
export interface SyncJob {
  id: string;
  accountId: string;
  provider: CRMProvider;
  type: 'full_sync' | 'incremental_sync' | 'contact_sync' | 'deal_sync';
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage?: string;
}

/**
 * Connect account payload
 */
export interface ConnectCRMAccountPayload {
  provider: CRMProvider;
  name: string;
  email: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  syncFrequency?: number;
}

/**
 * Create contact payload
 */
export interface CreateContactPayload {
  provider: CRMProvider;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: ContactStatus;
  customFields?: Record<string, unknown>;
}

/**
 * Create deal payload
 */
export interface CreateDealPayload {
  provider: CRMProvider;
  accountId: string;
  contactId?: string;
  dealName: string;
  value: number;
  currency: string;
  stage?: DealStage;
  expectedCloseDate?: string;
  probability?: number;
  description?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Update contact payload
 */
export interface UpdateContactPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: ContactStatus;
  customFields?: Record<string, unknown>;
}

/**
 * Update deal payload
 */
export interface UpdateDealPayload {
  dealName?: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  expectedCloseDate?: string;
  probability?: number;
  description?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Contact filter options
 */
export interface ContactFilter {
  provider?: CRMProvider;
  accountId?: string;
  status?: ContactStatus;
  searchQuery?: string;
  company?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Deal filter options
 */
export interface DealFilter {
  provider?: CRMProvider;
  accountId?: string;
  stage?: DealStage;
  contactId?: string;
  minValue?: number;
  maxValue?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Email to contact match result
 */
export interface EmailContactMatch {
  matched: boolean;
  contact?: CRMContact;
  confidence: number; // 0-100
  matchReasons: string[];
}

/**
 * CRM statistics
 */
export interface CRMStatistics {
  provider: CRMProvider;
  accountId: string;
  totalContacts: number;
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  wonValue: number;
  openDeals: number;
  openValue: number;
  lastSyncAt?: string;
  syncSuccessRate: number;
  topContacts: Array<{
    id: string;
    name: string;
    company: string;
    dealCount: number;
  }>;
}

/**
 * Contact lookup result
 */
export interface ContactLookupResult {
  found: boolean;
  contacts: CRMContact[];
  email: string;
  providers: CRMProvider[];
}
