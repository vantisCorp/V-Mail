import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Suggestion,
  SuggestionType,
  SuggestionContext,
  SuggestionResult,
  SuggestionConfig,
  DEFAULT_SUGGESTION_CONFIG,
  ReplySuggestion,
  QuickActionSuggestion,
  FollowUpSuggestion,
  AttachmentSuggestion,
  RecipientSuggestion,
  LabelSuggestion,
  SuggestionFeedback,
  SuggestionStatistics,
  TrainingExample
} from '../types/smartSuggestions';
import { SuggestionEngine, createSuggestionEngine } from '../ml/suggestionEngine';

interface UseSmartSuggestionsState {
  isLoading: boolean;
  error: string | null;
  currentSuggestions: Suggestion[];
  lastResult: SuggestionResult | null;
  statistics: SuggestionStatistics;
}

interface UseSmartSuggestionsReturn {
  isLoading: boolean;
  error: string | null;
  suggestions: Suggestion[];
  lastResult: SuggestionResult | null;
  statistics: SuggestionStatistics;
  generateSuggestions: (context: SuggestionContext) => Promise<SuggestionResult>;
  batchGenerateSuggestions: (contexts: SuggestionContext[]) => Promise<SuggestionResult[]>;
  getReplySuggestions: (emailId: string) => ReplySuggestion[];
  getQuickActionSuggestions: (emailId: string) => QuickActionSuggestion[];
  getFollowUpSuggestions: (emailId: string) => FollowUpSuggestion[];
  getAttachmentSuggestions: (emailId: string) => AttachmentSuggestion[];
  getRecipientSuggestions: (emailId: string) => RecipientSuggestion[];
  getLabelSuggestions: (emailId: string) => LabelSuggestion[];
  acceptSuggestion: (suggestionId: string) => void;
  rejectSuggestion: (suggestionId: string) => void;
  addFeedback: (suggestionId: string, feedback: SuggestionFeedback) => void;
  clearSuggestions: () => void;
  updateConfig: (config: Partial<SuggestionConfig>) => void;
  getConfig: () => SuggestionConfig;
  addTrainingExample: (example: TrainingExample) => void;
  resetLearning: () => void;
  getStatistics: () => SuggestionStatistics;
  resetStatistics: () => void;
}

const initialStatistics: SuggestionStatistics = {
  totalSuggestions: 0,
  acceptedSuggestions: 0,
  rejectedSuggestions: 0,
  acceptanceRate: 0,
  avgConfidence: 0,
  avgResponseTime: 0,
  byType: {} as unknown,
  byCategory: {},
  topSuggestions: [],
  recentFeedback: []
};

