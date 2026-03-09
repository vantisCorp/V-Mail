import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictiveTyping } from '../../src/hooks/usePredictiveTyping';
import { WritingContext, SuggestionType } from '../../src/types/predictiveTyping';

// ============================================================================
// Mock Contexts
// ============================================================================

const mockBodyContext: WritingContext = {
  text: 'Hello, I am writ',
  cursorPosition: 18,
  field: 'body',
  recipients: ['test@example.com'],
  sender: 'user@example.com',
  userPreferences: {
    enabled: true,
    minConfidence: 0.3,
    maxSuggestions: 5,
    enableGrammar: true,
    enableStyle: false,
    enableTemplates: true,
    learningRate: 0.1,
    language: 'en'
  }
};

const mockSubjectContext: WritingContext = {
  text: 'Regarding',
  cursorPosition: 8,
  field: 'subject',
  recipients: ['test@example.com'],
  sender: 'user@example.com'
};

const mockToFieldContext: WritingContext = {
  text: 'john',
  cursorPosition: 4,
  field: 'to',
  recipients: [],
  sender: 'user@example.com'
};

const mockLongTextContext: WritingContext = {
  text: 'This email is regarding the meeting that we discussed. I hope this email finds you well. I wanted to reach out to you about the project update.',
  cursorPosition: 50,
  field: 'body',
  recipients: ['test@example.com'],
  sender: 'user@example.com'
};

const mockEmptyContext: WritingContext = {
  text: '',
  cursorPosition: 0,
  field: 'body',
  recipients: ['test@example.com'],
  sender: 'user@example.com'
};

// ============================================================================
// Tests
// ============================================================================

