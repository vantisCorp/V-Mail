/**
 * Search Engine Service
 *
 * Provides full-text search capabilities using Lunr.js for:
 * - Emails (subject, body, from, to, cc, bcc)
 * - Contacts (name, email, phone, company)
 * - Calendar Events (title, description, location, attendees)
 *
 * Features:
 * - Real-time indexing
 * - Natural language query parsing
 * - Search suggestions
 * - Highlight generation
 * - Multi-field search
 * - Relevance scoring
 */

import lunr from 'lunr';
import {
  SearchScope,
  SearchFieldType,
  SearchOperator,
  SearchFilter,
  SearchResultItem,
  SearchSuggestion,
  SuggestionType
} from '../types/enhancedSearch';
import { Email } from '../types';
import { Contact } from '../types/contacts';
import { CalendarEvent } from '../types/calendar';

// Index document types
interface IndexedEmail {
  id: string;
  type: 'email';
  subject: string;
  from: string;
  fromName: string;
  to: string;
  cc: string;
  bcc: string;
  body: string;
  labels: string;
  folder: string;
  date: string;
  size: number;
  hasAttachments: boolean;
  priority: string;
}

interface IndexedContact {
  id: string;
  type: 'contact';
  displayName: string;
  firstName: string;
  lastName: string;
  emails: string;
  phones: string;
  company: string;
  jobTitle: string;
  notes: string;
  tags: string;
}

interface IndexedEvent {
  id: string;
  type: 'event';
  title: string;
  description: string;
  location: string;
  attendees: string;
  organizer: string;
  status: string;
  startDate: string;
  endDate: string;
}

type IndexedDocument = IndexedEmail | IndexedContact | IndexedEvent;

// Search result with metadata
export interface SearchResult {
  id: string;
  type: 'email' | 'contact' | 'event';
  score: number;
  matches: string[];
}

// Natural language query patterns
const NL_PATTERNS = {
  from: /(?:from|sender):\s*["']?([^"'\s]+(?:\s+[^"'\s]+)*)["']?/gi,
  to: /(?:to|recipient):\s*["']?([^"'\s]+(?:\s+[^"'\s]+)*)["']?/gi,
  subject: /(?:subject|title):\s*["']?([^"']+)["']?/gi,
  has: /has:\s*(attachment|attachments|label|star|flag)/gi,
  is: /is:\s*(read|unread|starred|important|draft|sent)/gi,
  before: /before:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
  after: /after:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
  date: /date:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
  larger: /larger:\s*(\d+)(kb|mb|gb)?/gi,
  smaller: /smaller:\s*(\d+)(kb|mb|gb)?/gi,
  label: /label:\s*["']?([^"'\s]+)["']?/gi,
  folder: /in:\s*["']?([^"'\s]+)["']?/gi
};

/**
 * Search Engine Service Class
 */
export class SearchEngineService {
  private emailIndex: lunr.Index | null = null;
  private contactIndex: lunr.Index | null = null;
  private eventIndex: lunr.Index | null = null;

  private emails: Map<string, IndexedEmail> = new Map();
  private contacts: Map<string, IndexedContact> = new Map();
  private events: Map<string, IndexedEvent> = new Map();

  private searchHistory: string[] = [];
  private readonly maxHistorySize = 50;

  constructor() {
    this.initializeIndices();
  }

