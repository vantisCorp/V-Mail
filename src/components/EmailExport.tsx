/**
 * Email Export Component
 * Main UI component for email export functionality
 */

import React, { useState, useMemo } from 'react';
import { useEmailExport } from '../hooks/useEmailExport';
import type { ExportFormat, ExportOptions } from '../types/emailExport';
import './emailExport.css';

interface EmailExportProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emails: any[];
  onClose?: () => void;
}

export const EmailExport: React.FC<EmailExportProps> = ({ emails, onClose }) => {
  const {
    isExporting,
    exportProgress,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exportHistory,
    exportStatistics,
    exportSingleEmail,
    exportMultipleEmails,
    queueExport,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    processQueue,
    clearExportHistory,
    getRecentExports
  } = useEmailExport();

  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [filename, setFilename] = useState('');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [activeTab, setActiveTab] = useState<'export' | 'history' | 'stats'>('export');

  const options: ExportOptions = useMemo(
    () => ({
      format,
      includeAttachments,
      includeHeaders,
      includeMetadata: true,
      filename: filename || undefined,
      continueOnError: true
    }),
    [format, includeAttachments, includeHeaders, filename]
  );

  const handleExport = async () => {
    if (selectedEmails.length === 0) {
      // eslint-disable-next-line no-alert
      alert('Please select at least one email to export');
      return;
    }

    const emailsToExport = emails.filter((email) => selectedEmails.includes(email.id));

    if (emailsToExport.length === 1) {
      await exportSingleEmail(emailsToExport[0], options);
    } else {
      await exportMultipleEmails(emailsToExport, options);
    }
  };

  const handleQueueExport = async () => {
    if (selectedEmails.length === 0) {
      // eslint-disable-next-line no-alert
      alert('Please select at least one email to export');
      return;
    }

    const emailsToExport = emails.filter((email) => selectedEmails.includes(email.id));
    await queueExport(emailsToExport, options);
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map((e) => e.id));
    }
  };

  const recentExports = getRecentExports(10);

  return (
    <div className="email-export">
      <div className="email-export-header">
        <h2>Email Export</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="export-tabs">
        <button className={`tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>
          Export
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          History
        </button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          Statistics
        </button>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="export-tab-content">
          {/* Export Options */}
          <div className="export-options">
            <div className="option-group">
              <label>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
                <option value="pdf">PDF</option>
                <option value="eml">EML</option>
                <option value="msg">MSG</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="option-group">
              <label>Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Optional filename"
              />
            </div>

            <div className="option-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                />
                Include Attachments
              </label>
            </div>

            <div className="option-group checkbox">
              <label>
                <input type="checkbox" checked={includeHeaders} onChange={(e) => setIncludeHeaders(e.target.checked)} />
                Include Headers
              </label>
            </div>
          </div>

          {/* Email Selection */}
          <div className="email-selection">
            <div className="selection-header">
              <label>
                <input
                  type="checkbox"
                  checked={selectedEmails.length === emails.length && emails.length > 0}
                  onChange={handleSelectAll}
                />
                Select All ({emails.length} emails)
              </label>
              <span className="selected-count">{selectedEmails.length} selected</span>
            </div>

            <div className="email-list">
              {emails.map((email) => (
                <label key={email.id} className="email-item">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmails([...selectedEmails, email.id]);
                      } else {
                        setSelectedEmails(selectedEmails.filter((id) => id !== email.id));
                      }
                    }}
                  />
                  <div className="email-info">
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-from">{email.from?.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Progress */}
          {exportProgress && (
            <div className="export-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${exportProgress.percentage}%` }} />
              </div>
              <div className="progress-text">
                Exporting {exportProgress.currentEmail} of {exportProgress.totalEmails} emails
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="export-actions">
            <button
              className="export-button primary"
              onClick={handleExport}
              disabled={isExporting || selectedEmails.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export Now'}
            </button>
            <button
              className="export-button secondary"
              onClick={handleQueueExport}
              disabled={isExporting || selectedEmails.length === 0}
            >
              Queue Export
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-tab-content">
          <div className="history-header">
            <h3>Export History</h3>
            <button className="clear-button" onClick={clearExportHistory}>
              Clear History
            </button>
          </div>

          <div className="history-list">
            {recentExports.length === 0 ? (
              <div className="no-history">No export history yet</div>
            ) : (
              recentExports.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-info">
                    <div className="history-format">{entry.format.toUpperCase()}</div>
                    <div className="history-count">{entry.emailCount} emails</div>
                    <div className="history-size">{(entry.fileSize / 1024).toFixed(2)} KB</div>
                    <div className="history-time">{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                  <div className={`history-status ${entry.success ? 'success' : 'failed'}`}>
                    {entry.success ? '✓' : '✗'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="stats-tab-content">
          <h3>Export Statistics</h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Exports</div>
              <div className="stat-value">{exportStatistics.totalExports}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Emails Exported</div>
              <div className="stat-value">{exportStatistics.totalEmailsExported}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total File Size</div>
              <div className="stat-value">{(exportStatistics.totalFileSize / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Export Time</div>
              <div className="stat-value">{exportStatistics.averageExportTime.toFixed(2)}s</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Successful</div>
              <div className="stat-value success">{exportStatistics.successfulExports}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Failed</div>
              <div className="stat-value failed">{exportStatistics.failedExports}</div>
            </div>
          </div>

          <div className="format-breakdown">
            <h4>Format Breakdown</h4>
            <div className="breakdown-list">
              {Object.entries(exportStatistics.formatBreakdown).map(([format, count]) => (
                <div key={format} className="breakdown-item">
                  <span className="breakdown-format">{format.toUpperCase()}</span>
                  <span className="breakdown-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
