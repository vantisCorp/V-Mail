// Enhanced Search Type Definitions for V-Mail v1.3.0

/**
 * Search scope
 */
export enum SearchScope {
  ALL = 'all',
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  ARCHIVED = 'archived',
  SPAM = 'spam',
  TRASH = 'trash',
  CUSTOM_FOLDER = 'custom_folder'
}

/**
 * Search field type
 */
export enum SearchFieldType {
  SUBJECT = 'subject',
  FROM = 'from',
  TO = 'to',
  CC = 'cc',
  BODY = 'body',
  ATTACHMENTS = 'attachments',
  DATE = 'date',
  SIZE = 'size',
  LABELS = 'labels',
  PRIORITY = 'priority'
}

/**
 * Sort order
 */
export enum SortOrder {
  RELEVANCE = 'relevance',
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  SIZE_DESC = 'size_desc',
  SIZE_ASC = 'size_asc',
  SENDER_ASC = 'sender_asc',
  SENDER_DESC = 'sender_desc'
}

/**
 * Search operator
 */
export enum SearchOperator {
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN_LAST = 'in_last',
  BEFORE = 'before',
  AFTER = 'after'
}

/**
 * Search filter
 */
export interface SearchFilter {
  field: SearchFieldType;
  operator: SearchOperator;
  value: string | number | [string | number, string | number];
  caseSensitive?: boolean;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  start: string;
  end: string;
  field: 'sent' | 'received';
}

/**
 * Size range filter
 */
export interface SizeRangeFilter {
  min?: number;
  max?: number;
  unit: 'bytes' | 'kb' | 'mb';
}

/**
 * Advanced search query
 */
export interface AdvancedSearchQuery {
  text: string;
  scope: SearchScope;
  folderId?: string;
  filters: SearchFilter[];
  dateRange?: DateRangeFilter;
  sizeRange?: SizeRangeFilter;
  hasAttachments?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  labels?: string[];
  excludeLabels?: string[];
  sortOrder: SortOrder;
  pageSize: number;
  page: number;
}

/**
 * Simple search query
 */
export interface SimpleSearchQuery {
  text: string;
  scope?: SearchScope;
}

/**
 * Search suggestion type
 */
export enum SuggestionType {
  CONTACT = 'contact',
  SUBJECT = 'subject',
  KEYWORD = 'keyword',
  EMAIL_ADDRESS = 'email_address',
  LABEL = 'label',
  FOLDER = 'folder',
  RECENT_SEARCH = 'recent_search',
  SAVED_SEARCH = 'saved_search',
  SMART_SUGGESTION = 'smart_suggestion',
  HISTORY = 'history',
  OPERATOR = 'operator'
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  icon?: string;
  description?: string;
  count?: number; // Number of matching emails
  score?: number; // Relevance score
  metadata?: Record<string, unknown>;
}

/**
 * Search result item
 */
export interface SearchResultItem {
  id: string;
  emailId: string;
  subject: string;
  snippet: string;
  from: {
    name: string;
    email: string;
  };
  to: Array<{
    name: string;
    email: string;
  }>;
  date: string;
  size: number;
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  folder: string;
  relevanceScore: number;
  highlights: {
    field: string;
    fragments: string[];
  }[];
}

/**
 * Search results
 */
export interface SearchResults {
  query: string;
  items: SearchResultItem[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  executionTime: number; // milliseconds
  suggestions?: SearchSuggestion[];
  facets?: SearchFacets;
}

/**
 * Search facets for filtering
 */
export interface SearchFacets {
  senders: Array<{
    email: string;
    name: string;
    count: number;
  }>;
  dateRanges: Array<{
    label: string;
    start: string;
    end: string;
    count: number;
  }>;
  labels: Array<{
    name: string;
    count: number;
  }>;
  folders: Array<{
    name: string;
    count: number;
  }>;
  hasAttachments: {
    yes: number;
    no: number;
  };
  sizeRanges: Array<{
    label: string;
    min: number;
    max: number;
    count: number;
  }>;
}

/**
 * Saved search
 */
export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: AdvancedSearchQuery;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  useCount: number;
  isPinned: boolean;
  notificationEnabled: boolean;
  notificationFrequency?: 'instant' | 'daily' | 'weekly';
}

/**
 * Search history item
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  scope: SearchScope;
  timestamp: string;
  resultCount: number;
}

/**
 * Create saved search payload
 */
export interface CreateSavedSearchPayload {
  name: string;
  description?: string;
  query: Omit<AdvancedSearchQuery, 'page' | 'pageSize'>;
  notificationEnabled?: boolean;
  notificationFrequency?: 'instant' | 'daily' | 'weekly';
}

/**
 * Semantic search options
 */
export interface SemanticSearchOptions {
  enabled: boolean;
  expandSynonyms: boolean;
  includeRelated: boolean;
  minRelevanceScore: number; // 0-100
  contentUnderstanding: boolean;
}

/**
 * Natural language query
 */
export interface NaturalLanguageQuery {
  original: string;
  interpreted: {
    text: string;
    filters: SearchFilter[];
    scope: SearchScope;
    dateRange?: DateRangeFilter;
    intent: 'search' | 'filter' | 'action' | 'unknown';
  };
  confidence: number; // 0-100
}

/**
 * Smart categorization result
 */
export interface SmartCategorization {
  emailId: string;
  suggestedLabels: string[];
  suggestedFolder?: string;
  category: 'primary' | 'social' | 'promotions' | 'updates' | 'forums' | 'spam';
  confidence: number;
  reasons: string[];
}

/**
 * Auto-tagging result
 */
export interface AutoTaggingResult {
  emailId: string;
  suggestedTags: string[];
  confidence: Record<string, number>;
}
