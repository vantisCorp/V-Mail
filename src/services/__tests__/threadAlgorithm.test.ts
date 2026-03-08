/**
 * Thread Algorithm Service Tests
 */

import { ThreadAlgorithm } from '../threadAlgorithm';
import { Email, EmailThread } from '../../types/emailThreading';

describe('ThreadAlgorithm', () => {
  const createEmail = (overrides: Partial<Email> = {}): Email => ({
    id: `email-${Math.random()}`,
    messageId: `msg-${Math.random()}`,
    subject: 'Test Subject',
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    body: 'Test body',
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    folderId: 'inbox',
    ...overrides,
  });

  describe('buildThreadTree', () => {
    it('should build a simple thread tree', () => {
      const rootEmail = createEmail({
        id: '1',
        messageId: 'root',
      });

      const replyEmail = createEmail({
        id: '2',
        messageId: 'reply',
        inReplyTo: 'root',
      });

      const tree = ThreadAlgorithm.buildThreadTree([rootEmail, replyEmail]);

      expect(tree).toHaveLength(1);
      expect(tree[0].messageId).toBe('root');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].messageId).toBe('reply');
    });

    it('should build a tree with multiple levels', () => {
      const rootEmail = createEmail({
        id: '1',
        messageId: 'root',
      });

      const reply1 = createEmail({
        id: '2',
        messageId: 'reply1',
        inReplyTo: 'root',
      });

      const reply2 = createEmail({
        id: '3',
        messageId: 'reply2',
        inReplyTo: 'reply1',
      });

      const tree = ThreadAlgorithm.buildThreadTree([rootEmail, reply1, reply2]);

      expect(tree).toHaveLength(1);
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });

    it('should handle multiple root emails', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
      });

      const tree = ThreadAlgorithm.buildThreadTree([email1, email2]);

      expect(tree).toHaveLength(2);
    });

    it('should use references to build tree', () => {
      const rootEmail = createEmail({
        id: '1',
        messageId: 'root',
      });

      const replyEmail = createEmail({
        id: '2',
        messageId: 'reply',
        references: ['root'],
      });

      const tree = ThreadAlgorithm.buildThreadTree([rootEmail, replyEmail]);

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
    });
  });

  describe('groupEmailsIntoThreads', () => {
    it('should group emails into threads', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
        subject: 'Test Subject',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        subject: 'Re: Test Subject',
        inReplyTo: 'msg1',
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      expect(threads).toHaveLength(1);
      expect(threads[0].messageCount).toBe(2);
    });

    it('should create separate threads for different subjects', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
        subject: 'Subject 1',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        subject: 'Subject 2',
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      expect(threads).toHaveLength(2);
    });

    it('should handle Re: prefixes in subjects', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
        subject: 'Test Subject',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        subject: 'Re: Test Subject',
        inReplyTo: 'msg1',
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      expect(threads).toHaveLength(1);
      expect(threads[0].subject).toBe('test subject');
    });

    it('should calculate thread metadata', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
        from: 'user1@example.com',
        isRead: true, // First email is read
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        from: 'user2@example.com',
        inReplyTo: 'msg1',
        isRead: false, // Second email is unread
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      // 3 participants: user1@example.com, user2@example.com, recipient@example.com (from 'to' field)
      expect(threads[0].participantCount).toBe(3);
      expect(threads[0].participantEmails).toContain('user1@example.com');
      expect(threads[0].participantEmails).toContain('user2@example.com');
      expect(threads[0].participantEmails).toContain('recipient@example.com');
      expect(threads[0].unreadCount).toBe(1); // Only email2 is unread
    });

    it('should mark root emails correctly', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        inReplyTo: 'msg1',
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      expect(threads[0].messages[0].isRoot).toBe(true);
      expect(threads[0].messages[1].isRoot).toBe(false);
    });

    it('should detect replies', () => {
      const email1 = createEmail({
        id: '1',
        messageId: 'msg1',
      });

      const email2 = createEmail({
        id: '2',
        messageId: 'msg2',
        inReplyTo: 'msg1',
      });

      const threads = ThreadAlgorithm.groupEmailsIntoThreads([email1, email2]);

      expect(threads[0].messages[0].hasReplies).toBe(true);
      expect(threads[0].messages[1].hasReplies).toBe(false);
    });
  });

  describe('sortThreads', () => {
    it('should sort threads by newest', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
      };

      const sorted = ThreadAlgorithm.sortThreads([thread1, thread2], 'newest');

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should sort threads by oldest', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
      };

      const sorted = ThreadAlgorithm.sortThreads([thread1, thread2], 'oldest');

      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });
  });

  describe('mergeThreads', () => {
    it('should merge two threads', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [createEmail({ id: '1', messageId: 'msg1' })],
        rootMessageId: 'msg1',
        participantEmails: ['user1@example.com'],
        participantCount: 1,
        messageCount: 1,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [createEmail({ id: '2', messageId: 'msg2' })],
        rootMessageId: 'msg2',
        participantEmails: ['user2@example.com'],
        participantCount: 1,
        messageCount: 1,
        unreadCount: 1,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
      };

      const merged = ThreadAlgorithm.mergeThreads(thread1, thread2);

      expect(merged.messageCount).toBe(2);
      expect(merged.unreadCount).toBe(1);
      expect(merged.participantCount).toBe(2);
      expect(merged.participantEmails).toContain('user1@example.com');
      expect(merged.participantEmails).toContain('user2@example.com');
    });
  });

  describe('splitThread', () => {
    it('should split a thread into two parts', () => {
      const thread: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [
          createEmail({ id: '1', messageId: 'msg1' }),
          createEmail({ id: '2', messageId: 'msg2' }),
          createEmail({ id: '3', messageId: 'msg3' }),
        ],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 3,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date('2024-01-03'),
        createdAt: new Date('2024-01-01'),
      };

      const [part1, part2] = ThreadAlgorithm.splitThread(thread, 1);

      expect(part1.messageCount).toBe(1);
      expect(part2.messageCount).toBe(2);
      expect(part1.id).toContain('part1');
      expect(part2.id).toContain('part2');
    });
  });

  describe('filterThreads', () => {
    it('should filter threads by folder', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        folderId: 'inbox',
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        folderId: 'archive',
      };

      const filtered = ThreadAlgorithm.filterThreads([thread1, thread2], { folderId: 'inbox' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].folderId).toBe('inbox');
    });

    it('should filter threads by unread status', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 1,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const filtered = ThreadAlgorithm.filterThreads([thread1, thread2], { unreadOnly: true });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].unreadCount).toBe(1);
    });

    it('should filter threads by participant', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: ['user1@example.com'],
        participantCount: 1,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: ['user2@example.com'],
        participantCount: 1,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const filtered = ThreadAlgorithm.filterThreads([thread1, thread2], { participant: 'user1@example.com' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].participantEmails).toContain('user1@example.com');
    });

    it('should filter threads by subject', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Important Thread',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Regular Thread',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 0,
        unreadCount: 0,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const filtered = ThreadAlgorithm.filterThreads([thread1, thread2], { subjectContains: 'important' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].subject.toLowerCase()).toContain('important');
    });
  });

  describe('getThreadStats', () => {
    it('should calculate thread statistics', () => {
      const thread1: EmailThread = {
        id: '1',
        subject: 'Thread 1',
        messages: [],
        rootMessageId: 'msg1',
        participantEmails: [],
        participantCount: 0,
        messageCount: 5,
        unreadCount: 2,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const thread2: EmailThread = {
        id: '2',
        subject: 'Thread 2',
        messages: [],
        rootMessageId: 'msg2',
        participantEmails: [],
        participantCount: 0,
        messageCount: 3,
        unreadCount: 1,
        isExpanded: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      };

      const stats = ThreadAlgorithm.getThreadStats([thread1, thread2]);

      expect(stats.totalThreads).toBe(2);
      expect(stats.totalMessages).toBe(8);
      expect(stats.unreadThreads).toBe(2);
      expect(stats.unreadMessages).toBe(3);
      expect(stats.averageMessagesPerThread).toBe(4);
    });
  });
});