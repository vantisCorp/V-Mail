/**
 * useSentimentAnalysis Hook
 * Part of v1.4.0 AI-Powered Intelligence
 *
 * Provides sentiment, emotion, and tone analysis for email content.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Sentiment,
  Emotion,
  Tone,
  SentimentAnalysisResult,
  SentimentContext,
  SentimentConfig,
  DEFAULT_SENTIMENT_CONFIG,
  SentimentStatistics,
  SentimentTrend,
  SentimentEntry,
  ReplyToneSuggestion,
  SentimentFeedback,
  SentimentFeedbackRecord
} from '../types/sentimentAnalysis';
import { SentimentModel, createSentimentModel } from '../ml/sentimentModel';

// ============================================================================
// Hook State Types
// ============================================================================

interface UseSentimentAnalysisState {
  isLoading: boolean;
  error: string | null;
  currentResult: SentimentAnalysisResult | null;
  statistics: SentimentStatistics | null;
}

interface UseSentimentAnalysisReturn {
  // State
  isLoading: boolean;
  error: string | null;
  result: SentimentAnalysisResult | null;
  statistics: SentimentStatistics | null;

  // Core analysis functions
  analyze: (context: SentimentContext) => Promise<SentimentAnalysisResult>;
  analyzeBatch: (contexts: SentimentContext[]) => Promise<SentimentAnalysisResult[]>;
  analyzeText: (text: string) => Promise<SentimentAnalysisResult>;

  // Quick analysis helpers
  getSentiment: (emailId: string) => Sentiment | null;
  getEmotion: (emailId: string) => Emotion | null;
  getTone: (emailId: string) => Tone | null;
  getSentimentScore: (emailId: string) => number | null;

  // Recommendations
  getReplyToneSuggestion: (emailId?: string) => ReplyToneSuggestion | null;
  getSentimentFeedback: (emailId?: string) => SentimentFeedback | null;

  // Statistics
  calculateStatistics: (results: SentimentAnalysisResult[]) => SentimentStatistics;
  getTrend: (emailIds: string[]) => { averageScore: number; trend: 'improving' | 'declining' | 'stable' };

  // Configuration
  updateConfig: (config: Partial<SentimentConfig>) => void;
  getConfig: () => SentimentConfig;

  // Feedback
  submitFeedback: (feedback: SentimentFeedbackRecord) => void;
  getFeedbackHistory: () => SentimentFeedbackRecord[];

  // Cache management
  clearCache: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSentimentAnalysis(initialConfig?: Partial<SentimentConfig>): UseSentimentAnalysisReturn {
  // State
  const [state, setState] = useState<UseSentimentAnalysisState>({
    isLoading: false,
    error: null,
    currentResult: null,
    statistics: null
  });

  // Refs
  const modelRef = useRef<SentimentModel | null>(null);
  const resultsCache = useRef<Map<string, SentimentAnalysisResult>>(new Map());
  const feedbackHistory = useRef<SentimentFeedbackRecord[]>([]);

  // Initialize model
  useEffect(() => {
    modelRef.current = createSentimentModel(initialConfig);
  }, [initialConfig]);

  // ============================================================================
  // Core Analysis Functions
  // ============================================================================

  /**
   * Analyze sentiment of email
   */
  const analyze = useCallback(async (context: SentimentContext): Promise<SentimentAnalysisResult> => {
    if (!modelRef.current) {
      throw new Error('Sentiment model not initialized');
    }

    // Check cache
    const cached = resultsCache.current.get(context.emailId);
    if (cached) {
      setState((prev) => ({
        ...prev,
        currentResult: cached
      }));
      return cached;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = modelRef.current.analyze(context);
      resultsCache.current.set(context.emailId, result);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentResult: result
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

  /**
   * Analyze multiple emails
   */
  const analyzeBatch = useCallback(async (contexts: SentimentContext[]): Promise<SentimentAnalysisResult[]> => {
    if (!modelRef.current) {
      throw new Error('Sentiment model not initialized');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const results: SentimentAnalysisResult[] = [];

      for (const context of contexts) {
        let result = resultsCache.current.get(context.emailId);
        if (!result) {
          result = modelRef.current!.analyze(context);
          resultsCache.current.set(context.emailId, result);
        }
        results.push(result);
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        currentResult: results[results.length - 1] || null
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

  /**
   * Analyze a single text string
   */
  const analyzeText = useCallback(
    async (text: string): Promise<SentimentAnalysisResult> => {
      const context: SentimentContext = {
        emailId: `text-${Date.now()}`,
        subject: '',
        body: text,
        sender: '',
        recipients: [],
        timestamp: new Date()
      };

      return analyze(context);
    },
    [analyze]
  );

  // ============================================================================
  // Quick Analysis Helpers
  // ============================================================================

  /**
   * Get sentiment for an email
   */
  const getSentiment = useCallback((emailId: string): Sentiment | null => {
    const result = resultsCache.current.get(emailId);
    return result?.overall || null;
  }, []);

  /**
   * Get dominant emotion for an email
   */
  const getEmotion = useCallback((emailId: string): Emotion | null => {
    const result = resultsCache.current.get(emailId);
    if (!result || result.emotions.length === 0) {
      return null;
    }
    return result.emotions[0].emotion;
  }, []);

  /**
   * Get dominant tone for an email
   */
  const getTone = useCallback((emailId: string): Tone | null => {
    const result = resultsCache.current.get(emailId);
    if (!result || result.tone.length === 0) {
      return null;
    }
    return result.tone[0].tone;
  }, []);

  /**
   * Get sentiment score for an email
   */
  const getSentimentScore = useCallback((emailId: string): number | null => {
    const result = resultsCache.current.get(emailId);
    return result?.score ?? null;
  }, []);

  // ============================================================================
  // Recommendations
  // ============================================================================

  /**
   * Get reply tone suggestion for an email
   */
  const getReplyToneSuggestion = useCallback(
    (emailId?: string): ReplyToneSuggestion | null => {
      const result = emailId ? resultsCache.current.get(emailId) : state.currentResult;

      if (!result || !modelRef.current) {
        return null;
      }

      return modelRef.current.suggestReplyTone(result);
    },
    [state.currentResult]
  );

  /**
   * Get sentiment feedback for an email
   */
  const getSentimentFeedback = useCallback(
    (emailId?: string): SentimentFeedback | null => {
      const result = emailId ? resultsCache.current.get(emailId) : state.currentResult;

      if (!result || !modelRef.current) {
        return null;
      }

      return modelRef.current.generateFeedback(result);
    },
    [state.currentResult]
  );

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Calculate statistics from results
   */
  const calculateStatistics = useCallback((results: SentimentAnalysisResult[]): SentimentStatistics => {
    const sentimentDistribution: Record<Sentiment, number> = {
      [Sentiment.POSITIVE]: 0,
      [Sentiment.NEUTRAL]: 0,
      [Sentiment.NEGATIVE]: 0
    };

    const emotionDistribution: Record<Emotion, number> = {} as unknown;
    Object.values(Emotion).forEach((e) => {
      emotionDistribution[e] = 0;
    });

    const toneDistribution: Record<Tone, number> = {} as unknown;
    Object.values(Tone).forEach((t) => {
      toneDistribution[t] = 0;
    });

    let totalScore = 0;
    const entries: SentimentEntry[] = [];

    results.forEach((result, index) => {
      // Sentiment distribution
      sentimentDistribution[result.overall]++;

      // Emotion distribution
      result.emotions.forEach((e) => {
        emotionDistribution[e.emotion]++;
      });

      // Tone distribution
      result.tone.forEach((t) => {
        toneDistribution[t.tone]++;
      });

      totalScore += result.score;

      entries.push({
        emailId: `email-${index}`,
        subject: '',
        sentiment: result.overall,
        score: result.score,
        timestamp: new Date(result.timestamp)
      });
    });

    const averageScore = results.length > 0 ? totalScore / results.length : 0;

    // Sort entries by score for top positive/negative
    entries.sort((a, b) => b.score - a.score);

    const trend: SentimentTrend[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trend.push({
        date,
        averageScore: averageScore,
        sentiment:
          averageScore > 0.1 ? Sentiment.POSITIVE : averageScore < -0.1 ? Sentiment.NEGATIVE : Sentiment.NEUTRAL,
        emailCount: Math.floor(results.length / 7)
      });
    }

    return {
      totalEmails: results.length,
      sentimentDistribution,
      emotionDistribution,
      toneDistribution,
      averageSentimentScore: averageScore,
      sentimentTrend: trend,
      topPositiveEmails: entries.filter((e) => e.sentiment === Sentiment.POSITIVE).slice(0, 5),
      topNegativeEmails: entries
        .filter((e) => e.sentiment === Sentiment.NEGATIVE)
        .slice(-5)
        .reverse(),
      period: {
        start: trend[0].date,
        end: trend[trend.length - 1].date
      }
    };
  }, []);

  /**
   * Get sentiment trend for multiple emails
   */
  const getTrend = useCallback(
    (emailIds: string[]): { averageScore: number; trend: 'improving' | 'declining' | 'stable' } => {
      const results: SentimentAnalysisResult[] = [];

      emailIds.forEach((id) => {
        const result = resultsCache.current.get(id);
        if (result) {
          results.push(result);
        }
      });

      if (!modelRef.current) {
        return { averageScore: 0, trend: 'stable' };
      }

      return modelRef.current.calculateTrend(results);
    },
    []
  );

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update configuration
   */
  const updateConfig = useCallback((config: Partial<SentimentConfig>) => {
    modelRef.current?.updateConfig(config);
  }, []);

  /**
   * Get current configuration
   */
  const getConfig = useCallback((): SentimentConfig => {
    return modelRef.current?.getConfig() || { ...DEFAULT_SENTIMENT_CONFIG };
  }, []);

  // ============================================================================
  // Feedback
  // ============================================================================

  /**
   * Submit feedback for sentiment analysis
   */
  const submitFeedback = useCallback((feedback: SentimentFeedbackRecord) => {
    feedbackHistory.current.push(feedback);
  }, []);

  /**
   * Get feedback history
   */
  const getFeedbackHistory = useCallback((): SentimentFeedbackRecord[] => {
    return [...feedbackHistory.current];
  }, []);

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    resultsCache.current.clear();
    modelRef.current?.clearCache();
    setState((prev) => ({
      ...prev,
      currentResult: null,
      statistics: null
    }));
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    result: state.currentResult,
    statistics: state.statistics,

    // Core analysis
    analyze,
    analyzeBatch,
    analyzeText,

    // Quick helpers
    getSentiment,
    getEmotion,
    getTone,
    getSentimentScore,

    // Recommendations
    getReplyToneSuggestion,
    getSentimentFeedback,

    // Statistics
    calculateStatistics,
    getTrend,

    // Configuration
    updateConfig,
    getConfig,

    // Feedback
    submitFeedback,
    getFeedbackHistory,

    // Cache
    clearCache
  };
}

// ============================================================================
// Export
// ============================================================================

export type { UseSentimentAnalysisReturn };
export default useSentimentAnalysis;
