// Contacts Service Tests for V-Mail v1.6.0

import { ContactsService } from '../contactsService';
import {
  ContactProvider,
  ContactAccount,
  CreateContactPayload
} from '../../types/contacts';

describe('ContactsService', () => {
  let contactsService: ContactsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset singleton and get fresh instance
    ContactsService.resetInstance();
    contactsService = ContactsService.getInstance();
  });

  describe('Account Management', () => {
    test('should add a new contact account', async () => {
      const account: ContactAccount = {
        id: 'account-1',
        provider: ContactProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/contacts'],
        isActive: true,
        isPrimary: true,
        syncEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await contactsService.addAccount(account);

      const accounts = contactsService.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toEqual(account);
    });

    test('should remove a contact account', async () => {
      const account: ContactAccount = {
        id: 'account-1',
        provider: ContactProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/contacts'],
        isActive: true,
        isPrimary: true,
        syncEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await contactsService.addAccount(account);
      await contactsService.removeAccount('account-1');

      const accounts = contactsService.getAccounts();
      expect(accounts).toHaveLength(0);
    });

    test('should get account by ID', async () => {
      const account: ContactAccount = {
        id: 'account-1',
        provider: ContactProvider.GOOGLE,
        userId: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['https://www.googleapis.com/auth/contacts'],
        isActive: true,
        isPrimary: true,
        syncEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await contactsService.addAccount(account);
      const retrievedAccount = contactsService.getAccount('account-1');

      expect(retrievedAccount).toEqual(account);
    });

    test('should throw error when removing non-existent account', async () => {
      await expect(contactsService.removeAccount('non-existent')).rejects.toThrow('Account not found');
    });
  });

  describe('Contact Management', () => {
    test('should create a new contact', async () => {
      const payload: CreateContactPayload = {
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
        ]
      };

      const contact = await contactsService.createContact(payload);

      expect(contact).toBeDefined();
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Doe');
      expect(contact.displayName).toBe('John Doe');
      expect(contact.emails).toHaveLength(1);
      expect(contact.emails[0].address).toBe('john.doe@example.com');
    });

    test('should get all contacts', () => {
      const contacts = contactsService.getContacts();
      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
    });

    test('should get contact by ID', async () => {
      const payload: CreateContactPayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith'
      };

      const createdContact = await contactsService.createContact(payload);
      const retrievedContact = contactsService.getContact(createdContact.id);

      expect(retrievedContact).toEqual(createdContact);
    });

    test('should get contact by email', async () => {
      const payload: CreateContactPayload = {
        firstName: 'Bob',
        lastName: 'Johnson',
        displayName: 'Bob Johnson',
        emails: [
          {
            id: 'email-1',
            address: 'bob.johnson@example.com',
            type: 'work'
          }
        ]
      };

      await contactsService.createContact(payload);
      const retrievedContact = contactsService.getContactByEmail('bob.johnson@example.com');

      expect(retrievedContact).toBeDefined();
      expect(retrievedContact?.emails[0].address).toBe('bob.johnson@example.com');
    });

    test('should update an existing contact', async () => {
      const payload: CreateContactPayload = {
        firstName: 'Alice',
        lastName: 'Williams',
        displayName: 'Alice Williams'
      };

      const contact = await contactsService.createContact(payload);

      const updatedContact = await contactsService.updateContact({
        id: contact.id,
        displayName: 'Alice M. Williams'
      });

      expect(updatedContact.displayName).toBe('Alice M. Williams');
    });

    test('should delete a contact', async () => {
      const payload: CreateContactPayload = {
        firstName: 'Charlie',
        lastName: 'Brown',
        displayName: 'Charlie Brown'
      };

      const contact = await contactsService.createContact(payload);
      await contactsService.deleteContact(contact.id);

      const retrievedContact = contactsService.getContact(contact.id);
      expect(retrievedContact).toBeUndefined();
    });

    test('should throw error when updating non-existent contact', async () => {
      await expect(
        contactsService.updateContact({ id: 'non-existent' })
      ).rejects.toThrow('Contact not found');
    });

    test('should throw error when deleting non-existent contact', async () => {
      await expect(contactsService.deleteContact('non-existent')).rejects.toThrow('Contact not found');
    });
  });

  describe('Contact Filtering', () => {
    beforeEach(async () => {
      const contacts: CreateContactPayload[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          emails: [{ id: 'e1', address: 'john@example.com', type: 'work' }],
          starred: true
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          emails: [{ id: 'e2', address: 'jane@example.com', type: 'work' }],
          favorite: true
        },
        {
          firstName: 'Bob',
          lastName: 'Johnson',
          displayName: 'Bob Johnson',
          phones: [{ id: 'p1', number: '+1 555-123-4567', type: 'mobile' }]
        }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }
    });

    test('should filter contacts by query', () => {
      const filtered = contactsService.getContacts({
        query: 'John'
      });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((c) => c.displayName.toLowerCase().includes('john'))).toBe(true);
    });

    test('should filter contacts by starred', () => {
      const filtered = contactsService.getContacts({
        starred: true
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].displayName).toBe('John Doe');
    });

    test('should filter contacts by favorite', () => {
      const filtered = contactsService.getContacts({
        favorite: true
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].displayName).toBe('Jane Smith');
    });

    test('should filter contacts by has email', () => {
      const filtered = contactsService.getContacts({
        hasEmail: true
      });

      expect(filtered.length).toBe(2);
    });

    test('should filter contacts by has phone', () => {
      const filtered = contactsService.getContacts({
        hasPhone: true
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].displayName).toBe('Bob Johnson');
    });
  });

  describe('Contact Sorting', () => {
    beforeEach(async () => {
      const contacts: CreateContactPayload[] = [
        { firstName: 'Charlie', lastName: 'Brown', displayName: 'Charlie Brown' },
        { firstName: 'Alice', lastName: 'Williams', displayName: 'Alice Williams' },
        { firstName: 'Bob', lastName: 'Johnson', displayName: 'Bob Johnson' }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }
    });

    test('should sort contacts by display name ascending', () => {
      const sorted = contactsService.getContacts(
        undefined,
        { field: 'displayName', order: 'asc' }
      );

      expect(sorted[0].displayName).toBe('Alice Williams');
      expect(sorted[1].displayName).toBe('Bob Johnson');
      expect(sorted[2].displayName).toBe('Charlie Brown');
    });

    test('should sort contacts by display name descending', () => {
      const sorted = contactsService.getContacts(
        undefined,
        { field: 'displayName', order: 'desc' }
      );

      expect(sorted[0].displayName).toBe('Charlie Brown');
      expect(sorted[1].displayName).toBe('Bob Johnson');
      expect(sorted[2].displayName).toBe('Alice Williams');
    });
  });

  describe('Contact Search', () => {
    beforeEach(async () => {
      const contacts: CreateContactPayload[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          emails: [{ id: 'e1', address: 'john.doe@example.com', type: 'work' }],
          organization: { name: 'Acme Corp' }
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          emails: [{ id: 'e2', address: 'jane.smith@example.com', type: 'work' }]
        }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }
    });

    test('should search contacts by name', () => {
      const results = contactsService.searchContacts('John');

      expect(results.length).toBe(1);
      expect(results[0].contact.displayName).toBe('John Doe');
      expect(results[0].matchedFields).toContain('displayName');
    });

    test('should search contacts by email', () => {
      const results = contactsService.searchContacts('jane.smith');

      expect(results.length).toBe(1);
      expect(results[0].contact.displayName).toBe('Jane Smith');
      expect(results[0].matchedFields).toContain('email');
    });

    test('should search contacts by organization', () => {
      const results = contactsService.searchContacts('Acme');

      expect(results.length).toBe(1);
      expect(results[0].contact.displayName).toBe('John Doe');
      expect(results[0].matchedFields).toContain('organization');
    });

    test('should return empty array for no matches', () => {
      const results = contactsService.searchContacts('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('Email to Contact Conversion', () => {
    test('should create contact from email', async () => {
      const email = {
        id: 'email-1',
        from: { email: 'sender@example.com', name: 'Test Sender' },
        to: [{ email: 'recipient@example.com' }],
        body: 'Hello, this is a test email.'
      };

      const options = {
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

      const contact = await contactsService.createContactFromEmail(email, options);

      expect(contact).toBeDefined();
      expect(contact.displayName).toBe('Test Sender');
      expect(contact.firstName).toBe('Test');
      expect(contact.lastName).toBe('Sender');
      expect(contact.emails.some((e) => e.address === 'sender@example.com')).toBe(true);
    });

    test('should merge contact with existing contact', async () => {
      const existingPayload: CreateContactPayload = {
        firstName: 'Existing',
        lastName: 'Contact',
        displayName: 'Existing Contact',
        emails: [{ id: 'e1', address: 'existing@example.com', type: 'work' }]
      };

      await contactsService.createContact(existingPayload);

      const email = {
        from: { email: 'existing@example.com', name: 'Existing Contact' },
        body: 'Email with phone number: +1 555-999-8888'
      };

      const options = {
        extractFromSender: true,
        extractFromRecipients: false,
        extractFromCc: false,
        extractFromBcc: false,
        extractFromSignature: false,
        extractFromBody: true,
        extractFromReplyTo: false,
        autoDetectFields: true,
        createGroups: false,
        mergeWithExisting: true,
        mergeStrategy: 'merge' as const
      };

      const contact = await contactsService.createContactFromEmail(email, options);

      expect(contact).toBeDefined();
      expect(contact.displayName).toBe('Existing Contact');
      expect(contact.phones.length).toBeGreaterThan(0);
    });
  });

  describe('Group Management', () => {
    test('should create a new group', async () => {
      const group = await contactsService.createGroup('Test Group', 'A test group', '#FF5733');

      expect(group).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.description).toBe('A test group');
      expect(group.color).toBe('#FF5733');
    });

    test('should get all groups', () => {
      const groups = contactsService.getGroups();
      expect(groups).toBeDefined();
      expect(Array.isArray(groups)).toBe(true);
    });

    test('should get group by ID', async () => {
      const createdGroup = await contactsService.createGroup('Test Group');
      const retrievedGroup = contactsService.getGroup(createdGroup.id);

      expect(retrievedGroup).toEqual(createdGroup);
    });

    test('should update a group', async () => {
      const group = await contactsService.createGroup('Original Name');
      const updatedGroup = await contactsService.updateGroup(group.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updatedGroup.name).toBe('Updated Name');
      expect(updatedGroup.description).toBe('Updated description');
    });

    test('should delete a group', async () => {
      const group = await contactsService.createGroup('To Delete');
      await contactsService.deleteGroup(group.id);

      const retrievedGroup = contactsService.getGroup(group.id);
      expect(retrievedGroup).toBeUndefined();
    });

    test('should add contact to group', async () => {
      const group = await contactsService.createGroup('Test Group');
      const contact = await contactsService.createContact({
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe'
      });

      await contactsService.addContactToGroup(contact.id, group.id);

      const updatedGroup = contactsService.getGroup(group.id);
      expect(updatedGroup?.contactIds).toContain(contact.id);

      const updatedContact = contactsService.getContact(contact.id);
      expect(updatedContact?.groupIds).toContain(group.id);
    });

    test('should remove contact from group', async () => {
      const group = await contactsService.createGroup('Test Group');
      const contact = await contactsService.createContact({
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane Smith'
      });

      await contactsService.addContactToGroup(contact.id, group.id);
      await contactsService.removeContactFromGroup(contact.id, group.id);

      const updatedGroup = contactsService.getGroup(group.id);
      expect(updatedGroup?.contactIds).not.toContain(contact.id);

      const updatedContact = contactsService.getContact(contact.id);
      expect(updatedContact?.groupIds).not.toContain(group.id);
    });
  });

  describe('Statistics', () => {
    test('should get contact statistics', async () => {
      const contacts: CreateContactPayload[] = [
        { firstName: 'John', lastName: 'Doe', displayName: 'John Doe', starred: true },
        { firstName: 'Jane', lastName: 'Smith', displayName: 'Jane Smith', favorite: true },
        { firstName: 'Bob', lastName: 'Johnson', displayName: 'Bob Johnson' }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }

      const statistics = await contactsService.getStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalContacts).toBeGreaterThanOrEqual(3);
      expect(statistics.starredContacts).toBeGreaterThanOrEqual(1);
      expect(statistics.favoriteContacts).toBeGreaterThanOrEqual(1);
      expect(statistics.contactsByProvider).toBeDefined();
      expect(statistics.averageEmailsPerContact).toBeDefined();
    });
  });

  describe('Duplicate Detection', () => {
    test('should find duplicate contacts by email', async () => {
      const contacts: CreateContactPayload[] = [
        {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          emails: [{ id: 'e1', address: 'john@example.com', type: 'work' }]
        },
        {
          firstName: 'Johnny',
          lastName: 'Doe',
          displayName: 'Johnny Doe',
          emails: [{ id: 'e2', address: 'john@example.com', type: 'work' }]
        }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }

      const duplicates = await contactsService.findDuplicateContacts();

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].matchedFields).toContain('email');
      expect(duplicates[0].matchScore).toBe(1.0);
    });

    test('should find duplicate contacts by name', async () => {
      const contacts: CreateContactPayload[] = [
        {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith'
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith'
        }
      ];

      for (const contact of contacts) {
        await contactsService.createContact(contact);
      }

      const duplicates = await contactsService.findDuplicateContacts();

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].matchedFields).toContain('displayName');
    });
  });

  describe('Contact Merging', () => {
    test('should merge contacts', async () => {
      const contact1 = await contactsService.createContact({
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        emails: [{ id: 'e1', address: 'john@example.com', type: 'work' }]
      });

      const contact2 = await contactsService.createContact({
        firstName: 'Johnny',
        lastName: 'Doe',
        displayName: 'Johnny Doe',
        phones: [{ id: 'p1', number: '+1 555-123-4567', type: 'mobile' }]
      });

      const mergedContact = await contactsService.mergeContacts(contact1.id, [contact2.id]);

      expect(mergedContact).toBeDefined();
      expect(mergedContact.emails.length).toBe(1);
      expect(mergedContact.phones.length).toBe(1);

      const deletedContact = contactsService.getContact(contact2.id);
      expect(deletedContact).toBeUndefined();
    });
  });

  describe('Preferences', () => {
    test('should update preferences', () => {
      const updates = {
        defaultView: 'grid' as const,
        showAvatar: false
      };

      contactsService.updatePreferences(updates);

      const preferences = contactsService.getPreferences();
      expect(preferences.defaultView).toBe('grid');
      expect(preferences.showAvatar).toBe(false);
    });

    test('should get preferences', () => {
      const preferences = contactsService.getPreferences();

      expect(preferences).toBeDefined();
      expect(preferences.defaultView).toBeDefined();
      expect(preferences.sortOptions).toBeDefined();
    });
  });
});
