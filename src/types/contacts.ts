// Contacts Integration Types for V-Mail v1.6.0
// Supports Google Contacts, Microsoft Outlook, and iCloud integration

/**
 * Contact provider
 */
export enum ContactProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  ICLOUD = 'icloud',
  LOCAL = 'local',
}

/**
 * Contact field types
 */
export enum ContactFieldType {
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  WEBSITE = 'website',
  SOCIAL = 'social',
  CUSTOM = 'custom',
}

/**
 * Contact group/category
 */
export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  contactIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Email contact
 */
export interface EmailContact {
  id: string;
  type?: 'home' | 'work' | 'other' | 'custom';
  address: string;
  label?: string;
  isPrimary?: boolean;
}

/**
 * Phone contact
 */
export interface PhoneContact {
  id: string;
  type?: 'home' | 'work' | 'mobile' | 'other' | 'custom';
  number: string;
  label?: string;
  isPrimary?: boolean;
}

/**
 * Address contact
 */
export interface AddressContact {
  id: string;
  type?: 'home' | 'work' | 'other' | 'custom';
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  label?: string;
  isPrimary?: boolean;
}

/**
 * Website contact
 */
export interface WebsiteContact {
  id: string;
  type?: 'homepage' | 'work' | 'blog' | 'other' | 'custom';
  url: string;
  label?: string;
}

/**
 * Social media contact
 */
export interface SocialContact {
  id: string;
  platform: string; // e.g., 'linkedin', 'twitter', 'facebook', 'github'
  username?: string;
  url?: string;
  label?: string;
}

/**
 * Custom field
 */
export interface CustomField {
  id: string;
  name: string;
  value: string;
  type?: 'text' | 'number' | 'date' | 'url' | 'email';
}

/**
 * Contact photo
 */
export interface ContactPhoto {
  url?: string;
  data?: string; // base64 encoded
  type?: string; // mime type
  lastUpdated?: string;
}

/**
 * Contact organization
 */
export interface ContactOrganization {
  name?: string;
  title?: string;
  department?: string;
}

/**
 * Contact note
 */
export interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact interaction/activity
 */
export interface ContactInteraction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'message' | 'other';
  date: string;
  summary?: string;
  details?: string;
  emailId?: string;
  eventId?: string;
  taskId?: string;
  relatedContactId?: string;
}

/**
 * Contact
 */
export interface Contact {
  id: string;
  provider: ContactProvider;
  providerContactId: string;

  // Basic info
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string; // e.g., Mr., Mrs., Dr.
  suffix?: string; // e.g., Jr., Sr., III

  // Display info
  displayName: string;
  nickname?: string;
  phoneticFirstName?: string;
  phoneticLastName?: string;

  // Contact details
  emails: EmailContact[];
  phones: PhoneContact[];
  addresses: AddressContact[];
  websites: WebsiteContact[];
  socials: SocialContact[];
  customFields: CustomField[];

  // Additional info
  organization?: ContactOrganization;
  birthday?: string; // ISO date format
  anniversary?: string; // ISO date format
  notes?: ContactNote[];

  // Photo
  photo?: ContactPhoto;

  // Groups
  groupIds: string[];
  tags: string[];

  // Email integration
  emailFrequency?: number; // emails per month
  lastEmailDate?: string;
  emailCount?: number;

  // Metadata
  starred?: boolean;
  favorite?: boolean;
  hidden?: boolean;
  isPrimary?: boolean;

  // Sync info
  version?: number;
  etag?: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;

  // User fields
  userFields?: Record<string, any>;
}

/**
 * Contact account connection
 */
