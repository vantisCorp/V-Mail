/**
 * Email Export Service
 * Handles exporting emails in various formats (PDF, EML, MSG, JSON)
 */

import type {
  ExportOptions,
  ExportProgress,
  ExportResult,
  ExportRequest,
  ExportHistory,
  ExportStatistics
} from '../types/emailExport';

class EmailExportService {
  private static exportQueue: ExportRequest[] = [];
  private static isProcessingQueue = false;
  private static readonly STORAGE_KEY = 'vmail_export_history';
  private static readonly QUEUE_KEY = 'vmail_export_queue';

  /**
   * Export a single email
   */
  static async exportSingleEmail(email: unknown, options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      let blob: Blob;

      switch (options.format) {
        case 'pdf':
          blob = await this.exportToPDF(email, options.includeHeaders);
          break;
        case 'eml':
          blob = await this.exportToEML(email);
          break;
        case 'msg':
          blob = await this.exportToMSG(email);
          break;
        case 'json':
          blob = await this.exportToJSON(email, options.includeMetadata);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      const filename = options.filename || `email_${email.id}.${options.format}`;
      const downloadUrl = URL.createObjectURL(blob);

      // Trigger download
      this.downloadFile(blob, filename);

      const result: ExportResult = {
        success: true,
        format: options.format,
        emailCount: 1,
        downloadUrl,
        fileSize: blob.size,
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      return result;
    } catch (error) {
      const result: ExportResult = {
        success: false,
        format: options.format,
        emailCount: 0,
        fileSize: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.addToHistory(result);
      return result;
    }
  }

  /**
   * Export multiple emails
   */
  static async exportMultipleEmails(
    emails: unknown[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const totalEmails = emails.length;
    let completedCount = 0;
    const errors: Array<{ emailId: string; error: string }> = [];

    try {
      if (totalEmails === 0) {
        throw new Error('No emails to export');
      }

      // Export each email
      for (let i = 0; i < totalEmails; i++) {
        const email = emails[i];

        try {
          const progress: ExportProgress = {
            currentEmail: i + 1,
            totalEmails,
            percentage: Math.round(((i + 1) / totalEmails) * 100),
            status: 'processing',
            currentEmailId: email.id
          };

          if (onProgress) {
            onProgress(progress);
          }

          await this.exportSingleEmail(email, {
            ...options,
            filename: `${options.filename || 'email_export'}_${i + 1}`
          });

          completedCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ emailId: email.id, error: errorMsg });

          if (!options.continueOnError) {
            throw error;
          }
        }
      }

      const result: ExportResult = {
        success: errors.length === 0,
        format: options.format,
        emailCount: completedCount,
        fileSize: 0, // Total size not tracked for multiple exports
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };

      this.addToHistory(result);
      return result;
    } catch (error) {
      const result: ExportResult = {
        success: false,
        format: options.format,
        emailCount: completedCount,
        fileSize: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        errors: errors.length > 0 ? errors : undefined
      };

      this.addToHistory(result);
      return result;
    }
  }

  /**
   * Export email to PDF format
   */
  private static async exportToPDF(email: unknown, includeHeaders: boolean): Promise<Blob> {
    // Create HTML content for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
          .header-row { margin: 10px 0; }
          .label { font-weight: bold; display: inline-block; width: 100px; }
          .body { margin-top: 30px; line-height: 1.6; }
        </style>
      </head>
      <body>
        ${
          includeHeaders
            ? `
        <div class="header">
          <div class="header-row"><span class="label">From:</span> ${email.from?.email}</div>
          <div class="header-row"><span class="label">To:</span> ${email.to?.map((t: unknown) => t.email).join(', ')}</div>
          <div class="header-row"><span class="label">Subject:</span> ${email.subject}</div>
          <div class="header-row"><span class="label">Date:</span> ${new Date(email.date).toLocaleString()}</div>
        </div>
        `
            : ''
        }
        <div class="body">
          ${email.body || email.plainBody || ''}
        </div>
      </body>
      </html>
    `;

    // In a real implementation, use a library like html2pdf or jsPDF
    // For now, return HTML as a blob
    return new Blob([html], { type: 'text/html' });
  }

  /**
   * Export email to EML format
   */
  private static async exportToEML(email: unknown): Promise<Blob> {
    const emlContent = [
      `From: ${email.from?.email}`,
      `To: ${email.to?.map((t: unknown) => t.email).join(', ')}`,
      `Subject: ${email.subject}`,
      `Date: ${new Date(email.date).toUTCString()}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      email.body || email.plainBody || ''
    ].join('\n');

    return new Blob([emlContent], { type: 'message/rfc822' });
  }

