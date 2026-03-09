import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragDrop } from '../../src/hooks/useDragDrop';

// Helper to create mock File objects
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['x'.repeat(size)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Helper to create mock DragEvent
const createDragEvent = (files: File[] = []): React.DragEvent => {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      files,
      items: files.map(() => ({}))
    }
  } as unknown as React.DragEvent;
};

// Helper to create mock ChangeEvent for file input
const createFileInputEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> => {
  return {
    target: {
      files,
      value: ''
    }
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

describe('useDragDrop', () => {
  describe('initial state', () => {
    it('should start with default state', () => {
      const { result } = renderHook(() => useDragDrop());

      expect(result.current.isDragging).toBe(false);
      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.totalSize).toBe(0);
    });
  });

  describe('drag events', () => {
    it('should set isDragging on dragEnter', () => {
      const { result } = renderHook(() => useDragDrop());

      const event = createDragEvent([createMockFile('test.txt', 100, 'text/plain')]);

      act(() => {
        result.current.handleDragEnter(event);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should unset isDragging on dragLeave when counter reaches 0', () => {
      const { result } = renderHook(() => useDragDrop());

      const event = createDragEvent([createMockFile('test.txt', 100, 'text/plain')]);

      act(() => {
        result.current.handleDragEnter(event);
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragLeave(event);
      });
      expect(result.current.isDragging).toBe(false);
    });

    it('should handle nested drag enter/leave correctly', () => {
      const { result } = renderHook(() => useDragDrop());

      const event = createDragEvent([createMockFile('test.txt', 100, 'text/plain')]);

      // Enter parent
      act(() => {
        result.current.handleDragEnter(event);
      });
      // Enter child
      act(() => {
        result.current.handleDragEnter(event);
      });
      expect(result.current.isDragging).toBe(true);

      // Leave child
      act(() => {
        result.current.handleDragLeave(event);
      });
      expect(result.current.isDragging).toBe(true); // Still dragging

      // Leave parent
      act(() => {
        result.current.handleDragLeave(event);
      });
      expect(result.current.isDragging).toBe(false);
    });

    it('should prevent default on dragOver', () => {
      const { result } = renderHook(() => useDragDrop());

      const event = createDragEvent();

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('handleDrop', () => {
    it('should add valid files on drop', () => {
      const { result } = renderHook(() => useDragDrop());

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const event = createDragEvent([file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('document.pdf');
      expect(result.current.isDragging).toBe(false);
    });

    it('should add multiple files on drop', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = [createMockFile('file1.txt', 100, 'text/plain'), createMockFile('file2.txt', 200, 'text/plain')];
      const event = createDragEvent(files);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(2);
    });

    it('should reject files exceeding max size', () => {
      const { result } = renderHook(() => useDragDrop({ maxSize: 1000 }));

      const file = createMockFile('large.pdf', 2000, 'application/pdf');
      const event = createDragEvent([file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('exceeds maximum size');
    });

    it('should reject files with disallowed types', () => {
      const { result } = renderHook(() => useDragDrop({ allowedTypes: ['.pdf', '.txt'] }));

      const file = createMockFile('image.exe', 100, 'application/x-msdownload');
      const event = createDragEvent([file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('not allowed');
    });

    it('should reject duplicate files', () => {
      const { result } = renderHook(() => useDragDrop());

      const file = createMockFile('doc.pdf', 1024, 'application/pdf');

      // First drop
      act(() => {
        result.current.handleDrop(createDragEvent([file]));
      });
      expect(result.current.files).toHaveLength(1);

      // Second drop with same file
      act(() => {
        result.current.handleDrop(createDragEvent([file]));
      });
      expect(result.current.files).toHaveLength(1);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('already attached');
    });

    it('should reject when exceeding max files', () => {
      const { result } = renderHook(() => useDragDrop({ maxFiles: 2 }));

      const files = [
        createMockFile('file1.txt', 100, 'text/plain'),
        createMockFile('file2.txt', 100, 'text/plain'),
        createMockFile('file3.txt', 100, 'text/plain')
      ];
      const event = createDragEvent(files);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(1);
      expect(result.current.errors[0]).toContain('Cannot add more than 2 files');
    });

    it('should call onFilesAdded callback', () => {
      const onFilesAdded = vi.fn();
      const { result } = renderHook(() => useDragDrop({ onFilesAdded }));

      const file = createMockFile('test.txt', 100, 'text/plain');
      const event = createDragEvent([file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(onFilesAdded).toHaveBeenCalledWith([file]);
    });

    it('should not call onFilesAdded when no valid files', () => {
      const onFilesAdded = vi.fn();
      const { result } = renderHook(() => useDragDrop({ onFilesAdded, maxSize: 10 }));

      const file = createMockFile('large.txt', 1000, 'text/plain');
      const event = createDragEvent([file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(onFilesAdded).not.toHaveBeenCalled();
    });
  });

  describe('handleFileSelect', () => {
    it('should add files from file input', () => {
      const { result } = renderHook(() => useDragDrop());

      const file = createMockFile('selected.txt', 100, 'text/plain');
      const event = createFileInputEvent([file]);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('selected.txt');
    });

    it('should validate files from file input', () => {
      const { result } = renderHook(() => useDragDrop({ maxSize: 50 }));

      const file = createMockFile('large.txt', 1000, 'text/plain');
      const event = createFileInputEvent([file]);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it('should reject when exceeding max files via file input', () => {
      const { result } = renderHook(() => useDragDrop({ maxFiles: 1 }));

      const files = [createMockFile('file1.txt', 100, 'text/plain'), createMockFile('file2.txt', 100, 'text/plain')];
      const event = createFileInputEvent(files);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors[0]).toContain('Cannot add more than 1 files');
    });

    it('should call onFilesAdded callback from file input', () => {
      const onFilesAdded = vi.fn();
      const { result } = renderHook(() => useDragDrop({ onFilesAdded }));

      const file = createMockFile('test.txt', 100, 'text/plain');
      const event = createFileInputEvent([file]);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(onFilesAdded).toHaveBeenCalledWith([file]);
    });
  });

  describe('removeFile', () => {
    it('should remove a file by index', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = [createMockFile('file1.txt', 100, 'text/plain'), createMockFile('file2.txt', 200, 'text/plain')];

      act(() => {
        result.current.handleDrop(createDragEvent(files));
      });
      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.removeFile(0);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('file2.txt');
    });

    it('should call onFileRemoved callback', () => {
      const onFileRemoved = vi.fn();
      const { result } = renderHook(() => useDragDrop({ onFileRemoved }));

      const file = createMockFile('test.txt', 100, 'text/plain');

      act(() => {
        result.current.handleDrop(createDragEvent([file]));
      });

      act(() => {
        result.current.removeFile(0);
      });

      expect(onFileRemoved).toHaveBeenCalledWith('test.txt');
    });

    it('should clear errors when removing a file', () => {
      const { result } = renderHook(() => useDragDrop({ maxSize: 50 }));

      // Add a valid file first
      const validFile = createMockFile('small.txt', 10, 'text/plain');
      act(() => {
        result.current.handleDrop(createDragEvent([validFile]));
      });

      // Try to add an invalid file to generate errors
      const invalidFile = createMockFile('large.txt', 1000, 'text/plain');
      act(() => {
        result.current.handleDrop(createDragEvent([invalidFile]));
      });
      expect(result.current.errors.length).toBeGreaterThan(0);

      // Remove the valid file - errors should clear
      act(() => {
        result.current.removeFile(0);
      });
      expect(result.current.errors).toHaveLength(0);
    });
  });

  describe('clearFiles', () => {
    it('should remove all files', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = [createMockFile('file1.txt', 100, 'text/plain'), createMockFile('file2.txt', 200, 'text/plain')];

      act(() => {
        result.current.handleDrop(createDragEvent(files));
      });
      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe('clearErrors', () => {
    it('should clear errors without affecting files', () => {
      const { result } = renderHook(() => useDragDrop({ maxSize: 50 }));

      // Add valid file
      const validFile = createMockFile('small.txt', 10, 'text/plain');
      act(() => {
        result.current.handleDrop(createDragEvent([validFile]));
      });

      // Generate error
      const invalidFile = createMockFile('large.txt', 1000, 'text/plain');
      act(() => {
        result.current.handleDrop(createDragEvent([invalidFile]));
      });
      expect(result.current.errors.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toHaveLength(0);
      expect(result.current.files).toHaveLength(1); // Valid file still there
    });
  });

  describe('totalSize', () => {
    it('should calculate total size of all files', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = [
        createMockFile('file1.txt', 100, 'text/plain'),
        createMockFile('file2.txt', 200, 'text/plain'),
        createMockFile('file3.txt', 300, 'text/plain')
      ];

      act(() => {
        result.current.handleDrop(createDragEvent(files));
      });

      expect(result.current.totalSize).toBe(600);
    });

    it('should update total size when files are removed', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = [createMockFile('file1.txt', 100, 'text/plain'), createMockFile('file2.txt', 200, 'text/plain')];

      act(() => {
        result.current.handleDrop(createDragEvent(files));
      });
      expect(result.current.totalSize).toBe(300);

      act(() => {
        result.current.removeFile(0);
      });
      expect(result.current.totalSize).toBe(200);
    });

    it('should be 0 when no files', () => {
      const { result } = renderHook(() => useDragDrop());

      expect(result.current.totalSize).toBe(0);
    });
  });

  describe('default options', () => {
    it('should use 25MB as default max size', () => {
      const { result } = renderHook(() => useDragDrop());

      const largeFile = createMockFile('huge.bin', 26 * 1024 * 1024, 'application/octet-stream');
      act(() => {
        result.current.handleDrop(createDragEvent([largeFile]));
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors[0]).toContain('exceeds maximum size');
    });

    it('should use 10 as default max files', () => {
      const { result } = renderHook(() => useDragDrop());

      const files = Array.from({ length: 11 }, (_, i) => createMockFile(`file${i}.txt`, 10, 'text/plain'));

      act(() => {
        result.current.handleDrop(createDragEvent(files));
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.errors[0]).toContain('Cannot add more than 10 files');
    });

    it('should allow all file types by default', () => {
      const { result } = renderHook(() => useDragDrop());

      const file = createMockFile('anything.xyz', 100, 'application/xyz');
      act(() => {
        result.current.handleDrop(createDragEvent([file]));
      });

      expect(result.current.files).toHaveLength(1);
    });
  });
});
