import { useState, useCallback, useRef } from 'react';
import { SummarizationModel, SummarizationContext, SummarizationConfig } from '../ml/summarizationModel';
import {
  EmailSummary,
  KeyPoint,
  ActionItem,
  SummarySegment,
  SummaryType,
  SummaryLength,
  SummaryMetadata,
  DEFAULT_SUMMARIZATION_CONFIG
} from '../types/emailSummarization';

export interface UseEmailSummarizationReturn {
  // State
  summary: EmailSummary | null;
  isSummarizing: boolean;
  error: string | null;
  cache: Map<string, EmailSummary>;
  statistics: {
    totalSummaries: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
    cacheHits: number;
    cacheMisses: number;
  };

  // Methods
  summarize: (context: SummarizationContext) => Promise<EmailSummary>;
  summarizeThread: (emails: Array<{ id: string; subject: string; body: string; from: string; date: string }>) => Promise<EmailSummary>;
  summarizeEmail: (email: { id: string; subject: string; body: string; from: string; date: string }) => Promise<EmailSummary>;
  getKeyPoints: (summary: EmailSummary) => KeyPoint[];
  getActionItems: (summary: EmailSummary) => ActionItem[];
  getSegments: (summary: EmailSummary) => SummarySegment[];
  getTlDr: (summary: EmailSummary) => string;

  // Configuration
  config: SummarizationConfig;
  updateConfig: (config: Partial<SummarizationConfig>) => void;
  clearCache: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useEmailSummarization = (initialConfig?: Partial<SummarizationConfig>): UseEmailSummarizationReturn => {
  // Initialize model
  const modelRef = useRef<SummarizationModel | null>(null);

  // State
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, EmailSummary>>(new Map());
  const [config, setConfig] = useState<SummarizationConfig>({
    ...DEFAULT_SUMMARIZATION_CONFIG,
    ...initialConfig
  });
  const [statistics, setStatistics] = useState({
    totalSummaries: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Initialize model if needed
  if (!modelRef.current) {
    modelRef.current = new SummarizationModel(config);
  }

  // Update model when config changes
  const updateConfig = useCallback((newConfig: Partial<SummarizationConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      if (modelRef.current) {
        modelRef.current.updateConfig(updated);
      }
      return updated;
    });
  }, []);

  // Main summarize method
  const summarize = useCallback(async (context: SummarizationContext): Promise<EmailSummary> => {
    setIsSummarizing(true);
    setError(null);

    const startTime = Date.now();

    try {
      const model = modelRef.current;
      if (!model) {
        throw new Error('Summarization model not initialized');
      }

      // Check cache
      const cacheKey = model.generateCacheKey(context);
      if (config.performance.cacheEnabled && cache.has(cacheKey)) {
        const cachedSummary = cache.get(cacheKey)!;
        setStatistics(prev => ({
          ...prev,
          cacheHits: prev.cacheHits + 1
        }));
        setSummary(cachedSummary);
        return cachedSummary;
      }

      setStatistics(prev => ({
        ...prev,
        cacheMisses: prev.cacheMisses + 1
      }));

      // Generate summary
      const result = model.summarize(context);

      // Update statistics
      const processingTime = Date.now() - startTime;
      const totalTime = statistics.totalProcessingTime + processingTime;
      const totalSummaries = statistics.totalSummaries + 1;

      setStatistics({
        totalSummaries,
        totalProcessingTime: totalTime,
        averageProcessingTime: totalTime / totalSummaries,
        cacheHits: statistics.cacheHits,
        cacheMisses: statistics.cacheMisses + 1
      });

      // Update cache
      if (config.performance.cacheEnabled) {
        setCache(prev => new Map(prev).set(cacheKey, result));
      }

      setSummary(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to summarize email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSummarizing(false);
    }
  }, [cache, config, statistics]);

  // Convenience method for thread summarization
  const summarizeThread = useCallback(async (
    emails: Array<{ id: string; subject: string; body: string; from: string; date: string }>
  ): Promise<EmailSummary> => {
    return summarize({
      emails: emails as any,
      summaryType: SummaryType.HYBRID,
      summaryLength: SummaryLength.MEDIUM,
      includeActionItems: true,
      includeKeyPoints: true
    });
  }, [summarize]);

  // Convenience method for single email summarization
  const summarizeEmail = useCallback(async (
    email: { id: string; subject: string; body: string; from: string; date: string }
  ): Promise<EmailSummary> => {
    return summarize({
      emails: [{
        ...email,
        to: '',
        timestamp: email.date
      } as any],
      summaryType: config.defaultSummaryType || SummaryType.EXTRACTIVE,
      summaryLength: config.defaultSummaryLength || SummaryLength.MEDIUM,
      includeActionItems: true,
      includeKeyPoints: true
    });
  }, [summarize, config.defaultSummaryType, config.defaultSummaryLength]);

  // Get key points from summary
  const getKeyPoints = useCallback((summary: EmailSummary): KeyPoint[] => {
    return summary.keyPoints;
  }, []);

  // Get action items from summary
  const getActionItems = useCallback((summary: EmailSummary): ActionItem[] => {
    return summary.actionItems;
  }, []);

  // Get segments from summary
  const getSegments = useCallback((summary: EmailSummary): SummarySegment[] => {
    return summary.segments;
  }, []);

  // Get TL;DR from summary
  const getTlDr = useCallback((summary: EmailSummary): string => {
    return summary.tlDr;
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset hook state
  const reset = useCallback(() => {
    setSummary(null);
    setIsSummarizing(false);
    setError(null);
    setCache(new Map());
    setStatistics({
      totalSummaries: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  }, []);

  return {
    summary,
    isSummarizing,
    error,
    cache,
    statistics,
    summarize,
    summarizeThread,
    summarizeEmail,
    getKeyPoints,
    getActionItems,
    getSegments,
    getTlDr,
    config,
    updateConfig,
    clearCache,
    clearError,
    reset
  };
};