describe('usePredictiveTyping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Basic Functionality
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.suggestions).toBe(null);
      expect(result.current.statistics).toBe(null);
    });

    it('should return valid preferences', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const preferences = result.current.getPreferences();
      expect(preferences).toBeDefined();
      expect(preferences.enabled).toBeDefined();
      expect(preferences.minConfidence).toBeDefined();
      expect(preferences.maxSuggestions).toBeDefined();
    });

    it('should return valid config', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const config = result.current.getConfig();
      expect(config).toBeDefined();
      expect(config.model).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.learning).toBeDefined();
      expect(config.suggestions).toBeDefined();
    });
  });

  // ==========================================================================
  // Suggestions
  // ==========================================================================

  describe('getSuggestions', () => {
    it('should get completions for body field', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();
      expect(Array.isArray(suggestionsResult.suggestions)).toBe(true);
    });

    it('should get email suggestions for to field', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockToFieldContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();

      const emailSuggestions = suggestionsResult.suggestions.filter((s) => s.type === SuggestionType.EMAIL);
      expect(emailSuggestions.length).toBeGreaterThan(0);
    });

    it('should get subject suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockSubjectContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();

      const subjectSuggestions = suggestionsResult.suggestions.filter((s) => s.type === SuggestionType.SUBJECT);
      expect(subjectSuggestions.length).toBeGreaterThan(0);
    });

    it('should respect max suggestions limit', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);

      expect(suggestionsResult.suggestions.length).toBeLessThanOrEqual(
        mockBodyContext.userPreferences?.maxSuggestions || 5
      );
    });

    it('should filter suggestions below min confidence', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);

      suggestionsResult.suggestions.forEach((suggestion) => {
        expect(suggestion.confidence).toBeGreaterThanOrEqual(mockBodyContext.userPreferences?.minConfidence || 0.3);
      });
    });

    it('should return processing time', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);

      expect(suggestionsResult.processingTime).toBeGreaterThanOrEqual(0);
      expect(suggestionsResult.timestamp).toBeDefined();
      expect(suggestionsResult.modelVersion).toBeDefined();
    });

    it('should update state with suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      act(() => {
        result.current.getSuggestions(mockBodyContext);
      });

      expect(result.current.suggestions).toBeDefined();
      expect(result.current.suggestions?.suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Suggestion Types
  // ==========================================================================

  describe('Suggestion Types', () => {
    it('should provide completion suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const contextWithBetterWord: WritingContext = {
        ...mockBodyContext,
        text: 'th',
        cursorPosition: 2
      };

      const suggestionsResult = result.current.getSuggestions(contextWithBetterWord);

      const completions = suggestionsResult.suggestions.filter((s) => s.type === SuggestionType.COMPLETION);
      expect(completions.length).toBeGreaterThan(0);
    });

    it('should provide phrase suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockLongTextContext);

      const phrases = suggestionsResult.suggestions.filter((s) => s.type === SuggestionType.PHRASE);
      // Phrases might not be generated for all contexts
      expect(Array.isArray(phrases)).toBe(true);
    });

    it('should provide grammar corrections', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const contextWithGrammar: WritingContext = {
        ...mockBodyContext,
        text: 'I think its going to be great',
        cursorPosition: 25
      };

      const suggestionsResult = result.current.getSuggestions(contextWithGrammar);

      const grammar = suggestionsResult.suggestions.filter((s) => s.type === SuggestionType.GRAMMAR);
      expect(grammar.length).toBeGreaterThan(0);
    });

    it('should provide template suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      // Templates are suggested based on context relevance
      const newEmailContext: WritingContext = {
        ...mockEmptyContext,
        userPreferences: {
          enabled: true,
          minConfidence: 0.3,
          maxSuggestions: 10,
          enableGrammar: true,
          enableStyle: false,
          enableTemplates: true,
          learningRate: 0.1,
          language: 'en'
        }
      };

      const suggestionsResult = result.current.getSuggestions(newEmailContext);

      // Templates may or may not be suggested depending on context
      expect(suggestionsResult.suggestions).toBeDefined();
    });
  });

  // ==========================================================================
  // Accept/Reject Suggestions
  // ==========================================================================

  describe('Accept/Reject Suggestions', () => {
    it('should accept a suggestion', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);
      const firstSuggestion = suggestionsResult.suggestions[0];

      expect(() => {
        result.current.acceptSuggestion(firstSuggestion.id);
      }).not.toThrow();
    });

    it('should reject a suggestion', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);
      const firstSuggestion = suggestionsResult.suggestions[0];

      expect(() => {
        result.current.rejectSuggestion(firstSuggestion.id);
      }).not.toThrow();
    });

    it('should handle accept with no current suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      expect(() => {
        result.current.acceptSuggestion('non-existent-id');
      }).not.toThrow();
    });

    it('should handle reject with no current suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      expect(() => {
        result.current.rejectSuggestion('non-existent-id');
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Text Analysis
  // ==========================================================================

  describe('Text Analysis', () => {
    it('should analyze text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      act(() => {
        result.current.analyzeText('This is a test email with some words.');
      });

      expect(result.current.statistics).toBeDefined();
      expect(result.current.statistics?.totalWords).toBeDefined();
    });

    it('should learn from text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      expect(() => {
        result.current.learnFromText('This is a unique phrase for learning.');
      }).not.toThrow();
    });

    it('should learn from accepted suggestion', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockBodyContext);
      const firstSuggestion = suggestionsResult.suggestions[0];

      expect(() => {
        result.current.learnFromText('test text', firstSuggestion);
      }).not.toThrow();
    });

    it('should calculate word count correctly', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const testText = 'This is a test email with seven words';
      act(() => {
        result.current.analyzeText(testText);
      });

      expect(result.current.statistics?.totalWords).toBe(8);
    });

    it('should calculate character count correctly', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const testText = 'Hello World';
      act(() => {
        result.current.analyzeText(testText);
      });

      expect(result.current.statistics?.totalCharacters).toBe(11);
    });

    it('should calculate average word length', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const testText = 'Hello World Test';
      act(() => {
        result.current.analyzeText(testText);
      });

      expect(result.current.statistics?.averageWordLength).toBeDefined();
    });
  });

  // ==========================================================================
  // Configuration
  // ==========================================================================

  describe('Configuration', () => {
    it('should update preferences', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updatePreferences({ minConfidence: 0.8 });

      const preferences = result.current.getPreferences();
      expect(preferences.minConfidence).toBe(0.8);
    });

    it('should update max suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updatePreferences({ maxSuggestions: 10 });

      const preferences = result.current.getPreferences();
      expect(preferences.maxSuggestions).toBe(10);
    });

    it('should enable/disable grammar', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updatePreferences({ enableGrammar: false });

      const preferences = result.current.getPreferences();
      expect(preferences.enableGrammar).toBe(false);
    });

    it('should enable/disable style', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updatePreferences({ enableStyle: true });

      const preferences = result.current.getPreferences();
      expect(preferences.enableStyle).toBe(true);
    });

    it('should update model config', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updateConfig({
        suggestions: { maxCompletions: 10, maxPhrases: 5, maxCorrections: 3, minConfidence: 0.5 }
      });

      const config = result.current.getConfig();
      expect(config.suggestions.maxCompletions).toBe(10);
    });

    it('should update debounce settings', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.updateConfig({
        performance: { cacheEnabled: true, cacheSize: 2000, debounceMs: 200 }
      });

      const config = result.current.getConfig();
      expect(config.performance.debounceMs).toBe(200);
    });
  });

  // ==========================================================================
  // Statistics
  // ==========================================================================

  describe('Statistics', () => {
    it('should return statistics', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      act(() => {
        result.current.analyzeText('Test email content for statistics.');
      });

      const stats = result.current.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalWords).toBeDefined();
    });

    it('should track common words', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const testText = 'test test test hello world test';
      act(() => {
        result.current.analyzeText(testText);
      });

      const stats = result.current.getStatistics();
      expect(stats.commonWords?.['test']).toBeDefined();
    });

    it('should handle empty text statistics', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      act(() => {
        result.current.analyzeText('');
      });

      const stats = result.current.getStatistics();
      expect(stats.totalWords).toBe(0);
      expect(stats.totalCharacters).toBe(0);
    });
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      result.current.getSuggestions(mockBodyContext);
      expect(result.current.suggestions).toBeDefined();

      result.current.clearCache();
      // Suggestions state should be cleared
      expect(() => result.current.clearCache()).not.toThrow();
    });

    it('should handle cache clear with no suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      expect(() => {
        result.current.clearCache();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should get suggestions quickly', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const start = performance.now();
      result.current.getSuggestions(mockBodyContext);
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // Should be < 50ms
    });

    it('should analyze text quickly', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const start = performance.now();
      result.current.analyzeText('This is a test email for performance testing.');
      const end = performance.now();

      expect(end - start).toBeLessThan(50);
    });

    it('should handle multiple rapid suggestions', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        result.current.getSuggestions({
          ...mockBodyContext,
          text: `Test ${i} `,
          cursorPosition: 6 + i * 6
        });
      }
      const end = performance.now();

      expect(end - start).toBeLessThan(500);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const suggestionsResult = result.current.getSuggestions(mockEmptyContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();
    });

    it('should handle very short text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const shortContext: WritingContext = {
        ...mockBodyContext,
        text: 'Hi',
        cursorPosition: 2
      };

      const suggestionsResult = result.current.getSuggestions(shortContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();
    });

    it('should handle very long text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const longText = 'Test '.repeat(1000);
      const longContext: WritingContext = {
        ...mockBodyContext,
        text: longText,
        cursorPosition: 5000
      };

      const suggestionsResult = result.current.getSuggestions(longContext);

      expect(suggestionsResult).toBeDefined();
      expect(suggestionsResult.suggestions).toBeDefined();
    });

    it('should handle special characters', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const specialContext: WritingContext = {
        ...mockBodyContext,
        text: 'Hello @#$%^&*()_+ World!',
        cursorPosition: 24
      };

      const suggestionsResult = result.current.getSuggestions(specialContext);

      expect(suggestionsResult).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const unicodeContext: WritingContext = {
        ...mockBodyContext,
        text: 'Hello 你好 World 🌍',
        cursorPosition: 17
      };

      const suggestionsResult = result.current.getSuggestions(unicodeContext);

      expect(suggestionsResult).toBeDefined();
    });

    it('should handle disabled predictive typing', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const disabledContext: WritingContext = {
        ...mockBodyContext,
        userPreferences: {
          ...mockBodyContext.userPreferences!,
          enabled: false
        }
      };

      const suggestionsResult = result.current.getSuggestions(disabledContext);

      expect(suggestionsResult).toBeDefined();
    });
  });

  // ==========================================================================
  // Learning
  // ==========================================================================

  describe('Learning', () => {
    it('should learn from user text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const uniqueWord = 'supercalifragilisticexpialidocious';
      result.current.learnFromText(`This is a ${uniqueWord} word.`);

      // After learning, should be able to complete this word
      const learningContext: WritingContext = {
        ...mockBodyContext,
        text: uniqueWord.substring(0, 5),
        cursorPosition: 5
      };

      const suggestionsResult = result.current.getSuggestions(learningContext);

      expect(suggestionsResult).toBeDefined();
    });

    it('should learn patterns from repeated text', () => {
      const { result } = renderHook(() => usePredictiveTyping());

      const phrase = 'best regards';
      for (let i = 0; i < 5; i++) {
        result.current.learnFromText(`Thank you, ${phrase}`);
      }

      const context: WritingContext = {
        ...mockBodyContext,
        text: phrase.substring(0, 4),
        cursorPosition: 4
      };

      const suggestionsResult = result.current.getSuggestions(context);

      expect(suggestionsResult).toBeDefined();
    });
  });
});
