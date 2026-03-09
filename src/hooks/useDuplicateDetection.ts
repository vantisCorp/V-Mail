import { useState, useCallback, useRef } from 'react';
import { DuplicateDetector, DetectionContext } from '../ml/duplicateDetector';
import {
  EmailForDetection,
  DuplicateResult,
  DuplicateGroup,
  DuplicateAction,
  DetectionConfig,
  DetectionStatistics,
  DuplicateType,
  DuplicateSeverity,
  UserFeedback,
  DEFAULT_DETECTION_CONFIG
} from '../types/duplicateDetection';

export interface UseDuplicateDetectionReturn {
  // State
  duplicates: DuplicateResult[];
  groups: DuplicateGroup[];
  isDetecting: boolean;
  error: string | null;
  cache: Map<string, DuplicateResult[]>;
  statistics: DetectionStatistics;

  // Methods
  detect: (context: DetectionContext) => Promise<DuplicateResult[]>;
  detectPair: (email1: EmailForDetection, email2: EmailForDetection) => DuplicateResult | null;
  detectInList: (emails: EmailForDetection[]) => Promise<DuplicateResult[]>;
  groupDuplicates: (duplicates: DuplicateResult[]) => DuplicateGroup[];
  suggestAction: (duplicate: DuplicateResult) => DuplicateAction;
  recordFeedback: (feedback: UserFeedback) => void;

  // Configuration
  config: DetectionConfig;
  updateConfig: (config: Partial<DetectionConfig>) => void;
  clearCache: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useDuplicateDetection = (initialConfig?: Partial<DetectionConfig>): UseDuplicateDetectionReturn => {
  // Initialize model
  const modelRef = useRef<DuplicateDetector | null>(null);

  // State
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, DuplicateResult[]>>(new Map());
  const [config, setConfig] = useState<DetectionConfig>({
    ...DEFAULT_DETECTION_CONFIG,
    ...initialConfig
  });
  const [statistics, setStatistics] = useState<DetectionStatistics>({
    totalEmailsProcessed: 0,
    totalDuplicatesFound: 0,
    totalGroups: 0,
    averageSimilarity: 0,
    duplicatesByType: {
      [DuplicateType.EXACT]: 0,
      [DuplicateType.NEAR]: 0,
      [DuplicateType.PARTIAL]: 0,
      [DuplicateType.THREAD]: 0
    },
    duplicatesBySeverity: {
      [DuplicateSeverity.HIGH]: 0,
      [DuplicateSeverity.MEDIUM]: 0,
      [DuplicateSeverity.LOW]: 0
    },
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Initialize model if needed
  if (!modelRef.current) {
    modelRef.current = new DuplicateDetector(config);
  }

  // Update model when config changes
  const updateConfig = useCallback((newConfig: Partial<DetectionConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (modelRef.current) {
        modelRef.current.updateConfig(updated);
      }
      return updated;
    });
  }, []);

  // Main detect method
  const detect = useCallback(
    async (context: DetectionContext): Promise<DuplicateResult[]> => {
      setIsDetecting(true);
      setError(null);

      try {
        const model = modelRef.current;
        if (!model) {
          throw new Error('Duplicate detector model not initialized');
        }

        // Check cache for each pair
        const localCacheHits = 0;
        const localCacheMisses = 0;

        // Run detection
        const results = model.detectDuplicates(context);

        // Update cache
        if (config.enableCache) {
          const newCache = new Map(cache);
          for (const result of results) {
            const key = model.generateCacheKey(result.originalEmail, result.duplicateEmail);
            newCache.set(key, [result]);
          }
          setCache(newCache);
        }

        // Update statistics
        const modelStats = model.getStatistics(results);

        setStatistics((prev) => ({
          ...prev,
          totalEmailsProcessed: prev.totalEmailsProcessed + context.emails.length,
          totalDuplicatesFound: prev.totalDuplicatesFound + results.length,
          cacheHits: prev.cacheHits + localCacheHits,
          cacheMisses: prev.cacheMisses + localCacheMisses + 1,
          averageSimilarity: modelStats.averageSimilarity,
          duplicatesByType: modelStats.duplicatesByType,
          duplicatesBySeverity: modelStats.duplicatesBySeverity
        }));

        setDuplicates(results);

        // Generate groups
        const duplicateGroups = model.groupDuplicates(results);
        setGroups(duplicateGroups);

        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to detect duplicates';
        setError(errorMessage);
        throw err;
      } finally {
        setIsDetecting(false);
      }
    },
    [cache, config]
  );

  // Detect pair
  const detectPair = useCallback((email1: EmailForDetection, email2: EmailForDetection): DuplicateResult | null => {
    const model = modelRef.current;
    if (!model) {
      return null;
    }
    return model.detectPair(email1, email2);
  }, []);

  // Detect in list (convenience method)
  const detectInList = useCallback(
    async (emails: EmailForDetection[]): Promise<DuplicateResult[]> => {
      return detect({
        emails,
        config: { ...config }
      });
    },
    [detect, config]
  );

  // Group duplicates
  const groupDuplicates = useCallback((duplicateResults: DuplicateResult[]): DuplicateGroup[] => {
    const model = modelRef.current;
    if (!model) {
      return [];
    }
    return model.groupDuplicates(duplicateResults);
  }, []);

  // Suggest action
  const suggestAction = useCallback((duplicate: DuplicateResult): DuplicateAction => {
    const model = modelRef.current;
    if (!model) {
      return DuplicateAction.MANUAL_REVIEW;
    }
    return model.suggestAction(duplicate);
  }, []);

  // Record feedback
  const recordFeedback = useCallback((feedback: UserFeedback) => {
    const model = modelRef.current;
    if (model) {
      model.recordFeedback(feedback);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    if (modelRef.current) {
      modelRef.current.clearCache();
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset hook state
  const reset = useCallback(() => {
    setDuplicates([]);
    setGroups([]);
    setIsDetecting(false);
    setError(null);
    setCache(new Map());
    setStatistics({
      totalEmailsProcessed: 0,
      totalDuplicatesFound: 0,
      totalGroups: 0,
      averageSimilarity: 0,
      duplicatesByType: {
        [DuplicateType.EXACT]: 0,
        [DuplicateType.NEAR]: 0,
        [DuplicateType.PARTIAL]: 0,
        [DuplicateType.THREAD]: 0
      },
      duplicatesBySeverity: {
        [DuplicateSeverity.HIGH]: 0,
        [DuplicateSeverity.MEDIUM]: 0,
        [DuplicateSeverity.LOW]: 0
      },
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  }, []);

  return {
    duplicates,
    groups,
    isDetecting,
    error,
    cache,
    statistics,
    detect,
    detectPair,
    detectInList,
    groupDuplicates,
    suggestAction,
    recordFeedback,
    config,
    updateConfig,
    clearCache,
    clearError,
    reset
  };
};
