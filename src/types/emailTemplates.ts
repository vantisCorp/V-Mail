// Email Templates Type Definitions for V-Mail v1.3.0

/**
 * Template types
 */
export enum TemplateType {
  STANDARD = 'standard',
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

/**
 * Template permissions
 */
export enum TemplatePermission {
  PRIVATE = 'private',
  TEAM_SHARED = 'team_shared',
  ORGANIZATION_SHARED = 'organization_shared',
  PUBLIC = 'public'
}

/**
 * Template variable types
 */
export enum VariableType {
  TEXT = 'text',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  CUSTOM = 'custom'
}

/**
 * Template condition operator
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty'
}

/**
 * Template variable
 */
export interface TemplateVariable {
  id: string;
  name: string;
  key: string; // {{recipient_name}}, {{date}}, etc.
  description: string;
  type: VariableType;
  defaultValue?: string;
  isRequired: boolean;
  example?: string;
}

/**
 * Template condition for conditional content
 */
export interface TemplateCondition {
  id: string;
  variableKey: string;
  operator: ConditionOperator;
  value: string;
}

/**
 * Template section
 */
export interface TemplateSection {
  id: string;
  name: string;
  order: number;
  content: string;
  conditions?: TemplateCondition[];
}

/**
 * Template version
 */
export interface TemplateVersion {
  id: string;
  version: string;
  content: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  createdAt: string;
  createdBy: string;
  createdByName: string;
  changeLog: string;
  isCurrent: boolean;
}

/**
 * Template analytics
 */
export interface TemplateAnalytics {
  templateId: string;
  templateName: string;
  totalUses: number;
  usesThisWeek: number;
  usesThisMonth: number;
  lastUsed: string;
  averageResponseRate?: number;
  clickThroughRate?: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    useCount: number;
  }>;
}

/**
 * Email template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  permission: TemplatePermission;
  categoryId?: string;
  ownerUserId: string;
  ownerUserName: string;
  ownerUserEmail: string;
  content: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  tags: string[];
  isFavorite: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  versions: TemplateVersion[];
  currentVersionId: string;
  analytics: TemplateAnalytics;
}

/**
 * Template category
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
}

/**
 * Create template payload
 */
export interface CreateTemplatePayload {
  name: string;
  description: string;
  type: TemplateType;
  permission: TemplatePermission;
  categoryId?: string;
  content: string;
  variables?: TemplateVariable[];
  sections?: TemplateSection[];
  tags?: string[];
}

/**
 * Update template payload
 */
export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  type?: TemplateType;
  permission?: TemplatePermission;
  categoryId?: string;
  content?: string;
  variables?: TemplateVariable[];
  sections?: TemplateSection[];
  tags?: string[];
  isFavorite?: boolean;
  versions?: TemplateVersion[];
  currentVersionId?: string;
}

/**
 * Clone template payload
 */
export interface CloneTemplatePayload {
  sourceTemplateId: string;
  name: string;
  description?: string;
  permission?: TemplatePermission;
}

/**
 * Preview template payload
 */
export interface PreviewTemplatePayload {
  templateId: string;
  variables: Record<string, string>;
}

/**
 * Search templates filter
 */
export interface TemplateFilter {
  type?: TemplateType;
  permission?: TemplatePermission;
  categoryId?: string;
  tags?: string[];
  isFavorite?: boolean;
  isSystem?: boolean;
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'totalUses';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Template usage log
 */
export interface TemplateUsageLog {
  id: string;
  templateId: string;
  templateName: string;
  templateVersion: string;
  userId: string;
  userName: string;
  userEmail: string;
  recipientEmail: string;
  subject: string;
  usedAt: string;
}

/**
 * Template validation result
 */
export interface TemplateValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    line?: number;
    column?: number;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    line?: number;
  }>;
}