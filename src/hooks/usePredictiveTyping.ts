/**
 * usePredictiveTyping Hook
 * Part of v1.4.0 AI-Powered Intelligence
 * 
 * Provides AI-powered text completion and suggestion while composing emails.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  WritingContext,
  SuggestionsResult,
  Suggestion,
  CompletionSuggestion,
  PhraseSuggestion,
  GrammarSuggestion,
  StyleSuggestion,
  TemplateSuggestion,
  EmailSuggestion,
  SubjectSuggestion,
  SuggestionType,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
  TypingStatistics,
  PredictiveTypingConfig,
  DEFAULT_PREDICTIVE_TYPING_CONFIG,
} from '../types/predictiveTyping';
import {
  LanguageModel,
  createLanguageModel,
} from '../ml/languageModel';

// ============================================================================
// Hook State Types
// ============================================================================

interface UsePredictiveTypingState {
  isLoading: boolean;
  error: string | null;
  currentSuggestions: SuggestionsResult | null;
  statistics: TypingStatistics | null;
}

interface UsePredictiveTypingReturn {
  // State
  isLoading: boolean;
  error: string | null;
  suggestions: SuggestionsResult | null;
  statistics: TypingStatistics | null;

  // Core functions
  getSuggestions: (context: WritingContext) => SuggestionsResult;
  acceptSuggestion: (suggestionId: string) => void;
  rejectSuggestion: (suggestionId: string) => void;

  // Text analysis
  analyzeText: (text: string) => void;
  learnFromText: (text: string, acceptedSuggestion?: Suggestion) => void;

  // Configuration
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  getPreferences: () => UserPreferences;
  updateConfig: (config: Partial<PredictiveTypingConfig>) => void;
  getConfig: () => PredictiveTypingConfig;

  // Statistics
  getStatistics: () => TypingStatistics;

  // Cache management
  clearCache: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePredictiveTyping(
  initialPreferences?: Partial<UserPreferences>,
  initialConfig?: Partial<PredictiveTypingConfig>
): UsePredictiveTypingReturn {
  // State
  const [state, setState] = useState<UsePredictiveTypingState>({
    isLoading: false,
    error: null,
    currentSuggestions: null,
    statistics: null,
  });

  // Refs
  const modelRef = useRef<LanguageModel | null>(null);
  const preferencesRef = useRef<UserPreferences>({
    ...DEFAULT_USER_PREFERENCES,
    ...initialPreferences,
  });
  const configRef = useRef<PredictiveTypingConfig>({
    ...DEFAULT_PREDICTIVE_TYPING_CONFIG,
    ...initialConfig,
  });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize model
  useEffect(() => {
    modelRef.current = createLanguageModel(configRef.current);
  }, []);

  // ============================================================================
  // Core Functions
  // ============================================================================

  /**
   * Get suggestions for given context
   */
  const getSuggestions = useCallback((context: WritingContext): SuggestionsResult => {
    if (!modelRef.current) {
      return {
        suggestions: [],
        processingTime: 0,
        modelVersion: '',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = modelRef.current.getSuggestions(context);

      setState(prev => ({
        ...prev,
        isLoading: false,
        currentSuggestions: result,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get suggestions';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        suggestions: [],
        processingTime: 0,
        modelVersion: '',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  /**
   * Accept a suggestion
   */
  const acceptSuggestion = useCallback((suggestionId: string): void => {
    if (!state.currentSuggestions) return;

    const suggestion = state.currentSuggestions.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      // Learn from accepted suggestion
      if (modelRef.current) {
        modelRef.current.learnFromUser(suggestion.text, suggestion);
      }
    }
  }, [state.currentSuggestions]);

  /**
   * Reject a suggestion
   */
  const rejectSuggestion = useCallback((suggestionId: string): void => {
    // Could track rejection for learning in future
    // For now, just ignore the suggestion
  }, []);

  // ============================================================================
  // Text Analysis
  // ============================================================================

  /**
   * Analyze text for statistics
   */
  const analyzeText = useCallback((text: string): void => {
    if (!modelRef.current) return;

    const statistics = modelRef.current.getTypingStatistics(text);
    setState(prev => ({ ...prev, statistics }));
  }, []);

  /**
   * Learn from user's text
   */
  const learnFromText = useCallback((text: string, acceptedSuggestion?: Suggestion): void => {
    if (!modelRef.current) return;

    modelRef.current.learnFromUser(text, acceptedSuggestion);
  }, []);

  // ============================================================================
  // Debounced Suggestions
  // ============================================================================

  /**
   * Get suggestions with debouncing
   */
  const getSuggestionsDebounced = useCallback(
    (context: WritingContext, debounceMs?: number): void => {
      const delay = debounceMs ?? configRef.current.performance.debounceMs;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        getSuggestions(context);
      }, delay);
    },
    [getSuggestions, configRef]
  );

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback((preferences: Partial<UserPreferences>): void => {
    preferencesRef.current = {
      ...preferencesRef.current,
      ...preferences,
    };
  }, []);

  /**
   * Get current preferences
   */
  const getPreferences = useCallback((): UserPreferences => {
    return { ...preferencesRef.current };
  }, []);

  /**
   * Update model configuration
   */
  const updateConfig = useCallback((config: Partial<PredictiveTypingConfig>): void => {
    configRef.current = {
      ...configRef.current,
      ...config,
    };
    
    // Reinitialize model with new config
    if (modelRef.current) {
      modelRef.current = createLanguageModel(configRef.current);
    }
  }, []);

  /**
   * Get current configuration
   */
  const getConfig = useCallback((): PredictiveTypingConfig => {
    return { ...configRef.current };
  }, []);

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get typing statistics
   */
  const getStatistics = useCallback((): TypingStatistics => {
    if (!modelRef.current || !state.statistics) {
      return {
        totalCharacters: 0,
        totalWords: 0,
        averageWordLength: 0,
        commonWords: {},
        commonPhrases: {},
        typingSpeed: 0,
        acceptanceRate: 0,
      };
    }

    return state.statistics;
  }, [state.statistics]);

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Clear model cache
   */
  const clearCache = useCallback((): void => {
    if (modelRef.current) {
      modelRef.current.clearCache();
      setState(prev => ({ ...prev, currentSuggestions: null }));
    }
  }, []);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    suggestions: state.currentSuggestions,
    statistics: state.statistics,

    // Core functions
    getSuggestions,
    acceptSuggestion,
    rejectSuggestion,

    // Text analysis
    analyzeText,
    learnFromText,

    // Configuration
    updatePreferences,
    getPreferences,
    updateConfig,
    getConfig,

    // Statistics
    getStatistics,

    // Cache management
    clearCache,
  };
}

// ============================================================================
// Export
// ============================================================================

export type { UsePredictiveTypingReturn };
export default usePredictiveTyping;