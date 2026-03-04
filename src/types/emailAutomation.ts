/**
 * Email Automation & Rules Type Definitions
 * Supports rule-based email processing, automated responses, and workflow automation
 */

// Rule trigger types
export enum TriggerType {
  // Email content triggers
  FROM = 'from',
  TO = 'to',
  CC = 'cc',
  BCC = 'bcc',
  SUBJECT = 'subject',
  BODY = 'body',
  ATTACHMENT = 'attachment',
  
  // Email metadata triggers
  IMPORTANCE = 'importance',
  FLAGGED = 'flagged',
  READ = 'read',
  UNREAD = 'unread',
  
  // Time-based triggers
  RECEIVED = 'received',
  SENT = 'sent',
  DATE = 'date',
  
  // Custom triggers
  HEADER = 'header',
  TAG = 'tag',
  LABEL = 'label'
}

// Rule conditions
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  MATCHES_REGEX = 'matches_regex',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BEFORE = 'before',
  AFTER = 'after',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IN = 'in',
  NOT_IN = 'not_in'
}

// Rule action types
export enum ActionType {
  // Move/Copy actions
  MOVE_TO_FOLDER = 'move_to_folder',
  COPY_TO_FOLDER = 'copy_to_folder',
  MOVE_TO_SHARED_FOLDER = 'move_to_shared_folder',
  
  // Label actions
  ADD_LABEL = 'add_label',
  REMOVE_LABEL = 'remove_label',
  SET_LABEL = 'set_label',
  
  // Response actions
  REPLY = 'reply',
  REPLY_ALL = 'reply_all',
  FORWARD = 'forward',
  AUTO_REPLY = 'auto_reply',
  
  // Delete actions
  DELETE = 'delete',
  ARCHIVE = 'archive',
  MOVE_TO_TRASH = 'move_to_trash',
  
  // Flag actions
  MARK_READ = 'mark_read',
  MARK_UNREAD = 'mark_unread',
  FLAG = 'flag',
  UNFLAG = 'unflag',
  
  // Template actions
  USE_TEMPLATE = 'use_template',
  SEND_TEMPLATE = 'send_template',
  
  // Tag actions
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  
  // Priority actions
  SET_IMPORTANCE = 'set_importance',
  
  // Custom actions
  ADD_HEADER = 'add_header',
  REMOVE_HEADER = 'remove_header',
  MODIFY_SUBJECT = 'modify_subject',
  EXTRACT_DATA = 'extract_data',
  WEBHOOK = 'webhook',
  CUSTOM_SCRIPT = 'custom_script'
}

// Rule status
export enum RuleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
  TESTING = 'testing'
}

// Rule priority
export enum RulePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

// Condition interface
export interface RuleCondition {
  id: string;
  field: TriggerType;
  operator: ConditionOperator;
  value: string | string[] | number | boolean;
  caseSensitive?: boolean;
  negate?: boolean;
}

// Condition group (AND/OR logic)
export interface ConditionGroup {
  id: string;
  conditions: RuleCondition[];
  operator: 'AND' | 'OR';
}

// Action interface
export interface RuleAction {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
  delay?: number; // Delay in seconds before executing
  stopProcessing?: boolean; // Stop processing further rules
}

// Email automation rule
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  status: RuleStatus;
  priority: RulePriority;
  
  // Triggers and conditions
  triggerType: TriggerType;
  conditionGroups: ConditionGroup[];
  conditions: RuleCondition[];
  
  // Actions
  actions: RuleAction[];
  
  // Timing and execution
  applyTo?: 'incoming' | 'outgoing' | 'both';
  executeOn?: 'receive' | 'read' | 'send';
  schedule?: RuleSchedule;
  
  // Metadata
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Execution statistics
  executionCount: number;
  lastExecutedAt?: string;
  successCount: number;
  failureCount: number;
  
  // Testing
  isTesting?: boolean;
  testMode?: boolean;
}

// Rule schedule
export interface RuleSchedule {
  type: 'always' | 'schedule' | 'trigger';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  timezone?: string;
  startDate?: string;
  endDate?: string;
}

// Rule execution log
export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  emailId: string;
  emailSubject?: string;
  
  status: 'success' | 'failure' | 'partial';
  executedActions: Array<{
    actionId: string;
    actionType: ActionType;
    status: 'success' | 'failure';
    error?: string;
    duration?: number;
  }>;
  
  executedAt: string;
  executedBy: string;
  
  // Performance metrics
  totalDuration: number;
  
  // Additional data
  metadata?: Record<string, any>;
}

// Rule test result
export interface RuleTestResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  matchedConditions: string[];
  unmatchedConditions: string[];
  executedActions?: Array<{
    actionType: ActionType;
    success: boolean;
    preview: string;
  }>;
  executionTime: number;
  timestamp: string;
}

// Rule statistics
export interface RuleStatistics {
  ruleId: string;
  ruleName: string;
  
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  
  successRate: number;
  
  lastExecutedAt: string;
  averageExecutionTime: number;
  
  // Actions statistics
  actionStats: Array<{
    actionType: ActionType;
    count: number;
    successRate: number;
  }>;
  
  // Time-based statistics
  executionsByDay: Array<{
    date: string;
    count: number;
  }>;
  
  // Errors
  recentErrors: Array<{
    timestamp: string;
    error: string;
  }>;
}

// Template reference for actions
export interface TemplateReference {
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

// Webhook action payload
export interface WebhookActionPayload {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

// Extract data action configuration
export interface ExtractDataAction {
  fields: Array<{
    name: string;
    source: 'subject' | 'body' | 'header' | 'attachment';
    pattern: string;
    type: 'string' | 'number' | 'date' | 'boolean';
  }>;
  outputFormat: 'json' | 'csv' | 'xml';
  destination?: string; // URL or file path
}

// Rule validation error
export interface RuleValidationError {
  field: string;
  message: string;
  path?: string;
}

// Rule export/import
export interface RuleExport {
  rules: AutomationRule[];
  exportedAt: string;
  exportedBy: string;
  version: string;
}

// Rule category for organization
export interface RuleCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  ruleCount: number;
  createdAt: string;
  updatedAt: string;
}

// Payload types for operations
export type CreateRulePayload = Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failureCount'>;

export type UpdateRulePayload = Partial<CreateRulePayload> & {
  id: string;
};

export type CreateConditionPayload = Omit<RuleCondition, 'id'>;

export type CreateActionPayload = Omit<RuleAction, 'id'>;

export type CreateCategoryPayload = Omit<RuleCategory, 'id' | 'createdAt' | 'updatedAt' | 'ruleCount'>;