# Shared Folders Feature Documentation

## Overview

Shared Folders enable teams to collaborate on emails by sharing folders with specific permissions. This feature allows multiple team members to access, read, edit, and manage emails within shared folders while maintaining proper access controls.

---

## Features

### 1. Folder Management

#### Create Shared Folder
```typescript
const { createFolder } = useSharedFolders();

await createFolder({
  name: 'Project Communications',
  description: 'All project-related emails',
  isPublic: true,
  allowedUsers: ['user1', 'user2']
});
```

#### Update Folder
```typescript
await updateFolder(folderId, {
  name: 'Updated Folder Name',
  description: 'New description'
});
```

#### Delete Folder
```typescript
await deleteFolder(folderId);
```

### 2. Permission Management

#### Permission Levels

| Permission | Description | Capabilities |
|------------|-------------|--------------|
| **view_only** | Read-only access | Read emails, view folder contents |
| **can_edit** | Edit permissions | Read, move, delete emails |
| **can_manage** | Full management | All permissions + manage sharing and delete folder |

#### Assign Permissions
```typescript
const { assignPermissions } = useSharedFolders();

await assignPermissions({
  folderId: 'folder-123',
  userId: 'user-456',
  permission: 'can_edit'
});
```

### 3. Activity Tracking

All folder activities are automatically logged:
- Folder creation/modification/deletion
- Permission changes
- Email operations within shared folders
- Member additions/removals

```typescript
const { getFolderActivity } = useSharedFolders();

const activity = await getFolderActivity(folderId);
// Returns array of activity entries with timestamps and user info
```

---

## Usage Examples

### Example 1: Create a Team Folder
```typescript
import { useSharedFolders } from '../hooks/useSharedFolders';

function TeamFolderCreator() {
  const { createFolder, isLoading } = useSharedFolders();

  const handleCreate = async () => {
    await createFolder({
      name: 'Customer Support',
      description: 'Shared folder for customer support emails',
      isPublic: false,
      allowedUsers: ['agent1', 'agent2', 'supervisor'],
      ownerId: 'supervisor'
    });
  };

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      Create Team Folder
    </button>
  );
}
```

### Example 2: Share with Permissions
```typescript
function FolderSharer({ folderId, userId }) {
  const { assignPermissions, availablePermissions } = useSharedFolders();

  const handleShare = async (permission) => {
    await assignPermissions({
      folderId,
      userId,
      permission
    });
  };

  return (
    <div>
      <h3>Share Folder</h3>
      {availablePermissions.map(perm => (
        <button key={perm} onClick={() => handleShare(perm)}>
          {perm.replace('_', ' ').toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

### Example 3: View Folder Activity
```typescript
function FolderActivityLog({ folderId }) {
  const { getFolderActivity } = useSharedFolders();
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getFolderActivity(folderId).then(setActivity);
  }, [folderId]);

  return (
    <div>
      <h3>Activity Log</h3>
      {activity.map(entry => (
        <div key={entry.id}>
          <span>{entry.action}</span>
          <span>{entry.userName}</span>
          <span>{new Date(entry.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## API Reference

### Hook: `useSharedFolders`

Returns an object with the following properties:

#### State
- `isLoading: boolean` - Loading state
- `folders: Folder[]` - List of shared folders
- `activityLogs: ActivityLog[]` - Activity logs
- `error: Error | null` - Error state

#### Methods

**`createFolder(payload: CreateFolderPayload): Promise<Folder | null>`**
Creates a new shared folder.

**`updateFolder(folderId: string, payload: UpdateFolderPayload): Promise<Folder | null>`**
Updates an existing folder.

**`deleteFolder(folderId: string): Promise<boolean>`**
Deletes a folder.

**`assignPermissions(payload: AssignPermissionsPayload): Promise<boolean>`**
Assigns permissions to a user for a folder.

**`removePermissions(folderId: string, userId: string): Promise<boolean>`**
Removes permissions from a user.

**`getFolderActivity(folderId: string): Promise<ActivityLog[]>`**
Retrieves activity log for a folder.

**`getFoldersByOwner(userId: string): Folder[]`**
Gets all folders owned by a user.

**`getAccessibleFolders(userId: string): Folder[]`**
Gets all folders accessible to a user.

---

## Types

```typescript
enum FolderPermission {
  VIEW_ONLY = 'view_only',
  CAN_EDIT = 'can_edit',
  CAN_MANAGE = 'can_manage'
}

interface Folder {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FolderMember {
  folderId: string;
  userId: string;
  userName: string;
  permission: FolderPermission;
  assignedAt: string;
  assignedBy: string;
}

interface FolderActivity {
  id: string;
  folderId: string;
  folderName: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, any>;
}
```

---

## Best Practices

1. **Use descriptive folder names** - Make it easy for team members to understand folder purposes

2. **Set appropriate permissions** - Grant only the minimum necessary permissions to users

3. **Monitor activity logs** - Regularly review activity logs for security and compliance

4. **Use public folders for team-wide resources** - Mark folders as public when the entire team needs access

5. **Implement folder expiration** - Use expiration dates for temporary projects

---

## Troubleshooting

### Issue: Users cannot see shared folders
**Solution:** Verify that:
- The user is in the `allowedUsers` list
- The folder is not expired
- The user has appropriate permissions

### Issue: Cannot modify folder permissions
**Solution:** Ensure the current user has `can_manage` permission or is the folder owner

### Issue: Activity logs are empty
**Solution:** Check that activity tracking is enabled in folder settings

---

## Security Considerations

- Always verify user permissions before allowing folder access
- Log all permission changes for audit purposes
- Implement folder access validation on the server side
- Use secure user authentication
- Consider implementing folder encryption for sensitive data

---

## Support

For issues or questions related to Shared Folders:
1. Check the [main documentation](../RELEASE_v1.2.0.md)
2. Review the [API reference](#api-reference)
3. Contact the development team