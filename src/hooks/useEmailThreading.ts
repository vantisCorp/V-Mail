/**
 * React Hook for Email Threading
 * Manages thread state, navigation, and actions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreadAlgorithm } from '../services/threadAlgorithm';
import {
  Email,
  EmailThread,
  ThreadPreferences,
  ThreadFilter,
  ThreadNavigation,
  ThreadAction,
  ThreadStats
} from '../types/emailThreading';

const DEFAULT_PREFERENCES: ThreadPreferences = {
  viewMode: 'grouped',
  expandMode: 'first',
  sortOrder: 'recent',
  excludeFolders: [],
  showAvatars: true,
  showPreview: true,
  maxPreviewLength: 100,
  autoMarkRead: false
};

export const useEmailThreading = (emails: Email[]) => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [preferences, setPreferences] = useState<ThreadPreferences>(DEFAULT_PREFERENCES);
  const [filter, setFilter] = useState<ThreadFilter>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Group emails into threads
  useEffect(() => {
    setLoading(true);

    // Simulate async operation
    setTimeout(() => {
      const groupedThreads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      setThreads(groupedThreads);
      setLoading(false);
    }, 100);
  }, [emails]);

  // Apply filters
  const filteredThreads = useMemo(() => {
    let result = threads;

    if (Object.keys(filter).length > 0) {
      result = ThreadAlgorithm.filterThreads(result, filter);
    }

    // Sort based on preferences
    result = ThreadAlgorithm.sortThreads(result, preferences.sortOrder);

    return result;
  }, [threads, filter, preferences.sortOrder]);

  // Get thread navigation state
  const getNavigation = useCallback((): ThreadNavigation => {
    if (!selectedThreadId) {
      return {
        currentThreadId: '',
        previousThreadId: null,
        nextThreadId: null,
        canGoBack: false,
        canGoForward: false
      };
    }

    const currentIndex = filteredThreads.findIndex((t) => t.id === selectedThreadId);

    return {
      currentThreadId: selectedThreadId,
      previousThreadId: currentIndex > 0 ? filteredThreads[currentIndex - 1].id : null,
      nextThreadId: currentIndex < filteredThreads.length - 1 ? filteredThreads[currentIndex + 1].id : null,
      canGoBack: currentIndex > 0,
      canGoForward: currentIndex < filteredThreads.length - 1
    };
  }, [selectedThreadId, filteredThreads]);

  // Get thread statistics
  const getStats = useCallback((): ThreadStats => {
    return ThreadAlgorithm.getThreadStats(filteredThreads);
  }, [filteredThreads]);

  // Toggle thread expansion
  const toggleThreadExpansion = useCallback((threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  }, []);

  // Expand thread
  const expandThread = useCallback((threadId: string) => {
    setExpandedThreads((prev) => new Set([...prev, threadId]));
  }, []);

  // Collapse thread
  const collapseThread = useCallback((threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(threadId);
      return newSet;
    });
  }, []);

  // Select thread
  const selectThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
  }, []);

  // Navigate to next thread
  const goToNextThread = useCallback(() => {
    const nav = getNavigation();
    if (nav.canGoForward && nav.nextThreadId) {
      setSelectedThreadId(nav.nextThreadId);
      expandThread(nav.nextThreadId);
    }
  }, [getNavigation, expandThread]);

  // Navigate to previous thread
  const goToPreviousThread = useCallback(() => {
    const nav = getNavigation();
    if (nav.canGoBack && nav.previousThreadId) {
      setSelectedThreadId(nav.previousThreadId);
      expandThread(nav.previousThreadId);
    }
  }, [getNavigation, expandThread]);

  // Mark thread as read
  const markThreadAsRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            unreadCount: 0,
            messages: thread.messages.map((email) => ({ ...email, isRead: true }))
          };
        }
        return thread;
      })
    );
  }, []);

  // Mark thread as unread
  const markThreadAsUnread = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            unreadCount: thread.messages.length,
            messages: thread.messages.map((email) => ({ ...email, isRead: false }))
          };
        }
        return thread;
      })
    );
  }, []);

  // Archive thread
  const archiveThread = useCallback((threadId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
  }, []);

  // Delete thread
  const deleteThread = useCallback((threadId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
  }, []);

  // Star thread
  const starThread = useCallback((threadId: string, emailId?: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          if (emailId) {
            return {
              ...thread,
              messages: thread.messages.map((email) => (email.id === emailId ? { ...email, isStarred: true } : email))
            };
          } else {
            return {
              ...thread,
              messages: thread.messages.map((email) => ({ ...email, isStarred: true }))
            };
          }
        }
        return thread;
      })
    );
  }, []);

  // Unstar thread
  const unstarThread = useCallback((threadId: string, emailId?: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          if (emailId) {
            return {
              ...thread,
              messages: thread.messages.map((email) => (email.id === emailId ? { ...email, isStarred: false } : email))
            };
          } else {
            return {
              ...thread,
              messages: thread.messages.map((email) => ({ ...email, isStarred: false }))
            };
          }
        }
        return thread;
      })
    );
  }, []);

  // Execute thread action
  const executeThreadAction = useCallback(
    (action: ThreadAction) => {
      switch (action.type) {
        case 'mark-read':
          markThreadAsRead(action.threadId);
          break;
        case 'mark-unread':
          markThreadAsUnread(action.threadId);
          break;
        case 'archive':
          archiveThread(action.threadId);
          break;
        case 'delete':
          deleteThread(action.threadId);
          break;
        case 'star':
          starThread(action.threadId, action.emailIds?.[0]);
          break;
        case 'unstar':
          unstarThread(action.threadId, action.emailIds?.[0]);
          break;
      }
    },
    [markThreadAsRead, markThreadAsUnread, archiveThread, deleteThread, starThread, unstarThread]
  );

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<ThreadPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
  }, []);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<ThreadFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  // Check if thread is expanded
  const isThreadExpanded = useCallback(
    (threadId: string) => {
      switch (preferences.expandMode) {
        case 'never':
          return false;
        case 'first':
          return expandedThreads.has(threadId);
        case 'always':
          return true;
        default:
          return expandedThreads.has(threadId);
      }
    },
    [preferences.expandMode, expandedThreads]
  );

  // Get thread by ID
  const getThreadById = useCallback(
    (threadId: string): EmailThread | undefined => {
      return threads.find((t) => t.id === threadId);
    },
    [threads]
  );

  return {
    // State
    threads: filteredThreads,
    allThreads: threads,
    preferences,
    filter,
    selectedThreadId,
    expandedThreads,
    loading,

    // Computed
    navigation: getNavigation(),
    stats: getStats(),

    // Actions
    selectThread,
    toggleThreadExpansion,
    expandThread,
    collapseThread,
    goToNextThread,
    goToPreviousThread,
    markThreadAsRead,
    markThreadAsUnread,
    archiveThread,
    deleteThread,
    starThread,
    unstarThread,
    executeThreadAction,
    updatePreferences,
    updateFilter,
    clearFilter,

    // Helpers
    isThreadExpanded,
    getThreadById
  };
};
