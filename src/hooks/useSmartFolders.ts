import { useState, useCallback, useRef } from 'react';
import { FolderOrganizer, OrganizationContext } from '../ml/folderOrganizer';
import {
  EmailForOrganization,
  SmartFolder,
  FolderType,
  FolderCategory,
  OrganizationStrategy,
  Suggestion,
  RoutingResult,
  OrganizationConfig,
  OrganizationStatistics,
  UserAction,
  DEFAULT_ORGANIZATION_CONFIG
} from '../types/smartFolders';

export interface UseSmartFoldersReturn {
  // State
  folders: SmartFolder[];
  suggestions: Suggestion[];
  isOrganizing: boolean;
  isSuggesting: boolean;
  error: string | null;
  cache: Map<string, any>;
  statistics: OrganizationStatistics;

  // Methods
  suggestFolders: (context: OrganizationContext) => Promise<Suggestion[]>;
  routeEmail: (email: EmailForOrganization, folders: SmartFolder[]) => RoutingResult | null;
  routeEmails: (emails: EmailForOrganization[], folders: SmartFolder[]) => Promise<RoutingResult[]>;
  createFolder: (suggestion: Suggestion) => SmartFolder;
  optimizeFolders: (folders: SmartFolder[], emails: EmailForOrganization[]) => SmartFolder[];
  recordAction: (action: UserAction) => void;

  // Configuration
  config: OrganizationConfig;
  updateConfig: (config: Partial<OrganizationConfig>) => void;
  clearCache: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useSmartFolders = (initialConfig?: Partial<OrganizationConfig>): UseSmartFoldersReturn => {
  // Initialize model
  const modelRef = useRef<FolderOrganizer | null>(null);

  // State
  const [folders, setFolders] = useState<SmartFolder[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOrganizing, setIsOrganizing] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  const [config, setConfig] = useState<OrganizationConfig>({
    ...DEFAULT_ORGANIZATION_CONFIG,
    ...initialConfig
  });
  const [statistics, setStatistics] = useState<OrganizationStatistics>({
    totalEmailsProcessed: 0,
    totalFoldersCreated: 0,
    totalFoldersSuggested: 0,
    totalRoutings: 0,
    averageConfidence: 0,
    emailsByCategory: {
      [FolderCategory.WORK]: 0,
      [FolderCategory.PERSONAL]: 0,
      [FolderCategory.PROMOTIONS]: 0,
      [FolderCategory.SOCIAL]: 0,
      [FolderCategory.FINANCE]: 0,
      [FolderCategory.TRAVEL]: 0,
      [FolderCategory.SHOPPING]: 0,
      [FolderCategory.NEWSLETTERS]: 0,
      [FolderCategory.SYSTEM]: 0,
      [FolderCategory.OTHER]: 0
    },
    foldersByType: {
      [FolderType.AUTO]: 0,
      [FolderType.MANUAL]: 0,
      [FolderType.SYSTEM]: 0,
      [FolderType.TEMPORARY]: 0
    },
    accuracy: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Initialize model if needed
  if (!modelRef.current) {
    modelRef.current = new FolderOrganizer(config);
  }

  // Update model when config changes
  const updateConfig = useCallback((newConfig: Partial<OrganizationConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      if (modelRef.current) {
        modelRef.current.updateConfig(updated);
      }
      return updated;
    });
  }, []);

  // Suggest folders
  const suggestFolders = useCallback(async (context: OrganizationContext): Promise<Suggestion[]> => {
    setIsSuggesting(true);
    setError(null);

    try {
      const model = modelRef.current;
      if (!model) {
        throw new Error('Folder organizer model not initialized');
      }

      const results = model.suggestFolders(context);

      setSuggestions(results);
      setStatistics(prev => ({
        ...prev,
        totalFoldersSuggested: prev.totalFoldersSuggested + results.length
      }));

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to suggest folders';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSuggesting(false);
    }
  }, []);

  // Route email
  const routeEmail = useCallback((email: EmailForOrganization, folderList: SmartFolder[]): RoutingResult | null => {
    const model = modelRef.current;
    if (!model) {
      return null;
    }

    return model.routeEmail(email, folderList);
  }, []);

  // Route emails batch
  const routeEmails = useCallback(async (
    emails: EmailForOrganization[],
    folderList: SmartFolder[]
  ): Promise<RoutingResult[]> => {
    setIsOrganizing(true);
    setError(null);

    try {
      const model = modelRef.current;
      if (!model) {
        throw new Error('Folder organizer model not initialized');
      }

      const results: RoutingResult[] = [];
      let totalConfidence = 0;

      for (const email of emails) {
        const result = model.routeEmail(email, folderList);
        if (result) {
          results.push(result);
          totalConfidence += result.confidence;
        }
      }

      setStatistics(prev => ({
        ...prev,
        totalRoutings: prev.totalRoutings + results.length,
        averageConfidence: results.length > 0 ? totalConfidence / results.length : 0
      }));

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to route emails';
      setError(errorMessage);
      throw err;
    } finally {
      setIsOrganizing(false);
    }
  }, []);

  // Create folder from suggestion
  const createFolder = useCallback((suggestion: Suggestion): SmartFolder => {
    const model = modelRef.current;
    if (!model) {
      throw new Error('Folder organizer model not initialized');
    }

    const newFolder = model.createFolder(suggestion, folders);

    setFolders(prev => [...prev, newFolder]);
    setStatistics(prev => ({
      ...prev,
      totalFoldersCreated: prev.totalFoldersCreated + 1
    }));

    return newFolder;
  }, [folders]);

  // Optimize folders
  const optimizeFolders = useCallback((folderList: SmartFolder[], emails: EmailForOrganization[]): SmartFolder[] => {
    const model = modelRef.current;
    if (!model) {
      return folderList;
    }

    const optimized = model.optimizeFolders(folderList, emails);
    setFolders(optimized);

    return optimized;
  }, []);

  // Record user action
  const recordAction = useCallback((action: UserAction) => {
    const model = modelRef.current;
    if (model) {
      model.recordAction(action);
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
    setFolders([]);
    setSuggestions([]);
    setIsOrganizing(false);
    setIsSuggesting(false);
    setError(null);
    setCache(new Map());
    setStatistics({
      totalEmailsProcessed: 0,
      totalFoldersCreated: 0,
      totalFoldersSuggested: 0,
      totalRoutings: 0,
      averageConfidence: 0,
      emailsByCategory: {
        [FolderCategory.WORK]: 0,
        [FolderCategory.PERSONAL]: 0,
        [FolderCategory.PROMOTIONS]: 0,
        [FolderCategory.SOCIAL]: 0,
        [FolderCategory.FINANCE]: 0,
        [FolderCategory.TRAVEL]: 0,
        [FolderCategory.SHOPPING]: 0,
        [FolderCategory.NEWSLETTERS]: 0,
        [FolderCategory.SYSTEM]: 0,
        [FolderCategory.OTHER]: 0
      },
      foldersByType: {
        [FolderType.AUTO]: 0,
        [FolderType.MANUAL]: 0,
        [FolderType.SYSTEM]: 0,
        [FolderType.TEMPORARY]: 0
      },
      accuracy: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  }, []);

  return {
    folders,
    suggestions,
    isOrganizing,
    isSuggesting,
    error,
    cache,
    statistics,
    suggestFolders,
    routeEmail,
    routeEmails,
    createFolder,
    optimizeFolders,
    recordAction,
    config,
    updateConfig,
    clearCache,
    clearError,
    reset
  };
};
