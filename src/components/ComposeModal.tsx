import React, { useState, useRef, useEffect } from 'react';
import { AttachmentDropZone } from './AttachmentDropZone';
import { PhantomModal } from './PhantomModal';
import { SelfDestructModal } from './SelfDestructModal';
import { useAliases } from '../hooks/useAliases';
import { useNotifications } from '../hooks/useNotifications';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: any) => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [encrypt, setEncrypt] = useState(true);
  const [phantomAlias, setPhantomAlias] = useState<string | undefined>();
  const [selfDestruct, setSelfDestruct] = useState<Date | undefined>();
  const [showPhantomModal, setShowPhantomModal] = useState(false);
  const [showSelfDestructModal, setShowSelfDestructModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { aliases } = useAliases();
  const { addNotification } = useNotifications();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      setEncrypt(true);
      setPhantomAlias(undefined);
      setSelfDestruct(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (!to || !subject) {
      addNotification('error', 'Please fill in recipient and subject');
      return;
    }

    setIsSending(true);

    try {
      await onSend({
        to,
        cc: showCc ? cc : undefined,
        bcc: showBcc ? bcc : undefined,
        subject,
        body,
        attachments,
        phantomAlias,
        selfDestruct,
        encrypt,
      });

      addNotification('success', 'Email sent successfully');
      onClose();
    } catch (error) {
      addNotification('error', 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleFilesAdded = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleFileRemoved = (fileName: string) => {
    setAttachments((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handlePhantomSelect = (alias: string) => {
    setPhantomAlias(alias);
    setShowPhantomModal(false);
  };

  const handleSelfDestructSelect = (date: Date) => {
    setSelfDestruct(date);
    setShowSelfDestructModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content compose-modal"
          onClick={(e) => e.stopPropagation()}
          ref={modalRef}
        >
          <div className="modal-header">
            <h2 className="modal-title">New Message</h2>
            <button className="modal-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="compose-form">
              <div className="form-group">
                <label htmlFor="compose-to">To:</label>
                <input
                  id="compose-to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="form-input"
                />
              </div>

              {showCc && (
                <div className="form-group">
                  <label htmlFor="compose-cc">Cc:</label>
                  <input
                    id="compose-cc"
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="form-input"
                  />
                </div>
              )}

              {showBcc && (
                <div className="form-group">
                  <label htmlFor="compose-bcc">Bcc:</label>
                  <input
                    id="compose-bcc"
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="form-input"
                  />
                </div>
              )}

              <div className="compose-options">
                {!showCc && (
                  <button
                    type="button"
                    className="option-btn"
                    onClick={() => setShowCc(true)}
                  >
                    Add Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    className="option-btn"
                    onClick={() => setShowBcc(true)}
                  >
                    Add Bcc
                  </button>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="compose-subject">Subject:</label>
                <input
                  id="compose-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="compose-body">Message:</label>
                <textarea
                  id="compose-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  className="form-textarea"
                  rows={10}
                />
              </div>

              <div className="form-group">
                <label>Attachments:</label>
                <AttachmentDropZone
                  maxSize={25 * 1024 * 1024}
                  maxFiles={10}
                  onFilesAdded={handleFilesAdded}
                  onFileRemoved={handleFileRemoved}
                />
              </div>

              <div className="compose-security">
                <h3>Security Options</h3>

                <div className="security-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={encrypt}
                      onChange={(e) => setEncrypt(e.target.checked)}
                    />
                    <span>Encrypt message</span>
                  </label>
                  <span className="security-hint">
                    End-to-end encryption with X25519 + Kyber-1024
                  </span>
                </div>

                <div className="security-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!phantomAlias}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShowPhantomModal(true);
                        } else {
                          setPhantomAlias(undefined);
                        }
                      }}
                    />
                    <span>Use Phantom Alias</span>
                  </label>
                  {phantomAlias && (
                    <span className="security-value">{phantomAlias}</span>
                  )}
                  <span className="security-hint">
                    Hide your real email address
                  </span>
                </div>

                <div className="security-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!selfDestruct}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShowSelfDestructModal(true);
                        } else {
                          setSelfDestruct(undefined);
                        }
                      }}
                    />
                    <span>Self-Destruct</span>
                  </label>
                  {selfDestruct && (
                    <span className="security-value">
                      {selfDestruct.toLocaleString()}
                    </span>
                  )}
                  <span className="security-hint">
                    Message will be automatically deleted
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {showPhantomModal && (
        <PhantomModal
          isOpen={showPhantomModal}
          onClose={() => setShowPhantomModal(false)}
          onSelect={handlePhantomSelect}
        />
      )}

      {showSelfDestructModal && (
        <SelfDestructModal
          isOpen={showSelfDestructModal}
          onClose={() => setShowSelfDestructModal(false)}
          onSelect={handleSelfDestructSelect}
        />
      )}
    </>
  );
};
