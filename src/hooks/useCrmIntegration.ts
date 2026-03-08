import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CRMAccount,
  CRMContact,
  CRMDeal,
  SyncConfiguration,
  SyncJob,
  EmailActivity,
  ConnectCRMAccountPayload,
  CreateContactPayload,
  UpdateContactPayload,
  CreateDealPayload,
  UpdateDealPayload,
  ContactFilter,
  DealFilter,
  FieldMapping,
  CRMStatistics,
  EmailContactMatch,
  ContactLookupResult,
  CRMProvider,
  ContactStatus,
  DealStage,
  SyncStatus,
  FieldType
} from '../types/crmIntegration';

/**
 * CRM Integration Hook
 *
 * Provides functionality for integrating with CRM platforms including:
 * - Account connection management
 * - Contact synchronization
 * - Deal management
 * - Email to CRM logging
 * - Field mapping
 */

const currentUser = {
  id: 'user-1',
  name: 'Current User'
};

// Mock data generators
const generateMockAccounts = (): CRMAccount[] => {
  return [
    {
      id: 'acc-1',
      provider: CRMProvider.SALESFORCE,
      name: 'Salesforce Production',
      email: 'sales@company.com',
      isActive: true,
      isConnected: true,
      lastSyncAt: '2025-01-20T10:30:00Z',
      syncFrequency: 30,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'acc-2',
      provider: CRMProvider.HUBSPOT,
      name: 'HubSpot Marketing',
      email: 'marketing@company.com',
      isActive: true,
      isConnected: true,
      lastSyncAt: '2025-01-20T09:15:00Z',
      syncFrequency: 60,
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-20T09:15:00Z'
    }
  ];
};

const generateMockContacts = (): CRMContact[] => {
  return [
    {
      id: 'con-1',
      provider: CRMProvider.SALESFORCE,
      providerContactId: 'sf-001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@acme.com',
      phone: '+1-555-0100',
      company: 'ACME Corp',
      title: 'CEO',
      status: ContactStatus.CUSTOMER,
      source: 'Web Form',
      lastContacted: '2025-01-18T14:00:00Z',
      customFields: {},
      createdAt: '2024-06-15T00:00:00Z',
      updatedAt: '2025-01-18T14:00:00Z',
      syncedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'con-2',
      provider: CRMProvider.SALESFORCE,
      providerContactId: 'sf-002',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@techstart.io',
      phone: '+1-555-0101',
      company: 'TechStart',
      title: 'CTO',
      status: ContactStatus.PROSPECT,
      source: 'Trade Show',
      lastContacted: '2025-01-15T09:30:00Z',
      customFields: {},
      createdAt: '2024-08-20T00:00:00Z',
      updatedAt: '2025-01-15T09:30:00Z',
      syncedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'con-3',
      provider: CRMProvider.HUBSPOT,
      providerContactId: 'hs-001',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'mjohnson@enterprise.com',
      phone: '+1-555-0200',
      company: 'Enterprise Inc',
      title: 'Procurement Manager',
      status: ContactStatus.LEAD,
      source: 'Email Campaign',
      customFields: {},
      createdAt: '2024-11-10T00:00:00Z',
      updatedAt: '2024-11-10T00:00:00Z',
      syncedAt: '2025-01-20T09:15:00Z'
    }
  ];
};

const generateMockDeals = (): CRMDeal[] => {
  return [
    {
      id: 'deal-1',
      provider: CRMProvider.SALESFORCE,
      providerDealId: 'sf-deal-001',
      contactId: 'con-1',
      contactName: 'John Smith',
      dealName: 'Enterprise License',
      value: 50000,
      currency: 'USD',
      stage: DealStage.NEGOTIATION,
      expectedCloseDate: '2025-02-28',
      probability: 75,
      description: 'Enterprise license for ACME Corp',
      customFields: {},
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-19T11:00:00Z',
      syncedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'deal-2',
      provider: CRMProvider.SALESFORCE,
      providerDealId: 'sf-deal-002',
      contactId: 'con-2',
      contactName: 'Jane Doe',
      dealName: 'Startup Package',
      value: 15000,
      currency: 'USD',
      stage: DealStage.PROPOSAL,
      expectedCloseDate: '2025-03-15',
      probability: 50,
      description: 'Startup package for TechStart',
      customFields: {},
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-18T14:00:00Z',
      syncedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'deal-3',
      provider: CRMProvider.HUBSPOT,
      providerDealId: 'hs-deal-001',
      contactId: 'con-3',
      contactName: 'Michael Johnson',
      dealName: 'Annual Subscription',
      value: 25000,
      currency: 'USD',
      stage: DealStage.QUALIFIED,
      expectedCloseDate: '2025-04-01',
      probability: 25,
      description: 'Annual subscription for Enterprise Inc',
      customFields: {},
      createdAt: '2025-01-12T00:00:00Z',
      updatedAt: '2025-01-12T00:00:00Z',
      syncedAt: '2025-01-20T09:15:00Z'
    }
  ];
};

