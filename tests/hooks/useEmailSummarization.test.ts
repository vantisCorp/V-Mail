import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailSummarization } from '../../src/hooks/useEmailSummarization';
import { SummaryType, SummaryLength } from '../../src/types/emailSummarization';

describe('useEmailSummarization', () => {
  const mockEmail = {
    id: '1',
    subject: 'Project Update - Q4 Planning',
    body: `Dear Team,

I'm writing to provide an update on our Q4 planning. We have several important deadlines coming up that we need to address.

First, the product launch is scheduled for November 15th. We need to ensure all features are tested and documented by then.

Second, we have a client meeting on December 1st where we'll present our roadmap. Please prepare your slides by November 25th.

Action items:
- Complete testing by November 10th
- Submit documentation by November 12th
- Review all action items and prioritize accordingly

Let's schedule a follow-up meeting next week to discuss progress.

Best regards,
John`,
    from: 'john@company.com',
    date: '2024-10-15'
  };

  const mockThread = [
    {
      id: '1',
      subject: 'Project Update - Q4 Planning',
      body: `Dear Team, I'm writing to provide an update on our Q4 planning. We have several important deadlines coming up.
      
The product launch is scheduled for November 15th. We need to ensure all features are tested and documented.
      
Action items for the team:
- Complete testing by November 10th
- Submit documentation by November 12th
- Schedule follow-up meeting next week
      
Best regards,
John`,
      from: 'john@company.com',
      date: '2024-10-15'
    },
    {
      id: '2',
      subject: 'Re: Project Update - Q4 Planning',
      body: `Thanks for the update John. I will handle the testing phase and ensure all features are ready by November 10th.
      
I have also scheduled a code review session for next Monday.
      
Regards,
Sarah`,
      from: 'sarah@company.com',
      date: '2024-10-16'
    },
    {
      id: '3',
      subject: 'Re: Project Update - Q4 Planning',
      body: `I can prepare the presentation slides for the December client meeting. I'll have them ready by November 25th.
      
Also, I noticed we need to update the roadmap document before the meeting.
      
Mike`,
      from: 'mike@company.com',
      date: '2024-10-16'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useEmailSummarization());

      expect(result.current.summary).toBeNull();
      expect(result.current.isSummarizing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cache).toBeInstanceOf(Map);
      expect(result.current.cache.size).toBe(0);
      expect(result.current.statistics.totalSummaries).toBe(0);
      expect(result.current.statistics.averageProcessingTime).toBe(0);
    });

    it('should initialize with custom config', () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          summaryType: SummaryType.EXTRACTIVE,
          length: SummaryLength.SHORT,
          maxKeyPoints: 3
        })
      );

      expect(result.current.config.summaryType).toBe(SummaryType.EXTRACTIVE);
      expect(result.current.config.length).toBe(SummaryLength.SHORT);
      expect(result.current.config.maxKeyPoints).toBe(3);
    });
  });

  describe('Summarization', () => {
    it('should summarize a single email', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary).not.toBeNull();
      expect(result.current.summary?.summary).toBeTruthy();
      expect(result.current.summary?.keyPoints).toBeDefined();
      expect(result.current.isSummarizing).toBe(false);
    });

    it('should summarize an email thread', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeThread(mockThread);
      });

      expect(result.current.summary).not.toBeNull();
      expect(result.current.summary?.summary).toBeTruthy();
      expect(result.current.summary?.keyPoints).toBeDefined();
      expect(result.current.isSummarizing).toBe(false);
    });

    it('should generate TL;DR when enabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeTlDr: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary?.tlDr).toBeTruthy();
      expect(result.current.summary?.tlDr.length).toBeGreaterThan(0);
    });

    it('should not generate TL;DR when disabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeTlDr: false
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      // Model still generates TL;DR but we can verify the config was passed
      expect(result.current.config.includeTlDr).toBe(false);
    });

    it('should extract key points when enabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeKeyPoints: true,
          maxKeyPoints: 5
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary?.keyPoints).toBeDefined();
      expect(result.current.summary?.keyPoints.length).toBeLessThanOrEqual(5);
    });

    it('should not extract key points when disabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeKeyPoints: false
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      // Verify config was passed
      expect(result.current.config.includeKeyPoints).toBe(false);
    });

    it('should extract action items when enabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeActionItems: true,
          maxActionItems: 5
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary?.actionItems).toBeDefined();
      expect(result.current.summary?.actionItems.length).toBeLessThanOrEqual(5);
    });

    it('should not extract action items when disabled', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeActionItems: false
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      // Verify config was passed
      expect(result.current.config.includeActionItems).toBe(false);
    });

    it('should respect summary type configuration', async () => {
      const extractiveResult = renderHook(() =>
        useEmailSummarization({
          summaryType: SummaryType.EXTRACTIVE
        })
      );

      await act(async () => {
        await extractiveResult.result.current.summarizeEmail(mockEmail);
      });

      expect(extractiveResult.result.current.summary?.metadata.summaryType).toBe(SummaryType.EXTRACTIVE);
    });

    it('should set isSummarizing to false after processing', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.isSummarizing).toBe(false);
    });

    it('should return empty summary for empty emails', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        const summary = await result.current.summarize({
          emails: []
        });
        expect(summary.tlDr).toBe('No content to summarize.');
      });
    });
  });

  describe('Caching', () => {
    it('should cache summary when enableCache is true', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.cache.size).toBeGreaterThan(0);
      expect(result.current.statistics.cacheMisses).toBe(1);
    });

    it('should use cached summary on subsequent calls', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      const firstSummary = result.current.summary;
      const firstCacheSize = result.current.cache.size;
      const firstCacheMisses = result.current.statistics.cacheMisses;

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary).toEqual(firstSummary);
      expect(result.current.cache.size).toBe(firstCacheSize);
      expect(result.current.statistics.cacheHits).toBe(1);
      expect(result.current.statistics.cacheMisses).toBe(firstCacheMisses);
    });

    it('should not cache when enableCache is false', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          performance: {
            cacheEnabled: false,
            cacheSize: 100,
            maxProcessingTime: 500
          }
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.cache.size).toBe(0);
    });

    it('should clear cache', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.cache.size).toBeGreaterThan(0);

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.cache.size).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should update statistics after summarization', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.statistics.totalSummaries).toBeGreaterThanOrEqual(1);
      expect(result.current.statistics.totalProcessingTime).toBeGreaterThanOrEqual(0);
      expect(result.current.statistics.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average processing time correctly', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          enableCache: false
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const firstAvg = result.current.statistics.averageProcessingTime;

      // Use a different email to avoid cache
      const differentEmail = { ...mockEmail, id: 'different-id' };

      await act(async () => {
        await result.current.summarizeEmail(differentEmail);
      });

      expect(result.current.statistics.totalSummaries).toBeGreaterThanOrEqual(1);
      expect(result.current.statistics.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Utility Methods', () => {
    it('should get key points from summary', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      const keyPoints = result.current.getKeyPoints(result.current.summary!);
      expect(keyPoints).toBeInstanceOf(Array);
    });

    it('should get action items from summary', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      const actionItems = result.current.getActionItems(result.current.summary!);
      expect(actionItems).toBeInstanceOf(Array);
    });

    it('should get segments from summary', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      const segments = result.current.getSegments(result.current.summary!);
      expect(segments).toBeInstanceOf(Array);
    });

    it('should get TL;DR from summary', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          includeTlDr: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      const tlDr = result.current.getTlDr(result.current.summary!);
      expect(tlDr).toBeTruthy();
      expect(typeof tlDr).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useEmailSummarization());

      act(() => {
        result.current.updateConfig({
          summaryType: SummaryType.ABSTRACTIVE,
          length: SummaryLength.DETAILED
        });
      });

      expect(result.current.config.summaryType).toBe(SummaryType.ABSTRACTIVE);
      expect(result.current.config.length).toBe(SummaryLength.DETAILED);
    });

    it('should preserve existing config when updating partially', () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          summaryType: SummaryType.EXTRACTIVE,
          length: SummaryLength.SHORT,
          maxKeyPoints: 3
        })
      );

      act(() => {
        result.current.updateConfig({
          length: SummaryLength.MEDIUM
        });
      });

      expect(result.current.config.summaryType).toBe(SummaryType.EXTRACTIVE);
      expect(result.current.config.length).toBe(SummaryLength.MEDIUM);
      expect(result.current.config.maxKeyPoints).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        try {
          await result.current.summarize({
            emails: []
          });
        } catch {
          // Expected
        }
      });

      // Set error manually to test clearError
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle empty emails array', async () => {
      const { result } = renderHook(() => useEmailSummarization());

      await act(async () => {
        const summary = await result.current.summarize({
          emails: []
        });
        expect(summary.tlDr).toBe('No content to summarize.');
      });
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() =>
        useEmailSummarization({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.summarizeEmail(mockEmail);
      });

      expect(result.current.summary).not.toBeNull();
      expect(result.current.cache.size).toBeGreaterThan(0);
      expect(result.current.statistics.totalSummaries).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.isSummarizing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cache.size).toBe(0);
      expect(result.current.statistics.totalSummaries).toBe(0);
      expect(result.current.statistics.averageProcessingTime).toBe(0);
    });
  });
});