  /**
   * Initialize all Lunr indices
   */
  private initializeIndices(): void {
    // Email index
    this.emailIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('subject', { boost: 10 });
      this.field('from', { boost: 8 });
      this.field('fromName', { boost: 8 });
      this.field('to', { boost: 5 });
      this.field('cc', { boost: 3 });
      this.field('bcc', { boost: 3 });
      this.field('body', { boost: 1 });
      this.field('labels', { boost: 4 });
      this.field('folder', { boost: 2 });

      // Add pipeline functions for better tokenization
      this.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
    });

    // Contact index
    this.contactIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('displayName', { boost: 10 });
      this.field('firstName', { boost: 8 });
      this.field('lastName', { boost: 8 });
      this.field('emails', { boost: 6 });
      this.field('phones', { boost: 4 });
      this.field('company', { boost: 5 });
      this.field('jobTitle', { boost: 3 });
      this.field('notes', { boost: 1 });
      this.field('tags', { boost: 4 });

      this.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
    });

    // Event index
    this.eventIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('location', { boost: 4 });
      this.field('attendees', { boost: 3 });
      this.field('organizer', { boost: 4 });
      this.field('status', { boost: 2 });

      this.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
    });
  }

  /**
   * Index an email document
   */
  public indexEmail(email: Email): void {
    const indexed: IndexedEmail = {
      id: `email-${email.id}`,
      type: 'email',
      subject: email.subject || '',
      from: typeof email.from === 'string' ? email.from : '',
      fromName: '',
      to: typeof email.to === 'string' ? email.to : '',
      cc: '',
      bcc: '',
      body: email.body || '',
      labels: '',
      folder: email.folder?.name || 'inbox',
      date: email.date?.toISOString() || '',
      size: 0,
      hasAttachments: email.hasAttachments || false,
      priority: 'normal'
    };

    this.emails.set(indexed.id, indexed);

    // Rebuild email index with new document
    this.rebuildEmailIndex();
  }

  /**
   * Index multiple emails at once
   */
  public indexEmails(emails: Email[]): void {
    emails.forEach((email) => {
      const indexed: IndexedEmail = {
        id: `email-${email.id}`,
        type: 'email',
        subject: email.subject || '',
        from: typeof email.from === 'string' ? email.from : '',
        fromName: '',
        to: typeof email.to === 'string' ? email.to : '',
        cc: '',
        bcc: '',
        body: email.body || '',
        labels: '',
        folder: email.folder?.name || 'inbox',
        date: email.date?.toISOString() || '',
        size: 0,
        hasAttachments: email.hasAttachments || false,
        priority: 'normal'
      };
      this.emails.set(indexed.id, indexed);
    });

    this.rebuildEmailIndex();
  }

  /**
   * Rebuild the email index
   */
  private rebuildEmailIndex(): void {
    const documents = Array.from(this.emails.values());

    this.emailIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('subject', { boost: 10 });
      this.field('from', { boost: 8 });
      this.field('fromName', { boost: 8 });
      this.field('to', { boost: 5 });
      this.field('cc', { boost: 3 });
      this.field('bcc', { boost: 3 });
      this.field('body', { boost: 1 });
      this.field('labels', { boost: 4 });
      this.field('folder', { boost: 2 });

      documents.forEach((doc) => {
        this.add(doc);
      });
    });
  }

  /**
   * Index a contact
   */
  public indexContact(contact: Contact): void {
    const indexed: IndexedContact = {
      id: `contact-${contact.id}`,
      type: 'contact',
      displayName: contact.displayName || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      emails: (contact.emails || []).map((e: any) => e.email).join(' '),
      phones: (contact.phones || []).map((p: any) => p.number || p.phone || '').join(' '),
      company: contact.organization?.name || '',
      jobTitle: contact.organization?.title || '',
      notes:
        typeof contact.notes === 'string' ? contact.notes : (contact.notes || []).map((n: any) => n.content).join(' '),
      tags: (contact.tags || []).join(' ')
    };

    this.contacts.set(indexed.id, indexed);
    this.rebuildContactIndex();
  }

  /**
   * Index multiple contacts at once
   */
  public indexContacts(contacts: Contact[]): void {
    contacts.forEach((contact) => {
      const indexed: IndexedContact = {
        id: `contact-${contact.id}`,
        type: 'contact',
        displayName: contact.displayName || '',
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        emails: (contact.emails || []).map((e: any) => e.email).join(' '),
        phones: (contact.phones || []).map((p: any) => p.number || p.phone || '').join(' '),
        company: contact.organization?.name || '',
        jobTitle: contact.organization?.title || '',
        notes:
          typeof contact.notes === 'string'
            ? contact.notes
            : (contact.notes || []).map((n: any) => n.content).join(' '),
        tags: (contact.tags || []).join(' ')
      };
      this.contacts.set(indexed.id, indexed);
    });

    this.rebuildContactIndex();
  }

  /**
   * Rebuild the contact index
   */
  private rebuildContactIndex(): void {
    const documents = Array.from(this.contacts.values());

    this.contactIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('displayName', { boost: 10 });
      this.field('firstName', { boost: 8 });
      this.field('lastName', { boost: 8 });
      this.field('emails', { boost: 6 });
      this.field('phones', { boost: 4 });
      this.field('company', { boost: 5 });
      this.field('jobTitle', { boost: 3 });
      this.field('notes', { boost: 1 });
      this.field('tags', { boost: 4 });

      documents.forEach((doc) => {
        this.add(doc);
      });
    });
  }

  /**
   * Index a calendar event
   */
  public indexEvent(event: CalendarEvent): void {
    const indexed: IndexedEvent = {
      id: `event-${event.id}`,
      type: 'event',
      title: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      attendees: (event.attendees || [])
        .map((a: any) => (typeof a === 'string' ? a : a.email || a.name || ''))
        .join(' '),
      organizer: event.organizer?.email || event.organizer?.displayName || '',
      status: event.status || 'confirmed',
      startDate: event.start?.dateTime || String(event.start) || '',
      endDate: event.end?.dateTime || String(event.end) || ''
    };

    this.events.set(indexed.id, indexed);
    this.rebuildEventIndex();
  }

  /**
   * Index multiple events at once
   */
  public indexEvents(events: CalendarEvent[]): void {
    events.forEach((event) => {
      const indexed: IndexedEvent = {
        id: `event-${event.id}`,
        type: 'event',
        title: event.summary || '',
        description: event.description || '',
        location: event.location || '',
        attendees: (event.attendees || [])
          .map((a: any) => (typeof a === 'string' ? a : a.email || a.name || ''))
          .join(' '),
        organizer: event.organizer?.email || event.organizer?.displayName || '',
        status: event.status || 'confirmed',
        startDate: event.start?.dateTime || String(event.start) || '',
        endDate: event.end?.dateTime || String(event.end) || ''
      };
      this.events.set(indexed.id, indexed);
    });

    this.rebuildEventIndex();
  }

  /**
   * Rebuild the event index
   */
  private rebuildEventIndex(): void {
    const documents = Array.from(this.events.values());

    this.eventIndex = lunr(function (this: any) {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('location', { boost: 4 });
      this.field('attendees', { boost: 3 });
      this.field('organizer', { boost: 4 });
      this.field('status', { boost: 2 });

      documents.forEach((doc) => {
        this.add(doc);
      });
    });
  }

  /**
   * Search all indexed content
   */
  public searchAll(query: string, scope?: SearchScope): SearchResult[] {
    const results: SearchResult[] = [];

    // Parse natural language query
    const parsedQuery = this.parseNaturalLanguageQuery(query);

    // Search emails
    if (!scope || scope === SearchScope.ALL || scope === SearchScope.INBOX) {
      const emailResults = this.searchEmails(parsedQuery.text);
      results.push(...emailResults);
    }

    // Search contacts
    if (!scope || scope === SearchScope.ALL) {
      const contactResults = this.searchContacts(parsedQuery.text);
      results.push(...contactResults);
    }

    // Search events
    if (!scope || scope === SearchScope.ALL) {
      const eventResults = this.searchEvents(parsedQuery.text);
      results.push(...eventResults);
    }

    // Apply filters if present
    return this.applyFilters(results, parsedQuery.filters);
  }

  /**
   * Search emails
   */
  public searchEmails(query: string): SearchResult[] {
    if (!this.emailIndex || !query.trim()) {
      return [];
    }

    try {
      const results = this.emailIndex.search(query);

      return results.map((result) => ({
        id: result.ref,
        type: 'email' as const,
        score: result.score,
        matches: Object.keys(result.matchData.metadata)
      }));
    } catch (error) {
      console.error('Email search error:', error);
      return [];
    }
  }

  /**
   * Search contacts
   */
  public searchContacts(query: string): SearchResult[] {
    if (!this.contactIndex || !query.trim()) {
      return [];
    }

    try {
      const results = this.contactIndex.search(query);

      return results.map((result) => ({
        id: result.ref,
        type: 'contact' as const,
        score: result.score,
        matches: Object.keys(result.matchData.metadata)
      }));
    } catch (error) {
      console.error('Contact search error:', error);
      return [];
    }
  }

  /**
   * Search events
   */
  public searchEvents(query: string): SearchResult[] {
    if (!this.eventIndex || !query.trim()) {
      return [];
    }

    try {
      const results = this.eventIndex.search(query);

      return results.map((result) => ({
        id: result.ref,
        type: 'event' as const,
        score: result.score,
        matches: Object.keys(result.matchData.metadata)
      }));
    } catch (error) {
      console.error('Event search error:', error);
      return [];
    }
  }

  /**
   * Parse natural language query
   */
  public parseNaturalLanguageQuery(query: string): {
    text: string;
    filters: SearchFilter[];
    operators: Record<string, any>;
  } {
    let cleanQuery = query;
    const filters: SearchFilter[] = [];
    const operators: Record<string, any> = {};

    // Extract 'from' filter - matches: from:value or from:"value with spaces"
    const fromMatch = query.match(/from:["']?([^"'\s]+)["']?/i);
    if (fromMatch) {
      operators.from = fromMatch[1].trim();
      filters.push({
        field: SearchFieldType.FROM,
        operator: SearchOperator.CONTAINS,
        value: operators.from
      });
      cleanQuery = cleanQuery.replace(fromMatch[0], '').trim();
    }

    // Extract 'to' filter
    const toMatch = query.match(/to:["']?([^"'\s]+)["']?/i);
    if (toMatch) {
      operators.to = toMatch[1].trim();
      filters.push({
        field: SearchFieldType.TO,
        operator: SearchOperator.CONTAINS,
        value: operators.to
      });
      cleanQuery = cleanQuery.replace(toMatch[0], '').trim();
    }

    // Extract 'subject' filter - matches subject:value or subject:"value with spaces"
    const subjectMatch = query.match(/subject:["']([^"']+)["']|subject:(\S+)/i);
    if (subjectMatch) {
      operators.subject = (subjectMatch[1] || subjectMatch[2]).trim();
      filters.push({
        field: SearchFieldType.SUBJECT,
        operator: SearchOperator.CONTAINS,
        value: operators.subject
      });
      cleanQuery = cleanQuery.replace(subjectMatch[0], '').trim();
    }

    // Extract 'has' operator
    const hasMatch = query.match(/has:\s*(attachment|attachments|label|star|flag)/gi);
    if (hasMatch) {
      operators.has = hasMatch.map((m: string) => m.split(':')[1].trim().toLowerCase());
      cleanQuery = cleanQuery.replace(/has:\s*(attachment|attachments|label|star|flag)/gi, '').trim();
    }

    // Extract 'is' operator
    const isMatch = query.match(/is:\s*(read|unread|starred|important|draft|sent)/gi);
    if (isMatch) {
      operators.is = isMatch.map((m: string) => m.split(':')[1].trim().toLowerCase());
      cleanQuery = cleanQuery.replace(/is:\s*(read|unread|starred|important|draft|sent)/gi, '').trim();
    }

    // Extract 'before' date
    const beforeMatch = query.match(/before:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (beforeMatch) {
      operators.before = beforeMatch[1].trim();
      filters.push({
        field: SearchFieldType.DATE,
        operator: SearchOperator.BEFORE,
        value: operators.before
      });
      cleanQuery = cleanQuery.replace(beforeMatch[0], '').trim();
    }

    // Extract 'after' date
    const afterMatch = query.match(/after:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    if (afterMatch) {
      operators.after = afterMatch[1].trim();
      filters.push({
        field: SearchFieldType.DATE,
        operator: SearchOperator.AFTER,
        value: operators.after
      });
      cleanQuery = cleanQuery.replace(afterMatch[0], '').trim();
    }

    // Extract 'label' filter
    const labelMatch = query.match(/label:["']?([^"'\s]+)["']?/i);
    if (labelMatch) {
      operators.label = labelMatch[1].trim();
      filters.push({
        field: SearchFieldType.LABELS,
        operator: SearchOperator.CONTAINS,
        value: operators.label
      });
      cleanQuery = cleanQuery.replace(labelMatch[0], '').trim();
    }

    // Extract 'folder' filter (in:)
    const folderMatch = query.match(/in:["']?([^"'\s]+)["']?/i);
    if (folderMatch) {
      operators.folder = folderMatch[1].trim();
      cleanQuery = cleanQuery.replace(folderMatch[0], '').trim();
    }

    return {
      text: cleanQuery.trim(),
      filters,
      operators
    };
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult[], filters: SearchFilter[]): SearchResult[] {
    if (filters.length === 0) {
      return results.sort((a, b) => b.score - a.score);
    }

    // For now, return sorted results
    // In a full implementation, we would filter each result based on the filters
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get search suggestions
   */
  public getSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Add from history
    this.searchHistory
      .filter((h) => h.toLowerCase().includes(queryLower))
      .slice(0, Math.min(5, limit))
      .forEach((history) => {
        suggestions.push({
          id: `history-${history}`,
          text: history,
          type: SuggestionType.HISTORY,
          score: 1
        });
      });

    // Add email suggestions from indexed data
    if (query.length >= 2) {
      // Email addresses
      const emailSet = new Set<string>();
      this.emails.forEach((email) => {
        if (email.from && email.from.toLowerCase().includes(queryLower)) {
          emailSet.add(email.from);
        }
      });

      Array.from(emailSet)
        .slice(0, Math.min(3, limit - suggestions.length))
        .forEach((email) => {
          suggestions.push({
            id: `email-${email}`,
            text: email,
            type: SuggestionType.CONTACT,
            score: 0.8
          });
        });
    }

    // Add search operator suggestions
    const operatorSuggestions = [
      { prefix: 'from:', description: 'Search by sender' },
      { prefix: 'to:', description: 'Search by recipient' },
      { prefix: 'subject:', description: 'Search in subject' },
      { prefix: 'has:', description: 'Has attachment, label, etc.' },
      { prefix: 'is:', description: 'Is read, starred, etc.' },
      { prefix: 'before:', description: 'Before date' },
      { prefix: 'after:', description: 'After date' },
      { prefix: 'label:', description: 'Search by label' },
      { prefix: 'in:', description: 'Search in folder' }
    ];

    operatorSuggestions
      .filter((op) => op.prefix.startsWith(queryLower) || queryLower.endsWith(':'))
      .forEach((op) => {
        suggestions.push({
          id: `operator-${op.prefix}`,
          text: op.prefix,
          type: SuggestionType.OPERATOR,
          description: op.description,
          score: 0.9
        });
      });

    return suggestions.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
  }

  /**
   * Generate highlights for search result
   */
  public generateHighlights(
    result: SearchResult,
    query: string
  ): Array<{
    field: string;
    fragments: string[];
  }> {
    const highlights: Array<{ field: string; fragments: string[] }> = [];
    const queryTerms = query.toLowerCase().split(/\s+/);

    if (result.type === 'email') {
      const email = this.emails.get(result.id);
      if (email) {
        queryTerms.forEach((term) => {
          if (email.subject.toLowerCase().includes(term)) {
            highlights.push({
              field: 'subject',
              fragments: [this.highlightText(email.subject, term)]
            });
          }
          if (email.body.toLowerCase().includes(term)) {
            highlights.push({
              field: 'body',
              fragments: [this.highlightText(email.body.substring(0, 200), term)]
            });
          }
        });
      }
    }

    return highlights;
  }

  /**
   * Highlight matching text
   */
  private highlightText(text: string, term: string): string {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Add search to history
   */
  public addToHistory(query: string): void {
    if (!query.trim()) {
      return;
    }

    // Remove if already exists
    const index = this.searchHistory.indexOf(query);
    if (index !== -1) {
      this.searchHistory.splice(index, 1);
    }

    // Add to beginning
    this.searchHistory.unshift(query);

    // Trim to max size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get search history
   */
  public getHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  public clearHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Remove document from index
   */
  public removeEmail(id: string): void {
    this.emails.delete(`email-${id}`);
    this.rebuildEmailIndex();
  }

  /**
   * Remove contact from index
   */
  public removeContact(id: string): void {
    this.contacts.delete(`contact-${id}`);
    this.rebuildContactIndex();
  }

  /**
   * Remove event from index
   */
  public removeEvent(id: string): void {
    this.events.delete(`event-${id}`);
    this.rebuildEventIndex();
  }

  /**
   * Clear all indices
   */
  public clearAll(): void {
    this.emails.clear();
    this.contacts.clear();
    this.events.clear();
    this.initializeIndices();
  }

  /**
   * Get index statistics
   */
  public getStats(): {
    emails: number;
    contacts: number;
    events: number;
  } {
    return {
      emails: this.emails.size,
      contacts: this.contacts.size,
      events: this.events.size
    };
  }
}

// Export singleton instance
export const searchEngineService = new SearchEngineService();
