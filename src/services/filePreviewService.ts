/**
 * File Preview Service for V-Mail v1.6.0
 * Handles file preview generation, caching, and security scanning
 */

import {
  PreviewFileType,
  PreviewQuality,
  PreviewStatus,
  SecurityStatus,
  FilePreview,
  FileThumbnail,
  FileAttachment,
  PreviewOptions,
  ThumbnailOptions,
  SecurityScanResult,
  PreviewStats,
  CreatePreviewPayload,
  PreviewFilterOptions,
  ArchiveContent,
  ArchiveFileEntry,
  DocumentContent,
  DocumentPage,
} from '../types/filePreview';

const PREVIEW_CACHE_KEY = 'v-mail-preview-cache';
const THUMBNAIL_CACHE_KEY = 'v-mail-thumbnail-cache';

// MIME type mappings
const MIME_TYPE_MAPPINGS: Record<string, PreviewFileType> = {
  // Images
  'image/jpeg': PreviewFileType.IMAGE,
  'image/jpg': PreviewFileType.IMAGE,
  'image/png': PreviewFileType.IMAGE,
  'image/gif': PreviewFileType.IMAGE,
  'image/webp': PreviewFileType.IMAGE,
  'image/svg+xml': PreviewFileType.IMAGE,
  'image/bmp': PreviewFileType.IMAGE,
  'image/tiff': PreviewFileType.IMAGE,
  
  // PDFs
  'application/pdf': PreviewFileType.PDF,
  
  // Videos
  'video/mp4': PreviewFileType.VIDEO,
  'video/webm': PreviewFileType.VIDEO,
  'video/ogg': PreviewFileType.VIDEO,
  'video/quicktime': PreviewFileType.VIDEO,
  'video/x-msvideo': PreviewFileType.VIDEO,
  
  // Audio
  'audio/mpeg': PreviewFileType.AUDIO,
  'audio/mp3': PreviewFileType.AUDIO,
  'audio/wav': PreviewFileType.AUDIO,
  'audio/ogg': PreviewFileType.AUDIO,
  'audio/aac': PreviewFileType.AUDIO,
  
  // Text
  'text/plain': PreviewFileType.TEXT,
  'text/html': PreviewFileType.TEXT,
  'text/css': PreviewFileType.TEXT,
  'text/csv': PreviewFileType.TEXT,
  'text/markdown': PreviewFileType.TEXT,
  
  // Documents
  'application/msword': PreviewFileType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': PreviewFileType.DOCUMENT,
  'application/vnd.ms-excel': PreviewFileType.SPREADSHEET,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': PreviewFileType.SPREADSHEET,
  'application/vnd.ms-powerpoint': PreviewFileType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': PreviewFileType.DOCUMENT,
  'application/rtf': PreviewFileType.DOCUMENT,
  
  // Archives
  'application/zip': PreviewFileType.ARCHIVE,
  'application/x-rar-compressed': PreviewFileType.ARCHIVE,
  'application/x-7z-compressed': PreviewFileType.ARCHIVE,
  'application/x-tar': PreviewFileType.ARCHIVE,
  'application/gzip': PreviewFileType.ARCHIVE,
  
  // Code
  'application/json': PreviewFileType.CODE,
  'application/xml': PreviewFileType.CODE,
  'application/javascript': PreviewFileType.CODE,
  'application/typescript': PreviewFileType.CODE,
};

