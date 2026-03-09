/**
 * AI-Powered Email Categorization Hook
 *
 * Provides automatic email categorization functionality using machine learning.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CategorizationResult,
  CustomCategory,
  CategorizationModelConfig,
  CategorizationStats,
  TrainingExample,
  CategorizationRule,
  BatchCategorizationResult,
  SYSTEM_CATEGORIES,
  DEFAULT_CATEGORIZATION_CONFIG
} from '../types/aiCategorization';
import { categorizationModel } from '../ml/categorizationModel';

/**
 * AI Categorization Hook
 */
export const useAICategorization = (config: Partial<CategorizationModelConfig> = {}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(config.enabled ?? DEFAULT_CATEGORIZATION_CONFIG.enabled);

  const [modelConfig, setModelConfig] = useState<CategorizationModelConfig>({
    ...DEFAULT_CATEGORIZATION_CONFIG,
    ...config
  });

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>([]);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [categorizationResults, setCategorizationResults] = useState<Map<string, CategorizationResult>>(new Map());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  /**
   * Get all available categories (system + custom)
   */
  const getAllCategories = useMemo(() => {
    return [...SYSTEM_CATEGORIES, ...customCategories];
  }, [customCategories]);

  /**
   * Categorize a single email
   */
  const categorizeEmail = useCallback(
    async (email: unknown): Promise<CategorizationResult> => {
      if (!isEnabled) {
        throw new Error('Categorization is disabled');
      }

      setIsProcessing(true);

      try {
        // Check for user-defined rules first
        const ruleResult = applyRules(email);
        if (ruleResult) {
          return ruleResult;
        }

        // Use ML model
        const result = categorizationModel.categorize(email);

        // Store result
        setCategorizationResults((prev) => new Map(prev).set(email.id, result));

        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [isEnabled, categorizationRules]
  );

  /**
   * Batch categorize emails
   */
  const batchCategorize = useCallback(
    async (emails: unknown[]): Promise<BatchCategorizationResult> => {
      if (!isEnabled) {
        throw new Error('Categorization is disabled');
      }

      setIsProcessing(true);
      const startTime = performance.now();

      try {
        const results = new Map<string, CategorizationResult>();
        let processedCount = 0;
        let failedCount = 0;

        for (const email of emails) {
          try {
            if (!email || !email.id) {
              throw new Error('Invalid email object');
            }
            const result = await categorizeEmail(email);
            results.set(email.id, result);
            processedCount++;
          } catch (error) {
            console.error(`Failed to categorize email ${email?.id || 'unknown'}:`, error);
            failedCount++;
          }
        }

        const endTime = performance.now();

        return {
          results,
          processedCount,
          failedCount,
          totalTime: endTime - startTime
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [isEnabled, categorizeEmail]
  );

  /**
   * Apply user-defined rules
   */
  const applyRules = useCallback(
    (email: unknown): CategorizationResult | null => {
      for (const rule of categorizationRules) {
        if (!rule.enabled) {
          continue;
        }

        let matches = false;
        const conditions = rule.conditions;

        if (rule.logicOperator === 'and') {
          matches = conditions.every((condition) => matchCondition(email, condition));
        } else {
          matches = conditions.some((condition) => matchCondition(email, condition));
        }

        if (matches) {
          return {
            primary: {
              category: rule.categoryId,
              confidence: 1.0,
              reasoning: `Matched rule: ${rule.name}`
            },
            alternatives: [],
            timestamp: new Date().toISOString(),
            modelVersion: 'rule-based',
            processingTime: 0
          };
        }
      }

      return null;
    },
    [categorizationRules]
  );

  /**
   * Match a single condition
   */
  const matchCondition = useCallback((email: unknown, condition: unknown): boolean => {
    let fieldValue = '';

    switch (condition.field) {
      case 'sender':
        fieldValue = email.from || '';
        break;
      case 'subject':
        fieldValue = email.subject || '';
        break;
      case 'body':
        fieldValue = email.body || '';
        break;
      case 'domain':
        fieldValue = email.from?.split('@')[1] || '';
        break;
      case 'hasAttachment':
        fieldValue = ((email.attachments || []).length > 0).toString();
        break;
      default:
        return false;
    }

    const value = condition.value;
    const text = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase();
    const pattern = condition.caseSensitive ? value : value.toLowerCase();

    switch (condition.operator) {
      case 'contains':
        return text.includes(pattern);
      case 'equals':
        return text === pattern;
      case 'startsWith':
        return text.startsWith(pattern);
      case 'endsWith':
        return text.endsWith(pattern);
      case 'matches':
        return new RegExp(pattern).test(text);
      default:
        return false;
    }
  }, []);

  /**
   * Create a custom category
   */
  const createCustomCategory = useCallback(
    (category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>): CustomCategory => {
      const newCategory: CustomCategory = {
        ...category,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCustomCategories((prev) => [...prev, newCategory]);

      return newCategory;
    },
    []
  );

  /**
   * Update a custom category
   */
  const updateCustomCategory = useCallback((categoryId: string, updates: Partial<CustomCategory>): void => {
    setCustomCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat))
    );
  }, []);

  /**
   * Delete a custom category
   */
  const deleteCustomCategory = useCallback((categoryId: string): void => {
    setCustomCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
  }, []);

  /**
   * Add a training example
   */
  const addTrainingExample = useCallback(
    (example: Omit<TrainingExample, 'timestamp'>): void => {
      const trainingExample: TrainingExample = {
        ...example,
        timestamp: new Date().toISOString()
      };

      setTrainingExamples((prev) => [...prev, trainingExample]);

      // Auto-train if enabled
      if (modelConfig.enableAutoTraining) {
        triggerAutoTraining();
      }
    },
    [modelConfig.enableAutoTraining]
  );

  /**
   * Trigger auto-training
   */
  const triggerAutoTraining = useCallback(async () => {
    if (isTraining) {
      return;
    }

    setIsTraining(true);

    try {
      // Get recent training examples
      const recentExamples = trainingExamples.slice(-modelConfig.trainingBatchSize);

      if (recentExamples.length === 0) {
        return;
      }

      // Train the model
      await categorizationModel.trainWithExamples(recentExamples);

      // Update model version
      setModelConfig((prev) => ({
        ...prev,
        modelVersion: categorizationModel.getModelVersion()
      }));
    } finally {
      setIsTraining(false);
    }
  }, [isTraining, trainingExamples, modelConfig.trainingBatchSize]);

  /**
   * Create a categorization rule
   */
  const createRule = useCallback((rule: Omit<CategorizationRule, 'id'>): CategorizationRule => {
    const newRule: CategorizationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setCategorizationRules((prev) => [...prev, newRule]);

    return newRule;
  }, []);

  /**
   * Update a rule
   */
  const updateRule = useCallback((ruleId: string, updates: Partial<CategorizationRule>): void => {
    setCategorizationRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)));
  }, []);

  /**
   * Delete a rule
   */
  const deleteRule = useCallback((ruleId: string): void => {
    setCategorizationRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);

  /**
   * Get categorization statistics
   */
  const getStatistics = useCallback((): CategorizationStats => {
    const results = Array.from(categorizationResults.values());

    const totalEmailsCategorized = results.length;
    const categoryCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let totalProcessingTime = 0;

    results.forEach((result) => {
      const category = result.primary.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      totalConfidence += result.primary.confidence;
      totalProcessingTime += result.processingTime;
    });

    const averageConfidence = totalEmailsCategorized > 0 ? totalConfidence / totalEmailsCategorized : 0;

    const processingTimeAvg = totalEmailsCategorized > 0 ? totalProcessingTime / totalEmailsCategorized : 0;

    return {
      totalEmailsCategorized,
      categoryCounts,
      averageConfidence,
      accuracy: 0, // Would need ground truth labels
      lastTrainingDate: trainingExamples.length > 0 ? trainingExamples[trainingExamples.length - 1].timestamp : null,
      modelVersion: modelConfig.modelVersion,
      processingTimeAvg
    };
  }, [categorizationResults, trainingExamples, modelConfig.modelVersion]);

  /**
   * Recategorize an email with user feedback
   */
  const recategorizeEmail = useCallback(
    async (emailId: string, correctCategory: string): Promise<void> => {
      // Find the email (would need access to email store)
      // For now, just add training example

      addTrainingExample({
        emailId,
        categoryId: correctCategory,
        userId: 'current-user', // Would get from auth
        feedbackType: 'positive'
      });
    },
    [addTrainingExample]
  );

  /**
   * Clear categorization results
   */
  const clearResults = useCallback((): void => {
    setCategorizationResults(new Map());
  }, []);

  /**
   * Toggle categorization
   */
  const toggleEnabled = useCallback((): void => {
    setIsEnabled((prev) => !prev);
  }, []);

  /**
   * Update model configuration
   */
  const updateConfig = useCallback((updates: Partial<CategorizationModelConfig>): void => {
    setModelConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // State
    isEnabled,
    isProcessing,
    isTraining,
    modelConfig,
    customCategories,
    categorizationRules,
    trainingExamples,
    categorizationResults,
    allCategories: getAllCategories,

    // Core functionality
    categorizeEmail,
    batchCategorize,
    recategorizeEmail,

    // Categories
    createCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,

    // Rules
    createRule,
    updateRule,
    deleteRule,

    // Training
    addTrainingExample,
    triggerAutoTraining,

    // Utilities
    getStatistics,
    clearResults,
    toggleEnabled,
    updateConfig
  };
};
