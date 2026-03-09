// Contacts Service for V-Mail v1.6.0
// Handles contact operations, provider integration, and management

import {
  Contact,
  ContactGroup,
  ContactAccount,
  ContactFilterOptions,
  ContactSortOptions,
  ContactStatistics,
  EmailToContactOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ContactImportOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ContactExportOptions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ContactExportResult,
  ContactSearchResult,
  ContactMergeSuggestion,
  ContactSyncStatus,
  ContactPreferences,
  CreateContactPayload,
  UpdateContactPayload,
  ContactProvider
} from '../types/contacts';

/**
 * Main contacts service class
 */
export class ContactsService {
  private static instance: ContactsService;
  private accounts: Map<string, ContactAccount> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private groups: Map<string, ContactGroup> = new Map();
  private preferences: ContactPreferences;
  private syncStatus: Map<string, ContactSyncStatus> = new Map();

  private constructor() {
    this.preferences = {
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
    };
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    ContactsService.instance = new ContactsService();
  }

  /**
   * Clear all contacts data (for testing)
   */
  public clearAll(): void {
    this.contacts.clear();
    this.accounts.clear();
    this.groups.clear();
    this.preferences = {
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
    };
  }

  /**
   * Load contacts data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const accounts = localStorage.getItem('vmail_contact_accounts');
      if (accounts) {
        const parsedAccounts = JSON.parse(accounts);
        parsedAccounts.forEach((account: ContactAccount) => {
          this.accounts.set(account.id, account);
        });
      }

      const contacts = localStorage.getItem('vmail_contacts');
      if (contacts) {
        const parsedContacts = JSON.parse(contacts);
        parsedContacts.forEach((contact: Contact) => {
          this.contacts.set(contact.id, contact);
        });
      }

      const groups = localStorage.getItem('vmail_contact_groups');
      if (groups) {
        const parsedGroups = JSON.parse(groups);
        parsedGroups.forEach((group: ContactGroup) => {
          this.groups.set(group.id, group);
        });
      }

      const preferences = localStorage.getItem('vmail_contact_preferences');
      if (preferences) {
        this.preferences = JSON.parse(preferences);
      }
    } catch (error) {
      console.error('Error loading contacts data:', error);
    }
  }

  /**
   * Save contacts data to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('vmail_contact_accounts', JSON.stringify(Array.from(this.accounts.values())));
      localStorage.setItem('vmail_contacts', JSON.stringify(Array.from(this.contacts.values())));
      localStorage.setItem('vmail_contact_groups', JSON.stringify(Array.from(this.groups.values())));
      localStorage.setItem('vmail_contact_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving contacts data:', error);
    }
  }

  /**
   * Get all connected accounts
   */
  public getAccounts(): ContactAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get account by ID
   */
  public getAccount(accountId: string): ContactAccount | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * Add contact account
   */
  public async addAccount(account: ContactAccount): Promise<void> {
    this.accounts.set(account.id, account);
    this.saveToStorage();

    // Load contacts for this account
    await this.loadContactsForAccount(account.id);
  }

  /**
   * Remove contact account
   */
  public async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Remove all contacts for this account
    const contactsToRemove = Array.from(this.contacts.values()).filter(
      (contact) => contact.provider === account.provider
    );

    contactsToRemove.forEach((contact) => {
      this.contacts.delete(contact.id);
    });

