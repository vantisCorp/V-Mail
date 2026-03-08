import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCrmIntegration } from '../../src/hooks/useCrmIntegration';
import {
  CRMProvider,
  ContactStatus,
  DealStage,
  SyncStatus
} from '../../src/types/crmIntegration';

describe('useCrmIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and State', () => {
    it('should initialize with empty state and loading', () => {
      const { result } = renderHook(() => useCrmIntegration());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.accounts).toEqual([]);
      expect(result.current.contacts).toEqual([]);
      expect(result.current.deals).toEqual([]);
    });

    it('should load accounts, contacts, and deals after initialization', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.accounts.length).toBeGreaterThan(0);
      expect(result.current.contacts.length).toBeGreaterThan(0);
      expect(result.current.deals.length).toBeGreaterThan(0);
    });

    it('should initialize selectedAccount as null', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedAccount).toBeNull();
    });
  });

  describe('Account Management', () => {
    it('should connect a new CRM account', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newAccount = await act(async () => {
        return await result.current.connectAccount({
          provider: CRMProvider.PIPEDRIVE,
          name: 'Pipedrive Account',
          email: 'pipedrive@company.com',
          syncFrequency: 45
        });
      });

      expect(newAccount).not.toBeNull();
      expect(newAccount?.provider).toBe(CRMProvider.PIPEDRIVE);
      expect(newAccount?.name).toBe('Pipedrive Account');
      expect(result.current.accounts.length).toBe(3); // 2 initial + 1 new
    });

    it('should disconnect an account', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const accountToDisconnect = result.current.accounts[0];
      const initialCount = result.current.accounts.length;

      await act(async () => {
        await result.current.disconnectAccount(accountToDisconnect.id);
      });

      expect(result.current.accounts.length).toBe(initialCount);
      const disconnectedAccount = result.current.accounts.find(a => a.id === accountToDisconnect.id);
      expect(disconnectedAccount?.isConnected).toBe(false);
      expect(disconnectedAccount?.isActive).toBe(false);
    });

    it('should refresh account token', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const account = result.current.accounts[0];
      const originalUpdatedAt = account.updatedAt;

      await act(async () => {
        await result.current.refreshAccountToken(account.id);
      });

      const updatedAccount = result.current.accounts.find(a => a.id === account.id);
      expect(updatedAccount?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should get account by ID', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const accountToFind = result.current.accounts[0];
      const foundAccount = result.current.getAccountById(accountToFind.id);

      expect(foundAccount).not.toBeNull();
      expect(foundAccount?.id).toBe(accountToFind.id);
      expect(foundAccount?.name).toBe(accountToFind.name);
    });
  });

  describe('Contact Management', () => {
    it('should create a new contact', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newContact = await act(async () => {
        return await result.current.createContact({
          provider: CRMProvider.SALESFORCE,
          accountId: result.current.accounts[0].id,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          company: 'Test Corp',
          status: ContactStatus.LEAD
        });
      });

      expect(newContact).not.toBeNull();
      expect(newContact?.firstName).toBe('Test');
      expect(newContact?.email).toBe('test@example.com');
      expect(result.current.contacts.length).toBe(4); // 3 initial + 1 new
    });

    it('should update an existing contact', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contactToUpdate = result.current.contacts[0];
      const originalCompany = contactToUpdate.company;

      await act(async () => {
        await result.current.updateContact(contactToUpdate.id, {
          company: 'Updated Company',
          title: 'Updated Title'
        });
      });

      const updatedContact = result.current.contacts.find(c => c.id === contactToUpdate.id);
      expect(updatedContact?.company).toBe('Updated Company');
      expect(updatedContact?.title).toBe('Updated Title');
      expect(updatedContact?.company).not.toBe(originalCompany);
    });

    it('should delete a contact', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contactToDelete = result.current.contacts[0];
      const initialCount = result.current.contacts.length;

      await act(async () => {
        await result.current.deleteContact(contactToDelete.id);
      });

      expect(result.current.contacts.length).toBe(initialCount - 1);
      expect(result.current.contacts.find(c => c.id === contactToDelete.id)).toBeUndefined();
    });

    it('should get contact by ID', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contactToFind = result.current.contacts[0];
      const foundContact = result.current.getContactById(contactToFind.id);

      expect(foundContact).not.toBeNull();
      expect(foundContact?.id).toBe(contactToFind.id);
      expect(foundContact?.email).toBe(contactToFind.email);
    });

    it('should get contact by email', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contactToFind = result.current.contacts[0];
      const foundContact = result.current.getContactByEmail(contactToFind.email);

      expect(foundContact).not.toBeNull();
      expect(foundContact?.id).toBe(contactToFind.id);
      expect(foundContact?.email.toLowerCase()).toBe(contactToFind.email.toLowerCase());
    });
  });

  describe('Deal Management', () => {
    it('should create a new deal', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newDeal = await act(async () => {
        return await result.current.createDeal({
          provider: CRMProvider.SALESFORCE,
          accountId: result.current.accounts[0].id,
          contactId: result.current.contacts[0].id,
          dealName: 'Test Deal',
          value: 10000,
          currency: 'USD',
          stage: DealStage.QUALIFIED
        });
      });

      expect(newDeal).not.toBeNull();
      expect(newDeal?.dealName).toBe('Test Deal');
      expect(newDeal?.value).toBe(10000);
      expect(result.current.deals.length).toBe(4); // 3 initial + 1 new
    });

    it('should update an existing deal', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dealToUpdate = result.current.deals[0];
      const originalStage = dealToUpdate.stage;

      // Update to a different stage than the original
      const newStage = originalStage === DealStage.NEGOTIATION
        ? DealStage.PROPOSAL
        : DealStage.NEGOTIATION;

      await act(async () => {
        await result.current.updateDeal(dealToUpdate.id, {
          stage: newStage,
          probability: 85
        });
      });

      const updatedDeal = result.current.deals.find(d => d.id === dealToUpdate.id);
      expect(updatedDeal?.stage).toBe(newStage);
      expect(updatedDeal?.probability).toBe(85);
      expect(updatedDeal?.stage).not.toBe(originalStage);
    });

    it('should delete a deal', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dealToDelete = result.current.deals[0];
      const initialCount = result.current.deals.length;

      await act(async () => {
        await result.current.deleteDeal(dealToDelete.id);
      });

      expect(result.current.deals.length).toBe(initialCount - 1);
      expect(result.current.deals.find(d => d.id === dealToDelete.id)).toBeUndefined();
    });

    it('should get deal by ID', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const dealToFind = result.current.deals[0];
      const foundDeal = result.current.getDealById(dealToFind.id);

      expect(foundDeal).not.toBeNull();
      expect(foundDeal?.id).toBe(dealToFind.id);
      expect(foundDeal?.dealName).toBe(dealToFind.dealName);
    });
  });

  describe('Email to CRM', () => {
    it('should log email to CRM', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activity = await act(async () => {
        return await result.current.logEmailToCRM(
          {
            id: 'email-1',
            subject: 'Test Subject',
            body: 'Test body',
            from: 'sender@example.com',
            fromName: 'Sender Name',
            to: ['recipient@example.com'],
            sentAt: new Date().toISOString()
          },
          CRMProvider.SALESFORCE,
          result.current.contacts[0].id
        );
      });

      expect(activity).not.toBeNull();
      expect(activity?.provider).toBe(CRMProvider.SALESFORCE);
      expect(activity?.emailSubject).toBe('Test Subject');
      expect(activity?.synced).toBe(true);
    });

    it('should match email to existing contact', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contact = result.current.contacts[0];
      const match = result.current.matchEmailToContact(contact.email);

      expect(match.matched).toBe(true);
      expect(match.contact).toBeDefined();
      expect(match.confidence).toBe(100);
      expect(match.matchReasons).toContain('Email address matched exactly');
    });

    it('should not match email to non-existent contact', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const match = result.current.matchEmailToContact('nonexistent@example.com');

      expect(match.matched).toBe(false);
      expect(match.contact).toBeUndefined();
      expect(match.confidence).toBe(0);
    });

    it('should create contact from email if not exists', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newEmail = 'newcontact@example.com';
      const existingContact = result.current.getContactByEmail(newEmail);
      expect(existingContact).toBeNull();

      const newContact = await act(async () => {
        return await result.current.createContactFromEmail(
          newEmail,
          'New Contact Name'
        );
      });

      expect(newContact).not.toBeNull();
      expect(newContact?.email).toBe(newEmail);
    });

    it('should return existing contact when creating from email if exists', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const existingContact = result.current.contacts[0];
      const returnedContact = await act(async () => {
        return await result.current.createContactFromEmail(
          existingContact.email,
          'Some Name'
        );
      });

      expect(returnedContact).not.toBeNull();
      expect(returnedContact?.id).toBe(existingContact.id);
    });
  });

  describe('Contact Lookup', () => {
    it('should lookup contact by email', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const contact = result.current.contacts[0];
      const resultLookup = result.current.lookupContact(contact.email);

      expect(resultLookup.found).toBe(true);
      expect(resultLookup.contacts).toHaveLength(1);
      expect(resultLookup.contacts[0].id).toBe(contact.id);
      expect(resultLookup.email).toBe(contact.email);
    });

    it('should return not found for non-existent email', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const resultLookup = result.current.lookupContact('nonexistent@example.com');

      expect(resultLookup.found).toBe(false);
      expect(resultLookup.contacts).toHaveLength(0);
    });
  });

  describe('Filtering', () => {
    it('should filter contacts by status', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredContacts({
        status: ContactStatus.CUSTOMER
      });

      filtered.forEach(contact => {
        expect(contact.status).toBe(ContactStatus.CUSTOMER);
      });
    });

    it('should filter contacts by search query', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredContacts({
        searchQuery: 'john'
      });

      filtered.forEach(contact => {
        const matchFirst = contact.firstName.toLowerCase().includes('john');
        const matchLast = contact.lastName.toLowerCase().includes('john');
        const matchEmail = contact.email.toLowerCase().includes('john');
        const matchCompany = contact.company?.toLowerCase().includes('john');
        expect(matchFirst || matchLast || matchEmail || matchCompany).toBe(true);
      });
    });

    it('should filter deals by stage', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredDeals({
        stage: DealStage.NEGOTIATION
      });

      filtered.forEach(deal => {
        expect(deal.stage).toBe(DealStage.NEGOTIATION);
      });
    });

    it('should filter deals by value range', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredDeals({
        minValue: 20000,
        maxValue: 60000
      });

      filtered.forEach(deal => {
        expect(deal.value).toBeGreaterThanOrEqual(20000);
        expect(deal.value).toBeLessThanOrEqual(60000);
      });
    });
  });

  describe('Statistics', () => {
    it('should get statistics for all accounts', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getStatistics();

      expect(stats).toHaveLength(2);
      stats.forEach(stat => {
        expect(stat.totalContacts).toBeGreaterThanOrEqual(0);
        expect(stat.totalDeals).toBeGreaterThanOrEqual(0);
        expect(stat.totalValue).toBeGreaterThanOrEqual(0);
        expect(stat.topContacts).toBeDefined();
      });
    });

    it('should get statistics for specific account', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const account = result.current.accounts[0];
      const stats = result.current.getStatistics(account.id);

      expect(stats).toHaveLength(1);
      expect(stats[0].accountId).toBe(account.id);
      expect(stats[0].provider).toBe(account.provider);
    });
  });

  describe('Sync Operations', () => {
    it('should sync contacts', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const account = result.current.accounts[0];

      const job = await act(async () => {
        return await result.current.syncContacts(account.id);
      });

      expect(job.status).toBe(SyncStatus.COMPLETED);
      expect(job.type).toBe('contact_sync');
      expect(job.recordsProcessed).toBeGreaterThan(0);
      expect(job.recordsSucceeded).toBeGreaterThan(0);
    });

    it('should sync deals', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const account = result.current.accounts[0];

      const job = await act(async () => {
        return await result.current.syncDeals(account.id);
      });

      expect(job.status).toBe(SyncStatus.COMPLETED);
      expect(job.type).toBe('deal_sync');
      expect(job.recordsProcessed).toBeGreaterThan(0);
    });

    it('should sync all data', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const account = result.current.accounts[0];

      const job = await act(async () => {
        return await result.current.syncAll(account.id);
      });

      expect(job.status).toBe(SyncStatus.COMPLETED);
      expect(job.type).toBe('full_sync');
      expect(job.recordsProcessed).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should set selected account', async () => {
      const { result } = renderHook(() => useCrmIntegration());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const accountToSelect = result.current.accounts[0];

      act(() => {
        result.current.setSelectedAccount(accountToSelect);
      });

      expect(result.current.selectedAccount).toBe(accountToSelect);
    });
  });
});
