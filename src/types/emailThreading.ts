/**
 * Email Threading Type Definitions
 * Handles conversation grouping, thread structure, and visualization
 */

export type ThreadViewMode = 'grouped' | 'flat';
export type ThreadExpandMode = 'never' | 'first' | 'always';
export type ThreadSortOrder = 'newest' | 'oldest' | 'recent';

export interface ThreadNode {
  id: string;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  children: ThreadNode[];
  depth: number;
}

export interface EmailThread {
  id: string;
  subject: string;
  messages: ThreadedEmail[];
  rootMessageId: string;
  participantEmails: string[];
  participantCount: number;
  messageCount: number;
  unreadCount: number;
  isExpanded: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  folderId?: string;
}

export interface ThreadedEmail extends Email {
  threadId: string;
  threadPosition: number;
  depth: number;
  hasReplies: boolean;
  isRoot: boolean;
  isLastInThread: boolean;
}

export interface Email {
  id: string;
  messageId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  folderId: string;
  attachments?: Attachment[];
  inReplyTo?: string;
  references?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface ThreadSummary {
  threadId: string;
  subject: string;
  preview: string;
  participantAvatars: string[];
  participantNames: string[];
  messageCount: number;
  unreadCount: number;
  lastActivityAt: Date;
  isUnread: boolean;
}

export interface ThreadNavigation {
  currentThreadId: string;
  previousThreadId: string | null;
  nextThreadId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ThreadPreferences {
  viewMode: ThreadViewMode;
  expandMode: ThreadExpandMode;
  sortOrder: ThreadSortOrder;
  excludeFolders: string[];
  showAvatars: boolean;
  showPreview: boolean;
  maxPreviewLength: number;
  autoMarkRead: boolean;
}

export interface ThreadFilter {
  folderId?: string;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  hasAttachments?: boolean;
  participant?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  subjectContains?: string;
}

export interface ThreadSearchParams {
  query?: string;
  filter: ThreadFilter;
  page: number;
  pageSize: number;
}

export interface ThreadSearchResult {
  threads: EmailThread[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ThreadAction {
  type: 'mark-read' | 'mark-unread' | 'archive' | 'delete' | 'star' | 'unstar';
  threadId: string;
  emailIds?: string[];
}

export interface ThreadStats {
  totalThreads: number;
  totalMessages: number;
  unreadThreads: number;
  unreadMessages: number;
  starredThreads: number;
  threadsWithAttachments: number;
  averageMessagesPerThread: number;
}

export interface ThreadTimeline {
  threadId: string;
  events: ThreadEvent[];
}

export interface ThreadEvent {
  type: 'message' | 'reply' | 'forward' | 'attachment';
  emailId: string;
  timestamp: Date;
  description: string;
}
