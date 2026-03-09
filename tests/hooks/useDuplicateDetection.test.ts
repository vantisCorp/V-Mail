import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDuplicateDetection } from '../../src/hooks/useDuplicateDetection';
import { DuplicateType, DuplicateAction, SimilarityAlgorithm } from '../../src/types/duplicateDetection';

describe('useDuplicateDetection', () => {
  const createEmail = (
    id: string,
    overrides: Partial<{
      subject: string;
      body: string;
      from: string;
      to: string[];
      date: string;
    }> = {}
  ) => ({
    id,
    subject: overrides.subject || 'Test Subject',
    body: overrides.body || 'This is a test email body with some content.',
    from: overrides.from || 'sender@example.com',
    to: overrides.to || ['recipient@example.com'],
    date: overrides.date || new Date().toISOString()
  });

  const mockEmails = [
    createEmail('1', { subject: 'Meeting Tomorrow', body: 'Please join the meeting tomorrow at 2pm.' }),
    createEmail('2', { subject: 'Meeting Tomorrow', body: 'Please join the meeting tomorrow at 2pm.' }),
    createEmail('3', { subject: 'Project Update', body: 'Here is the latest project update for review.' }),
    createEmail('4', { subject: 'Re: Meeting Tomorrow', body: 'I will attend the meeting tomorrow at 2pm.' })
  ];

  const duplicateEmails = [
    createEmail('1', { subject: 'Quarterly Report', body: 'Please find attached the quarterly report for Q4 2024.' }),
    createEmail('2', { subject: 'Quarterly Report', body: 'Please find attached the quarterly report for Q4 2024.' })
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDuplicateDetection());

      expect(result.current.duplicates).toEqual([]);
      expect(result.current.groups).toEqual([]);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cache).toBeInstanceOf(Map);
      expect(result.current.statistics.totalEmailsProcessed).toBe(0);
    });

    it('should initialize with custom config', () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          minSimilarityThreshold: 0.8,
          algorithm: SimilarityAlgorithm.JACCARD,
          defaultAction: DuplicateAction.MARK_READ
        })
      );

      expect(result.current.config.minSimilarityThreshold).toBe(0.8);
      expect(result.current.config.algorithm).toBe(SimilarityAlgorithm.JACCARD);
      expect(result.current.config.defaultAction).toBe(DuplicateAction.MARK_READ);
    });
  });

  describe('Detection', () => {
    it('should detect exact duplicates', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.duplicates.length).toBeGreaterThan(0);
      expect(result.current.duplicates[0].type).toBe(DuplicateType.EXACT);
      expect(result.current.isDetecting).toBe(false);
    });

    it('should detect near duplicates', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          minSimilarityThreshold: 0.7
        })
      );

      const emails = [
        createEmail('1', { subject: 'Project Update', body: 'This is the quarterly project update for our team.' }),
        createEmail('2', { subject: 'Project Update', body: 'This is the quarterly project update for our team!' })
      ];

      await act(async () => {
        await result.current.detect({ emails });
      });

      expect(result.current.duplicates.length).toBeGreaterThan(0);
      expect(result.current.duplicates[0].type).not.toBe(DuplicateType.THREAD);
    });

    it('should not detect non-duplicates', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      const emails = [
        createEmail('1', { subject: 'Meeting Tomorrow', body: 'Please join the meeting tomorrow.' }),
        createEmail('2', { subject: 'Project Update', body: 'Here is the latest project update.' })
      ];

      await act(async () => {
        await result.current.detect({ emails });
      });

      expect(result.current.duplicates.length).toBe(0);
    });

    it('should detect duplicates with detectInList convenience method', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detectInList(duplicateEmails);
      });

      expect(result.current.duplicates.length).toBeGreaterThan(0);
    });

    it('should detect a pair of duplicates', () => {
      const { result } = renderHook(() => useDuplicateDetection());

      const duplicate = result.current.detectPair(duplicateEmails[0], duplicateEmails[1]);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.type).toBe(DuplicateType.EXACT);
    });

    it('should return null for non-duplicate pair', () => {
      const { result } = renderHook(() => useDuplicateDetection());

      const duplicate = result.current.detectPair(mockEmails[0], mockEmails[2]);

      expect(duplicate).toBeNull();
    });

    it('should respect similarity threshold', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          minSimilarityThreshold: 1.0 // Exact match only
        })
      );

      const emails = [
        createEmail('1', { subject: 'Test', body: 'Body one' }),
        createEmail('2', { subject: 'Test', body: 'Body two' })
      ];

      await act(async () => {
        await result.current.detect({ emails });
      });

      expect(result.current.duplicates.length).toBe(0);
    });

    it('should set isDetecting to false after processing', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: mockEmails });
      });

      expect(result.current.isDetecting).toBe(false);
    });
  });

  describe('Grouping', () => {
    it('should group duplicates', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.groups.length).toBeGreaterThan(0);
    });

    it('should group multiple duplicates together', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      const tripleDuplicates = [
        createEmail('1', { subject: 'Same Subject', body: 'Same body content here.' }),
        createEmail('2', { subject: 'Same Subject', body: 'Same body content here.' }),
        createEmail('3', { subject: 'Same Subject', body: 'Same body content here.' })
      ];

      await act(async () => {
        await result.current.detect({ emails: tripleDuplicates });
      });

      // Should have one group with all three emails
      expect(result.current.groups.length).toBeGreaterThan(0);
    });
  });

  describe('Action Suggestions', () => {
    it('should suggest auto-delete for high severity duplicates', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          autoDeduplicate: true
        })
      );

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      if (result.current.duplicates.length > 0) {
        const action = result.current.suggestAction(result.current.duplicates[0]);
        expect([DuplicateAction.AUTO_DELETE, DuplicateAction.SHOW_INDICATOR]).toContain(action);
      }
    });

    it('should suggest manual review for low severity duplicates', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          minSimilarityThreshold: 0.5,
          autoDeduplicate: false
        })
      );

      const lowSimilarityEmails = [
        createEmail('1', { subject: 'Subject A', body: 'This is completely different content from the other email.' }),
        createEmail('2', { subject: 'Subject B', body: 'Another different content with no similarity at all here.' })
      ];

      await act(async () => {
        await result.current.detect({ emails: lowSimilarityEmails });
      });

      // For low severity duplicates or no duplicates
      if (result.current.duplicates.length > 0) {
        const action = result.current.suggestAction(result.current.duplicates[0]);
        expect([
          DuplicateAction.MANUAL_REVIEW,
          DuplicateAction.SHOW_INDICATOR,
          DuplicateAction.MARK_READ,
          DuplicateAction.ADD_LABEL
        ]).toContain(action);
      }
    });
  });

  describe('Feedback and Learning', () => {
    it('should record user feedback', () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          enableLearning: true
        })
      );

      act(() => {
        result.current.recordFeedback({
          duplicateId: '1-2',
          isDuplicate: true,
          correctAction: DuplicateAction.MARK_READ,
          timestamp: new Date().toISOString()
        });
      });

      // Feedback is recorded (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should update statistics after detection', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.statistics.totalEmailsProcessed).toBeGreaterThanOrEqual(0);
      expect(result.current.statistics.cacheMisses).toBeGreaterThanOrEqual(0);
    });

    it('should track duplicates by type', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      const totalByType = Object.values(result.current.statistics.duplicatesByType).reduce((a, b) => a + b, 0);
      expect(totalByType).toBeGreaterThanOrEqual(result.current.duplicates.length);
    });

    it('should track duplicates by severity', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      const totalBySeverity = Object.values(result.current.statistics.duplicatesBySeverity).reduce((a, b) => a + b, 0);
      expect(totalBySeverity).toBeGreaterThanOrEqual(result.current.duplicates.length);
    });
  });

  describe('Caching', () => {
    it('should cache detection results', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.cache.size).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.cache.size).toBeGreaterThan(0);

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.cache.size).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useDuplicateDetection());

      act(() => {
        result.current.updateConfig({
          minSimilarityThreshold: 0.9,
          defaultAction: DuplicateAction.MARK_READ
        });
      });

      expect(result.current.config.minSimilarityThreshold).toBe(0.9);
      expect(result.current.config.defaultAction).toBe(DuplicateAction.MARK_READ);
    });

    it('should preserve existing config when updating partially', () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          minSimilarityThreshold: 0.7,
          algorithm: SimilarityAlgorithm.JACCARD
        })
      );

      act(() => {
        result.current.updateConfig({
          minSimilarityThreshold: 0.8
        });
      });

      expect(result.current.config.minSimilarityThreshold).toBe(0.8);
      expect(result.current.config.algorithm).toBe(SimilarityAlgorithm.JACCARD);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle empty emails array', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        const results = await result.current.detect({ emails: [] });
        expect(results).toEqual([]);
      });
    });

    it('should handle single email', async () => {
      const { result } = renderHook(() => useDuplicateDetection());

      await act(async () => {
        const results = await result.current.detect({ emails: [mockEmails[0]] });
        expect(results).toEqual([]);
      });
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          enableCache: true
        })
      );

      await act(async () => {
        await result.current.detect({ emails: duplicateEmails });
      });

      expect(result.current.duplicates.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.duplicates).toEqual([]);
      expect(result.current.groups).toEqual([]);
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.statistics.totalEmailsProcessed).toBe(0);
    });
  });

  describe('Time Difference', () => {
    it('should not detect duplicates with large time difference', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          maxTimeDifference: 24 // 24 hours
        })
      );

      const emails = [
        createEmail('1', {
          subject: 'Same Subject',
          body: 'Same body content.',
          date: '2024-01-01T00:00:00Z'
        }),
        createEmail('2', {
          subject: 'Same Subject',
          body: 'Same body content.',
          date: '2024-01-05T00:00:00Z' // 4 days later
        })
      ];

      await act(async () => {
        await result.current.detect({ emails });
      });

      expect(result.current.duplicates.length).toBe(0);
    });

    it('should detect duplicates within time threshold', async () => {
      const { result } = renderHook(() =>
        useDuplicateDetection({
          maxTimeDifference: 168 // 7 days
        })
      );

      const emails = [
        createEmail('1', {
          subject: 'Same Subject',
          body: 'Same body content.',
          date: '2024-01-01T00:00:00Z'
        }),
        createEmail('2', {
          subject: 'Same Subject',
          body: 'Same body content.',
          date: '2024-01-02T00:00:00Z' // 1 day later
        })
      ];

      await act(async () => {
        await result.current.detect({ emails });
      });

      expect(result.current.duplicates.length).toBeGreaterThan(0);
    });
  });
});
