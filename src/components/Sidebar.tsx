import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEmails } from '../hooks/useEmails';
import { useNotifications } from '../hooks/useNotifications';

interface SidebarProps {
  onCompose: () => void;
  onPhantom: () => void;
  onSelfDestruct: () => void;
  onPanic: () => void;
  onAutoReplySettings?: () => void;
  onFilterSettings?: () => void;
  onLabelSettings?: () => void;
  onAdvancedSearch?: () => void;
  onStatistics?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCompose,
  onPhantom,
  onSelfDestruct,
  onPanic,
  onAutoReplySettings,
  onFilterSettings,
  onLabelSettings,
  onAdvancedSearch,
  onStatistics
}) => {
  const { folders } = useEmails();
  const { addNotification } = useNotifications();
  const location = useLocation();

  const getFolderPath = (folderId: string): string => {
    const pathMap: Record<string, string> = {
      inbox: '/inbox',
      sent: '/sent',
      drafts: '/drafts',
      trash: '/trash'
    };
    return pathMap[folderId] || '/inbox';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-text">Vantis Mail</span>
        </div>
      </div>

      <button className="compose-btn" onClick={onCompose}>
        <span className="compose-icon">✏️</span>
        <span>Compose</span>
      </button>

      <nav className="sidebar-nav">
        <ul className="folder-list">
          {folders.map((folder) => (
            <li key={folder.id}>
              <Link
                to={getFolderPath(folder.id)}
                className={`folder-btn ${location.pathname === getFolderPath(folder.id) ? 'active' : ''}`}
              >
                <span className="folder-icon">{folder.icon}</span>
                <span className="folder-name">{folder.name}</span>
                {folder.count > 0 && (
                  <span className="folder-count">{folder.count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="security-status">
          <div className="status-indicator secure"></div>
          <span className="status-text">Secure Connection</span>
        </div>

        <div className="sidebar-actions">
          <button
            className="action-btn"
            onClick={onPhantom}
            title="Manage Phantom Aliases"
          >
            <span>👻</span>
            <span>Phantom</span>
          </button>
          <button
            className="action-btn"
            onClick={onSelfDestruct}
            title="Self-Destruct Options"
          >
            <span>⏰</span>
            <span>Destruct</span>
          </button>
          <button
            className="action-btn panic-btn"
            onClick={onPanic}
            title="Panic Mode"
          >
            <span>🚨</span>
            <span>Panic</span>
          </button>
          {onAutoReplySettings && (
            <button
              className="action-btn"
              onClick={onAutoReplySettings}
              title="Auto-Reply Settings"
            >
              <span>↩️</span>
              <span>Auto-Reply</span>
            </button>
          )}
          {onFilterSettings && (
            <button
              className="action-btn"
              onClick={onFilterSettings}
              title="Email Filters"
            >
              <span>🔍</span>
              <span>Filters</span>
            </button>
          )}
          {onLabelSettings && (
            <button
              className="action-btn"
              onClick={onLabelSettings}
              title="Email Labels"
            >
              <span>🏷️</span>
              <span>Labels</span>
            </button>
          )}
          {onAdvancedSearch && (
            <button
              className="action-btn"
              onClick={onAdvancedSearch}
              title="Advanced Search"
            >
              <span>🔬</span>
              <span>Search</span>
            </button>
          )}
          {onStatistics && (
            <button
              className="action-btn"
              onClick={onStatistics}
              title="Email Statistics"
            >
              <span>📊</span>
              <span>Stats</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
