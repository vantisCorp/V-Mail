/**
 * Type definitions for Vantis Mail
 */

// Configuration types
export interface AppConfig {
  NOTIFICATION_DURATION: number;
  PANIC_MODE_DURATION: number;
  DEBOUNCE_DELAY: number;
  MAX_ATTACHMENT_SIZE: number;
  ALLOWED_ATTACHMENT_TYPES: string[];
}

// State types
export interface AppState {
  currentFolder: string;
  selectedEmail: string | null;
  isComposeModalOpen: boolean;
  isPhantomModalOpen: boolean;
  notifications: Notification[];
  emails: Email[];
  aliases: string[];
}

// Email types
export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  folder: string;
  encrypted: boolean;
  selfDestruct?: string;
  alias?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  duration?: number;
}

// Modal types
export interface ModalOptions {
  title: string;
  content: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

// DOM Element types
export interface DOMElements {
  composeBtn: HTMLElement | null;
  composeModal: HTMLElement | null;
  closeCompose: HTMLElement | null;
  phantomModal: HTMLElement | null;
  closePhantom: HTMLElement | null;
  panicBtn: HTMLElement | null;
  navItems: NodeListOf<HTMLElement>;
  emailItems: NodeListOf<HTMLElement>;
  composeTo: HTMLInputElement | null;
  composeCc: HTMLInputElement | null;
  composeBcc: HTMLInputElement | null;
  composeSubject: HTMLInputElement | null;
  composeBody: HTMLTextAreaElement | null;
  optionButtons: NodeListOf<HTMLElement>;
  toolbarButtons: NodeListOf<HTMLElement>;
}

// Event types
export interface KeyboardEvent extends globalThis.KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Alias types
export interface Alias {
  id: string;
  email: string;
  domain: string;
  createdAt: Date;
  active: boolean;
}

// Self-destruct options
export type SelfDestructTime = '15 minut' | '1 godzinę' | '24 godziny' | '7 dni';

// Folder types
export type Folder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'phantom' | 'spam' | 'trash';