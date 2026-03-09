import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSort } from '../../src/hooks/useSort';
import { Email } from '../../src/types';

describe('useSort', () => {
  const mockEmails: Email[] = [
    {
      id: '1',
      from: 'alice@example.com',
      to: 'user@example.com',
      subject: 'Alpha Report',
      body: 'First email',
      date: new Date('2024-03-01T10:00:00'),
      read: false,
      starred: false,
      encrypted: false,
      hasAttachments: false,
      folder: { id: 'inbox', name: 'Inbox', count: 3, icon: '📥' }
    },
    {
      id: '2',
      from: 'bob@example.com',
      to: 'user@example.com',
      subject: 'Charlie Update',
      body: 'Second email',
      date: new Date('2024-03-03T10:00:00'),
      read: true,
      starred: true,
      encrypted: true,
      hasAttachments: true,
      folder: { id: 'inbox', name: 'Inbox', count: 3, icon: '📥' }
    },
    {
      id: '3',
      from: 'charlie@example.com',
      to: 'user@example.com',
      subject: 'Bravo Meeting',
      body: 'Third email',
      date: new Date('2024-03-02T10:00:00'),
      read: false,
      starred: false,
      encrypted: false,
      hasAttachments: false,
      folder: { id: 'inbox', name: 'Inbox', count: 3, icon: '📥' }
    }
  ];

  describe('initial state', () => {
    it('should default to sorting by date descending', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      expect(result.current.sortOptions.field).toBe('date');
      expect(result.current.sortOptions.order).toBe('desc');
    });

    it('should sort emails by date descending initially', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      expect(result.current.sortedEmails[0].id).toBe('2'); // Mar 3
      expect(result.current.sortedEmails[1].id).toBe('3'); // Mar 2
      expect(result.current.sortedEmails[2].id).toBe('1'); // Mar 1
    });

    it('should handle empty email array', () => {
      const { result } = renderHook(() => useSort([]));

      expect(result.current.sortedEmails).toHaveLength(0);
    });
  });

  describe('setSortField', () => {
    it('should sort by from field ascending on first click', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortField('from');
      });

      expect(result.current.sortOptions.field).toBe('from');
      expect(result.current.sortOptions.order).toBe('desc');
      // desc: charlie > bob > alice
      expect(result.current.sortedEmails[0].from).toBe('charlie@example.com');
      expect(result.current.sortedEmails[2].from).toBe('alice@example.com');
    });

    it('should sort by subject field', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortField('subject');
      });

      expect(result.current.sortOptions.field).toBe('subject');
      // desc: Charlie > Bravo > Alpha
      expect(result.current.sortedEmails[0].subject).toBe('Charlie Update');
      expect(result.current.sortedEmails[2].subject).toBe('Alpha Report');
    });

    it('should toggle order when clicking same field', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      // Default is date desc
      act(() => {
        result.current.setSortField('date');
      });

      // Should toggle to asc
      expect(result.current.sortOptions.order).toBe('asc');
      expect(result.current.sortedEmails[0].id).toBe('1'); // Mar 1 first
      expect(result.current.sortedEmails[2].id).toBe('2'); // Mar 3 last
    });

    it('should toggle back to desc on third click', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortField('date'); // asc
      });
      act(() => {
        result.current.setSortField('date'); // desc
      });

      expect(result.current.sortOptions.order).toBe('desc');
    });

    it('should reset to desc when switching to a new field', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortField('date'); // toggle to asc
      });
      expect(result.current.sortOptions.order).toBe('asc');

      act(() => {
        result.current.setSortField('from'); // new field, should be desc
      });
      expect(result.current.sortOptions.field).toBe('from');
      expect(result.current.sortOptions.order).toBe('desc');
    });
  });

  describe('setSortOrder', () => {
    it('should set sort order to asc', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOptions.order).toBe('asc');
      expect(result.current.sortedEmails[0].id).toBe('1'); // oldest first
    });

    it('should set sort order to desc', () => {
      const { result } = renderHook(() => useSort(mockEmails));

      act(() => {
        result.current.setSortOrder('asc');
      });
      act(() => {
        result.current.setSortOrder('desc');
      });

      expect(result.current.sortOptions.order).toBe('desc');
      expect(result.current.sortedEmails[0].id).toBe('2'); // newest first
    });
  });

  describe('reactivity', () => {
    it('should re-sort when emails change', () => {
      const { result, rerender } = renderHook(({ emails }) => useSort(emails), {
        initialProps: { emails: mockEmails }
      });

      expect(result.current.sortedEmails).toHaveLength(3);

      const newEmails = [mockEmails[0]];
      rerender({ emails: newEmails });

      expect(result.current.sortedEmails).toHaveLength(1);
    });

    it('should not mutate the original array', () => {
      const original = [...mockEmails];
      renderHook(() => useSort(mockEmails));

      expect(mockEmails).toEqual(original);
    });
  });
});
