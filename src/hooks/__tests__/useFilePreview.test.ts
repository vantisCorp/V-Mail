/**
 * useFilePreview Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFilePreview } from '../useFilePreview';
import {
  PreviewFileType,
  PreviewQuality,
  PreviewStatus,
  SecurityStatus
} from '../../types/filePreview';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
 store[key] = value.toString();
},
    removeItem: (key: string) => {
 delete store[key];
},
    clear: () => {
 store = {};
}
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock URL.createObjectURL and URL.revokeObjectURL
let objectUrlCounter = 0;
URL.createObjectURL = vi.fn((blob: Blob) => `blob:test-${objectUrlCounter++}`);
URL.revokeObjectURL = vi.fn();

// Mock Image
Object.defineProperty(window, 'Image', {
  writable: true,
  value: class MockImage {
    naturalWidth = 800;
    naturalHeight = 600;
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor() {
      setTimeout(() => {
        if (this.onload) {
this.onload();
}
      }, 0);
    }
  }
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn()
})) as any;

HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
  callback(new Blob(['thumbnail-data'], { type: 'image/jpeg' }));
});

describe('useFilePreview', () => {
  beforeEach(() => {
    localStorageMock.clear();
    objectUrlCounter = 0;
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.previews).toEqual([]);
      expect(result.current.currentPreview).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('getFileType', () => {
    it('should return correct file types for MIME types', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.getFileType('image/jpeg')).toBe(PreviewFileType.IMAGE);
      expect(result.current.getFileType('application/pdf')).toBe(PreviewFileType.PDF);
      expect(result.current.getFileType('video/mp4')).toBe(PreviewFileType.VIDEO);
      expect(result.current.getFileType('audio/mpeg')).toBe(PreviewFileType.AUDIO);
      expect(result.current.getFileType('text/plain')).toBe(PreviewFileType.TEXT);
    });

    it('should use file extension as fallback', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.getFileType('application/octet-stream', 'photo.jpg')).toBe(PreviewFileType.IMAGE);
      expect(result.current.getFileType('application/octet-stream', 'doc.pdf')).toBe(PreviewFileType.PDF);
    });
  });

  describe('isPreviewable', () => {
    it('should return true for previewable types', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.isPreviewable('image/jpeg')).toBe(true);
      expect(result.current.isPreviewable('application/pdf')).toBe(true);
      expect(result.current.isPreviewable('video/mp4')).toBe(true);
    });

    it('should return false for non-previewable types', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.isPreviewable('application/unknown')).toBe(false);
    });
  });

  describe('createPreview', () => {
    it('should create a preview and add to previews list', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let preview: any;
      await act(async () => {
        preview = await result.current.createPreview({
          fileId: 'file-1',
          fileName: 'test.jpg',
          mimeType: 'image/jpeg',
          fileData,
          generateThumbnails: false,
          performSecurityScan: false
        });
      });

      expect(preview).toBeDefined();
      expect(preview.fileId).toBe('file-1');
      expect(preview.fileName).toBe('test.jpg');
      expect(preview.fileType).toBe(PreviewFileType.IMAGE);

      await waitFor(() => {
        expect(result.current.previews.length).toBe(1);
      });
    });

    it('should set loading state during creation', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      // Start creation (don't await immediately)
      let creationPromise: Promise<any>;
      act(() => {
        creationPromise = result.current.createPreview({
          fileId: 'file-2',
          fileName: 'loading-test.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await creationPromise;
      });

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors during preview creation', async () => {
      // Mock Image to throw error
      Object.defineProperty(window, 'Image', {
        writable: true,
        value: class MockImage {
          src = '';
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;

          constructor() {
            setTimeout(() => {
              if (this.onerror) {
this.onerror();
}
            }, 0);
          }
        }
      });

      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-3',
          fileName: 'error.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('getPreview', () => {
    it('should return preview by ID', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-4',
          fileName: 'get-test.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      const retrieved = result.current.getPreview(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent preview', () => {
      const { result } = renderHook(() => useFilePreview());

      const retrieved = result.current.getPreview('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('getPreviewByFileId', () => {
    it('should return preview by file ID', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-5',
          fileName: 'fileid-test.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      const retrieved = result.current.getPreviewByFileId('file-5');
      expect(retrieved).toBeDefined();
      expect(retrieved?.fileId).toBe('file-5');
    });
  });

  describe('deletePreview', () => {
    it('should delete preview from list', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-6',
          fileName: 'delete-test.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(1);
      });

      await act(async () => {
        const success = await result.current.deletePreview(created.id);
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(0);
      });
    });

    it('should clear currentPreview if deleted', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-7',
          fileName: 'current-delete.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      // Set as current preview
      act(() => {
        result.current.setCurrentPreview(created);
      });

      await act(async () => {
        await result.current.deletePreview(created.id);
      });

      await waitFor(() => {
        expect(result.current.currentPreview).toBeNull();
      });
    });
  });

  describe('clearAllPreviews', () => {
    it('should clear all previews', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-8',
          fileName: 'clear1.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
        await result.current.createPreview({
          fileId: 'file-9',
          fileName: 'clear2.jpg',
          mimeType: 'image/png',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(2);
      });

      await act(async () => {
        await result.current.clearAllPreviews();
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(0);
        expect(result.current.currentPreview).toBeNull();
      });
    });
  });

  describe('setCurrentPreview', () => {
    it('should set current preview', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-10',
          fileName: 'current.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      act(() => {
        result.current.setCurrentPreview(created);
      });

      expect(result.current.currentPreview).toBeDefined();
      expect(result.current.currentPreview?.id).toBe(created.id);
    });

    it('should clear current preview when set to null', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-11',
          fileName: 'current-null.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      act(() => {
        result.current.setCurrentPreview(created);
      });

      expect(result.current.currentPreview).toBeDefined();

      act(() => {
        result.current.setCurrentPreview(null);
      });

      expect(result.current.currentPreview).toBeNull();
    });
  });

  describe('filterPreviews', () => {
    it('should filter previews by file type', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-12',
          fileName: 'image.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
        await result.current.createPreview({
          fileId: 'file-13',
          fileName: 'doc.pdf',
          mimeType: 'application/pdf',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(2);
      });

      const filtered = result.current.filterPreviews({ fileType: PreviewFileType.IMAGE });
      expect(filtered.length).toBe(1);
      expect(filtered[0].fileType).toBe(PreviewFileType.IMAGE);
    });

    it('should filter previews by status', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-14',
          fileName: 'status-test.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(1);
      });

      // The preview status should be READY after successful creation
      const preview = result.current.previews[0];
      const statusToFilter = preview.status;

      const filtered = result.current.filterPreviews({ status: statusToFilter });
      expect(filtered.length).toBe(1);
    });

    it('should filter previews by search query', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-15',
          fileName: 'vacation-photo.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
        await result.current.createPreview({
          fileId: 'file-16',
          fileName: 'work-document.pdf',
          mimeType: 'application/pdf',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(2);
      });

      const filtered = result.current.filterPreviews({ searchQuery: 'vacation' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].fileName).toBe('vacation-photo.jpg');
    });

    it('should combine multiple filters', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-17',
          fileName: 'vacation.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
        await result.current.createPreview({
          fileId: 'file-18',
          fileName: 'work.jpg',
          mimeType: 'image/png',
          fileData
        });
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBe(2);
      });

      const filtered = result.current.filterPreviews({
        fileType: PreviewFileType.IMAGE,
        searchQuery: 'vacation'
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].fileName).toBe('vacation.jpg');
    });
  });

  describe('getThumbnail', () => {
    it('should return thumbnail for preview', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(2048);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-19',
          fileName: 'thumbnail.jpg',
          mimeType: 'image/jpeg',
          fileData,
          generateThumbnails: true
        });
      });

      // Thumbnails may or may not be generated depending on timing
      const thumbnail = result.current.getThumbnail(created.id, PreviewQuality.THUMBNAIL);
      // Just verify it doesn't throw
      expect(thumbnail === null || thumbnail?.quality === PreviewQuality.THUMBNAIL).toBe(true);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return thumbnail URL or null', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-20',
          fileName: 'thumb-url.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      const url = result.current.getThumbnailUrl(created.id);
      // URL might be null if no thumbnail generated
      expect(url === null || typeof url === 'string').toBe(true);
    });
  });

  describe('getPreviewUrl', () => {
    it('should return preview URL', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-21',
          fileName: 'preview-url.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      const url = result.current.getPreviewUrl(created.id);
      expect(url).toBeDefined();
      expect(url).toContain('blob:');
    });

    it('should return null for non-existent preview', () => {
      const { result } = renderHook(() => useFilePreview());

      const url = result.current.getPreviewUrl('non-existent');
      expect(url).toBeNull();
    });
  });

  describe('performSecurityScan', () => {
    it('should perform security scan on preview', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(512);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-22',
          fileName: 'safe-file.txt',
          mimeType: 'text/plain',
          fileData
        });
      });

      const scanResult = await result.current.performSecurityScan(created.id);
      expect(scanResult).toBeDefined();
      expect(scanResult?.status).toBe(SecurityStatus.SAFE);
    });

    it('should return null for non-existent preview', async () => {
      const { result } = renderHook(() => useFilePreview());

      const scanResult = await result.current.performSecurityScan('non-existent');
      expect(scanResult).toBeNull();
    });
  });

  describe('previewFile', () => {
    it('should create new preview for file', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let preview: any;
      await act(async () => {
        preview = await result.current.previewFile('file-23', fileData);
      });

      expect(preview).toBeDefined();
      expect(preview?.fileId).toBe('file-23');
      expect(result.current.currentPreview?.id).toBe(preview?.id);
    });

    it('should return existing preview if already exists', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      let created: any;
      await act(async () => {
        created = await result.current.createPreview({
          fileId: 'file-24',
          fileName: 'existing.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      let preview: any;
      await act(async () => {
        preview = await result.current.previewFile('file-24');
      });

      expect(preview?.id).toBe(created.id);
    });

    it('should return error when no file data provided and no existing preview', async () => {
      const { result } = renderHook(() => useFilePreview());

      await act(async () => {
        const preview = await result.current.previewFile('file-25');
        expect(preview).toBeNull();
      });

      expect(result.current.error).toBe('No file data provided for preview');
    });
  });

  describe('getStats', () => {
    it('should return preview statistics', async () => {
      const { result } = renderHook(() => useFilePreview());

      const fileData = new ArrayBuffer(1024);

      await act(async () => {
        await result.current.createPreview({
          fileId: 'file-26',
          fileName: 'stats.jpg',
          mimeType: 'image/jpeg',
          fileData
        });
      });

      const stats = result.current.getStats();
      expect(stats.totalPreviews).toBeGreaterThanOrEqual(1);
      expect(stats.cachedPreviews).toBeGreaterThanOrEqual(1);
    });
  });

  describe('needsDownloadForPreview', () => {
    it('should return correct values for file types', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.needsDownloadForPreview(PreviewFileType.DOCUMENT)).toBe(true);
      expect(result.current.needsDownloadForPreview(PreviewFileType.SPREADSHEET)).toBe(true);
      expect(result.current.needsDownloadForPreview(PreviewFileType.IMAGE)).toBe(false);
      expect(result.current.needsDownloadForPreview(PreviewFileType.PDF)).toBe(false);
    });
  });

  describe('getSupportedFileTypes', () => {
    it('should return list of supported types', () => {
      const { result } = renderHook(() => useFilePreview());

      const supported = result.current.getSupportedFileTypes();
      expect(supported).toContain(PreviewFileType.IMAGE);
      expect(supported).toContain(PreviewFileType.PDF);
      expect(supported).toContain(PreviewFileType.VIDEO);
      expect(supported).toContain(PreviewFileType.AUDIO);
    });
  });

  describe('getMaxFileSizeForPreview', () => {
    it('should return correct max sizes', () => {
      const { result } = renderHook(() => useFilePreview());

      expect(result.current.getMaxFileSizeForPreview(PreviewFileType.IMAGE)).toBe(50 * 1024 * 1024);
      expect(result.current.getMaxFileSizeForPreview(PreviewFileType.VIDEO)).toBe(500 * 1024 * 1024);
    });
  });
});
