import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../../src/hooks/useSearch';
import { Email } from '../../src/types';

describe('useSearch', () => {
  const mockEmails: Email[] = [
    {
      id: '1',
      from: 'john@example.com',
      to: 'user@example.com',
      subject: 'Project Update',
      body: 'This is a project update',
      date: new Date(),
      read: false,
      starred: false,
      encrypted: true,
      hasAttachments: false,
      folder: { id: 'inbox', name: 'Inbox', count: 1, icon: '📥' },
    },
    {
      id: '2',
      from: 'jane@example.com',
      to: 'user@example.com',
      subject: 'Meeting Request',
      body: 'Can we schedule a meeting?',
      date: new Date(),
      read: false,
      starred: false,
      encrypted: true,
      hasAttachments: false,
      folder: { id: 'inbox', name: 'Inbox', count: 1, icon: '📥' },
    },
  ];

  it('should return all emails when search query is empty', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    expect(result.current.filteredEmails).toHaveLength(2);
    expect(result.current.resultCount).toBe(2);
  });

  it('should filter emails by subject', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    act(() => {
      result.current.handleSearchChange('Project');
    });
    
    expect(result.current.filteredEmails).toHaveLength(1);
    expect(result.current.filteredEmails[0].subject).toBe('Project Update');
  });

  it('should filter emails by from address', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    act(() => {
      result.current.handleSearchChange('john');
    });
    
    expect(result.current.filteredEmails).toHaveLength(1);
    expect(result.current.filteredEmails[0].from).toBe('john@example.com');
  });

  it('should filter emails by body content', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    act(() => {
      result.current.handleSearchChange('meeting');
    });
    
    expect(result.current.filteredEmails).toHaveLength(1);
    expect(result.current.filteredEmails[0].subject).toBe('Meeting Request');
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    act(() => {
      result.current.handleSearchChange('PROJECT');
    });
    
    expect(result.current.filteredEmails).toHaveLength(1);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useSearch(mockEmails));
    
    act(() => {
      result.current.handleSearchChange('Project');
    });
    expect(result.current.filteredEmails).toHaveLength(1);
    
    act(() => {
      result.current.clearSearch();
    });
    expect(result.current.filteredEmails).toHaveLength(2);
    expect(result.current.searchQuery).toBe('');
  });
});
