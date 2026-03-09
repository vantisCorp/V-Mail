import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContacts } from '../../src/hooks/useContacts';
import { contactsService } from '../../src/services/contactsService';
import {
  Contact,
  ContactGroup,
  ContactAccount,
  ContactProvider,
  ContactStatistics,
  ContactPreferences,
  ContactSearchResult,
  ContactMergeSuggestion
} from '../../src/types/contacts';

// Mock the contactsService module
vi.mock('../../src/services/contactsService', () => ({
  contactsService: {
    getAccounts: vi.fn(),
    getContacts: vi.fn(),
    getGroups: vi.fn(),
    getPreferences: vi.fn(),
    getStatistics: vi.fn(),
    getContact: vi.fn(),
    getContactByEmail: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    searchContacts: vi.fn(),
    createContactFromEmail: vi.fn(),
    findDuplicateContacts: vi.fn(),
    mergeContacts: vi.fn(),
    getGroup: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    addContactToGroup: vi.fn(),
    removeContactFromGroup: vi.fn(),
    syncContacts: vi.fn(),
    updatePreferences: vi.fn()
  }
}));

// --- Test fixtures ---

const mockContact1: Contact = {
  id: 'c1',
  provider: ContactProvider.LOCAL,
  providerContactId: 'pc1',
  firstName: 'Alice',
  lastName: 'Smith',
  displayName: 'Alice Smith',
  emails: [{ id: 'e1', address: 'alice@example.com', isPrimary: true }],
  phones: [{ id: 'p1', number: '+1234567890', isPrimary: true }],
  addresses: [],
  websites: [],
  socials: [],
  customFields: [],
  groupIds: ['g1'],
  tags: ['work'],
  starred: false,
  favorite: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const mockContact2: Contact = {
  id: 'c2',
  provider: ContactProvider.GOOGLE,
  providerContactId: 'pc2',
  firstName: 'Bob',
  lastName: 'Jones',
  displayName: 'Bob Jones',
  emails: [{ id: 'e2', address: 'bob@example.com', isPrimary: true }],
  phones: [],
  addresses: [],
  websites: [],
  socials: [],
  customFields: [],
  groupIds: [],
  tags: ['personal'],
  starred: true,
  favorite: false,
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-10T00:00:00Z'
};

const mockGroup1: ContactGroup = {
  id: 'g1',
  name: 'Work',
  description: 'Work contacts',
  color: '#0000ff',
  contactIds: ['c1'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockAccount: ContactAccount = {
  id: 'a1',
  provider: ContactProvider.GOOGLE,
  userId: 'u1',
  email: 'user@gmail.com',
  displayName: 'Test User',
  accessToken: 'token123',
  expiresAt: '2025-01-01T00:00:00Z',
  scopes: ['contacts.read', 'contacts.write'],
  isActive: true,
  isPrimary: true,
  syncEnabled: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockStatistics: ContactStatistics = {
  totalContacts: 2,
  activeContacts: 2,
  starredContacts: 1,
  favoriteContacts: 0,
  contactsByGroup: { g1: 1 },
  contactsByTag: { work: 1, personal: 1 },
  contactsByProvider: {
    [ContactProvider.LOCAL]: 1,
    [ContactProvider.GOOGLE]: 1,
    [ContactProvider.OUTLOOK]: 0,
    [ContactProvider.ICLOUD]: 0
  },
  averageEmailsPerContact: 5,
  mostContactedContacts: [{ contactId: 'c1', emailCount: 10 }],
  recentlyAddedContacts: 1,
  recentlyUpdatedContacts: 1,
  duplicateContacts: 0
};

const mockPreferences: ContactPreferences = {
  defaultView: 'list',
  sortOptions: { field: 'displayName', order: 'asc' },
  displayFields: ['displayName', 'email', 'phone'],
  showAvatar: true,
  showEmail: true,
  showPhone: true,
  showCompany: true,
  showGroups: true,
  showTags: true,
  enableAutoMerge: false,
  mergeThreshold: 0.8,
  duplicateCheckEnabled: true,
  emailTrackingEnabled: true
};

// --- Helper to set up default mocks ---

function setupDefaultMocks() {
  vi.mocked(contactsService.getAccounts).mockReturnValue([mockAccount]);
  vi.mocked(contactsService.getContacts).mockReturnValue([mockContact1, mockContact2]);
  vi.mocked(contactsService.getGroups).mockReturnValue([mockGroup1]);
  vi.mocked(contactsService.getPreferences).mockReturnValue(mockPreferences);
  vi.mocked(contactsService.getStatistics).mockResolvedValue(mockStatistics);
}

// --- Tests ---

describe('useContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // =============================================
  // Initial loading & state
  // =============================================
  describe('initial loading', () => {
    it('should load contacts, accounts, groups, preferences and statistics on mount', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(contactsService.getAccounts).toHaveBeenCalled();
      expect(contactsService.getContacts).toHaveBeenCalled();
      expect(contactsService.getGroups).toHaveBeenCalled();
      expect(contactsService.getPreferences).toHaveBeenCalled();
      expect(contactsService.getStatistics).toHaveBeenCalled();

      expect(result.current.accounts).toEqual([mockAccount]);
      expect(result.current.contacts).toEqual([mockContact1, mockContact2]);
      expect(result.current.groups).toEqual([mockGroup1]);
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.statistics).toEqual(mockStatistics);
      expect(result.current.error).toBeNull();
    });

    it('should set error when loading fails', async () => {
      vi.mocked(contactsService.getAccounts).mockImplementation(() => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error thrown during loading', async () => {
      vi.mocked(contactsService.getAccounts).mockImplementation(() => {
        throw 'string error';
      });

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load contacts');
    });

    it('should have default preferences before loading completes', () => {
      // Make getStatistics hang so loading never finishes
      vi.mocked(contactsService.getStatistics).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useContacts());

      // Default preferences should be set from useState initializer
      expect(result.current.preferences.defaultView).toBe('list');
      expect(result.current.preferences.showAvatar).toBe(true);
    });
  });

  // =============================================
  // refreshContacts
  // =============================================
  describe('refreshContacts', () => {
    it('should reload all data when called', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear call counts
      vi.clearAllMocks();
      setupDefaultMocks();

      await act(async () => {
        await result.current.refreshContacts();
      });

      expect(contactsService.getAccounts).toHaveBeenCalled();
      expect(contactsService.getContacts).toHaveBeenCalled();
      expect(contactsService.getGroups).toHaveBeenCalled();
      expect(contactsService.getPreferences).toHaveBeenCalled();
      expect(contactsService.getStatistics).toHaveBeenCalled();
    });
  });

  // =============================================
  // getContact / getContactByEmail
  // =============================================
  describe('getContact', () => {
    it('should delegate to contactsService.getContact', async () => {
      vi.mocked(contactsService.getContact).mockReturnValue(mockContact1);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contact = result.current.getContact('c1');
      expect(contactsService.getContact).toHaveBeenCalledWith('c1');
      expect(contact).toEqual(mockContact1);
    });

    it('should return undefined for non-existent contact', async () => {
      vi.mocked(contactsService.getContact).mockReturnValue(undefined);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contact = result.current.getContact('nonexistent');
      expect(contact).toBeUndefined();
    });
  });

  describe('getContactByEmail', () => {
    it('should delegate to contactsService.getContactByEmail', async () => {
      vi.mocked(contactsService.getContactByEmail).mockReturnValue(mockContact1);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const contact = result.current.getContactByEmail('alice@example.com');
      expect(contactsService.getContactByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(contact).toEqual(mockContact1);
    });
  });

  // =============================================
  // createContact
  // =============================================
  describe('createContact', () => {
    it('should create a contact and update state', async () => {
      const newContact: Contact = {
        ...mockContact1,
        id: 'c3',
        displayName: 'Charlie Brown'
      };
      vi.mocked(contactsService.createContact).mockResolvedValue(newContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created: Contact | undefined;
      await act(async () => {
        created = await result.current.createContact({
          displayName: 'Charlie Brown',
          firstName: 'Charlie',
          lastName: 'Brown'
        });
      });

      expect(created).toEqual(newContact);
      expect(result.current.contacts).toContainEqual(newContact);
      // Statistics should be refreshed
      expect(contactsService.getStatistics).toHaveBeenCalled();
    });

    it('should set error and re-throw when creation fails', async () => {
      vi.mocked(contactsService.createContact).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createContact({ displayName: 'Fail' });
        })
      ).rejects.toThrow('Create failed');

      expect(result.current.error).toBe('Failed to create contact');
      expect(result.current.loading).toBe(false);
    });

    it('should handle non-Error thrown during creation', async () => {
      vi.mocked(contactsService.createContact).mockRejectedValue('string error');

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createContact({ displayName: 'Fail' });
        })
      ).rejects.toBe('string error');

      expect(result.current.error).toBe('Failed to create contact');
    });
  });

  // =============================================
  // updateContact
  // =============================================
  describe('updateContact', () => {
    it('should update a contact and replace it in state', async () => {
      const updatedContact: Contact = {
        ...mockContact1,
        displayName: 'Alice Updated'
      };
      vi.mocked(contactsService.updateContact).mockResolvedValue(updatedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updated: Contact | undefined;
      await act(async () => {
        updated = await result.current.updateContact({
          id: 'c1',
          displayName: 'Alice Updated'
        });
      });

      expect(updated).toEqual(updatedContact);
      const found = result.current.contacts.find((c) => c.id === 'c1');
      expect(found?.displayName).toBe('Alice Updated');
    });

    it('should set error and re-throw when update fails', async () => {
      vi.mocked(contactsService.updateContact).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateContact({ id: 'c1', displayName: 'Fail' });
        })
      ).rejects.toThrow('Update failed');

      expect(result.current.error).toBe('Failed to update contact');
      expect(result.current.loading).toBe(false);
    });
  });

  // =============================================
  // deleteContact
  // =============================================
  describe('deleteContact', () => {
    it('should delete a contact and remove it from state', async () => {
      vi.mocked(contactsService.deleteContact).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.contacts).toHaveLength(2);

      await act(async () => {
        await result.current.deleteContact('c1');
      });

      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts.find((c) => c.id === 'c1')).toBeUndefined();
    });

    it('should set error and re-throw when delete fails', async () => {
      vi.mocked(contactsService.deleteContact).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteContact('c1');
        })
      ).rejects.toThrow('Delete failed');

      expect(result.current.error).toBe('Failed to delete contact');
      expect(result.current.loading).toBe(false);
    });
  });

  // =============================================
  // searchContacts
  // =============================================
  describe('searchContacts', () => {
    it('should delegate to contactsService.searchContacts', async () => {
      const mockResults: ContactSearchResult[] = [
        { contact: mockContact1, relevanceScore: 0.95, matchedFields: ['displayName'] }
      ];
      vi.mocked(contactsService.searchContacts).mockReturnValue(mockResults);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const results = result.current.searchContacts('Alice');
      expect(contactsService.searchContacts).toHaveBeenCalledWith('Alice');
      expect(results).toEqual(mockResults);
    });
  });

  // =============================================
  // createContactFromEmail
  // =============================================
  describe('createContactFromEmail', () => {
    const mockEmailOptions = {
      extractFromSender: true,
      extractFromRecipients: false,
      extractFromCc: false,
      extractFromBcc: false,
      extractFromSignature: false,
      extractFromBody: false,
      extractFromReplyTo: false,
      autoDetectFields: true,
      createGroups: false,
      mergeWithExisting: false,
      mergeStrategy: 'merge' as const
    };

    it('should create a new contact from email and add to state', async () => {
      const newContact: Contact = {
        ...mockContact1,
        id: 'c4',
        displayName: 'From Email'
      };
      vi.mocked(contactsService.createContactFromEmail).mockResolvedValue(newContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.contacts.length;

      await act(async () => {
        await result.current.createContactFromEmail({ from: 'test@example.com', subject: 'Hello' }, mockEmailOptions);
      });

      expect(result.current.contacts).toHaveLength(initialCount + 1);
      expect(result.current.contacts).toContainEqual(newContact);
    });

    it('should update existing contact if ID matches', async () => {
      // Return a contact with an existing ID (c1)
      const updatedContact: Contact = {
        ...mockContact1,
        displayName: 'Alice Updated From Email'
      };
      vi.mocked(contactsService.createContactFromEmail).mockResolvedValue(updatedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.contacts.length;

      await act(async () => {
        await result.current.createContactFromEmail({ from: 'alice@example.com' }, mockEmailOptions);
      });

      // Should not add a new entry, just update existing
      expect(result.current.contacts).toHaveLength(initialCount);
      const found = result.current.contacts.find((c) => c.id === 'c1');
      expect(found?.displayName).toBe('Alice Updated From Email');
    });

    it('should set error and re-throw when creation from email fails', async () => {
      vi.mocked(contactsService.createContactFromEmail).mockRejectedValue(new Error('Email parse failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createContactFromEmail({}, mockEmailOptions);
        })
      ).rejects.toThrow('Email parse failed');

      expect(result.current.error).toBe('Failed to create contact from email');
    });
  });

  // =============================================
  // getFilteredContacts
  // =============================================
  describe('getFilteredContacts', () => {
    it('should delegate to contactsService.getContacts with filters and sort', async () => {
      vi.mocked(contactsService.getContacts).mockReturnValue([mockContact1]);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filters = { starred: true };
      const sort = { field: 'displayName' as const, order: 'asc' as const };

      const filtered = result.current.getFilteredContacts(filters, sort);
      expect(contactsService.getContacts).toHaveBeenCalledWith(filters, sort);
      expect(filtered).toEqual([mockContact1]);
    });

    it('should work without arguments', async () => {
      vi.mocked(contactsService.getContacts).mockReturnValue([mockContact1, mockContact2]);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const all = result.current.getFilteredContacts();
      expect(contactsService.getContacts).toHaveBeenCalledWith(undefined, undefined);
      expect(all).toHaveLength(2);
    });
  });

  // =============================================
  // findDuplicateContacts
  // =============================================
  describe('findDuplicateContacts', () => {
    it('should return merge suggestions', async () => {
      const suggestions: ContactMergeSuggestion[] = [
        {
          primaryContact: mockContact1,
          duplicateContacts: [mockContact2],
          matchScore: 0.85,
          matchedFields: ['email'],
          suggestedMerge: { displayName: 'Alice Smith' }
        }
      ];
      vi.mocked(contactsService.findDuplicateContacts).mockResolvedValue(suggestions);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let duplicates: ContactMergeSuggestion[] = [];
      await act(async () => {
        duplicates = await result.current.findDuplicateContacts();
      });

      expect(duplicates).toEqual(suggestions);
      expect(result.current.loading).toBe(false);
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.findDuplicateContacts).mockRejectedValue(new Error('Duplicate check failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.findDuplicateContacts();
        })
      ).rejects.toThrow('Duplicate check failed');

      expect(result.current.error).toBe('Failed to find duplicate contacts');
    });
  });

  // =============================================
  // mergeContacts
  // =============================================
  describe('mergeContacts', () => {
    it('should merge contacts, update primary, and remove duplicates from state', async () => {
      const mergedContact: Contact = {
        ...mockContact1,
        displayName: 'Alice Smith (Merged)',
        emails: [...mockContact1.emails, ...mockContact2.emails]
      };
      vi.mocked(contactsService.mergeContacts).mockResolvedValue(mergedContact);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.contacts).toHaveLength(2);

      let merged: Contact | undefined;
      await act(async () => {
        merged = await result.current.mergeContacts('c1', ['c2']);
      });

      expect(merged).toEqual(mergedContact);
      // c2 should be removed, c1 should be updated
      expect(result.current.contacts).toHaveLength(1);
      expect(result.current.contacts[0].displayName).toBe('Alice Smith (Merged)');
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.mergeContacts).mockRejectedValue(new Error('Merge failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.mergeContacts('c1', ['c2']);
        })
      ).rejects.toThrow('Merge failed');

      expect(result.current.error).toBe('Failed to merge contacts');
    });
  });

  // =============================================
  // Group operations
  // =============================================
  describe('getGroup', () => {
    it('should delegate to contactsService.getGroup', async () => {
      vi.mocked(contactsService.getGroup).mockReturnValue(mockGroup1);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = result.current.getGroup('g1');
      expect(contactsService.getGroup).toHaveBeenCalledWith('g1');
      expect(group).toEqual(mockGroup1);
    });
  });

  describe('createGroup', () => {
    it('should create a group and add it to state', async () => {
      const newGroup: ContactGroup = {
        id: 'g2',
        name: 'Friends',
        description: 'Friend contacts',
        color: '#00ff00',
        contactIds: [],
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z'
      };
      vi.mocked(contactsService.createGroup).mockResolvedValue(newGroup);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created: ContactGroup | undefined;
      await act(async () => {
        created = await result.current.createGroup('Friends', 'Friend contacts', '#00ff00');
      });

      expect(created).toEqual(newGroup);
      expect(result.current.groups).toContainEqual(newGroup);
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.createGroup).mockRejectedValue(new Error('Group create failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createGroup('Fail');
        })
      ).rejects.toThrow('Group create failed');

      expect(result.current.error).toBe('Failed to create group');
    });
  });

  describe('updateGroup', () => {
    it('should update a group and replace it in state', async () => {
      const updatedGroup: ContactGroup = {
        ...mockGroup1,
        name: 'Work Updated'
      };
      vi.mocked(contactsService.updateGroup).mockResolvedValue(updatedGroup);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updated: ContactGroup | undefined;
      await act(async () => {
        updated = await result.current.updateGroup('g1', { name: 'Work Updated' });
      });

      expect(updated).toEqual(updatedGroup);
      const found = result.current.groups.find((g) => g.id === 'g1');
      expect(found?.name).toBe('Work Updated');
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.updateGroup).mockRejectedValue(new Error('Group update failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateGroup('g1', { name: 'Fail' });
        })
      ).rejects.toThrow('Group update failed');

      expect(result.current.error).toBe('Failed to update group');
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group, remove from state, and reload contacts', async () => {
      vi.mocked(contactsService.deleteGroup).mockResolvedValue(undefined);
      // After group deletion, contacts are reloaded
      vi.mocked(contactsService.getContacts).mockReturnValue([mockContact1, mockContact2]);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groups).toHaveLength(1);

      await act(async () => {
        await result.current.deleteGroup('g1');
      });

      expect(result.current.groups).toHaveLength(0);
      // Contacts should be reloaded
      expect(contactsService.getContacts).toHaveBeenCalled();
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.deleteGroup).mockRejectedValue(new Error('Group delete failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteGroup('g1');
        })
      ).rejects.toThrow('Group delete failed');

      expect(result.current.error).toBe('Failed to delete group');
    });
  });

  // =============================================
  // addContactToGroup / removeContactFromGroup
  // =============================================
  describe('addContactToGroup', () => {
    it('should add contact to group and reload contacts and groups', async () => {
      vi.mocked(contactsService.addContactToGroup).mockResolvedValue(undefined);
      const updatedGroups = [{ ...mockGroup1, contactIds: ['c1', 'c2'] }];
      vi.mocked(contactsService.getGroups).mockReturnValue(updatedGroups);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addContactToGroup('c2', 'g1');
      });

      expect(contactsService.addContactToGroup).toHaveBeenCalledWith('c2', 'g1');
      expect(contactsService.getContacts).toHaveBeenCalled();
      expect(contactsService.getGroups).toHaveBeenCalled();
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.addContactToGroup).mockRejectedValue(new Error('Add to group failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addContactToGroup('c2', 'g1');
        })
      ).rejects.toThrow('Add to group failed');

      expect(result.current.error).toBe('Failed to add contact to group');
    });
  });

  describe('removeContactFromGroup', () => {
    it('should remove contact from group and reload contacts and groups', async () => {
      vi.mocked(contactsService.removeContactFromGroup).mockResolvedValue(undefined);
      const updatedGroups = [{ ...mockGroup1, contactIds: [] as string[] }];
      vi.mocked(contactsService.getGroups).mockReturnValue(updatedGroups);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeContactFromGroup('c1', 'g1');
      });

      expect(contactsService.removeContactFromGroup).toHaveBeenCalledWith('c1', 'g1');
      expect(contactsService.getContacts).toHaveBeenCalled();
      expect(contactsService.getGroups).toHaveBeenCalled();
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.removeContactFromGroup).mockRejectedValue(new Error('Remove from group failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.removeContactFromGroup('c1', 'g1');
        })
      ).rejects.toThrow('Remove from group failed');

      expect(result.current.error).toBe('Failed to remove contact from group');
    });
  });

  // =============================================
  // syncContacts
  // =============================================
  describe('syncContacts', () => {
    it('should sync contacts and refresh data', async () => {
      vi.mocked(contactsService.syncContacts).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();
      setupDefaultMocks();
      vi.mocked(contactsService.syncContacts).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.syncContacts('a1');
      });

      expect(contactsService.syncContacts).toHaveBeenCalledWith('a1');
      // refreshContacts should have been called, which calls all getters
      expect(contactsService.getAccounts).toHaveBeenCalled();
      expect(contactsService.getContacts).toHaveBeenCalled();
    });

    it('should work without accountId', async () => {
      vi.mocked(contactsService.syncContacts).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();
      setupDefaultMocks();
      vi.mocked(contactsService.syncContacts).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.syncContacts();
      });

      expect(contactsService.syncContacts).toHaveBeenCalledWith(undefined);
    });

    it('should set error and re-throw on failure', async () => {
      vi.mocked(contactsService.syncContacts).mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.syncContacts('a1');
        })
      ).rejects.toThrow('Sync failed');

      expect(result.current.error).toBe('Failed to sync contacts');
    });
  });

  // =============================================
  // updatePreferences
  // =============================================
  describe('updatePreferences', () => {
    it('should update preferences in service and local state', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updatePreferences({ defaultView: 'grid', showAvatar: false });
      });

      expect(contactsService.updatePreferences).toHaveBeenCalledWith({
        defaultView: 'grid',
        showAvatar: false
      });
      expect(result.current.preferences.defaultView).toBe('grid');
      expect(result.current.preferences.showAvatar).toBe(false);
      // Other preferences should remain unchanged
      expect(result.current.preferences.showEmail).toBe(true);
    });

    it('should merge partial updates with existing preferences', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updatePreferences({ mergeThreshold: 0.5 });
      });

      expect(result.current.preferences.mergeThreshold).toBe(0.5);
      expect(result.current.preferences.defaultView).toBe('list'); // unchanged
    });
  });

  // =============================================
  // Loading state management
  // =============================================
  describe('loading state', () => {
    it('should set loading to true during async operations and false after', async () => {
      let resolveCreate: (value: Contact) => void;
      vi.mocked(contactsService.createContact).mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
      );

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start create - should set loading
      let createPromise: Promise<Contact>;
      act(() => {
        createPromise = result.current.createContact({ displayName: 'Test' });
      });

      expect(result.current.loading).toBe(true);

      // Resolve - should clear loading
      await act(async () => {
        resolveCreate!({ ...mockContact1, id: 'c99', displayName: 'Test' });
        await createPromise!;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  // =============================================
  // Error clearing
  // =============================================
  describe('error clearing', () => {
    it('should clear error when starting a new operation', async () => {
      // First, cause an error
      vi.mocked(contactsService.createContact).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.createContact({ displayName: 'Fail' });
        })
      ).rejects.toThrow();

      expect(result.current.error).toBe('Failed to create contact');

      // Now do a successful operation - error should be cleared
      vi.mocked(contactsService.deleteContact).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.deleteContact('c1');
      });

      expect(result.current.error).toBeNull();
    });
  });

  // =============================================
  // Return value shape
  // =============================================
  describe('return value', () => {
    it('should return all expected properties and methods', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data properties
      expect(result.current).toHaveProperty('accounts');
      expect(result.current).toHaveProperty('contacts');
      expect(result.current).toHaveProperty('groups');
      expect(result.current).toHaveProperty('statistics');
      expect(result.current).toHaveProperty('preferences');
      expect(result.current).toHaveProperty('syncStatus');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');

      // Methods
      expect(typeof result.current.refreshContacts).toBe('function');
      expect(typeof result.current.getContact).toBe('function');
      expect(typeof result.current.getContactByEmail).toBe('function');
      expect(typeof result.current.createContact).toBe('function');
      expect(typeof result.current.updateContact).toBe('function');
      expect(typeof result.current.deleteContact).toBe('function');
      expect(typeof result.current.searchContacts).toBe('function');
      expect(typeof result.current.createContactFromEmail).toBe('function');
      expect(typeof result.current.getFilteredContacts).toBe('function');
      expect(typeof result.current.findDuplicateContacts).toBe('function');
      expect(typeof result.current.mergeContacts).toBe('function');
      expect(typeof result.current.getGroup).toBe('function');
      expect(typeof result.current.createGroup).toBe('function');
      expect(typeof result.current.updateGroup).toBe('function');
      expect(typeof result.current.deleteGroup).toBe('function');
      expect(typeof result.current.addContactToGroup).toBe('function');
      expect(typeof result.current.removeContactFromGroup).toBe('function');
      expect(typeof result.current.syncContacts).toBe('function');
      expect(typeof result.current.updatePreferences).toBe('function');
    });

    it('should have syncStatus as a Map', async () => {
      const { result } = renderHook(() => useContacts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.syncStatus).toBeInstanceOf(Map);
    });
  });
});
