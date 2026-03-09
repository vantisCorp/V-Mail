/**
 * File Preview Hook for V-Mail v1.6.0
 * React hook for managing file previews
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PreviewFileType,
  PreviewQuality,
  FilePreview,
  FileThumbnail,
  PreviewOptions,
  SecurityScanResult,
  PreviewStats,
  CreatePreviewPayload,
  PreviewFilterOptions
} from '../types/filePreview';
import { filePreviewService } from '../services/filePreviewService';

interface UseFilePreviewReturn {
  // State
  isLoading: boolean;
  previews: FilePreview[];
  currentPreview: FilePreview | null;
  error: string | null;

  // Preview operations
  createPreview: (payload: CreatePreviewPayload) => Promise<FilePreview | null>;
  getPreview: (previewId: string) => FilePreview | null;
  getPreviewByFileId: (fileId: string) => FilePreview | null;
  deletePreview: (previewId: string) => Promise<boolean>;
  clearAllPreviews: () => Promise<void>;

  // Thumbnail operations
  getThumbnail: (previewId: string, quality?: PreviewQuality) => FileThumbnail | null;
  getThumbnailUrl: (previewId: string, quality?: PreviewQuality) => string | null;

  // URL operations
  getPreviewUrl: (previewId: string, options?: PreviewOptions) => string | null;
  downloadFile: (previewId: string, fileName?: string) => Promise<void>;

  // Security operations
  performSecurityScan: (previewId: string) => Promise<SecurityScanResult | null>;

  // File type utilities
  getFileType: (mimeType: string, fileName?: string) => PreviewFileType;
  isPreviewable: (mimeType: string, fileName?: string) => boolean;
  needsDownloadForPreview: (fileType: PreviewFileType) => boolean;
  getMaxFileSizeForPreview: (fileType: PreviewFileType) => number;
  getSupportedFileTypes: () => PreviewFileType[];

  // Filtering
  filterPreviews: (options: PreviewFilterOptions) => FilePreview[];

  // Statistics
  getStats: () => PreviewStats;

  // Current preview management
  setCurrentPreview: (preview: FilePreview | null) => void;
  previewFile: (fileId: string, fileData?: ArrayBuffer | Blob) => Promise<FilePreview | null>;
}

export function useFilePreview(): UseFilePreviewReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [currentPreview, setCurrentPreview] = useState<FilePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load previews from service on mount
  useEffect(() => {
    const stats = filePreviewService.getStats();
    if (stats.cachedPreviews > 0) {
      // Reload previews from service cache
      refreshPreviews();
    }
  }, []);

  /**
   * Refresh previews list from service
   */
  const refreshPreviews = useCallback(() => {
    // Since the service doesn't have a getAllPreviews method, we'll use the stats
    // to determine if we need to refresh
    setPreviews((prev) => [...prev]); // Trigger re-render
  }, []);

  /**
   * Create a preview for a file
   */
  const createPreview = useCallback(async (payload: CreatePreviewPayload): Promise<FilePreview | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const preview = await filePreviewService.createPreview(payload);
      setPreviews((prev) => [...prev, preview]);
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create preview';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get preview by ID
   */
  const getPreview = useCallback((previewId: string): FilePreview | null => {
    return filePreviewService.getPreview(previewId);
  }, []);

  /**
   * Get preview by file ID
   */
  const getPreviewByFileId = useCallback((fileId: string): FilePreview | null => {
    return filePreviewService.getPreviewByFileId(fileId);
  }, []);

  /**
   * Delete a preview
   */
  const deletePreview = useCallback(
    async (previewId: string): Promise<boolean> => {
      const success = filePreviewService.deletePreview(previewId);
      if (success) {
        setPreviews((prev) => prev.filter((p) => p.id !== previewId));
        if (currentPreview?.id === previewId) {
          setCurrentPreview(null);
        }
      }
      return success;
    },
    [currentPreview]
  );

  /**
   * Clear all previews
   */
  const clearAllPreviews = useCallback(async (): Promise<void> => {
    filePreviewService.clearAllPreviews();
    setPreviews([]);
    setCurrentPreview(null);
  }, []);

  /**
   * Get thumbnail
   */
  const getThumbnail = useCallback(
    (previewId: string, quality: PreviewQuality = PreviewQuality.MEDIUM): FileThumbnail | null => {
      return filePreviewService.getThumbnail(previewId, quality);
    },
    []
  );

  /**
   * Get thumbnail URL
   */
  const getThumbnailUrl = useCallback(
    (previewId: string, quality: PreviewQuality = PreviewQuality.THUMBNAIL): string | null => {
      const thumbnail = filePreviewService.getThumbnail(previewId, quality);
      return thumbnail?.url || null;
    },
    []
  );

  /**
   * Get preview URL
   */
  const getPreviewUrl = useCallback((previewId: string, options?: PreviewOptions): string | null => {
    return filePreviewService.getPreviewUrl(previewId, options);
  }, []);

  /**
   * Download a file
   */
  const downloadFile = useCallback(
    async (previewId: string, fileName?: string): Promise<void> => {
      const preview = getPreview(previewId);
      if (!preview) {
        throw new Error('Preview not found');
      }

      const url = preview.originalUrl;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || preview.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [getPreview]
  );

  /**
   * Perform security scan
   */
  const performSecurityScan = useCallback(
    async (previewId: string): Promise<SecurityScanResult | null> => {
      const preview = getPreview(previewId);
      if (!preview) {
        return null;
      }

      return filePreviewService.performSecurityScan(preview);
    },
    [getPreview]
  );

  /**
   * Get file type
   */
  const getFileType = useCallback((mimeType: string, fileName?: string): PreviewFileType => {
    return filePreviewService.getFileType(mimeType, fileName);
  }, []);

  /**
   * Check if file is previewable
   */
  const isPreviewable = useCallback((mimeType: string, fileName?: string): boolean => {
    return filePreviewService.isPreviewable(mimeType, fileName);
  }, []);

  /**
   * Check if file needs download for preview
   */
  const needsDownloadForPreview = useCallback((fileType: PreviewFileType): boolean => {
    return filePreviewService.needsDownloadForPreview(fileType);
  }, []);

  /**
   * Get max file size for preview
   */
  const getMaxFileSizeForPreview = useCallback((fileType: PreviewFileType): number => {
    return filePreviewService.getMaxFileSizeForPreview(fileType);
  }, []);

  /**
   * Get supported file types
   */
  const getSupportedFileTypes = useCallback((): PreviewFileType[] => {
    return filePreviewService.getSupportedFileTypes();
  }, []);

  /**
   * Filter previews
   */
  const filterPreviews = useCallback(
    (options: PreviewFilterOptions): FilePreview[] => {
      return previews.filter((preview) => {
        if (options.fileType !== undefined && preview.fileType !== options.fileType) {
          return false;
        }
        if (options.status !== undefined && preview.status !== options.status) {
          return false;
        }
        if (options.securityStatus !== undefined && preview.securityStatus !== options.securityStatus) {
          return false;
        }
        if (options.mimeType !== undefined && !preview.mimeType.includes(options.mimeType)) {
          return false;
        }
        if (options.searchQuery) {
          const query = options.searchQuery.toLowerCase();
          if (!preview.fileName.toLowerCase().includes(query)) {
            return false;
          }
        }
        return true;
      });
    },
    [previews]
  );

  /**
   * Get statistics
   */
  const getStats = useCallback((): PreviewStats => {
    return filePreviewService.getStats();
  }, []);

  /**
   * Preview a file by ID
   */
  const previewFile = useCallback(
    async (fileId: string, fileData?: ArrayBuffer | Blob): Promise<FilePreview | null> => {
      // Check if preview already exists
      const existingPreview = getPreviewByFileId(fileId);
      if (existingPreview) {
        setCurrentPreview(existingPreview);
        return existingPreview;
      }

      // If no file data provided, we can't create a preview
      if (!fileData) {
        setError('No file data provided for preview');
        return null;
      }

      // Create new preview
      setIsLoading(true);
      setError(null);

      try {
        const preview = await filePreviewService.createPreview({
          fileId,
          fileName: `file-${fileId}`,
          mimeType: 'application/octet-stream',
          fileData,
          generateThumbnails: true,
          performSecurityScan: true
        });

        setPreviews((prev) => [...prev, preview]);
        setCurrentPreview(preview);
        return preview;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create preview';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getPreviewByFileId]
  );

  return {
    // State
    isLoading,
    previews,
    currentPreview,
    error,

    // Preview operations
    createPreview,
    getPreview,
    getPreviewByFileId,
    deletePreview,
    clearAllPreviews,

    // Thumbnail operations
    getThumbnail,
    getThumbnailUrl,

    // URL operations
    getPreviewUrl,
    downloadFile,

    // Security operations
    performSecurityScan,

    // File type utilities
    getFileType,
    isPreviewable,
    needsDownloadForPreview,
    getMaxFileSizeForPreview,
    getSupportedFileTypes,

    // Filtering
    filterPreviews,

    // Statistics
    getStats,

    // Current preview management
    setCurrentPreview,
    previewFile
  };
}
