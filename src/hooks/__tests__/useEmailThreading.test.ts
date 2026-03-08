/**
 * useEmailThreading Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEmailThreading } from '../useEmailThreading';
import { Email, ThreadedEmail } from '../../types/emailThreading';

const createMockEmail = (overrides: Partial<Email> = {}): Email => ({
  id: `email-${Math.random()}`,
  messageId: `msg-${Math.random()}`,
  subject: 'Test Subject',
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  body: 'Test body content',
  timestamp: new Date(),
  isRead: false,
  isStarred: false,
  folderId: 'inbox',
  ...overrides,
});

describe('useEmailThreading', () => {
  describe('initial state', () => {
    it('should initialize with empty state', async () => {
      // Use a stable empty array reference
      const emptyEmails: Email[] = [];

      const { result } = renderHook(() => useEmailThreading(emptyEmails));

      // The hook uses setTimeout(100ms) to simulate async operation
      // Use waitFor to wait for loading to complete
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000, interval: 50 }
      );

      expect(result.current.threads).toHaveLength(0);
      expect(result.current.allThreads).toHaveLength(0);
      expect(result.current.selectedThreadId).toBeNull();
    });

    it('should group emails into threads on mount', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Test Subject' }),
        createMockEmail({
          id: '2',
          messageId: 'msg2',
          subject: 'Re: Test Subject',
          inReplyTo: 'msg1',
        }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.threads).toHaveLength(1);
      expect(result.current.threads[0].messageCount).toBe(2);
    });
  });

  describe('thread selection', () => {
    it('should select a thread', () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      act(() => {
        result.current.selectThread('test-thread-id');
      });

      expect(result.current.selectedThreadId).toBe('test-thread-id');
    });

    it('should provide navigation state', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Subject 1' }),
        createMockEmail({ id: '2', messageId: 'msg2', subject: 'Subject 2' }),
        createMockEmail({ id: '3', messageId: 'msg3', subject: 'Subject 3' }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectThread(result.current.threads[0].id);
      });

      expect(result.current.navigation.canGoForward).toBe(true);
      expect(result.current.navigation.canGoBack).toBe(false);
    });
  });

  describe('thread expansion', () => {
    it('should toggle thread expansion', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.toggleThreadExpansion(threadId);
      });

      expect(result.current.isThreadExpanded(threadId)).toBe(true);

      act(() => {
        result.current.toggleThreadExpansion(threadId);
      });

      expect(result.current.isThreadExpanded(threadId)).toBe(false);
    });

    it('should expand thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.expandThread(threadId);
      });

      expect(result.current.isThreadExpanded(threadId)).toBe(true);
    });

    it('should collapse thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.expandThread(threadId);
      });

      act(() => {
        result.current.collapseThread(threadId);
      });

      expect(result.current.isThreadExpanded(threadId)).toBe(false);
    });
  });

  describe('thread navigation', () => {
    it('should navigate to next thread', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Subject 1' }),
        createMockEmail({ id: '2', messageId: 'msg2', subject: 'Subject 2' }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectThread(result.current.threads[0].id);
      });

      act(() => {
        result.current.goToNextThread();
      });

      expect(result.current.selectedThreadId).toBe(result.current.threads[1].id);
    });

    it('should navigate to previous thread', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Subject 1' }),
        createMockEmail({ id: '2', messageId: 'msg2', subject: 'Subject 2' }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.selectThread(result.current.threads[1].id);
      });

      act(() => {
        result.current.goToPreviousThread();
      });

      expect(result.current.selectedThreadId).toBe(result.current.threads[0].id);
    });
  });

  describe('thread actions', () => {
    it('should mark thread as read', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1', isRead: false })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.markThreadAsRead(threadId);
      });

      const updatedThread = result.current.threads.find((t) => t.id === threadId);
      expect(updatedThread?.unreadCount).toBe(0);
    });

    it('should mark thread as unread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1', isRead: true })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.markThreadAsUnread(threadId);
      });

      const updatedThread = result.current.threads.find((t) => t.id === threadId);
      expect(updatedThread?.unreadCount).toBeGreaterThan(0);
    });

    it('should archive thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.archiveThread(threadId);
      });

      expect(result.current.threads).toHaveLength(0);
    });

    it('should delete thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.deleteThread(threadId);
      });

      expect(result.current.threads).toHaveLength(0);
    });

    it('should star thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1', isStarred: false })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.starThread(threadId);
      });

      const updatedThread = result.current.threads.find((t) => t.id === threadId);
      expect(updatedThread?.messages.some((e) => e.isStarred)).toBe(true);
    });

    it('should unstar thread', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1', isStarred: true })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;

      act(() => {
        result.current.unstarThread(threadId);
      });

      const updatedThread = result.current.threads.find((t) => t.id === threadId);
      expect(updatedThread?.messages.some((e) => e.isStarred)).toBe(false);
    });
  });

  describe('preferences', () => {
    it('should update preferences', () => {
      const { result } = renderHook(() => useEmailThreading([]));

      act(() => {
        result.current.updatePreferences({ sortOrder: 'oldest' });
      });

      expect(result.current.preferences.sortOrder).toBe('oldest');
    });

    it('should update view mode', () => {
      const { result } = renderHook(() => useEmailThreading([]));

      act(() => {
        result.current.updatePreferences({ viewMode: 'flat' });
      });

      expect(result.current.preferences.viewMode).toBe('flat');
    });

    it('should update expand mode', () => {
      const { result } = renderHook(() => useEmailThreading([]));

      act(() => {
        result.current.updatePreferences({ expandMode: 'always' });
      });

      expect(result.current.preferences.expandMode).toBe('always');
    });
  });

  describe('filtering', () => {
    it('should update filter', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Important Email' }),
        createMockEmail({ id: '2', messageId: 'msg2', subject: 'Regular Email' }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateFilter({ subjectContains: 'important' });
      });

      expect(result.current.filter.subjectContains).toBe('important');
    });

    it('should clear filter', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      act(() => {
        result.current.updateFilter({ subjectContains: 'test' });
      });

      expect(result.current.filter.subjectContains).toBe('test');

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter.subjectContains).toBeUndefined();
    });
  });

  describe('statistics', () => {
    it('should calculate thread statistics', async () => {
      const emails = [
        createMockEmail({ id: '1', messageId: 'msg1', subject: 'Subject 1' }),
        createMockEmail({ id: '2', messageId: 'msg2', subject: 'Subject 2' }),
      ];

      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stats = result.current.stats;

      expect(stats.totalThreads).toBeGreaterThan(0);
      expect(stats.totalMessages).toBeGreaterThan(0);
    });
  });

  describe('helpers', () => {
    it('should get thread by ID', async () => {
      const emails = [createMockEmail({ id: '1', messageId: 'msg1' })];
      const { result } = renderHook(() => useEmailThreading(emails));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const threadId = result.current.threads[0].id;
      const thread = result.current.getThreadById(threadId);

      expect(thread).toBeDefined();
      expect(thread?.id).toBe(threadId);
    });

    it('should return undefined for non-existent thread', () => {
      const { result } = renderHook(() => useEmailThreading([]));

      const thread = result.current.getThreadById('non-existent');

      expect(thread).toBeUndefined();
    });
  });
});