/**
 * AI-Powered Email Categorization Types
 *
 * Provides type definitions for automatic email classification using machine learning.
 */

/**
 * Predefined email categories
 */
export enum EmailCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  PROMOTIONS = 'promotions',
  SOCIAL = 'social',
  UPDATES = 'updates',
  FINANCE = 'finance',
  TRAVEL = 'travel',
  SHOPPING = 'shopping',
  NEWS = 'news',
  FORUMS = 'forums',
  SPAM = 'spam',
  IMPORTANT = 'important',
  UNREAD = 'unread',
  CUSTOM = 'custom',
}

/**
 * Category display information
 */
export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isSystem: boolean;
  priority: number;
}

/**
 * Category confidence result
 */
export interface CategoryConfidence {
  category: EmailCategory | string;
  confidence: number; // 0-1
  reasoning?: string;
}

/**
 * Full categorization result with alternatives
 */
export interface CategorizationResult {
  primary: CategoryConfidence;
  alternatives: CategoryConfidence[];
  timestamp: string;
  modelVersion: string;
  processingTime: number; // ms
}

/**
 * Custom category definition
 */
export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  keywords: string[];
  senders: string[];
  subjects: string[];
  examples: string[]; // Email IDs used for training
  createdAt: string;
  updatedAt: string;
}

/**
 * Training example for categorization
 */
export interface TrainingExample {
  emailId: string;
  categoryId: string;
  userId: string;
  timestamp: string;
  feedbackType: 'positive' | 'negative';
}

/**
 * Model configuration
 */
export interface CategorizationModelConfig {
  enabled: boolean;
  modelVersion: string;
  minConfidence: number; // Minimum confidence to auto-categorize
  maxAlternatives: number;
  enableAutoTraining: boolean;
  trainingBatchSize: number;
  processingMode: 'local' | 'server' | 'hybrid';
}

/**
 * Feature extraction for ML model
 */
export interface EmailFeatures {
  sender: string;
  senderDomain: string;
  subject: string;
  subjectWords: string[];
  bodyPreview: string;
  bodyWords: string[];
  hasAttachments: boolean;
  attachmentTypes: string[];
  hasLinks: boolean;
  linkCount: number;
  isReply: boolean;
  isForward: boolean;
  recipientCount: number;
  ccCount: number;
  timestamp: string;
  hourOfDay: number;
  dayOfWeek: number;
  priority: 'high' | 'normal' | 'low';
  hasUnsubscribeLink: boolean;
  hasPromoKeywords: boolean;
  hasUrgencyKeywords: boolean;
  language: string;
}

/**
 * Categorization statistics
 */
export interface CategorizationStats {
  totalEmailsCategorized: number;
  categoryCounts: Record<string, number>;
  averageConfidence: number;
  accuracy: number;
  lastTrainingDate: string | null;
  modelVersion: string;
  processingTimeAvg: number;
}

/**
 * Batch categorization result
 */
export interface BatchCategorizationResult {
  results: Map<string, CategorizationResult>;
  processedCount: number;
  failedCount: number;
  totalTime: number;
}

/**
 * Model training result
 */
export interface TrainingResult {
  success: boolean;
  categoryId: string;
  examplesAdded: number;
  modelVersion: string;
  accuracy?: number;
  error?: string;
}

/**
 * Categorization rule (user-defined)
 */
export interface CategorizationRule {
  id: string;
  categoryId: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: CategorizationCondition[];
  logicOperator: 'and' | 'or';
}

/**
 * Rule condition
 */
export interface CategorizationCondition {
  field: 'sender' | 'subject' | 'body' | 'domain' | 'hasAttachment';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'matches';
  value: string;
  caseSensitive: boolean;
}

/**
 * Default system categories
 */
export const SYSTEM_CATEGORIES: CategoryInfo[] = [
  {
    id: EmailCategory.WORK,
    name: 'Work',
    description: 'Work-related emails',
    icon: 'briefcase',
    color: '#3b82f6',
    isSystem: true,
    priority: 1
  },
  {
    id: EmailCategory.PERSONAL,
    name: 'Personal',
    description: 'Personal emails from friends and family',
    icon: 'user',
    color: '#22c55e',
    isSystem: true,
    priority: 2
  },
  {
    id: EmailCategory.PROMOTIONS,
    name: 'Promotions',
    description: 'Marketing and promotional emails',
    icon: 'tag',
    color: '#f59e0b',
    isSystem: true,
    priority: 3
  },
  {
    id: EmailCategory.SOCIAL,
    name: 'Social',
    description: 'Social network notifications',
    icon: 'users',
    color: '#ec4899',
    isSystem: true,
    priority: 4
  },
  {
    id: EmailCategory.UPDATES,
    name: 'Updates',
    description: 'Notifications and updates',
    icon: 'bell',
    color: '#8b5cf6',
    isSystem: true,
    priority: 5
  },
  {
    id: EmailCategory.FINANCE,
    name: 'Finance',
    description: 'Banking and financial emails',
    icon: 'credit-card',
    color: '#10b981',
    isSystem: true,
    priority: 6
  },
  {
    id: EmailCategory.TRAVEL,
    name: 'Travel',
    description: 'Travel and booking confirmations',
    icon: 'plane',
    color: '#06b6d4',
    isSystem: true,
    priority: 7
  },
  {
    id: EmailCategory.SHOPPING,
    name: 'Shopping',
    description: 'E-commerce and shopping emails',
    icon: 'shopping-cart',
    color: '#f97316',
    isSystem: true,
    priority: 8
  },
  {
    id: EmailCategory.NEWS,
    name: 'News',
    description: 'Newsletters and news updates',
    icon: 'newspaper',
    color: '#6366f1',
    isSystem: true,
    priority: 9
  },
  {
    id: EmailCategory.FORUMS,
    name: 'Forums',
    description: 'Forum and community notifications',
    icon: 'message-circle',
    color: '#84cc16',
    isSystem: true,
    priority: 10
  },
  {
    id: EmailCategory.IMPORTANT,
    name: 'Important',
    description: 'High-priority important emails',
    icon: 'alert-circle',
    color: '#ef4444',
    isSystem: true,
    priority: 0
  },
  {
    id: EmailCategory.SPAM,
    name: 'Spam',
    description: 'Unwanted or spam emails',
    icon: 'shield-off',
    color: '#6b7280',
    isSystem: true,
    priority: 11
  }
];

/**
 * Default model configuration
 */
export const DEFAULT_CATEGORIZATION_CONFIG: CategorizationModelConfig = {
  enabled: true,
  modelVersion: '1.0.0',
  minConfidence: 0.7,
  maxAlternatives: 3,
  enableAutoTraining: true,
  trainingBatchSize: 100,
  processingMode: 'local'
};
