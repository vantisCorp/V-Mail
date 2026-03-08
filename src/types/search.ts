// Advanced Search Types

export type SearchField =
  | 'all'
  | 'from'
  | 'to'
  | 'subject'
  | 'body'
  | 'date'
  | 'has_attachment'
  | 'is_read'
  | 'is_starred'
  | 'has_label';

export type SearchOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'before'
  | 'after'
  | 'between';

export interface SearchCondition {
  id: string;
  field: SearchField;
  operator: SearchOperator;
  value: string;
}

export type SearchMatchMode = 'all' | 'any';

export interface AdvancedSearchState {
  conditions: SearchCondition[];
  matchMode: SearchMatchMode;
  caseSensitive: boolean;
  searchInFolder: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface SavedSearch {
  id: string;
  name: string;
  conditions: SearchCondition[];
  matchMode: SearchMatchMode;
  createdAt: string;
  lastUsed?: string;
}

export interface SearchStats {
  totalSearches: number;
  savedSearches: number;
  recentSearches: string[];
}
