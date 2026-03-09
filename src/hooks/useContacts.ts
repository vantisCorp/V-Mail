// Contacts Hook for V-Mail v1.6.0
// React hook for contacts state management and operations

import { useState, useEffect, useCallback } from 'react';
import {
  Contact,
  ContactGroup,
  ContactAccount,
  ContactFilterOptions,
  ContactSortOptions,
  ContactStatistics,
  EmailToContactOptions,
  ContactImportOptions,
  ContactExportOptions,
  ContactExportResult,
  ContactSearchResult,
  ContactMergeSuggestion,
  ContactSyncStatus,
  ContactPreferences,
  CreateContactPayload,
  UpdateContactPayload
} from '../types/contacts';
import { contactsService } from '../services/contactsService';

/**
 * Contacts hook return type
 */
interface UseContactsReturn {
  // Data
  accounts: ContactAccount[];
  contacts: Contact[];
  groups: ContactGroup[];
  statistics: ContactStatistics | null;
  preferences: ContactPreferences;
  syncStatus: Map<string, ContactSyncStatus>;
  loading: boolean;
  error: string | null;

  // Methods
  refreshContacts: () => Promise<void>;
  getContact: (contactId: string) => Contact | undefined;
  getContactByEmail: (email: string) => Contact | undefined;
  createContact: (payload: CreateContactPayload) => Promise<Contact>;
  updateContact: (payload: UpdateContactPayload) => Promise<Contact>;
  deleteContact: (contactId: string) => Promise<void>;
  searchContacts: (query: string) => ContactSearchResult[];
  createContactFromEmail: (email: any, options: EmailToContactOptions) => Promise<Contact>;
  getFilteredContacts: (filters?: ContactFilterOptions, sort?: ContactSortOptions) => Contact[];
  findDuplicateContacts: () => Promise<ContactMergeSuggestion[]>;
  mergeContacts: (primaryId: string, duplicateIds: string[]) => Promise<Contact>;
  getGroup: (groupId: string) => ContactGroup | undefined;
  createGroup: (name: string, description?: string, color?: string) => Promise<ContactGroup>;
  updateGroup: (groupId: string, updates: any) => Promise<ContactGroup>;
  deleteGroup: (groupId: string) => Promise<void>;
  addContactToGroup: (contactId: string, groupId: string) => Promise<void>;
  removeContactFromGroup: (contactId: string, groupId: string) => Promise<void>;
  syncContacts: (accountId?: string) => Promise<void>;
  updatePreferences: (updates: Partial<ContactPreferences>) => void;
}

/**
 * Contacts hook for managing contact state and operations
 */
