import React, { useState } from 'react';
import { useRBAC } from '../hooks/useRBAC';
import {
  Role,
  Permission,
  PermissionCategory,
  UserRoleAssignment,
  CustomPermissionSet,
  AccessPolicy,
  PermissionAuditLog,
  PermissionRequest
} from '../types/rbac';
import type { RBACSettings as RBACSettingsType } from '../types/rbac';
import '../styles/rbac.css';

const RBACSettings: React.FC = () => {
  const {
    isLoading,
    rolePermissions,
    userRoleAssignments,
    customPermissionSets,
    accessPolicies,
    auditLogs,
    permissionRequests,
    settings,
    stats,
    hasPermission,
    hasAllPermissions,
    getRoleLevel,
    canAssignRole,
    assignRole,
    revokeRole,
    updatePermissions,
    createCustomPermissionSet,
    updateCustomPermissionSet,
    deleteCustomPermissionSet,
    createAccessPolicy,
    updateAccessPolicy,
    deleteAccessPolicy,
    approvePermissionRequest,
    rejectPermissionRequest,
    updateSettings,
    getUsersByRole,
    getPermissionsByCategory,
    getFilteredAuditLogs,
    refreshUserRoleAssignments,
    refreshAuditLogs,
    refreshStats
  } = useRBAC();

  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'users' | 'policies' | 'audit' | 'requests' | 'settings'>('overview');
  const [selectedUser, setSelectedUser] = useState<UserRoleAssignment | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);

  // Sub-components
  const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
    const colors: Record<Role, string> = {
      [Role.SUPER_ADMIN]: 'role-super-admin',
      [Role.ADMIN]: 'role-admin',
      [Role.MANAGER]: 'role-manager',
      [Role.MEMBER]: 'role-member',
      [Role.VIEWER]: 'role-viewer',
      [Role.GUEST]: 'role-guest'
    };
    return <span className={`role-badge ${colors[role]}`}>{role.replace('_', ' ').toUpperCase()}</span>;
  };

  const PermissionBadge: React.FC<{ permission: Permission; granted?: boolean }> = ({ permission, granted = true }) => {
    const category = permission.split(':')[0] as PermissionCategory;
    return (
      <span className={`permission-badge ${granted ? 'granted' : 'revoked'} category-${category}`}>
        {permission.replace(/_/g, ' ')}
      </span>
    );
  };

  const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'expired' }> = ({ status }) => {
    const colors: Record<string, string> = {
      active: 'status-active',
      inactive: 'status-inactive',
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      expired: 'status-expired'
    };
    return <span className={`status-badge ${colors[status]}`}>{status.toUpperCase()}</span>;
  };

  const StatsCard: React.FC<{ title: string; value: number; description: string; icon: string }> = ({ title, value, description, icon }) => (
    <div className="stats-card">
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <div className="stats-value">{value}</div>
        <p className="stats-description">{description}</p>
      </div>
    </div>
  );

  const UserRow: React.FC<{ user: UserRoleAssignment }> = ({ user }) => (
    <div className="user-row" onClick={() => setSelectedUser(user)}>
      <div className="user-info">
        <div className="user-avatar">{user.userName.charAt(0)}</div>
        <div className="user-details">
          <div className="user-name">{user.userName}</div>
          <div className="user-email">{user.userEmail}</div>
        </div>
      </div>
      <div className="user-role">
        <RoleBadge role={user.role} />
      </div>
      <div className="user-permissions">
        {user.customPermissions?.length ? (
          <span className="custom-permissions-count">{user.customPermissions.length} custom</span>
        ) : (
          <span className="default-permissions">Default</span>
        )}
      </div>
      <div className="user-status">
        <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
      </div>
      <div className="user-expires">
        {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Never'}
      </div>
      <div className="user-actions">
        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); /* TODO */ }}>⚙️</button>
      </div>
    </div>
  );

  const AuditLogItem: React.FC<{ log: PermissionAuditLog }> = ({ log }) => (
    <div className="audit-log-item">
      <div className="audit-log-icon">{log.action === 'granted' ? '✅' : log.action === 'revoked' ? '🚫' : '✏️'}</div>
      <div className="audit-log-content">
        <div className="audit-log-header">
          <span className="audit-log-action">{log.action.toUpperCase()}</span>
          <span className="audit-log-time">{new Date(log.timestamp).toLocaleString()}</span>
        </div>
        <div className="audit-log-details">
          <strong>{log.actorUserName}</strong> {log.action} permissions for <strong>{log.targetUserName}</strong>
        </div>
        {log.reason && <div className="audit-log-reason">Reason: {log.reason}</div>}
        <div className="audit-log-changes">
          {log.changes.role && <span>Role: <RoleBadge role={log.changes.role} /></span>}
          {log.changes.permissions && (
            <div className="permission-changes">
              Permissions: {log.changes.permissions.map(p => <PermissionBadge key={p} permission={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const RequestCard: React.FC<{ request: PermissionRequest }> = ({ request }) => (
    <div className={`permission-request-card status-${request.status}`}>
      <div className="request-header">
        <div className="request-user">{request.requestedByName}</div>
        <StatusBadge status={request.status} />
      </div>
      <div className="request-content">
        <div className="request-permissions">
          {request.permissions.map(p => <PermissionBadge key={p} permission={p} />)}
        </div>
        <p className="request-reason">{request.reason}</p>
        <div className="request-meta">
          <span>Requested: {new Date(request.requestedAt).toLocaleString()}</span>
          {request.reviewedAt && <span>Reviewed: {new Date(request.reviewedAt).toLocaleString()}</span>}
        </div>
      </div>
      {request.status === 'pending' && (
        <div className="request-actions">
          <button className="btn-approve" onClick={() => approvePermissionRequest(request.id)}>Approve</button>
          <button className="btn-reject" onClick={() => rejectPermissionRequest(request.id)}>Reject</button>
        </div>
      )}
    </div>
  );

  const PolicyCard: React.FC<{ policy: AccessPolicy }> = ({ policy }) => (
    <div className={`policy-card ${!policy.isActive ? 'inactive' : ''}`}>
      <div className="policy-header">
        <h4>{policy.name}</h4>
        <StatusBadge status={policy.isActive ? 'active' : 'inactive'} />
      </div>
      <p className="policy-description">{policy.description}</p>
      <div className="policy-details">
        <div className="policy-resource">
          <strong>Resource:</strong> {policy.resource === '*' ? 'All Resources' : policy.resource}
        </div>
        <div className="policy-roles">
          <strong>Roles:</strong> {policy.roles.map(r => <RoleBadge key={r} role={r} />)}
        </div>
        <div className="policy-permissions">
          <strong>Permissions:</strong> {policy.permissions.slice(0, 3).map(p => <PermissionBadge key={p} permission={p} />)}
          {policy.permissions.length > 3 && <span>+{policy.permissions.length - 3} more</span>}
        </div>
        <div className="policy-priority">
          <strong>Priority:</strong> {policy.priority}
        </div>
      </div>
      <div className="policy-actions">
        <button className="btn-secondary" onClick={() => updateAccessPolicy(policy.id, { isActive: !policy.isActive })}>
          {policy.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );

  const CustomRoleCard: React.FC<{ roleSet: CustomPermissionSet }> = ({ roleSet }) => (
    <div className={`custom-role-card ${roleSet.isDefault ? 'default' : ''}`}>
      <div className="custom-role-header">
        <h4>{roleSet.name}</h4>
        {roleSet.isDefault && <span className="default-badge">Default</span>}
      </div>
      <p className="custom-role-description">{roleSet.description}</p>
      <div className="custom-role-permissions">
        {roleSet.permissions.slice(0, 5).map(p => <PermissionBadge key={p} permission={p} />)}
        {roleSet.permissions.length > 5 && <span>+{roleSet.permissions.length - 5} more</span>}
      </div>
      <div className="custom-role-meta">
        <span>Created: {new Date(roleSet.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(roleSet.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="custom-role-actions">
        <button className="btn-secondary" onClick={() => updateCustomPermissionSet(roleSet.id, { description: 'Updated description' })}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => deleteCustomPermissionSet(roleSet.id)}>
          Delete
        </button>
      </div>
    </div>
  );

  const ServiceHealth: React.FC<{ name: string; status: 'healthy' | 'degraded' | 'down' }> = ({ name, status }) => (
    <div className={`service-health ${status}`}>
      <div className="service-indicator" />
      <div className="service-name">{name}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="rbac-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading RBAC settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rbac-container">
      <div className="rbac-header">
        <h1>Role-Based Access Control</h1>
        <div className="rbac-actions">
          <button className="btn-primary" onClick={() => setShowAssignDialog(true)}>
            Assign Role
          </button>
          <button className="btn-secondary" onClick={() => setShowCreateRoleDialog(true)}>
            Create Custom Role
          </button>
        </div>
      </div>

      <div className="rbac-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
          Roles
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Users
        </button>
        <button className={`tab ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => setActiveTab('policies')}>
          Policies
        </button>
        <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          Audit Logs
        </button>
        <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          Requests
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Settings
        </button>
      </div>

      <div className="rbac-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <StatsCard title="Total Users" value={stats.totalUsers} description="Users with role assignments" icon="👥" />
              <StatsCard title="Custom Roles" value={stats.totalCustomRoles} description="Custom permission sets" icon="🎭" />
              <StatsCard title="Active Policies" value={stats.activePolicies} description="Active access policies" icon="📋" />
              <StatsCard title="Expiring Soon" value={stats.expiringAssignments} description="Assignments expiring in 30 days" icon="⏰" />
            </div>

            <div className="overview-sections">
              <div className="overview-section-card">
                <h3>Users by Role</h3>
                <div className="role-distribution">
                  {Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} className="role-distribution-item">
                      <RoleBadge role={role as Role} />
                      <span className="role-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overview-section-card">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  {auditLogs.slice(0, 5).map(log => <AuditLogItem key={log.id} log={log} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="roles-section">
            <h2>Default Roles</h2>
            <div className="roles-grid">
              {rolePermissions.map(rp => (
                <div key={rp.role} className="default-role-card">
                  <div className="role-header">
                    <h3>{rp.displayName}</h3>
                    <RoleBadge role={rp.role} />
                  </div>
                  <p>{rp.description}</p>
                  <div className="role-permissions-count">
                    {rp.permissions.length} permissions
                  </div>
                  <div className="role-level">
                    Level: {getRoleLevel(rp.role)}
                  </div>
                </div>
              ))}
            </div>

            <h2>Custom Roles</h2>
            <div className="custom-roles-grid">
              {customPermissionSets.map(roleSet => (
                <CustomRoleCard key={roleSet.id} roleSet={roleSet} />
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-header">
              <h2>User Role Assignments</h2>
              <div className="users-filters">
                <select className="filter-select">
                  <option value="">All Roles</option>
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <select className="filter-select">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="users-list">
              {userRoleAssignments.map(user => <UserRow key={user.id} user={user} />)}
            </div>

            {selectedUser && (
              <div className="user-details-panel">
                <div className="panel-header">
                  <h3>User Details</h3>
                  <button className="btn-close" onClick={() => setSelectedUser(null)}>×</button>
                </div>
                <div className="panel-content">
                  <div className="user-detail-row">
                    <strong>Name:</strong> {selectedUser.userName}
                  </div>
                  <div className="user-detail-row">
                    <strong>Email:</strong> {selectedUser.userEmail}
                  </div>
                  <div className="user-detail-row">
                    <strong>Role:</strong> <RoleBadge role={selectedUser.role} />
                  </div>
                  <div className="user-detail-row">
                    <strong>Status:</strong> <StatusBadge status={selectedUser.isActive ? 'active' : 'inactive'} />
                  </div>
                  <div className="user-detail-row">
                    <strong>Assigned:</strong> {new Date(selectedUser.assignedAt).toLocaleString()}
                  </div>
                  {selectedUser.expiresAt && (
                    <div className="user-detail-row">
                      <strong>Expires:</strong> {new Date(selectedUser.expiresAt).toLocaleString()}
                    </div>
                  )}
                  {selectedUser.customPermissions && selectedUser.customPermissions.length > 0 && (
                    <div className="user-detail-row">
                      <strong>Custom Permissions:</strong>
                      <div className="custom-permissions-list">
                        {selectedUser.customPermissions.map(p => <PermissionBadge key={p} permission={p} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="panel-actions">
                  <button className="btn-secondary" onClick={() => revokeRole({ userId: selectedUser.userId })}>
                    Revoke Role
                  </button>
                  <button className="btn-primary" onClick={() => updatePermissions({ userId: selectedUser.userId, permissions: selectedUser.customPermissions || [] })}>
                    Update Permissions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="policies-section">
            <div className="policies-header">
              <h2>Access Policies</h2>
              <button className="btn-primary" onClick={() => createAccessPolicy({ name: 'New Policy', description: '', resource: '*', permissions: [], roles: [], isActive: true, priority: 1 })}>
                Create Policy
              </button>
            </div>

            <div className="policies-grid">
              {accessPolicies.map(policy => <PolicyCard key={policy.id} policy={policy} />)}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="audit-section">
            <div className="audit-header">
              <h2>Audit Logs</h2>
              <button className="btn-secondary" onClick={refreshAuditLogs}>
                Refresh
              </button>
            </div>

            <div className="audit-filters">
              <input type="text" placeholder="Search by user..." className="search-input" />
              <select className="filter-select">
                <option value="">All Actions</option>
                <option value="granted">Granted</option>
                <option value="revoked">Revoked</option>
                <option value="modified">Modified</option>
              </select>
              <input type="date" className="date-input" />
            </div>

            <div className="audit-logs-list">
              {auditLogs.map(log => <AuditLogItem key={log.id} log={log} />)}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-section">
            <div className="requests-header">
              <h2>Permission Requests</h2>
              <div className="request-filters">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Pending</button>
                <button className="filter-btn">Approved</button>
                <button className="filter-btn">Rejected</button>
              </div>
            </div>

            <div className="requests-grid">
              {permissionRequests.map(request => <RequestCard key={request.id} request={request} />)}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="rbac-settings-section">
            <h2>RBAC Settings</h2>
            
            <div className="settings-form">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enableCustomRoles}
                    onChange={(e) => updateSettings({ enableCustomRoles: e.target.checked })}
                  />
                  Enable Custom Roles
                </label>
                <p className="form-help">Allow administrators to create custom permission sets</p>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enablePermissionExpiration}
                    onChange={(e) => updateSettings({ enablePermissionExpiration: e.target.checked })}
                  />
                  Enable Permission Expiration
                </label>
                <p className="form-help">Allow temporary role assignments with expiration dates</p>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireApprovalForRoleChanges}
                    onChange={(e) => updateSettings({ requireApprovalForRoleChanges: e.target.checked })}
                  />
                  Require Approval for Role Changes
                </label>
                <p className="form-help">Role changes require approval before taking effect</p>
              </div>

              <div className="form-group">
                <label>Default Role</label>
                <select
                  value={settings.defaultRole}
                  onChange={(e) => updateSettings({ defaultRole: e.target.value as Role })}
                >
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Maximum Custom Roles</label>
                <input
                  type="number"
                  value={settings.maxCustomRoles}
                  onChange={(e) => updateSettings({ maxCustomRoles: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Audit Log Retention (Days)</label>
                <input
                  type="number"
                  value={settings.auditLogRetentionDays}
                  onChange={(e) => updateSettings({ auditLogRetentionDays: parseInt(e.target.value) })}
                  min="7"
                  max="365"
                />
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={() => {}}>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RBACSettings;