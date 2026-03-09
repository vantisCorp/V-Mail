import { useState, useCallback, useRef } from 'react';
import {
  AnomalyDetectionResult,
  AnomalyType,
  AnomalySeverity,
  AnomalyDetectionConfig,
  AnomalyDetectionStatistics,
  DetectionStatus,
  RiskLevel
} from '../types/anomalyDetection';
import { AnomalyDetectionService } from '../services/anomalyDetectionService';

export interface UseAnomalyDetectionReturn {
  result: AnomalyDetectionResult | null;
  isAnalyzing: boolean;
  error: string | null;
  config: AnomalyDetectionConfig;
  statistics: AnomalyDetectionStatistics;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detectAnomalies: (email: any) => Promise<AnomalyDetectionResult>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzeMultiple: (emails: any[]) => Promise<AnomalyDetectionResult[]>;
  getRiskLevel: (riskScore: number) => RiskLevel;
  updateConfig: (config: Partial<AnomalyDetectionConfig>) => void;
  resetStatistics: () => void;
  clearCache: () => void;
  clearError: () => void;
}

export function useAnomalyDetection(initialConfig?: Partial<AnomalyDetectionConfig>): UseAnomalyDetectionReturn {
  const [result, setResult] = useState<AnomalyDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AnomalyDetectionConfig>({
    enablePhishingDetection: true,
    enableSpamDetection: true,
    enableBehavioralAnalysis: true,
    enableSenderReputation: true,
    enableLinkScan: true,
    enableAttachmentScan: true,
    confidenceThreshold: 0.7,
    riskScoreThreshold: 0.5,
    enableAutomatedActions: false,
    maxAnalysisTime: 5000,
    enableDetailedLogging: false,
    cacheSize: 1000,
    ...initialConfig
  });

  const serviceRef = useRef<AnomalyDetectionService>(AnomalyDetectionService.getInstance(config));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectAnomalies = useCallback(async (email: any): Promise<AnomalyDetectionResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const detectionResult = await serviceRef.current.detectAnomalies(email);
      setResult(detectionResult);
      return detectionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Anomaly detection failed';
      setError(errorMessage);
      const failedResult: AnomalyDetectionResult = {
        id: '',
        emailId: email.id,
        type: AnomalyType.UNKNOWN,
        severity: AnomalySeverity.INFO,
        riskScore: 0,
        confidence: 0,
        status: DetectionStatus.FAILED,
        timestamp: Date.now(),
        description: errorMessage,
        indicators: [],
        recommendedActions: []
      };
      setResult(failedResult);
      return failedResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analyzeMultiple = useCallback(async (emails: any[]): Promise<AnomalyDetectionResult[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const results = await Promise.all(emails.map((email) => serviceRef.current.detectAnomalies(email)));
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Multiple analysis failed';
      setError(errorMessage);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getRiskLevel = useCallback((riskScore: number): RiskLevel => {
    if (riskScore < 0.2) {
      return RiskLevel.MINIMAL;
    }
    if (riskScore < 0.4) {
      return RiskLevel.LOW;
    }
    if (riskScore < 0.6) {
      return RiskLevel.MODERATE;
    }
    if (riskScore < 0.8) {
      return RiskLevel.HIGH;
    }
    return RiskLevel.SEVERE;
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AnomalyDetectionConfig>) => {
    setConfig((prev) => {
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
    result,
    isAnalyzing,
    error,
    config,
    statistics,
    detectAnomalies,
    analyzeMultiple,
    getRiskLevel,
    updateConfig,
    resetStatistics,
    clearCache,
    clearError
  };
}