export function useContacts(): UseContactsReturn {
  const [accounts, setAccounts] = useState<ContactAccount[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [statistics, setStatistics] = useState<ContactStatistics | null>(null);
  const [preferences, setPreferencesState] = useState<ContactPreferences>({
    defaultView: 'list',
    sortOptions: {
      field: 'displayName',
      order: 'asc'
    },
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
  });
  const [syncStatus, setSyncStatus] = useState<Map<string, ContactSyncStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load contacts on mount
   */
  useEffect(() => {
    loadContacts();
  }, []);

  /**
   * Load contacts from service
   */
  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedAccounts = contactsService.getAccounts();
      setAccounts(loadedAccounts);

      const loadedContacts = contactsService.getContacts();
      setContacts(loadedContacts);

      const loadedGroups = contactsService.getGroups();
      setGroups(loadedGroups);

      const loadedPreferences = contactsService.getPreferences();
      setPreferencesState(loadedPreferences);

      const stats = await contactsService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh contacts and data
   */
  const refreshContacts = useCallback(async () => {
    await loadContacts();
  }, [loadContacts]);

  /**
   * Get contact by ID
   */
  const getContact = useCallback((contactId: string): Contact | undefined => {
    return contactsService.getContact(contactId);
  }, []);

  /**
   * Get contact by email
   */
  const getContactByEmail = useCallback((email: string): Contact | undefined => {
    return contactsService.getContactByEmail(email);
  }, []);

  /**
   * Create a new contact
   */
  const createContact = useCallback(async (payload: CreateContactPayload): Promise<Contact> => {
    setLoading(true);
    setError(null);

    try {
      const contact = await contactsService.createContact(payload);

      // Update contacts list
      setContacts((prev) => [...prev, contact]);

      // Refresh statistics
      const stats = await contactsService.getStatistics();
      setStatistics(stats);

      return contact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing contact
   */
  const updateContact = useCallback(async (payload: UpdateContactPayload): Promise<Contact> => {
    setLoading(true);
    setError(null);

    try {
      const updatedContact = await contactsService.updateContact(payload);

      // Update contacts list
      setContacts((prev) => prev.map((contact) => (contact.id === updatedContact.id ? updatedContact : contact)));

      // Refresh statistics
      const stats = await contactsService.getStatistics();
      setStatistics(stats);

      return updatedContact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a contact
   */
  const deleteContact = useCallback(async (contactId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await contactsService.deleteContact(contactId);

      // Update contacts list
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));

      // Refresh statistics
      const stats = await contactsService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search contacts
   */
  const searchContacts = useCallback((query: string): ContactSearchResult[] => {
    return contactsService.searchContacts(query);
  }, []);

  /**
   * Create contact from email
   */
  const createContactFromEmail = useCallback(async (email: any, options: EmailToContactOptions): Promise<Contact> => {
    setLoading(true);
    setError(null);

    try {
      const contact = await contactsService.createContactFromEmail(email, options);

      // Update contacts list
      setContacts((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === contact.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = contact;
          return updated;
        }
        return [...prev, contact];
      });

      // Refresh statistics
      const stats = await contactsService.getStatistics();
      setStatistics(stats);

      return contact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact from email');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get filtered contacts
   */
  const getFilteredContacts = useCallback((filters?: ContactFilterOptions, sort?: ContactSortOptions): Contact[] => {
    return contactsService.getContacts(filters, sort);
  }, []);

  /**
   * Find duplicate contacts
   */
  const findDuplicateContacts = useCallback(async (): Promise<ContactMergeSuggestion[]> => {
    setLoading(true);
    setError(null);

    try {
      const suggestions = await contactsService.findDuplicateContacts();
      return suggestions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find duplicate contacts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Merge contacts
   */
  const mergeContacts = useCallback(async (primaryId: string, duplicateIds: string[]): Promise<Contact> => {
    setLoading(true);
    setError(null);

    try {
      const mergedContact = await contactsService.mergeContacts(primaryId, duplicateIds);

      // Update contacts list
      setContacts((prev) =>
        prev
          .map((contact) => (contact.id === mergedContact.id ? mergedContact : contact))
          .filter((contact) => !duplicateIds.includes(contact.id))
      );

      // Refresh statistics
      const stats = await contactsService.getStatistics();
      setStatistics(stats);

      return mergedContact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge contacts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get group by ID
   */
  const getGroup = useCallback((groupId: string): ContactGroup | undefined => {
    return contactsService.getGroup(groupId);
  }, []);

  /**
   * Create a new group
   */
  const createGroup = useCallback(async (name: string, description?: string, color?: string): Promise<ContactGroup> => {
    setLoading(true);
    setError(null);

    try {
      const group = await contactsService.createGroup(name, description, color);

      // Update groups list
      setGroups((prev) => [...prev, group]);

      return group;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a group
   */
  const updateGroup = useCallback(async (groupId: string, updates: any): Promise<ContactGroup> => {
    setLoading(true);
    setError(null);

    try {
      const updatedGroup = await contactsService.updateGroup(groupId, updates);

      // Update groups list
      setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));

      return updatedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a group
   */
  const deleteGroup = useCallback(async (groupId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await contactsService.deleteGroup(groupId);

      // Update groups list
      setGroups((prev) => prev.filter((group) => group.id !== groupId));

      // Reload contacts as group references are removed
      const loadedContacts = contactsService.getContacts();
      setContacts(loadedContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add contact to group
   */
  const addContactToGroup = useCallback(async (contactId: string, groupId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await contactsService.addContactToGroup(contactId, groupId);

      // Reload contacts and groups
      const loadedContacts = contactsService.getContacts();
      const loadedGroups = contactsService.getGroups();
      setContacts(loadedContacts);
      setGroups(loadedGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact to group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove contact from group
   */
  const removeContactFromGroup = useCallback(async (contactId: string, groupId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await contactsService.removeContactFromGroup(contactId, groupId);

      // Reload contacts and groups
      const loadedContacts = contactsService.getContacts();
      const loadedGroups = contactsService.getGroups();
      setContacts(loadedContacts);
      setGroups(loadedGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove contact from group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync contacts with provider
   */
  const syncContacts = useCallback(
    async (accountId?: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await contactsService.syncContacts(accountId);

        // Refresh contacts
        await refreshContacts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to sync contacts');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshContacts]
  );

  /**
   * Update preferences
   */
  const updatePreferences = useCallback((updates: Partial<ContactPreferences>): void => {
    contactsService.updatePreferences(updates);
    setPreferencesState((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // Data
    accounts,
    contacts,
    groups,
    statistics,
    preferences,
    syncStatus,
    loading,
    error,

    // Methods
    refreshContacts,
    getContact,
    getContactByEmail,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    createContactFromEmail,
    getFilteredContacts,
    findDuplicateContacts,
    mergeContacts,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addContactToGroup,
    removeContactFromGroup,
    syncContacts,
    updatePreferences
  };
}
