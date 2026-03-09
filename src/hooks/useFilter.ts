import { useState, useMemo, useCallback } from 'react';
import { Email, FilterOptions } from '../types';

export const useFilter = (emails: Email[]) => {
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (filters.encrypted !== undefined && email.encrypted !== filters.encrypted) {
        return false;
      }

      if (filters.hasAttachments !== undefined && email.hasAttachments !== filters.hasAttachments) {
        return false;
      }

      if (filters.unread !== undefined && email.read === filters.unread) {
        return false;
      }

      if (filters.starred !== undefined && email.starred !== filters.starred) {
        return false;
      }

      if (filters.hasPhantomAlias !== undefined) {
        const hasAlias = !!email.phantomAlias;
        if (hasAlias !== filters.hasPhantomAlias) {
          return false;
        }
      }

      if (filters.hasSelfDestruct !== undefined) {
        const hasDestruct = !!email.selfDestruct;
        if (hasDestruct !== filters.hasSelfDestruct) {
          return false;
        }
      }

      return true;
    });
  }, [emails, filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== undefined).length;
  }, [filters]);

  const setFilter = useCallback((key: keyof FilterOptions, value: boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const toggleFilter = useCallback((key: keyof FilterOptions) => {
    setFilters((prev) => {
      const currentValue = prev[key];
      if (currentValue === true) {
        return { ...prev, [key]: false };
      }
      if (currentValue === false) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    filteredEmails,
    activeFilterCount,
    setFilter,
    toggleFilter,
    clearFilters
  };
};
