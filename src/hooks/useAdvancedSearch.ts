import { useState, useCallback, useMemo } from 'react';
import { useNotifications } from './useNotifications';
import type { Email } from '../types';
import type {
  SearchCondition,
  SearchField,
  SearchMatchMode,
  SavedSearch,
  SearchStats,
} from '../types/search';

const generateId = () => `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Helper function to evaluate a single condition (moved outside the hook to avoid hoisting issues)
const evaluateCondition = (email: Email, condition: SearchCondition, caseSensitive: boolean): boolean => {
  let fieldValue: string | boolean | Date;

  switch (condition.field) {
    case 'all':
      // Search in all text fields
      const query = caseSensitive ? condition.value : condition.value.toLowerCase();
      const subject = caseSensitive ? email.subject : email.subject.toLowerCase();
      const from = caseSensitive ? email.from : email.from.toLowerCase();
      const body = caseSensitive ? email.body : email.body.toLowerCase();
      
      return (
        subject.includes(query) ||
        from.includes(query) ||
        body.includes(query)
      );
      
    case 'from':
      fieldValue = email.from;
      break;
    case 'to':
      fieldValue = email.to || '';
      break;
    case 'subject':
      fieldValue = email.subject;
      break;
    case 'body':
      fieldValue = email.body;
      break;
    case 'date':
      fieldValue = new Date(email.date);
      break;
    case 'has_attachment':
      fieldValue = email.hasAttachments || false;
      break;
    case 'is_read':
      fieldValue = email.read;
      break;
    case 'is_starred':
      fieldValue = email.starred;
      break;
    case 'has_label':
      // This would need label integration
      fieldValue = false;
      break;
    default:
      return false;
  }

  const conditionValue = caseSensitive ? condition.value : condition.value.toLowerCase();
  const compareValue = typeof fieldValue === 'string' && !caseSensitive
    ? fieldValue.toLowerCase()
    : fieldValue;

  switch (condition.operator) {
    case 'contains':
      return typeof fieldValue === 'string' && String(fieldValue).includes(conditionValue);
    case 'not_contains':
      return typeof fieldValue === 'string' && !String(fieldValue).includes(conditionValue);
    case 'equals':
      return String(fieldValue) === conditionValue;
    case 'not_equals':
      return String(fieldValue) !== conditionValue;
    case 'starts_with':
      return typeof fieldValue === 'string' && String(fieldValue).startsWith(conditionValue);
    case 'ends_with':
      return typeof fieldValue === 'string' && String(fieldValue).endsWith(conditionValue);
    case 'before':
      if (fieldValue instanceof Date) {
        const compareDate = new Date(conditionValue);
        return fieldValue < compareDate;
      }
      return false;
    case 'after':
      if (fieldValue instanceof Date) {
        const compareDate = new Date(conditionValue);
        return fieldValue > compareDate;
      }
      return false;
    case 'between':
      // Would need two values, simplified for now
      return false;
    default:
      return false;
  }
};

// Helper function to apply advanced search (moved outside to avoid hoisting issues)
const applyAdvancedSearch = (emailsToFilter: Email[], searchState: { conditions: SearchCondition[]; matchMode: SearchMatchMode; caseSensitive: boolean }) => {
  return emailsToFilter.filter((email) => {
    const results = searchState.conditions.map((condition) =>
      evaluateCondition(email, condition, searchState.caseSensitive)
    );

    const matches = searchState.matchMode === 'all'
      ? results.every(Boolean)
      : results.some(Boolean);

    return matches;
  });
};

export const useAdvancedSearch = (emails: Email[]) => {
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState({
    conditions: [] as SearchCondition[],
    matchMode: 'any' as SearchMatchMode,
    caseSensitive: false,
  });
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Basic search - now the helper functions are defined above, so no hoisting issue
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim() && advancedSearch.conditions.length === 0) {
      return emails;
    }

    // If advanced search conditions exist, use them
    if (advancedSearch.conditions.length > 0) {
      return applyAdvancedSearch(emails, advancedSearch);
    }

    // Otherwise use basic search
    const query = advancedSearch.caseSensitive ? searchQuery : searchQuery.toLowerCase();
    return emails.filter((email) => {
      const subject = advancedSearch.caseSensitive ? email.subject : email.subject.toLowerCase();
      const from = advancedSearch.caseSensitive ? email.from : email.from.toLowerCase();
      const body = advancedSearch.caseSensitive ? email.body : email.body.toLowerCase();

      return (
        subject.includes(query) ||
        from.includes(query) ||
        body.includes(query)
      );
    });
  }, [emails, searchQuery, advancedSearch]);

  const addCondition = useCallback((condition: Omit<SearchCondition, 'id'>) => {
    setAdvancedSearch((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { ...condition, id: generateId() }],
    }));
  }, []);

  const updateCondition = useCallback((id: string, updates: Partial<SearchCondition>) => {
    setAdvancedSearch((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setAdvancedSearch((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }));
  }, []);

  const clearConditions = useCallback(() => {
    setAdvancedSearch({
      conditions: [],
      matchMode: 'any',
      caseSensitive: false,
    });
    setSearchQuery('');
  }, []);

  const setMatchMode = useCallback((mode: SearchMatchMode) => {
    setAdvancedSearch((prev) => ({ ...prev, matchMode: mode }));
  }, []);

  const toggleCaseSensitive = useCallback(() => {
    setAdvancedSearch((prev) => ({ ...prev, caseSensitive: !prev.caseSensitive }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() && query.trim() !== searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== query);
        return [query, ...filtered].slice(0, 10);
      });
    }
  }, [searchQuery]);

  const saveSearch = useCallback((name: string) => {
    if (advancedSearch.conditions.length === 0 && !searchQuery.trim()) {
      addNotification('error', 'No search criteria to save');
      return;
    }

    const savedSearch: SavedSearch = {
      id: generateId(),
      name: name.trim(),
      conditions: advancedSearch.conditions,
      matchMode: advancedSearch.matchMode,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    setSavedSearches((prev) => [...prev, savedSearch]);
    addNotification('success', `Search "${name}" saved`);
  }, [advancedSearch, searchQuery, addNotification]);

  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setAdvancedSearch({
      conditions: savedSearch.conditions,
      matchMode: savedSearch.matchMode,
      caseSensitive: false,
    });
    setSearchQuery('');
    
    setSavedSearches((prev) =>
      prev.map((s) =>
        s.id === savedSearch.id
          ? { ...s, lastUsed: new Date().toISOString() }
          : s
      )
    );

    addNotification('success', `Loaded search "${savedSearch.name}"`);
  }, [addNotification]);

  const deleteSavedSearch = useCallback((id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    addNotification('success', 'Saved search deleted');
  }, [addNotification]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setAdvancedSearch({
      conditions: [],
      matchMode: 'any',
      caseSensitive: false,
    });
  }, []);

  const stats: SearchStats = useMemo(() => ({
    totalSearches: recentSearches.length,
    savedSearches: savedSearches.length,
    recentSearches,
  }), [recentSearches, savedSearches]);

  return {
    // Basic search
    searchQuery,
    filteredEmails,
    resultCount: filteredEmails.length,
    handleSearchChange,
    clearSearch,

    // Advanced search
    advancedSearch,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    setMatchMode,
    toggleCaseSensitive,

    // Saved searches
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,

    // Recent searches
    recentSearches,

    // Stats
    stats,
  };
};