export function useSmartSuggestions(initialConfig?: Partial<SuggestionConfig>): UseSmartSuggestionsReturn {
  const [state, setState] = useState<UseSmartSuggestionsState>({
    isLoading: false,
    error: null,
    currentSuggestions: [],
    lastResult: null,
    statistics: { ...initialStatistics }
  });

  const engineRef = useRef<SuggestionEngine | null>(null);
  const suggestionsCache = useRef<Map<string, SuggestionResult>>(new Map());
  const feedbackHistory = useRef<SuggestionFeedback[]>([]);
  const trainingExamples = useRef<TrainingExample[]>([]);

  useEffect(() => {
    engineRef.current = createSuggestionEngine(initialConfig);
  }, [initialConfig]);

  const generateSuggestions = useCallback(async (context: SuggestionContext): Promise<SuggestionResult> => {
    if (!engineRef.current) {
      throw new Error('Suggestion engine not initialized');
    }

    const cachedResult = suggestionsCache.current.get(context.emailId);
    if (cachedResult) {
      setState((prev) => ({
        ...prev,
        currentSuggestions: cachedResult.suggestions,
        lastResult: cachedResult
      }));
      return cachedResult;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = engineRef.current.generateSuggestions(context);
      suggestionsCache.current.set(context.emailId, result);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentSuggestions: result.suggestions,
        lastResult: result,
        statistics: updateStatistics(prev.statistics, result)
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const batchGenerateSuggestions = useCallback(async (contexts: SuggestionContext[]): Promise<SuggestionResult[]> => {
    if (!engineRef.current) {
      throw new Error('Suggestion engine not initialized');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const results: SuggestionResult[] = [];

      for (const context of contexts) {
        let result = suggestionsCache.current.get(context.emailId);
        if (!result) {
          result = engineRef.current.generateSuggestions(context);
          suggestionsCache.current.set(context.emailId, result);
        }
        results.push(result);
      }

      const lastResult = results[results.length - 1];
      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentSuggestions: lastResult?.suggestions || [],
        lastResult
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const getReplySuggestions = useCallback((emailId: string): ReplySuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is ReplySuggestion => s.type === SuggestionType.REPLY);
  }, []);

  const getQuickActionSuggestions = useCallback((emailId: string): QuickActionSuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is QuickActionSuggestion => s.type === SuggestionType.QUICK_ACTION);
  }, []);

  const getFollowUpSuggestions = useCallback((emailId: string): FollowUpSuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is FollowUpSuggestion => s.type === SuggestionType.FOLLOW_UP);
  }, []);

  const getAttachmentSuggestions = useCallback((emailId: string): AttachmentSuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is AttachmentSuggestion => s.type === SuggestionType.ATTACHMENT);
  }, []);

  const getRecipientSuggestions = useCallback((emailId: string): RecipientSuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is RecipientSuggestion => s.type === SuggestionType.RECIPIENT);
  }, []);

  const getLabelSuggestions = useCallback((emailId: string): LabelSuggestion[] => {
    const cached = suggestionsCache.current.get(emailId);
    if (!cached) {
      return [];
    }
    return cached.suggestions.filter((s): s is LabelSuggestion => s.type === SuggestionType.LABEL);
  }, []);

  const findSuggestionById = useCallback((id: string): Suggestion | null => {
    for (const [, result] of suggestionsCache.current) {
      const suggestion = result.suggestions.find((s) => s.id === id);
      if (suggestion) {
        return suggestion;
      }
    }
    return null;
  }, []);

  const acceptSuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = findSuggestionById(suggestionId);
      if (!suggestion) {
        return;
      }

      const feedback: SuggestionFeedback = {
        suggestionId,
        accepted: true,
        timestamp: new Date(),
        rating: 5
      };

      feedbackHistory.current.push(feedback);

      if (state.lastResult) {
        const example: TrainingExample = {
          suggestion,
          feedback,
          emailContext: state.lastResult.context,
          outcome: 'positive'
        };
        trainingExamples.current.push(example);
        engineRef.current?.addTrainingExample(example);
      }

      setState((prev) => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          acceptedSuggestions: prev.statistics.acceptedSuggestions + 1,
          acceptanceRate: calculateAcceptanceRate(
            prev.statistics.acceptedSuggestions + 1,
            prev.statistics.rejectedSuggestions
          ),
          recentFeedback: [...prev.statistics.recentFeedback.slice(-9), feedback]
        }
      }));
    },
    [state.lastResult, findSuggestionById]
  );

  const rejectSuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = findSuggestionById(suggestionId);
      if (!suggestion) {
        return;
      }

      const feedback: SuggestionFeedback = {
        suggestionId,
        accepted: false,
        timestamp: new Date(),
        rating: 1
      };

      feedbackHistory.current.push(feedback);

      if (state.lastResult) {
        const example: TrainingExample = {
          suggestion,
          feedback,
          emailContext: state.lastResult.context,
          outcome: 'negative'
        };
        trainingExamples.current.push(example);
        engineRef.current?.addTrainingExample(example);
      }

      setState((prev) => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          rejectedSuggestions: prev.statistics.rejectedSuggestions + 1,
          acceptanceRate: calculateAcceptanceRate(
            prev.statistics.acceptedSuggestions,
            prev.statistics.rejectedSuggestions + 1
          ),
          recentFeedback: [...prev.statistics.recentFeedback.slice(-9), feedback]
        }
      }));
    },
    [state.lastResult, findSuggestionById]
  );

  const addFeedback = useCallback(
    (suggestionId: string, feedback: SuggestionFeedback) => {
      const suggestion = findSuggestionById(suggestionId);
      if (!suggestion) {
        return;
      }

      feedbackHistory.current.push(feedback);

      let outcome: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (feedback.rating && feedback.rating >= 4) {
        outcome = 'positive';
      } else if (feedback.rating && feedback.rating <= 2) {
        outcome = 'negative';
      }

      if (state.lastResult) {
        const example: TrainingExample = {
          suggestion,
          feedback,
          emailContext: state.lastResult.context,
          outcome
        };
        trainingExamples.current.push(example);
        engineRef.current?.addTrainingExample(example);
      }

      setState((prev) => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          recentFeedback: [...prev.statistics.recentFeedback.slice(-9), feedback]
        }
      }));
    },
    [state.lastResult, findSuggestionById]
  );

  const clearSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSuggestions: [],
      lastResult: null
    }));
  }, []);

  const updateConfig = useCallback((config: Partial<SuggestionConfig>) => {
    engineRef.current?.updateConfig(config);
  }, []);

  const getConfig = useCallback((): SuggestionConfig => {
    return engineRef.current?.getConfig() || { ...DEFAULT_SUGGESTION_CONFIG };
  }, []);

  const addTrainingExample = useCallback((example: TrainingExample) => {
    trainingExamples.current.push(example);
    engineRef.current?.addTrainingExample(example);
  }, []);

  const resetLearning = useCallback(() => {
    trainingExamples.current = [];
    feedbackHistory.current = [];
    suggestionsCache.current.clear();
    engineRef.current?.clearTrainingData();
    engineRef.current?.resetUserBehavior();
    setState((prev) => ({
      ...prev,
      statistics: { ...initialStatistics }
    }));
  }, []);

  const getStatistics = useCallback((): SuggestionStatistics => {
    return state.statistics;
  }, [state.statistics]);

  const resetStatistics = useCallback(() => {
    setState((prev) => ({
      ...prev,
      statistics: { ...initialStatistics }
    }));
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    suggestions: state.currentSuggestions,
    lastResult: state.lastResult,
    statistics: state.statistics,
    generateSuggestions,
    batchGenerateSuggestions,
    getReplySuggestions,
    getQuickActionSuggestions,
    getFollowUpSuggestions,
    getAttachmentSuggestions,
    getRecipientSuggestions,
    getLabelSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    addFeedback,
    clearSuggestions,
    updateConfig,
    getConfig,
    addTrainingExample,
    resetLearning,
    getStatistics,
    resetStatistics
  };
}

function updateStatistics(stats: SuggestionStatistics, result: SuggestionResult): SuggestionStatistics {
  const newStats = { ...stats };
  newStats.totalSuggestions += result.suggestions.length;
  newStats.avgConfidence = result.metadata.avgConfidence;
  newStats.avgResponseTime = result.processingTime;

  result.suggestions.forEach((suggestion) => {
    if (!newStats.byType[suggestion.type]) {
      newStats.byType[suggestion.type] = { total: 0, accepted: 0, acceptanceRate: 0 };
    }
    newStats.byType[suggestion.type].total++;
  });

  return newStats;
}

function calculateAcceptanceRate(accepted: number, rejected: number): number {
  const total = accepted + rejected;
  return total > 0 ? accepted / total : 0;
}

export type { UseSmartSuggestionsReturn };
export default useSmartSuggestions;