// File extension mappings
const EXTENSION_MAPPINGS: Record<string, PreviewFileType> = {
  // Images
  '.jpg': PreviewFileType.IMAGE,
  '.jpeg': PreviewFileType.IMAGE,
  '.png': PreviewFileType.IMAGE,
  '.gif': PreviewFileType.IMAGE,
  '.webp': PreviewFileType.IMAGE,
  '.svg': PreviewFileType.IMAGE,
  '.bmp': PreviewFileType.IMAGE,
  
  // PDFs
  '.pdf': PreviewFileType.PDF,
  
  // Videos
  '.mp4': PreviewFileType.VIDEO,
  '.webm': PreviewFileType.VIDEO,
  '.mov': PreviewFileType.VIDEO,
  '.avi': PreviewFileType.VIDEO,
  '.mkv': PreviewFileType.VIDEO,
  
  // Audio
  '.mp3': PreviewFileType.AUDIO,
  '.wav': PreviewFileType.AUDIO,
  '.ogg': PreviewFileType.AUDIO,
  '.aac': PreviewFileType.AUDIO,
  '.flac': PreviewFileType.AUDIO,
  
  // Documents
  '.doc': PreviewFileType.DOCUMENT,
  '.docx': PreviewFileType.DOCUMENT,
  '.xls': PreviewFileType.SPREADSHEET,
  '.xlsx': PreviewFileType.SPREADSHEET,
  '.ppt': PreviewFileType.DOCUMENT,
  '.pptx': PreviewFileType.DOCUMENT,
  '.rtf': PreviewFileType.DOCUMENT,
  
  // Archives
  '.zip': PreviewFileType.ARCHIVE,
  '.rar': PreviewFileType.ARCHIVE,
  '.7z': PreviewFileType.ARCHIVE,
  '.tar': PreviewFileType.ARCHIVE,
  '.gz': PreviewFileType.ARCHIVE,
  
  // Code
  '.js': PreviewFileType.CODE,
  '.ts': PreviewFileType.CODE,
  '.jsx': PreviewFileType.CODE,
  '.tsx': PreviewFileType.CODE,
  '.py': PreviewFileType.CODE,
  '.java': PreviewFileType.CODE,
  '.c': PreviewFileType.CODE,
  '.cpp': PreviewFileType.CODE,
  '.css': PreviewFileType.CODE,
  '.html': PreviewFileType.CODE,
  '.json': PreviewFileType.CODE,
  '.xml': PreviewFileType.CODE,
  '.md': PreviewFileType.TEXT,
  '.txt': PreviewFileType.TEXT,
};

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  return `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * File Preview Service
 */
export class FilePreviewService {
  private cache: Map<string, FilePreview> = new Map();
  private thumbnailCache: Map<string, FileThumbnail> = new Map();
  private stats: PreviewStats = {
    totalPreviews: 0,
    cachedPreviews: 0,
    cacheHitRate: 0,
    averageLoadTime: 0,
    previewsByType: {} as Record<PreviewFileType, number>,
    thumbnailsGenerated: 0,
    securityScansPerformed: 0,
    securityIssues: 0,
  };

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Get file type from MIME type
   */
  getFileType(mimeType: string, fileName?: string): PreviewFileType {
    // Try MIME type first
    if (MIME_TYPE_MAPPINGS[mimeType.toLowerCase()]) {
      return MIME_TYPE_MAPPINGS[mimeType.toLowerCase()];
    }
    
    // Try file extension
    if (fileName) {
      const ext = '.' + fileName.split('.').pop()?.toLowerCase();
      if (EXTENSION_MAPPINGS[ext]) {
        return EXTENSION_MAPPINGS[ext];
      }
    }
    
    return PreviewFileType.UNKNOWN;
  }

  /**
   * Check if file type is previewable
   */
  isPreviewable(mimeType: string, fileName?: string): boolean {
    const fileType = this.getFileType(mimeType, fileName);
    return fileType !== PreviewFileType.UNKNOWN;
  }

  /**
   * Create a preview for a file
   */
  async createPreview(payload: CreatePreviewPayload): Promise<FilePreview> {
    const startTime = Date.now();
    const fileType = this.getFileType(payload.mimeType, payload.fileName);
    
    const preview: FilePreview = {
      id: generateId(),
      fileId: payload.fileId,
      fileName: payload.fileName,
      fileType,
      mimeType: payload.mimeType,
      status: PreviewStatus.LOADING,
      securityStatus: SecurityStatus.PENDING,
      originalUrl: URL.createObjectURL(new Blob([payload.fileData], { type: payload.mimeType })),
      metadata: {
        size: payload.fileData instanceof Blob ? payload.fileData.size : payload.fileData.byteLength,
        mimeType: payload.mimeType,
        lastModified: new Date().toISOString(),
      },
      thumbnails: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cache.set(preview.id, preview);
    
    try {
      // Generate metadata
      await this.generateMetadata(preview, payload.fileData);
      
      // Generate thumbnails if requested
      if (payload.generateThumbnails && fileType === PreviewFileType.IMAGE) {
        await this.generateThumbnails(preview, payload.fileData);
      }
      
      // Perform security scan if requested
      if (payload.performSecurityScan) {
        await this.performSecurityScan(preview);
      }
      
      preview.status = PreviewStatus.READY;
    } catch (error) {
      preview.status = PreviewStatus.ERROR;
      preview.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    preview.updatedAt = new Date().toISOString();
    
    // Update stats
    this.stats.totalPreviews++;
    this.stats.cachedPreviews = this.cache.size;
    this.stats.averageLoadTime = (this.stats.averageLoadTime + (Date.now() - startTime)) / 2;
    this.stats.previewsByType[fileType] = (this.stats.previewsByType[fileType] || 0) + 1;
    
    this.saveCacheToStorage();
    
    return preview;
  }

  /**
   * Generate metadata for a file
   */
  private async generateMetadata(preview: FilePreview, fileData: ArrayBuffer | Blob): Promise<void> {
    const blob = fileData instanceof ArrayBuffer ? new Blob([fileData]) : fileData;
    
    switch (preview.fileType) {
      case PreviewFileType.IMAGE:
        await this.generateImageMetadata(preview, blob);
        break;
      case PreviewFileType.VIDEO:
        await this.generateVideoMetadata(preview, blob);
        break;
      case PreviewFileType.AUDIO:
        await this.generateAudioMetadata(preview, blob);
        break;
      case PreviewFileType.PDF:
        await this.generatePdfMetadata(preview, blob);
        break;
      case PreviewFileType.TEXT:
      case PreviewFileType.CODE:
        await this.generateTextMetadata(preview, blob);
        break;
      default:
        // Basic metadata already set
        break;
    }
  }

  /**
   * Generate image metadata
   */
  private async generateImageMetadata(preview: FilePreview, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preview.metadata.width = img.naturalWidth;
        preview.metadata.height = img.naturalHeight;
        preview.metadata.format = blob.type;
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Generate video metadata
   */
  private async generateVideoMetadata(preview: FilePreview, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        preview.metadata.width = video.videoWidth;
        preview.metadata.height = video.videoHeight;
        preview.metadata.duration = video.duration;
        resolve();
      };
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Generate audio metadata
   */
  private async generateAudioMetadata(preview: FilePreview, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => {
        preview.metadata.duration = audio.duration;
        resolve();
      };
      audio.onerror = () => reject(new Error('Failed to load audio'));
      audio.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Generate PDF metadata (simplified - would need PDF.js for full implementation)
   */
  private async generatePdfMetadata(preview: FilePreview, _blob: Blob): Promise<void> {
    // In a real implementation, we would use PDF.js to get page count
    preview.metadata.pages = 1;
    preview.metadata.format = 'pdf';
  }

  /**
   * Generate text metadata
   */
  private async generateTextMetadata(preview: FilePreview, blob: Blob): Promise<void> {
    const text = await blob.text();
    preview.textContent = text.substring(0, 10000); // Store first 10000 chars
    preview.metadata.format = blob.type;
  }

  /**
   * Generate thumbnails for an image
   */
  async generateThumbnails(preview: FilePreview, fileData: ArrayBuffer | Blob): Promise<FileThumbnail[]> {
    if (preview.fileType !== PreviewFileType.IMAGE) {
      return [];
    }

    const blob = fileData instanceof ArrayBuffer ? new Blob([fileData]) : fileData;
    const thumbnails: FileThumbnail[] = [];
    
    const sizes = [
      { quality: PreviewQuality.THUMBNAIL, width: 100, height: 100 },
      { quality: PreviewQuality.LOW, width: 400, height: 400 },
      { quality: PreviewQuality.MEDIUM, width: 800, height: 800 },
    ];

    for (const size of sizes) {
      try {
        const thumbnail = await this.createImageThumbnail(blob, preview.id, size);
        thumbnails.push(thumbnail);
        this.thumbnailCache.set(thumbnail.id, thumbnail);
        this.stats.thumbnailsGenerated++;
      } catch (error) {
        console.error(`Failed to generate ${size.quality} thumbnail:`, error);
      }
    }

    preview.thumbnails = thumbnails;
    return thumbnails;
  }

  /**
   * Create an image thumbnail
   */
  private async createImageThumbnail(
    blob: Blob,
    previewId: string,
    options: { quality: PreviewQuality; width: number; height: number }
  ): Promise<FileThumbnail> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        let { width, height } = options;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        if (width / height > aspectRatio) {
          width = height * aspectRatio;
        } else {
          height = width / aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((thumbnailBlob) => {
          if (!thumbnailBlob) {
            reject(new Error('Failed to create thumbnail blob'));
            return;
          }

          const thumbnail: FileThumbnail = {
            id: `thumb-${previewId}-${options.quality}`,
            fileId: previewId,
            quality: options.quality,
            url: URL.createObjectURL(thumbnailBlob),
            width,
            height,
            size: thumbnailBlob.size,
            generatedAt: new Date().toISOString(),
          };

          resolve(thumbnail);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Perform security scan (simplified - would integrate with actual security service)
   */
  async performSecurityScan(preview: FilePreview): Promise<SecurityScanResult> {
    this.stats.securityScansPerformed++;
    
    // In a real implementation, this would call an actual security scanning service
    // For now, we'll do basic checks
    
    const result: SecurityScanResult = {
      fileId: preview.fileId,
      status: SecurityStatus.SAFE,
      threats: [],
      scannedAt: new Date().toISOString(),
      scanDuration: 100,
      scannerVersion: '1.0.0',
    };

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const ext = '.' + preview.fileName.split('.').pop()?.toLowerCase();
    
    if (suspiciousExtensions.includes(ext)) {
      result.status = SecurityStatus.SUSPICIOUS;
      result.threats.push({
        id: `threat-${Date.now()}`,
        type: 'suspicious',
        name: 'Suspicious file type',
        severity: 'medium',
        description: `The file extension "${ext}" is commonly associated with executable files.`,
      });
      this.stats.securityIssues++;
    }

    preview.securityStatus = result.status;
    return result;
  }

  /**
   * Get preview by ID
   */
  getPreview(previewId: string): FilePreview | null {
    return this.cache.get(previewId) || null;
  }

  /**
   * Get preview by file ID
   */
  getPreviewByFileId(fileId: string): FilePreview | null {
    for (const preview of this.cache.values()) {
      if (preview.fileId === fileId) {
        return preview;
      }
    }
    return null;
  }

  /**
   * Get thumbnail for preview
   */
  getThumbnail(previewId: string, quality: PreviewQuality = PreviewQuality.MEDIUM): FileThumbnail | null {
    const thumbId = `thumb-${previewId}-${quality}`;
    return this.thumbnailCache.get(thumbId) || null;
  }

  /**
   * Get preview URL
   */
  getPreviewUrl(previewId: string, options?: PreviewOptions): string | null {
    const preview = this.getPreview(previewId);
    if (!preview) return null;

    if (options?.quality === PreviewQuality.THUMBNAIL) {
      const thumb = this.getThumbnail(previewId, PreviewQuality.THUMBNAIL);
      return thumb?.url || preview.thumbnailUrl || null;
    }

    return preview.previewUrl || preview.originalUrl;
  }

  /**
   * Delete preview
   */
  deletePreview(previewId: string): boolean {
    const preview = this.cache.get(previewId);
    if (!preview) return false;

    // Revoke object URLs
    if (preview.originalUrl) {
      URL.revokeObjectURL(preview.originalUrl);
    }
    if (preview.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }
    if (preview.thumbnailUrl) {
      URL.revokeObjectURL(preview.thumbnailUrl);
    }

    // Revoke thumbnail URLs
    for (const thumb of preview.thumbnails) {
      URL.revokeObjectURL(thumb.url);
      this.thumbnailCache.delete(thumb.id);
    }

    this.cache.delete(previewId);
    this.stats.cachedPreviews = this.cache.size;
    this.saveCacheToStorage();
    
    return true;
  }

  /**
   * Clear all previews
   */
  clearAllPreviews(): void {
    for (const preview of this.cache.values()) {
      this.deletePreview(preview.id);
    }
    this.cache.clear();
    this.thumbnailCache.clear();
    this.stats.cachedPreviews = 0;
    localStorage.removeItem(PREVIEW_CACHE_KEY);
    localStorage.removeItem(THUMBNAIL_CACHE_KEY);
  }

  /**
   * Get statistics
   */
  getStats(): PreviewStats {
    return { ...this.stats };
  }

  /**
   * Load cache from storage
   */
  private loadCacheFromStorage(): void {
    try {
      const cachedData = localStorage.getItem(PREVIEW_CACHE_KEY);
      if (cachedData) {
        const previews: FilePreview[] = JSON.parse(cachedData);
        for (const preview of previews) {
          this.cache.set(preview.id, preview);
        }
        this.stats.cachedPreviews = this.cache.size;
      }
    } catch (error) {
      console.error('Failed to load preview cache:', error);
    }
  }

  /**
   * Save cache to storage
   */
  private saveCacheToStorage(): void {
    try {
      const previews = Array.from(this.cache.values());
      localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(previews));
    } catch (error) {
      console.error('Failed to save preview cache:', error);
    }
  }

  /**
   * Extract archive contents (simplified)
   */
  async extractArchiveContents(blob: Blob): Promise<ArchiveContent> {
    // In a real implementation, we would use a library like libarchive.js
    // This is a simplified version
    return {
      files: [],
      totalFiles: 0,
      totalSize: 0,
      compressedSize: blob.size,
    };
  }

  /**
   * Check if file needs download for preview
   */
  needsDownloadForPreview(fileType: PreviewFileType): boolean {
    return [
      PreviewFileType.DOCUMENT,
      PreviewFileType.SPREADSHEET,
      PreviewFileType.ARCHIVE,
      PreviewFileType.UNKNOWN,
    ].includes(fileType);
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): PreviewFileType[] {
    return [
      PreviewFileType.IMAGE,
      PreviewFileType.PDF,
      PreviewFileType.VIDEO,
      PreviewFileType.AUDIO,
      PreviewFileType.TEXT,
      PreviewFileType.CODE,
    ];
  }

  /**
   * Get maximum file size for preview
   */
  getMaxFileSizeForPreview(fileType: PreviewFileType): number {
    const limits: Record<PreviewFileType, number> = {
      [PreviewFileType.IMAGE]: 50 * 1024 * 1024, // 50MB
      [PreviewFileType.PDF]: 100 * 1024 * 1024, // 100MB
      [PreviewFileType.VIDEO]: 500 * 1024 * 1024, // 500MB
      [PreviewFileType.AUDIO]: 100 * 1024 * 1024, // 100MB
      [PreviewFileType.TEXT]: 10 * 1024 * 1024, // 10MB
      [PreviewFileType.DOCUMENT]: 50 * 1024 * 1024, // 50MB
      [PreviewFileType.SPREADSHEET]: 50 * 1024 * 1024, // 50MB
      [PreviewFileType.ARCHIVE]: 200 * 1024 * 1024, // 200MB
      [PreviewFileType.CODE]: 5 * 1024 * 1024, // 5MB
      [PreviewFileType.UNKNOWN]: 10 * 1024 * 1024, // 10MB
    };
    
    return limits[fileType] || 10 * 1024 * 1024;
  }
}

// Export singleton instance
export const filePreviewService = new FilePreviewService();