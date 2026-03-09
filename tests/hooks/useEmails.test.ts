import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmails } from '../../src/hooks/useEmails';

describe('useEmails', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useEmails());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.emails).toHaveLength(0);
    });

    it('should default to inbox folder', () => {
      const { result } = renderHook(() => useEmails());

      expect(result.current.selectedFolder).toBe('inbox');
    });

    it('should load mock emails after timeout', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.emails).toHaveLength(5);
    });

    it('should provide folder list', () => {
      const { result } = renderHook(() => useEmails());

      expect(result.current.folders).toHaveLength(5);
      expect(result.current.folders.map((f) => f.id)).toEqual(['inbox', 'sent', 'drafts', 'starred', 'trash']);
    });

    it('should have correct folder properties', () => {
      const { result } = renderHook(() => useEmails());

      const inbox = result.current.folders.find((f) => f.id === 'inbox');
      expect(inbox).toBeDefined();
      expect(inbox!.name).toBe('Inbox');
      expect(inbox!.icon).toBe('📥');
      expect(typeof inbox!.count).toBe('number');
    });
  });

  describe('email data', () => {
    it('should have emails with correct structure', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const email = result.current.emails[0];
      expect(email.id).toBeDefined();
      expect(email.from).toBeDefined();
      expect(email.to).toBeDefined();
      expect(email.subject).toBeDefined();
      expect(email.body).toBeDefined();
      expect(email.date).toBeInstanceOf(Date);
      expect(typeof email.read).toBe('boolean');
      expect(typeof email.starred).toBe('boolean');
      expect(typeof email.encrypted).toBe('boolean');
      expect(typeof email.hasAttachments).toBe('boolean');
      expect(email.folder).toBeDefined();
    });

    it('should include emails with attachments', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const withAttachments = result.current.emails.filter((e) => e.hasAttachments);
      expect(withAttachments.length).toBeGreaterThan(0);
      expect(withAttachments[0].attachments).toBeDefined();
      expect(withAttachments[0].attachments!.length).toBeGreaterThan(0);
    });

    it('should include emails with phantom alias', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const withAlias = result.current.emails.filter((e) => e.phantomAlias);
      expect(withAlias.length).toBeGreaterThan(0);
    });

    it('should include emails with self-destruct', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const withSelfDestruct = result.current.emails.filter((e) => e.selfDestruct);
      expect(withSelfDestruct.length).toBeGreaterThan(0);
      expect(withSelfDestruct[0].selfDestruct).toBeInstanceOf(Date);
    });
  });

  describe('selectFolder', () => {
    it('should change selected folder', async () => {
      const { result } = renderHook(() => useEmails());

      act(() => {
        result.current.selectFolder('sent');
      });

      expect(result.current.selectedFolder).toBe('sent');
    });

    it('should change to any folder', async () => {
      const { result } = renderHook(() => useEmails());

      act(() => {
        result.current.selectFolder('drafts');
      });
      expect(result.current.selectedFolder).toBe('drafts');

      act(() => {
        result.current.selectFolder('trash');
      });
      expect(result.current.selectedFolder).toBe('trash');
    });
  });

  describe('getFilteredEmails', () => {
    it('should return inbox emails by default', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const filtered = result.current.getFilteredEmails();
      expect(filtered.every((e) => e.folder.id === 'inbox')).toBe(true);
    });

    it('should return starred emails when starred folder selected', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.selectFolder('starred');
      });

      const filtered = result.current.getFilteredEmails();
      expect(filtered.every((e) => e.starred)).toBe(true);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return empty array for folder with no emails', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.selectFolder('sent');
      });

      const filtered = result.current.getFilteredEmails();
      expect(filtered).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark an email as read', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const unreadEmail = result.current.emails.find((e) => !e.read);
      expect(unreadEmail).toBeDefined();

      act(() => {
        result.current.markAsRead(unreadEmail!.id);
      });

      const updated = result.current.emails.find((e) => e.id === unreadEmail!.id);
      expect(updated!.read).toBe(true);
    });

    it('should not affect other emails', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const beforeStates = result.current.emails.map((e) => ({ id: e.id, read: e.read }));

      act(() => {
        result.current.markAsRead('1');
      });

      result.current.emails.forEach((email) => {
        if (email.id !== '1') {
          const before = beforeStates.find((b) => b.id === email.id);
          expect(email.read).toBe(before!.read);
        }
      });
    });
  });

  describe('toggleStar', () => {
    it('should toggle star on an unstarred email', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const unstarred = result.current.emails.find((e) => !e.starred);
      expect(unstarred).toBeDefined();

      act(() => {
        result.current.toggleStar(unstarred!.id);
      });

      const updated = result.current.emails.find((e) => e.id === unstarred!.id);
      expect(updated!.starred).toBe(true);
    });

    it('should toggle star off a starred email', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const starred = result.current.emails.find((e) => e.starred);
      expect(starred).toBeDefined();

      act(() => {
        result.current.toggleStar(starred!.id);
      });

      const updated = result.current.emails.find((e) => e.id === starred!.id);
      expect(updated!.starred).toBe(false);
    });

    it('should toggle star back and forth', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const email = result.current.emails[0];
      const originalStarred = email.starred;

      act(() => {
        result.current.toggleStar(email.id);
      });
      expect(result.current.emails.find((e) => e.id === email.id)!.starred).toBe(!originalStarred);

      act(() => {
        result.current.toggleStar(email.id);
      });
      expect(result.current.emails.find((e) => e.id === email.id)!.starred).toBe(originalStarred);
    });
  });

  describe('deleteEmail', () => {
    it('should remove an email from the list', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.emails).toHaveLength(5);

      act(() => {
        result.current.deleteEmail('1');
      });

      expect(result.current.emails).toHaveLength(4);
      expect(result.current.emails.find((e) => e.id === '1')).toBeUndefined();
    });

    it('should not affect other emails when deleting', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.deleteEmail('3');
      });

      expect(result.current.emails.find((e) => e.id === '1')).toBeDefined();
      expect(result.current.emails.find((e) => e.id === '2')).toBeDefined();
      expect(result.current.emails.find((e) => e.id === '4')).toBeDefined();
      expect(result.current.emails.find((e) => e.id === '5')).toBeDefined();
    });

    it('should handle deleting non-existent email gracefully', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        result.current.deleteEmail('non-existent');
      });

      expect(result.current.emails).toHaveLength(5);
    });

    it('should be able to delete all emails', async () => {
      const { result } = renderHook(() => useEmails());

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const ids = result.current.emails.map((e) => e.id);
      ids.forEach((id) => {
        act(() => {
          result.current.deleteEmail(id);
        });
      });

      expect(result.current.emails).toHaveLength(0);
    });
  });
});
