import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailPreview } from './components/EmailPreview';
import { ComposeModal } from './components/ComposeModal';
import { PhantomModal } from './components/PhantomModal';
import { SelfDestructModal } from './components/SelfDestructModal';
import { PanicModal } from './components/PanicModal';
import { NotificationSystem } from './components/NotificationSystem';
import { useEmails } from './hooks/useEmails';
import { useNotifications } from './hooks/useNotifications';
import { Email } from './types';

export const App: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
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
        if (showComposeModal) setShowComposeModal(false);
        if (showPhantomModal) setShowPhantomModal(false);
        if (showSelfDestructModal) setShowSelfDestructModal(false);
        if (showPanicModal) setShowPanicModal(false);
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
    <div className="app">
      <NotificationSystem />

      <Sidebar
        onCompose={handleCompose}
        onPhantom={handlePhantom}
        onSelfDestruct={handleSelfDestruct}
        onPanic={handlePanic}
      />

      <main className="main-content">
        <EmailList
          onEmailSelect={setSelectedEmail}
          selectedEmailId={selectedEmail?.id || null}
        />
        <EmailPreview email={selectedEmail} />
      </main>

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
    </div>
  );
};
