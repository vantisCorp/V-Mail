import React, { useState, useMemo } from 'react';
import { useSharedFolders } from '../hooks/useSharedFolders';
import type {
  FolderPermission,
  ShareTargetType,
  SharedFolder,
  SharedFolderParticipant
} from '../types/sharedFolders';

interface SharedFoldersSettingsProps {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  onClose?: () => void;
}

type TabType = 'my-shares' | 'shared-with-me' | 'invitations' | 'activity';

const PermissionBadge: React.FC<{ permission: FolderPermission }> = ({ permission }) => {
  const colors = {
    read: 'bg-blue-500/20 text-blue-400',
    write: 'bg-yellow-500/20 text-yellow-400',
    admin: 'bg-red-500/20 text-red-400'
  };

  const labels = {
    read: 'Read Only',
    write: 'Read/Write',
    admin: 'Admin'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[permission]}`}>
      {labels[permission]}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-green-500/20 text-green-400',
    declined: 'bg-red-500/20 text-red-400',
    revoked: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
};

const PermissionSelect: React.FC<{
  value: FolderPermission;
  onChange: (permission: FolderPermission) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value as FolderPermission)}
    disabled={disabled}
    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 disabled:opacity-50"
  >
    <option value="read">Read Only</option>
    <option value="write">Read/Write</option>
    <option value="admin">Admin</option>
  </select>
);

const ShareDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onShare: (targetType: ShareTargetType, targetId: string, targetName: string, targetEmail: string, permission: FolderPermission, message?: string) => void;
  folderId: string;
}> = ({ isOpen, onClose, onShare }) => {
  const [targetType, setTargetType] = useState<ShareTargetType>('user');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [permission, setPermission] = useState<FolderPermission>('read');
  const [message, setMessage] = useState('');

  if (!isOpen) {
return null;
}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !targetName) {
return;
}
    onShare(targetType, targetId, targetName, targetEmail, permission, message || undefined);
    // Reset form
    setTargetId('');
    setTargetName('');
    setTargetEmail('');
    setPermission('read');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Share Folder</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Share with</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as ShareTargetType)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
              >
                <option value="user">User</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {targetType === 'user' ? 'User ID' : 'Team ID'}
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={targetType === 'user' ? 'Enter user ID' : 'Enter team ID'}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder={targetType === 'user' ? 'User name' : 'Team name'}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                required
              />
            </div>

            {targetType === 'user' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 placeholder-gray-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Permission</label>
              <PermissionSelect value={permission} onChange={setPermission} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message..."
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
              Share
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ParticipantRow: React.FC<{
  participant: SharedFolderParticipant;
  isOwner: boolean;
  onPermissionChange: (newPermission: FolderPermission) => void;
  onRemove: () => void;
  onRevoke: () => void;
}> = ({ participant, isOwner, onPermissionChange, onRemove, onRevoke }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
        {participant.targetName.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="text-gray-200 font-medium">{participant.targetName}</div>
        <div className="text-gray-500 text-xs">
          {participant.targetType === 'user' ? participant.targetEmail : 'Team'}
        </div>
      </div>
      <StatusBadge status={participant.status} />
    </div>

    <div className="flex items-center gap-2">
      {isOwner && participant.status === 'accepted' && (
        <PermissionSelect
          value={participant.permission}
          onChange={onPermissionChange}
        />
      )}
      {isOwner && (
        <button
          onClick={participant.status === 'revoked' ? onRemove : onRevoke}
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
          title={participant.status === 'revoked' ? 'Remove' : 'Revoke Access'}
        >
          {participant.status === 'revoked' ? '🗑️' : '🚫'}
        </button>
      )}
    </div>
  </div>
);

const FolderCard: React.FC<{
  folder: SharedFolder;
  isOwner: boolean;
  onShare: () => void;
  onUpdatePermission: (participantId: string, permission: FolderPermission) => void;
  onRevoke: (participantId: string) => void;
  onRemove: (participantId: string) => void;
}> = ({ folder, isOwner, onShare, onUpdatePermission, onRevoke, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg">
            📁
          </div>
          <div>
            <div className="text-gray-100 font-medium">{folder.folderName}</div>
            <div className="text-gray-500 text-sm">
              {folder.participants.length} participant{folder.participants.length !== 1 ? 's' : ''} •{' '}
              {folder.emailCount} emails
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Share
            </button>
          )}
          <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-700 p-4">
          <div className="text-sm text-gray-400 mb-3">Participants</div>
          <div className="space-y-2">
            {folder.participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isOwner={isOwner}
                onPermissionChange={(permission) => onUpdatePermission(participant.id, permission)}
                onRevoke={() => onRevoke(participant.id)}
                onRemove={() => onRemove(participant.id)}
              />
            ))}
            {folder.participants.length === 0 && (
              <div className="text-gray-500 text-sm py-2">No participants yet</div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              <div>Owner: {folder.ownerName}</div>
              <div>Created: {new Date(folder.createdAt).toLocaleDateString()}</div>
              {folder.lastActivityAt && (
                <div>Last activity: {new Date(folder.lastActivityAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SharedFoldersSettings: React.FC<SharedFoldersSettingsProps> = ({
  currentUserId,
  currentUserName,
  currentUserEmail,
  onClose
}) => {
  const {
    sharedFolders,
    activities,
    invitations,
    stats,
    shareFolder,
    unshareFolder,
    updatePermission,
    acceptInvitation,
    declineInvitation,
    revokeAccess,
    getFoldersOwnedByUser,
    getFoldersSharedWithUser
  } = useSharedFolders();

  const [activeTab, setActiveTab] = useState<TabType>('my-shares');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const myFolders = useMemo(() => getFoldersOwnedByUser(currentUserId), [getFoldersOwnedByUser, currentUserId]);
  const sharedWithMe = useMemo(() => getFoldersSharedWithUser(currentUserId), [getFoldersSharedWithUser, currentUserId]);

  const handleShare = (
    targetType: ShareTargetType,
    targetId: string,
    targetName: string,
    targetEmail: string,
    permission: FolderPermission,
    message?: string
  ) => {
    if (!selectedFolderId) {
return;
}

    shareFolder(
      {
        folderId: selectedFolderId,
        targetType,
        targetId,
        targetName,
        targetEmail,
        permission,
        message
      },
      currentUserId,
      currentUserName
    );
  };

  const handleUpdatePermission = (folderId: string, participantId: string, permission: FolderPermission) => {
    updatePermission(
      { folderId, participantId, newPermission: permission },
      currentUserId,
      currentUserName
    );
  };

  const handleRevoke = (folderId: string, participantId: string) => {
    revokeAccess(folderId, participantId, currentUserId, currentUserName);
  };

  const handleRemove = (folderId: string, participantId: string) => {
    unshareFolder(folderId, participantId, currentUserId, currentUserName);
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'my-shares', label: 'My Shared Folders', count: myFolders.length },
    { id: 'shared-with-me', label: 'Shared with Me', count: sharedWithMe.length },
    { id: 'invitations', label: 'Invitations', count: invitations.filter(i => i.status === 'pending').length },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <div className="shared-folders-settings">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-100">Shared Folders</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.totalSharedFolders}</div>
          <div className="text-sm text-gray-400">Shared Folders</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.totalParticipants}</div>
          <div className="text-sm text-gray-400">Participants</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.pendingInvitations}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-gray-100">{stats.activeShares}</div>
          <div className="text-sm text-gray-400">Active Shares</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                {tab.count}
              </span>
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
          placeholder="Search folders..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'my-shares' && (
          <>
            {myFolders
              .filter(f => f.folderName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  isOwner={true}
                  onShare={() => {
                    setSelectedFolderId(folder.folderId);
                    setShareDialogOpen(true);
                  }}
                  onUpdatePermission={(participantId, permission) =>
                    handleUpdatePermission(folder.folderId, participantId, permission)
                  }
                  onRevoke={(participantId) => handleRevoke(folder.folderId, participantId)}
                  onRemove={(participantId) => handleRemove(folder.folderId, participantId)}
                />
              ))}
            {myFolders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📁</div>
                <div>No shared folders yet</div>
                <div className="text-sm mt-1">Share a folder to get started</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'shared-with-me' && (
          <>
            {sharedWithMe
              .filter(f => f.folderName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  isOwner={false}
                  onShare={() => {}}
                  onUpdatePermission={() => {}}
                  onRevoke={() => {}}
                  onRemove={() => {}}
                />
              ))}
            {sharedWithMe.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📂</div>
                <div>No folders shared with you</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'invitations' && (
          <>
            {invitations
              .filter(i => i.status === 'pending')
              .map((invitation) => (
                <div key={invitation.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-100 font-medium">{invitation.folderName}</div>
                      <div className="text-sm text-gray-400">
                        From: {invitation.fromUserName} ({invitation.fromUserEmail})
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Permission: <PermissionBadge permission={invitation.permission} />
                      </div>
                      {invitation.message && (
                        <div className="text-sm text-gray-500 mt-2 italic">
                          "{invitation.message}"
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptInvitation(invitation.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineInvitation(invitation.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            {invitations.filter(i => i.status === 'pending').length === 0 && (
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
              <div key={activity.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center gap-3">
                <div className="text-gray-500 text-sm">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">{activity.performedByName}</span>
                  <span className="text-gray-500"> {activity.type.replace(/_/g, ' ')} </span>
                  {activity.targetName && (
                    <span className="text-blue-400">{activity.targetName}</span>
                  )}
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

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSelectedFolderId(null);
        }}
        onShare={handleShare}
        folderId={selectedFolderId || ''}
      />
    </div>
  );
};

export default SharedFoldersSettings;
