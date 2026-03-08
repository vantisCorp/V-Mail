// Keyboard Shortcuts Types

export type KeyboardShortcutCategory =
  | 'navigation'
  | 'compose'
  | 'email-actions'
  | 'search'
  | 'folder'
  | 'security'
  | 'general';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: KeyboardShortcutCategory;
  action: () => void;
  enabled?: boolean;
}

export interface KeyboardShortcutGroup {
  category: KeyboardShortcutCategory;
  title: string;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcutConfig {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
}

export type KeyboardEvent = 'keydown' | 'keyup' | 'keypress';

export interface KeyboardShortcutState {
  pressedKeys: Set<string>;
  lastKeyPressed: string | null;
  shortcutTriggered: string | null;
}
