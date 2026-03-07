/**
 * File Preview Type Definitions for V-Mail v1.6.0
 */

/**
 * Supported preview file types
 */
export enum PreviewFileType {
  IMAGE = 'image',
  PDF = 'pdf',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  ARCHIVE = 'archive',
  CODE = 'code',
  UNKNOWN = 'unknown',
}

/**
 * Preview quality levels
 */
export enum PreviewQuality {
  THUMBNAIL = 'thumbnail',    // Small thumbnail (100x100)
  LOW = 'low',               // Low quality for quick preview (400x400)
  MEDIUM = 'medium',         // Medium quality (800x800)
  HIGH = 'high',             // High quality (1600x1600)
  ORIGINAL = 'original',     // Original file
}

/**
 * Preview status
 */
export enum PreviewStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
  UNSUPPORTED = 'unsupported',
}

/**
 * Security scan status
 */
export enum SecurityStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  SAFE = 'safe',
  SUSPICIOUS = 'suspicious',
  MALICIOUS = 'malicious',
  ERROR = 'error',
}

/**
 * File preview metadata
 */
export interface FilePreviewMetadata {
  width?: number;
  height?: number;
  duration?: number;        // For video/audio in seconds
  pages?: number;           // For PDFs
  format?: string;          // File format
  size: number;             // File size in bytes
  mimeType: string;
  lastModified: string;
}

/**
 * File thumbnail
 */
export interface FileThumbnail {
  id: string;
  fileId: string;
  quality: PreviewQuality;
  url: string;
  width: number;
  height: number;
  size: number;
  generatedAt: string;
}

/**
 * File preview
 */
export interface FilePreview {
  id: string;
  fileId: string;
  fileName: string;
  fileType: PreviewFileType;
  mimeType: string;
  status: PreviewStatus;
  securityStatus: SecurityStatus;
  
  // URLs for different quality levels
  thumbnailUrl?: string;
  previewUrl?: string;
  originalUrl: string;
  
  // Metadata
  metadata: FilePreviewMetadata;
  
  // Thumbnails
  thumbnails: FileThumbnail[];
  
  // Preview content (for text-based files)
  textContent?: string;
  
  // Error information
  error?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/**
 * File attachment information
 */
export interface FileAttachment {
  id: string;
  emailId: string;
  name: string;
  size: number;
  mimeType: string;
  type: PreviewFileType;
  url: string;
  preview?: FilePreview;
  securityStatus: SecurityStatus;
  isDownloaded: boolean;
  localPath?: string;
  checksum?: string;
  createdAt: string;
}

/**
 * Preview options
 */
export interface PreviewOptions {
  quality?: PreviewQuality;
  maxWidth?: number;
  maxHeight?: number;
  page?: number;            // For multi-page documents
  format?: string;          // Output format
}

/**
 * Thumbnail generation options
 */
export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: PreviewQuality;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill';
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  fileId: string;
  status: SecurityStatus;
  threats: SecurityThreat[];
  scannedAt: string;
  scanDuration: number;
  scannerVersion: string;
}

/**
 * Security threat
 */
export interface SecurityThreat {
  id: string;
  type: 'virus' | 'malware' | 'phishing' | 'suspicious' | 'other';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * Preview cache entry
 */
export interface PreviewCacheEntry {
  id: string;
  fileId: string;
  quality: PreviewQuality;
  url: string;
  size: number;
  hits: number;
  createdAt: string;
  lastAccessedAt: string;
  expiresAt: string;
}

/**
 * Preview statistics
 */
export interface PreviewStats {
  totalPreviews: number;
  cachedPreviews: number;
  cacheHitRate: number;
  averageLoadTime: number;
  previewsByType: Record<PreviewFileType, number>;
  thumbnailsGenerated: number;
  securityScansPerformed: number;
  securityIssues: number;
}

/**
 * Create preview payload
 */
export interface CreatePreviewPayload {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileData: ArrayBuffer | Blob;
  generateThumbnails?: boolean;
  performSecurityScan?: boolean;
}

/**
 * Preview filter options
 */
export interface PreviewFilterOptions {
  fileType?: PreviewFileType;
  status?: PreviewStatus;
  securityStatus?: SecurityStatus;
  mimeType?: string;
  searchQuery?: string;
}

/**
 * Archive preview content
 */
export interface ArchiveContent {
  files: ArchiveFileEntry[];
  totalFiles: number;
  totalSize: number;
  compressedSize: number;
}

/**
 * Archive file entry
 */
export interface ArchiveFileEntry {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt?: string;
  mimeType?: string;
}

/**
 * Document preview content
 */
export interface DocumentContent {
  pages: DocumentPage[];
  totalPages: number;
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * Document page
 */
export interface DocumentPage {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
  imageUrl?: string;
}