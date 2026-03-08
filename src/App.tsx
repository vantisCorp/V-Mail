import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { NotificationSystem } from './components/NotificationSystem';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useNotifications } from './hooks/useNotifications';
import { useEmails } from './hooks/useEmails';
import { useAdvancedSearch } from './hooks/useAdvancedSearch';
import { useEmailStatistics } from './hooks/useEmailStatistics';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Inbox } from './pages/Inbox';
import { Sent } from './pages/Sent';
import { Drafts } from './pages/Drafts';
import { Trash } from './pages/Trash';

// Lazy load modals for better performance
const ComposeModal = lazy(() => import('./components/ComposeModal').then(m => ({ default: m.ComposeModal })));
const PhantomModal = lazy(() => import('./components/PhantomModal').then(m => ({ default: m.PhantomModal })));
const SelfDestructModal = lazy(() => import('./components/SelfDestructModal').then(m => ({ default: m.SelfDestructModal })));
const PanicModal = lazy(() => import('./components/PanicModal').then(m => ({ default: m.PanicModal })));
const AutoReplySettings = lazy(() => import('./components/AutoReplySettings').then(m => ({ default: m.AutoReplySettings })));
const EmailFilterSettings = lazy(() => import('./components/EmailFilterSettings').then(m => ({ default: m.EmailFilterSettings })));
const LabelSettings = lazy(() => import('./components/LabelSettings').then(m => ({ default: m.LabelSettings })));
const AdvancedSearchPanel = lazy(() => import('./components/AdvancedSearchPanel').then(m => ({ default: m.AdvancedSearchPanel })));
const EmailStatistics = lazy(() => import('./components/EmailStatistics').then(m => ({ default: m.EmailStatistics })));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp').then(m => ({ default: m.KeyboardShortcutsHelp })));

// Loading component for lazy-loaded modals
const ModalLoader: React.FC = () => (
  <div className="modal-loader">
    <div className="spinner"></div>
  </div>
);

