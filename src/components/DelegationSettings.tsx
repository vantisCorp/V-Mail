import React, { useState, useMemo } from 'react';
import { useEmailDelegation } from '../hooks/useEmailDelegation';
import type { Delegation, DelegationPermission, DelegationStatus, DelegationInvitation } from '../types/delegation';

interface DelegationSettingsProps {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  onClose?: () => void;
}

type TabType = 'my-delegates' | 'my-access' | 'invitations' | 'activity';

const PermissionBadge: React.FC<{ permission: DelegationPermission }> = ({ permission }) => {
  const colors = {
    send_as: 'bg-purple-500/20 text-purple-400',
    send_on_behalf: 'bg-blue-500/20 text-blue-400',
    manage: 'bg-red-500/20 text-red-400'
  };

  const labels = {
    send_as: 'Send As',
    send_on_behalf: 'Send On Behalf',
    manage: 'Full Management'
  };

  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[permission]}`}>{labels[permission]}</span>;
};

const StatusBadge: React.FC<{ status: DelegationStatus }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-orange-500/20 text-orange-400',
    revoked: 'bg-red-500/20 text-red-400',
    expired: 'bg-gray-500/20 text-gray-400'
  };

  return <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${colors[status]}`}>{status}</span>;
};

const PermissionSelect: React.FC<{
  value: DelegationPermission;
  onChange: (permission: DelegationPermission) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value as DelegationPermission)}
    disabled={disabled}
    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 disabled:opacity-50"
  >
    <option value="send_as">Send As</option>
    <option value="send_on_behalf">Send On Behalf</option>
    <option value="manage">Full Management</option>
  </select>
);

const GrantDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGrant: (
    delegateEmail: string,
    delegateName: string,
    delegateId: string,
    permission: DelegationPermission,
    notes?: string
  ) => void;
}> = ({ isOpen, onClose, onGrant }) => {
  const [delegateEmail, setDelegateEmail] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [permission, setPermission] = useState<DelegationPermission>('send_on_behalf');
  const [notes, setNotes] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateEmail || !delegateName || !delegateId) {
      return;
    }
    onGrant(delegateEmail, delegateName, delegateId, permission, notes || undefined);
    // Reset form
    setDelegateEmail('');
    setDelegateName('');
    setDelegateId('');
    setPermission('send_on_behalf');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Grant Delegation Access</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Delegate Email</label>
              <input
                type="email"
                value={delegateEmail}
                onChange={(e) => setDelegateEmail(e.target.value)}
                placeholder="delegate@example.com"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Delegate Name</label>
              <input
                type="text"
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Delegate ID</label>
              <input
                type="text"
                value={delegateId}
                onChange={(e) => setDelegateId(e.target.value)}
                placeholder="user-id"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Permission Level</label>
              <PermissionSelect value={permission} onChange={setPermission} />
              <div className="mt-2 text-xs text-gray-500">
                <div>
                  <strong>Send As:</strong> Send emails appearing from your address
                </div>
                <div>
                  <strong>Send On Behalf:</strong> Send with "on behalf of" indicator
                </div>
                <div>
                  <strong>Full Management:</strong> Complete inbox management
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this delegation..."
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DelegationCard: React.FC<{
  delegation: Delegation;
  isOwner: boolean;
  onUpdatePermission: (permission: DelegationPermission) => void;
  onSuspend: () => void;
  onResume: () => void;
  onRevoke: () => void;
}> = ({ delegation, isOwner, onUpdatePermission, onSuspend, onResume, onRevoke }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
            {isOwner ? delegation.delegateName.charAt(0) : delegation.ownerName.charAt(0)}
          </div>
          <div>
            <div className="text-gray-100 font-medium">{isOwner ? delegation.delegateName : delegation.ownerName}</div>
            <div className="text-gray-500 text-sm">{isOwner ? delegation.delegateEmail : delegation.ownerEmail}</div>
          </div>
          <PermissionBadge permission={delegation.permission} />
          <StatusBadge status={delegation.status} />
        </div>

        <div className="flex items-center gap-2">
          {isOwner && delegation.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSuspend();
              }}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Suspend
            </button>
          )}
          {isOwner && delegation.status === 'suspended' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResume();
              }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Resume
            </button>
          )}
          {isOwner && (delegation.status === 'active' || delegation.status === 'suspended') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevoke();
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Revoke
            </button>
          )}
          <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-700 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Permission</div>
              {isOwner ? (
                <PermissionSelect
                  value={delegation.permission}
                  onChange={onUpdatePermission}
                  disabled={delegation.status !== 'active'}
                />
              ) : (
                <PermissionBadge permission={delegation.permission} />
              )}
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <StatusBadge status={delegation.status} />
            </div>
          </div>

          {delegation.notes && (
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Notes</div>
              <div className="text-gray-300 text-sm">{delegation.notes}</div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <div>Granted: {new Date(delegation.grantedAt).toLocaleDateString()}</div>
            {delegation.acceptedAt && <div>Accepted: {new Date(delegation.acceptedAt).toLocaleDateString()}</div>}
            {delegation.expiresAt && <div>Expires: {new Date(delegation.expiresAt).toLocaleDateString()}</div>}
          </div>

          {delegation.allowedActions && delegation.allowedActions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Allowed Actions</div>
              <div className="flex flex-wrap gap-2">
                {delegation.allowedActions.map((action, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                    {action.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InvitationCard: React.FC<{
  invitation: DelegationInvitation;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ invitation, onAccept, onDecline }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-lg font-medium">
          {invitation.ownerName.charAt(0)}
        </div>
        <div>
          <div className="text-gray-100 font-medium">{invitation.ownerName}</div>
          <div className="text-sm text-gray-400">{invitation.ownerEmail}</div>
          <div className="mt-1">
            <PermissionBadge permission={invitation.permission} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          Decline
        </button>
      </div>
    </div>

    {invitation.message && (
      <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400 italic">"{invitation.message}"</div>
    )}
  </div>
);

export const DelegationSettings: React.FC<DelegationSettingsProps> = ({
  currentUserId,
  currentUserName,
  currentUserEmail,
  onClose
}) => {
  const {
    delegations: _delegations,
    activities,
    invitations: _invitations,
    stats,
    grantDelegation,
    acceptDelegation,
    revokeDelegation,
    suspendDelegation,
    resumeDelegation,
    updateDelegation,
    declineDelegation,
    getDelegationsOwned,
    getDelegationsAsDelegate,
    getPendingInvitations
  } = useEmailDelegation();
  void _delegations;
  void _invitations;

  const [activeTab, setActiveTab] = useState<TabType>('my-delegates');
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const myDelegates = useMemo(() => getDelegationsOwned(currentUserId), [getDelegationsOwned, currentUserId]);
  const myAccess = useMemo(() => getDelegationsAsDelegate(currentUserId), [getDelegationsAsDelegate, currentUserId]);
  const myInvitations = useMemo(
    () => getPendingInvitations(currentUserEmail),
    [getPendingInvitations, currentUserEmail]
  );

  const handleGrant = (
    delegateEmail: string,
    delegateName: string,
    delegateId: string,
    permission: DelegationPermission,
    notes?: string
  ) => {
    grantDelegation(
      { delegateEmail, delegateName, delegateId, permission, notes },
      currentUserId,
      currentUserName,
      currentUserEmail
    );
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'my-delegates', label: 'My Delegates', count: myDelegates.filter((d) => d.status === 'active').length },
    { id: 'my-access', label: 'My Access', count: myAccess.filter((d) => d.status === 'active').length },
    { id: 'invitations', label: 'Invitations', count: myInvitations.length },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <div className="delegation-settings">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-100">Email Delegation</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGrantDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            + Grant Access
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.activeDelegations}</div>
          <div className="text-sm text-gray-400">Active Delegations</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.pendingDelegations}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.sentAsCount}</div>
          <div className="text-sm text-gray-400">Send As</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.manageCount}</div>
          <div className="text-sm text-gray-400">Full Management</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search delegations..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'my-delegates' && (
          <>
            {myDelegates
              .filter(
                (d) =>
                  d.delegateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.delegateEmail.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((delegation) => (
                <DelegationCard
                  key={delegation.id}
                  delegation={delegation}
                  isOwner={true}
                  onUpdatePermission={(permission) =>
                    updateDelegation({ delegationId: delegation.id, permission }, currentUserId, currentUserName)
                  }
                  onSuspend={() => suspendDelegation(delegation.id, currentUserId, currentUserName)}
                  onResume={() => resumeDelegation(delegation.id, currentUserId, currentUserName)}
                  onRevoke={() => revokeDelegation(delegation.id, currentUserId, currentUserName)}
                />
              ))}
            {myDelegates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <div>No delegates yet</div>
                <div className="text-sm mt-1">Grant access to let others manage your emails</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'my-access' && (
          <>
            {myAccess
              .filter(
                (d) =>
                  d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((delegation) => (
                <DelegationCard
                  key={delegation.id}
                  delegation={delegation}
                  isOwner={false}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onUpdatePermission={() => {}}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onSuspend={() => {}}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onResume={() => {}}
                  // eslint-disable-next-line @typescript-eslint/no-empty-function
                  onRevoke={() => {}}
                />
              ))}
            {myAccess.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔐</div>
                <div>No delegation access</div>
                <div className="text-sm mt-1">You don't have access to manage anyone's emails</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'invitations' && (
          <>
            {myInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={() => acceptDelegation(invitation.id, currentUserId, currentUserName)}
                onDecline={() => declineDelegation(invitation.id)}
              />
            ))}
            {myInvitations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✉️</div>
                <div>No pending invitations</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <>
            {activities.slice(0, 20).map((activity) => (
              <div
                key={activity.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center gap-3"
              >
                <div className="text-gray-500 text-sm">{new Date(activity.timestamp).toLocaleString()}</div>
                <div className="text-gray-300">
                  <span className="font-medium">{activity.performedByName}</span>
                  <span className="text-gray-500"> {activity.type.replace(/_/g, ' ')} </span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <div>No recent activity</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Grant Dialog */}
      <GrantDialog isOpen={grantDialogOpen} onClose={() => setGrantDialogOpen(false)} onGrant={handleGrant} />
    </div>
  );
};

export default DelegationSettings;
