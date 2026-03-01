import { useState, useMemo, useCallback } from 'react';
import { Email, SortOptions } from '../types';

export const useSort = (emails: Email[]) => {
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'date',
    order: 'desc',
  });

  const sortedEmails = useMemo(() => {
    const sorted = [...emails].sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'from':
          comparison = a.from.localeCompare(b.from);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        default:
          comparison = 0;
      }

      return sortOptions.order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [emails, sortOptions]);

  const setSortField = useCallback((field: SortOptions['field']) => {
    setSortOptions((prev) => {
      if (prev.field === field) {
        return {
          ...prev,
          order: prev.order === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        field,
        order: 'desc',
      };
    });
  }, []);

  const setSortOrder = useCallback((order: SortOptions['order']) => {
    setSortOptions((prev) => ({ ...prev, order }));
  }, []);

  return {
    sortOptions,
    sortedEmails,
    setSortField,
    setSortOrder,
  };
};