export const useCrmIntegration = () => {
  // State
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [emailActivities, setEmailActivities] = useState<EmailActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<CRMAccount | null>(null);

  // Initialize mock data
  useEffect(() => {
    setTimeout(() => {
      setAccounts(generateMockAccounts());
      setContacts(generateMockContacts());
      setDeals(generateMockDeals());
      setIsLoading(false);
    }, 500);
  }, []);

  // Account Management
  const connectAccount = useCallback(async (
    payload: ConnectCRMAccountPayload
  ): Promise<CRMAccount | null> => {
    const newAccount: CRMAccount = {
      id: `acc-${Date.now()}`,
      provider: payload.provider,
      name: payload.name,
      email: payload.email,
      isActive: true,
      isConnected: true,
      syncFrequency: payload.syncFrequency || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  }, []);

  const disconnectAccount = useCallback(async (accountId: string): Promise<boolean> => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, isConnected: false, isActive: false };
      }
      return acc;
    }));
    return true;
  }, []);

  const refreshAccountToken = useCallback(async (
    accountId: string
  ): Promise<boolean> => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
return false;
}

    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, updatedAt: new Date().toISOString() };
      }
      return acc;
    }));
    return true;
  }, [accounts]);

  const getAccountById = useCallback((accountId: string): CRMAccount | null => {
    return accounts.find(a => a.id === accountId) || null;
  }, [accounts]);

  // Contact Management
  const createContact = useCallback(async (
    payload: CreateContactPayload
  ): Promise<CRMContact | null> => {
    const newContact: CRMContact = {
      id: `con-${Date.now()}`,
      provider: payload.provider,
      providerContactId: `local-${Date.now()}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      title: payload.title,
      status: payload.status || ContactStatus.PROSPECT,
      customFields: payload.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  const updateContact = useCallback(async (
    contactId: string,
    payload: UpdateContactPayload
  ): Promise<CRMContact | null> => {
    let updatedContact: CRMContact | null = null;

    setContacts(prev => prev.map(contact => {
      if (contact.id === contactId) {
        updatedContact = {
          ...contact,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        return updatedContact;
      }
      return contact;
    }));

    return updatedContact;
  }, []);

  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    return true;
  }, []);

  const getContactById = useCallback((contactId: string): CRMContact | null => {
    return contacts.find(c => c.id === contactId) || null;
  }, [contacts]);

  const getContactByEmail = useCallback((email: string): CRMContact | null => {
    return contacts.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
  }, [contacts]);

  // Deal Management
  const createDeal = useCallback(async (
    payload: CreateDealPayload
  ): Promise<CRMDeal | null> => {
    const contact = payload.contactId ? getContactById(payload.contactId) : null;

    const newDeal: CRMDeal = {
      id: `deal-${Date.now()}`,
      provider: payload.provider,
      providerDealId: `local-${Date.now()}`,
      contactId: payload.contactId || '',
      contactName: contact ? `${contact.firstName} ${contact.lastName}` : '',
      dealName: payload.dealName,
      value: payload.value,
      currency: payload.currency,
      stage: payload.stage || DealStage.QUALIFIED,
      expectedCloseDate: payload.expectedCloseDate,
      probability: payload.probability || 10,
      description: payload.description,
      customFields: payload.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDeals(prev => [...prev, newDeal]);
    return newDeal;
  }, [getContactById]);

  const updateDeal = useCallback(async (
    dealId: string,
    payload: UpdateDealPayload
  ): Promise<CRMDeal | null> => {
    let updatedDeal: CRMDeal | null = null;

    setDeals(prev => prev.map(deal => {
      if (deal.id === dealId) {
        updatedDeal = {
          ...deal,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        return updatedDeal;
      }
      return deal;
    }));

    return updatedDeal;
  }, []);

  const deleteDeal = useCallback(async (dealId: string): Promise<boolean> => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
    return true;
  }, []);

  const getDealById = useCallback((dealId: string): CRMDeal | null => {
    return deals.find(d => d.id === dealId) || null;
  }, [deals]);

  // Email to CRM
  const logEmailToCRM = useCallback(async (
    emailData: {
      id: string;
      subject: string;
      body?: string;
      from: string;
      fromName?: string;
      to: string[];
      cc?: string[];
      sentAt: string;
    },
    provider: CRMProvider,
    contactId?: string,
    dealId?: string
  ): Promise<EmailActivity | null> => {
    const activity: EmailActivity = {
      id: `act-${Date.now()}`,
      provider,
      emailId: emailData.id,
      emailSubject: emailData.subject,
      emailBody: emailData.body,
      fromEmail: emailData.from,
      fromName: emailData.fromName,
      toEmails: emailData.to,
      ccEmails: emailData.cc,
      sentAt: emailData.sentAt,
      contactId,
      dealId,
      activityType: 'email_sent',
      synced: true,
      syncedAt: new Date().toISOString()
    };

    setEmailActivities(prev => [...prev, activity]);
    return activity;
  }, []);

  const matchEmailToContact = useCallback((
    email: string
  ): EmailContactMatch => {
    const contact = getContactByEmail(email);

    if (contact) {
      return {
        matched: true,
        contact,
        confidence: 100,
        matchReasons: ['Email address matched exactly']
      };
    }

    // Try partial match by domain
    const domain = email.split('@')[1];
    const partialMatch = contacts.find(c =>
      c.email.toLowerCase().endsWith(domain.toLowerCase())
    );

    if (partialMatch) {
      return {
        matched: false,
        confidence: 30,
        matchReasons: ['Domain matched with existing contact']
      };
    }

    return {
      matched: false,
      confidence: 0,
      matchReasons: []
    };
  }, [contacts, getContactByEmail]);

  const createContactFromEmail = useCallback(async (
    email: string,
    name?: string,
    provider?: CRMProvider
  ): Promise<CRMContact | null> => {
    const existingContact = getContactByEmail(email);
    if (existingContact) {
return existingContact;
}

    // Parse name
    let firstName = '';
    let lastName = '';
    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    return createContact({
      provider: provider || CRMProvider.SALESFORCE,
      accountId: accounts[0]?.id || '',
      firstName: firstName || 'Unknown',
      lastName: lastName || 'Contact',
      email,
      status: ContactStatus.LEAD
    });
  }, [accounts, getContactByEmail, createContact]);

  // Contact Lookup
  const lookupContact = useCallback((
    email: string
  ): ContactLookupResult => {
    const matchingContacts = contacts.filter(c =>
      c.email.toLowerCase().includes(email.toLowerCase())
    );

    const providers = [...new Set(matchingContacts.map(c => c.provider))];

    return {
      found: matchingContacts.length > 0,
      contacts: matchingContacts,
      email,
      providers
    };
  }, [contacts]);

  // Filtering
  const getFilteredContacts = useCallback((filter: ContactFilter): CRMContact[] => {
    return contacts.filter(contact => {
      if (filter.provider && contact.provider !== filter.provider) {
return false;
}
      if (filter.accountId) {
        // In real implementation, would check account association
      }
      if (filter.status && contact.status !== filter.status) {
return false;
}
      if (filter.company && !contact.company?.toLowerCase().includes(filter.company.toLowerCase())) {
return false;
}

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchFirstName = contact.firstName.toLowerCase().includes(query);
        const matchLastName = contact.lastName.toLowerCase().includes(query);
        const matchEmail = contact.email.toLowerCase().includes(query);
        const matchCompany = contact.company?.toLowerCase().includes(query);
        if (!matchFirstName && !matchLastName && !matchEmail && !matchCompany) {
return false;
}
      }

      return true;
    });
  }, [contacts]);

  const getFilteredDeals = useCallback((filter: DealFilter): CRMDeal[] => {
    return deals.filter(deal => {
      if (filter.provider && deal.provider !== filter.provider) {
return false;
}
      if (filter.stage && deal.stage !== filter.stage) {
return false;
}
      if (filter.contactId && deal.contactId !== filter.contactId) {
return false;
}
      if (filter.minValue !== undefined && deal.value < filter.minValue) {
return false;
}
      if (filter.maxValue !== undefined && deal.value > filter.maxValue) {
return false;
}

      return true;
    });
  }, [deals]);

  // Statistics
  const getStatistics = useCallback((accountId?: string): CRMStatistics[] => {
    const relevantAccounts = accountId
      ? accounts.filter(a => a.id === accountId)
      : accounts;

    return relevantAccounts.map(account => {
      const accountContacts = contacts.filter(c => c.provider === account.provider);
      const accountDeals = deals.filter(d => d.provider === account.provider);

      const wonDeals = accountDeals.filter(d => d.stage === DealStage.WON);
      const openDeals = accountDeals.filter(d =>
        d.stage !== DealStage.WON && d.stage !== DealStage.LOST
      );

      const topContacts = accountContacts
        .map(contact => {
          const contactDeals = accountDeals.filter(d => d.contactId === contact.id);
          return {
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            company: contact.company || '',
            dealCount: contactDeals.length
          };
        })
        .sort((a, b) => b.dealCount - a.dealCount)
        .slice(0, 5);

      return {
        provider: account.provider,
        accountId: account.id,
        totalContacts: accountContacts.length,
        totalDeals: accountDeals.length,
        totalValue: accountDeals.reduce((sum, d) => sum + d.value, 0),
        wonDeals: wonDeals.length,
        wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
        openDeals: openDeals.length,
        openValue: openDeals.reduce((sum, d) => sum + d.value, 0),
        lastSyncAt: account.lastSyncAt,
        syncSuccessRate: 98.5,
        topContacts
      };
    });
  }, [accounts, contacts, deals]);

  // Sync Operations
  const syncContacts = useCallback(async (
    accountId: string
  ): Promise<SyncJob> => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
throw new Error('Account not found');
}

    const job: SyncJob = {
      id: `job-${Date.now()}`,
      accountId,
      provider: account.provider,
      type: 'contact_sync',
      status: SyncStatus.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: contacts.length,
      recordsSucceeded: contacts.length,
      recordsFailed: 0
    };

    setSyncJobs(prev => [...prev, job]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, lastSyncAt: new Date().toISOString() };
      }
      return acc;
    }));

    return job;
  }, [accounts, contacts]);

  const syncDeals = useCallback(async (
    accountId: string
  ): Promise<SyncJob> => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
throw new Error('Account not found');
}

    const job: SyncJob = {
      id: `job-${Date.now()}`,
      accountId,
      provider: account.provider,
      type: 'deal_sync',
      status: SyncStatus.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: deals.length,
      recordsSucceeded: deals.length,
      recordsFailed: 0
    };

    setSyncJobs(prev => [...prev, job]);
    return job;
  }, [accounts, deals]);

  const syncAll = useCallback(async (
    accountId: string
  ): Promise<SyncJob> => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
throw new Error('Account not found');
}

    const totalRecords = contacts.length + deals.length;
    const job: SyncJob = {
      id: `job-${Date.now()}`,
      accountId,
      provider: account.provider,
      type: 'full_sync',
      status: SyncStatus.COMPLETED,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: totalRecords,
      recordsSucceeded: totalRecords,
      recordsFailed: 0
    };

    setSyncJobs(prev => [...prev, job]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, lastSyncAt: new Date().toISOString() };
      }
      return acc;
    }));

    return job;
  }, [accounts, contacts, deals]);

  return {
    // State
    accounts,
    contacts,
    deals,
    syncJobs,
    emailActivities,
    isLoading,
    selectedAccount,

    // Setters
    setSelectedAccount,

    // Account Management
    connectAccount,
    disconnectAccount,
    refreshAccountToken,
    getAccountById,

    // Contact Management
    createContact,
    updateContact,
    deleteContact,
    getContactById,
    getContactByEmail,

    // Deal Management
    createDeal,
    updateDeal,
    deleteDeal,
    getDealById,

    // Email to CRM
    logEmailToCRM,
    matchEmailToContact,
    createContactFromEmail,

    // Lookup
    lookupContact,

    // Filtering
    getFilteredContacts,
    getFilteredDeals,

    // Statistics
    getStatistics,

    // Sync
    syncContacts,
    syncDeals,
    syncAll
  };
};