export interface ContactAccount {
  id: string;
  provider: ContactProvider;
  userId: string;
  email: string;
  displayName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
  isActive: boolean;
  isPrimary: boolean;
  syncEnabled: boolean;
  lastSync?: string;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact filter options
 */
export interface ContactFilterOptions {
  query?: string;
  groups?: string[];
  tags?: string[];
  starred?: boolean;
  favorite?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  dateCreatedAfter?: string;
  dateUpdatedAfter?: string;
  minEmailCount?: number;
  maxResults?: number;
}

/**
 * Contact sort options
 */
export interface ContactSortOptions {
  field: 'displayName' | 'firstName' | 'lastName' | 'email' | 'createdAt' | 'updatedAt' | 'lastEmailDate';
  order: 'asc' | 'desc';
}

/**
 * Contact statistics
 */
export interface ContactStatistics {
  totalContacts: number;
  activeContacts: number;
  starredContacts: number;
  favoriteContacts: number;
  contactsByGroup: Record<string, number>;
  contactsByTag: Record<string, number>;
  contactsByProvider: Record<ContactProvider, number>;
  averageEmailsPerContact: number;
  mostContactedContacts: Array<{
    contactId: string;
    emailCount: number;
  }>;
  recentlyAddedContacts: number;
  recentlyUpdatedContacts: number;
  duplicateContacts: number;
}

/**
 * Email to contact conversion options
 */
export interface EmailToContactOptions {
  extractFromSender: boolean;
  extractFromRecipients: boolean;
  extractFromCc: boolean;
  extractFromBcc: boolean;
  extractFromSignature: boolean;
  extractFromBody: boolean;
  extractFromReplyTo: boolean;
  autoDetectFields: boolean;
  createGroups: boolean;
  groupName?: string;
  mergeWithExisting: boolean;
  mergeStrategy: 'merge' | 'replace' | 'ask';
}

/**
 * Contact import options
 */
export interface ContactImportOptions {
  format: 'csv' | 'vcf' | 'json';
  mergeStrategy: 'skip' | 'merge' | 'replace' | 'duplicate';
  defaultGroup?: string;
  importEmails: boolean;
  importPhones: boolean;
  importAddresses: boolean;
  importWebsites: boolean;
  importSocials: boolean;
  importNotes: boolean;
  importPhotos: boolean;
  validateEmails: boolean;
  normalizePhoneNumbers: boolean;
}

/**
 * Contact export options
 */
export interface ContactExportOptions {
  format: 'csv' | 'vcf' | 'json';
  includeGroups: boolean;
  includeNotes: boolean;
  includePhotos: boolean;
  filter?: ContactFilterOptions;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Contact export result
 */
export interface ContactExportResult {
  file?: {
    name: string;
    type: string;
    size: number;
    url?: string;
  };
  exportCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: Array<{
    contactId: string;
    error: string;
  }>;
}

/**
 * Contact search result
 */
export interface ContactSearchResult {
  contact: Contact;
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * Contact merge suggestion
 */
export interface ContactMergeSuggestion {
  primaryContact: Contact;
  duplicateContacts: Contact[];
  matchScore: number;
  matchedFields: string[];
  suggestedMerge: Partial<Contact>;
}

/**
 * Contact sync status
 */
export interface ContactSyncStatus {
  lastSyncAt: string;
  isSyncing: boolean;
  nextSync?: string;
  syncErrors: Array<{
    contactId: string;
    error: string;
    timestamp: string;
  }>;
  contactsAdded: number;
  contactsUpdated: number;
  contactsDeleted: number;
  contactsSkipped: number;
}

/**
 * Contact preferences
 */
export interface ContactPreferences {
  defaultView: 'list' | 'grid' | 'cards';
  sortOptions: ContactSortOptions;
  displayFields: string[];
  showAvatar: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showCompany: boolean;
  showGroups: boolean;
  showTags: boolean;
  enableAutoMerge: boolean;
  mergeThreshold: number; // 0-1
  duplicateCheckEnabled: boolean;
  emailTrackingEnabled: boolean;
}

/**
 * Contact create payload
 */
export interface CreateContactPayload {
  firstName?: string;
  lastName?: string;
  displayName: string;
  emails?: EmailContact[];
  phones?: PhoneContact[];
  addresses?: AddressContact[];
  websites?: WebsiteContact[];
  socials?: SocialContact[];
  customFields?: CustomField[];
  organization?: ContactOrganization;
  birthday?: string;
  notes?: ContactNote[];
  photo?: ContactPhoto;
  groupIds?: string[];
  tags?: string[];
  starred?: boolean;
  favorite?: boolean;
}

/**
 * Contact update payload
 */
export interface UpdateContactPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  emails?: EmailContact[];
  phones?: PhoneContact[];
  addresses?: AddressContact[];
  websites?: WebsiteContact[];
  socials?: SocialContact[];
  customFields?: CustomField[];
  organization?: ContactOrganization;
  birthday?: string;
  notes?: ContactNote[];
  photo?: ContactPhoto;
  groupIds?: string[];
  tags?: string[];
  starred?: boolean;
  favorite?: boolean;
  version?: number;
}

/**
 * VCard (vCard) format types
 */
export interface VCard {
  version: string;
  fn?: string; // Full name
  n?: {
    familyName?: string;
    givenName?: string;
    additionalNames?: string[];
    honorificPrefixes?: string[];
    honorificSuffixes?: string[];
  };
  nickname?: string[];
  email?: Array<{
    type: string[];
    value: string;
    pref?: number;
  }>;
  tel?: Array<{
    type: string[];
    value: string;
    pref?: number;
  }>;
  adr?: Array<{
    type: string[];
    street?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    pref?: number;
  }>;
  url?: Array<{
    type: string[];
    value: string;
    pref?: number;
  }>;
  org?: {
    organizationName?: string;
    department?: string[];
  };
  title?: string[];
  bday?: string;
  note?: string[];
  photo?: {
    type: string;
    value: string;
  };
  categories?: string[];
  rev?: string; // Revision date
}
