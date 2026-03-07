import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  AdvancedSearchQuery,
  SimpleSearchQuery,
  SearchResults,
  SearchResultItem,
  SearchSuggestion,
  SavedSearch,
  SearchHistoryItem,
  CreateSavedSearchPayload,
  SearchFilter,
  SearchScope,
  SearchFieldType,
  SearchOperator,
  SortOrder,
  SuggestionType,
  SemanticSearchOptions,
  NaturalLanguageQuery,
  SmartCategorization,
  AutoTaggingResult,
} from '../types/enhancedSearch';

/**
 * Enhanced Search Hook
 * 
 * Provides advanced search functionality including:
 * - Simple and advanced search
 * - Search suggestions
 * - Natural language processing
 * - Semantic search
 * - Saved searches
 * - Search history
 * - Smart categorization
 * - Auto-tagging
 */

const MAX_HISTORY_ITEMS = 50;

// Mock data generators
const generateMockEmails = (): SearchResultItem[] => {
  return [
    {
      id: 'email-1',
      emailId: 'email-1',
      subject: 'Project Update: Q4 Goals Progress',
      snippet: 'I wanted to share the latest updates on our Q4 goals. We have made significant progress on the product launch timeline...',
      from: { name: 'John Smith', email: 'john.smith@company.com' },
      to: [{ name: 'Team', email: 'team@company.com' }],
      date: '2025-01-20T10:30:00Z',
      size: 15000,
      hasAttachments: true,
      isRead: false,
      isStarred: true,
      labels: ['Work', 'Important'],
      folder: 'Inbox',
      relevanceScore: 95,
      highlights: [{ field: 'subject', fragments: ['<mark>Project</mark> <mark>Update</mark>'] }],
    },
    {
      id: 'email-2',
      emailId: 'email-2',
      subject: 'Meeting Reminder: Product Review',
      snippet: 'This is a reminder about our product review meeting scheduled for tomorrow at 2 PM...',
      from: { name: 'Calendar', email: 'calendar@company.com' },
      to: [{ name: 'Me', email: 'me@company.com' }],
      date: '2025-01-20T09:00:00Z',
      size: 5000,
      hasAttachments: false,
      isRead: true,
      isStarred: false,
      labels: ['Meeting'],
      folder: 'Inbox',
      relevanceScore: 88,
      highlights: [{ field: 'subject', fragments: ['<mark>Meeting</mark> <mark>Reminder</mark>'] }],
    },
    {
      id: 'email-3',
      emailId: 'email-3',
      subject: 'Invoice #12345 - Payment Received',
      snippet: 'Thank you for your payment. Your invoice #12345 has been marked as paid...',
      from: { name: 'Billing System', email: 'billing@service.com' },
      to: [{ name: 'Me', email: 'me@company.com' }],
      date: '2025-01-19T16:45:00Z',
      size: 8000,
      hasAttachments: true,
      isRead: true,
      isStarred: false,
      labels: ['Finance', 'Invoice'],
      folder: 'Inbox',
      relevanceScore: 75,
      highlights: [],
    },
    {
      id: 'email-4',
      emailId: 'email-4',
      subject: 'New Feature Announcement',
      snippet: 'We are excited to announce the release of our new features. Check out what\'s new...',
      from: { name: 'Product Team', email: 'product@company.com' },
      to: [{ name: 'All Users', email: 'users@company.com' }],
      date: '2025-01-18T14:00:00Z',
      size: 12000,
      hasAttachments: false,
      isRead: true,
      isStarred: false,
      labels: ['Updates'],
      folder: 'Inbox',
      relevanceScore: 70,
      highlights: [],
    },
    {
      id: 'email-5',
      emailId: 'email-5',
      subject: 'Re: Contract Review',
      snippet: 'I have reviewed the contract and have a few comments. Let me know when you have time to discuss...',
      from: { name: 'Jane Doe', email: 'jane.doe@partner.com' },
      to: [{ name: 'Me', email: 'me@company.com' }],
      date: '2025-01-17T11:30:00Z',
      size: 25000,
      hasAttachments: true,
      isRead: false,
      isStarred: true,
      labels: ['Legal', 'Contract'],
      folder: 'Inbox',
      relevanceScore: 85,
      highlights: [],
    },
  ];
};

