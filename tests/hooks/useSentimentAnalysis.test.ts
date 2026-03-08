import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSentimentAnalysis } from '../../src/hooks/useSentimentAnalysis';
import { Sentiment, Emotion, Tone } from '../../src/types/sentimentAnalysis';

// ============================================================================
// Mock Contexts
// ============================================================================

const mockPositiveContext = {
  emailId: 'email-positive-1',
  subject: 'Thank you!',
  body: 'I am absolutely thrilled with the excellent service! Thank you so much for your wonderful help and support. Great job!',
  sender: 'happy@user.com',
  recipients: ['test@example.com'],
  timestamp: new Date()
};

const mockNegativeContext = {
  emailId: 'email-negative-1',
  subject: 'Complaint',
  body: 'I am extremely disappointed and frustrated with this terrible service. This is awful and I hate it.',
  sender: 'unhappy@user.com',
  recipients: ['test@example.com'],
  timestamp: new Date()
};

const mockUrgentContext = {
  emailId: 'email-urgent-1',
  subject: 'URGENT: Action Required',
  body: 'URGENT! This is critical and requires immediate attention. Please respond ASAP. This is an emergency!',
  sender: 'urgent@company.com',
  recipients: ['test@example.com'],
  timestamp: new Date()
};

const mockFormalContext = {
  emailId: 'email-formal-1',
  subject: 'Formal Request',
  body: 'Dear Sir or Madam, I am writing to respectfully and formally request your assistance regarding this matter. Furthermore, I would like to hereby confirm my interest. I look forward to your response. Sincerely, John Doe',
  sender: 'formal@business.com',
  recipients: ['test@example.com'],
  timestamp: new Date()
};

const mockCasualContext = {
  emailId: 'email-casual-1',
  subject: 'Hey!',
  body: 'Hey there! Just wanted to say hi and catch up. Let me know what you think! Cheers!',
  sender: 'friend@personal.com',
  recipients: ['test@example.com'],
  timestamp: new Date()
};

