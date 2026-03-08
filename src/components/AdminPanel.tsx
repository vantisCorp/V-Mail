/**
 * AdminPanel Component for V-Mail v1.2.0
 *
 * Comprehensive admin panel with tabs for:
 * - Dashboard (overview statistics and system health)
 * - Users (user management and bulk operations)
 * - Audit Logs (activity tracking and filtering)
 * - Settings (system configuration)
 * - Alerts (security and system alerts)
 */

import React, { useState, useMemo } from 'react';
import { useAdminPanel } from '../hooks/useAdminPanel';
import type { AdminUser, SystemAlert, CreateUserPayload, UpdateUserPayload } from '../types/adminPanel';
import '../styles/admin-panel.css';

type TabType = 'dashboard' | 'users' | 'audit-logs' | 'settings' | 'alerts';

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusColors: Record<string, string> = {
    active: 'status-active',
    suspended: 'status-suspended',
    deleted: 'status-deleted',
    pending: 'status-pending',
    healthy: 'status-healthy',
    degraded: 'status-degraded',
    outage: 'status-outage'
  };

  return (
    <span className={`status-badge ${statusColors[status] || ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Role badge component
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleColors: Record<string, string> = {
    super_admin: 'role-super-admin',
    admin: 'role-admin',
    support: 'role-support'
  };

  const roleName = role.replace('_', ' ');

  return (
    <span className={`role-badge ${roleColors[role] || ''}`}>
      {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
    </span>
  );
};

// Severity badge component
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const severityColors: Record<string, string> = {
    info: 'severity-info',
    warning: 'severity-warning',
    error: 'severity-error',
    critical: 'severity-critical'
  };

  return (
    <span className={`severity-badge ${severityColors[severity] || ''}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;
}> = ({ title, value, subtitle, icon, trend }) => (
  <div className="stats-card">
    <div className="stats-icon">{icon}</div>
    <div className="stats-content">
      <h4 className="stats-value">{value}</h4>
      <p className="stats-title">{title}</p>
      {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      {trend !== undefined && (
        <span className={`stats-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

// Service health component
const ServiceHealth: React.FC<{
  service: string;
  status: string;
  responseTime: number;
  uptime: number;
}> = ({ service, status, responseTime, uptime }) => (
  <div className="service-health">
    <div className="service-header">
      <span className="service-name">{service}</span>
      <StatusBadge status={status} />
    </div>
    <div className="service-metrics">
      <span className="metric">
        <strong>{responseTime}ms</strong> Response
      </span>
      <span className="metric">
        <strong>{uptime}%</strong> Uptime
      </span>
    </div>
  </div>
);

// User row component
const UserRow: React.FC<{
  user: AdminUser;
  onEdit: () => void;
  onDelete: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}> = ({ user, onEdit, onDelete, onSuspend, onReactivate }) => {
  const formatDate = (date?: Date) => {
    if (!date) {
return 'Never';
}
    return new Date(date).toLocaleDateString();
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) {
return `${(gb * 1024).toFixed(1)} MB`;
}
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="user-row">
      <div className="user-info">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>

      <div className="user-meta">
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>

      <div className="user-stats">
        <span className="stat">
          <strong>{formatStorage(user.storageUsed)}</strong> Storage
        </span>
        <span className="stat">
          <strong>{user.emailCount.toLocaleString()}</strong> Emails
        </span>
      </div>

      <div className="user-dates">
        <span className="date">Joined: {formatDate(user.createdAt)}</span>
        <span className="date">Last login: {formatDate(user.lastLoginAt)}</span>
      </div>

      <div className="user-actions">
        <button className="btn-icon" onClick={onEdit} title="Edit">✏️</button>
        {user.status === 'active' ? (
          <button className="btn-icon" onClick={onSuspend} title="Suspend">⏸️</button>
        ) : user.status === 'suspended' ? (
          <button className="btn-icon" onClick={onReactivate} title="Reactivate">▶️</button>
        ) : null}
        <button className="btn-icon btn-danger" onClick={onDelete} title="Delete">🗑️</button>
      </div>
    </div>
  );
};

// Alert card component
const AlertCard: React.FC<{
  alert: SystemAlert;
  onResolve: () => void;
  onDismiss: () => void;
}> = ({ alert, onResolve, onDismiss }) => {
  const typeIcons: Record<string, string> = {
    performance: '📊',
    security: '🔒',
    storage: '💾',
    billing: '💳',
    system: '⚙️'
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (hours < 1) {
return 'Just now';
}
    if (hours < 24) {
return `${hours}h ago`;
}
    if (days === 1) {
return 'Yesterday';
}
    return `${days} days ago`;
  };

  return (
    <div className={`alert-card ${alert.isRead ? 'read' : 'unread'} ${alert.isResolved ? 'resolved' : ''}`}>
      <div className="alert-icon">{typeIcons[alert.type] || '📋'}</div>
      <div className="alert-content">
        <div className="alert-header">
          <span className="alert-title">{alert.title}</span>
          <SeverityBadge severity={alert.severity} />
        </div>
        <p className="alert-message">{alert.message}</p>
        <div className="alert-footer">
          <span className="alert-time">{timeAgo(alert.createdAt)}</span>
          {alert.isResolved && (
            <span className="alert-resolved">Resolved</span>
          )}
        </div>
      </div>
      {!alert.isResolved && (
        <div className="alert-actions">
          {!alert.isRead && (
            <button className="btn-sm" onClick={onDismiss}>Dismiss</button>
          )}
          <button className="btn-sm btn-primary" onClick={onResolve}>Resolve</button>
        </div>
      )}
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const {
    users,
    auditLogs,
    systemStatus,
    alerts,
    stats,
    settings,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
    bulkDeleteUsers,
    resolveAlert,
    dismissAlert,
    updateSettings,
    getFilteredUsers,
    searchUsers
  } = useAdminPanel();

  const filteredUsers = useMemo(() => {
    let result = searchQuery ? searchUsers(searchQuery) : users;

    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    return result;
  }, [users, searchQuery, statusFilter, roleFilter, searchUsers]);

  const handleCreateUser = async (payload: CreateUserPayload) => {
    await createUser(payload);
  };

  const handleEditUser = async (userId: string, payload: UpdateUserPayload) => {
    await updateUser(userId, payload);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(userId);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (confirm('Are you sure you want to suspend this user?')) {
      await suspendUser(userId);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    await reactivateUser(userId);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
return;
}
    if (confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) {
      await bulkDeleteUsers(Array.from(selectedUsers));
      setSelectedUsers(new Set());
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId);
  };

  const handleDismissAlert = async (alertId: string) => {
    await dismissAlert(alertId);
  };

  if (isLoading) {
    return (
      <div className="admin-panel-loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-header-info">
          <span className="system-status">
            <StatusBadge status={systemStatus?.overall || 'healthy'} />
          </span>
          <span className="version">v{systemStatus?.version || '1.2.0'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-logs')}
        >
          Audit Logs
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts
          {alerts.filter(a => !a.isRead).length > 0 && (
            <span className="badge">
              {alerts.filter(a => !a.isRead).length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="tab-panel dashboard-panel">
            <h2>Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="stats-grid">
              <StatsCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon="👥"
                trend={stats?.revenue.growth}
              />
              <StatsCard
                title="Active Users"
                value={stats?.activeUsers || 0}
                subtitle={`${stats?.suspendedUsers || 0} suspended`}
                icon="✅"
              />
              <StatsCard
                title="Total Teams"
                value={stats?.totalTeams || 0}
                subtitle={`${stats?.activeTeams || 0} active`}
                icon="🏢"
              />
              <StatsCard
                title="Storage Used"
                value={`${(stats?.storageUsed || 0).toFixed(0)} GB`}
                subtitle={`of ${(stats?.totalStorage || 0).toFixed(0)} GB`}
                icon="💾"
              />
              <StatsCard
                title="Emails Today"
                value={stats?.emailsToday?.toLocaleString() || 0}
                icon="✉️"
              />
              <StatsCard
                title="Monthly Recurring Revenue"
                value={`$${(stats?.revenue.mrr || 0).toLocaleString()}`}
                icon="💰"
                trend={stats?.revenue.growth}
              />
            </div>

            {/* System Health */}
            <div className="system-health-section">
              <h3>System Health</h3>
              <div className="system-health-grid">
                {systemStatus?.services.map(service => (
                  <ServiceHealth
                    key={service.service}
                    service={service.service}
                    status={service.status}
                    responseTime={service.responseTime}
                    uptime={service.uptime}
                  />
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="recent-alerts-section">
              <h3>Recent Alerts</h3>
              <div className="alerts-list">
                {alerts.slice(0, 3).map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={() => handleResolveAlert(alert.id)}
                    onDismiss={() => handleDismissAlert(alert.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-panel users-panel">
            <div className="users-toolbar">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-bar">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                  <option value="deleted">Deleted</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="action-bar">
                <button className="btn-primary">+ Create User</button>
                {selectedUsers.size > 0 && (
                  <button className="btn-danger" onClick={handleBulkDelete}>
                    Delete Selected ({selectedUsers.size})
                  </button>
                )}
              </div>
            </div>

            <div className="users-table-header">
              <div className="user-header">User</div>
              <div className="meta-header">Role & Status</div>
              <div className="stats-header">Statistics</div>
              <div className="dates-header">Dates</div>
              <div className="actions-header">Actions</div>
            </div>

            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <p>No users found matching your criteria.</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => handleEditUser(user.id, {})}
                    onDelete={() => handleDeleteUser(user.id)}
                    onSuspend={() => handleSuspendUser(user.id)}
                    onReactivate={() => handleReactivateUser(user.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit-logs' && (
          <div className="tab-panel audit-logs-panel">
            <h2>Audit Logs</h2>
            <div className="audit-logs-toolbar">
              <input
                type="text"
                placeholder="Search audit logs..."
                className="search-input"
              />
            </div>

            <div className="audit-logs-list">
              {auditLogs.map(log => (
                <div key={log.id} className="audit-log-entry">
                  <div className="log-header">
                    <SeverityBadge severity={log.severity} />
                    <span className="log-action">{log.action}</span>
                    <span className="log-timestamp">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="log-content">
                    <p className="log-details">{log.details}</p>
                    <div className="log-meta">
                      <span className="log-user">{log.userName} ({log.userEmail})</span>
                      {log.targetName && (
                        <span className="log-target">Target: {log.targetName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-panel settings-panel">
            <h2>Admin Settings</h2>

            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Max Users Per Team</label>
                  <input
                    type="number"
                    defaultValue={settings?.maxUsersPerTeam}
                    onChange={(e) => updateSettings({ maxUsersPerTeam: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Default Storage Limit (GB)</label>
                  <input
                    type="number"
                    defaultValue={settings?.defaultStorageLimit}
                    onChange={(e) => updateSettings({ defaultStorageLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-form">
                <label className="toggle-item">
                  <span>Require Email Verification</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.requireEmailVerification}
                    onChange={(e) => updateSettings({ requireEmailVerification: e.target.checked })}
                  />
                </label>

                <label className="toggle-item">
                  <span>Require Two-Factor Authentication</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.requireTwoFactor}
                    onChange={(e) => updateSettings({ requireTwoFactor: e.target.checked })}
                  />
                </label>

                <div className="form-group">
                  <label>Max Login Attempts</label>
                  <input
                    type="number"
                    defaultValue={settings?.maxLoginAttempts}
                    onChange={(e) => updateSettings({ maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Feature Flags</h3>
              <div className="settings-form">
                <label className="toggle-item">
                  <span>Enable New User Registration</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.enableNewUserRegistration}
                    onChange={(e) => updateSettings({ enableNewUserRegistration: e.target.checked })}
                  />
                </label>

                <label className="toggle-item">
                  <span>Enable Team Creation</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.enableTeamCreation}
                    onChange={(e) => updateSettings({ enableTeamCreation: e.target.checked })}
                  />
                </label>

                <label className="toggle-item">
                  <span>Enable Public API</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.enablePublicApi}
                    onChange={(e) => updateSettings({ enablePublicApi: e.target.checked })}
                  />
                </label>

                <label className="toggle-item">
                  <span>Enable Maintenance Mode</span>
                  <input
                    type="checkbox"
                    defaultChecked={settings?.enableMaintenanceMode}
                    onChange={(e) => updateSettings({ enableMaintenanceMode: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="tab-panel alerts-panel">
            <h2>System Alerts</h2>

            <div className="alerts-list">
              {alerts.length === 0 ? (
                <div className="empty-state">
                  <p>No alerts at this time.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={() => handleResolveAlert(alert.id)}
                    onDismiss={() => handleDismissAlert(alert.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
