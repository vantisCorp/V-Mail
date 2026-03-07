/**
 * Email Signatures Type Definitions for V-Mail v1.6.0
 */

/**
 * Signature type
 */
export enum SignatureType {
  HTML = 'html',
  PLAIN_TEXT = 'plain_text',
  RICH_TEXT = 'rich_text',
}

/**
 * Signature position
 */
export enum SignaturePosition {
  BOTTOM = 'bottom',
  TOP = 'top',
  INLINE = 'inline',
}

/**
 * Signature provider for automatic insertion
 */
export enum SignatureProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  ICLOUD = 'icloud',
  YAHOO = 'yahoo',
  CUSTOM = 'custom',
}

/**
 * Social media link for signature
 */
export interface SignatureSocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'website' | 'github' | 'other';
  url: string;
  icon?: string;
  label?: string;
}

/**
 * Signature contact info
 */
export interface SignatureContactInfo {
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
  address?: string;
}

/**
 * Signature template
 */
export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'corporate' | 'custom';
  previewImage?: string;
  htmlTemplate: string;
  plainTextTemplate: string;
  variables: string[]; // {{name}}, {{title}}, etc.
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email signature
 */
export interface EmailSignature {
  id: string;
  name: string;
  description?: string;
  type: SignatureType;
  position: SignaturePosition;
  isDefault: boolean;
  isActive: boolean;
  
  // Content
  htmlContent: string;
  plainTextContent: string;
  
  // Personal info
  fullName: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  department?: string;
  
  // Contact info
  contactInfo: SignatureContactInfo;
  
  // Social links
  socialLinks: SignatureSocialLink[];
  
  // Branding
  logoUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  
  // Template reference
  templateId?: string;
  
  // Provider association
  provider?: SignatureProvider;
  providerAccountId?: string;
  
  // Settings
  autoInsert: boolean;
  insertForNew: boolean;
  insertForReply: boolean;
  insertForForward: boolean;
  
  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsed?: string;
}

/**
 * Create signature payload
 */
export interface CreateSignaturePayload {
  name: string;
  description?: string;
  type: SignatureType;
  position?: SignaturePosition;
  isDefault?: boolean;
  
  htmlContent: string;
  plainTextContent: string;
  
  fullName: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  department?: string;
  
  contactInfo?: Partial<SignatureContactInfo>;
  socialLinks?: Omit<SignatureSocialLink, 'id'>[];
  
  logoUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  
  templateId?: string;
  provider?: SignatureProvider;
  providerAccountId?: string;
  
  autoInsert?: boolean;
  insertForNew?: boolean;
  insertForReply?: boolean;
  insertForForward?: boolean;
  
  tags?: string[];
}

/**
 * Update signature payload
 */
export interface UpdateSignaturePayload {
  name?: string;
  description?: string;
  type?: SignatureType;
  position?: SignaturePosition;
  isDefault?: boolean;
  isActive?: boolean;
  
  htmlContent?: string;
  plainTextContent?: string;
  
  fullName?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  department?: string;
  
  contactInfo?: Partial<SignatureContactInfo>;
  socialLinks?: SignatureSocialLink[];
  
  logoUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  
  templateId?: string;
  autoInsert?: boolean;
  insertForNew?: boolean;
  insertForReply?: boolean;
  insertForForward?: boolean;
  
  tags?: string[];
}

/**
 * Signature filter options
 */
export interface SignatureFilterOptions {
  type?: SignatureType;
  isDefault?: boolean;
  isActive?: boolean;
  provider?: SignatureProvider;
  searchQuery?: string;
  tags?: string[];
}

/**
 * Signature preview options
 */
export interface SignaturePreviewOptions {
  signatureId: string;
  emailType: 'new' | 'reply' | 'forward';
  recipientEmail?: string;
}

/**
 * Signature statistics
 */
export interface SignatureStats {
  totalSignatures: number;
  activeSignatures: number;
  defaultSignature?: string;
  totalUsage: number;
  usageByProvider: Record<string, number>;
  mostUsedSignature?: string;
  recentlyUsed: Array<{
    signatureId: string;
    signatureName: string;
    usedAt: string;
  }>;
}

/**
 * Signature usage log
 */
export interface SignatureUsageLog {
  id: string;
  signatureId: string;
  signatureName: string;
  emailId: string;
  emailType: 'new' | 'reply' | 'forward';
  recipientEmail: string;
  usedAt: string;
}