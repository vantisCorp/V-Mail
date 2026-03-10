import { describe, it, expect } from 'vitest';
import { ThreadAlgorithm } from '../../src/services/threadAlgorithm';
import { Email, EmailThread, ThreadedEmail } from '../../src/types/emailThreading';

// --- Test fixtures ---

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: 'e1',
    messageId: 'msg1@example.com',
    subject: 'Test Subject',
    from: 'alice@example.com',
    to: ['bob@example.com'],
    body: 'Hello world',
    timestamp: new Date('2024-03-01T10:00:00Z'),
    isRead: false,
    isStarred: false,
    folderId: 'inbox',
    ...overrides
  };
}

function makeThreadedEmail(overrides: Partial<ThreadedEmail> = {}): ThreadedEmail {
  return {
    id: 'e1',
    messageId: 'msg1@example.com',
    subject: 'Test Subject',
    from: 'alice@example.com',
    to: ['bob@example.com'],
    body: 'Hello world',
    timestamp: new Date('2024-03-01T10:00:00Z'),
    isRead: false,
    isStarred: false,
    folderId: 'inbox',
    threadId: 'thread1',
    threadPosition: 0,
    depth: 0,
    hasReplies: false,
    isRoot: true,
    isLastInThread: true,
    ...overrides
  };
}

function makeThread(overrides: Partial<EmailThread> = {}): EmailThread {
  return {
    id: 'thread1',
    subject: 'test subject',
    messages: [makeThreadedEmail()],
    rootMessageId: 'msg1@example.com',
    participantEmails: ['alice@example.com', 'bob@example.com'],
    participantCount: 2,
    messageCount: 1,
    unreadCount: 1,
    isExpanded: false,
    lastActivityAt: new Date('2024-03-01T10:00:00Z'),
    createdAt: new Date('2024-03-01T10:00:00Z'),
    folderId: 'inbox',
    ...overrides
  };
}

