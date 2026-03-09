// Email Rules & Automation Type Definitions for V-Mail v1.3.0

/**
 * Rule operator for conditions
 */
export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  REGEX = 'regex',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty'
}

/**
 * Rule field types
 */
export enum RuleFieldType {
  FROM = 'from',
  TO = 'to',
  CC = 'cc',
  SUBJECT = 'subject',
  BODY = 'body',
  ATTACHMENTS = 'attachments',
  PRIORITY = 'priority',
  LABEL = 'label',
  FOLDER = 'folder',
  DATE_RECEIVED = 'date_received',
  DATE_SENT = 'date_sent',
  SIZE = 'size',
  HEADER = 'header'
}

/**
 * Rule action types
 */
export enum RuleActionType {
  MOVE_TO_FOLDER = 'move_to_folder',
  ADD_LABEL = 'add_label',
  REMOVE_LABEL = 'remove_label',
  MARK_AS_READ = 'mark_as_read',
  MARK_AS_UNREAD = 'mark_as_unread',
  MARK_AS_STARRED = 'mark_as_starred',
  MARK_AS_UNSTARRED = 'mark_as_unstarred',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  FORWARD = 'forward',
  REPLY = 'reply',
  AUTO_REPLY = 'auto_reply',
  ADD_NOTE = 'add_note',
  SET_PRIORITY = 'set_priority',
  CATEGORIZE = 'categorize',
  SEND_NOTIFICATION = 'send_notification',
  CREATE_TASK = 'create_task',
  CREATE_CALENDAR_EVENT = 'create_calendar_event',
  COPY_TO_FOLDER = 'copy_to_folder',
  RUN_SCRIPT = 'run_script'
}

/**
 * Rule type categories
 */
export enum RuleType {
  AUTO_REPLY = 'auto_reply',
  FORWARDING = 'forwarding',
  CATEGORIZATION = 'categorization',
  CLEANUP = 'cleanup',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

/**
 * Rule priority
 */
export enum RulePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Rule status
 */
export enum RuleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled'
}

/**
 * Condition logic operator
 */
export enum ConditionLogic {
  AND = 'and',
  OR = 'or'
}

/**
 * Rule condition
 */
export interface RuleCondition {
  id: string;
  field: RuleFieldType;
  operator: RuleOperator;
  value: string | number | string[];
  customHeader?: string; // For HEADER field type
  caseSensitive?: boolean;
  negate?: boolean;
}

/**
 * Rule action
 */
export interface RuleAction {
  id: string;
  type: RuleActionType;
  parameters: Record<string, unknown>;
  delayMinutes?: number; // Execute after delay
  stopProcessing?: boolean; // Stop processing further rules
}

/**
 * Email rule
 */
export interface EmailRule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  status: RuleStatus;
  priority: RulePriority;
  conditions: RuleCondition[];
  conditionLogic: ConditionLogic;
  actions: RuleAction[];
  triggerOnIncoming: boolean;
  triggerOnOutgoing: boolean;
  triggerOnScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
  lastExecuted?: string;
  executionCount: number;
  executionHistory: RuleExecution[];
}

/**
 * Rule execution record
 */
export interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  emailId: string;
  emailSubject: string;
  emailFrom: string;
  triggeredAt: string;
  executedAt: string;
  duration: number; // Execution time in ms
  success: boolean;
  actionsExecuted: string[]; // Action IDs
  errorMessage?: string;
}

/**
 * Create rule payload
 */
export interface CreateRulePayload {
  name: string;
  description?: string;
  type: RuleType;
  priority: RulePriority;
  conditions: Omit<RuleCondition, 'id'>[];
  conditionLogic: ConditionLogic;
  actions: Omit<RuleAction, 'id'>[];
  triggerOnIncoming?: boolean;
  triggerOnOutgoing?: boolean;
  triggerOnScheduled?: boolean;
  schedule?: EmailRule['schedule'];
}

/**
 * Update rule payload
 */
export interface UpdateRulePayload {
  name?: string;
  description?: string;
  type?: RuleType;
  status?: RuleStatus;
  priority?: RulePriority;
  conditions?: Omit<RuleCondition, 'id'>[];
  conditionLogic?: ConditionLogic;
  actions?: Omit<RuleAction, 'id'>[];
  triggerOnIncoming?: boolean;
  triggerOnOutgoing?: boolean;
  triggerOnScheduled?: boolean;
  schedule?: EmailRule['schedule'];
}

/**
 * Rule test result
 */
export interface RuleTestResult {
  ruleId: string;
  ruleName: string;
  matches: boolean;
  matchedConditions: string[];
  actionsToExecute: RuleAction[];
  estimatedTime?: number;
  warnings?: string[];
}

/**
 * Rule statistics
 */
export interface RuleStatistics {
  ruleId: string;
  ruleName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  lastExecuted: string;
  executionsByDay: {
    date: string;
    count: number;
  }[];
  executionsByHour: {
    hour: number;
    count: number;
  }[];
  topTriggeredConditions: {
    conditionId: string;
    field: RuleFieldType;
    triggerCount: number;
  }[];
}

/**
 * Rule filter options
 */
export interface RuleFilter {
  type?: RuleType;
  status?: RuleStatus;
  priority?: RulePriority;
  createdBy?: string;
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Rule template
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: RuleType;
  conditions: Omit<RuleCondition, 'id'>[];
  conditionLogic: ConditionLogic;
  actions: Omit<RuleAction, 'id'>[];
  isSystem: boolean;
  popularity: number; // Usage count
}

/**
 * Email context for rule evaluation
 */
export interface EmailContext {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyPlain?: string;
  hasAttachments: boolean;
  attachmentNames?: string[];
  priority?: 'low' | 'normal' | 'high';
  labels: string[];
  folder: string;
  dateReceived: string;
  dateSent?: string;
  size: number; // in bytes
  headers?: Record<string, string>;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  direction: 'incoming' | 'outgoing' | 'internal';
}

/**
 * Rule execution context
 */
export interface RuleExecutionContext {
  rule: EmailRule;
  email: EmailContext;
  timestamp: string;
  dryRun: boolean; // If true, don't actually execute actions
}

/**
 * Batch rule execution request
 */
export interface BatchRuleExecution {
  ruleIds: string[];
  emailIds: string[];
  dryRun?: boolean;
}
