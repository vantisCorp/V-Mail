import { useState, useMemo, useCallback } from 'react';
import { Email } from '../types';

export const useSearch = (emails: Email[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) {
      return emails;
    }

    const query = searchQuery.toLowerCase();

    return emails.filter((email) => {
      return (
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.body.toLowerCase().includes(query)
      );
    });
  }, [emails, searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    filteredEmails,
    resultCount: filteredEmails.length,
    handleSearchChange,
    clearSearch
  };
};