const generateMockSuggestions = (): SearchSuggestion[] => {
  return [
    { id: 'sug-1', text: 'project update', type: SuggestionType.RECENT_SEARCH, count: 12 },
    { id: 'sug-2', text: 'john.smith@company.com', type: SuggestionType.EMAIL_ADDRESS, description: 'John Smith' },
    { id: 'sug-3', text: 'meeting', type: SuggestionType.KEYWORD, count: 45 },
    { id: 'sug-4', text: 'invoice', type: SuggestionType.KEYWORD, count: 23 },
    { id: 'sug-5', text: 'Work', type: SuggestionType.LABEL, count: 156 },
    { id: 'sug-6', text: 'has:attachment', type: SuggestionType.SMART_SUGGESTION, description: 'Emails with attachments' },
    { id: 'sug-7', text: 'is:unread', type: SuggestionType.SMART_SUGGESTION, description: 'Unread emails' },
    { id: 'sug-8', text: 'from:manager', type: SuggestionType.SMART_SUGGESTION, description: 'From manager' },
  ];
};

const generateMockSavedSearches = (): SavedSearch[] => {
  return [
    {
      id: 'saved-1',
      name: 'Unread Important Emails',
      description: 'All unread emails marked as important',
      query: {
        text: '',
        scope: SearchScope.INBOX,
        filters: [],
        isUnread: true,
        isStarred: true,
        sortOrder: SortOrder.DATE_DESC,
        pageSize: 20,
        page: 1,
      },
      createdBy: 'user-1',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      lastUsed: '2025-01-20T08:00:00Z',
      useCount: 25,
      isPinned: true,
      notificationEnabled: false,
    },
    {
      id: 'saved-2',
      name: 'Invoices This Month',
      description: 'All invoice-related emails from this month',
      query: {
        text: 'invoice',
        scope: SearchScope.ALL,
        filters: [],
        dateRange: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          end: new Date().toISOString(),
          field: 'received',
        },
        sortOrder: SortOrder.DATE_DESC,
        pageSize: 20,
        page: 1,
      },
      createdBy: 'user-1',
      createdAt: '2025-01-05T00:00:00Z',
      updatedAt: '2025-01-05T00:00:00Z',
      lastUsed: '2025-01-19T14:00:00Z',
      useCount: 12,
      isPinned: false,
      notificationEnabled: true,
      notificationFrequency: 'daily',
    },
  ];
};

