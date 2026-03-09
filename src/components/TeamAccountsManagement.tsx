/**
 * TeamAccountsManagement Component for V-Mail v1.2.0
 *
 * Comprehensive team account management UI with tabs for:
 * - Overview (team info and stats)
 * - Members (member list and invitations)
 * - Settings (team settings)
 * - Billing (subscription and payment)
 * - Activity (activity log)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTeamAccounts } from '../hooks/useTeamAccounts';
import type {
  TeamMember,
  TeamMemberRole,
  TeamMemberStatus,
  TeamMemberFilter,
  TeamActivityFilter,
  InviteMemberPayload,
  UpdateMemberPayload
} from '../types/teamAccounts';
import '../styles/team-accounts.css';

type TabType = 'overview' | 'members' | 'settings' | 'billing' | 'activity';

// Role badge component
const RoleBadge: React.FC<{ role: TeamMemberRole }> = ({ role }) => {
  const roleColors: Record<TeamMemberRole, string> = {
    owner: 'role-owner',
    admin: 'role-admin',
    manager: 'role-manager',
    member: 'role-member',
    viewer: 'role-viewer'
  };

  return <span className={`role-badge ${roleColors[role]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
};

// Status badge component
const StatusBadge: React.FC<{ status: TeamMemberStatus }> = ({ status }) => {
  const statusColors: Record<TeamMemberStatus, string> = {
    active: 'status-active',
    pending: 'status-pending',
    suspended: 'status-suspended',
    removed: 'status-removed'
  };

  return (
    <span className={`status-badge ${statusColors[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  );
};

// Member card component
const MemberCard: React.FC<{
  member: TeamMember;
  onEdit: () => void;
  onRemove: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onChangeRole: (role: TeamMemberRole) => void;
}> = ({ member, onEdit, onRemove, onSuspend, onReactivate, onChangeRole }) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="member-card" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="member-avatar">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} />
        ) : (
          <div className="avatar-placeholder">{member.name.charAt(0).toUpperCase()}</div>
        )}
      </div>

      <div className="member-info">
        <div className="member-header">
          <h4 className="member-name">{member.name}</h4>
          <RoleBadge role={member.role} />
          <StatusBadge status={member.status} />
        </div>

        <p className="member-email">{member.email}</p>

        <div className="member-details">
          {member.department && (
            <span className="member-detail">
              <i className="icon-department"></i>
              {member.department}
            </span>
          )}
          {member.jobTitle && (
            <span className="member-detail">
              <i className="icon-title"></i>
              {member.jobTitle}
            </span>
          )}
        </div>

        <div className="member-meta">
          <span>Joined: {formatDate(member.joinedAt)}</span>
          <span>Last active: {formatDate(member.lastActiveAt)}</span>
        </div>
      </div>

      {showActions && member.role !== 'owner' && (
        <div className="member-actions">
          <button className="btn-icon" onClick={onEdit} title="Edit">
            ✏️
          </button>
          {member.status === 'active' ? (
            <button className="btn-icon" onClick={onSuspend} title="Suspend">
              ⏸️
            </button>
          ) : member.status === 'suspended' ? (
            <button className="btn-icon" onClick={onReactivate} title="Reactivate">
              ▶️
            </button>
          ) : null}
          <button className="btn-icon btn-danger" onClick={onRemove} title="Remove">
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

// Invite dialog component
const InviteDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInvite: (payload: InviteMemberPayload) => void;
}> = ({ isOpen, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('member');
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({
      email,
      role,
      message: message || undefined,
      department: department || undefined,
      jobTitle: jobTitle || undefined
    });
    setEmail('');
    setRole('member');
    setMessage('');
    setDepartment('');
    setJobTitle('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content invite-dialog">
        <div className="modal-header">
          <h3>Invite Team Member</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as TeamMemberRole)}>
              <option value="viewer">Viewer - Read-only access</option>
              <option value="member">Member - Standard access</option>
              <option value="manager">Manager - Can manage members</option>
              <option value="admin">Admin - Full team management</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Engineering"
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Developer"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Personal Message (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stats card component
const StatsCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: string }> = ({
  title,
  value,
  subtitle,
  icon
}) => (
  <div className="stats-card">
    <div className="stats-icon">{icon}</div>
    <div className="stats-content">
      <h4 className="stats-value">{value}</h4>
      <p className="stats-title">{title}</p>
      {subtitle && <span className="stats-subtitle">{subtitle}</span>}
    </div>
  </div>
);

// Activity item component
const ActivityItem: React.FC<{
  activity: {
    id: string;
    action: string;
    details: string;
    timestamp: Date;
  };
}> = ({ activity }) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const timestamp = new Date(date);
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    }
    return timestamp.toLocaleDateString();
  };

  const actionIcons: Record<string, string> = {
    member_invited: '📧',
    member_joined: '👋',
    member_removed: '🚪',
    member_role_changed: '🔄',
    settings_updated: '⚙️',
    folder_shared: '📁',
    email_delegated: '✉️',
    plan_upgraded: '⬆️',
    plan_downgraded: '⬇️'
  };

  return (
    <div className="activity-item">
      <div className="activity-icon">{actionIcons[activity.action] || '📋'}</div>
      <div className="activity-content">
        <p className="activity-details">{activity.details}</p>
        <span className="activity-timestamp">{formatTimestamp(activity.timestamp)}</span>
      </div>
    </div>
  );
};

export const TeamAccountsManagement: React.FC<{ teamId?: string }> = ({ teamId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [memberFilter, setMemberFilter] = useState<TeamMemberFilter>({});
  const [activityFilter, setActivityFilter] = useState<TeamActivityFilter>({
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const {
    teamAccount,
    members,
    activities,
    isLoading,
    error,
    inviteMember,
    removeMember,
    updateMember,
    changeMemberRole,
    suspendMember,
    reactivateMember,
    updateSettings,
    updatePlan,
    getFilteredMembers,
    getFilteredActivities,
    getStats
  } = useTeamAccounts(teamId);

  const filteredMembers = useMemo(() => getFilteredMembers(memberFilter), [getFilteredMembers, memberFilter]);
  const filteredActivities = useMemo(
    () => getFilteredActivities(activityFilter),
    [getFilteredActivities, activityFilter]
  );
  const stats = useMemo(() => getStats(teamId || ''), [getStats, teamId]);

  const handleInvite = useCallback(
    async (payload: InviteMemberPayload) => {
      await inviteMember(payload);
    },
    [inviteMember]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (confirm('Are you sure you want to remove this member?')) {
        await removeMember(memberId);
      }
    },
    [removeMember]
  );

  const handleSuspendMember = useCallback(
    async (memberId: string) => {
      if (confirm('Are you sure you want to suspend this member?')) {
        await suspendMember(memberId);
      }
    },
    [suspendMember]
  );

  const handleReactivateMember = useCallback(
    async (memberId: string) => {
      await reactivateMember(memberId);
    },
    [reactivateMember]
  );

  const handleChangeRole = useCallback(
    async (memberId: string, role: TeamMemberRole) => {
      if (confirm(`Are you sure you want to change this member's role to ${role}?`)) {
        await changeMemberRole(memberId, role);
      }
    },
    [changeMemberRole]
  );

  if (isLoading && !teamAccount) {
    return (
      <div className="team-accounts-loading">
        <div className="spinner"></div>
        <p>Loading team account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-accounts-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!teamAccount) {
    return (
      <div className="team-accounts-empty">
        <h3>No Team Account</h3>
        <p>You are not part of any team account.</p>
        <button className="btn-primary">Create Team Account</button>
      </div>
    );
  }

  return (
    <div className="team-accounts-management">
      {/* Header */}
      <div className="team-accounts-header">
        <div className="team-info">
          {teamAccount.logo && <img src={teamAccount.logo} alt={teamAccount.name} className="team-logo" />}
          <div className="team-details">
            <h2 className="team-name">{teamAccount.name}</h2>
            <p className="team-description">{teamAccount.description}</p>
            <div className="team-meta">
              <span className="team-industry">{teamAccount.industry}</span>
              <span className="team-size">{teamAccount.size} employees</span>
            </div>
          </div>
        </div>

        <div className="team-actions">
          <button className="btn-primary" onClick={() => setShowInviteDialog(true)}>
            + Invite Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="team-accounts-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="team-accounts-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel overview-panel">
            <h3>Team Statistics</h3>

            <div className="stats-grid">
              <StatsCard title="Total Members" value={stats?.totalMembers || 0} icon="👥" />
              <StatsCard title="Active Members" value={stats?.activeMembers || 0} icon="✅" />
              <StatsCard title="Pending Invitations" value={stats?.pendingInvitations || 0} icon="📧" />
              <StatsCard title="Emails This Month" value={stats?.emailsThisMonth?.toLocaleString() || 0} icon="✉️" />
              <StatsCard
                title="Storage Used"
                value={`${stats?.storageUsed || 0} GB`}
                subtitle={`of ${stats?.storageLimit || 0} GB`}
                icon="💾"
              />
              <StatsCard title="Shared Folders" value={stats?.sharedFolders || 0} icon="📁" />
            </div>

            <div className="overview-section">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                {filteredActivities.slice(0, 5).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="tab-panel members-panel">
            <div className="members-toolbar">
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberFilter.search || ''}
                  onChange={(e) => setMemberFilter((prev) => ({ ...prev, search: e.target.value }))}
                  className="search-input"
                />
              </div>

              <div className="filter-controls">
                <select
                  value={memberFilter.role?.[0] || ''}
                  onChange={(e) =>
                    setMemberFilter((prev) => ({
                      ...prev,
                      role: e.target.value ? [e.target.value as TeamMemberRole] : undefined
                    }))
                  }
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>

                <select
                  value={memberFilter.status?.[0] || ''}
                  onChange={(e) =>
                    setMemberFilter((prev) => ({
                      ...prev,
                      status: e.target.value ? [e.target.value as TeamMemberStatus] : undefined
                    }))
                  }
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="members-list">
              {filteredMembers.length === 0 ? (
                <div className="empty-state">
                  <p>No members found matching your criteria.</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={() => setEditingMember(member)}
                    onRemove={() => handleRemoveMember(member.id)}
                    onSuspend={() => handleSuspendMember(member.id)}
                    onReactivate={() => handleReactivateMember(member.id)}
                    onChangeRole={(role) => handleChangeRole(member.id, role)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-panel settings-panel">
            <h3>Team Settings</h3>

            <div className="settings-section">
              <h4>General Settings</h4>
              <div className="settings-group">
                <label className="setting-item">
                  <span>Allow member invites</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.allowMemberInvites}
                    onChange={(e) => updateSettings(teamAccount.id, { allowMemberInvites: e.target.checked })}
                  />
                </label>

                <label className="setting-item">
                  <span>Require approval for new members</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.requireApproval}
                    onChange={(e) => updateSettings(teamAccount.id, { requireApproval: e.target.checked })}
                  />
                </label>

                <label className="setting-item">
                  <span>Allow folder sharing</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.allowFolderSharing}
                    onChange={(e) => updateSettings(teamAccount.id, { allowFolderSharing: e.target.checked })}
                  />
                </label>

                <label className="setting-item">
                  <span>Allow email delegation</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.allowEmailDelegation}
                    onChange={(e) => updateSettings(teamAccount.id, { allowEmailDelegation: e.target.checked })}
                  />
                </label>

                <label className="setting-item">
                  <span>Enforce two-factor authentication</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.enforceTwoFactor}
                    onChange={(e) => updateSettings(teamAccount.id, { enforceTwoFactor: e.target.checked })}
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h4>Password Policy</h4>
              <div className="settings-group">
                <div className="setting-input">
                  <label>Minimum password length</label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={teamAccount.settings.passwordPolicy.minLength}
                    onChange={(e) =>
                      updateSettings(teamAccount.id, {
                        passwordPolicy: { ...teamAccount.settings.passwordPolicy, minLength: parseInt(e.target.value) }
                      })
                    }
                  />
                </div>

                <label className="setting-item">
                  <span>Require uppercase letters</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.passwordPolicy.requireUppercase}
                    onChange={(e) =>
                      updateSettings(teamAccount.id, {
                        passwordPolicy: { ...teamAccount.settings.passwordPolicy, requireUppercase: e.target.checked }
                      })
                    }
                  />
                </label>

                <label className="setting-item">
                  <span>Require lowercase letters</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.passwordPolicy.requireLowercase}
                    onChange={(e) =>
                      updateSettings(teamAccount.id, {
                        passwordPolicy: { ...teamAccount.settings.passwordPolicy, requireLowercase: e.target.checked }
                      })
                    }
                  />
                </label>

                <label className="setting-item">
                  <span>Require numbers</span>
                  <input
                    type="checkbox"
                    checked={teamAccount.settings.passwordPolicy.requireNumbers}
                    onChange={(e) =>
                      updateSettings(teamAccount.id, {
                        passwordPolicy: { ...teamAccount.settings.passwordPolicy, requireNumbers: e.target.checked }
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="tab-panel billing-panel">
            <h3>Subscription & Billing</h3>

            <div className="billing-overview">
              <div className="current-plan">
                <h4>Current Plan</h4>
                <div className="plan-card">
                  <div className="plan-header">
                    <span className="plan-name">
                      {teamAccount.billing.plan.charAt(0).toUpperCase() + teamAccount.billing.plan.slice(1)}
                    </span>
                    <span className="plan-status">{teamAccount.billing.status}</span>
                  </div>
                  <div className="plan-details">
                    <p className="plan-price">
                      ${teamAccount.billing.amount}
                      <span className="price-period">/month</span>
                    </p>
                    <p className="plan-members">
                      {teamAccount.billing.memberCount} / {teamAccount.billing.memberLimit} members
                    </p>
                    <p className="plan-storage">
                      {teamAccount.billing.storageUsed} GB / {teamAccount.billing.storageLimit} GB storage
                    </p>
                  </div>
                </div>
              </div>

              <div className="available-plans">
                <h4>Available Plans</h4>
                <div className="plans-grid">
                  {(['free', 'starter', 'professional', 'enterprise'] as const).map((plan) => (
                    <div
                      key={plan}
                      className={`plan-option ${teamAccount.billing.plan === plan ? 'current' : ''}`}
                      onClick={() => teamAccount.billing.plan !== plan && updatePlan(teamAccount.id, plan)}
                    >
                      <h5>{plan.charAt(0).toUpperCase() + plan.slice(1)}</h5>
                      <p className="plan-option-price">
                        ${plan === 'free' ? 0 : plan === 'starter' ? 29 : plan === 'professional' ? 99 : 299}/mo
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="billing-info">
              <h4>Payment Method</h4>
              <div className="payment-method">
                {teamAccount.billing.paymentMethod.type === 'card' && (
                  <div className="card-info">
                    <span className="card-brand">{teamAccount.billing.paymentMethod.brand?.toUpperCase()}</span>
                    <span className="card-number">**** **** **** {teamAccount.billing.paymentMethod.last4}</span>
                    <span className="card-expiry">
                      Expires {teamAccount.billing.paymentMethod.expiryMonth}/
                      {teamAccount.billing.paymentMethod.expiryYear}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="tab-panel activity-panel">
            <h3>Activity Log</h3>

            <div className="activity-filters">
              <input
                type="text"
                placeholder="Search activities..."
                value={activityFilter.search || ''}
                onChange={(e) => setActivityFilter((prev) => ({ ...prev, search: e.target.value }))}
                className="search-input"
              />
            </div>

            <div className="activity-timeline">
              {filteredActivities.length === 0 ? (
                <div className="empty-state">
                  <p>No activities found.</p>
                </div>
              ) : (
                filteredActivities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <InviteDialog isOpen={showInviteDialog} onClose={() => setShowInviteDialog(false)} onInvite={handleInvite} />
    </div>
  );
};

export default TeamAccountsManagement;
