import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailExport } from '../useEmailExport';
import { EmailExportService } from '../../services/emailExportService';
import type { Email, ExportFormat, ExportOptions, ExportProgress, ExportResult } from '../../types/emailExport';

// Mock the EmailExportService
vi.mock('../../services/emailExportService', () => ({
  EmailExportService: {
    exportSingleEmail: vi.fn(),
    exportMultipleEmails: vi.fn(),
    queueExport: vi.fn(),
    getExportQueue: vi.fn(),
    processQueue: vi.fn(),
    getExportHistory: vi.fn(),
    clearExportHistory: vi.fn(),
    getExportStatistics: vi.fn(),
    downloadFile: vi.fn(),
  },
}));

describe('useEmailExport', () => {
  const mockEmails: Email[] = [
    {
      id: 'email-1',
      subject: 'Test Email 1',
      from: { name: 'John Doe', email: 'john@example.com' },
      to: [{ name: 'Jane Smith', email: 'jane@example.com' }],
      date: '2024-01-15T10:30:00Z',
      body: '<p>Test content</p>',
      plainBody: 'Test content',
      attachments: [],
      folder: 'inbox',
      read: true,
      starred: false,
    },
    {
      id: 'email-2',
      subject: 'Test Email 2',
      from: { name: 'Jane Smith', email: 'jane@example.com' },
      to: [{ name: 'John Doe', email: 'john@example.com' }],
      date: '2024-01-15T11:30:00Z',
      body: '<p>Test content 2</p>',
      plainBody: 'Test content 2',
      attachments: [],
      folder: 'inbox',
      read: false,
      starred: false,
    },
  ];

  const defaultOptions: ExportOptions = {
    format: 'pdf' as ExportFormat,
    includeAttachments: true,
    includeHeaders: true,
    filename: 'test-export',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEmailExport());

      expect(result.current.isExporting).toBe(false);
      expect(result.current.exportProgress).toBeNull();
      expect(result.current.exportHistory).toEqual([]);
      expect(result.current.exportStatistics).toEqual({
        totalExports: 0,
        totalEmailsExported: 0,
        averageExportTime: 0,
        totalFileSize: 0,
        formatBreakdown: {},
      });
    });
  });

  describe('exportSingleEmail', () => {
    it('should export a single email successfully', async () => {
      const mockResult: ExportResult = {
        success: true,
        format: 'pdf',
        emailCount: 1,
        downloadUrl: 'mock-url',
        fileSize: 1024,
      };

      (EmailExportService.exportSingleEmail as jest.Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        const exportResult = await result.current.exportSingleEmail(mockEmails[0], defaultOptions);
        expect(exportResult).toEqual(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(EmailExportService.exportSingleEmail).toHaveBeenCalledWith(
          mockEmails[0],
          defaultOptions
        );
      });
    });

    it('should set isExporting to true during export', async () => {
      (EmailExportService.exportSingleEmail as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true } as ExportResult), 100))
      );

      const { result } = renderHook(() => useEmailExport());

      act(() => {
        result.current.exportSingleEmail(mockEmails[0], defaultOptions);
      });

      expect(result.current.isExporting).toBe(true);

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });
  });

  describe('exportMultipleEmails', () => {
    it('should export multiple emails with progress tracking', async () => {
      const mockResult: ExportResult = {
        success: true,
        format: 'pdf',
        emailCount: 2,
        downloadUrl: 'mock-url',
        fileSize: 2048,
      };

      (EmailExportService.exportMultipleEmails as jest.Mock).mockImplementation(
        (emails, options, onProgress) => {
          if (onProgress) {
            onProgress({ percentage: 50, currentEmail: 1, totalEmails: 2, status: 'processing' });
            onProgress({ percentage: 100, currentEmail: 2, totalEmails: 2, status: 'completed' });
          }
          return Promise.resolve(mockResult);
        }
      );

      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        const exportResult = await result.current.exportMultipleEmails(
          mockEmails,
          defaultOptions,
          (progress) => {}
        );
        expect(exportResult).toEqual(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });

    it('should update export progress during export', async () => {
      let progressCallback: ((progress: ExportProgress) => void) | undefined;

      (EmailExportService.exportMultipleEmails as jest.Mock).mockImplementation(
        (emails, options, onProgress) => {
          progressCallback = onProgress;
          return Promise.resolve({ success: true } as ExportResult);
        }
      );

      const { result } = renderHook(() => useEmailExport());

      act(() => {
        result.current.exportMultipleEmails(mockEmails, defaultOptions);
      });

      expect(result.current.isExporting).toBe(true);

      await act(async () => {
        if (progressCallback) {
          progressCallback({ percentage: 50, currentEmail: 1, totalEmails: 2, status: 'processing' });
        }
      });

      expect(result.current.exportProgress?.percentage).toBe(50);
    });
  });

  describe('queueExport', () => {
    it('should queue export request', async () => {
      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        await result.current.queueExport(mockEmails, defaultOptions);
      });

      expect(EmailExportService.queueExport).toHaveBeenCalled();
    });
  });

  describe('exportQueue management', () => {
    it('should get export queue', () => {
      const mockQueue = [
        {
          id: 'req-1',
          emails: mockEmails,
          options: defaultOptions,
          status: 'pending',
          createdAt: Date.now(),
        },
      ];

      (EmailExportService.getExportQueue as jest.Mock).mockReturnValue(mockQueue);

      const { result } = renderHook(() => useEmailExport());

      expect(result.current.exportQueue).toEqual(mockQueue);
    });

    it('should process export queue', async () => {
      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        await result.current.processQueue();
      });

      expect(EmailExportService.processQueue).toHaveBeenCalled();
    });
  });

  describe('exportHistory', () => {
    it('should load export history on mount', () => {
      const mockHistory = [
        {
          id: 'hist-1',
          format: 'pdf' as ExportFormat,
          emailCount: 1,
          timestamp: Date.now(),
          fileSize: 1024,
        },
      ];

      (EmailExportService.getExportHistory as jest.Mock).mockReturnValue(mockHistory);

      const { result } = renderHook(() => useEmailExport());

      expect(result.current.exportHistory).toEqual(mockHistory);
    });

    it('should clear export history', async () => {
      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        await result.current.clearExportHistory();
      });

      expect(EmailExportService.clearExportHistory).toHaveBeenCalled();
      expect(result.current.exportHistory).toEqual([]);
    });
  });

  describe('exportStatistics', () => {
    it('should load export statistics on mount', () => {
      const mockStats = {
        totalExports: 10,
        totalEmailsExported: 25,
        averageExportTime: 2.5,
        totalFileSize: 10240,
        formatBreakdown: { pdf: 8, json: 2 },
      };

      (EmailExportService.getExportStatistics as jest.Mock).mockReturnValue(mockStats);

      const { result } = renderHook(() => useEmailExport());

      expect(result.current.exportStatistics).toEqual(mockStats);
    });

    it('should update statistics after export', async () => {
      const mockResult: ExportResult = {
        success: true,
        format: 'pdf',
        emailCount: 2,
        downloadUrl: 'mock-url',
        fileSize: 2048,
      };

      (EmailExportService.exportMultipleEmails as jest.Mock).mockResolvedValue(mockResult);
      (EmailExportService.getExportHistory as jest.Mock).mockReturnValue([
        { id: 'hist-1', format: 'pdf', emailCount: 2, timestamp: Date.now(), fileSize: 2048 },
      ]);
      (EmailExportService.getExportStatistics as jest.Mock).mockReturnValue({
        totalExports: 1,
        totalEmailsExported: 2,
        averageExportTime: 1,
        totalFileSize: 2048,
        formatBreakdown: { pdf: 1 },
      });

      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        await result.current.exportMultipleEmails(mockEmails, defaultOptions);
      });

      await waitFor(() => {
        expect(result.current.exportStatistics.totalExports).toBe(1);
      });
    });
  });

  describe('error handling', () => {
    it('should handle export errors', async () => {
      const mockError = new Error('Export failed');
      (EmailExportService.exportSingleEmail as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useEmailExport());

      await act(async () => {
        await result.current.exportSingleEmail(mockEmails[0], defaultOptions);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });
  });
});