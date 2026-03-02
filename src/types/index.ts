export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  encrypted: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  phantomAlias?: string;
  selfDestruct?: Date;
  folder: Folder;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  count: number;
  icon: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface SecuritySettings {
  encryptionLevel: 'standard' | 'high' | 'maximum';
  twoFactorEnabled: boolean;
  phantomAliasesEnabled: boolean;
  selfDestructEnabled: boolean;
  panicModeEnabled: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ComposeEmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments: File[];
  phantomAlias?: string;
  selfDestruct?: Date;
  encrypt: boolean;
}

export interface SortOptions {
  field: 'date' | 'from' | 'subject';
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  encrypted?: boolean;
  hasAttachments?: boolean;
  unread?: boolean;
  starred?: boolean;
  hasPhantomAlias?: boolean;
  hasSelfDestruct?: boolean;
}