export const App: React.FC = () => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showPhantomModal, setShowPhantomModal] = useState(false);
  const [showSelfDestructModal, setShowSelfDestructModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [showAutoReplySettings, setShowAutoReplySettings] = useState(false);
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showLabelSettings, setShowLabelSettings] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const { addNotification } = useNotifications();
  const { emails } = useEmails();

  const {
    advancedSearch,
    savedSearches,
    recentSearches,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    setMatchMode,
    toggleCaseSensitive,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch
  } = useAdvancedSearch(emails);

  const {
    statistics,
    timeRange,
    setTimeRange,
    refreshStats
  } = useEmailStatistics(emails);

  const handleShortcutAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'help':
        setShowKeyboardShortcuts(true);
        break;
      case 'compose':
        setShowComposeModal(true);
        break;
      case 'panic':
        setShowPanicModal(true);
        break;
      case 'escape':
        setShowComposeModal(false);
        setShowPhantomModal(false);
        setShowSelfDestructModal(false);
        setShowPanicModal(false);
        setShowAutoReplySettings(false);
        setShowFilterSettings(false);
        setShowLabelSettings(false);
        setShowAdvancedSearch(false);
        setShowStatistics(false);
        setShowKeyboardShortcuts(false);
        break;
    }
  }, []);

  const {
    shortcuts,
    shortcutGroups,
    isEnabled: shortcutsEnabled,
    setEnabled: setShortcutsEnabled,
    showHelp: showShortcutsHelp,
    setShowHelp: setShowShortcutsHelp
  } = useKeyboardShortcuts(handleShortcutAction);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowComposeModal(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPanicModal(true);
      }

      if (e.key === 'Escape') {
        if (showComposeModal) {
          setShowComposeModal(false);
        }
        if (showPhantomModal) {
          setShowPhantomModal(false);
        }
        if (showSelfDestructModal) {
          setShowSelfDestructModal(false);
        }
        if (showPanicModal) {
          setShowPanicModal(false);
        }
        if (showAutoReplySettings) {
          setShowAutoReplySettings(false);
        }
        if (showFilterSettings) {
          setShowFilterSettings(false);
        }
        if (showLabelSettings) {
          setShowLabelSettings(false);
        }
        if (showAdvancedSearch) {
          setShowAdvancedSearch(false);
        }
        if (showStatistics) {
          setShowStatistics(false);
        }
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showComposeModal, showPhantomModal, showSelfDestructModal, showPanicModal, showAutoReplySettings, showFilterSettings, showLabelSettings, showAdvancedSearch, showStatistics, showKeyboardShortcuts]);

  const handleCompose = () => {
    setShowComposeModal(true);
  };

  const handlePhantom = () => {
    setShowPhantomModal(true);
  };

  const handleSelfDestruct = () => {
    setShowSelfDestructModal(true);
  };

  const handlePanic = () => {
    setShowPanicModal(true);
  };

  const handleAutoReplySettings = () => {
    setShowAutoReplySettings(true);
  };

  const handleFilterSettings = () => {
    setShowFilterSettings(true);
  };

  const handleLabelSettings = () => {
    setShowLabelSettings(true);
  };

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  const handleStatistics = () => {
    setShowStatistics(true);
  };

  const handleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(true);
  };

  const handleSendEmail = async (data: any) => {
    console.log('Sending email:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handlePhantomSelect = (alias: string) => {
    addNotification('success', `Phantom alias "${alias}" selected`);
    setShowPhantomModal(false);
  };

  const handleSelfDestructSelect = (date: Date) => {
    addNotification('success', `Self-destruct timer set to ${date.toLocaleString()}`);
    setShowSelfDestructModal(false);
  };

  const handlePanicConfirm = () => {
    addNotification('error', 'Panic mode activated! Account locked.');
    setShowPanicModal(false);
  };

  return (
    <Router>
      <div className="app">
        <NotificationSystem />
        <PerformanceMonitor />

        <Sidebar
          onCompose={handleCompose}
          onPhantom={handlePhantom}
          onSelfDestruct={handleSelfDestruct}
          onPanic={handlePanic}
          onAutoReplySettings={handleAutoReplySettings}
          onFilterSettings={handleFilterSettings}
          onLabelSettings={handleLabelSettings}
          onAdvancedSearch={handleAdvancedSearch}
          onStatistics={handleStatistics}
          onKeyboardShortcuts={handleKeyboardShortcuts}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/sent" element={<Sent />} />
          <Route path="/drafts" element={<Drafts />} />
          <Route path="/trash" element={<Trash />} />
        </Routes>

        <Suspense fallback={<ModalLoader />}>
          {showComposeModal && (
            <ComposeModal
              isOpen={showComposeModal}
              onClose={() => setShowComposeModal(false)}
              onSend={handleSendEmail}
            />
          )}

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

          {showPanicModal && (
            <PanicModal
              isOpen={showPanicModal}
              onClose={() => setShowPanicModal(false)}
              onConfirm={handlePanicConfirm}
            />
          )}
          {showAutoReplySettings && (
            <AutoReplySettings
              onClose={() => setShowAutoReplySettings(false)}
            />
          )}
          {showFilterSettings && (
            <EmailFilterSettings
              onClose={() => setShowFilterSettings(false)}
            />
          )}
          {showLabelSettings && (
            <LabelSettings
              onClose={() => setShowLabelSettings(false)}
            />
          )}
          {showAdvancedSearch && (
            <AdvancedSearchPanel
              isOpen={showAdvancedSearch}
              onClose={() => setShowAdvancedSearch(false)}
              conditions={advancedSearch.conditions}
              matchMode={advancedSearch.matchMode}
              caseSensitive={advancedSearch.caseSensitive}
              savedSearches={savedSearches}
              recentSearches={recentSearches}
              onAddCondition={addCondition}
              onUpdateCondition={updateCondition}
              onRemoveCondition={removeCondition}
              onClearConditions={clearConditions}
              onSetMatchMode={setMatchMode}
              onToggleCaseSensitive={toggleCaseSensitive}
              onSaveSearch={saveSearch}
              onLoadSavedSearch={loadSavedSearch}
              onDeleteSavedSearch={deleteSavedSearch}
            />
          )}
          {showStatistics && (
            <EmailStatistics
              isOpen={showStatistics}
              onClose={() => setShowStatistics(false)}
              statistics={statistics}
              timeRange={timeRange}
              onRefresh={refreshStats}
            />
          )}
          {(showKeyboardShortcuts || showShortcutsHelp) && (
            <KeyboardShortcutsHelp
              isOpen={showKeyboardShortcuts || showShortcutsHelp}
              onClose={() => {
                setShowKeyboardShortcuts(false);
                setShowShortcutsHelp(false);
              }}
              shortcutGroups={shortcutGroups}
              isEnabled={shortcutsEnabled}
              onToggleEnabled={() => setShortcutsEnabled(!shortcutsEnabled)}
            />
          )}
        </Suspense>
      </div>
    </Router>
  );
};
