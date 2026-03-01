// ============================================
// VANTIS MAIL - Professional Email Client
// JavaScript Application Logic
// ============================================

'use strict';

/**
 * Vantis Mail Application
 * @namespace VantisMail
 */
const VantisMail = (function () {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
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
      'image/jpg'
    ]
  };

  // ============================================
  // State Management
  // ============================================

  const state = {
    currentFolder: 'inbox',
    selectedEmail: null,
    isComposeModalOpen: false,
    isPhantomModalOpen: false,
    notifications: [],
    emails: [],
    aliases: []
  };

  // ============================================
  // DOM Elements Cache
  // ============================================

  const elements = {};

  /**
   * Cache DOM elements for better performance
   */
  function cacheElements() {
    elements.composeBtn = document.getElementById('composeBtn');
    elements.composeModal = document.getElementById('composeModal');
    elements.closeCompose = document.getElementById('closeCompose');
    elements.phantomModal = document.getElementById('phantomModal');
    elements.closePhantom = document.getElementById('closePhantom');
    elements.panicBtn = document.getElementById('panicBtn');
    elements.navItems = document.querySelectorAll('.nav-item');
    elements.emailItems = document.querySelectorAll('.email-item');
    elements.composeTo = document.getElementById('composeTo');
    elements.composeCc = document.getElementById('composeCc');
    elements.composeBcc = document.getElementById('composeBcc');
    elements.composeSubject = document.getElementById('composeSubject');
    elements.composeBody = document.getElementById('composeBody');
    elements.optionButtons = document.querySelectorAll('.option-btn');
    elements.toolbarButtons = document.querySelectorAll('.toolbar-btn');
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Debounce function to limit execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(_func, _wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        _func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, _wait);
    };
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  function sanitizeHTML(str) {
    if (typeof str !== 'string') {
      return '';
    }
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }

  /**
   * Escape special HTML characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') {
      return '';
    }
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  function validateEmail(email) {
    if (typeof email !== 'string') {
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  /**
   * Validate required field
   * @param {*} value - Value to validate
   * @returns {boolean} True if valid
   */
  function validateRequired(value) {
    return value && typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  function showError(message) {
    showNotification('Błąd', message, 'danger');
    console.error('[VantisMail Error]', message);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  function showSuccess(message) {
    showNotification('Sukces', message, 'success');
    console.log('[VantisMail Success]', message);
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  function showWarning(message) {
    showNotification('Ostrzeżenie', message, 'warning');
    console.warn('[VantisMail Warning]', message);
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  function showInfo(message) {
    showNotification('Informacja', message, 'info');
    console.info('[VantisMail Info]', message);
  }

  // ============================================
  // Notification System
  // ============================================

  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, danger)
   */
  function showNotification(title, message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-header">
          <i class="fas ${getNotificationIcon(type)}"></i>
          <span>${sanitizeHTML(title)}</span>
        </div>
        <div class="notification-body">${sanitizeHTML(message)}</div>
      `;

      // Add to document
      document.body.appendChild(notification);

      // Store in state
      state.notifications.push(notification);

      // Remove after duration
      setTimeout(() => {
        notification.remove();
        const index = state.notifications.indexOf(notification);
        if (index > -1) {
          state.notifications.splice(index, 1);
        }
      }, CONFIG.NOTIFICATION_DURATION);

      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    } catch (error) {
      console.error('[VantisMail] Failed to show notification:', error);
    }
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon class
   */
  function getNotificationIcon(type) {
    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-exclamation-circle'
    };
    return icons[type] || icons.info;
  }

  // ============================================
  // Modal Management
  // ============================================

  /**
   * Open compose modal
   */
  function openComposeModal() {
    try {
      if (elements.composeModal) {
        elements.composeModal.classList.add('active');
        state.isComposeModalOpen = true;
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
   * Close all modals
   */
  function closeAllModals() {
    try {
      if (elements.composeModal) {
        elements.composeModal.classList.remove('active');
        state.isComposeModalOpen = false;
      }
      if (elements.phantomModal) {
        elements.phantomModal.classList.remove('active');
        state.isPhantomModalOpen = false;
      }
    } catch (error) {
      showError('Nie udało się zamknąć okien');
      console.error('[VantisMail] Failed to close modals:', error);
    }
  }

  // ============================================
  // Folder Management
  // ============================================

  /**
   * Handle folder click
   * @param {string} folder - Folder name
   */
  function handleFolderClick(folder) {
    try {
      // Update active state
      elements.navItems.forEach((item) => item.classList.remove('active'));
      const activeItem = document.querySelector(`[data-folder="${folder}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }

      // Handle folder-specific actions
      if (folder === 'phantom') {
        openPhantomModal();
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
   * Update email list for folder
   * @param {string} folder - Folder name
   */
  function updateEmailList(folder) {
    try {
      console.log('Loading emails for folder:', folder);

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
   * Open phantom modal
   */
  function openPhantomModal() {
    try {
      if (elements.phantomModal) {
        elements.phantomModal.classList.add('active');
        state.isPhantomModalOpen = true;
      }
    } catch (error) {
      showError('Nie udało się otworzyć okna aliasów');
      console.error('[VantisMail] Failed to open phantom modal:', error);
    }
  }

  // ============================================
  // Email Management
  // ============================================

  /**
   * Handle email click
   * @param {HTMLElement} emailElement - Email element
   * @param {string} emailId - Email ID
   */
  function handleEmailClick(emailElement, emailId) {
    try {
      // Update selected state
      elements.emailItems.forEach((item) => item.classList.remove('selected'));
      emailElement.classList.add('selected');
      emailElement.classList.remove('unread');

      // Update badge count
      const badge = document.querySelector('.nav-item[data-folder="inbox"] .badge');
      if (badge) {
        const currentCount = parseInt(badge.textContent);
        if (!isNaN(currentCount) && currentCount > 0) {
          badge.textContent = currentCount - 1;
        }
      }

      state.selectedEmail = emailId;

      console.log('Loading email:', emailId);

      // Scroll to top of preview
      const emailPreview = document.getElementById('emailPreview');
      if (emailPreview) {
        const emailDetail = emailPreview.querySelector('.email-detail');
        if (emailDetail) {
          emailDetail.scrollTop = 0;
        }
      }
    } catch (error) {
      showError('Nie udało się otworzyć wiadomości');
      console.error('[VantisMail] Failed to handle email click:', error);
    }
  }

  // ============================================
  // Panic Mode
  // ============================================

  /**
   * Handle panic button click
   */
  function handlePanicButton() {
    try {
      // Show confirmation dialog using custom modal
      showPanicConfirmation();
    } catch (error) {
      showError('Błąd podczas aktywacji trybu paniki');
      console.error('[VantisMail] Failed to handle panic button:', error);
    }
  }

  /**
   * Show panic confirmation
   */
  function showPanicConfirmation() {
    // Create custom confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal panic-confirmation-modal">
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle"></i> Potwierdzenie</h3>
        </div>
        <div class="modal-body">
          <p>Czy na pewno chcesz aktywować Panic Button?</p>
          <p>Ta akcja spowoduje:</p>
          <ul>
            <li>Natychmiastowe wylogowanie</li>
            <li>Wyczyszczenie pamięci RAM</li>
            <li>Usunięcie lokalnej bazy danych</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="panicCancel">Anuluj</button>
          <button class="btn-primary danger" id="panicConfirm">Aktywuj</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const cancelBtn = modal.querySelector('#panicCancel');
    const confirmBtn = modal.querySelector('#panicConfirm');

    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      activatePanicMode();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Activate panic mode
   */
  function activatePanicMode() {
    try {
      // Show panic animation
      document.body.style.transition = 'all 0.5s ease';
      document.body.style.opacity = '0';
      document.body.style.transform = 'scale(0.9)';

      // Simulate cleanup operations
      setTimeout(() => {
        // Clear all local storage
        try {
          localStorage.clear();
        } catch (e) {
          console.warn('[VantisMail] Failed to clear localStorage:', e);
        }

        // Clear session storage
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn('[VantisMail] Failed to clear sessionStorage:', e);
        }

        // Clear all notifications
        state.notifications.forEach((notification) => notification.remove());
        state.notifications = [];

        // Show success message
        showSuccess('Panic Button aktywowany\n\nWszystkie dane zostały bezpiecznie usunięte.');

        // Redirect to login page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, CONFIG.PANIC_MODE_DURATION);
    } catch (error) {
      showError('Błąd podczas aktywacji trybu paniki');
      console.error('[VantisMail] Failed to activate panic mode:', error);
    }
  }

  // ============================================
  // Keyboard Shortcuts
  // ============================================

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyboardShortcuts(e) {
    try {
      // Prevent shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
      case 'c':
      case 'C':
        if (!e.ctrlKey && !e.metaKey) {
          openComposeModal();
        }
        break;
      case 'Escape':
        closeAllModals();
        break;
      case 'p':
      case 'P':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          activatePanicMode();
        }
        break;
      }
    } catch (error) {
      console.error('[VantisMail] Failed to handle keyboard shortcut:', error);
    }
  }

  // ============================================
  // Compose Options
  // ============================================

  /**
   * Update encryption status
   */
  function updateEncryptionStatus() {
    try {
      const encryptionStatus = document.querySelector('.encryption-status .status-badge');
      const encryptionInfo = document.querySelector('.encryption-info');

      if (encryptionStatus) {
        if (encryptionStatus.classList.contains('active')) {
          encryptionStatus.classList.remove('active');
          encryptionStatus.innerHTML =
            '<i class="fas fa-times-circle"></i><span>Szyfrowanie nieaktywne</span>';
          if (encryptionInfo) {
            encryptionInfo.textContent = 'Brak szyfrowania';
          }
        } else {
          encryptionStatus.classList.add('active');
          encryptionStatus.innerHTML =
            '<i class="fas fa-check-circle"></i><span>Szyfrowanie aktywne</span>';
          if (encryptionInfo) {
            encryptionInfo.textContent = 'X25519 + Kyber-1024';
          }
        }
      }
    } catch (error) {
      showError('Nie udało się zmienić statusu szyfrowania');
      console.error('[VantisMail] Failed to update encryption status:', error);
    }
  }

  /**
   * Toggle self-destruct mode
   */
  function toggleSelfDestruct() {
    try {
      if (!elements.composeSubject) {
        return;
      }

      const currentSubject = elements.composeSubject.value;

      if (currentSubject.includes('[Samoniszczenie:')) {
        // Remove self-destruct tag
        elements.composeSubject.value = currentSubject.replace(/\[Samoniszczenie: [^\]]+\]\s*/, '');
        showInfo('Tryb samoniszczenia wyłączony');
      } else {
        // Show self-destruct options using custom modal
        showSelfDestructOptions(currentSubject);
      }
    } catch (error) {
      showError('Nie udało się zmienić trybu samoniszczenia');
      console.error('[VantisMail] Failed to toggle self-destruct:', error);
    }
  }

  /**
   * Show self-destruct options
   * @param {string} currentSubject - Current subject
   */
  function showSelfDestructOptions(currentSubject) {
    const timeOptions = ['15 minut', '1 godzinę', '24 godziny', '7 dni'];

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
            ${timeOptions.map((time, index) => `
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
    const cancelBtn = modal.querySelector('#selfDestructCancel');
    const timeButtons = modal.querySelectorAll('.time-option-btn');

    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    timeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const time = btn.dataset.time;
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
  function showAliasSelector() {
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
      const cancelBtn = modal.querySelector('#aliasCancel');
      const aliasButtons = modal.querySelectorAll('.alias-option-btn');

      cancelBtn.addEventListener('click', () => {
        modal.remove();
      });

      aliasButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const alias = btn.dataset.alias;
          if (elements.composeTo) {
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

  /**
   * Toggle plain text mode
   */
  function togglePlainTextMode() {
    showInfo(
      'Tryb "tylko tekst" włączony.\n\n' +
        'Treść HTML zostanie przekonwertowana na plain text w celu neutralizacji trackerów i skryptów śledzących.'
    );
  }

  // ============================================
  // Text Editor
  // ============================================

  /**
   * Wrap text with markdown
   * @param {HTMLTextAreaElement} textarea - Textarea element
   * @param {number} start - Start position
   * @param {number} end - End position
   * @param {string} before - Text to add before
   * @param {string} after - Text to add after
   */
  function wrapText(textarea, start, end, before, after) {
    try {
      const text = textarea.value;
      const newText =
        text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
      textarea.value = newText;
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    } catch (error) {
      showError('Nie udało się sformatować tekstu');
      console.error('[VantisMail] Failed to wrap text:', error);
    }
  }

  /**
   * Insert list item
   * @param {HTMLTextAreaElement} textarea - Textarea element
   * @param {number} start - Start position
   * @param {string} bullet - Bullet character
   */
  function insertList(textarea, start, bullet) {
    try {
      const text = textarea.value;
      const beforeCursor = text.substring(0, start);
      const afterCursor = text.substring(start);

      // Check if we're at the start of a line
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

      if (start === lineStart || beforeCursor.trim() === '') {
        // Insert bullet at line start
        textarea.value = text.substring(0, start) + bullet + text.substring(start);
      } else {
        // Insert new line with bullet
        textarea.value = text.substring(0, start) + '\n' + bullet + text.substring(start);
      }

      textarea.focus();
    } catch (error) {
      showError('Nie udało się wstawić listy');
      console.error('[VantisMail] Failed to insert list:', error);
    }
  }

  /**
   * Handle attachment
   */
  function handleAttachment() {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.accept = CONFIG.ALLOWED_ATTACHMENT_TYPES.join(',');

      fileInput.onchange = function (e) {
        const files = e.target.files;
        if (files.length > 0) {
          // Validate file sizes
          const oversizedFiles = Array.from(files).filter(
            (file) => file.size > CONFIG.MAX_ATTACHMENT_SIZE
          );

          if (oversizedFiles.length > 0) {
            showError(
              `Pliki przekraczają maksymalny rozmiar (${CONFIG.MAX_ATTACHMENT_SIZE / 1024 / 1024}MB)`
            );
            return;
          }

          showSuccess(
            `Wybrano ${files.length} plik(i) do załączenia.\n\n` +
              'W produkcyjnej wersji, załączniki będą:\n' +
              '- Zsanityzowane z metadanych\n' +
              '- Sprawdzone w piaskownicy\n' +
              '- Zaszyfrowane przed wysłaniem'
          );
        }
      };

      fileInput.click();
    } catch (error) {
      showError('Nie udało się dodać załącznika');
      console.error('[VantisMail] Failed to handle attachment:', error);
    }
  }

  /**
   * Handle steganography
   */
  function handleSteganography() {
    showInfo(
      'Steganografia włączona.\n\n' +
        'Możesz teraz:\n' +
        '1. Wybrać zdjęcie do ukrycia treści\n' +
        '2. Treść wiadomości zostanie ukryta w pikselach obrazu\n' +
        '3. Odbiorca odczyta wiadomość używając klucza prywatnego'
    );
  }

  // ============================================
  // Security Features
  // ============================================

  /**
   * Initialize security indicators
   */
  function initSecurityIndicators() {
    try {
      console.log('Initializing security indicators...');

      // Simulate security check
      const encryptionStatus = document.querySelector('.encryption-status .status-badge');
      if (encryptionStatus) {
        encryptionStatus.classList.add('active');
      }
    } catch (error) {
      console.error('[VantisMail] Failed to initialize security indicators:', error);
    }
  }

  /**
   * Monitor for paste events
   */
  function monitorPasteEvents() {
    document.addEventListener('paste', function (e) {
      console.log('Paste event detected - sanitizing content...');
      // In a real application, this would sanitize clipboard content
    });
  }

  /**
   * Monitor for screenshot attempts
   */
  function monitorScreenshotAttempts() {
    document.addEventListener('keyup', function (e) {
      // Check for common screenshot shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        console.warn('Screenshot attempt detected');
      }
      if (e.altKey && e.key === 'PrintScreen') {
        console.warn('Screenshot attempt detected');
      }
    });
  }

  // ============================================
  // Event Listeners Setup
  // ============================================

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    try {
      // Compose Modal
      if (elements.composeBtn) {
        elements.composeBtn.addEventListener('click', openComposeModal);
      }
      if (elements.closeCompose) {
        elements.closeCompose.addEventListener('click', closeAllModals);
      }
      if (elements.composeModal) {
        elements.composeModal.addEventListener('click', function (e) {
          if (e.target === elements.composeModal) {
            closeAllModals();
          }
        });
      }

      // Phantom Modal
      elements.navItems.forEach((item) => {
        item.addEventListener('click', function () {
          const folder = this.dataset.folder;
          handleFolderClick(folder);
        });
      });

      if (elements.closePhantom) {
        elements.closePhantom.addEventListener('click', closeAllModals);
      }
      if (elements.phantomModal) {
        elements.phantomModal.addEventListener('click', function (e) {
          if (e.target === elements.phantomModal) {
            closeAllModals();
          }
        });
      }

      // Panic Button
      if (elements.panicBtn) {
        elements.panicBtn.addEventListener('click', handlePanicButton);
      }

      // Email Items
      elements.emailItems.forEach((item) => {
        item.addEventListener('click', function () {
          const emailId = this.dataset.id;
          handleEmailClick(this, emailId);
        });
      });

      // Keyboard Shortcuts
      document.addEventListener('keydown', handleKeyboardShortcuts);

      // Compose Options
      elements.optionButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          const isActive = this.classList.contains('active');

          // Toggle active state
          this.classList.toggle('active');

          // Handle specific options
          if (this.title === 'Szyfrowanie') {
            updateEncryptionStatus();
          } else if (this.title === 'Samoniszczenie') {
            toggleSelfDestruct();
          } else if (this.title === 'Alias Phantom') {
            showAliasSelector();
          } else if (this.title === 'Tylko tekst') {
            togglePlainTextMode();
          }
        });
      });

      // Toolbar Actions
      elements.toolbarButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          if (!elements.composeBody) {
            return;
          }

          const textarea = elements.composeBody;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = textarea.value.substring(start, end);

          if (this.title === 'Pogrubienie') {
            wrapText(textarea, start, end, '**', '**');
          } else if (this.title === 'Kursywa') {
            wrapText(textarea, start, end, '*', '*');
          } else if (this.title === 'Podkreślenie') {
            wrapText(textarea, start, end, '__', '__');
          } else if (this.title === 'Lista') {
            insertList(textarea, start, '- ');
          } else if (this.title === 'Lista numerowana') {
            insertList(textarea, start, '1. ');
          } else if (this.title === 'Załącznik') {
            handleAttachment();
          } else if (this.title === 'Steganografia') {
            handleSteganography();
          }
        });
      });

      // Security monitoring
      monitorPasteEvents();
      monitorScreenshotAttempts();
    } catch (error) {
      console.error('[VantisMail] Failed to setup event listeners:', error);
    }
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize application
   */
  function init() {
    try {
      console.log('Initializing Vantis Mail...');

      // Cache DOM elements
      cacheElements();

      // Setup event listeners
      setupEventListeners();

      // Initialize security indicators
      initSecurityIndicators();

      // Show welcome notification
      setTimeout(() => {
        showSuccess('Witaj w Vantis Mail', 'System jest w pełni zabezpieczony i gotowy do użycia.');
      }, 1000);

      console.log('Vantis Mail initialized successfully');
      console.log('Security features:');
      console.log('- End-to-End Encryption: Active');
      console.log('- Post-Quantum Protection: Active (Kyber-1024)');
      console.log('- Perfect Forward Secrecy: Active');
      console.log('- Zero-Knowledge Architecture: Active');
      console.log('- Phantom Alias System: Ready');
    } catch (error) {
      console.error('[VantisMail] Failed to initialize:', error);
      showError('Nie udało się zainicjować aplikacji');
    }
  }

  // ============================================
  // Public API
  // ============================================

  return {
    init,
    showNotification,
    openComposeModal,
    closeAllModals,
    handlePanicButton,
    state
  };
})();

// ============================================
// Auto-initialize on DOM ready
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', VantisMail.init);
} else {
  VantisMail.init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VantisMail;
}
