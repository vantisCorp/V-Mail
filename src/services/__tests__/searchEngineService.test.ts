/**
 * Search Engine Service Tests
 * 
 * Tests for Lunr.js-based full-text search functionality
 */

import { SearchEngineService } from '../searchEngineService';
import { SearchScope, SearchFieldType, SearchOperator } from '../../types/enhancedSearch';
import { Email } from '../../types/email';
import { Contact, ContactProvider } from '../../types/contacts';
import { CalendarEvent } from '../../types/calendar';

describe('SearchEngineService', () => {
  let service: SearchEngineService;

  const mockEmail: Email = {
    id: 'email-1',
    subject: 'Project Update: Q4 Goals',
    from: 'john.smith@company.com',
    to: 'team@company.com',
    body: 'I wanted to share the latest updates on our Q4 goals. We have made significant progress on the product launch timeline.',
    date: new Date('2024-01-15T10:00:00Z'),
    read: false,
    starred: true,
    encrypted: false,
    hasAttachments: true,
    attachments: [{ id: '1', name: 'report.pdf', size: 5000, type: 'application/pdf', url: '/files/report.pdf', uploadedAt: new Date() }],
    folder: { id: 'inbox', name: 'Inbox', count: 1, icon: 'inbox' },
  };

  const mockEmail2: Email = {
    id: 'email-2',
    subject: 'Meeting Reminder: Product Review',
    from: 'calendar@company.com',
    to: 'me@company.com',
    body: 'This is a reminder about our product review meeting scheduled for tomorrow at 2 PM.',
    date: new Date('2024-01-14T09:00:00Z'),
    read: true,
    starred: false,
    encrypted: false,
    hasAttachments: false,
    attachments: [],
    folder: { id: 'inbox', name: 'Inbox', count: 2, icon: 'inbox' },
  };

  const mockContact: Contact = {
    id: 'contact-1',
    provider: ContactProvider.LOCAL,
    providerContactId: 'local-1',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    emails: [{ email: 'john.doe@example.com', type: 'work', isPrimary: true }],
    phones: [{ number: '+1-555-1234', type: 'mobile' }],
    organization: { name: 'Tech Corp', title: 'Software Engineer' },
    notes: 'Important client from the conference',
    tags: ['vip', 'client'],
    addresses: [],
    websites: [],
    socials: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  const mockContact2: Contact = {
    id: 'contact-2',
    provider: ContactProvider.GOOGLE,
    providerContactId: 'google-1',
    displayName: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    emails: [{ email: 'jane.smith@example.com', type: 'work', isPrimary: true }],
    phones: [],
    organization: { name: 'Design Studio', title: 'Designer' },
    notes: '',
    tags: ['designer'],
    addresses: [],
    websites: [],
    socials: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  const mockEvent: CalendarEvent = {
    id: 'event-1',
    title: 'Team Standup Meeting',
    summary: 'Team Standup Meeting',
    description: 'Daily standup meeting with the development team',
    location: 'Conference Room A',
    start: { dateTime: '2024-01-16T09:00:00Z' },
    end: { dateTime: '2024-01-16T09:30:00Z' },
    attendees: [
      { email: 'team@company.com', name: 'Team' },
      { email: 'john@company.com', name: 'John' },
    ],
    organizer: { email: 'manager@company.com', name: 'Manager' },
    status: 'confirmed',
  };

  const mockEvent2: CalendarEvent = {
    id: 'event-2',
    title: 'Product Launch',
    summary: 'Product Launch',
    description: 'Launch event for the new product version',
    location: 'Main Hall',
    start: { dateTime: '2024-01-20T14:00:00Z' },
    end: { dateTime: '2024-01-20T18:00:00Z' },
    attendees: [],
    organizer: { email: 'marketing@company.com', name: 'Marketing Team' },
    status: 'confirmed',
  };

  beforeEach(() => {
    service = new SearchEngineService();
  });

  describe('initialization', () => {
    it('should initialize with empty indices', () => {
      const stats = service.getStats();
      expect(stats.emails).toBe(0);
      expect(stats.contacts).toBe(0);
      expect(stats.events).toBe(0);
    });

    it('should have empty search history', () => {
      expect(service.getHistory()).toEqual([]);
    });
  });

  describe('email indexing', () => {
    it('should index a single email', () => {
      service.indexEmail(mockEmail);
      
      const stats = service.getStats();
      expect(stats.emails).toBe(1);
    });

    it('should index multiple emails', () => {
      service.indexEmails([mockEmail, mockEmail2]);
      
      const stats = service.getStats();
      expect(stats.emails).toBe(2);
    });

    it('should remove an email from index', () => {
      service.indexEmail(mockEmail);
      expect(service.getStats().emails).toBe(1);
      
      service.removeEmail('email-1');
      expect(service.getStats().emails).toBe(0);
    });
  });

  describe('contact indexing', () => {
    it('should index a single contact', () => {
      service.indexContact(mockContact);
      
      const stats = service.getStats();
      expect(stats.contacts).toBe(1);
    });

    it('should index multiple contacts', () => {
      service.indexContacts([mockContact, mockContact2]);
      
      const stats = service.getStats();
      expect(stats.contacts).toBe(2);
    });

    it('should remove a contact from index', () => {
      service.indexContact(mockContact);
      expect(service.getStats().contacts).toBe(1);
      
      service.removeContact('contact-1');
      expect(service.getStats().contacts).toBe(0);
    });
  });

  describe('event indexing', () => {
    it('should index a single event', () => {
      service.indexEvent(mockEvent);
      
      const stats = service.getStats();
      expect(stats.events).toBe(1);
    });

    it('should index multiple events', () => {
      service.indexEvents([mockEvent, mockEvent2]);
      
      const stats = service.getStats();
      expect(stats.events).toBe(2);
    });

    it('should remove an event from index', () => {
      service.indexEvent(mockEvent);
      expect(service.getStats().events).toBe(1);
      
      service.removeEvent('event-1');
      expect(service.getStats().events).toBe(0);
    });
  });

  describe('email search', () => {
    beforeEach(() => {
      service.indexEmails([mockEmail, mockEmail2]);
    });

    it('should find emails by subject', () => {
      const results = service.searchEmails('Project');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.id === 'email-email-1')).toBe(true);
    });

    it('should find emails by sender email', () => {
      const results = service.searchEmails('john.smith@company.com');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should find emails by body content', () => {
      const results = service.searchEmails('Q4 goals');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = service.searchEmails('nonexistent content that does not exist');
      
      expect(results).toEqual([]);
    });

    it('should return results with correct type', () => {
      const results = service.searchEmails('Project');
      
      expect(results[0].type).toBe('email');
    });

    it('should return results with score', () => {
      const results = service.searchEmails('Project');
      
      expect(results[0].score).toBeGreaterThan(0);
    });
  });

  describe('contact search', () => {
    beforeEach(() => {
      service.indexContacts([mockContact, mockContact2]);
    });

    it('should find contacts by name', () => {
      const results = service.searchContacts('John Doe');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.id === 'contact-contact-1')).toBe(true);
    });

    it('should find contacts by email', () => {
      const results = service.searchContacts('john.doe@example.com');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find contacts by company', () => {
      const results = service.searchContacts('Tech Corp');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find contacts by job title', () => {
      const results = service.searchContacts('Software Engineer');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find contacts by tag', () => {
      const results = service.searchContacts('vip');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results with correct type', () => {
      const results = service.searchContacts('John');
      
      expect(results[0].type).toBe('contact');
    });
  });

  describe('event search', () => {
    beforeEach(() => {
      service.indexEvents([mockEvent, mockEvent2]);
    });

    it('should find events by title', () => {
      const results = service.searchEvents('Standup');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.id === 'event-event-1')).toBe(true);
    });

    it('should find events by description', () => {
      const results = service.searchEvents('development team');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find events by location', () => {
      const results = service.searchEvents('Conference Room');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find events by attendee', () => {
      const results = service.searchEvents('team@company.com');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results with correct type', () => {
      const results = service.searchEvents('Meeting');
      
      expect(results[0].type).toBe('event');
    });
  });

  describe('search all', () => {
    beforeEach(() => {
      service.indexEmails([mockEmail, mockEmail2]);
      service.indexContacts([mockContact, mockContact2]);
      service.indexEvents([mockEvent, mockEvent2]);
    });

    it('should search across all types', () => {
      const results = service.searchAll('Project');
      
      expect(results.some(r => r.type === 'email')).toBe(true);
    });

    it('should return results sorted by score', () => {
      const results = service.searchAll('John');
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should respect scope parameter', () => {
      const allResults = service.searchAll('Project', SearchScope.ALL);
      const inboxResults = service.searchAll('Project', SearchScope.INBOX);
      
      expect(allResults.length).toBeGreaterThanOrEqual(inboxResults.length);
    });
  });

  describe('natural language query parsing', () => {
    it('should parse "from:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('from:john@example.com hello');
      
      expect(parsed.operators.from).toBe('john@example.com');
      expect(parsed.filters.some(f => f.field === SearchFieldType.FROM)).toBe(true);
    });

    it('should parse "to:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('to:team@company.com meeting');
      
      expect(parsed.operators.to).toBe('team@company.com');
      expect(parsed.filters.some(f => f.field === SearchFieldType.TO)).toBe(true);
    });

    it('should parse "subject:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('subject:"Project Update" review');
      
      expect(parsed.operators.subject).toBeDefined();
    });

    it('should parse "has:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('has:attachment report');
      
      expect(parsed.operators.has).toContain('attachment');
    });

    it('should parse "is:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('is:starred important');
      
      expect(parsed.operators.is).toContain('starred');
    });

    it('should parse "before:" date operator', () => {
      const parsed = service.parseNaturalLanguageQuery('before:2024-01-20 report');
      
      expect(parsed.operators.before).toBe('2024-01-20');
      expect(parsed.filters.some(f => f.operator === SearchOperator.BEFORE)).toBe(true);
    });

    it('should parse "after:" date operator', () => {
      const parsed = service.parseNaturalLanguageQuery('after:2024-01-01 report');
      
      expect(parsed.operators.after).toBe('2024-01-01');
      expect(parsed.filters.some(f => f.operator === SearchOperator.AFTER)).toBe(true);
    });

    it('should parse "label:" operator', () => {
      const parsed = service.parseNaturalLanguageQuery('label:Important work');
      
      expect(parsed.operators.label).toBe('Important');
      expect(parsed.filters.some(f => f.field === SearchFieldType.LABELS)).toBe(true);
    });

    it('should parse "in:" folder operator', () => {
      const parsed = service.parseNaturalLanguageQuery('in:inbox project');
      
      expect(parsed.operators.folder).toBe('inbox');
    });

    it('should parse multiple operators', () => {
      const parsed = service.parseNaturalLanguageQuery('from:john subject:Project has:attachment report');
      
      expect(parsed.operators.from).toBe('john');
      expect(parsed.operators.subject).toBe('Project');
      expect(parsed.operators.has).toContain('attachment');
    });

    it('should return clean text after removing operators', () => {
      const parsed = service.parseNaturalLanguageQuery('from:john hello world');
      
      expect(parsed.text).toBe('hello world');
    });
  });

  describe('search suggestions', () => {
    beforeEach(() => {
      service.indexEmails([mockEmail]);
      service.addToHistory('Project update');
      service.addToHistory('Meeting notes');
    });

    it('should return history suggestions', () => {
      const suggestions = service.getSuggestions('Pro');
      
      expect(suggestions.some(s => s.text === 'Project update')).toBe(true);
    });

    it('should return email suggestions', () => {
      const suggestions = service.getSuggestions('john');
      
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return operator suggestions', () => {
      const suggestions = service.getSuggestions('fr');
      
      expect(suggestions.some(s => s.text === 'from:')).toBe(true);
    });

    it('should limit suggestions', () => {
      const suggestions = service.getSuggestions('a', 3);
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should sort suggestions by score', () => {
      const suggestions = service.getSuggestions('Project');
      
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });
  });

  describe('search history', () => {
    it('should add to history', () => {
      service.addToHistory('test query');
      
      expect(service.getHistory()).toContain('test query');
    });

    it('should add recent queries to the beginning', () => {
      service.addToHistory('first');
      service.addToHistory('second');
      
      const history = service.getHistory();
      expect(history[0]).toBe('second');
      expect(history[1]).toBe('first');
    });

    it('should not add empty queries', () => {
      service.addToHistory('');
      service.addToHistory('   ');
      
      expect(service.getHistory()).toEqual([]);
    });

    it('should move existing query to beginning', () => {
      service.addToHistory('first');
      service.addToHistory('second');
      service.addToHistory('first');
      
      const history = service.getHistory();
      expect(history[0]).toBe('first');
      expect(history.length).toBe(2);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 100; i++) {
        service.addToHistory(`query ${i}`);
      }
      
      expect(service.getHistory().length).toBeLessThanOrEqual(50);
    });

    it('should clear history', () => {
      service.addToHistory('test1');
      service.addToHistory('test2');
      
      service.clearHistory();
      
      expect(service.getHistory()).toEqual([]);
    });
  });

  describe('highlights', () => {
    beforeEach(() => {
      service.indexEmail(mockEmail);
    });

    it('should generate highlights for matching result', () => {
      const results = service.searchEmails('Project');
      
      if (results.length > 0) {
        const highlights = service.generateHighlights(results[0], 'Project');
        expect(highlights.length).toBeGreaterThan(0);
      }
    });
  });

  describe('clear all', () => {
    it('should clear all indices', () => {
      service.indexEmail(mockEmail);
      service.indexContact(mockContact);
      service.indexEvent(mockEvent);
      
      service.clearAll();
      
      const stats = service.getStats();
      expect(stats.emails).toBe(0);
      expect(stats.contacts).toBe(0);
      expect(stats.events).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should return correct statistics', () => {
      service.indexEmails([mockEmail, mockEmail2]);
      service.indexContacts([mockContact]);
      service.indexEvents([mockEvent, mockEvent2]);
      
      const stats = service.getStats();
      
      expect(stats.emails).toBe(2);
      expect(stats.contacts).toBe(1);
      expect(stats.events).toBe(2);
    });
  });
});