import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import type { EmailFilter, FilterCondition, FilterAction, FilterStats, FilterConditionField } from '../types/filters';

interface EmailFiltersContext {
  filters: EmailFilter[];
  stats: FilterStats;
  addFilter: (filter: Omit<EmailFilter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFilter: (id: string, filter: Partial<EmailFilter>) => void;
  deleteFilter: (id: string) => void;
  toggleFilter: (id: string) => void;
  duplicateFilter: (id: string) => void;
  reorderFilters: (fromIndex: number, toIndex: number) => void;
  applyFilters: (email: {
    from: string;
    to: string;
    subject: string;
    body: string;
    hasAttachment: boolean;
    size: number;
    priority: string;
  }) => { actions: FilterAction[]; matchedFilter: EmailFilter } | null;
  getFilterById: (id: string) => EmailFilter | undefined;
}

const generateId = () => `filter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useEmailFilters = (): EmailFiltersContext => {
  const { addNotification } = useNotifications();
  const [filters, setFilters] = useState<EmailFilter[]>([]);
  const [stats, setStats] = useState<FilterStats>({
    totalRules: 0,
    activeRules: 0,
    emailsProcessed: 0
  });

  const updateStats = useCallback((newFilters: EmailFilter[]) => {
    setStats({
      totalRules: newFilters.length,
      activeRules: newFilters.filter(f => f.enabled).length,
      emailsProcessed: stats.emailsProcessed,
      lastProcessed: stats.lastProcessed
    });
  }, [stats.emailsProcessed, stats.lastProcessed]);

  const addFilter = useCallback(
    (filter: Omit<EmailFilter, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newFilter: EmailFilter = {
        ...filter,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      const newFilters = [...filters, newFilter];
      setFilters(newFilters);
      updateStats(newFilters);
      addNotification('success', `Filter "${filter.name}" created`);
    },
    [filters, addNotification, updateStats]
  );

  const updateFilter = useCallback(
    (id: string, updates: Partial<EmailFilter>) => {
      const newFilters = filters.map((f) =>
        f.id === id
          ? { ...f, ...updates, updatedAt: new Date().toISOString() }
          : f
      );
      setFilters(newFilters);
      updateStats(newFilters);
      addNotification('success', 'Filter updated');
    },
    [filters, addNotification, updateStats]
  );

  const deleteFilter = useCallback(
    (id: string) => {
      const filter = filters.find(f => f.id === id);
      const newFilters = filters.filter((f) => f.id !== id);
      setFilters(newFilters);
      updateStats(newFilters);
      addNotification('success', `Filter "${filter?.name}" deleted`);
    },
    [filters, addNotification, updateStats]
  );

  const toggleFilter = useCallback(
    (id: string) => {
      const newFilters = filters.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      setFilters(newFilters);
      updateStats(newFilters);
      const filter = filters.find(f => f.id === id);
      addNotification('success', `Filter "${filter?.name}" ${filter?.enabled ? 'disabled' : 'enabled'}`);
    },
    [filters, addNotification, updateStats]
  );

  const duplicateFilter = useCallback(
    (id: string) => {
      const filter = filters.find(f => f.id === id);
      if (!filter) {
return;
}

      const now = new Date().toISOString();
      const newFilter: EmailFilter = {
        ...filter,
        id: generateId(),
        name: `${filter.name} (Copy)`,
        createdAt: now,
        updatedAt: now
      };
      const newFilters = [...filters, newFilter];
      setFilters(newFilters);
      updateStats(newFilters);
      addNotification('success', `Filter "${filter.name}" duplicated`);
    },
    [filters, addNotification, updateStats]
  );

  const reorderFilters = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newFilters = [...filters];
      const [removed] = newFilters.splice(fromIndex, 1);
      newFilters.splice(toIndex, 0, removed);

      // Update priorities
      newFilters.forEach((f, idx) => {
        f.priority = idx;
      });

      setFilters(newFilters);
      addNotification('success', 'Filters reordered');
    },
    [filters, addNotification]
  );

  const evaluateCondition = (
    condition: FilterCondition,
    email: {
      from: string;
      to: string;
      subject: string;
      body: string;
      hasAttachment: boolean;
      size: number;
      priority: string;
    }
  ): boolean => {
    // Handle size conditions specially with numeric comparison
    if (condition.field === 'size_greater') {
      const sizeMB = email.size / (1024 * 1024); // Convert bytes to MB
      const threshold = parseFloat(condition.value);
      if (isNaN(threshold)) {
return false;
}
      return sizeMB > threshold;
    }

    if (condition.field === 'size_less') {
      const sizeMB = email.size / (1024 * 1024); // Convert bytes to MB
      const threshold = parseFloat(condition.value);
      if (isNaN(threshold)) {
return false;
}
      return sizeMB < threshold;
    }

    let fieldValue: string | boolean;

    switch (condition.field as FilterConditionField) {
      case 'from':
        fieldValue = email.from.toLowerCase();
        break;
      case 'to':
        fieldValue = email.to.toLowerCase();
        break;
      case 'subject':
        fieldValue = email.subject.toLowerCase();
        break;
      case 'body':
        fieldValue = email.body.toLowerCase();
        break;
      case 'has_attachment':
        fieldValue = email.hasAttachment;
        break;
      case 'priority':
        fieldValue = email.priority.toLowerCase();
        break;
      default:
        return false;
    }

    const conditionValue = condition.value.toLowerCase();

    switch (condition.operator) {
      case 'contains':
        return String(fieldValue).includes(conditionValue);
      case 'not_contains':
        return !String(fieldValue).includes(conditionValue);
      case 'equals':
        return String(fieldValue) === conditionValue;
      case 'not_equals':
        return String(fieldValue) !== conditionValue;
      case 'starts_with':
        return String(fieldValue).startsWith(conditionValue);
      case 'ends_with':
        return String(fieldValue).endsWith(conditionValue);
      case 'matches_regex':
        try {
          const regex = new RegExp(conditionValue, 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  const applyFilters = useCallback(
    (email: {
      from: string;
      to: string;
      subject: string;
      body: string;
      hasAttachment: boolean;
      size: number;
      priority: string;
    }): { actions: FilterAction[]; matchedFilter: EmailFilter } | null => {
      // Sort filters by priority
      const sortedFilters = [...filters]
        .filter(f => f.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const filter of sortedFilters) {
        const results = filter.conditions.map(condition =>
          evaluateCondition(condition, email)
        );

        const matches = filter.matchAll
          ? results.every(Boolean)
          : results.some(Boolean);

        if (matches) {
          setStats(prev => ({
            ...prev,
            emailsProcessed: prev.emailsProcessed + 1,
            lastProcessed: new Date().toISOString()
          }));
          return { actions: filter.actions, matchedFilter: filter };
        }
      }

      return null;
    },
    [filters]
  );

  const getFilterById = useCallback(
    (id: string) => filters.find(f => f.id === id),
    [filters]
  );

  return {
    filters,
    stats,
    addFilter,
    updateFilter,
    deleteFilter,
    toggleFilter,
    duplicateFilter,
    reorderFilters,
    applyFilters,
    getFilterById
  };
};
