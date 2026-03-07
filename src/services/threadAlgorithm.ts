/**
 * Thread Algorithm Service
 * Implements email threading algorithm based on email headers
 * Builds thread trees and manages relationships
 */

import {
  Email,
  EmailThread,
  ThreadNode,
  ThreadedEmail,
} from '../types/emailThreading';

export class ThreadAlgorithm {
  /**
   * Build thread tree from a list of emails
   */
  static buildThreadTree(emails: Email[]): ThreadNode[] {
    const messageMap = new Map<string, ThreadNode>();
    const rootNodes: ThreadNode[] = [];

    // Create nodes for all emails
    emails.forEach((email) => {
      const node: ThreadNode = {
        id: email.id,
        messageId: email.messageId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        children: [],
        depth: 0,
      };
      messageMap.set(email.messageId, node);
    });

    // Build tree structure
    emails.forEach((email) => {
      const node = messageMap.get(email.messageId);
      if (!node) return;

      // Try to find parent using inReplyTo
      if (email.inReplyTo) {
        const parentNode = messageMap.get(email.inReplyTo);
        if (parentNode) {
          parentNode.children.push(node);
          node.depth = parentNode.depth + 1;
          return;
        }
      }

      // Try to find parent using references (last reference is direct parent)
      if (email.references && email.references.length > 0) {
        const lastRef = email.references[email.references.length - 1];
        const parentNode = messageMap.get(lastRef);
        if (parentNode) {
          parentNode.children.push(node);
          node.depth = parentNode.depth + 1;
          return;
        }
      }

      // No parent found, it's a root node
      rootNodes.push(node);
    });

    return rootNodes;
  }

  /**
   * Group emails into threads based on subject similarity and references
   */
  static groupEmailsIntoThreads(emails: Email[]): EmailThread[] {
    const threads = new Map<string, EmailThread>();
    const emailToThreadMap = new Map<string, string>();

    emails.forEach((email) => {
      let threadId = this.getThreadId(email);

      // Check if we've already assigned this email to a thread
      if (emailToThreadMap.has(email.id)) {
        return;
      }

      // If thread doesn't exist, create it
      if (!threads.has(threadId)) {
        const newThread: EmailThread = {
          id: threadId,
          subject: this.cleanSubject(email.subject),
          messages: [],
          rootMessageId: email.messageId,
          participantEmails: [],
          participantCount: 0,
          messageCount: 0,
          unreadCount: 0,
          isExpanded: false,
          lastActivityAt: email.timestamp,
          createdAt: email.timestamp,
          folderId: email.folderId,
        };
        threads.set(threadId, newThread);
      }

      const thread = threads.get(threadId)!;

      // Create threaded email
      const threadedEmail: ThreadedEmail = {
        ...email,
        threadId,
        threadPosition: thread.messages.length,
        depth: this.calculateEmailDepth(email),
        hasReplies: false,
        isRoot: !email.inReplyTo,
        isLastInThread: false,
      };

      thread.messages.push(threadedEmail);
      emailToThreadMap.set(email.id, threadId);

      // Update thread metadata
      this.updateThreadMetadata(thread, email);
    });

    // Update hasReplies flag for all emails
    threads.forEach((thread) => {
      for (let i = 0; i < thread.messages.length; i++) {
        const currentEmail = thread.messages[i];
        const nextEmails = thread.messages.slice(i + 1);
        
        currentEmail.hasReplies = nextEmails.some(
          (next) => next.inReplyTo === currentEmail.messageId ||
                   (next.references && next.references.includes(currentEmail.messageId))
        );

        currentEmail.isLastInThread = !currentEmail.hasReplies;
      }
    });

    return Array.from(threads.values());
  }

  /**
   * Get thread ID for an email based on subject and references
   */
  private static getThreadId(email: Email): string {
    // If email is a reply, use the thread from the original message
    if (email.inReplyTo) {
      return `${email.inReplyTo}-${this.cleanSubject(email.subject)}`;
    }

    // Use references if available
    if (email.references && email.references.length > 0) {
      const rootRef = email.references[0];
      return `${rootRef}-${this.cleanSubject(email.subject)}`;
    }

    // Create thread ID from message ID and subject
    return `${email.messageId}-${this.cleanSubject(email.subject)}`;
  }

