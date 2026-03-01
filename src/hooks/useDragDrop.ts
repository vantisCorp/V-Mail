import { useState, useCallback, useRef } from 'react';

interface UseDragDropOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onFilesAdded?: (files: File[]) => void;
  onFileRemoved?: (fileId: string) => void;
}

interface DragDropState {
  isDragging: boolean;
  files: File[];
  errors: string[];
}

export const useDragDrop = (options: UseDragDropOptions = {}) => {
  const {
    maxSize = 25 * 1024 * 1024,
    allowedTypes = [],
    maxFiles = 10,
    onFilesAdded,
    onFileRemoved,
  } = options;

  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    files: [],
    errors: [],
  });

  const dragCounter = useRef(0);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
      }

      if (allowedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type;
        
        const isAllowed = allowedTypes.some(
          (type) => 
            type === fileExtension || 
            mimeType.startsWith(type.replace('.', ''))
        );
        
        if (!isAllowed) {
          return `File type "${fileExtension}" is not allowed`;
        }
      }

      return null;
    },
    [maxSize, allowedTypes]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState((prev) => ({ ...prev, isDragging: true }));
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setState((prev) => ({ ...prev, isDragging: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      
      setState((prev) => ({ ...prev, isDragging: false }));

      const droppedFiles = Array.from(e.dataTransfer.files);
      const errors: string[] = [];
      const validFiles: File[] = [];

      if (state.files.length + droppedFiles.length > maxFiles) {
        errors.push(`Cannot add more than ${maxFiles} files`);
        setState((prev) => ({ ...prev, errors }));
        return;
      }

      droppedFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          const isDuplicate = state.files.some(
            (f) => f.name === file.name && f.size === file.size
          );
          
          if (!isDuplicate) {
            validFiles.push(file);
          } else {
            errors.push(`File "${file.name}" is already attached`);
          }
        }
      });

      if (validFiles.length > 0) {
        setState((prev) => ({
          ...prev,
          files: [...prev.files, ...validFiles],
          errors,
        }));
        onFilesAdded?.(validFiles);
      } else {
        setState((prev) => ({ ...prev, errors }));
      }
    },
    [state.files, validateFile, maxFiles, onFilesAdded]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const errors: string[] = [];
      const validFiles: File[] = [];

      if (state.files.length + selectedFiles.length > maxFiles) {
        errors.push(`Cannot add more than ${maxFiles} files`);
        setState((prev) => ({ ...prev, errors }));
        return;
      }

      selectedFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          const isDuplicate = state.files.some(
            (f) => f.name === file.name && f.size === file.size
          );
          
          if (!isDuplicate) {
            validFiles.push(file);
          } else {
            errors.push(`File "${file.name}" is already attached`);
          }
        }
      });

      if (validFiles.length > 0) {
        setState((prev) => ({
          ...prev,
          files: [...prev.files, ...validFiles],
          errors,
        }));
        onFilesAdded?.(validFiles);
      } else {
        setState((prev) => ({ ...prev, errors }));
      }

      e.target.value = '';
    },
    [state.files, validateFile, maxFiles, onFilesAdded]
  );

  const removeFile = useCallback(
    (index: number) => {
      const fileToRemove = state.files[index];
      setState((prev) => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index),
        errors: [],
      }));
      onFileRemoved?.(fileToRemove.name);
    },
    [state.files, onFileRemoved]
  );

  const clearFiles = useCallback(() => {
    setState({
      isDragging: false,
      files: [],
      errors: [],
    });
  }, []);

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: [] }));
  }, []);

  return {
    ...state,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearFiles,
    clearErrors,
    totalSize: state.files.reduce((acc, file) => acc + file.size, 0),
  };
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
