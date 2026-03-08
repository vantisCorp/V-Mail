// Email Statistics Types

export interface EmailStats {
  total: number;
  read: number;
  unread: number;
  starred: number;
  withAttachments: number;
  encrypted: number;
  phantom: number;
  selfDestruct: number;
}

export interface FolderStats {
  folderId: string;
  folderName: string;
  count: number;
  unreadCount: number;
  size: number; // in bytes
}

export interface TimeStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

export interface SenderStats {
  email: string;
  name?: string;
  count: number;
  lastReceived: Date;
}

export interface RecipientStats {
  email: string;
  name?: string;
  count: number;
  lastSent?: Date;
}

export interface SubjectStats {
  subject: string;
  count: number;
}

export interface AttachmentStats {
  count: number;
  totalSize: number; // in bytes
  byType: Record<string, number>; // file extension -> count
}

export interface ActivityStats {
  emailsReceived: number;
  emailsSent: number;
  emailsDeleted: number;
  averageDailyEmails: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

export interface LabelStats {
  label: string;
  count: number;
}

export interface SearchStats {
  totalSearches: number;
  savedSearches: number;
  recentSearches: string[];
}

export interface EmailStatistics {
  email: EmailStats;
  folders: FolderStats[];
  time: TimeStats;
  topSenders: SenderStats[];
  topRecipients: RecipientStats[];
  topSubjects: SubjectStats[];
  attachments: AttachmentStats;
  activity: ActivityStats;
  labels: LabelStats[];
  search: SearchStats;
}

export interface StatisticsTimeRange {
  start: Date;
  end: Date;
}

export interface StatisticsFilter {
  folders?: string[];
  labels?: string[];
  includeSent?: boolean;
  includeReceived?: boolean;
}
