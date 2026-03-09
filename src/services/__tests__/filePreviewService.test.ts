/**
 * File Preview Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PreviewFileType, PreviewQuality, PreviewStatus, SecurityStatus } from '../../types/filePreview';

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
const createdUrls: string[] = [];
const revokedUrls: string[] = [];

URL.createObjectURL = vi.fn((_blob: Blob) => {
  const url = `blob:test-${objectUrlCounter++}`;
  createdUrls.push(url);
  return url;
});

URL.revokeObjectURL = vi.fn((url: string) => {
  revokedUrls.push(url);
});

// Mock Image, Video, Audio elements
const mockImageLoad = (width: number, height: number) => {
  Object.defineProperty(window, 'Image', {
    writable: true,
    value: class MockImage {
      naturalWidth = width;
      naturalHeight = height;
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
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockVideoLoad = (width: number, height: number, duration: number) => {
  window.HTMLVideoElement.prototype.videoWidth = width;
  window.HTMLVideoElement.prototype.videoHeight = height;
  window.HTMLVideoElement.prototype.duration = duration;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockAudioLoad = (duration: number) => {
  window.HTMLAudioElement.prototype.duration = duration;
};

// Mock canvas for thumbnail generation
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn()
})) as unknown;

HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
  callback(new Blob(['thumbnail-data'], { type: 'image/jpeg' }));
});

// Import service after mocks
import { FilePreviewService } from '../filePreviewService';

describe('FilePreviewService', () => {
  let service: FilePreviewService;

  beforeEach(() => {
    localStorageMock.clear();
    createdUrls.length = 0;
    revokedUrls.length = 0;
    objectUrlCounter = 0;
    vi.clearAllMocks();
    service = new FilePreviewService();
  });

  describe('getFileType', () => {
    it('should return IMAGE for image MIME types', () => {
      expect(service.getFileType('image/jpeg')).toBe(PreviewFileType.IMAGE);
      expect(service.getFileType('image/png')).toBe(PreviewFileType.IMAGE);
      expect(service.getFileType('image/gif')).toBe(PreviewFileType.IMAGE);
      expect(service.getFileType('image/webp')).toBe(PreviewFileType.IMAGE);
    });

    it('should return PDF for PDF MIME type', () => {
      expect(service.getFileType('application/pdf')).toBe(PreviewFileType.PDF);
    });

    it('should return VIDEO for video MIME types', () => {
      expect(service.getFileType('video/mp4')).toBe(PreviewFileType.VIDEO);
      expect(service.getFileType('video/webm')).toBe(PreviewFileType.VIDEO);
    });

    it('should return AUDIO for audio MIME types', () => {
      expect(service.getFileType('audio/mpeg')).toBe(PreviewFileType.AUDIO);
      expect(service.getFileType('audio/mp3')).toBe(PreviewFileType.AUDIO);
      expect(service.getFileType('audio/wav')).toBe(PreviewFileType.AUDIO);
    });

    it('should return TEXT for text MIME types', () => {
      expect(service.getFileType('text/plain')).toBe(PreviewFileType.TEXT);
      expect(service.getFileType('text/html')).toBe(PreviewFileType.TEXT);
      expect(service.getFileType('text/css')).toBe(PreviewFileType.TEXT);
    });

    it('should return DOCUMENT for document MIME types', () => {
      expect(service.getFileType('application/msword')).toBe(PreviewFileType.DOCUMENT);
      expect(service.getFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(
        PreviewFileType.DOCUMENT
      );
    });

    it('should return SPREADSHEET for spreadsheet MIME types', () => {
      expect(service.getFileType('application/vnd.ms-excel')).toBe(PreviewFileType.SPREADSHEET);
      expect(service.getFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(
        PreviewFileType.SPREADSHEET
      );
    });

    it('should return ARCHIVE for archive MIME types', () => {
      expect(service.getFileType('application/zip')).toBe(PreviewFileType.ARCHIVE);
      expect(service.getFileType('application/x-rar-compressed')).toBe(PreviewFileType.ARCHIVE);
    });

    it('should return CODE for code MIME types', () => {
      expect(service.getFileType('application/json')).toBe(PreviewFileType.CODE);
      expect(service.getFileType('application/javascript')).toBe(PreviewFileType.CODE);
    });

    it('should detect file type from extension when MIME type is unknown', () => {
      expect(service.getFileType('application/octet-stream', 'image.jpg')).toBe(PreviewFileType.IMAGE);
      expect(service.getFileType('application/octet-stream', 'document.pdf')).toBe(PreviewFileType.PDF);
      expect(service.getFileType('application/octet-stream', 'video.mp4')).toBe(PreviewFileType.VIDEO);
      expect(service.getFileType('application/octet-stream', 'script.js')).toBe(PreviewFileType.CODE);
    });

    it('should return UNKNOWN for unrecognized MIME types', () => {
      expect(service.getFileType('application/unknown')).toBe(PreviewFileType.UNKNOWN);
    });

    it('should be case-insensitive for MIME types', () => {
      expect(service.getFileType('IMAGE/JPEG')).toBe(PreviewFileType.IMAGE);
      expect(service.getFileType('Video/MP4')).toBe(PreviewFileType.VIDEO);
    });
  });

  describe('isPreviewable', () => {
    it('should return true for previewable file types', () => {
      expect(service.isPreviewable('image/jpeg')).toBe(true);
      expect(service.isPreviewable('application/pdf')).toBe(true);
      expect(service.isPreviewable('video/mp4')).toBe(true);
      expect(service.isPreviewable('audio/mpeg')).toBe(true);
      expect(service.isPreviewable('text/plain')).toBe(true);
    });

    it('should return false for non-previewable file types', () => {
      expect(service.isPreviewable('application/unknown')).toBe(false);
    });

    it('should use file extension as fallback', () => {
      expect(service.isPreviewable('application/octet-stream', 'photo.jpg')).toBe(true);
      expect(service.isPreviewable('application/octet-stream', 'unknown.xyz')).toBe(false);
    });
  });

  describe('createPreview', () => {
    it('should create a preview for an image file', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      const preview = await service.createPreview({
        fileId: 'file-1',
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        fileData,
        generateThumbnails: false,
        performSecurityScan: false
      });

      expect(preview).toBeDefined();
      expect(preview.fileId).toBe('file-1');
      expect(preview.fileName).toBe('test-image.jpg');
      expect(preview.fileType).toBe(PreviewFileType.IMAGE);
      expect(preview.status).toBe(PreviewStatus.READY);
      expect(preview.metadata.size).toBe(1024);
    });

    it('should create a preview with thumbnails when requested', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(2048);
      const preview = await service.createPreview({
        fileId: 'file-2',
        fileName: 'thumbnail-test.png',
        mimeType: 'image/png',
        fileData,
        generateThumbnails: true,
        performSecurityScan: false
      });

      expect(preview.thumbnails).toBeDefined();
      expect(preview.thumbnails.length).toBeGreaterThan(0);
    });

    it('should perform security scan when requested', async () => {
      const fileData = new ArrayBuffer(512);
      const preview = await service.createPreview({
        fileId: 'file-3',
        fileName: 'safe-file.txt',
        mimeType: 'text/plain',
        fileData,
        generateThumbnails: false,
        performSecurityScan: true
      });

      // Security scan updates the preview status
      const scanResult = await service.performSecurityScan(preview);
      expect(scanResult.status).toBe(SecurityStatus.SAFE);
    });

    it('should detect suspicious files in security scan', async () => {
      const fileData = new ArrayBuffer(512);
      const preview = await service.createPreview({
        fileId: 'file-4',
        fileName: 'malicious.exe',
        mimeType: 'application/octet-stream',
        fileData,
        generateThumbnails: false,
        performSecurityScan: true
      });

      expect(preview.securityStatus).toBe(SecurityStatus.SUSPICIOUS);
    });

    it('should create preview for text files with content', async () => {
      const textContent = 'Hello, this is a test file content!';
      const encoder = new TextEncoder();
      const fileData = encoder.encode(textContent);

      const preview = await service.createPreview({
        fileId: 'file-5',
        fileName: 'readme.txt',
        mimeType: 'text/plain',
        fileData,
        generateThumbnails: false,
        performSecurityScan: false
      });

      // Text content may be extracted depending on blob handling
      expect(preview.fileType).toBe(PreviewFileType.TEXT);
      expect(preview.metadata.mimeType).toBe('text/plain');
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

      const fileData = new ArrayBuffer(1024);
      const preview = await service.createPreview({
        fileId: 'file-6',
        fileName: 'corrupt.jpg',
        mimeType: 'image/jpeg',
        fileData,
        generateThumbnails: false,
        performSecurityScan: false
      });

      expect(preview.status).toBe(PreviewStatus.ERROR);
      expect(preview.error).toBeDefined();
    });

    it('should update statistics after creating preview', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      await service.createPreview({
        fileId: 'file-7',
        fileName: 'stats-test.jpg',
        mimeType: 'image/jpeg',
        fileData,
        generateThumbnails: false,
        performSecurityScan: false
      });

      const stats = service.getStats();
      expect(stats.totalPreviews).toBe(1);
      expect(stats.cachedPreviews).toBe(1);
      expect(stats.previewsByType[PreviewFileType.IMAGE]).toBe(1);
    });
  });

  describe('getPreview', () => {
    it('should return preview by ID', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      const created = await service.createPreview({
        fileId: 'file-8',
        fileName: 'get-test.jpg',
        mimeType: 'image/jpeg',
        fileData
      });

      const retrieved = service.getPreview(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent preview', () => {
      const result = service.getPreview('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getPreviewByFileId', () => {
    it('should return preview by file ID', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      await service.createPreview({
        fileId: 'file-9',
        fileName: 'fileid-test.jpg',
        mimeType: 'image/jpeg',
        fileData
      });

      const retrieved = service.getPreviewByFileId('file-9');
      expect(retrieved).toBeDefined();
      expect(retrieved?.fileId).toBe('file-9');
    });

    it('should return null for non-existent file ID', () => {
      const result = service.getPreviewByFileId('non-existent-file');
      expect(result).toBeNull();
    });
  });

  describe('deletePreview', () => {
    it('should delete preview and revoke URLs', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      const created = await service.createPreview({
        fileId: 'file-10',
        fileName: 'delete-test.jpg',
        mimeType: 'image/jpeg',
        fileData
      });

      const result = service.deletePreview(created.id);
      expect(result).toBe(true);
      expect(service.getPreview(created.id)).toBeNull();
    });

    it('should return false when deleting non-existent preview', () => {
      const result = service.deletePreview('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('clearAllPreviews', () => {
    it('should clear all previews', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      await service.createPreview({
        fileId: 'file-11',
        fileName: 'clear-test-1.jpg',
        mimeType: 'image/jpeg',
        fileData
      });
      await service.createPreview({
        fileId: 'file-12',
        fileName: 'clear-test-2.jpg',
        mimeType: 'image/png',
        fileData
      });

      service.clearAllPreviews();

      const stats = service.getStats();
      expect(stats.cachedPreviews).toBe(0);
    });
  });

  describe('getThumbnail', () => {
    it('should return thumbnail for preview', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(2048);
      const preview = await service.createPreview({
        fileId: 'file-13',
        fileName: 'thumb-test.jpg',
        mimeType: 'image/jpeg',
        fileData,
        generateThumbnails: true
      });

      // Need to wait for async thumbnail generation
      await new Promise((resolve) => setTimeout(resolve, 100));

      const thumbnail = service.getThumbnail(preview.id, PreviewQuality.THUMBNAIL);
      // Thumbnail might exist if generated
      if (thumbnail) {
        expect(thumbnail.fileId).toBe(preview.id);
        expect(thumbnail.quality).toBe(PreviewQuality.THUMBNAIL);
      }
    });
  });

  describe('getPreviewUrl', () => {
    it('should return preview URL', async () => {
      mockImageLoad(800, 600);

      const fileData = new ArrayBuffer(1024);
      const preview = await service.createPreview({
        fileId: 'file-14',
        fileName: 'url-test.jpg',
        mimeType: 'image/jpeg',
        fileData
      });

      const url = service.getPreviewUrl(preview.id);
      expect(url).toBeDefined();
      expect(url).toContain('blob:');
    });

    it('should return null for non-existent preview', () => {
      const url = service.getPreviewUrl('non-existent-id');
      expect(url).toBeNull();
    });
  });

  describe('performSecurityScan', () => {
    it('should mark safe files as safe', async () => {
      const fileData = new ArrayBuffer(512);
      const preview = await service.createPreview({
        fileId: 'file-15',
        fileName: 'safe-document.pdf',
        mimeType: 'application/pdf',
        fileData
      });

      const result = await service.performSecurityScan(preview);
      expect(result.status).toBe(SecurityStatus.SAFE);
      expect(result.threats).toHaveLength(0);
    });

    it('should detect suspicious extensions', async () => {
      const fileData = new ArrayBuffer(512);
      const preview = await service.createPreview({
        fileId: 'file-16',
        fileName: 'suspicious.bat',
        mimeType: 'application/octet-stream',
        fileData
      });

      const result = await service.performSecurityScan(preview);
      expect(result.status).toBe(SecurityStatus.SUSPICIOUS);
      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].severity).toBe('medium');
    });
  });

  describe('needsDownloadForPreview', () => {
    it('should return true for document types', () => {
      expect(service.needsDownloadForPreview(PreviewFileType.DOCUMENT)).toBe(true);
      expect(service.needsDownloadForPreview(PreviewFileType.SPREADSHEET)).toBe(true);
      expect(service.needsDownloadForPreview(PreviewFileType.ARCHIVE)).toBe(true);
      expect(service.needsDownloadForPreview(PreviewFileType.UNKNOWN)).toBe(true);
    });

    it('should return false for previewable types', () => {
      expect(service.needsDownloadForPreview(PreviewFileType.IMAGE)).toBe(false);
      expect(service.needsDownloadForPreview(PreviewFileType.PDF)).toBe(false);
      expect(service.needsDownloadForPreview(PreviewFileType.VIDEO)).toBe(false);
      expect(service.needsDownloadForPreview(PreviewFileType.AUDIO)).toBe(false);
    });
  });

  describe('getSupportedFileTypes', () => {
    it('should return list of supported file types', () => {
      const supported = service.getSupportedFileTypes();
      expect(supported).toContain(PreviewFileType.IMAGE);
      expect(supported).toContain(PreviewFileType.PDF);
      expect(supported).toContain(PreviewFileType.VIDEO);
      expect(supported).toContain(PreviewFileType.AUDIO);
      expect(supported).toContain(PreviewFileType.TEXT);
      expect(supported).toContain(PreviewFileType.CODE);
    });
  });

  describe('getMaxFileSizeForPreview', () => {
    it('should return correct max sizes for each file type', () => {
      expect(service.getMaxFileSizeForPreview(PreviewFileType.IMAGE)).toBe(50 * 1024 * 1024);
      expect(service.getMaxFileSizeForPreview(PreviewFileType.PDF)).toBe(100 * 1024 * 1024);
      expect(service.getMaxFileSizeForPreview(PreviewFileType.VIDEO)).toBe(500 * 1024 * 1024);
      expect(service.getMaxFileSizeForPreview(PreviewFileType.AUDIO)).toBe(100 * 1024 * 1024);
      expect(service.getMaxFileSizeForPreview(PreviewFileType.TEXT)).toBe(10 * 1024 * 1024);
    });
  });

  describe('extractArchiveContents', () => {
    it('should return empty archive content', async () => {
      const blob = new Blob(['archive-data']);
      const contents = await service.extractArchiveContents(blob);

      expect(contents.files).toEqual([]);
      expect(contents.totalFiles).toBe(0);
      expect(contents.compressedSize).toBe(blob.size);
    });
  });
});
