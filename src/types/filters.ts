// Email Filter Types

export type FilterActionType = 
  | 'move_to_folder'
  | 'mark_as_read'
  | 'mark_as_important'
  | 'delete'
  | 'forward'
  | 'auto_reply'
  | 'label'
  | 'archive';

export type FilterConditionField = 
  | 'from'
  | 'to'
  | 'subject'
  | 'body'
  | 'has_attachment'
  | 'size_greater'
  | 'size_less'
  | 'priority';

export type FilterOperator = 
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex';

export interface FilterCondition {
  id: string;
  field: FilterConditionField;
  operator: FilterOperator;
  value: string;
}

export interface FilterAction {
  id: string;
  type: FilterActionType;
  value?: string; // folder name, email address, label name, etc.
}

export interface EmailFilter {
  id: string;
  name: string;
  enabled: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
  matchAll: boolean; // true = ALL conditions must match, false = ANY condition must match
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FilterStats {
  totalRules: number;
  activeRules: number;
  emailsProcessed: number;
  lastProcessed?: string;
}