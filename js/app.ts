// ============================================
// VANTIS MAIL - Professional Email Client
// TypeScript Application Logic
// ============================================

'use strict';

import type {
  AppConfig,
  AppState,
  Notification,
  ModalOptions,
  DOMElements,
  SelfDestructTime,
  Folder,
} from './types';

/**
 * Vantis Mail Application
 * @namespace VantisMail
 */
const VantisMail = (function () {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG: AppConfig = {
    NOTIFICATION_DURATION: 3000,
    PANIC_MODE_DURATION: 500,
    DEBOUNCE_DELAY: 300,
    MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
    ALLOWED_ATTACHMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ],
  };

  // ============================================
  // State Management
  // ============================================

  const state: AppState = {
    currentFolder: 'inbox',
    selectedEmail: null,
    isComposeModalOpen: false,
    isPhantomModalOpen: false,
    notifications: [],
    emails: [],
    aliases: [],
  };

  // ============================================
  // DOM Elements Cache
  // ============================================

  const elements: Partial<DOMElements> = {};

  /**
   * Cache DOM elements for better performance
   */
  function cacheElements(): void {
    elements.composeBtn = document.getElementById('composeBtn');
    elements.composeModal = document.getElementById('composeModal');
    elements.closeCompose = document.getElementById('closeCompose');
    elements.phantomModal = document.getElementById('phantomModal');
    elements.closePhantom = document.getElementById('closePhantom');
    elements.panicBtn = document.getElementById('panicBtn');
    elements.navItems = document.querySelectorAll('.nav-item');
    elements.emailItems = document.querySelectorAll('.email-item');
    elements.composeTo = document.getElementById('composeTo') as HTMLInputElement;
    elements.composeCc = document.getElementById('composeCc') as HTMLInputElement;
    elements.composeBcc = document.getElementById('composeBcc') as HTMLInputElement;
    elements.composeSubject = document.getElementById('composeSubject') as HTMLInputElement;
    elements.composeBody = document.getElementById('composeBody') as HTMLTextAreaElement;
    elements.optionButtons = document.querySelectorAll('.option-btn');
    elements.toolbarButtons = document.querySelectorAll('.toolbar-btn');
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Debounce function to limit execution rate
   * @param func - Function to debounce
   * @param wait - Wait time in milliseconds
   * @returns Debounced function
   */
  function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function executedFunction(...args: Parameters<T>): void {
      const later = () => {
        clearTimeout(timeout!);
        func(...args);
      };
      clearTimeout(timeout!);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  function sanitizeHTML(str: string): string {
    if (typeof str !== 'string') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  /**
   * Escape special HTML characters
   * @param str - String to escape
   * @returns Escaped string
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function escapeHTML(str: string): string {
    if (typeof str !== 'string') return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns True if valid
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function validateEmail(email: string): boolean {
    if (typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  /**
   * Validate required field
   * @param value - Value to validate
   * @returns True if valid
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function validateRequired(value: unknown): boolean {
    return value !== null && value !== undefined && typeof value === 'string' && value.trim().length > 0;
  }

  // ============================================
  // Notification System
  // ============================================

  /**
   * Show notification
   * @param type - Notification type
   * @param title - Notification title
   * @param message - Notification message
   * @param duration - Duration in milliseconds
   */
  function showNotification(
    type: Notification['type'],
    title: string,
    message: string,
    duration: number = CONFIG.NOTIFICATION_DURATION
  ): void {
    const notification: Notification = {
      id: `notification-${Date.now()}`,
      type,
      title,
      message,
      duration,
    };

    state.notifications.push(notification);

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${type}`;
    notificationEl.id = notification.id;
    notificationEl.innerHTML = `
      <div class="notification-header">
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${sanitizeHTML(title)}</span>
      </div>
      <div class="notification-body">
        ${sanitizeHTML(message)}
      </div>
    `;

    document.body.appendChild(notificationEl);

    setTimeout(() => {
      notificationEl.remove();
      state.notifications = state.notifications.filter((n) => n.id !== notification.id);
    }, duration);
  }

  /**
   * Get notification icon based on type
   * @param type - Notification type
   * @returns Icon class name
   */
  function getNotificationIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      danger: 'times-circle',
    };
    return icons[type];
  }

  /**
   * Show success notification
   * @param message - Success message
   */
  function showSuccess(message: string): void {
    showNotification('success', 'Sukces', message);
  }

  /**
   * Show error notification
   * @param message - Error message
   */
  function showError(message: string): void {
    showNotification('danger', 'Błąd', message);
  }

  /**
   * Show warning notification
   * @param message - Warning message
   */
  function showWarning(message: string): void {
    showNotification('warning', 'Ostrzeżenie', message);
  }

  /**
   * Show info notification
   * @param message - Info message
   */
  function showInfo(message: string): void {
    showNotification('info', 'Informacja', message);
  }

  // ============================================
  // Modal Management
  // ============================================

  /**
   * Show custom modal
   * @param options - Modal options
   */
  function showModal(options: ModalOptions): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal ${options.danger ? 'danger' : ''}">
        <div class="modal-header">
          <h3>${sanitizeHTML(options.title)}</h3>
        </div>
        <div class="modal-body">
          ${sanitizeHTML(options.content)}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="modalCancel">${options.cancelText || 'Anuluj'}</button>
          <button class="btn-primary ${options.danger ? 'danger' : ''}" id="modalConfirm">${options.confirmText || 'Potwierdź'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('#modalCancel') as HTMLButtonElement;
    const confirmBtn = modal.querySelector('#modalConfirm') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      if (options.onCancel) options.onCancel();
    });

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      if (options.onConfirm) options.onConfirm();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        if (options.onCancel) options.onCancel();
      }
    });
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle compose button click
   */
  function handleComposeClick(): void {
    try {
      if (elements.composeModal) {
        elements.composeModal.classList.add('active');
        if (elements.composeTo) {
          elements.composeTo.focus();
        }
      }
    } catch (error) {
      showError('Nie udało się otworzyć okna komponowania');
      console.error('[VantisMail] Failed to open compose modal:', error);
    }
  }

  /**
   * Handle folder click
   * @param folder - Folder name
   */
  function handleFolderClick(folder: Folder): void {
    try {
      // Update active state
      if (elements.navItems) {
        elements.navItems.forEach((item) => item.classList.remove('active'));
      }
      const activeItem = document.querySelector(`[data-folder="${folder}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }

      // Handle folder-specific actions
      if (folder === 'phantom') {
        if (elements.phantomModal) {
          elements.phantomModal.classList.add('active');
        }
        return;
      }

      state.currentFolder = folder;
      updateEmailList(folder);
    } catch (error) {
      showError('Nie udało się zmienić folderu');
      console.error('[VantisMail] Failed to handle folder click:', error);
    }
  }

  /**
   * Handle email click
   * @param emailElement - Email element
   * @param emailId - Email ID
   */
  function handleEmailClick(emailElement: HTMLElement, emailId: string): void {
    try {
      // Update selected state
      if (elements.emailItems) {
        elements.emailItems.forEach((item) => item.classList.remove('selected'));
      }
      emailElement.classList.add('selected');
      emailElement.classList.remove('unread');

      // Update badge count
      const badge = emailElement.querySelector('.badge');
      if (badge) {
        const count = parseInt(badge.textContent || '0', 10);
        if (count > 0) {
          badge.textContent = (count - 1).toString();
        }
      }

      state.selectedEmail = emailId;
      showInfo(`Wybrano wiadomość: ${emailId}`);
    } catch (error) {
      showError('Nie udało się wybrać wiadomości');
      console.error('[VantisMail] Failed to handle email click:', error);
    }
  }

  /**
   * Handle panic button click
   */
  function handlePanicButton(): void {
    try {
      showModal({
        title: 'Potwierdzenie',
        content: `
          <p>Czy na pewno chcesz aktywować Panic Button?</p>
          <p>Ta akcja spowoduje:</p>
          <ul>
            <li>Natychmiastowe wylogowanie</li>
            <li>Wyczyszczenie pamięci RAM</li>
            <li>Usunięcie lokalnej bazy danych</li>
          </ul>
        `,
        onConfirm: () => {
          activatePanicMode();
        },
        danger: true,
      });
    } catch (error) {
      showError('Nie udało się aktywować Panic Button');
      console.error('[VantisMail] Failed to handle panic button:', error);
    }
  }

  /**
   * Activate panic mode
   */
  function activatePanicMode(): void {
    try {
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all notifications
      state.notifications.forEach((n) => {
        const el = document.getElementById(n.id);
        if (el) el.remove();
      });
      state.notifications = [];

      // Show success message
      showSuccess('Panic Button aktywowany! Wszystkie dane zostały wyczyszczone.');

      // Redirect to login page (in real app)
      setTimeout(() => {
        window.location.reload();
      }, CONFIG.PANIC_MODE_DURATION);
    } catch (error) {
      showError('Nie udało się aktywować Panic Button');
      console.error('[VantisMail] Failed to activate panic mode:', error);
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param event - Keyboard event
   */
  function handleKeyboardShortcuts(event: KeyboardEvent): void {
    try {
      // Compose: C
      if (event.key === 'c' && !event.ctrlKey && !event.metaKey) {
        handleComposeClick();
      }

      // Close modals: Escape
      if (event.key === 'Escape') {
        if (elements.composeModal) {
          elements.composeModal.classList.remove('active');
        }
        if (elements.phantomModal) {
          elements.phantomModal.classList.remove('active');
        }
      }

      // Panic: Ctrl/Cmd + P
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        handlePanicButton();
      }
    } catch (error) {
      console.error('[VantisMail] Failed to handle keyboard shortcut:', error);
    }
  }

  // ============================================
  // UI Functions
  // ============================================

  /**
   * Update email list
   * @param folder - Folder name
   */
  function updateEmailList(folder: Folder): void {
    try {
      // In a real application, this would fetch emails from the server
      console.log('[VantisMail] Loading emails for folder:', folder);

      // Simulate loading different email lists based on folder
      const emailList = document.getElementById('emailList');
      if (emailList) {
        emailList.style.opacity = '0.5';

        setTimeout(() => {
          emailList.style.opacity = '1';
        }, 300);
      }
    } catch (error) {
      showError('Nie udało się załadować wiadomości');
      console.error('[VantisMail] Failed to update email list:', error);
    }
  }

  /**
   * Handle self-destruct options
   * @param currentSubject - Current subject
   */
  function showSelfDestructOptions(currentSubject: string): void {
    const timeOptions: SelfDestructTime[] = ['15 minut', '1 godzinę', '24 godziny', '7 dni'];

    // Create custom modal for self-destruct options
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal self-destruct-modal">
        <div class="modal-header">
          <h3><i class="fas fa-clock"></i> Czas samoniszczenia</h3>
        </div>
        <div class="modal-body">
          <p>Wybierz czas samoniszczenia wiadomości:</p>
          <div class="time-options">
            ${timeOptions.map((time) => `
              <button class="time-option-btn" data-time="${time}">
                <i class="fas fa-clock"></i>
                ${time}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="selfDestructCancel">Anuluj</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const cancelBtn = modal.querySelector('#selfDestructCancel') as HTMLButtonElement;
    const timeButtons = modal.querySelectorAll('.time-option-btn');

    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    timeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const time = btn.getAttribute('data-time') as SelfDestructTime;
        if (elements.composeSubject) {
          elements.composeSubject.value = `[Samoniszczenie: ${time}] ${currentSubject}`;
          showSuccess(`Tryb samoniszczenia włączony: ${time}`);
        }
        modal.remove();
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show alias selector
   */
  function showAliasSelector(): void {
    try {
      const aliases = ['zakupy.xyz@vantis.io', 'newsletter.alias@vantis.io', 'social.media@vantis.io'];

      // Create custom modal for alias selection
      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
        <div class="modal alias-selector-modal">
          <div class="modal-header">
            <h3><i class="fas fa-user-secret"></i> Wybierz alias</h3>
          </div>
          <div class="modal-body">
            <p>Wybierz alias do użycia:</p>
            <div class="alias-options">
              ${aliases.map((alias) => `
                <button class="alias-option-btn" data-alias="${alias}">
                  <i class="fas fa-envelope"></i>
                  ${alias}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="aliasCancel">Anuluj</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add event listeners
      const cancelBtn = modal.querySelector('#aliasCancel') as HTMLButtonElement;
      const aliasButtons = modal.querySelectorAll('.alias-option-btn');

      cancelBtn.addEventListener('click', () => {
        modal.remove();
      });

      aliasButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const alias = btn.getAttribute('data-alias');
          if (elements.composeTo && alias) {
            const currentTo = elements.composeTo.value;
            elements.composeTo.value = alias + (currentTo ? `, ${currentTo}` : '');
            showSuccess(`Alias wybrany: ${alias}`);
          }
          modal.remove();
        });
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    } catch (error) {
      showError('Nie udało się wybrać aliasu');
      console.error('[VantisMail] Failed to show alias selector:', error);
    }
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize event listeners
   */
  function initializeEventListeners(): void {
    // Compose Modal
    if (elements.composeBtn) {
      elements.composeBtn.addEventListener('click', handleComposeClick);
    }
    if (elements.closeCompose) {
      elements.closeCompose.addEventListener('click', () => {
        if (elements.composeModal) {
          elements.composeModal.classList.remove('active');
        }
      });
    }
    if (elements.composeModal) {
      const composeModal = elements.composeModal;
      composeModal.addEventListener('click', (e) => {
        if (e.target === composeModal) {
          composeModal.classList.remove('active');
        }
      });
    }

    // Phantom Modal
    if (elements.navItems) {
      elements.navItems.forEach((item) => {
        item.addEventListener('click', function () {
          const folder = this.getAttribute('data-folder') as Folder;
          if (folder) {
            handleFolderClick(folder);
          }
        });
      });
    }

    if (elements.closePhantom) {
      elements.closePhantom.addEventListener('click', () => {
        if (elements.phantomModal) {
          elements.phantomModal.classList.remove('active');
        }
      });
    }
    if (elements.phantomModal) {
      const phantomModal = elements.phantomModal;
      phantomModal.addEventListener('click', (e) => {
        if (e.target === phantomModal) {
          phantomModal.classList.remove('active');
        }
      });
    }

    // Panic Button
    if (elements.panicBtn) {
      elements.panicBtn.addEventListener('click', handlePanicButton);
    }

    // Email Items
    if (elements.emailItems) {
      elements.emailItems.forEach((item) => {
        item.addEventListener('click', function () {
          const emailId = this.getAttribute('data-id');
          if (emailId) {
            handleEmailClick(this, emailId);
          }
        });
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Option Buttons
    if (elements.optionButtons) {
      elements.optionButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          const action = this.getAttribute('data-action');
          if (action === 'self-destruct' && elements.composeSubject) {
            showSelfDestructOptions(elements.composeSubject.value);
          } else if (action === 'alias') {
            showAliasSelector();
          }
        });
      });
    }

    // Toolbar Buttons
    if (elements.toolbarButtons) {
      elements.toolbarButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          const action = this.getAttribute('data-action');
          showInfo(`Akcja: ${action}`);
        });
      });
    }
  }

  /**
   * Initialize application
   */
  function initialize(): void {
    try {
      console.log('[VantisMail] Initializing Vantis Mail...');
      cacheElements();
      initializeEventListeners();
      console.log('[VantisMail] Vantis Mail initialized successfully');
    } catch (error) {
      console.error('[VantisMail] Failed to initialize:', error);
    }
  }

  // ============================================
  // Public API
  // ============================================

  return {
    initialize,
    state,
    CONFIG,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showModal,
    debounce,
    escapeHTML,
    validateEmail,
    validateRequired,
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    VantisMail.initialize();
  });
} else {
  VantisMail.initialize();
}

// Export for TypeScript
export default VantisMail;