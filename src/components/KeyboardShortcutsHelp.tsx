import React from 'react';
import { KeyboardShortcutGroup } from '../types/keyboard';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutGroups: KeyboardShortcutGroup[];
  isEnabled: boolean;
  onToggleEnabled: () => void;
}

const formatShortcut = (key: string, modifiers: string[]): string => {
  const parts = [...modifiers];
  parts.push(key);
  return parts.map(part => {
    if (part === 'ctrl') {
return 'Ctrl';
}
    if (part === 'alt') {
return 'Alt';
}
    if (part === 'shift') {
return 'Shift';
}
    if (part === 'meta') {
return '⌘';
}
    return part.toUpperCase();
  }).join(' + ');
};

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcutGroups,
  isEnabled,
  onToggleEnabled
}) => {
  if (!isOpen) {
return null;
}

  return (
    <div className="keyboard-shortcuts-overlay">
      <div className="keyboard-shortcuts-panel">
        <div className="keyboard-shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="keyboard-shortcuts-content">
          <div className="shortcuts-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={onToggleEnabled}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Enable keyboard shortcuts</span>
            </label>
          </div>

          <div className="shortcuts-groups">
            {shortcutGroups.map((group, index) => (
              <div key={index} className="shortcuts-group">
                <h3 className="group-title">{group.title}</h3>
                <div className="shortcuts-list">
                  {group.shortcuts.map(shortcut => (
                    <div key={shortcut.id} className="shortcut-item">
                      <div className="shortcut-keys">
                        {formatShortcut(shortcut.key, shortcut.modifiers)}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="shortcuts-footer">
            <p className="tips-text">
              💡 <strong>Tip:</strong> Press <kbd className="inline-key">?</kbd> to quickly access this help panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