export const useEnhancedSearch = () => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [semanticOptions, setSemanticOptions] = useState<SemanticSearchOptions>({
    enabled: true,
    expandSynonyms: true,
    includeRelated: true,
    minRelevanceScore: 50,
    contentUnderstanding: true,
  });

  // Mock emails for search
  const [allEmails] = useState<SearchResultItem[]>(generateMockEmails);

  // Initialize
  useEffect(() => {
    setSuggestions(generateMockSuggestions());
    setSavedSearches(generateMockSavedSearches());
  }, []);

  // Simple Search
  const simpleSearch = useCallback(async (
    query: SimpleSearchQuery
  ): Promise<SearchResults> => {
    setIsLoading(true);
    const startTime = Date.now();

    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 300));

    const filteredEmails = allEmails.filter(email => {
      // Text matching
      if (query.text) {
        const searchText = query.text.toLowerCase();
        const matchSubject = email.subject.toLowerCase().includes(searchText);
        const matchSnippet = email.snippet.toLowerCase().includes(searchText);
        const matchFrom = email.from.email.toLowerCase().includes(searchText) ||
          email.from.name.toLowerCase().includes(searchText);
        if (!matchSubject && !matchSnippet && !matchFrom) return false;
      }

      // Scope filtering
      if (query.scope && query.scope !== SearchScope.ALL) {
        if (query.scope === SearchScope.INBOX && email.folder !== 'Inbox') return false;
      }

      return true;
    });

    const results: SearchResults = {
      query: query.text,
      items: filteredEmails,
      totalResults: filteredEmails.length,
      page: 1,
      pageSize: 20,
      totalPages: Math.ceil(filteredEmails.length / 20),
      hasMore: false,
      executionTime: Date.now() - startTime,
    };

    setSearchResults(results);
    setIsLoading(false);

    // Add to history
    addToHistory(query.text, query.scope || SearchScope.ALL, filteredEmails.length);

    return results;
  }, [allEmails]);

  // Advanced Search
  const advancedSearch = useCallback(async (
    query: AdvancedSearchQuery
  ): Promise<SearchResults> => {
    setIsLoading(true);
    const startTime = Date.now();

    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 400));

    let filteredEmails = [...allEmails];

    // Text matching
    if (query.text) {
      const searchText = query.text.toLowerCase();
      filteredEmails = filteredEmails.filter(email => {
        const matchSubject = email.subject.toLowerCase().includes(searchText);
        const matchSnippet = email.snippet.toLowerCase().includes(searchText);
        const matchFrom = email.from.email.toLowerCase().includes(searchText) ||
          email.from.name.toLowerCase().includes(searchText);
        return matchSubject || matchSnippet || matchFrom;
      });
    }

    // Apply filters
    query.filters.forEach(filter => {
      filteredEmails = filteredEmails.filter(email => {
        return evaluateFilter(email, filter);
      });
    });

    // Date range filter
    if (query.dateRange) {
      const start = new Date(query.dateRange.start).getTime();
      const end = new Date(query.dateRange.end).getTime();
      filteredEmails = filteredEmails.filter(email => {
        const emailDate = new Date(email.date).getTime();
        return emailDate >= start && emailDate <= end;
      });
    }

    // Attachment filter
    if (query.hasAttachments !== undefined) {
      filteredEmails = filteredEmails.filter(email => 
        email.hasAttachments === query.hasAttachments
      );
    }

    // Unread filter
    if (query.isUnread !== undefined) {
      filteredEmails = filteredEmails.filter(email => 
        email.isRead !== query.isUnread
      );
    }

    // Starred filter
    if (query.isStarred !== undefined) {
      filteredEmails = filteredEmails.filter(email => 
        email.isStarred === query.isStarred
      );
    }

    // Labels filter
    if (query.labels && query.labels.length > 0) {
      filteredEmails = filteredEmails.filter(email => 
        query.labels!.some(label => email.labels.includes(label))
      );
    }

    // Sort results
    filteredEmails.sort((a, b) => {
      switch (query.sortOrder) {
        case SortOrder.DATE_DESC:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case SortOrder.DATE_ASC:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case SortOrder.SIZE_DESC:
          return b.size - a.size;
        case SortOrder.SIZE_ASC:
          return a.size - b.size;
        case SortOrder.SENDER_ASC:
          return a.from.name.localeCompare(b.from.name);
        case SortOrder.SENDER_DESC:
          return b.from.name.localeCompare(a.from.name);
        case SortOrder.RELEVANCE:
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

    // Pagination
    const pageSize = query.pageSize || 20;
    const page = query.page || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedEmails = filteredEmails.slice(startIndex, startIndex + pageSize);

    const results: SearchResults = {
      query: query.text,
      items: paginatedEmails,
      totalResults: filteredEmails.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredEmails.length / pageSize),
      hasMore: startIndex + pageSize < filteredEmails.length,
      executionTime: Date.now() - startTime,
    };

    setSearchResults(results);
    setIsLoading(false);

    // Add to history
    addToHistory(query.text, query.scope, filteredEmails.length);

    return results;
  }, [allEmails]);

  // Evaluate filter on email
  const evaluateFilter = (email: SearchResultItem, filter: SearchFilter): boolean => {
    let value: any;

    switch (filter.field) {
      case SearchFieldType.FROM:
        value = `${email.from.name} ${email.from.email}`;
        break;
      case SearchFieldType.SUBJECT:
        value = email.subject;
        break;
      case SearchFieldType.BODY:
        value = email.snippet;
        break;
      case SearchFieldType.SIZE:
        value = email.size;
        break;
      case SearchFieldType.DATE:
        value = new Date(email.date).getTime();
        break;
      case SearchFieldType.LABELS:
        value = email.labels.join(' ');
        break;
      default:
        return true;
    }

    const filterValue = filter.value;
    const caseSensitive = filter.caseSensitive || false;

    switch (filter.operator) {
      case SearchOperator.CONTAINS:
        return caseSensitive
          ? String(value).includes(String(filterValue))
          : String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case SearchOperator.NOT_CONTAINS:
        return caseSensitive
          ? !String(value).includes(String(filterValue))
          : !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      case SearchOperator.EQUALS:
        return caseSensitive
          ? String(value) === String(filterValue)
          : String(value).toLowerCase() === String(filterValue).toLowerCase();
      case SearchOperator.NOT_EQUALS:
        return caseSensitive
          ? String(value) !== String(filterValue)
          : String(value).toLowerCase() !== String(filterValue).toLowerCase();
      case SearchOperator.GREATER_THAN:
        return Number(value) > Number(filterValue);
      case SearchOperator.LESS_THAN:
        return Number(value) < Number(filterValue);
      default:
        return true;
    }
  };

  // Add to search history
  const addToHistory = useCallback((
    queryText: string,
    scope: SearchScope,
    resultCount: number
  ): void => {
    if (!queryText.trim()) return;

    const historyItem: SearchHistoryItem = {
      id: `history-${Date.now()}`,
      query: queryText,
      scope,
      timestamp: new Date().toISOString(),
      resultCount,
    };

    setSearchHistory(prev => {
      // Remove duplicates
      const filtered = prev.filter(h => h.query !== queryText);
      // Add new item at beginning and limit size
      return [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // Get suggestions
  const getSuggestions = useCallback((
    query: string
  ): SearchSuggestion[] => {
    if (!query.trim()) {
      return suggestions.slice(0, 5);
    }

    const queryLower = query.toLowerCase();
    
    // Combine recent searches and other suggestions
    const historySuggestions: SearchSuggestion[] = searchHistory
      .filter(h => h.query.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(h => ({
        id: `h-${h.id}`,
        text: h.query,
        type: SuggestionType.RECENT_SEARCH,
        count: h.resultCount,
      }));

    const matchingSuggestions = suggestions.filter(s => 
      s.text.toLowerCase().includes(queryLower)
    );

    return [...new Map([...historySuggestions, ...matchingSuggestions].map(s => [s.text, s])).values()].slice(0, 10);
  }, [suggestions, searchHistory]);

  // Natural Language Processing
  const parseNaturalLanguage = useCallback((
    query: string
  ): NaturalLanguageQuery => {
    const original = query;
    let text = query;
    const filters: SearchFilter[] = [];
    let scope = SearchScope.ALL;
    let intent: 'search' | 'filter' | 'action' | 'unknown' = 'search';
    let confidence = 70;

    // Parse special syntax
    // from:email@domain.com
    const fromMatch = query.match(/from:([^\s]+)/i);
    if (fromMatch) {
      filters.push({
        field: SearchFieldType.FROM,
        operator: SearchOperator.CONTAINS,
        value: fromMatch[1],
      });
      text = text.replace(fromMatch[0], '').trim();
      confidence += 10;
    }

    // to:email@domain.com
    const toMatch = query.match(/to:([^\s]+)/i);
    if (toMatch) {
      filters.push({
        field: SearchFieldType.TO,
        operator: SearchOperator.CONTAINS,
        value: toMatch[1],
      });
      text = text.replace(toMatch[0], '').trim();
      confidence += 10;
    }

    // subject:text
    const subjectMatch = query.match(/subject:([^\s]+)/i);
    if (subjectMatch) {
      filters.push({
        field: SearchFieldType.SUBJECT,
        operator: SearchOperator.CONTAINS,
        value: subjectMatch[1],
      });
      text = text.replace(subjectMatch[0], '').trim();
      confidence += 10;
    }

    // has:attachment
    if (query.match(/has:attachment/i)) {
      text = text.replace(/has:attachment/gi, '').trim();
      confidence += 5;
    }

    // is:unread, is:read
    if (query.match(/is:unread/i)) {
      text = text.replace(/is:unread/gi, '').trim();
      confidence += 5;
    }

    // Detect intent and strip action verbs
    if (filters.length > 0 && !text.trim()) {
      intent = 'filter';
    } else if (query.match(/^(find|search|show|list|get)/i)) {
      intent = 'search';
      confidence += 10;
      // Strip the action verb from text
      text = text.replace(/^(find|search|show|list|get)\s*/i, '').trim();
    }

    return {
      original,
      interpreted: {
        text,
        filters,
        scope,
        intent,
      },
      confidence: Math.min(confidence, 100),
    };
  }, []);

  // Save Search
  const saveSearch = useCallback((
    payload: CreateSavedSearchPayload
  ): SavedSearch => {
    const newSavedSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      query: {
        ...payload.query,
        pageSize: 20,
        page: 1,
      },
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      useCount: 0,
      isPinned: false,
      notificationEnabled: payload.notificationEnabled || false,
      notificationFrequency: payload.notificationFrequency,
    };

    setSavedSearches(prev => [...prev, newSavedSearch]);
    return newSavedSearch;
  }, []);

  const deleteSavedSearch = useCallback((id: string): boolean => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    return true;
  }, []);

  const updateSavedSearch = useCallback((
    id: string,
    updates: Partial<SavedSearch>
  ): SavedSearch | null => {
    let updated: SavedSearch | null = null;

    setSavedSearches(prev => prev.map(search => {
      if (search.id === id) {
        updated = { ...search, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return search;
    }));

    return updated;
  }, []);

  const runSavedSearch = useCallback(async (
    id: string
  ): Promise<SearchResults> => {
    const saved = savedSearches.find(s => s.id === id);
    if (!saved) throw new Error('Saved search not found');

    // Update use count
    setSavedSearches(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, useCount: s.useCount + 1, lastUsed: new Date().toISOString() };
      }
      return s;
    }));

    return advancedSearch({
      ...saved.query,
      page: 1,
      pageSize: 20,
    });
  }, [savedSearches, advancedSearch]);

  // Smart Categorization
  const categorizeEmail = useCallback((
    emailId: string
  ): SmartCategorization => {
    const email = allEmails.find(e => e.id === emailId);
    if (!email) {
      return {
        emailId,
        suggestedLabels: [],
        category: 'primary',
        confidence: 0,
        reasons: ['Email not found'],
      };
    }

    // Simple rule-based categorization
    let category: SmartCategorization['category'] = 'primary';
    let confidence = 70;
    const reasons: string[] = [];

    if (email.from.email.includes('noreply') || email.from.email.includes('no-reply')) {
      category = 'promotions';
      reasons.push('Sender is a no-reply address');
      confidence = 85;
    } else if (email.labels.includes('Meeting')) {
      category = 'primary';
      reasons.push('Contains meeting label');
      confidence = 80;
    } else if (email.from.email.includes('linkedin') || email.from.email.includes('facebook')) {
      category = 'social';
      reasons.push('Social media sender');
      confidence = 90;
    } else if (email.subject.toLowerCase().includes('invoice') || 
               email.subject.toLowerCase().includes('receipt')) {
      category = 'updates';
      reasons.push('Financial/billing email');
      confidence = 80;
    }

    const suggestedLabels = [...new Set([...email.labels])];

    return {
      emailId,
      suggestedLabels,
      category,
      confidence,
      reasons,
    };
  }, [allEmails]);

  // Auto-tagging
  const suggestTags = useCallback((
    emailId: string
  ): AutoTaggingResult => {
    const email = allEmails.find(e => e.id === emailId);
    if (!email) {
      return { emailId, suggestedTags: [], confidence: {} };
    }

    const suggestedTags: string[] = [];
    const confidence: Record<string, number> = {};

    // Analyze content
    const content = `${email.subject} ${email.snippet}`.toLowerCase();

    if (content.includes('project') || content.includes('deadline')) {
      suggestedTags.push('Work');
      confidence['Work'] = 85;
    }
    if (content.includes('meeting') || content.includes('schedule')) {
      suggestedTags.push('Meeting');
      confidence['Meeting'] = 90;
    }
    if (content.includes('invoice') || content.includes('payment')) {
      suggestedTags.push('Finance');
      confidence['Finance'] = 80;
    }
    if (email.hasAttachments) {
      suggestedTags.push('Has-Attachment');
      confidence['Has-Attachment'] = 95;
    }
    if (!email.isRead) {
      suggestedTags.push('Unread');
      confidence['Unread'] = 100;
    }

    return { emailId, suggestedTags, confidence };
  }, [allEmails]);

  // Clear search
  const clearSearch = useCallback((): void => {
    setSearchResults(null);
    setCurrentQuery('');
  }, []);

  // Clear history
  const clearHistory = useCallback((): void => {
    setSearchHistory([]);
  }, []);

  return {
    // State
    isLoading,
    searchResults,
    suggestions,
    savedSearches,
    searchHistory,
    currentQuery,
    semanticOptions,

    // Setters
    setSemanticOptions,
    setCurrentQuery,

    // Search operations
    simpleSearch,
    advancedSearch,
    getSuggestions,
    parseNaturalLanguage,

    // Saved searches
    saveSearch,
    deleteSavedSearch,
    updateSavedSearch,
    runSavedSearch,

    // Smart features
    categorizeEmail,
    suggestTags,

    // Utility
    clearSearch,
    clearHistory,
  };
};