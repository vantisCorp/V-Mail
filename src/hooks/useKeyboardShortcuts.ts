import { useState, useEffect, useCallback, useMemo } from 'react';
import { KeyboardShortcut, KeyboardShortcutCategory, KeyboardShortcutGroup } from '../types/keyboard';

interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
  shortcutGroups: KeyboardShortcutGroup[];
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  pressedKeys: Set<string>;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  // Navigation
  { id: 'navigate-inbox', key: 'i', modifiers: ['ctrl'], description: 'Go to Inbox', category: 'navigation' },
  { id: 'navigate-sent', key: 's', modifiers: ['ctrl', 'shift'], description: 'Go to Sent', category: 'navigation' },
  { id: 'navigate-drafts', key: 'd', modifiers: ['ctrl'], description: 'Go to Drafts', category: 'navigation' },
  { id: 'navigate-trash', key: 't', modifiers: ['ctrl'], description: 'Go to Trash', category: 'navigation' },
  
  // Compose
  { id: 'compose', key: 'n', modifiers: ['ctrl'], description: 'Compose new email', category: 'compose' },
  { id: 'send', key: 'Enter', modifiers: ['ctrl'], description: 'Send email', category: 'compose' },
  { id: 'save-draft', key: 's', modifiers: ['ctrl'], description: 'Save draft', category: 'compose' },
  
  // Email Actions
  { id: 'reply', key: 'r', modifiers: [], description: 'Reply to email', category: 'email-actions' },
  { id: 'reply-all', key: 'r', modifiers: ['shift'], description: 'Reply all', category: 'email-actions' },
  { id: 'forward', key: 'f', modifiers: [], description: 'Forward email', category: 'email-actions' },
  { id: 'delete', key: 'Delete', modifiers: [], description: 'Delete email', category: 'email-actions' },
  { id: 'star', key: 's', modifiers: [], description: 'Star/unstar email', category: 'email-actions' },
  { id: 'mark-read', key: 'm', modifiers: [], description: 'Mark as read/unread', category: 'email-actions' },
  
  // Search
  { id: 'search', key: '/', modifiers: [], description: 'Focus search', category: 'search' },
  { id: 'advanced-search', key: '/', modifiers: ['ctrl', 'shift'], description: 'Open advanced search', category: 'search' },
  
  // Folder
  { id: 'next-email', key: 'j', modifiers: [], description: 'Next email', category: 'folder' },
  { id: 'prev-email', key: 'k', modifiers: [], description: 'Previous email', category: 'folder' },
  { id: 'next-page', key: 'n', modifiers: [], description: 'Next page', category: 'folder' },
  { id: 'prev-page', key: 'p', modifiers: [], description: 'Previous page', category: 'folder' },
  
  // Security
  { id: 'panic', key: 'p', modifiers: ['ctrl'], description: 'Panic mode', category: 'security' },
  { id: 'lock', key: 'l', modifiers: ['ctrl', 'shift'], description: 'Lock application', category: 'security' },
  
  // General
  { id: 'help', key: '?', modifiers: ['shift'], description: 'Show keyboard shortcuts', category: 'general' },
  { id: 'escape', key: 'Escape', modifiers: [], description: 'Close/Cancel', category: 'general' },
  { id: 'refresh', key: 'F5', modifiers: [], description: 'Refresh', category: 'general' },
];

const CATEGORY_TITLES: Record<KeyboardShortcutCategory, string> = {
  'navigation': 'Navigation',
  'compose': 'Compose',
  'email-actions': 'Email Actions',
  'search': 'Search',
  'folder': 'Folder Navigation',
  'security': 'Security',
  'general': 'General',
};

export const useKeyboardShortcuts = (
  onAction?: (actionId: string) => void
): UseKeyboardShortcutsReturn => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);

  // Initialize default shortcuts with empty actions
  useEffect(() => {
    const initialShortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS.map(shortcut => ({
      ...shortcut,
      action: () => onAction?.(shortcut.id),
      enabled: true,
    }));
    setShortcuts(initialShortcuts);
  }, [onAction]);

  // Register a new shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const existing = prev.findIndex(s => s.id === shortcut.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = shortcut;
        return updated;
      }
      return [...prev, shortcut];
    });
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  // Check if a keyboard event matches a shortcut
  const matchesShortcut = useCallback((event: globalThis.KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    const key = event.key;
    const ctrl = event.ctrlKey || event.metaKey;
    const alt = event.altKey;
    const shift = event.shiftKey;

    // Check if key matches
    if (key.toLowerCase() !== shortcut.key.toLowerCase() && key !== shortcut.key) {
      return false;
    }

    // Check modifiers
    const hasCtrl = shortcut.modifiers.includes('ctrl') || shortcut.modifiers.includes('meta');
    const hasAlt = shortcut.modifiers.includes('alt');
    const hasShift = shortcut.modifiers.includes('shift');

    return ctrl === hasCtrl && alt === hasAlt && shift === hasShift;
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Update pressed keys
      setPressedKeys(prev => new Set(prev).add(event.key));

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow only specific shortcuts in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(
        shortcut => shortcut.enabled !== false && matchesShortcut(event, shortcut)
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, shortcuts, matchesShortcut]);

  // Group shortcuts by category
  const shortcutGroups = useMemo(() => {
    const groups: Record<KeyboardShortcutCategory, KeyboardShortcut[]> = {
      'navigation': [],
      'compose': [],
      'email-actions': [],
      'search': [],
      'folder': [],
      'security': [],
      'general': [],
    };

    shortcuts.forEach(shortcut => {
      groups[shortcut.category].push(shortcut);
    });

    return Object.entries(groups)
      .filter(([, groupShortcuts]) => groupShortcuts.length > 0)
      .map(([category, groupShortcuts]) => ({
        category: category as KeyboardShortcutCategory,
        title: CATEGORY_TITLES[category as KeyboardShortcutCategory],
        shortcuts: groupShortcuts,
      }));
  }, [shortcuts]);

  return {
    shortcuts,
    shortcutGroups,
    isEnabled,
    setEnabled: setIsEnabled,
    registerShortcut,
    unregisterShortcut,
    pressedKeys,
    showHelp,
    setShowHelp,
  };
};