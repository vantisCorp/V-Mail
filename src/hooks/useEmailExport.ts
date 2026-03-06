/**
 * Email Export Hook
 * React hook for managing email exports
 */

import { useState, useEffect, useCallback } from 'react';
import { EmailExportService } from '../services/emailExportService';
import type {
  ExportOptions,
  ExportProgress,
  ExportResult,
  ExportRequest,
  ExportHistory,
  ExportStatistics,
} from '../types/emailExport';

export function useEmailExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [exportQueue, setExportQueue] = useState<ExportRequest[]>([]);
  const [exportStatistics, setExportStatistics] = useState<ExportStatistics>({
    totalExports: 0,
    totalEmailsExported: 0,
    totalFileSize: 0,
    averageExportTime: 0,
    formatBreakdown: { pdf: 0, eml: 0, msg: 0, json: 0 },
    scopeBreakdown: { single: 0, multiple: 0, thread: 0, folder: 0 },
    successfulExports: 0,
    failedExports: 0,
  });

  // Load history and queue on mount
  useEffect(() => {
    loadExportHistory();
    loadExportQueue();
    updateStatistics();
  }, []);

  // Update statistics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateStatistics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadExportHistory = useCallback(() => {
    const history = EmailExportService.getExportHistory();
    setExportHistory(history);
  }, []);

  const loadExportQueue = useCallback(() => {
    EmailExportService.loadQueue();
    setExportQueue(EmailExportService.getExportQueue());
  }, []);

  const updateStatistics = useCallback(() => {
    const stats = EmailExportService.getExportStatistics();
    setExportStatistics(stats);
  }, []);

  /**
   * Export a single email
   */
  const exportSingleEmail = useCallback(
    async (email: any, options: ExportOptions): Promise<ExportResult> => {
      setIsExporting(true);
      setExportProgress(null);

      try {
        const result = await EmailExportService.exportSingleEmail(email, options);
        loadExportHistory();
        updateStatistics();
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    [loadExportHistory, updateStatistics]
  );

  /**
   * Export multiple emails
   */
  const exportMultipleEmails = useCallback(
    async (
      emails: any[],
      options: ExportOptions,
      onProgress?: (progress: ExportProgress) => void
    ): Promise<ExportResult> => {
      setIsExporting(true);
      setExportProgress(null);

      try {
        const result = await EmailExportService.exportMultipleEmails(
          emails,
          options,
          (progress) => {
            setExportProgress(progress);
            if (onProgress) {
              onProgress(progress);
            }
          }
        );
        loadExportHistory();
        updateStatistics();
        return result;
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [loadExportHistory, updateStatistics]
  );

  /**
   * Queue an export request
   */
  const queueExport = useCallback(
    async (emails: any[], options: ExportOptions): Promise<void> => {
      const request: ExportRequest = {
        id: `req_${Date.now()}`,
        emails,
        options,
        status: 'pending',
        createdAt: Date.now(),
      };

      await EmailExportService.queueExport(request);
      loadExportQueue();
    },
    [loadExportQueue]
  );

  /**
   * Process the export queue
   */
  const processQueue = useCallback(async (): Promise<void> => {
    await EmailExportService.processQueue();
    loadExportQueue();
    loadExportHistory();
    updateStatistics();
  }, [loadExportQueue, loadExportHistory, updateStatistics]);

  /**
   * Clear export history
   */
  const clearExportHistory = useCallback((): void => {
    EmailExportService.clearExportHistory();
    loadExportHistory();
    updateStatistics();
  }, [loadExportHistory, updateStatistics]);

  /**
   * Download a file directly
   */
  const downloadFile = useCallback((blob: Blob, filename: string): void => {
    EmailExportService.downloadFile(blob, filename);
  }, []);

  /**
   * Get recent export history
   */
  const getRecentExports = useCallback(
    (limit: number = 10): ExportHistory[] => {
      return exportHistory.slice(0, limit);
    },
    [exportHistory]
  );

  /**
   * Get exports by format
   */
  const getExportsByFormat = useCallback(
    (format: string): ExportHistory[] => {
      return exportHistory.filter((entry) => entry.format === format);
    },
    [exportHistory]
  );

  /**
   * Check if export is in progress
   */
  const isExportInProgress = useCallback((): boolean => {
    return isExporting || exportQueue.some((req) => req.status === 'processing');
  }, [isExporting, exportQueue]);

  return {
    // State
    isExporting,
    exportProgress,
    exportHistory,
    exportQueue,
    exportStatistics,

    // Actions
    exportSingleEmail,
    exportMultipleEmails,
    queueExport,
    processQueue,
    clearExportHistory,
    downloadFile,

    // Queries
    getRecentExports,
    getExportsByFormat,
    isExportInProgress,
  };
}