  /**
   * Clean subject for thread grouping
   * Removes Re:, Fwd:, etc. prefixes
   */
  private static cleanSubject(subject: string): string {
    return subject
      .replace(/^(Re|Fwd|Fw|RE|FW|FWD):\s*/gi, '')
      .replace(/\[.*?\]/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Calculate email depth in thread
   */
  private static calculateEmailDepth(email: Email): number {
    if (!email.inReplyTo && (!email.references || email.references.length === 0)) {
      return 0;
    }

    return (email.references?.length || 0);
  }

  /**
   * Update thread metadata with new email
   */
  private static updateThreadMetadata(thread: EmailThread, email: Email): void {
    thread.messageCount++;

    if (!email.isRead) {
      thread.unreadCount++;
    }

    // Update participant emails
    const participants = [email.from, ...email.to];
    participants.forEach((p) => {
      if (!thread.participantEmails.includes(p)) {
        thread.participantEmails.push(p);
      }
    });
    thread.participantCount = thread.participantEmails.length;

    // Update timestamps
    if (email.timestamp > thread.lastActivityAt) {
      thread.lastActivityAt = email.timestamp;
    }
    if (email.timestamp < thread.createdAt) {
      thread.createdAt = email.timestamp;
    }

    // Update root message ID if needed
    if (!email.inReplyTo && (!email.references || email.references.length === 0)) {
      thread.rootMessageId = email.messageId;
    }
  }

  /**
   * Sort threads based on specified order
   */
  static sortThreads(threads: EmailThread[], order: 'newest' | 'oldest' | 'recent'): EmailThread[] {
    const sorted = [...threads];

    switch (order) {
      case 'newest':
        return sorted.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
      
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      case 'recent':
        return sorted.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
      
      default:
        return sorted;
    }
  }

  /**
   * Merge threads manually (user action)
   */
  static mergeThreads(thread1: EmailThread, thread2: EmailThread): EmailThread {
    const merged: EmailThread = {
      ...thread1,
      messages: [...thread1.messages, ...thread2.messages],
      messageCount: thread1.messageCount + thread2.messageCount,
      unreadCount: thread1.unreadCount + thread2.unreadCount,
      participantEmails: [
        ...thread1.participantEmails,
        ...thread2.participantEmails.filter((p) => !thread1.participantEmails.includes(p)),
      ],
      participantCount: 0, // Will be calculated
      lastActivityAt: thread1.lastActivityAt > thread2.lastActivityAt ? thread1.lastActivityAt : thread2.lastActivityAt,
      createdAt: thread1.createdAt < thread2.createdAt ? thread1.createdAt : thread2.createdAt,
    };

    merged.participantCount = merged.participantEmails.length;

    // Update thread positions and depth
    merged.messages.forEach((email, index) => {
      email.threadPosition = index;
    });

    return merged;
  }

  /**
   * Split a thread into two parts
   */
  static splitThread(thread: EmailThread, splitAtIndex: number): [EmailThread, EmailThread] {
    const part1Messages = thread.messages.slice(0, splitAtIndex);
    const part2Messages = thread.messages.slice(splitAtIndex);

    const part1: EmailThread = {
      ...thread,
      id: `${thread.id}-part1`,
      messages: part1Messages,
      messageCount: part1Messages.length,
      unreadCount: part1Messages.filter((e) => !e.isRead).length,
      lastActivityAt: part1Messages[part1Messages.length - 1].timestamp,
    };

    const part2: EmailThread = {
      ...thread,
      id: `${thread.id}-part2`,
      messages: part2Messages,
      messageCount: part2Messages.length,
      unreadCount: part2Messages.filter((e) => !e.isRead).length,
      createdAt: part2Messages[0].timestamp,
      rootMessageId: part2Messages[0].messageId,
    };

    return [part1, part2];
  }

  /**
   * Flatten thread for flat view mode
   */
  static flattenThread(thread: EmailThread): ThreadedEmail[] {
    return [...thread.messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get thread summary
   */
  static getThreadSummary(thread: EmailThread) {
    const participants = thread.participantEmails.slice(0, 3);
    const preview = thread.messages[thread.messages.length - 1]?.body?.substring(0, 100) || '';

    return {
      participantEmails: participants,
      participantCount: thread.participantCount - 3,
      preview,
    };
  }

  /**
   * Find threads matching filter criteria
   */
  static filterThreads(
    threads: EmailThread[],
    filter: {
      folderId?: string;
      unreadOnly?: boolean;
      starredOnly?: boolean;
      hasAttachments?: boolean;
      participant?: string;
      subjectContains?: string;
    }
  ): EmailThread[] {
    return threads.filter((thread) => {
      if (filter.folderId && thread.folderId !== filter.folderId) return false;
      if (filter.unreadOnly && thread.unreadCount === 0) return false;
      if (filter.starredOnly && !thread.messages.some((e) => e.isStarred)) return false;
      if (filter.hasAttachments && !thread.messages.some((e) => e.attachments && e.attachments.length > 0)) return false;
      if (filter.participant && !thread.participantEmails.includes(filter.participant)) return false;
      if (filter.subjectContains && !thread.subject.toLowerCase().includes(filter.subjectContains.toLowerCase())) return false;

      return true;
    });
  }

  /**
   * Get thread statistics
   */
  static getThreadStats(threads: EmailThread[]) {
    const stats = {
      totalThreads: threads.length,
      totalMessages: threads.reduce((sum, t) => sum + t.messageCount, 0),
      unreadThreads: threads.filter((t) => t.unreadCount > 0).length,
      unreadMessages: threads.reduce((sum, t) => sum + t.unreadCount, 0),
      starredThreads: threads.filter((t) => t.messages.some((e) => e.isStarred)).length,
      threadsWithAttachments: threads.filter((t) => t.messages.some((e) => e.attachments && e.attachments.length > 0)).length,
      averageMessagesPerThread: 0,
    };

    if (stats.totalThreads > 0) {
      stats.averageMessagesPerThread = Math.round(stats.totalMessages / stats.totalThreads);
    }

    return stats;
  }
}