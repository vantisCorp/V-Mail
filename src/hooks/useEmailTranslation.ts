import { useState, useCallback, useRef } from 'react';
import {
  Translation,
  TranslationContext,
  TranslationConfig,
  TranslationStatistics,
  SupportedLanguage,
  TranslationTone,
  TranslationQuality,
} from '../types/emailTranslation';
import { TranslationService } from '../services/translationService';

export interface UseEmailTranslationReturn {
  translation: Translation | null;
  isTranslating: boolean;
  error: string | null;
  config: TranslationConfig;
  statistics: TranslationStatistics;
  translateEmail: (context: TranslationContext) => Promise<void>;
  translateText: (
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    tone?: TranslationTone,
    quality?: TranslationQuality
  ) => Promise<void>;
  detectLanguage: (text: string) => Promise<SupportedLanguage>;
  detectTone: (text: string) => TranslationTone;
  updateConfig: (config: Partial<TranslationConfig>) => void;
  resetStatistics: () => void;
  clearCache: () => void;
  clearError: () => void;
}

export function useEmailTranslation(initialConfig?: Partial<TranslationConfig>): UseEmailTranslationReturn {
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultConfig: TranslationConfig = {
    defaultSourceLanguage: 'auto',
    defaultTargetLanguage: 'en',
    defaultTone: TranslationTone.NEUTRAL,
    quality: TranslationQuality.HIGH,
    enableCache: true,
    enableToneDetection: true,
    maxCacheSize: 100,
    maxTextLength: 10000,
    enableAutoDetect: true,
    confidenceThreshold: 0.7,
  };
  const [config, setConfig] = useState<TranslationConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  
  const serviceRef = useRef<TranslationService>(TranslationService.getInstance());

  const translateEmail = useCallback(async (context: TranslationContext) => {
    setIsTranslating(true);
    setError(null);
    
    try {
      const result = await serviceRef.current.translateEmail(context);
      setTranslation(result.translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslation(null);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translateText = useCallback(async (
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    tone: TranslationTone = TranslationTone.NEUTRAL,
    quality: TranslationQuality = TranslationQuality.HIGH
  ) => {
    setIsTranslating(true);
    setError(null);
    
    try {
      const result = await serviceRef.current.translateText(
        text,
        sourceLanguage,
        targetLanguage,
        tone,
        quality
      );
      setTranslation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslation(null);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const detectLanguage = useCallback(async (text: string): Promise<SupportedLanguage> => {
    try {
      return await serviceRef.current.detectLanguage(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Language detection failed');
      return 'en';
    }
  }, []);

  const detectTone = useCallback((text: string): TranslationTone => {
    return serviceRef.current.detectTone(text);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TranslationConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      serviceRef.current.updateConfig(updated);
      return updated;
    });
  }, []);

  const resetStatistics = useCallback(() => {
    serviceRef.current.resetStatistics();
  }, []);

  const clearCache = useCallback(() => {
    serviceRef.current.clearCache();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const statistics = serviceRef.current.getStatistics();

  return {
    translation,
    isTranslating,
    error,
    config,
    statistics,
    translateEmail,
    translateText,
    detectLanguage,
    detectTone,
    updateConfig,
    resetStatistics,
    clearCache,
    clearError,
  };
}