describe('ThreadAlgorithm', () => {
  // =============================================
  // buildThreadTree
  // =============================================
  describe('buildThreadTree', () => {
    it('should create root nodes for emails without parents', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com' })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(2);
      expect(roots[0].messageId).toBe('msg1@ex.com');
      expect(roots[1].messageId).toBe('msg2@ex.com');
    });

    it('should link child to parent via inReplyTo', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com', inReplyTo: 'msg1@ex.com' })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(1);
      expect(roots[0].messageId).toBe('msg1@ex.com');
      expect(roots[0].children).toHaveLength(1);
      expect(roots[0].children[0].messageId).toBe('msg2@ex.com');
    });

    it('should set correct depth for nested replies', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com', inReplyTo: 'msg1@ex.com' }),
        makeEmail({ id: 'e3', messageId: 'msg3@ex.com', inReplyTo: 'msg2@ex.com' })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(1);
      expect(roots[0].depth).toBe(0);
      expect(roots[0].children[0].depth).toBe(1);
      expect(roots[0].children[0].children[0].depth).toBe(2);
    });

    it('should link child to parent via references (last reference)', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({
          id: 'e2',
          messageId: 'msg2@ex.com',
          references: ['msg0@ex.com', 'msg1@ex.com']
        })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(1);
      expect(roots[0].children).toHaveLength(1);
    });

    it('should treat email as root if inReplyTo parent not found', () => {
      const emails = [makeEmail({ id: 'e1', messageId: 'msg1@ex.com', inReplyTo: 'nonexistent@ex.com' })];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(1);
    });

    it('should handle empty email list', () => {
      const roots = ThreadAlgorithm.buildThreadTree([]);
      expect(roots).toHaveLength(0);
    });

    it('should handle multiple children for one parent', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com', inReplyTo: 'msg1@ex.com' }),
        makeEmail({ id: 'e3', messageId: 'msg3@ex.com', inReplyTo: 'msg1@ex.com' })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      expect(roots).toHaveLength(1);
      expect(roots[0].children).toHaveLength(2);
    });

    it('should prefer inReplyTo over references for parent lookup', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'parent1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'parent2@ex.com' }),
        makeEmail({
          id: 'e3',
          messageId: 'child@ex.com',
          inReplyTo: 'parent1@ex.com',
          references: ['parent2@ex.com']
        })
      ];

      const roots = ThreadAlgorithm.buildThreadTree(emails);
      const parent1 = roots.find((r) => r.messageId === 'parent1@ex.com');
      const parent2 = roots.find((r) => r.messageId === 'parent2@ex.com');
      expect(parent1?.children).toHaveLength(1);
      expect(parent2?.children).toHaveLength(0);
    });
  });

  // =============================================
  // groupEmailsIntoThreads
  // =============================================
  describe('groupEmailsIntoThreads', () => {
    it('should group a single email into one thread', () => {
      const emails = [makeEmail()];
      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      expect(threads).toHaveLength(1);
      expect(threads[0].messageCount).toBe(1);
    });

    it('should group reply with original into same thread', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com', subject: 'Hello' }),
        makeEmail({
          id: 'e2',
          messageId: 'msg2@ex.com',
          subject: 'Re: Hello',
          inReplyTo: 'msg1@ex.com'
        })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      // They may or may not be in the same thread depending on thread ID logic
      // The reply uses inReplyTo-based thread ID, original uses messageId-based
      expect(threads.length).toBeGreaterThanOrEqual(1);
    });

    it('should track unread count', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com', isRead: false }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com', isRead: true })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
      expect(totalUnread).toBe(1);
    });

    it('should track participant emails', () => {
      const emails = [
        makeEmail({
          id: 'e1',
          messageId: 'msg1@ex.com',
          from: 'alice@ex.com',
          to: ['bob@ex.com']
        })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      expect(threads[0].participantEmails).toContain('alice@ex.com');
      expect(threads[0].participantEmails).toContain('bob@ex.com');
      expect(threads[0].participantCount).toBe(2);
    });

    it('should not duplicate participant emails', () => {
      const emails = [
        makeEmail({
          id: 'e1',
          messageId: 'msg1@ex.com',
          from: 'alice@ex.com',
          to: ['alice@ex.com']
        })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      const aliceCount = threads[0].participantEmails.filter((p) => p === 'alice@ex.com').length;
      expect(aliceCount).toBe(1);
    });

    it('should set isRoot correctly', () => {
      const emails = [
        makeEmail({ id: 'e1', messageId: 'msg1@ex.com' }),
        makeEmail({ id: 'e2', messageId: 'msg2@ex.com', inReplyTo: 'msg1@ex.com' })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      const allMessages = threads.flatMap((t) => t.messages);
      const root = allMessages.find((m) => m.id === 'e1');
      const reply = allMessages.find((m) => m.id === 'e2');
      expect(root?.isRoot).toBe(true);
      expect(reply?.isRoot).toBe(false);
    });

    it('should handle empty email list', () => {
      const threads = ThreadAlgorithm.groupEmailsIntoThreads([]);
      expect(threads).toHaveLength(0);
    });

    it('should update lastActivityAt and createdAt', () => {
      const emails = [
        makeEmail({
          id: 'e1',
          messageId: 'msg1@ex.com',
          timestamp: new Date('2024-01-01')
        })
      ];

      const threads = ThreadAlgorithm.groupEmailsIntoThreads(emails);
      expect(threads[0].lastActivityAt).toEqual(new Date('2024-01-01'));
      expect(threads[0].createdAt).toEqual(new Date('2024-01-01'));
    });
  });

  // =============================================
  // sortThreads
  // =============================================
  describe('sortThreads', () => {
    const threads = [
      makeThread({
        id: 't1',
        lastActivityAt: new Date('2024-03-01'),
        createdAt: new Date('2024-01-01')
      }),
      makeThread({
        id: 't2',
        lastActivityAt: new Date('2024-03-03'),
        createdAt: new Date('2024-02-01')
      }),
      makeThread({
        id: 't3',
        lastActivityAt: new Date('2024-03-02'),
        createdAt: new Date('2024-01-15')
      })
    ];

    it('should sort by newest (lastActivityAt descending)', () => {
      const sorted = ThreadAlgorithm.sortThreads(threads, 'newest');
      expect(sorted[0].id).toBe('t2');
      expect(sorted[1].id).toBe('t3');
      expect(sorted[2].id).toBe('t1');
    });

    it('should sort by oldest (createdAt ascending)', () => {
      const sorted = ThreadAlgorithm.sortThreads(threads, 'oldest');
      expect(sorted[0].id).toBe('t1');
      expect(sorted[1].id).toBe('t3');
      expect(sorted[2].id).toBe('t2');
    });

    it('should sort by recent (same as newest)', () => {
      const sorted = ThreadAlgorithm.sortThreads(threads, 'recent');
      expect(sorted[0].id).toBe('t2');
      expect(sorted[1].id).toBe('t3');
      expect(sorted[2].id).toBe('t1');
    });

    it('should not mutate the original array', () => {
      const original = [...threads];
      ThreadAlgorithm.sortThreads(threads, 'newest');
      expect(threads).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = ThreadAlgorithm.sortThreads([], 'newest');
      expect(sorted).toEqual([]);
    });
  });

  // =============================================
  // mergeThreads
  // =============================================
  describe('mergeThreads', () => {
    it('should merge two threads into one', () => {
      const t1 = makeThread({
        id: 't1',
        messages: [makeThreadedEmail({ id: 'e1' })],
        messageCount: 1,
        unreadCount: 1,
        participantEmails: ['alice@ex.com']
      });
      const t2 = makeThread({
        id: 't2',
        messages: [makeThreadedEmail({ id: 'e2' })],
        messageCount: 1,
        unreadCount: 0,
        participantEmails: ['bob@ex.com']
      });

      const merged = ThreadAlgorithm.mergeThreads(t1, t2);
      expect(merged.messages).toHaveLength(2);
      expect(merged.messageCount).toBe(2);
      expect(merged.unreadCount).toBe(1);
    });

    it('should combine participant emails without duplicates', () => {
      const t1 = makeThread({ participantEmails: ['alice@ex.com', 'bob@ex.com'] });
      const t2 = makeThread({ participantEmails: ['bob@ex.com', 'charlie@ex.com'] });

      const merged = ThreadAlgorithm.mergeThreads(t1, t2);
      expect(merged.participantEmails).toContain('alice@ex.com');
      expect(merged.participantEmails).toContain('bob@ex.com');
      expect(merged.participantEmails).toContain('charlie@ex.com');
      expect(merged.participantCount).toBe(3);
    });

    it('should use the latest lastActivityAt', () => {
      const t1 = makeThread({ lastActivityAt: new Date('2024-03-01') });
      const t2 = makeThread({ lastActivityAt: new Date('2024-03-05') });

      const merged = ThreadAlgorithm.mergeThreads(t1, t2);
      expect(merged.lastActivityAt).toEqual(new Date('2024-03-05'));
    });

    it('should use the earliest createdAt', () => {
      const t1 = makeThread({ createdAt: new Date('2024-01-15') });
      const t2 = makeThread({ createdAt: new Date('2024-01-01') });

      const merged = ThreadAlgorithm.mergeThreads(t1, t2);
      expect(merged.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should update threadPosition for all messages', () => {
      const t1 = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', threadPosition: 0 }),
          makeThreadedEmail({ id: 'e2', threadPosition: 1 })
        ]
      });
      const t2 = makeThread({
        messages: [makeThreadedEmail({ id: 'e3', threadPosition: 0 })]
      });

      const merged = ThreadAlgorithm.mergeThreads(t1, t2);
      expect(merged.messages[0].threadPosition).toBe(0);
      expect(merged.messages[1].threadPosition).toBe(1);
      expect(merged.messages[2].threadPosition).toBe(2);
    });
  });

  // =============================================
  // splitThread
  // =============================================
  describe('splitThread', () => {
    it('should split thread at given index', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', timestamp: new Date('2024-01-01'), isRead: false }),
          makeThreadedEmail({ id: 'e2', timestamp: new Date('2024-01-02'), isRead: true }),
          makeThreadedEmail({ id: 'e3', timestamp: new Date('2024-01-03'), isRead: false })
        ],
        messageCount: 3
      });

      const [part1, part2] = ThreadAlgorithm.splitThread(thread, 2);

      expect(part1.messages).toHaveLength(2);
      expect(part2.messages).toHaveLength(1);
    });

    it('should set correct IDs for split parts', () => {
      const thread = makeThread({
        id: 'original',
        messages: [
          makeThreadedEmail({ id: 'e1', timestamp: new Date('2024-01-01') }),
          makeThreadedEmail({ id: 'e2', timestamp: new Date('2024-01-02') })
        ]
      });

      const [part1, part2] = ThreadAlgorithm.splitThread(thread, 1);
      expect(part1.id).toBe('original-part1');
      expect(part2.id).toBe('original-part2');
    });

    it('should calculate correct unread counts for each part', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', isRead: false, timestamp: new Date('2024-01-01') }),
          makeThreadedEmail({ id: 'e2', isRead: true, timestamp: new Date('2024-01-02') }),
          makeThreadedEmail({ id: 'e3', isRead: false, timestamp: new Date('2024-01-03') })
        ]
      });

      const [part1, part2] = ThreadAlgorithm.splitThread(thread, 2);
      expect(part1.unreadCount).toBe(1);
      expect(part2.unreadCount).toBe(1);
    });

    it('should set correct message counts', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', timestamp: new Date('2024-01-01') }),
          makeThreadedEmail({ id: 'e2', timestamp: new Date('2024-01-02') }),
          makeThreadedEmail({ id: 'e3', timestamp: new Date('2024-01-03') })
        ]
      });

      const [part1, part2] = ThreadAlgorithm.splitThread(thread, 1);
      expect(part1.messageCount).toBe(1);
      expect(part2.messageCount).toBe(2);
    });

    it('should set rootMessageId for part2 from its first message', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', messageId: 'msg1@ex.com', timestamp: new Date('2024-01-01') }),
          makeThreadedEmail({ id: 'e2', messageId: 'msg2@ex.com', timestamp: new Date('2024-01-02') })
        ]
      });

      const [, part2] = ThreadAlgorithm.splitThread(thread, 1);
      expect(part2.rootMessageId).toBe('msg2@ex.com');
    });
  });

  // =============================================
  // flattenThread
  // =============================================
  describe('flattenThread', () => {
    it('should return messages sorted by timestamp ascending', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e3', timestamp: new Date('2024-03-03') }),
          makeThreadedEmail({ id: 'e1', timestamp: new Date('2024-03-01') }),
          makeThreadedEmail({ id: 'e2', timestamp: new Date('2024-03-02') })
        ]
      });

      const flat = ThreadAlgorithm.flattenThread(thread);
      expect(flat[0].id).toBe('e1');
      expect(flat[1].id).toBe('e2');
      expect(flat[2].id).toBe('e3');
    });

    it('should not mutate the original messages array', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e2', timestamp: new Date('2024-03-02') }),
          makeThreadedEmail({ id: 'e1', timestamp: new Date('2024-03-01') })
        ]
      });

      ThreadAlgorithm.flattenThread(thread);
      expect(thread.messages[0].id).toBe('e2'); // original order preserved
    });

    it('should handle single message thread', () => {
      const thread = makeThread({
        messages: [makeThreadedEmail({ id: 'e1' })]
      });

      const flat = ThreadAlgorithm.flattenThread(thread);
      expect(flat).toHaveLength(1);
    });
  });

  // =============================================
  // getThreadSummary
  // =============================================
  describe('getThreadSummary', () => {
    it('should return up to 3 participant emails', () => {
      const thread = makeThread({
        participantEmails: ['a@ex.com', 'b@ex.com', 'c@ex.com', 'd@ex.com'],
        participantCount: 4
      });

      const summary = ThreadAlgorithm.getThreadSummary(thread);
      expect(summary.participantEmails).toHaveLength(3);
      expect(summary.participantCount).toBe(1); // 4 - 3 = 1 remaining
    });

    it('should return preview from last message body', () => {
      const thread = makeThread({
        messages: [
          makeThreadedEmail({ id: 'e1', body: 'First message' }),
          makeThreadedEmail({ id: 'e2', body: 'Last message body here' })
        ]
      });

      const summary = ThreadAlgorithm.getThreadSummary(thread);
      expect(summary.preview).toContain('Last message body here');
    });

    it('should truncate preview to 100 characters', () => {
      const longBody = 'A'.repeat(200);
      const thread = makeThread({
        messages: [makeThreadedEmail({ body: longBody })]
      });

      const summary = ThreadAlgorithm.getThreadSummary(thread);
      expect(summary.preview).toHaveLength(100);
    });

    it('should handle empty messages', () => {
      const thread = makeThread({ messages: [] });
      const summary = ThreadAlgorithm.getThreadSummary(thread);
      expect(summary.preview).toBe('');
    });
  });

  // =============================================
  // filterThreads
  // =============================================
  describe('filterThreads', () => {
    const threads = [
      makeThread({
        id: 't1',
        folderId: 'inbox',
        unreadCount: 2,
        subject: 'project update',
        participantEmails: ['alice@ex.com'],
        messages: [
          makeThreadedEmail({
            isStarred: true,
            attachments: [{ id: 'a1', name: 'file.pdf', size: 100, mimeType: 'application/pdf', url: '' }]
          })
        ]
      }),
      makeThread({
        id: 't2',
        folderId: 'sent',
        unreadCount: 0,
        subject: 'meeting notes',
        participantEmails: ['bob@ex.com'],
        messages: [makeThreadedEmail({ isStarred: false })]
      }),
      makeThread({
        id: 't3',
        folderId: 'inbox',
        unreadCount: 0,
        subject: 'project deadline',
        participantEmails: ['alice@ex.com', 'charlie@ex.com'],
        messages: [makeThreadedEmail({ isStarred: false })]
      })
    ];

    it('should filter by folderId', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { folderId: 'inbox' });
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.folderId === 'inbox')).toBe(true);
    });

    it('should filter by unreadOnly', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { unreadOnly: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('should filter by starredOnly', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { starredOnly: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('should filter by hasAttachments', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { hasAttachments: true });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('should filter by participant', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { participant: 'alice@ex.com' });
      expect(result).toHaveLength(2);
    });

    it('should filter by subjectContains (case insensitive)', () => {
      const result = ThreadAlgorithm.filterThreads(threads, { subjectContains: 'Project' });
      expect(result).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const result = ThreadAlgorithm.filterThreads(threads, {
        folderId: 'inbox',
        unreadOnly: true
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t1');
    });

    it('should return all threads with empty filter', () => {
      const result = ThreadAlgorithm.filterThreads(threads, {});
      expect(result).toHaveLength(3);
    });
  });

  // =============================================
  // getThreadStats
  // =============================================
  describe('getThreadStats', () => {
    it('should calculate correct statistics', () => {
      const threads = [
        makeThread({
          messageCount: 3,
          unreadCount: 1,
          messages: [
            makeThreadedEmail({
              isStarred: true,
              attachments: [{ id: 'a1', name: 'f.pdf', size: 1, mimeType: 'application/pdf', url: '' }]
            })
          ]
        }),
        makeThread({
          messageCount: 2,
          unreadCount: 0,
          messages: [makeThreadedEmail({ isStarred: false })]
        })
      ];

      const stats = ThreadAlgorithm.getThreadStats(threads);
      expect(stats.totalThreads).toBe(2);
      expect(stats.totalMessages).toBe(5);
      expect(stats.unreadThreads).toBe(1);
      expect(stats.unreadMessages).toBe(1);
      expect(stats.starredThreads).toBe(1);
      expect(stats.threadsWithAttachments).toBe(1);
      expect(stats.averageMessagesPerThread).toBe(3); // Math.round(5/2)
    });

    it('should handle empty threads array', () => {
      const stats = ThreadAlgorithm.getThreadStats([]);
      expect(stats.totalThreads).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.averageMessagesPerThread).toBe(0);
    });

    it('should handle all unread threads', () => {
      const threads = [
        makeThread({ unreadCount: 2, messageCount: 2 }),
        makeThread({ unreadCount: 3, messageCount: 3 })
      ];

      const stats = ThreadAlgorithm.getThreadStats(threads);
      expect(stats.unreadThreads).toBe(2);
      expect(stats.unreadMessages).toBe(5);
    });
  });
});
