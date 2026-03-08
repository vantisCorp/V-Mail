import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailTranslation } from '../../src/hooks/useEmailTranslation';
import {
  TranslationTone,
  TranslationQuality,
  TranslationStatus,
  TranslationSource,
  SupportedLanguage
} from '../../src/types/emailTranslation';
import { TranslationService } from '../../src/services/translationService';

// Mock the TranslationService
vi.mock('../../src/services/translationService', () => {
  const MockTranslationService = vi.fn();
  MockTranslationService.prototype.translateEmail = vi.fn();
  MockTranslationService.prototype.translateText = vi.fn();
  MockTranslationService.prototype.detectLanguage = vi.fn();
  MockTranslationService.prototype.detectTone = vi.fn();
  MockTranslationService.prototype.updateConfig = vi.fn();
  MockTranslationService.prototype.resetStatistics = vi.fn();
  MockTranslationService.prototype.clearCache = vi.fn();
  MockTranslationService.prototype.getStatistics = vi.fn();
  return { TranslationService: MockTranslationService };
});

describe('useEmailTranslation', () => {
  let mockService: {
    translateEmail: ReturnType<typeof vi.fn>;
    translateText: ReturnType<typeof vi.fn>;
    detectLanguage: ReturnType<typeof vi.fn>;
    detectTone: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
    resetStatistics: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
    getStatistics: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      translateEmail: vi.fn(),
      translateText: vi.fn(),
      detectLanguage: vi.fn(),
      detectTone: vi.fn(),
      updateConfig: vi.fn(),
      resetStatistics: vi.fn(),
      clearCache: vi.fn(),
      getStatistics: vi.fn().mockReturnValue({
        totalTranslations: 0,
        successfulTranslations: 0,
        failedTranslations: 0,
        cacheHits: 0,
        languageDetections: 0,
        averageProcessingTime: 0,
        languageDistribution: {},
        toneDistribution: {},
        lastReset: Date.now()
      })
    };

    // Set up the mock constructor to return our mock service instance
    vi.mocked(TranslationService).mockImplementation(() => mockService as any);
  });

  describe('Initial State', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useEmailTranslation());

      expect(result.current.translation).toBeNull();
      expect(result.current.isTranslating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.config.defaultTargetLanguage).toBe(SupportedLanguage.ENGLISH);
      expect(result.current.config.defaultTone).toBe(TranslationTone.NEUTRAL);
      expect(result.current.config.quality).toBe(TranslationQuality.HIGH);
      expect(result.current.config.enableMemory).toBe(true);
      expect(result.current.config.enableToneDetection).toBe(true);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        defaultTargetLanguage: SupportedLanguage.SPANISH,
        quality: TranslationQuality.STANDARD
      };
      const { result } = renderHook(() => useEmailTranslation(customConfig));

      expect(result.current.config.defaultTargetLanguage).toBe(SupportedLanguage.SPANISH);
      expect(result.current.config.quality).toBe(TranslationQuality.STANDARD);
    });

    it('should initialize with zero statistics', () => {
      const { result } = renderHook(() => useEmailTranslation());

      expect(result.current.statistics.totalTranslations).toBe(0);
      expect(result.current.statistics.successfulTranslations).toBe(0);
      expect(result.current.statistics.failedTranslations).toBe(0);
      expect(result.current.statistics.cacheHits).toBe(0);
      expect(result.current.statistics.languageDetections).toBe(0);
    });
  });

  describe('translateEmail', () => {
    it('should translate an email successfully', async () => {
      const mockTranslation = {
        id: '1',
        originalText: 'Hello World',
        translatedText: 'Hola Mundo',
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.HIGH,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      };

      const mockResult = {
        bodyTranslation: mockTranslation,
        detectedLanguage: SupportedLanguage.ENGLISH,
        detectedTone: TranslationTone.NEUTRAL,
        toneConfidence: 0.8,
        languageConfidence: 0.95
      };

      mockService.translateEmail.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useEmailTranslation());

      const context = {
        emailId: '1',
        subject: 'Test Email',
        body: 'Hello World',
        sender: 'test@example.com',
        recipient: 'recipient@example.com',
        targetLanguage: SupportedLanguage.SPANISH
      };

      await act(async () => {
        await result.current.translateEmail(context);
      });

      expect(result.current.translation).toEqual(mockTranslation);
      expect(result.current.isTranslating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle translation errors', async () => {
      mockService.translateEmail.mockRejectedValue(new Error('Translation failed'));

      const { result } = renderHook(() => useEmailTranslation());

      const context = {
        emailId: '1',
        subject: 'Test Email',
        body: 'Hello World',
        sender: 'test@example.com',
        recipient: 'recipient@example.com',
        targetLanguage: SupportedLanguage.SPANISH
      };

      await act(async () => {
        await result.current.translateEmail(context);
      });

      expect(result.current.translation).toBeNull();
      expect(result.current.isTranslating).toBe(false);
      expect(result.current.error).toBe('Translation failed');
    });

    it('should set isTranslating to true during translation', async () => {
      mockService.translateEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          translation: {
            id: '1',
            originalText: 'Hello',
            translatedText: 'Hola',
            sourceLanguage: SupportedLanguage.ENGLISH,
            targetLanguage: SupportedLanguage.SPANISH,
            tone: TranslationTone.NEUTRAL,
            quality: TranslationQuality.HIGH,
            status: TranslationStatus.COMPLETED,
            confidence: 0.95,
            timestamp: Date.now(),
            source: TranslationSource.API,
            cacheHit: false,
            segments: [],
            metadata: {}
          },
          detectedLanguage: SupportedLanguage.ENGLISH,
          detectedTone: TranslationTone.NEUTRAL,
          toneConfidence: 0.8,
          languageConfidence: 0.95
        }), 100))
      );

      const { result } = renderHook(() => useEmailTranslation());

      const context = {
        emailId: '1',
        subject: 'Test',
        body: 'Hello',
        sender: 'test@example.com',
        recipient: 'recipient@example.com',
        targetLanguage: SupportedLanguage.SPANISH
      };

      act(() => {
        result.current.translateEmail(context);
      });

      expect(result.current.isTranslating).toBe(true);

      await waitFor(() => {
        expect(result.current.isTranslating).toBe(false);
      });
    });
  });

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      const mockTranslation = {
        id: '1',
        originalText: 'Hello',
        translatedText: 'Hola',
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.HIGH,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      };

      mockService.translateText.mockResolvedValue(mockTranslation);

      const { result } = renderHook(() => useEmailTranslation());

      await act(async () => {
        await result.current.translateText('Hello', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(result.current.translation).toEqual(mockTranslation);
      expect(result.current.isTranslating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle translation errors', async () => {
      mockService.translateText.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useEmailTranslation());

      await act(async () => {
        await result.current.translateText('Hello', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(result.current.translation).toBeNull();
      expect(result.current.isTranslating).toBe(false);
      expect(result.current.error).toBe('API error');
    });

    it('should use default tone and quality when not provided', async () => {
      const mockTranslation = {
        id: '1',
        originalText: 'Hello',
        translatedText: 'Hola',
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.HIGH,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      };

      mockService.translateText.mockResolvedValue(mockTranslation);

      const { result } = renderHook(() => useEmailTranslation());

      await act(async () => {
        await result.current.translateText('Hello', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(mockService.translateText).toHaveBeenCalledWith(
        'Hello',
        SupportedLanguage.ENGLISH,
        SupportedLanguage.SPANISH,
        TranslationTone.NEUTRAL,
        TranslationQuality.HIGH
      );
    });
  });

  describe('detectLanguage', () => {
    it('should detect language successfully', async () => {
      mockService.detectLanguage.mockResolvedValue(SupportedLanguage.ENGLISH);

      const { result } = renderHook(() => useEmailTranslation());

      let detectedLanguage;
      await act(async () => {
        detectedLanguage = await result.current.detectLanguage('Hello World');
      });

      expect(detectedLanguage).toBe(SupportedLanguage.ENGLISH);
      expect(result.current.error).toBeNull();
    });

    it('should handle detection errors and return default language', async () => {
      mockService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const { result } = renderHook(() => useEmailTranslation());

      let detectedLanguage;
      await act(async () => {
        detectedLanguage = await result.current.detectLanguage('Hello World');
      });

      expect(detectedLanguage).toBe('en');
      expect(result.current.error).toBe('Detection failed');
    });
  });

  describe('detectTone', () => {
    it('should detect tone successfully', () => {
      mockService.detectTone.mockReturnValue(TranslationTone.PROFESSIONAL);

      const { result } = renderHook(() => useEmailTranslation());

      const tone = result.current.detectTone('Dear Sir, I would like to request...');

      expect(tone).toBe(TranslationTone.PROFESSIONAL);
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const { result } = renderHook(() => useEmailTranslation());

      act(() => {
        result.current.updateConfig({
          defaultTargetLanguage: SupportedLanguage.FRENCH,
          quality: TranslationQuality.STANDARD
        });
      });

      expect(result.current.config.defaultTargetLanguage).toBe(SupportedLanguage.FRENCH);
      expect(result.current.config.quality).toBe(TranslationQuality.STANDARD);
    });

    it('should call service updateConfig', () => {
      const { result } = renderHook(() => useEmailTranslation());

      const newConfig = {
        defaultTargetLanguage: SupportedLanguage.FRENCH
      };

      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(mockService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('resetStatistics', () => {
    it('should reset statistics', () => {
      mockService.getStatistics.mockReturnValue({
        totalTranslations: 0,
        successfulTranslations: 0,
        failedTranslations: 0,
        cacheHits: 0,
        languageDetections: 0,
        averageProcessingTime: 0,
        languageDistribution: {},
        toneDistribution: {},
        lastReset: Date.now()
      });

      const { result } = renderHook(() => useEmailTranslation());

      act(() => {
        result.current.resetStatistics();
      });

      expect(mockService.resetStatistics).toHaveBeenCalled();
      expect(result.current.statistics.totalTranslations).toBe(0);
      expect(result.current.statistics.successfulTranslations).toBe(0);
    });
  });

  describe('clearError', () => {
    it('should clear error', async () => {
      mockService.translateEmail.mockRejectedValue(new Error('Translation failed'));

      const { result } = renderHook(() => useEmailTranslation());

      const context = {
        emailId: '1',
        subject: 'Test',
        body: 'Hello',
        sender: 'test@example.com',
        recipient: 'recipient@example.com',
        targetLanguage: SupportedLanguage.SPANISH
      };

      await act(async () => {
        await result.current.translateEmail(context);
      });

      expect(result.current.error).toBe('Translation failed');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple consecutive translations', async () => {
      const mockTranslation = (id: string) => ({
        id,
        originalText: `Text ${id}`,
        translatedText: `Translated ${id}`,
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.HIGH,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      });

      mockService.translateText
        .mockResolvedValueOnce(mockTranslation('1'))
        .mockResolvedValueOnce(mockTranslation('2'))
        .mockResolvedValueOnce(mockTranslation('3'));

      const { result } = renderHook(() => useEmailTranslation());

      await act(async () => {
        await result.current.translateText('Text 1', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
        await result.current.translateText('Text 2', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
        await result.current.translateText('Text 3', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(result.current.translation?.id).toBe('3');
      expect(result.current.error).toBeNull();
    });

    it('should update config and use new values', async () => {
      const mockTranslation = {
        id: '1',
        originalText: 'Hello',
        translatedText: 'Hola',
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.PROFESSIONAL,
        quality: TranslationQuality.STANDARD,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      };

      mockService.translateText.mockResolvedValue(mockTranslation);

      const { result } = renderHook(() => useEmailTranslation());

      act(() => {
        result.current.updateConfig({
          defaultTone: TranslationTone.PROFESSIONAL,
          quality: TranslationQuality.STANDARD
        });
      });

      await act(async () => {
        await result.current.translateText('Hello', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(result.current.config.defaultTone).toBe(TranslationTone.PROFESSIONAL);
      expect(result.current.config.quality).toBe(TranslationQuality.STANDARD);
    });

    it('should maintain state across multiple operations', async () => {
      const mockTranslation = {
        id: '1',
        originalText: 'Hello',
        translatedText: 'Hola',
        sourceLanguage: SupportedLanguage.ENGLISH,
        targetLanguage: SupportedLanguage.SPANISH,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.HIGH,
        status: TranslationStatus.COMPLETED,
        confidence: 0.95,
        timestamp: Date.now(),
        source: TranslationSource.API,
        cacheHit: false,
        segments: [],
        metadata: {}
      };

      mockService.translateText.mockResolvedValue(mockTranslation);
      mockService.detectLanguage.mockResolvedValue(SupportedLanguage.ENGLISH);
      mockService.detectTone.mockReturnValue(TranslationTone.NEUTRAL);

      const { result } = renderHook(() => useEmailTranslation());

      await act(async () => {
        await result.current.translateText('Hello', SupportedLanguage.ENGLISH, SupportedLanguage.SPANISH);
      });

      expect(result.current.translation).not.toBeNull();

      const tone = result.current.detectTone('Hello');
      expect(tone).toBe(TranslationTone.NEUTRAL);

      let detectedLang;
      await act(async () => {
        detectedLang = await result.current.detectLanguage('Hello');
      });
      expect(detectedLang).toBe(SupportedLanguage.ENGLISH);

      expect(result.current.translation).not.toBeNull();
    });
  });
});
