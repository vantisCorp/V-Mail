import { useState, useMemo, useCallback } from 'react';
import { Email } from '../types';
import {
  EmailStats,
  FolderStats,
  TimeStats,
  SenderStats,
  RecipientStats,
  AttachmentStats,
  ActivityStats,
  EmailStatistics,
  StatisticsTimeRange
} from '../types/statistics';

interface UseEmailStatisticsReturn {
  statistics: EmailStatistics;
  timeRange: StatisticsTimeRange;
  setTimeRange: (range: StatisticsTimeRange) => void;
  refreshStats: () => void;
}

const getTimeAgo = (date: Date, days: number): boolean => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysInMs = days * 24 * 60 * 60 * 1000;
  return diff <= daysInMs;
};

const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getHour = (date: Date): number => {
  return date.getHours();
};

export const useEmailStatistics = (emails: Email[]): UseEmailStatisticsReturn => {
  const [timeRange, setTimeRange] = useState<StatisticsTimeRange>({
    start: new Date(0), // Beginning of time
    end: new Date() // Now
  });

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const emailDate = new Date(email.date);
      return emailDate >= timeRange.start && emailDate <= timeRange.end;
    });
  }, [emails, timeRange]);

  const emailStats: EmailStats = useMemo(() => {
    return {
      total: filteredEmails.length,
      read: filteredEmails.filter(e => e.read).length,
      unread: filteredEmails.filter(e => !e.read).length,
      starred: filteredEmails.filter(e => e.starred).length,
      withAttachments: filteredEmails.filter(e => e.hasAttachments).length,
      encrypted: filteredEmails.filter(e => e.encrypted).length,
      phantom: filteredEmails.filter(e => e.phantomAlias).length,
      selfDestruct: filteredEmails.filter(e => e.selfDestruct).length
    };
  }, [filteredEmails]);

  const folderStats: FolderStats[] = useMemo(() => {
    const folderMap = new Map<string, { count: number; unread: number; size: number; name: string }>();

    filteredEmails.forEach(email => {
      const folderId = email.folder?.id || 'unknown';
      const folderName = email.folder?.name || 'Unknown';
      const existing = folderMap.get(folderId) || { count: 0, unread: 0, size: 0, name: folderName };

      existing.count += 1;
      if (!email.read) {
existing.unread += 1;
}
      // Estimate email size (simplified)
      existing.size += email.body.length + email.subject.length;

      folderMap.set(folderId, existing);
    });

    return Array.from(folderMap.entries()).map(([folderId, stats]) => ({
      folderId,
      folderName: stats.name,
      count: stats.count,
      unreadCount: stats.unread,
      size: stats.size
    }));
  }, [filteredEmails]);

  const timeStats: TimeStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
      today: filteredEmails.filter(e => new Date(e.date) >= startOfToday).length,
      thisWeek: filteredEmails.filter(e => new Date(e.date) >= startOfWeek).length,
      thisMonth: filteredEmails.filter(e => new Date(e.date) >= startOfMonth).length,
      thisYear: filteredEmails.filter(e => new Date(e.date) >= startOfYear).length
    };
  }, [filteredEmails]);

  const topSenders: SenderStats[] = useMemo(() => {
    const senderMap = new Map<string, { count: number; lastReceived: Date; name?: string }>();

    filteredEmails.forEach(email => {
      const existing = senderMap.get(email.from) || { count: 0, lastReceived: new Date(0), name: undefined };
      existing.count += 1;
      const emailDate = new Date(email.date);
      if (emailDate > existing.lastReceived) {
        existing.lastReceived = emailDate;
      }
      senderMap.set(email.from, existing);
    });

    return Array.from(senderMap.entries())
      .map(([email, stats]) => ({
        email,
        count: stats.count,
        lastReceived: stats.lastReceived,
        name: stats.name
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredEmails]);

  const topRecipients: RecipientStats[] = useMemo(() => {
    const recipientMap = new Map<string, { count: number; lastSent?: Date; name?: string }>();

    filteredEmails.forEach(email => {
      const existing = recipientMap.get(email.to) || { count: 0, lastSent: undefined, name: undefined };
      existing.count += 1;
      const emailDate = new Date(email.date);
      if (!existing.lastSent || emailDate > existing.lastSent) {
        existing.lastSent = emailDate;
      }
      recipientMap.set(email.to, existing);
    });

    return Array.from(recipientMap.entries())
      .map(([email, stats]) => ({
        email,
        count: stats.count,
        lastSent: stats.lastSent,
        name: stats.name
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredEmails]);

  const attachmentStats: AttachmentStats = useMemo(() => {
    let count = 0;
    let totalSize = 0;
    const byType: Record<string, number> = {};

    filteredEmails.forEach(email => {
      if (email.attachments && email.attachments.length > 0) {
        email.attachments.forEach(attachment => {
          count += 1;
          totalSize += attachment.size;

          const extension = attachment.name.split('.').pop()?.toLowerCase() || 'unknown';
          byType[extension] = (byType[extension] || 0) + 1;
        });
      }
    });

    return { count, totalSize, byType };
  }, [filteredEmails]);

  const activityStats: ActivityStats = useMemo(() => {
    const dayCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};
    let totalEmails = 0;

    filteredEmails.forEach(email => {
      const date = new Date(email.date);
      const day = getDayOfWeek(date);
      const hour = getHour(date);

      dayCount[day] = (dayCount[day] || 0) + 1;
      hourCount[hour] = (hourCount[hour] || 0) + 1;
      totalEmails += 1;
    });

    const mostActiveDay = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const mostActiveHour = Object.entries(hourCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    const daysDiff = Math.max(1, Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (24 * 60 * 60 * 1000)));
    const averageDailyEmails = totalEmails / daysDiff;

    return {
      emailsReceived: filteredEmails.filter(e => e.folder?.id === 'inbox').length,
      emailsSent: filteredEmails.filter(e => e.folder?.id === 'sent').length,
      emailsDeleted: filteredEmails.filter(e => e.folder?.id === 'trash').length,
      averageDailyEmails: Math.round(averageDailyEmails * 10) / 10,
      mostActiveDay,
      mostActiveHour: parseInt(String(mostActiveHour))
    };
  }, [filteredEmails, timeRange]);

  const statistics: EmailStatistics = useMemo(() => ({
    email: emailStats,
    folders: folderStats,
    time: timeStats,
    topSenders,
    topRecipients,
    topSubjects: [],
    attachments: attachmentStats,
    activity: activityStats,
    labels: [],
    search: {
      totalSearches: 0,
      savedSearches: 0,
      recentSearches: []
    }
  }), [emailStats, folderStats, timeStats, topSenders, topRecipients, attachmentStats, activityStats]);

  const setTimeRangeCallback = useCallback((range: StatisticsTimeRange) => {
    setTimeRange(range);
  }, []);

  const refreshStats = useCallback(() => {
    // Force re-calculation by updating time range
    setTimeRange(prev => ({ ...prev }));
  }, []);

  return {
    statistics,
    timeRange,
    setTimeRange: setTimeRangeCallback,
    refreshStats
  };
};
