import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnomalyDetection } from '../../src/hooks/useAnomalyDetection';
import {
  AnomalyType,
  AnomalySeverity,
  DetectionStatus,
  RiskLevel
} from '../../src/types/anomalyDetection';
import { AnomalyDetectionService } from '../../src/services/anomalyDetectionService';

// Mock the AnomalyDetectionService
vi.mock('../../src/services/anomalyDetectionService', () => ({
  AnomalyDetectionService: {
    getInstance: vi.fn()
  }
}));

describe('useAnomalyDetection', () => {
  let mockService: {
    detectAnomalies: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
    getStatistics: ReturnType<typeof vi.fn>;
    resetStatistics: ReturnType<typeof vi.fn>;
    clearCache: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      detectAnomalies: vi.fn(),
      updateConfig: vi.fn(),
      getStatistics: vi.fn().mockReturnValue({
        totalAnalyzed: 0,
        anomaliesDetected: 0,
        phishingDetected: 0,
        spamDetected: 0,
        falsePositives: 0,
        avgAnalysisTime: 0,
        detectionsByType: {},
        detectionsBySeverity: {},
        accuracy: 0,
        lastReset: Date.now()
      }),
      resetStatistics: vi.fn(),
      clearCache: vi.fn()
    };

    vi.mocked(AnomalyDetectionService.getInstance).mockReturnValue(mockService as any);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.result).toBeNull();
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        confidenceThreshold: 0.8,
        riskScoreThreshold: 0.6,
        enableAutomatedActions: true
      };
      const { result } = renderHook(() => useAnomalyDetection(customConfig));

      expect(result.current.config.confidenceThreshold).toBe(0.8);
      expect(result.current.config.riskScoreThreshold).toBe(0.6);
      expect(result.current.config.enableAutomatedActions).toBe(true);
    });

    it('should initialize with zero statistics', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.statistics.totalAnalyzed).toBe(0);
      expect(result.current.statistics.anomaliesDetected).toBe(0);
      expect(result.current.statistics.phishingDetected).toBe(0);
      expect(result.current.statistics.spamDetected).toBe(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies successfully', async () => {
      const mockResult = {
        id: '1',
        emailId: 'email-1',
        type: AnomalyType.PHISHING,
        severity: AnomalySeverity.HIGH,
        riskScore: 0.8,
        confidence: 0.9,
        status: DetectionStatus.COMPLETED,
        timestamp: Date.now(),
        description: 'Phishing attempt detected',
        indicators: [],
        recommendedActions: []
      };

      mockService.detectAnomalies.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAnomalyDetection());

      const email = { id: 'email-1', subject: 'Test', body: 'Test body', sender: { email: 'test@example.com' } };

      let detectionResult;
      await act(async () => {
        detectionResult = await result.current.detectAnomalies(email);
      });

      expect(detectionResult).toEqual(mockResult);
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle detection errors', async () => {
      mockService.detectAnomalies.mockRejectedValue(new Error('Detection failed'));

      const { result } = renderHook(() => useAnomalyDetection());

      const email = { id: 'email-1', subject: 'Test', body: 'Test body', sender: { email: 'test@example.com' } };

      let detectionResult;
      await act(async () => {
        detectionResult = await result.current.detectAnomalies(email);
      });

      expect(detectionResult.status).toBe(DetectionStatus.FAILED);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toBe('Detection failed');
    });

    it('should set isAnalyzing to true during analysis', async () => {
      mockService.detectAnomalies.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          id: '1',
          emailId: 'email-1',
          type: AnomalyType.UNKNOWN,
          severity: AnomalySeverity.INFO,
          riskScore: 0.1,
          confidence: 0.5,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'No anomalies',
          indicators: [],
          recommendedActions: []
        }), 100))
      );

      const { result } = renderHook(() => useAnomalyDetection());

      const email = { id: 'email-1', subject: 'Test', body: 'Test body', sender: { email: 'test@example.com' } };

      act(() => {
        result.current.detectAnomalies(email);
      });

      expect(result.current.isAnalyzing).toBe(true);

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });
    });
  });

  describe('analyzeMultiple', () => {
    it('should analyze multiple emails successfully', async () => {
      const mockResults = [
        {
          id: '1',
          emailId: 'email-1',
          type: AnomalyType.PHISHING,
          severity: AnomalySeverity.HIGH,
          riskScore: 0.8,
          confidence: 0.9,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'Phishing',
          indicators: [],
          recommendedActions: []
        },
        {
          id: '2',
          emailId: 'email-2',
          type: AnomalyType.SPAM,
          severity: AnomalySeverity.MEDIUM,
          riskScore: 0.5,
          confidence: 0.7,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'Spam',
          indicators: [],
          recommendedActions: []
        }
      ];

      mockService.detectAnomalies
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const { result } = renderHook(() => useAnomalyDetection());

      const emails = [
        { id: 'email-1', subject: 'Test 1', body: 'Body 1', sender: { email: 'test1@example.com' } },
        { id: 'email-2', subject: 'Test 2', body: 'Body 2', sender: { email: 'test2@example.com' } }
      ];

      let results;
      await act(async () => {
        results = await result.current.analyzeMultiple(emails);
      });

      expect(results).toEqual(mockResults);
      expect(results.length).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it('should handle multiple analysis errors', async () => {
      mockService.detectAnomalies.mockRejectedValue(new Error('Analysis failed'));

      const { result } = renderHook(() => useAnomalyDetection());

      const emails = [
        { id: 'email-1', subject: 'Test', body: 'Body', sender: { email: 'test@example.com' } }
      ];

      let results;
      await act(async () => {
        results = await result.current.analyzeMultiple(emails);
      });

      expect(results).toEqual([]);
      expect(result.current.error).toBe('Analysis failed');
    });
  });

  describe('getRiskLevel', () => {
    it('should return MINIMAL for low risk scores', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.getRiskLevel(0.1)).toBe(RiskLevel.MINIMAL);
      expect(result.current.getRiskLevel(0.15)).toBe(RiskLevel.MINIMAL);
    });

    it('should return LOW for low-mid risk scores', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.getRiskLevel(0.2)).toBe(RiskLevel.LOW);
      expect(result.current.getRiskLevel(0.35)).toBe(RiskLevel.LOW);
    });

    it('should return MODERATE for mid risk scores', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.getRiskLevel(0.4)).toBe(RiskLevel.MODERATE);
      expect(result.current.getRiskLevel(0.55)).toBe(RiskLevel.MODERATE);
    });

    it('should return HIGH for high risk scores', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.getRiskLevel(0.6)).toBe(RiskLevel.HIGH);
      expect(result.current.getRiskLevel(0.75)).toBe(RiskLevel.HIGH);
    });

    it('should return SEVERE for very high risk scores', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      expect(result.current.getRiskLevel(0.8)).toBe(RiskLevel.SEVERE);
      expect(result.current.getRiskLevel(0.9)).toBe(RiskLevel.SEVERE);
      expect(result.current.getRiskLevel(1.0)).toBe(RiskLevel.SEVERE);
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      act(() => {
        result.current.updateConfig({
          confidenceThreshold: 0.9,
          riskScoreThreshold: 0.7,
          enableAutomatedActions: true
        });
      });

      expect(result.current.config.confidenceThreshold).toBe(0.9);
      expect(result.current.config.riskScoreThreshold).toBe(0.7);
      expect(result.current.config.enableAutomatedActions).toBe(true);
      expect(mockService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('resetStatistics', () => {
    it('should reset statistics', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      act(() => {
        result.current.resetStatistics();
      });

      expect(mockService.resetStatistics).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => useAnomalyDetection());

      act(() => {
        result.current.clearCache();
      });

      expect(mockService.clearCache).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      mockService.detectAnomalies.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAnomalyDetection());

      const email = { id: 'email-1', subject: 'Test', body: 'Body', sender: { email: 'test@example.com' } };

      act(() => {
        result.current.detectAnomalies(email);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete detection workflow', async () => {
      const mockResult = {
        id: '1',
        emailId: 'email-1',
        type: AnomalyType.PHISHING,
        severity: AnomalySeverity.HIGH,
        riskScore: 0.8,
        confidence: 0.9,
        status: DetectionStatus.COMPLETED,
        timestamp: Date.now(),
        description: 'Phishing detected',
        indicators: [],
        recommendedActions: []
      };

      mockService.detectAnomalies.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAnomalyDetection());

      const email = { id: 'email-1', subject: 'Urgent: Verify your account', body: 'Click here to verify', sender: { email: 'phish@badsite.com' } };

      // Detect anomalies
      let detectionResult;
      await act(async () => {
        detectionResult = await result.current.detectAnomalies(email);
      });

      expect(detectionResult.type).toBe(AnomalyType.PHISHING);
      expect(detectionResult.riskScore).toBe(0.8);

      // Get risk level
      const riskLevel = result.current.getRiskLevel(detectionResult.riskScore);
      expect(riskLevel).toBe(RiskLevel.SEVERE);

      expect(result.current.error).toBeNull();
    });

    it('should handle multiple sequential detections', async () => {
      const mockResults = [
        {
          id: '1',
          emailId: 'email-1',
          type: AnomalyType.PHISHING,
          severity: AnomalySeverity.HIGH,
          riskScore: 0.8,
          confidence: 0.9,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'Phishing',
          indicators: [],
          recommendedActions: []
        },
        {
          id: '2',
          emailId: 'email-2',
          type: AnomalyType.SPAM,
          severity: AnomalySeverity.MEDIUM,
          riskScore: 0.5,
          confidence: 0.7,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'Spam',
          indicators: [],
          recommendedActions: []
        },
        {
          id: '3',
          emailId: 'email-3',
          type: AnomalyType.UNKNOWN,
          severity: AnomalySeverity.INFO,
          riskScore: 0.1,
          confidence: 0.5,
          status: DetectionStatus.COMPLETED,
          timestamp: Date.now(),
          description: 'No anomalies',
          indicators: [],
          recommendedActions: []
        }
      ];

      mockResults.forEach((res) => {
        mockService.detectAnomalies.mockResolvedValueOnce(res);
      });

      const { result } = renderHook(() => useAnomalyDetection());

      for (const expected of mockResults) {
        const email = { id: expected.emailId, subject: 'Test', body: 'Body', sender: { email: 'test@example.com' } };
        let detectionResult;
        await act(async () => {
          detectionResult = await result.current.detectAnomalies(email);
        });
        expect(detectionResult.type).toBe(expected.type);
        expect(detectionResult.riskScore).toBe(expected.riskScore);
      }

      expect(result.current.error).toBeNull();
    });

    it('should handle config updates and apply them', async () => {
      const mockResult = {
        id: '1',
        emailId: 'email-1',
        type: AnomalyType.UNKNOWN,
        severity: AnomalySeverity.INFO,
        riskScore: 0.1,
        confidence: 0.5,
        status: DetectionStatus.COMPLETED,
        timestamp: Date.now(),
        description: 'No anomalies',
        indicators: [],
        recommendedActions: []
      };

      mockService.detectAnomalies.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAnomalyDetection());

      // Update config
      act(() => {
        result.current.updateConfig({
          confidenceThreshold: 0.9,
          riskScoreThreshold: 0.7
        });
      });

      expect(result.current.config.confidenceThreshold).toBe(0.9);
      expect(result.current.config.riskScoreThreshold).toBe(0.7);

      // Detect with new config
      const email = { id: 'email-1', subject: 'Test', body: 'Body', sender: { email: 'test@example.com' } };
      await act(async () => {
        await result.current.detectAnomalies(email);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
