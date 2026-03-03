import React, { useState, useEffect } from 'react';
import { Attachment } from '../types';

interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  attachment,
  isOpen,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attachment) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, attachment]);

  if (!isOpen || !attachment) {
    return null;
  }

  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';
  const isText = attachment.type.startsWith('text/');
  const isVideo = attachment.type.startsWith('video/');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className="modal-overlay attachment-preview-modal"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="preview-title" className="modal-title">
            {attachment.name}
          </h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isLoading && (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="preview-content">
              {isImage && (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="preview-image"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setError('Failed to load image');
                  }}
                />
              )}

              {isPdf && (
                <iframe
                  src={attachment.url}
                  className="preview-pdf"
                  title={attachment.name}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setError('Failed to load PDF');
                  }}
                />
              )}

              {isText && (
                <div className="preview-text">
                  <iframe
                    src={attachment.url}
                    className="preview-text-frame"
                    title={attachment.name}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setError('Failed to load text file');
                    }}
                  />
                </div>
              )}

              {isVideo && (
                <video
                  src={attachment.url}
                  controls
                  className="preview-video"
                  onLoadedData={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setError('Failed to load video');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {!isImage && !isPdf && !isText && !isVideo && (
                <div className="preview-unsupported">
                  <div className="unsupported-icon">📄</div>
                  <h3>Preview not available</h3>
                  <p>
                    This file type ({attachment.type}) cannot be previewed in the
                    browser.
                  </p>
                  <a
                    href={attachment.url}
                    download={attachment.name}
                    className="download-btn"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="attachment-info">
            <span className="info-label">Size:</span>
            <span className="info-value">{formatFileSize(attachment.size)}</span>
            <span className="info-label">Type:</span>
            <span className="info-value">{attachment.type}</span>
          </div>
          <div className="modal-actions">
            <a
              href={attachment.url}
              download={attachment.name}
              className="btn btn-primary"
            >
              Download
            </a>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
