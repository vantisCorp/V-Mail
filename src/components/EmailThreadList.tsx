/**
 * Email Thread List Component
 * Displays emails grouped into threads with expand/collapse functionality
 */

import React, { useEffect } from 'react';
import { useEmailThreading } from '../hooks/useEmailThreading';
import { ThreadedEmail } from '../types/emailThreading';
import '../styles/emailThreading.css';

interface EmailThreadListProps {
  emails: ThreadedEmail[];
  onEmailClick?: (emailId: string) => void;
  onThreadClick?: (threadId: string) => void;
}

export const EmailThreadList: React.FC<EmailThreadListProps> = ({
  emails,
  onEmailClick,
  onThreadClick,
}) => {
  const {
    threads,
    preferences,
    filter,
    selectedThreadId,
    loading,
    navigation,
    stats,
    selectThread,
    toggleThreadExpansion,
    expandThread,
    collapseThread,
    goToNextThread,
    goToPreviousThread,
    markThreadAsRead,
    archiveThread,
    starThread,
    updatePreferences,
    updateFilter,
    clearFilter,
    isThreadExpanded,
  } = useEmailThreading(emails);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if input is focused
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          goToNextThread();
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          goToPreviousThread();
          break;
        case 'o':
        case 'Enter':
          e.preventDefault();
          if (selectedThreadId) {
            expandThread(selectedThreadId);
          }
          break;
        case 'e':
          e.preventDefault();
          if (selectedThreadId) {
            toggleThreadExpansion(selectedThreadId);
          }
          break;
        case 'r':
          e.preventDefault();
          if (selectedThreadId) {
            markThreadAsRead(selectedThreadId);
          }
          break;
        case 'a':
          e.preventDefault();
          if (selectedThreadId) {
            archiveThread(selectedThreadId);
          }
          break;
        case 's':
          e.preventDefault();
          if (selectedThreadId) {
            starThread(selectedThreadId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedThreadId, goToNextThread, goToPreviousThread, expandThread, toggleThreadExpansion, markThreadAsRead, archiveThread, starThread]);

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleThreadClick = (threadId: string) => {
    selectThread(threadId);
    onThreadClick?.(threadId);
  };

  const handleEmailClick = (emailId: string) => {
    onEmailClick?.(emailId);
  };

  const handleStarToggle = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    starThread(threadId);
  };

  if (loading) {
    return (
      <div className="thread-loading">
        <div className="thread-loading-spinner" />
        <span>Loading threads...</span>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="thread-empty">
        <div className="thread-empty-icon">📧</div>
        <div className="thread-empty-title">No threads found</div>
        <div className="thread-empty-description">
          {Object.keys(filter).length > 0
            ? 'Try adjusting your filters or search criteria'
            : 'Your inbox is empty'}
        </div>
      </div>
    );
  }

  return (
    <div className="thread-container">
      {/* Filter Bar */}
      <div className="thread-filter-bar">
        <select
          className="thread-filter-select"
          value={preferences.sortOrder}
          onChange={(e) => updatePreferences({ sortOrder: e.target.value as any })}
        >
          <option value="recent">Most Recent</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <div className="thread-view-toggle">
          <button
            className={`thread-view-btn ${preferences.viewMode === 'grouped' ? 'active' : ''}`}
            onClick={() => updatePreferences({ viewMode: 'grouped' })}
          >
            Grouped
          </button>
          <button
            className={`thread-view-btn ${preferences.viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => updatePreferences({ viewMode: 'flat' })}
          >
            Flat
          </button>
        </div>

        <input
          type="text"
          className="thread-search-input"
          placeholder="Search threads..."
          onChange={(e) => updateFilter({ subjectContains: e.target.value })}
        />
      </div>

      {/* Stats Bar */}
      <div className="thread-stats-bar">
        <div className="thread-stats-info">
          <div className="thread-stat">
            <span className="thread-stat-value">{stats.totalThreads}</span>
            <span>threads</span>
          </div>
          <div className="thread-stat">
            <span className="thread-stat-value">{stats.totalMessages}</span>
            <span>messages</span>
          </div>
          <div className="thread-stat">
            <span className="thread-stat-value">{stats.unreadThreads}</span>
            <span>unread</span>
          </div>
        </div>

        <div className="thread-pagination">
          <button
            className="thread-pagination-btn"
            onClick={goToPreviousThread}
            disabled={!navigation.canGoBack}
          >
            ← Prev
          </button>
          <button
            className="thread-pagination-btn"
            onClick={goToNextThread}
            disabled={!navigation.canGoForward}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Thread List */}
      {threads.map((thread) => {
        const isExpanded = isThreadExpanded(thread.id);
        const isSelected = selectedThreadId === thread.id;
        const isUnread = thread.unreadCount > 0;

        return (
          <div
            key={thread.id}
            className={`thread-item ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => handleThreadClick(thread.id)}
          >
            {/* Thread Header */}
            <div className="thread-header">
              {/* Expand/Collapse Toggle */}
              <div
                className={`thread-expand-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleThreadExpansion(thread.id);
                }}
              >
                ▶
              </div>

              {/* Participant Avatars */}
              {preferences.showAvatars && thread.participantEmails.length > 0 && (
                <div className="thread-avatars">
                  {thread.participantEmails.slice(0, 3).map((email, index) => (
                    <div key={index} className="thread-avatar">
                      {getInitials(email)}
                    </div>
                  ))}
                </div>
              )}

              {/* Thread Content */}
              <div className="thread-content">
                <div className={`thread-subject ${isUnread ? 'unread' : ''}`}>
                  {thread.subject}
                  {isUnread && (
                    <span className="thread-replies-indicator">
                      <span className="thread-replies-indicator-icon">●</span>
                      {thread.unreadCount} unread
                    </span>
                  )}
                </div>

                {preferences.showPreview && thread.messages.length > 0 && (
                  <div className="thread-preview">
                    {thread.messages[thread.messages.length - 1].body.substring(0, preferences.maxPreviewLength)}
                    {thread.messages[thread.messages.length - 1].body.length > preferences.maxPreviewLength && '...'}
                  </div>
                )}
              </div>

              {/* Thread Meta */}
              <div className="thread-meta">
                <div className="thread-count">
                  <span className={`thread-count-badge ${isUnread ? 'unread' : ''}`}>
                    {thread.messageCount}
                  </span>
                </div>
                <div className="thread-timestamp">
                  {formatTimestamp(thread.lastActivityAt)}
                </div>
              </div>

              {/* Thread Actions */}
              <div className="thread-actions">
                <button
                  className={`thread-action-btn ${thread.messages.some((e) => e.isStarred) ? 'active' : ''}`}
                  onClick={(e) => handleStarToggle(e, thread.id)}
                  title="Star thread"
                >
                  ★
                </button>
                <button
                  className="thread-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    markThreadAsRead(thread.id);
                  }}
                  title="Mark as read"
                >
                  ✓
                </button>
                <button
                  className="thread-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveThread(thread.id);
                  }}
                  title="Archive thread"
                >
                  📦
                </button>
              </div>
            </div>

            {/* Thread Messages */}
            {isExpanded && (
              <div className="thread-messages">
                {thread.messages.map((email) => (
                  <div
                    key={email.id}
                    className={`thread-message thread-message-depth-${Math.min(email.depth, 4)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmailClick(email.id);
                    }}
                  >
                    <div className="thread-message-header">
                      <div className="thread-message-from">{email.from}</div>
                      <div className="thread-message-timestamp">
                        {formatTimestamp(email.timestamp)}
                      </div>
                    </div>

                    <div className="thread-message-body">
                      {email.body.substring(0, 200)}
                      {email.body.length > 200 && '...'}
                    </div>

                    {email.attachments && email.attachments.length > 0 && (
                      <div className="thread-message-attachments">
                        {email.attachments.map((attachment) => (
                          <div key={attachment.id} className="thread-message-attachment">
                            <span className="thread-message-attachment-icon">📎</span>
                            <span>{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};