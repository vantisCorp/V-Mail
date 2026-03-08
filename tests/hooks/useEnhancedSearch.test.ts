import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnhancedSearch } from '../../src/hooks/useEnhancedSearch';
import {
  SearchScope,
  SearchFieldType,
  SearchOperator,
  SortOrder,
  SuggestionType
} from '../../src/types/enhancedSearch';

describe('useEnhancedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.searchResults).toBeNull();
      expect(result.current.currentQuery).toBe('');
      expect(result.current.semanticOptions).toBeDefined();
    });

    it('should load suggestions and saved searches', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await waitFor(() => {
        expect(result.current.suggestions.length).toBeGreaterThan(0);
      });

      expect(result.current.savedSearches.length).toBeGreaterThan(0);
    });
  });

  describe('Simple Search', () => {
    it('should perform simple search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({
          text: 'project',
          scope: SearchScope.ALL
        });
      });

      expect(result.current.searchResults).not.toBeNull();
      expect(result.current.searchResults?.query).toBe('project');
      expect(result.current.searchResults?.totalResults).toBeGreaterThan(0);
    });

    it('should search by email address', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({
          text: 'john.smith@company.com',
          scope: SearchScope.ALL
        });
      });

      expect(result.current.searchResults?.items).toBeDefined();
      expect(result.current.searchResults?.items.length).toBeGreaterThan(0);
    });

    it('should search in specific scope', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({
          text: 'update',
          scope: SearchScope.INBOX
        });
      });

      expect(result.current.searchResults?.items).toBeDefined();
    });

    it('should return empty results for no matches', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({
          text: 'nonexistentuniqueword123',
          scope: SearchScope.ALL
        });
      });

      expect(result.current.searchResults?.totalResults).toBe(0);
      expect(result.current.searchResults?.items).toHaveLength(0);
    });
  });

  describe('Advanced Search', () => {
    it('should perform advanced search with filters', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [
            {
              field: SearchFieldType.FROM,
              operator: SearchOperator.CONTAINS,
              value: 'john'
            }
          ],
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      expect(result.current.searchResults).not.toBeNull();
      expect(result.current.searchResults?.items.length).toBeGreaterThan(0);
    });

    it('should filter by has attachments', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          hasAttachments: true,
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      const results = result.current.searchResults?.items || [];
      results.forEach(email => {
        expect(email.hasAttachments).toBe(true);
      });
    });

    it('should filter by unread status', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          isUnread: true,
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      const results = result.current.searchResults?.items || [];
      results.forEach(email => {
        expect(email.isRead).toBe(false);
      });
    });

    it('should filter by starred status', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          isStarred: true,
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      const results = result.current.searchResults?.items || [];
      results.forEach(email => {
        expect(email.isStarred).toBe(true);
      });
    });

    it('should filter by labels', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          labels: ['Work'],
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      const results = result.current.searchResults?.items || [];
      results.forEach(email => {
        expect(email.labels).toContain('Work');
      });
    });

    it('should sort results by date descending', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 20
        });
      });

      const results = result.current.searchResults?.items || [];
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          const date1 = new Date(results[i].date).getTime();
          const date2 = new Date(results[i + 1].date).getTime();
          expect(date1).toBeGreaterThanOrEqual(date2);
        }
      }
    });

    it('should paginate results', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.advancedSearch({
          text: '',
          scope: SearchScope.ALL,
          filters: [],
          sortOrder: SortOrder.DATE_DESC,
          page: 1,
          pageSize: 2
        });
      });

      expect(result.current.searchResults?.page).toBe(1);
      expect(result.current.searchResults?.pageSize).toBe(2);
      expect(result.current.searchResults?.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Search Suggestions', () => {
    it('should get suggestions for empty query', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const suggestions = result.current.getSuggestions('');

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should get suggestions matching query', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({ text: 'meeting', scope: SearchScope.ALL });
      });

      const suggestions = result.current.getSuggestions('meet');

      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion.text.toLowerCase()).toContain('meet');
      });
    });

    it('should include recent searches in suggestions', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({ text: 'test query', scope: SearchScope.ALL });
      });

      const suggestions = result.current.getSuggestions('test');

      const hasRecentSearch = suggestions.some(s => s.type === SuggestionType.RECENT_SEARCH);
      expect(hasRecentSearch).toBe(true);
    });
  });

  describe('Natural Language Processing', () => {
    it('should parse from:email syntax', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('from:john@example.com');

      expect(parsed.original).toBe('from:john@example.com');
      expect(parsed.interpreted.filters).toHaveLength(1);
      expect(parsed.interpreted.filters[0].field).toBe(SearchFieldType.FROM);
      expect(parsed.interpreted.filters[0].value).toBe('john@example.com');
      expect(parsed.confidence).toBeGreaterThan(70);
    });

    it('should parse to:email syntax', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('to:team@company.com');

      expect(parsed.interpreted.filters).toHaveLength(1);
      expect(parsed.interpreted.filters[0].field).toBe(SearchFieldType.TO);
      expect(parsed.interpreted.filters[0].value).toBe('team@company.com');
    });

    it('should parse subject:text syntax', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('subject:urgent meeting');

      expect(parsed.interpreted.filters).toHaveLength(1);
      expect(parsed.interpreted.filters[0].field).toBe(SearchFieldType.SUBJECT);
      expect(parsed.interpreted.filters[0].value).toBe('urgent');
    });

    it('should parse has:attachment syntax', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('has:attachment');

      expect(parsed.interpreted.text).toBe('');
      expect(parsed.confidence).toBeGreaterThan(70);
    });

    it('should parse is:unread syntax', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('is:unread');

      expect(parsed.interpreted.text).toBe('');
      expect(parsed.confidence).toBeGreaterThan(70);
    });

    it('should detect search intent', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('find emails about project');

      expect(parsed.interpreted.intent).toBe('search');
      expect(parsed.interpreted.text).toBe('emails about project');
    });

    it('should detect filter intent', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const parsed = result.current.parseNaturalLanguage('from:manager');

      expect(parsed.interpreted.intent).toBe('filter');
      expect(parsed.interpreted.filters).toHaveLength(1);
    });
  });

  describe('Saved Searches', () => {
    it('should save a search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      // Wait for initial saved searches to load
      await waitFor(() => {
        expect(result.current.savedSearches).toHaveLength(2);
      });

      await act(async () => {
        result.current.saveSearch({
          name: 'Test Saved Search',
          description: 'Test description',
          query: {
            text: 'test',
            scope: SearchScope.ALL,
            filters: [],
            sortOrder: SortOrder.DATE_DESC
          },
          notificationEnabled: false
        });
      });

      await waitFor(() => {
        expect(result.current.savedSearches).toHaveLength(3); // 2 initial + 1 new
      });

      const newSearch = result.current.savedSearches.find(s => s.name === 'Test Saved Search');
      expect(newSearch).toBeDefined();
      expect(newSearch?.name).toBe('Test Saved Search');
    });

    it('should update a saved search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      // Wait for initial saved searches to load
      await waitFor(() => {
        expect(result.current.savedSearches).toHaveLength(2);
      });

      const searchToUpdate = result.current.savedSearches[0];
      const originalName = searchToUpdate.name;

      await act(async () => {
        result.current.updateSavedSearch(searchToUpdate.id, {
          name: 'Updated Name',
          isPinned: true
        });
      });

      await waitFor(() => {
        expect(result.current.savedSearches.find(s => s.id === searchToUpdate.id)?.name).toBe('Updated Name');
      });

      const updated = result.current.savedSearches.find(s => s.id === searchToUpdate.id);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.name).not.toBe(originalName);
      expect(updated?.isPinned).toBe(true);
    });

    it('should delete a saved search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      // Wait for initial saved searches to load
      await waitFor(() => {
        expect(result.current.savedSearches).toHaveLength(2);
      });

      const searchToDelete = result.current.savedSearches[0];
      const initialCount = result.current.savedSearches.length;

      await act(async () => {
        result.current.deleteSavedSearch(searchToDelete.id);
      });

      await waitFor(() => {
        expect(result.current.savedSearches).toHaveLength(initialCount - 1);
      });

      expect(result.current.savedSearches.find(s => s.id === searchToDelete.id)).toBeUndefined();
    });

    it('should run a saved search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const savedSearch = result.current.savedSearches[0];
      const originalUseCount = savedSearch.useCount;

      await act(async () => {
        await result.current.runSavedSearch(savedSearch.id);
      });

      const updatedSearch = result.current.savedSearches.find(s => s.id === savedSearch.id);
      expect(updatedSearch?.useCount).toBe(originalUseCount + 1);
      expect(updatedSearch?.lastUsed).toBeDefined();
      expect(result.current.searchResults).not.toBeNull();
    });
  });

  describe('Smart Categorization', () => {
    it('should categorize email', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const categorization = result.current.categorizeEmail('email-1');

      expect(categorization.emailId).toBe('email-1');
      expect(categorization.category).toBeDefined();
      expect(categorization.confidence).toBeGreaterThan(0);
      expect(categorization.suggestedLabels).toBeDefined();
    });

    it('should return not found for non-existent email', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const categorization = result.current.categorizeEmail('nonexistent-email');

      expect(categorization.emailId).toBe('nonexistent-email');
      expect(categorization.confidence).toBe(0);
      expect(categorization.reasons).toContain('Email not found');
    });
  });

  describe('Auto-tagging', () => {
    it('should suggest tags for email', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const tags = result.current.suggestTags('email-1');

      expect(tags.emailId).toBe('email-1');
      expect(tags.suggestedTags).toBeDefined();
      expect(tags.confidence).toBeDefined();
    });

    it('should suggest Has-Attachment tag for emails with attachments', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const tags = result.current.suggestTags('email-1');

      expect(tags.suggestedTags).toContain('Has-Attachment');
      if (tags.confidence['Has-Attachment']) {
        expect(tags.confidence['Has-Attachment']).toBeGreaterThan(80);
      }
    });

    it('should suggest Unread tag for unread emails', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const tags = result.current.suggestTags('email-1');

      expect(tags.suggestedTags).toContain('Unread');
      if (tags.confidence['Unread']) {
        expect(tags.confidence['Unread']).toBe(100);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should clear search results', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({ text: 'test', scope: SearchScope.ALL });
      });

      expect(result.current.searchResults).not.toBeNull();

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchResults).toBeNull();
      expect(result.current.currentQuery).toBe('');
    });

    it('should clear search history', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      await act(async () => {
        await result.current.simpleSearch({ text: 'test', scope: SearchScope.ALL });
      });

      expect(result.current.searchHistory.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.searchHistory).toHaveLength(0);
    });

    it('should add queries to history after search', async () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const initialCount = result.current.searchHistory.length;

      await act(async () => {
        await result.current.simpleSearch({ text: 'unique query 123', scope: SearchScope.ALL });
      });

      expect(result.current.searchHistory.length).toBeGreaterThan(initialCount);
      const historyItem = result.current.searchHistory[0];
      expect(historyItem.query).toBe('unique query 123');
    });
  });

  describe('State Management', () => {
    it('should update current query', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      act(() => {
        result.current.setCurrentQuery('test query');
      });

      expect(result.current.currentQuery).toBe('test query');
    });

    it('should update semantic options', () => {
      const { result } = renderHook(() => useEnhancedSearch());

      const newOptions = {
        enabled: false,
        expandSynonyms: false,
        includeRelated: false,
        minRelevanceScore: 60,
        contentUnderstanding: false
      };

      act(() => {
        result.current.setSemanticOptions(newOptions);
      });

      expect(result.current.semanticOptions).toEqual(newOptions);
    });
  });
});
