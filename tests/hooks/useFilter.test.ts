import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../../src/hooks/useFilter';
import { Email } from '../../src/types';

describe('useFilter', () => {
  const mockEmails: Email[] = [
    {
      id: '1',
      from: 'alice@example.com',
      to: 'user@example.com',
      subject: 'Encrypted with attachment',
      body: 'Body 1',
      date: new Date('2024-03-01'),
      read: false,
      starred: true,
      encrypted: true,
      hasAttachments: true,
      folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' }
    },
    {
      id: '2',
      from: 'bob@example.com',
      to: 'user@example.com',
      subject: 'Plain email',
      body: 'Body 2',
      date: new Date('2024-03-02'),
      read: true,
      starred: false,
      encrypted: false,
      hasAttachments: false,
      folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' }
    },
    {
      id: '3',
      from: 'phantom@vantis.com',
      to: 'user@example.com',
      subject: 'Phantom alias email',
      body: 'Body 3',
      date: new Date('2024-03-03'),
      read: false,
      starred: false,
      encrypted: true,
      hasAttachments: false,
      phantomAlias: 'phantom@vantis.com',
      folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' }
    },
    {
      id: '4',
      from: 'urgent@example.com',
      to: 'user@example.com',
      subject: 'Self-destruct email',
      body: 'Body 4',
      date: new Date('2024-03-04'),
      read: true,
      starred: true,
      encrypted: true,
      hasAttachments: true,
      selfDestruct: new Date('2024-04-01'),
      folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' }
    }
  ];

  describe('initial state', () => {
    it('should return all emails with no filters', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      expect(result.current.filteredEmails).toHaveLength(4);
      expect(result.current.activeFilterCount).toBe(0);
      expect(result.current.filters).toEqual({});
    });

    it('should handle empty email array', () => {
      const { result } = renderHook(() => useFilter([]));

      expect(result.current.filteredEmails).toHaveLength(0);
    });
  });

  describe('setFilter', () => {
    it('should filter by encrypted', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', true);
      });

      expect(result.current.filteredEmails).toHaveLength(3);
      expect(result.current.filteredEmails.every((e) => e.encrypted)).toBe(true);
      expect(result.current.activeFilterCount).toBe(1);
    });

    it('should filter by non-encrypted', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', false);
      });

      expect(result.current.filteredEmails).toHaveLength(1);
      expect(result.current.filteredEmails[0].id).toBe('2');
    });

    it('should filter by hasAttachments', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('hasAttachments', true);
      });

      expect(result.current.filteredEmails).toHaveLength(2);
      expect(result.current.filteredEmails.every((e) => e.hasAttachments)).toBe(true);
    });

    it('should filter by unread', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('unread', true);
      });

      // unread filter: email.read === filters.unread returns false when email.read !== true
      // So unread=true means email.read should NOT equal true => unread emails
      expect(result.current.filteredEmails).toHaveLength(2);
      expect(result.current.filteredEmails.every((e) => !e.read)).toBe(true);
    });

    it('should filter by starred', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('starred', true);
      });

      expect(result.current.filteredEmails).toHaveLength(2);
      expect(result.current.filteredEmails.every((e) => e.starred)).toBe(true);
    });

    it('should filter by hasPhantomAlias', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('hasPhantomAlias', true);
      });

      expect(result.current.filteredEmails).toHaveLength(1);
      expect(result.current.filteredEmails[0].id).toBe('3');
    });

    it('should filter by hasSelfDestruct', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('hasSelfDestruct', true);
      });

      expect(result.current.filteredEmails).toHaveLength(1);
      expect(result.current.filteredEmails[0].id).toBe('4');
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', true);
        result.current.setFilter('starred', true);
      });

      expect(result.current.filteredEmails).toHaveLength(2);
      expect(result.current.activeFilterCount).toBe(2);
      expect(result.current.filteredEmails.every((e) => e.encrypted && e.starred)).toBe(true);
    });

    it('should remove filter when set to undefined', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', true);
      });
      expect(result.current.filteredEmails).toHaveLength(3);

      act(() => {
        result.current.setFilter('encrypted', undefined);
      });
      expect(result.current.filteredEmails).toHaveLength(4);
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe('toggleFilter', () => {
    it('should toggle filter from undefined to true', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.toggleFilter('encrypted');
      });

      expect(result.current.filters.encrypted).toBe(true);
    });

    it('should toggle filter from true to false', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.toggleFilter('encrypted'); // undefined -> true
      });
      act(() => {
        result.current.toggleFilter('encrypted'); // true -> false
      });

      expect(result.current.filters.encrypted).toBe(false);
    });

    it('should toggle filter from false to undefined (remove)', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.toggleFilter('encrypted'); // undefined -> true
      });
      act(() => {
        result.current.toggleFilter('encrypted'); // true -> false
      });
      act(() => {
        result.current.toggleFilter('encrypted'); // false -> removed
      });

      expect(result.current.filters.encrypted).toBeUndefined();
      expect(result.current.activeFilterCount).toBe(0);
    });
  });

  describe('clearFilters', () => {
    it('should clear all active filters', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', true);
        result.current.setFilter('starred', true);
        result.current.setFilter('hasAttachments', true);
      });
      expect(result.current.activeFilterCount).toBe(3);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.activeFilterCount).toBe(0);
      expect(result.current.filteredEmails).toHaveLength(4);
    });
  });

  describe('activeFilterCount', () => {
    it('should count only defined filters', () => {
      const { result } = renderHook(() => useFilter(mockEmails));

      act(() => {
        result.current.setFilter('encrypted', true);
        result.current.setFilter('starred', false);
      });

      expect(result.current.activeFilterCount).toBe(2);
    });
  });

  describe('reactivity', () => {
    it('should re-filter when emails change', () => {
      const { result, rerender } = renderHook(({ emails }) => useFilter(emails), {
        initialProps: { emails: mockEmails }
      });

      act(() => {
        result.current.setFilter('encrypted', true);
      });
      expect(result.current.filteredEmails).toHaveLength(3);

      rerender({ emails: [mockEmails[0]] });
      expect(result.current.filteredEmails).toHaveLength(1);
    });
  });
});
