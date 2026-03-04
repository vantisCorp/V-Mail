import React from 'react';
import type { EmailStatistics as EmailStatisticsType } from '../types/statistics';

interface EmailStatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: EmailStatisticsType;
  timeRange: { start: Date; end: Date };
  onRefresh: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StatCard: React.FC<{ label: string; value: string | number; icon?: string }> = ({ label, value, icon }) => (
  <div className="stat-card">
    {icon && <span className="stat-icon">{icon}</span>}
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

export const EmailStatistics: React.FC<EmailStatisticsProps> = ({
  isOpen,
  onClose,
  statistics,
  timeRange,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="statistics-overlay">
      <div className="statistics-panel">
        <div className="statistics-header">
          <h2>📊 Email Statistics</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="statistics-content">
          {/* Time Range */}
          <div className="time-range">
            <span>Range: {formatDate(timeRange.start)} - {formatDate(timeRange.end)}</span>
            <button className="refresh-btn" onClick={onRefresh} title="Refresh statistics">
              🔄
            </button>
          </div>

          {/* Email Stats */}
          <section className="stats-section">
            <h3>Email Overview</h3>
            <div className="stats-grid">
              <StatCard label="Total Emails" value={statistics.email.total} icon="📧" />
              <StatCard label="Read" value={statistics.email.read} icon="✅" />
              <StatCard label="Unread" value={statistics.email.unread} icon="📨" />
              <StatCard label="Starred" value={statistics.email.starred} icon="⭐" />
              <StatCard label="With Attachments" value={statistics.email.withAttachments} icon="📎" />
              <StatCard label="Encrypted" value={statistics.email.encrypted} icon="🔒" />
              <StatCard label="Phantom Aliases" value={statistics.email.phantom} icon="👻" />
              <StatCard label="Self-Destruct" value={statistics.email.selfDestruct} icon="⏰" />
            </div>
          </section>

          {/* Time Stats */}
          <section className="stats-section">
            <h3>Emails by Time Period</h3>
            <div className="stats-grid">
              <StatCard label="Today" value={statistics.time.today} icon="📅" />
              <StatCard label="This Week" value={statistics.time.thisWeek} icon="📆" />
              <StatCard label="This Month" value={statistics.time.thisMonth} icon="🗓️" />
              <StatCard label="This Year" value={statistics.time.thisYear} icon="📊" />
            </div>
          </section>

          {/* Activity Stats */}
          <section className="stats-section">
            <h3>Activity Summary</h3>
            <div className="stats-grid">
              <StatCard label="Received" value={statistics.activity.emailsReceived} icon="📥" />
              <StatCard label="Sent" value={statistics.activity.emailsSent} icon="📤" />
              <StatCard label="Deleted" value={statistics.activity.emailsDeleted} icon="🗑️" />
              <StatCard label="Avg Daily" value={statistics.activity.averageDailyEmails} icon="📈" />
              <StatCard label="Most Active Day" value={statistics.activity.mostActiveDay} icon="📋" />
              <StatCard label="Most Active Hour" value={`${statistics.activity.mostActiveHour}:00`} icon="⏱️" />
            </div>
          </section>

          {/* Folder Stats */}
          <section className="stats-section">
            <h3>Folder Statistics</h3>
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Folder</th>
                    <th>Total</th>
                    <th>Unread</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.folders.map(folder => (
                    <tr key={folder.folderId}>
                      <td>{folder.folderName}</td>
                      <td>{folder.count}</td>
                      <td>{folder.unreadCount}</td>
                      <td>{formatBytes(folder.size)}</td>
                    </tr>
                  ))}
                  {statistics.folders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-message">No folder data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Senders */}
          <section className="stats-section">
            <h3>Top Senders</h3>
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Emails</th>
                    <th>Last Received</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.topSenders.map((sender, index) => (
                    <tr key={index}>
                      <td>{sender.email}</td>
                      <td>{sender.count}</td>
                      <td>{formatDate(sender.lastReceived)}</td>
                    </tr>
                  ))}
                  {statistics.topSenders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-message">No sender data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Recipients */}
          <section className="stats-section">
            <h3>Top Recipients</h3>
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Emails</th>
                    <th>Last Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.topRecipients.map((recipient, index) => (
                    <tr key={index}>
                      <td>{recipient.email}</td>
                      <td>{recipient.count}</td>
                      <td>{recipient.lastSent ? formatDate(recipient.lastSent) : 'N/A'}</td>
                    </tr>
                  ))}
                  {statistics.topRecipients.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-message">No recipient data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Attachment Stats */}
          <section className="stats-section">
            <h3>Attachments</h3>
            <div className="stats-grid">
              <StatCard label="Total Attachments" value={statistics.attachments.count} icon="📎" />
              <StatCard label="Total Size" value={formatBytes(statistics.attachments.totalSize)} icon="💾" />
            </div>
            {Object.keys(statistics.attachments.byType).length > 0 && (
              <div className="attachment-types">
                <h4>By File Type</h4>
                <div className="type-stats">
                  {Object.entries(statistics.attachments.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="type-stat">
                        <span className="type-name">.{type}</span>
                        <span className="type-count">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};