  /**
   * Export email to MSG format
   */
  private static async exportToMSG(email: unknown): Promise<Blob> {
    // MSG is a complex binary format
    // For simplicity, export as EML with .msg extension
    const emlContent = await this.exportToEML(email);
    return new Blob([await emlContent.text()], { type: 'application/vnd.ms-outlook' });
  }

  /**
   * Export email to JSON format
   */
  private static async exportToJSON(email: unknown, includeMetadata: boolean): Promise<Blob> {
    const data = {
      id: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      date: email.date,
      body: email.body,
      plainBody: email.plainBody,
      attachments: includeMetadata ? email.attachments : [],
      folder: email.folder,
      read: email.read,
      starred: email.starred,
      exportedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  /**
   * Queue an export request
   */
  static async queueExport(request: ExportRequest): Promise<void> {
    this.exportQueue.push(request);
    this.saveQueue();
    this.processQueue();
  }

  /**
   * Process the export queue
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.exportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.exportQueue.length > 0) {
      const request = this.exportQueue[0];

      try {
        request.status = 'processing';

        const result = await this.exportMultipleEmails(request.emails, request.options, (progress) => {
          request.progress = progress;
          this.saveQueue();
        });

        request.result = result;
        request.status = result.success ? 'completed' : 'failed';
        request.completedAt = Date.now();
      } catch {
        request.status = 'failed';
        request.completedAt = Date.now();
      }

      this.exportQueue.shift();
      this.saveQueue();
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get the export queue
   */
  static getExportQueue(): ExportRequest[] {
    return [...this.exportQueue];
  }

  /**
   * Download a file
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Add export to history
   */
  private static addToHistory(result: ExportResult): void {
    const history = this.getExportHistory();
    const entry: ExportHistory = {
      id: `export_${Date.now()}`,
      format: result.format,
      emailCount: result.emailCount,
      timestamp: Date.now(),
      fileSize: result.fileSize,
      duration: result.duration,
      success: result.success
    };
    history.unshift(entry);

    // Keep only last 100 entries
    if (history.length > 100) {
      history.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * Get export history
   */
  static getExportHistory(): ExportHistory[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear export history
   */
  static clearExportHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get export statistics
   */
  static getExportStatistics(): ExportStatistics {
    const history = this.getExportHistory();

    const stats: ExportStatistics = {
      totalExports: history.length,
      totalEmailsExported: history.reduce((sum, entry) => sum + entry.emailCount, 0),
      totalFileSize: history.reduce((sum, entry) => sum + entry.fileSize, 0),
      averageExportTime:
        history.length > 0 ? history.reduce((sum, entry) => sum + entry.duration, 0) / history.length : 0,
      formatBreakdown: {
        pdf: 0,
        eml: 0,
        msg: 0,
        json: 0
      },
      scopeBreakdown: {
        single: 0,
        multiple: 0,
        thread: 0,
        folder: 0
      },
      successfulExports: history.filter((entry) => entry.success).length,
      failedExports: history.filter((entry) => !entry.success).length
    };

    // Calculate format breakdown
    history.forEach((entry) => {
      stats.formatBreakdown[entry.format]++;
    });

    return stats;
  }

  /**
   * Save queue to localStorage
   */
  private static saveQueue(): void {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.exportQueue));
  }

  /**
   * Load queue from localStorage
   */
  static loadQueue(): void {
    try {
      const data = localStorage.getItem(this.QUEUE_KEY);
      if (data) {
        this.exportQueue = JSON.parse(data);
      }
    } catch {
      this.exportQueue = [];
    }
  }
}

export { EmailExportService };