    this.accounts.delete(accountId);
    this.saveToStorage();
  }

  /**
   * Load contacts for an account
   */
  private async loadContactsForAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // This would call the actual provider API
    // For now, we'll simulate loading contacts
    const contacts = await this.fetchContactsFromProvider(account);

    contacts.forEach((contact) => {
      this.contacts.set(contact.id, contact);
    });

    this.saveToStorage();
  }

  /**
   * Fetch contacts from provider (simulated)
   */
  private async fetchContactsFromProvider(account: ContactAccount): Promise<Contact[]> {
    // This would make actual API calls to Google People API or Microsoft Graph
    // For demonstration, we'll return mock data

    if (account.provider === ContactProvider.GOOGLE) {
      return [
        {
          id: `${account.id}_contact_1`,
          provider: account.provider,
          providerContactId: 'google-contact-1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          emails: [
            {
              id: 'email-1',
              address: 'john.doe@example.com',
              type: 'work',
              isPrimary: true
            }
          ],
          phones: [
            {
              id: 'phone-1',
              number: '+1 555-123-4567',
              type: 'mobile',
              isPrimary: true
            }
          ],
          addresses: [],
          websites: [],
          socials: [],
          customFields: [],
          groupIds: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

    return [];
  }

  /**
   * Get all contacts
   */
  public getContacts(filters?: ContactFilterOptions, sort?: ContactSortOptions): Contact[] {
    let contacts = Array.from(this.contacts.values());

    // Apply filters
    if (filters) {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        contacts = contacts.filter(
          (contact) =>
            contact.displayName.toLowerCase().includes(query) ||
            contact.firstName?.toLowerCase().includes(query) ||
            contact.lastName?.toLowerCase().includes(query) ||
            contact.emails.some((e) => e.address.toLowerCase().includes(query))
        );
      }

      if (filters.groups && filters.groups.length > 0) {
        contacts = contacts.filter((contact) => filters.groups!.some((groupId) => contact.groupIds.includes(groupId)));
      }

      if (filters.tags && filters.tags.length > 0) {
        contacts = contacts.filter((contact) => filters.tags!.some((tag) => contact.tags.includes(tag)));
      }

      if (filters.starred) {
        contacts = contacts.filter((contact) => contact.starred);
      }

      if (filters.favorite) {
        contacts = contacts.filter((contact) => contact.favorite);
      }

      if (filters.hasEmail) {
        contacts = contacts.filter((contact) => contact.emails.length > 0);
      }

      if (filters.hasPhone) {
        contacts = contacts.filter((contact) => contact.phones.length > 0);
      }

      if (filters.minEmailCount) {
        contacts = contacts.filter((contact) => (contact.emailCount || 0) >= filters.minEmailCount!);
      }

      if (filters.maxResults) {
        contacts = contacts.slice(0, filters.maxResults);
      }
    }

    // Apply sort
    if (sort) {
      contacts.sort((a, b) => {
        let comparison = 0;

        switch (sort.field) {
          case 'displayName':
            comparison = a.displayName.localeCompare(b.displayName);
            break;
          case 'firstName':
            comparison = (a.firstName || '').localeCompare(b.firstName || '');
            break;
          case 'lastName':
            comparison = (a.lastName || '').localeCompare(b.lastName || '');
            break;
          case 'email':
            comparison = (a.emails[0]?.address || '').localeCompare(b.emails[0]?.address || '');
            break;
          case 'createdAt':
            comparison = a.createdAt.localeCompare(b.createdAt);
            break;
          case 'updatedAt':
            comparison = a.updatedAt.localeCompare(b.updatedAt);
            break;
          case 'lastEmailDate':
            comparison = (a.lastEmailDate || '').localeCompare(b.lastEmailDate || '');
            break;
        }

        return sort.order === 'desc' ? -comparison : comparison;
      });
    }

    return contacts;
  }

  /**
   * Get contact by ID
   */
  public getContact(contactId: string): Contact | undefined {
    return this.contacts.get(contactId);
  }

  /**
   * Get contact by email
   */
  public getContactByEmail(email: string): Contact | undefined {
    return Array.from(this.contacts.values()).find((contact) =>
      contact.emails.some((e) => e.address.toLowerCase() === email.toLowerCase())
    );
  }

  /**
   * Create a new contact
   */
  public async createContact(payload: CreateContactPayload): Promise<Contact> {
    const contact: Contact = {
      id: this.generateContactId(),
      provider: ContactProvider.LOCAL,
      providerContactId: '',
      firstName: payload.firstName,
      lastName: payload.lastName,
      displayName: payload.displayName,
      emails: payload.emails || [],
      phones: payload.phones || [],
      addresses: payload.addresses || [],
      websites: payload.websites || [],
      socials: payload.socials || [],
      customFields: payload.customFields || [],
      organization: payload.organization,
      birthday: payload.birthday,
      notes: payload.notes || [],
      photo: payload.photo,
      groupIds: payload.groupIds || [],
      tags: payload.tags || [],
      starred: payload.starred || false,
      favorite: payload.favorite || false,
      hidden: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to contacts map
    this.contacts.set(contact.id, contact);

    // Update groups
    contact.groupIds.forEach((groupId) => {
      const group = this.groups.get(groupId);
      if (group) {
        if (!group.contactIds.includes(contact.id)) {
          group.contactIds.push(contact.id);
        }
      }
    });

    this.saveToStorage();

    return contact;
  }

  /**
   * Update an existing contact
   */
  public async updateContact(payload: UpdateContactPayload): Promise<Contact> {
    const contact = this.contacts.get(payload.id);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Check version for optimistic locking
    if (payload.version !== undefined && contact.version !== payload.version) {
      throw new Error('Contact has been modified by another user');
    }

    // Update contact fields
    if (payload.firstName !== undefined) {
      contact.firstName = payload.firstName;
    }
    if (payload.lastName !== undefined) {
      contact.lastName = payload.lastName;
    }
    if (payload.displayName !== undefined) {
      contact.displayName = payload.displayName;
    }
    if (payload.emails !== undefined) {
      contact.emails = payload.emails;
    }
    if (payload.phones !== undefined) {
      contact.phones = payload.phones;
    }
    if (payload.addresses !== undefined) {
      contact.addresses = payload.addresses;
    }
    if (payload.websites !== undefined) {
      contact.websites = payload.websites;
    }
    if (payload.socials !== undefined) {
      contact.socials = payload.socials;
    }
    if (payload.customFields !== undefined) {
      contact.customFields = payload.customFields;
    }
    if (payload.organization !== undefined) {
      contact.organization = payload.organization;
    }
    if (payload.birthday !== undefined) {
      contact.birthday = payload.birthday;
    }
    if (payload.notes !== undefined) {
      contact.notes = payload.notes;
    }
    if (payload.photo !== undefined) {
      contact.photo = payload.photo;
    }
    if (payload.groupIds !== undefined) {
      // Remove from old groups
      contact.groupIds.forEach((oldGroupId) => {
        if (!payload.groupIds!.includes(oldGroupId)) {
          const group = this.groups.get(oldGroupId);
          if (group) {
            group.contactIds = group.contactIds.filter((id) => id !== contact.id);
          }
        }
      });

      // Add to new groups
      payload.groupIds.forEach((newGroupId) => {
        if (!contact.groupIds.includes(newGroupId)) {
          const group = this.groups.get(newGroupId);
          if (group) {
            if (!group.contactIds.includes(contact.id)) {
              group.contactIds.push(contact.id);
            }
          }
        }
      });

      contact.groupIds = payload.groupIds;
    }
    if (payload.tags !== undefined) {
      contact.tags = payload.tags;
    }
    if (payload.starred !== undefined) {
      contact.starred = payload.starred;
    }
    if (payload.favorite !== undefined) {
      contact.favorite = payload.favorite;
    }

    contact.updatedAt = new Date().toISOString();
    if (contact.version !== undefined) {
      contact.version++;
    }

    this.contacts.set(payload.id, contact);
    this.saveToStorage();

    return contact;
  }

  /**
   * Delete a contact
   */
  public async deleteContact(contactId: string): Promise<void> {
    const contact = this.contacts.get(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Remove from groups
    contact.groupIds.forEach((groupId) => {
      const group = this.groups.get(groupId);
      if (group) {
        group.contactIds = group.contactIds.filter((id) => id !== contactId);
      }
    });

    this.contacts.delete(contactId);
    this.saveToStorage();
  }

  /**
   * Search contacts
   */
  public searchContacts(query: string): ContactSearchResult[] {
    const results: ContactSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    this.contacts.forEach((contact) => {
      let relevanceScore = 0;
      const matchedFields: string[] = [];

      // Check display name
      if (contact.displayName.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 10;
        matchedFields.push('displayName');
      }

      // Check first name
      if (contact.firstName?.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 8;
        matchedFields.push('firstName');
      }

      // Check last name
      if (contact.lastName?.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 8;
        matchedFields.push('lastName');
      }

      // Check emails
      contact.emails.forEach((email) => {
        if (email.address.toLowerCase().includes(lowerQuery)) {
          relevanceScore += 5;
          matchedFields.push('email');
        }
      });

      // Check phones
      contact.phones.forEach((phone) => {
        if (phone.number.includes(query)) {
          relevanceScore += 3;
          matchedFields.push('phone');
        }
      });

      // Check organization
      if (contact.organization?.name?.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 4;
        matchedFields.push('organization');
      }

      if (relevanceScore > 0) {
        results.push({
          contact,
          relevanceScore,
          matchedFields: [...new Set(matchedFields)]
        });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  /**
   * Create contact from email
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async createContactFromEmail(email: any, options: EmailToContactOptions): Promise<Contact> {
    const extractedData = this.extractContactDataFromEmail(email, options);

    // Check if contact already exists
    let existingContact: Contact | undefined;

    if (extractedData.emails && extractedData.emails.length > 0) {
      existingContact = this.getContactByEmail(extractedData.emails[0].address);
    }

    if (existingContact && options.mergeWithExisting) {
      // Merge with existing contact
      const mergedPayload: UpdateContactPayload = {
        id: existingContact.id,
        version: existingContact.version
      };

      if (options.mergeStrategy === 'merge') {
        if (extractedData.firstName && !existingContact.firstName) {
          mergedPayload.firstName = extractedData.firstName;
        }
        if (extractedData.lastName && !existingContact.lastName) {
          mergedPayload.lastName = extractedData.lastName;
        }
        if (extractedData.organization && !existingContact.organization) {
          mergedPayload.organization = extractedData.organization;
        }
        mergedPayload.emails = [...existingContact.emails, ...(extractedData.emails || [])];
        mergedPayload.phones = [...existingContact.phones, ...(extractedData.phones || [])];
      } else if (options.mergeStrategy === 'replace') {
        if (extractedData.firstName) {
          mergedPayload.firstName = extractedData.firstName;
        }
        if (extractedData.lastName) {
          mergedPayload.lastName = extractedData.lastName;
        }
        if (extractedData.organization) {
          mergedPayload.organization = extractedData.organization;
        }
        mergedPayload.emails = extractedData.emails || [];
        mergedPayload.phones = extractedData.phones || [];
      }

      return await this.updateContact(mergedPayload);
    } else {
      // Create new contact
      const payload: CreateContactPayload = {
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        displayName: extractedData.displayName || extractedData.firstName || extractedData.lastName || 'New Contact',
        emails: extractedData.emails,
        phones: extractedData.phones,
        organization: extractedData.organization,
        groupIds: [],
        tags: []
      };

      const contact = await this.createContact(payload);

      // Add to group if specified
      if (options.createGroups && options.groupName) {
        const group = await this.getOrCreateGroup(options.groupName);
        await this.addContactToGroup(contact.id, group.id);
      }

      return contact;
    }
  }

  /**
   * Extract contact data from email
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractContactDataFromEmail(email: any, options: EmailToContactOptions): Partial<CreateContactPayload> {
    const result: Partial<CreateContactPayload> = {
      emails: [],
      phones: []
    };

    // Extract from sender
    if (options.extractFromSender && email.from) {
      if (email.from.name) {
        const names = email.from.name.split(' ');
        result.firstName = names[0];
        result.lastName = names.slice(1).join(' ');
        result.displayName = email.from.name;
      }
      if (email.from.email) {
        result.emails!.push({
          id: this.generateFieldId(),
          address: email.from.email,
          type: 'work'
        });
      }
    }

    // Extract from recipients
    if (options.extractFromRecipients && email.to) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      email.to.forEach((recipient: any) => {
        if (recipient.email) {
          result.emails!.push({
            id: this.generateFieldId(),
            address: recipient.email,
            type: 'work'
          });
        }
      });
    }

    // Extract from CC
    if (options.extractFromCc && email.cc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      email.cc.forEach((recipient: any) => {
        if (recipient.email) {
          result.emails!.push({
            id: this.generateFieldId(),
            address: recipient.email,
            type: 'work'
          });
        }
      });
    }

    // Extract from body (simplified - would be more sophisticated in production)
    if (options.extractFromBody && email.body) {
      // Extract phone numbers
      const phonePattern = /(\+?[\d\s-()]+)/g;
      const phones = email.body.match(phonePattern);
      if (phones) {
        phones.forEach((phone: string) => {
          if (phone.replace(/\D/g, '').length >= 10) {
            result.phones!.push({
              id: this.generateFieldId(),
              number: phone.trim(),
              type: 'work'
            });
          }
        });
      }
    }

    return result;
  }

  /**
   * Get contact statistics
   */
  public async getStatistics(): Promise<ContactStatistics> {
    const contacts = Array.from(this.contacts.values());

    const totalContacts = contacts.length;
    const activeContacts = contacts.filter((c) => !c.hidden).length;
    const starredContacts = contacts.filter((c) => c.starred).length;
    const favoriteContacts = contacts.filter((c) => c.favorite).length;

    const contactsByGroup: Record<string, number> = {};
    this.groups.forEach((group) => {
      contactsByGroup[group.name] = group.contactIds.length;
    });

    const contactsByTag: Record<string, number> = {};
    contacts.forEach((contact) => {
      contact.tags.forEach((tag) => {
        contactsByTag[tag] = (contactsByTag[tag] || 0) + 1;
      });
    });

    const contactsByProvider: Record<ContactProvider, number> = {
      [ContactProvider.GOOGLE]: 0,
      [ContactProvider.OUTLOOK]: 0,
      [ContactProvider.ICLOUD]: 0,
      [ContactProvider.LOCAL]: 0
    };
    contacts.forEach((contact) => {
      contactsByProvider[contact.provider]++;
    });

    const totalEmailCount = contacts.reduce((sum, c) => sum + (c.emailCount || 0), 0);
    const averageEmailsPerContact = totalContacts > 0 ? totalEmailCount / totalContacts : 0;

    const mostContactedContacts = contacts
      .filter((c) => c.emailCount && c.emailCount > 0)
      .sort((a, b) => (b.emailCount || 0) - (a.emailCount || 0))
      .slice(0, 10)
      .map((contact) => ({
        contactId: contact.id,
        emailCount: contact.emailCount || 0
      }));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyAddedContacts = contacts.filter((c) => new Date(c.createdAt) > oneWeekAgo).length;
    const recentlyUpdatedContacts = contacts.filter((c) => new Date(c.updatedAt) > oneWeekAgo).length;

    const duplicateContacts = (await this.findDuplicateContacts()).length;

    return {
      totalContacts,
      activeContacts,
      starredContacts,
      favoriteContacts,
      contactsByGroup,
      contactsByTag,
      contactsByProvider,
      averageEmailsPerContact,
      mostContactedContacts,
      recentlyAddedContacts,
      recentlyUpdatedContacts,
      duplicateContacts
    };
  }

  /**
   * Find duplicate contacts
   */
  public async findDuplicateContacts(): Promise<ContactMergeSuggestion[]> {
    const suggestions: ContactMergeSuggestion[] = [];
    const contacts = Array.from(this.contacts.values());

    // Group contacts by email
    const byEmail = new Map<string, Contact[]>();
    contacts.forEach((contact) => {
      contact.emails.forEach((email) => {
        if (!byEmail.has(email.address)) {
          byEmail.set(email.address, []);
        }
        byEmail.get(email.address)!.push(contact);
      });
    });

    // Find duplicates
    byEmail.forEach((duplicateContacts, _email) => {
      if (duplicateContacts.length > 1) {
        const primaryContact = duplicateContacts.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
        const others = duplicateContacts.filter((c) => c.id !== primaryContact.id);

        suggestions.push({
          primaryContact,
          duplicateContacts: others,
          matchScore: 1.0, // Perfect match on email
          matchedFields: ['email'],
          suggestedMerge: this.suggestMerge(primaryContact, others)
        });
      }
    });

    // Group contacts by name
    const byName = new Map<string, Contact[]>();
    contacts.forEach((contact) => {
      const key = contact.displayName.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, []);
      }
      byName.get(key)!.push(contact);
    });

    // Find name duplicates with lower score
    byName.forEach((duplicateContacts, _name) => {
      if (duplicateContacts.length > 1 && duplicateContacts.length === 2) {
        // Only suggest if not already suggested by email
        const hasEmailMatch = suggestions.some((s) =>
          s.duplicateContacts.some((dc) => duplicateContacts.some((c) => c.id === dc.id))
        );

        if (!hasEmailMatch) {
          const primaryContact = duplicateContacts[0];
          const others = duplicateContacts.slice(1);

          suggestions.push({
            primaryContact,
            duplicateContacts: others,
            matchScore: 0.7, // Lower score for name-only match
            matchedFields: ['displayName'],
            suggestedMerge: this.suggestMerge(primaryContact, others)
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Suggest merged contact
   */
  private suggestMerge(primary: Contact, duplicates: Contact[]): Partial<Contact> {
    const merged: Partial<Contact> = {
      firstName: primary.firstName || duplicates[0].firstName,
      lastName: primary.lastName || duplicates[0].lastName,
      displayName: primary.displayName,
      emails: [...primary.emails],
      phones: [...primary.phones],
      addresses: [...primary.addresses],
      websites: [...primary.websites],
      socials: [...primary.socials],
      customFields: [...primary.customFields]
    };

    // Merge additional fields from duplicates
    duplicates.forEach((duplicate) => {
      duplicate.emails.forEach((email) => {
        if (!merged.emails!.find((e) => e.address === email.address)) {
          merged.emails!.push(email);
        }
      });

      duplicate.phones.forEach((phone) => {
        if (!merged.phones!.find((p) => p.number === phone.number)) {
          merged.phones!.push(phone);
        }
      });
    });

    return merged;
  }

  /**
   * Merge contacts
   */
  public async mergeContacts(primaryContactId: string, duplicateContactIds: string[]): Promise<Contact> {
    const primaryContact = this.contacts.get(primaryContactId);
    if (!primaryContact) {
      throw new Error('Primary contact not found');
    }

    const duplicates = duplicateContactIds
      .map((id) => this.contacts.get(id))
      .filter((c) => c !== undefined) as Contact[];

    if (duplicates.length === 0) {
      throw new Error('No duplicate contacts found');
    }

    // Merge data
    const mergedData = this.suggestMerge(primaryContact, duplicates);

    // Update primary contact
    const payload: UpdateContactPayload = {
      id: primaryContactId,
      ...mergedData,
      version: primaryContact.version
    };

    const updatedContact = await this.updateContact(payload);

    // Delete duplicates
    for (const duplicate of duplicates) {
      await this.deleteContact(duplicate.id);
    }

    return updatedContact;
  }

  /**
   * Get all groups
   */
  public getGroups(): ContactGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Get group by ID
   */
  public getGroup(groupId: string): ContactGroup | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Create a new group
   */
  public async createGroup(name: string, description?: string, color?: string): Promise<ContactGroup> {
    const group: ContactGroup = {
      id: this.generateGroupId(),
      name,
      description,
      color,
      contactIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.groups.set(group.id, group);
    this.saveToStorage();

    return group;
  }

  /**
   * Update a group
   */
  public async updateGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
    }
  ): Promise<ContactGroup> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (updates.name) {
      group.name = updates.name;
    }
    if (updates.description !== undefined) {
      group.description = updates.description;
    }
    if (updates.color !== undefined) {
      group.color = updates.color;
    }
    group.updatedAt = new Date().toISOString();

    this.groups.set(groupId, group);
    this.saveToStorage();

    return group;
  }

  /**
   * Delete a group
   */
  public async deleteGroup(groupId: string): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Remove group from all contacts
    group.contactIds.forEach((contactId) => {
      const contact = this.contacts.get(contactId);
      if (contact) {
        contact.groupIds = contact.groupIds.filter((id) => id !== groupId);
        this.contacts.set(contactId, contact);
      }
    });

    this.groups.delete(groupId);
    this.saveToStorage();
  }

  /**
   * Add contact to group
   */
  public async addContactToGroup(contactId: string, groupId: string): Promise<void> {
    const contact = this.contacts.get(contactId);
    const group = this.groups.get(groupId);

    if (!contact || !group) {
      throw new Error('Contact or group not found');
    }

    if (!contact.groupIds.includes(groupId)) {
      contact.groupIds.push(groupId);
    }

    if (!group.contactIds.includes(contactId)) {
      group.contactIds.push(contactId);
    }

    contact.updatedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();

    this.contacts.set(contactId, contact);
    this.groups.set(groupId, group);
    this.saveToStorage();
  }

  /**
   * Remove contact from group
   */
  public async removeContactFromGroup(contactId: string, groupId: string): Promise<void> {
    const contact = this.contacts.get(contactId);
    const group = this.groups.get(groupId);

    if (!contact || !group) {
      throw new Error('Contact or group not found');
    }

    contact.groupIds = contact.groupIds.filter((id) => id !== groupId);
    group.contactIds = group.contactIds.filter((id) => id !== contactId);

    contact.updatedAt = new Date().toISOString();
    group.updatedAt = new Date().toISOString();

    this.contacts.set(contactId, contact);
    this.groups.set(groupId, group);
    this.saveToStorage();
  }

  /**
   * Get or create group
   */
  private async getOrCreateGroup(groupName: string): Promise<ContactGroup> {
    let group = Array.from(this.groups.values()).find((g) => g.name === groupName);

    if (!group) {
      group = await this.createGroup(groupName);
    }

    return group;
  }

  /**
   * Sync contacts with provider
   */
  public async syncContacts(accountId?: string): Promise<void> {
    const syncStatus: ContactSyncStatus = {
      lastSyncAt: new Date().toISOString(),
      isSyncing: true,
      syncErrors: [],
      contactsAdded: 0,
      contactsUpdated: 0,
      contactsDeleted: 0,
      contactsSkipped: 0
    };

    const targetAccountId = accountId || this.accounts.values().next().value?.id;

    if (!targetAccountId) {
      throw new Error('No account found to sync');
    }

    this.syncStatus.set(targetAccountId, syncStatus);

    try {
      // This would make actual API calls to sync with provider
      // For demonstration, we'll simulate sync

      await new Promise((resolve) => setTimeout(resolve, 1000));

      syncStatus.contactsAdded = 0;
      syncStatus.contactsUpdated = 0;
      syncStatus.contactsDeleted = 0;
      syncStatus.contactsSkipped = 0;
      syncStatus.lastSyncAt = new Date().toISOString();
      syncStatus.isSyncing = false;
    } catch (error) {
      syncStatus.syncErrors.push({
        contactId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      syncStatus.isSyncing = false;
    }

    this.syncStatus.set(targetAccountId, syncStatus);
  }

  /**
   * Get sync status
   */
  public getSyncStatus(accountId: string): ContactSyncStatus | undefined {
    return this.syncStatus.get(accountId);
  }

  /**
   * Get preferences
   */
  public getPreferences(): ContactPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  public updatePreferences(updates: Partial<ContactPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.saveToStorage();
  }

  /**
   * Generate unique contact ID
   */
  private generateContactId(): string {
    return `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique group ID
   */
  private generateGroupId(): string {
    return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique field ID
   */
  private generateFieldId(): string {
    return `fld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const contactsService = ContactsService.getInstance();
