import React from 'react';
import { useDragDrop } from '../hooks/useDragDrop';

interface AttachmentDropZoneProps {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onFilesAdded?: (files: File[]) => void;
  onFileRemoved?: (fileId: string) => void;
  className?: string;
}

export const AttachmentDropZone: React.FC<AttachmentDropZoneProps> = ({
  maxSize = 25 * 1024 * 1024,
  allowedTypes = [],
  maxFiles = 10,
  onFilesAdded,
  onFileRemoved,
  className = ''
}) => {
  const {
    isDragging,
    files,
    errors,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearErrors,
    totalSize
  } = useDragDrop({
    maxSize,
    allowedTypes,
    maxFiles,
    onFilesAdded,
    onFileRemoved
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
      txt: '📃',
      mp3: '🎵',
      mp4: '🎬',
      mov: '🎬',
      avi: '🎬'
    };
    return iconMap[ext] || '📎';
  };

  return (
    <div className={`attachment-drop-zone ${className}`}>
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <div className="drop-zone-icon">📁</div>
          <p className="drop-zone-text">
            Drag & drop files here or{' '}
            <label htmlFor="file-input" className="browse-link">
              browse
            </label>
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="file-input"
            accept={allowedTypes.join(',')}
          />
          <p className="drop-zone-hint">
            Maximum {maxFiles} files, {formatFileSize(maxSize)} each
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="attachment-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              ⚠️ {error}
            </div>
          ))}
          <button
            className="clear-errors-btn"
            onClick={clearErrors}
            type="button"
          >
            Clear errors
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="attachment-list">
          <div className="attachment-list-header">
            <span className="attachment-count">
              {files.length} file{files.length !== 1 ? 's' : ''} attached
            </span>
            <span className="attachment-size">
              Total: {formatFileSize(totalSize)}
            </span>
          </div>
          <div className="attachment-items">
            {files.map((file, index) => (
              <div key={index} className="attachment-item">
                <div className="attachment-icon">{getFileIcon(file.name)}</div>
                <div className="attachment-info">
                  <div className="attachment-name">{file.name}</div>
                  <div className="attachment-meta">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  className="attachment-remove-btn"
                  onClick={() => removeFile(index)}
                  type="button"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
