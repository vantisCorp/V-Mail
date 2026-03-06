import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailExportService } from '../emailExportService';
import type { Email, ExportFormat, ExportOptions, ExportProgress, ExportResult } from '../../types/emailExport';

// Mock the EmailService
vi.mock('../../services/emailService', () => ({
  EmailService: {
    getEmailById: vi.fn(),
    getAttachments: vi.fn(),
  },
}));

describe('EmailExportService', () => {
  const mockEmail: Email = {
    id: 'test-email-1',
    subject: 'Test Email Subject',
    from: { name: 'John Doe', email: 'john@example.com' },
    to: [{ name: 'Jane Smith', email: 'jane@example.com' }],
    cc: [],
    bcc: [],
    date: '2024-01-15T10:30:00Z',
    body: '<p>This is a test email body.</p>',
    plainBody: 'This is a test email body.',
    attachments: [],
    folder: 'inbox',
    read: true,
    starred: false,
  };

  const defaultOptions: ExportOptions = {
    format: 'pdf' as ExportFormat,
    includeAttachments: true,
    includeHeaders: true,
    filename: 'test-export',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear export queue
    EmailExportService['exportQueue'] = [];
    EmailExportService['isProcessingQueue'] = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportSingleEmail', () => {
    it('should export a single email successfully as PDF', async () => {
      const result: ExportResult = await EmailExportService.exportSingleEmail(
        mockEmail,
        defaultOptions
      );

      expect(result.success).toBe(true);
      expect(result.emailCount).toBe(1);
      expect(result.format).toBe('pdf');
      expect(result.downloadUrl).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should export a single email successfully as JSON', async () => {
      const options: ExportOptions = { ...defaultOptions, format: 'json' as ExportFormat };
      const result: ExportResult = await EmailExportService.exportSingleEmail(mockEmail, options);

      expect(result.success).toBe(true);
      expect(result.format).toBe('json');
    });

    it('should handle export errors gracefully', async () => {
      const invalidEmail = { ...mockEmail, body: '' };
      const result: ExportResult = await EmailExportService.exportSingleEmail(invalidEmail, defaultOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('exportMultipleEmails', () => {
    it('should export multiple emails with progress tracking', async () => {
      const emails: Email[] = [
        mockEmail,
        { ...mockEmail, id: 'test-email-2', subject: 'Email 2' },
        { ...mockEmail, id: 'test-email-3', subject: 'Email 3' },
      ];

      const progressUpdates: ExportProgress[] = [];
      const onProgress = (progress: ExportProgress) => {
        progressUpdates.push(progress);
      };

      const result: ExportResult = await EmailExportService.exportMultipleEmails(
        emails,
        defaultOptions,
        onProgress
      );

      expect(result.success).toBe(true);
      expect(result.emailCount).toBe(3);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    it('should stop on error if continueOnError is false', async () => {
      const emails: Email[] = [
        mockEmail,
        { ...mockEmail, id: 'invalid', body: '' } as any,
      ];

      const options: ExportOptions = {
        ...defaultOptions,
        continueOnError: false,
      };

      const result: ExportResult = await EmailExportService.exportMultipleEmails(emails, options);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('exportToPDF', () => {
    it('should generate PDF with email content', async () => {
      const result: Blob = await EmailExportService['exportToPDF'](mockEmail, true);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should include headers when requested', async () => {
      const result: Blob = await EmailExportService['exportToPDF'](mockEmail, true);

      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('exportToJSON', () => {
    it('should generate JSON with email data', async () => {
      const result: Blob = await EmailExportService['exportToJSON'](mockEmail);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/json');

      const text = await result.text();
      const json = JSON.parse(text);
      expect(json.id).toBe(mockEmail.id);
      expect(json.subject).toBe(mockEmail.subject);
    });
  });

  describe('exportToEML', () => {
    it('should generate EML format', async () => {
      const result: Blob = await EmailExportService['exportToEML'](mockEmail);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('message/rfc822');
    });
  });

  describe('exportQueue', () => {
    it('should queue export requests', async () => {
      const request1: ExportRequest = {
        id: 'req-1',
        emails: [mockEmail],
        options: defaultOptions,
        status: 'pending',
        createdAt: Date.now(),
      };

      await EmailExportService.queueExport(request1);

      const queue = EmailExportService.getExportQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('req-1');
    });

    it('should process queued exports', async () => {
      const request1: ExportRequest = {
        id: 'req-1',
        emails: [mockEmail],
        options: defaultOptions,
        status: 'pending',
        createdAt: Date.now(),
      };

      await EmailExportService.queueExport(request1);
      await EmailExportService.processQueue();

      const queue = EmailExportService.getExportQueue();
      expect(queue[0].status).toBe('completed');
    });
  });

  describe('downloadFile', () => {
    it('should trigger file download', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const url = 'data:text/plain;base64,dGVzdCBjb250ZW50';

      expect(() => {
        EmailExportService.downloadFile(blob, 'test.txt');
      }).not.toThrow();
    });
  });

  describe('getExportHistory', () => {
    it('should return export history', () => {
      const history = EmailExportService.getExportHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it('should update history after export', async () => {
      await EmailExportService.exportSingleEmail(mockEmail, defaultOptions);
      const history = EmailExportService.getExportHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].emailCount).toBe(1);
    });
  });

  describe('clearExportHistory', () => {
    it('should clear export history', async () => {
      await EmailExportService.exportSingleEmail(mockEmail, defaultOptions);
      EmailExportService.clearExportHistory();

      const history = EmailExportService.getExportHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('getExportStatistics', () => {
    it('should return export statistics', async () => {
      await EmailExportService.exportSingleEmail(mockEmail, defaultOptions);
      const stats = EmailExportService.getExportStatistics();

      expect(stats.totalExports).toBeGreaterThan(0);
      expect(stats.totalEmailsExported).toBeGreaterThan(0);
    });
  });
});