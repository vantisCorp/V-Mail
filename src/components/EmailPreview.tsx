import React, { useState } from 'react';
import { Email } from '../types';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { useNotifications } from '../hooks/useNotifications';

interface EmailPreviewProps {
  email: Email | null;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({ email }) => {
  const [previewAttachment, setPreviewAttachment] = useState<Email['attachments'] extends (infer T)[] ? T : null>(null);
  const { addNotification } = useNotifications();

  if (!email) {
    return (
      <div className="email-preview empty">
        <div className="empty-state">
          <div className="empty-icon">📧</div>
          <p>Select an email to preview</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleAttachmentClick = (attachment: any) => {
    setPreviewAttachment(attachment);
  };

  const handleDownload = (attachment: any) => {
    addNotification('success', `Downloading ${attachment.name}...`);
  };

  return (
    <>
      <div className="email-preview">
        <div className="email-preview-header">
          <h1 className="email-subject">{email.subject}</h1>
          <div className="email-meta">
            <div className="email-from">
              <span className="meta-label">From:</span>
              <span className="meta-value">{email.from}</span>
            </div>
            <div className="email-to">
              <span className="meta-label">To:</span>
              <span className="meta-value">{email.to}</span>
            </div>
            <div className="email-date">
              <span className="meta-label">Date:</span>
              <span className="meta-value">{formatDate(email.date)}</span>
            </div>
          </div>
          <div className="email-badges">
            {email.encrypted && (
              <span className="badge badge-encrypted" title="End-to-end encrypted">
                🔒 Encrypted
              </span>
            )}
            {email.phantomAlias && (
              <span className="badge badge-phantom" title="Sent via Phantom Alias">
                👻 Phantom: {email.phantomAlias}
              </span>
            )}
            {email.selfDestruct && (
              <span className="badge badge-destruct" title="Self-destructs at">
                ⏰ Self-destructs: {formatDate(email.selfDestruct)}
              </span>
            )}
          </div>
        </div>

        <div className="email-preview-body">
          <div className="email-content">{email.body}</div>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="email-attachments">
            <h3>Attachments ({email.attachments.length})</h3>
            <div className="attachment-list">
              {email.attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-item">
                  <div className="attachment-icon">📎</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{attachment.name}</div>
                    <div className="attachment-size">
                      {formatFileSize(attachment.size)}
                    </div>
                  </div>
                  <div className="attachment-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAttachmentClick(attachment)}
                    >
                      Preview
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDownload(attachment)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {previewAttachment && (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </>
  );
};