describe('useSentimentAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Basic Functionality
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
      expect(result.current.statistics).toBe(null);
    });

    it('should return valid configuration', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const config = result.current.getConfig();
      expect(config).toBeDefined();
      expect(config.minConfidence).toBeDefined();
      expect(config.enableEmotionDetection).toBeDefined();
      expect(config.enableToneAnalysis).toBeDefined();
    });
  });

  // ==========================================================================
  // Analysis
  // ==========================================================================

  describe('analyze', () => {
    it('should analyze positive email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockPositiveContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBe(Sentiment.POSITIVE);
      expect(analysisResult.confidence).toBeGreaterThan(0);
    });

    it('should analyze negative email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockNegativeContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBe(Sentiment.NEGATIVE);
      expect(analysisResult.confidence).toBeGreaterThan(0);
    });

    it('should analyze urgent email and detect tone', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockUrgentContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.tone).toBeDefined();
      expect(analysisResult.tone.length).toBeGreaterThan(0);
    });

    it('should analyze formal email and detect tone', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockFormalContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.tone).toBeDefined();
      const formalTone = analysisResult.tone.find(t => t.tone === Tone.FORMAL);
      expect(formalTone).toBeDefined();
    });

    it('should analyze casual email and detect tone', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockCasualContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.tone).toBeDefined();
    });

    it('should detect emotions in email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mockPositiveContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.emotions).toBeDefined();
      expect(analysisResult.emotions.length).toBeGreaterThan(0);
    });

    it('should update state after analysis', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      expect(result.current.result).toBeDefined();
      expect(result.current.result?.overall).toBe(Sentiment.POSITIVE);
    });
  });

  // ==========================================================================
  // Batch Analysis
  // ==========================================================================

  describe('analyzeBatch', () => {
    it('should analyze multiple emails', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let results;
      await act(async () => {
        results = await result.current.analyzeBatch([
          mockPositiveContext,
          mockNegativeContext,
          mockUrgentContext
        ]);
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      expect(results[0].overall).toBe(Sentiment.POSITIVE);
      expect(results[1].overall).toBe(Sentiment.NEGATIVE);
    });

    it('should handle empty array', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let results;
      await act(async () => {
        results = await result.current.analyzeBatch([]);
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });
  });

  // ==========================================================================
  // Text Analysis
  // ==========================================================================

  describe('analyzeText', () => {
    it('should analyze a plain text string', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyzeText('I love this amazing product! It is wonderful and great!');
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBe(Sentiment.POSITIVE);
    });

    it('should detect negative text', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyzeText('This is terrible and I hate it. Very bad experience.');
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBe(Sentiment.NEGATIVE);
    });
  });

  // ==========================================================================
  // Quick Helpers
  // ==========================================================================

  describe('getSentiment', () => {
    it('should return sentiment for analyzed email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      const sentiment = result.current.getSentiment('email-positive-1');
      expect(sentiment).toBe(Sentiment.POSITIVE);
    });

    it('should return null for unanalyzed email', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const sentiment = result.current.getSentiment('unknown-email');
      expect(sentiment).toBe(null);
    });
  });

  describe('getEmotion', () => {
    it('should return dominant emotion for analyzed email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      const emotion = result.current.getEmotion('email-positive-1');
      expect(emotion).toBeDefined();
    });
  });

  describe('getTone', () => {
    it('should return dominant tone for analyzed email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockFormalContext);
      });

      const tone = result.current.getTone('email-formal-1');
      expect(tone).toBeDefined();
    });
  });

  describe('getSentimentScore', () => {
    it('should return sentiment score for analyzed email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      const score = result.current.getSentimentScore('email-positive-1');
      expect(score).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Recommendations
  // ==========================================================================

  describe('getReplyToneSuggestion', () => {
    it('should provide suggestion for current result', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      const suggestion = result.current.getReplyToneSuggestion();
      expect(suggestion).toBeDefined();
      expect(suggestion?.recommendedTone).toBeDefined();
    });

    it('should provide suggestion for specific email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockUrgentContext);
      });

      const suggestion = result.current.getReplyToneSuggestion('email-urgent-1');
      expect(suggestion).toBeDefined();
    });

    it('should return null when no result available', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const suggestion = result.current.getReplyToneSuggestion();
      expect(suggestion).toBe(null);
    });
  });

  describe('getSentimentFeedback', () => {
    it('should provide feedback for current result', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      const feedback = result.current.getSentimentFeedback();
      expect(feedback).toBeDefined();
    });

    it('should provide feedback for negative email', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockNegativeContext);
      });

      const feedback = result.current.getSentimentFeedback();
      expect(feedback).toBeDefined();
    });
  });

  // ==========================================================================
  // Statistics
  // ==========================================================================

  describe('calculateStatistics', () => {
    it('should calculate statistics from results', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      let results;
      await act(async () => {
        results = await result.current.analyzeBatch([
          mockPositiveContext,
          mockNegativeContext,
          mockPositiveContext
        ]);
      });

      const stats = result.current.calculateStatistics(results);
      expect(stats).toBeDefined();
      expect(stats.totalEmails).toBe(3);
      expect(stats.averageSentimentScore).toBeDefined();
    });
  });

  describe('getTrend', () => {
    it('should calculate trend for multiple emails', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
        await result.current.analyze(mockNegativeContext);
        await result.current.analyze(mockPositiveContext);
      });

      const trend = result.current.getTrend([
        'email-positive-1',
        'email-negative-1'
      ]);
      expect(trend).toBeDefined();
      expect(trend.averageScore).toBeDefined();
      expect(['improving', 'declining', 'stable']).toContain(trend.trend);
    });
  });

  // ==========================================================================
  // Configuration
  // ==========================================================================

  describe('configuration', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      act(() => {
        result.current.updateConfig({ minConfidence: 0.8 });
      });

      const config = result.current.getConfig();
      expect(config.minConfidence).toBe(0.8);
    });

    it('should update min confidence', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      act(() => {
        result.current.updateConfig({ minConfidence: 0.5 });
      });

      const config = result.current.getConfig();
      expect(config.minConfidence).toBe(0.5);
    });
  });

  // ==========================================================================
  // Feedback
  // ==========================================================================

  describe('feedback', () => {
    it('should submit feedback', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      act(() => {
        result.current.submitFeedback({
          emailId: 'email-positive-1',
          correctSentiment: Sentiment.POSITIVE,
          timestamp: new Date().toISOString()
        });
      });

      const history = result.current.getFeedbackHistory();
      expect(history.length).toBe(1);
    });

    it('should return feedback history', () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const history = result.current.getFeedbackHistory();
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  describe('cache management', () => {
    it('should clear cache', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      act(() => {
        result.current.clearCache();
      });

      const sentiment = result.current.getSentiment('email-positive-1');
      expect(sentiment).toBe(null);
    });

    it('should return null for cleared cache', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });

      act(() => {
        result.current.clearCache();
      });

      const score = result.current.getSentimentScore('email-positive-1');
      expect(score).toBe(null);
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('performance', () => {
    it('should analyze email within 150ms', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const start = performance.now();
      await act(async () => {
        await result.current.analyze(mockPositiveContext);
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(150);
    });

    it('should batch process efficiently', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const contexts = Array(10).fill(null).map((_, i) => ({
        emailId: `email-${i}`,
        subject: `Test ${i}`,
        body: `Test email content number ${i}. This is a positive message with good vibes.`,
        sender: `sender${i}@test.com`,
        recipients: ['test@example.com'],
        timestamp: new Date()
      }));

      const start = performance.now();
      await act(async () => {
        await result.current.analyzeBatch(contexts);
      });
      const end = performance.now();

      expect(end - start).toBeLessThan(500);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty email body', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const emptyContext = {
        emailId: 'empty-email',
        subject: 'Empty',
        body: '',
        sender: 'test@test.com',
        recipients: ['test@example.com'],
        timestamp: new Date()
      };

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(emptyContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBe(Sentiment.NEUTRAL);
    });

    it('should handle very short text', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const shortContext = {
        emailId: 'short-email',
        subject: 'Short',
        body: 'OK',
        sender: 'test@test.com',
        recipients: ['test@example.com'],
        timestamp: new Date()
      };

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(shortContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBeDefined();
    });

    it('should handle mixed sentiment', async () => {
      const { result } = renderHook(() => useSentimentAnalysis());

      const mixedContext = {
        emailId: 'mixed-email',
        subject: 'Mixed Review',
        body: 'I love this product but hate the customer service. The quality is great but the delivery was terrible.',
        sender: 'test@test.com',
        recipients: ['test@example.com'],
        timestamp: new Date()
      };

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyze(mixedContext);
      });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.overall).toBeDefined();
      expect(analysisResult.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});
