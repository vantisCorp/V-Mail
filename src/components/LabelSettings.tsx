import React, { useState } from 'react';
import { useLabels } from '../hooks/useLabels';
import { useNotifications } from '../hooks/useNotifications';
import type { Label } from '../types/labels';

interface LabelSettingsProps {
  onClose: () => void;
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export const LabelSettings: React.FC<LabelSettingsProps> = ({ onClose }) => {
  const { labels, stats, addLabel, updateLabel, deleteLabel, duplicateLabel } = useLabels();
  const { addNotification } = useNotifications();
  
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [newLabelDescription, setNewLabelDescription] = useState('');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleAddLabel = () => {
    if (!newLabelName.trim()) {
      addNotification('error', 'Label name is required');
      return;
    }

    addLabel({
      name: newLabelName.trim(),
      color: newLabelColor,
      description: newLabelDescription.trim() || undefined,
    });

    setNewLabelName('');
    setNewLabelColor(DEFAULT_COLORS[0]);
    setNewLabelDescription('');
  };

  const handleStartEdit = (label: Label) => {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColor(label.color);
    setEditDescription(label.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingLabel) return;
    
    if (!editName.trim()) {
      addNotification('error', 'Label name is required');
      return;
    }

    updateLabel(editingLabel.id, {
      name: editName.trim(),
      color: editColor,
      description: editDescription.trim() || undefined,
    });

    setEditingLabel(null);
    setEditName('');
    setEditColor('');
    setEditDescription('');
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setEditName('');
    setEditColor('');
    setEditDescription('');
  };

  const handleDeleteLabel = (label: Label) => {
    if (window.confirm(`Are you sure you want to delete the label "${label.name}"?`)) {
      deleteLabel(label.id);
    }
  };

  const handleDuplicateLabel = (label: Label) => {
    duplicateLabel(label.id);
  };

  return (
    <div className="labels-settings-overlay" onClick={onClose}>
      <div className="labels-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="labels-settings-header">
          <h2 className="labels-settings-title">Label Settings</h2>
          <button className="labels-settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="labels-settings-content">
          {/* Stats */}
          <div className="labels-stats">
            <div className="label-stat-card">
              <div className="label-stat-value">{stats.totalLabels}</div>
              <div className="label-stat-label">Total Labels</div>
            </div>
            <div className="label-stat-card">
              <div className="label-stat-value">{stats.totalLabeledEmails}</div>
              <div className="label-stat-label">Labeled Emails</div>
            </div>
          </div>

          {/* Add Label Form */}
          <div className="add-label-form">
            <input
              type="text"
              className="add-label-input"
              placeholder="New label name..."
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
            />
            <div className="color-picker-wrapper">
              <input
                type="color"
                className="color-picker"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                title="Choose label color"
              />
            </div>
            <button
              className="add-label-btn"
              onClick={handleAddLabel}
              disabled={!newLabelName.trim()}
            >
              Add
            </button>
          </div>

          {/* Color Presets */}
          <div className="color-presets">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                className={`color-preset ${newLabelColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewLabelColor(color)}
                title={`Select ${color}`}
              />
            ))}
          </div>

          {/* Labels List */}
          <div className="labels-list">
            {labels.length === 0 ? (
              <div className="labels-empty">
                <div className="labels-empty-icon">🏷️</div>
                <div className="labels-empty-text">No labels yet</div>
                <div className="labels-empty-hint">Create your first label above</div>
              </div>
            ) : (
              labels.map((label) => (
                <div key={label.id} className="label-item">
                  {editingLabel?.id === label.id ? (
                    <div className="edit-label-form">
                      <div className="edit-label-row">
                        <div className="edit-label-field">
                          <label className="edit-label-label">Name</label>
                          <input
                            type="text"
                            className="edit-label-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                        </div>
                        <div className="edit-label-field" style={{ width: '60px' }}>
                          <label className="edit-label-label">Color</label>
                          <input
                            type="color"
                            className="color-picker"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="edit-label-row">
                        <div className="edit-label-field">
                          <label className="edit-label-label">Description</label>
                          <input
                            type="text"
                            className="edit-label-input"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Optional description..."
                          />
                        </div>
                      </div>
                      <div className="edit-label-actions">
                        <button className="edit-label-cancel" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                        <button className="edit-label-save" onClick={handleSaveEdit}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="label-color-badge"
                        style={{ backgroundColor: label.color }}
                      />
                      <div className="label-info">
                        <div className="label-name">{label.name}</div>
                        {label.description && (
                          <div className="label-description">{label.description}</div>
                        )}
                      </div>
                      <div className="label-count">
                        {label.emailCount ?? 0} emails
                      </div>
                      <div className="label-actions">
                        <button
                          className="label-action-btn"
                          onClick={() => handleStartEdit(label)}
                          title="Edit label"
                        >
                          ✏️
                        </button>
                        <button
                          className="label-action-btn"
                          onClick={() => handleDuplicateLabel(label)}
                          title="Duplicate label"
                        >
                          📋
                        </button>
                        <button
                          className="label-action-btn delete"
                          onClick={() => handleDeleteLabel(label)}
                          title="Delete label"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelSettings;