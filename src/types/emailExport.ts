/**
 * Email Export Type Definitions
 * Provides types for exporting emails in various formats
 */

export type ExportFormat = 'pdf' | 'eml' | 'msg' | 'json';

export type ExportScope = 'single' | 'multiple' | 'thread' | 'folder';

export interface ExportOptions {
  format: ExportFormat;
  includeAttachments: boolean;
  includeHeaders: boolean;
  includeMetadata: boolean;
  filename?: string;
  continueOnError?: boolean;
  maxRetries?: number;
}

export interface ExportProgress {
  currentEmail: number;
  totalEmails: number;
  percentage: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentEmailId?: string;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  emailCount: number;
  downloadUrl?: string;
  fileSize: number;
  duration: number;
  error?: string;
  errors?: Array<{ emailId: string; error: string }>;
}

export interface ExportRequest {
  id: string;
  emails: unknown[]; // Email type
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: ExportProgress;
  result?: ExportResult;
  createdAt: number;
  completedAt?: number;
}

export interface ExportHistory {
  id: string;
  format: ExportFormat;
  emailCount: number;
  timestamp: number;
  fileSize: number;
  duration: number;
  success: boolean;
  filename?: string;
}

export interface ExportStatistics {
  totalExports: number;
  totalEmailsExported: number;
  totalFileSize: number;
  averageExportTime: number;
  formatBreakdown: Record<ExportFormat, number>;
  scopeBreakdown: Record<ExportScope, number>;
  successfulExports: number;
  failedExports: number;
}

export interface EmailExportMetadata {
  exportId: string;
  exportedAt: string;
  exportedBy: string;
  version: string;
  format: ExportFormat;
  totalEmails: number;
  includesAttachments: boolean;
  includesHeaders: boolean;
}
