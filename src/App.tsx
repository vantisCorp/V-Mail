import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { NotificationSystem } from './components/NotificationSystem';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useNotifications } from './hooks/useNotifications';
import { Inbox } from './pages/Inbox';
import { Sent } from './pages/Sent';
import { Drafts } from './pages/Drafts';
import { Trash } from './pages/Trash';

// Lazy load modals for better performance
const ComposeModal = lazy(() => import('./components/ComposeModal').then(m => ({ default: m.ComposeModal })));
const PhantomModal = lazy(() => import('./components/PhantomModal').then(m => ({ default: m.PhantomModal })));
const SelfDestructModal = lazy(() => import('./components/SelfDestructModal').then(m => ({ default: m.SelfDestructModal })));
const PanicModal = lazy(() => import('./components/PanicModal').then(m => ({ default: m.PanicModal })));

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

  const { addNotification } = useNotifications();

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showComposeModal, showPhantomModal, showSelfDestructModal, showPanicModal]);

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
        </Suspense>
      </div>
    </Router>
  );
};
