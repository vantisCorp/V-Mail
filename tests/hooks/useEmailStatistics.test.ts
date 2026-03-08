import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailStatistics } from '../../src/hooks/useEmailStatistics';
import type { Email } from '../../src/types';

// Mock the useNotifications hook
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

const createMockEmail = (id: string, overrides: Partial<Email> = {}): Email => ({
  id,
  subject: `Subject ${id}`,
  from: `sender${id}@example.com`,
  to: `recipient${id}@example.com`,
  body: `Body content for email ${id}`,
  date: new Date(),
  read: false,
  starred: false,
  encrypted: false,
  hasAttachments: false,
  folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' },
  ...overrides
});

describe('useEmailStatistics', () => {
  const mockEmails: Email[] = [
    createMockEmail('email-1', {
      read: true,
      starred: true,
      hasAttachments: true,
      encrypted: true,
      folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' }
    }),
    createMockEmail('email-2', {
      read: false,
      starred: false,
      hasAttachments: false,
      encrypted: false,
      folder: { id: 'inbox', name: 'Inbox', count: 0, icon: '📥' }
    }),
    createMockEmail('email-3', {
      read: true,
      starred: false,
      hasAttachments: true,
      encrypted: true,
      folder: { id: 'sent', name: 'Sent', count: 0, icon: '📤' }
    }),
    createMockEmail('email-4', {
      read: false,
      starred: true,
      hasAttachments: false,
      encrypted: false,
      folder: { id: 'drafts', name: 'Drafts', count: 0, icon: '📝' }
    }),
    createMockEmail('email-5', {
      read: true,
      starred: false,
      hasAttachments: true,
      encrypted: true,
      folder: { id: 'trash', name: 'Trash', count: 0, icon: '🗑️' }
    })
  ];

  it('should initialize with correct email stats', () => {
    const { result } = renderHook(() => useEmailStatistics(mockEmails));

    expect(result.current.statistics.email.total).toBe(5);
    expect(result.current.statistics.email.read).toBe(3);
    expect(result.current.statistics.email.unread).toBe(2);
    expect(result.current.statistics.email.starred).toBe(2);
    expect(result.current.statistics.email.withAttachments).toBe(3);
    expect(result.current.statistics.email.encrypted).toBe(3);
  });

  it('should calculate folder stats correctly', () => {
    const { result } = renderHook(() => useEmailStatistics(mockEmails));

    const folderStats = result.current.statistics.folders;
    expect(folderStats.length).toBe(4); // inbox, sent, drafts, trash

    const inboxStats = folderStats.find(f => f.folderId === 'inbox');
    expect(inboxStats?.count).toBe(2);
    expect(inboxStats?.unreadCount).toBe(1);
  });

  it('should calculate time stats correctly', () => {
    const now = new Date();
    // Create dates that are definitely in this week
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    const todayEmails: Email[] = [
      createMockEmail('today-1', { date: today }),
      createMockEmail('today-2', { date: today }),
      createMockEmail('yesterday-1', { date: yesterday })
    ];

    const { result } = renderHook(() => useEmailStatistics(todayEmails));

    expect(result.current.statistics.time.today).toBe(2);
    // Note: thisWeek depends on what day of the week it is
    // If today is Sunday, yesterday is in the previous week
    // So we check that thisWeek is at least 2 (the today emails)
    expect(result.current.statistics.time.thisWeek).toBeGreaterThanOrEqual(2);
  });

  it('should calculate top senders correctly', () => {
    const emails = [
      createMockEmail('1', { from: 'alice@example.com' }),
      createMockEmail('2', { from: 'alice@example.com' }),
      createMockEmail('3', { from: 'alice@example.com' }),
      createMockEmail('4', { from: 'bob@example.com' }),
      createMockEmail('5', { from: 'bob@example.com' }),
      createMockEmail('6', { from: 'charlie@example.com' })
    ];

    const { result } = renderHook(() => useEmailStatistics(emails));

    expect(result.current.statistics.topSenders.length).toBeLessThanOrEqual(10);
    expect(result.current.statistics.topSenders[0].email).toBe('alice@example.com');
    expect(result.current.statistics.topSenders[0].count).toBe(3);
    expect(result.current.statistics.topSenders[1].email).toBe('bob@example.com');
    expect(result.current.statistics.topSenders[1].count).toBe(2);
  });

  it('should calculate top recipients correctly', () => {
    const emails = [
      createMockEmail('1', { to: 'team1@example.com' }),
      createMockEmail('2', { to: 'team1@example.com' }),
      createMockEmail('3', { to: 'team2@example.com' })
    ];

    const { result } = renderHook(() => useEmailStatistics(emails));

    expect(result.current.statistics.topRecipients.length).toBeLessThanOrEqual(10);
    expect(result.current.statistics.topRecipients[0].email).toBe('team1@example.com');
    expect(result.current.statistics.topRecipients[0].count).toBe(2);
  });

  it('should calculate attachment stats correctly', () => {
    const emailsWithAttachments: Email[] = [
      createMockEmail('1', {
        hasAttachments: true,
        attachments: [
          { id: 'a1', name: 'doc.pdf', size: 1000, type: 'application/pdf', url: 'http://example.com/doc.pdf', uploadedAt: new Date() },
          { id: 'a2', name: 'image.png', size: 2000, type: 'image/png', url: 'http://example.com/image.png', uploadedAt: new Date() }
        ]
      }),
      createMockEmail('2', {
        hasAttachments: true,
        attachments: [
          { id: 'a3', name: 'doc.pdf', size: 500, type: 'application/pdf', url: 'http://example.com/doc.pdf', uploadedAt: new Date() }
        ]
      })
    ];

    const { result } = renderHook(() => useEmailStatistics(emailsWithAttachments));

    expect(result.current.statistics.attachments.count).toBe(3);
    expect(result.current.statistics.attachments.totalSize).toBe(3500);
    expect(result.current.statistics.attachments.byType['pdf']).toBe(2);
    expect(result.current.statistics.attachments.byType['png']).toBe(1);
  });

  it('should calculate activity stats correctly', () => {
    const { result } = renderHook(() => useEmailStatistics(mockEmails));

    expect(result.current.statistics.activity.emailsReceived).toBe(2); // inbox
    expect(result.current.statistics.activity.emailsSent).toBe(1); // sent
    expect(result.current.statistics.activity.emailsDeleted).toBe(1); // trash
    expect(typeof result.current.statistics.activity.averageDailyEmails).toBe('number');
    expect(typeof result.current.statistics.activity.mostActiveDay).toBe('string');
    expect(typeof result.current.statistics.activity.mostActiveHour).toBe('number');
  });

  it('should handle empty email list', () => {
    const { result } = renderHook(() => useEmailStatistics([]));

    expect(result.current.statistics.email.total).toBe(0);
    expect(result.current.statistics.email.read).toBe(0);
    expect(result.current.statistics.email.unread).toBe(0);
    expect(result.current.statistics.folders.length).toBe(0);
    expect(result.current.statistics.topSenders.length).toBe(0);
  });

  it('should update stats when time range changes', () => {
    const { result } = renderHook(() => useEmailStatistics(mockEmails));

    const initialTotal = result.current.statistics.email.total;

    // Set time range to exclude all emails
    act(() => {
      result.current.setTimeRange({
        start: new Date('2000-01-01'),
        end: new Date('2000-01-02')
      });
    });

    expect(result.current.statistics.email.total).toBe(0);

    // Reset time range
    act(() => {
      result.current.setTimeRange({
        start: new Date(0),
        end: new Date()
      });
    });

    expect(result.current.statistics.email.total).toBe(initialTotal);
  });

  it('should refresh stats when refreshStats is called', () => {
    const { result } = renderHook(() => useEmailStatistics(mockEmails));

    const initialStats = result.current.statistics;

    act(() => {
      result.current.refreshStats();
    });

    // Stats should be recalculated (though values should be the same)
    expect(result.current.statistics.email.total).toBe(initialStats.email.total);
  });

  it('should limit top senders to 10', () => {
    const manySenders = Array.from({ length: 15 }, (_, i) =>
      createMockEmail(`email-${i}`, { from: `sender${i}@example.com` })
    );

    const { result } = renderHook(() => useEmailStatistics(manySenders));

    expect(result.current.statistics.topSenders.length).toBeLessThanOrEqual(10);
  });

  it('should limit top recipients to 10', () => {
    const manyRecipients = Array.from({ length: 15 }, (_, i) =>
      createMockEmail(`email-${i}`, { to: `recipient${i}@example.com` })
    );

    const { result } = renderHook(() => useEmailStatistics(manyRecipients));

    expect(result.current.statistics.topRecipients.length).toBeLessThanOrEqual(10);
  });

  it('should calculate phantom and self-destruct stats', () => {
    const emails = [
      createMockEmail('1', { phantomAlias: 'phantom@example.com' }),
      createMockEmail('2', { phantomAlias: 'another@example.com' }),
      createMockEmail('3', { selfDestruct: new Date(Date.now() + 10000) })
    ];

    const { result } = renderHook(() => useEmailStatistics(emails));

    expect(result.current.statistics.email.phantom).toBe(2);
    expect(result.current.statistics.email.selfDestruct).toBe(1);
  });

  it('should handle emails with same sender', () => {
    const emails = [
      createMockEmail('1', { from: 'same@example.com' }),
      createMockEmail('2', { from: 'same@example.com' }),
      createMockEmail('3', { from: 'same@example.com' })
    ];

    const { result } = renderHook(() => useEmailStatistics(emails));

    expect(result.current.statistics.topSenders.length).toBe(1);
    expect(result.current.statistics.topSenders[0].count).toBe(3);
  });
});
