import React from 'react';
import { useEmails } from '../hooks/useEmails';
import { useNotifications } from '../hooks/useNotifications';

interface SidebarProps {
  onCompose: () => void;
  onPhantom: () => void;
  onSelfDestruct: () => void;
  onPanic: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCompose,
  onPhantom,
  onSelfDestruct,
  onPanic,
}) => {
  const { folders, selectedFolder, selectFolder } = useEmails();
  const { addNotification } = useNotifications();

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
              <button
                className={`folder-btn ${selectedFolder === folder.id ? 'active' : ''}`}
                onClick={() => selectFolder(folder.id)}
              >
                <span className="folder-icon">{folder.icon}</span>
                <span className="folder-name">{folder.name}</span>
                {folder.count > 0 && (
                  <span className="folder-count">{folder.count}</span>
                )}
              </button>
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
        </div>
      </div>
    </aside>
  );
};
