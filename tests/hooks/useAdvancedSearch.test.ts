import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdvancedSearch } from '../../src/hooks/useAdvancedSearch';
import type { Email } from '../../src/types';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

const mockEmails: Email[] = [
  {
    id: 'email-1',
    subject: 'Test Subject',
    from: 'sender@example.com',
    to: 'recipient@example.com',
    body: 'This is a test email body',
    date: new Date('2024-01-15'),
    read: false,
    starred: true,
    hasAttachments: true,
    encrypted: true,
    folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' },
  },
  {
    id: 'email-2',
    subject: 'Another Email',
    from: 'work@company.com',
    to: 'me@example.com',
    body: 'Work related content',
    date: new Date('2024-01-20'),
    read: true,
    starred: false,
    hasAttachments: false,
    encrypted: false,
    folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' },
  },
  {
    id: 'email-3',
    subject: 'Project Update',
    from: 'manager@company.com',
    to: 'team@company.com',
    body: 'Please review the project update',
    date: new Date('2024-01-25'),
    read: false,
    starred: false,
    hasAttachments: true,
    encrypted: true,
    folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' },
  },
];

describe('useAdvancedSearch', () => {
  it('should initialize with empty search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    expect(result.current.searchQuery).toBe('');
    expect(result.current.advancedSearch.conditions).toEqual([]);
    expect(result.current.filteredEmails).toEqual(mockEmails);
    expect(result.current.resultCount).toBe(3);
  });

  it('should perform basic search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.handleSearchChange('Test');
    });

    expect(result.current.searchQuery).toBe('Test');
    expect(result.current.filteredEmails).toHaveLength(1);
    expect(result.current.filteredEmails[0].subject).toBe('Test Subject');
  });

  it('should search in subject, from, and body', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    // Search in subject
    act(() => {
      result.current.handleSearchChange('Project');
    });
    expect(result.current.filteredEmails).toHaveLength(1);

    // Search in from
    act(() => {
      result.current.handleSearchChange('work@company');
    });
    expect(result.current.filteredEmails).toHaveLength(1);

    // Search in body
    act(() => {
      result.current.clearSearch();
      result.current.handleSearchChange('review');
    });
    expect(result.current.filteredEmails).toHaveLength(1);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.handleSearchChange('Test');
    });

    expect(result.current.filteredEmails).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.filteredEmails).toHaveLength(3);
  });

  it('should add search condition', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(1);
    expect(result.current.advancedSearch.conditions[0].field).toBe('from');
    expect(result.current.advancedSearch.conditions[0].operator).toBe('contains');
    expect(result.current.advancedSearch.conditions[0].value).toBe('company.com');
  });

  it('should filter emails by condition', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    expect(result.current.filteredEmails).toHaveLength(2);
    expect(result.current.filteredEmails.every(e => e.from.includes('company.com'))).toBe(true);
  });

  it('should update search condition', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'test',
      });
    });

    const conditionId = result.current.advancedSearch.conditions[0].id;

    act(() => {
      result.current.updateCondition(conditionId, { value: 'company.com' });
    });

    expect(result.current.advancedSearch.conditions[0].value).toBe('company.com');
  });

  it('should remove search condition', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(1);

    const conditionId = result.current.advancedSearch.conditions[0].id;

    act(() => {
      result.current.removeCondition(conditionId);
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(0);
  });

  it('should clear all conditions', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'test',
      });
      result.current.addCondition({
        field: 'subject',
        operator: 'contains',
        value: 'email',
      });
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(2);

    act(() => {
      result.current.clearConditions();
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(0);
    expect(result.current.searchQuery).toBe('');
  });

  it('should handle match mode all', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    // Add two conditions that both must match
    act(() => {
      result.current.addCondition({
        field: 'has_attachment',
        operator: 'equals',
        value: 'true',
      });
      result.current.setMatchMode('all');
    });

    // Add second condition
    act(() => {
      result.current.addCondition({
        field: 'is_starred',
        operator: 'equals',
        value: 'true',
      });
    });

    // Only email-1 has both attachment and starred
    expect(result.current.filteredEmails).toHaveLength(1);
    expect(result.current.filteredEmails[0].id).toBe('email-1');
  });

  it('should handle match mode any', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'is_starred',
        operator: 'equals',
        value: 'true',
      });
      // Match mode 'any' is default
    });

    act(() => {
      result.current.addCondition({
        field: 'has_attachment',
        operator: 'equals',
        value: 'true',
      });
    });

    // Should match emails with either starred OR has_attachment
    // email-1: starred=true, hasAttachment=true
    // email-3: hasAttachment=true
    expect(result.current.filteredEmails).toHaveLength(2);
  });

  it('should toggle case sensitive', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    expect(result.current.advancedSearch.caseSensitive).toBe(false);

    act(() => {
      result.current.toggleCaseSensitive();
    });

    expect(result.current.advancedSearch.caseSensitive).toBe(true);

    act(() => {
      result.current.toggleCaseSensitive();
    });

    expect(result.current.advancedSearch.caseSensitive).toBe(false);
  });

  it('should save search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    act(() => {
      result.current.saveSearch('Company Emails');
    });

    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].name).toBe('Company Emails');
  });

  it('should load saved search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    // Create and save a search
    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    act(() => {
      result.current.saveSearch('Company Emails');
    });

    // Clear conditions
    act(() => {
      result.current.clearConditions();
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(0);

    // Load saved search
    act(() => {
      result.current.loadSavedSearch(result.current.savedSearches[0]);
    });

    expect(result.current.advancedSearch.conditions).toHaveLength(1);
    expect(result.current.advancedSearch.conditions[0].value).toBe('company.com');
  });

  it('should delete saved search', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.addCondition({
        field: 'from',
        operator: 'contains',
        value: 'company.com',
      });
    });

    act(() => {
      result.current.saveSearch('Company Emails');
    });

    expect(result.current.savedSearches).toHaveLength(1);

    act(() => {
      result.current.deleteSavedSearch(result.current.savedSearches[0].id);
    });

    expect(result.current.savedSearches).toHaveLength(0);
  });

  it('should track recent searches', () => {
    const { result } = renderHook(() => useAdvancedSearch(mockEmails));

    act(() => {
      result.current.handleSearchChange('test');
    });

    expect(result.current.recentSearches).toContain('test');
    expect(result.current.stats.recentSearches).toContain('test');
  });
});