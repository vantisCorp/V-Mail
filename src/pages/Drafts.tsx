import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { EmailList } from '../components/EmailList';
import { EmailPreview } from '../components/EmailPreview';
import { NotificationSystem } from '../components/NotificationSystem';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
import { Email } from '../types';

export const Drafts: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);

  return (
    <div className="app">
      <NotificationSystem />
      <PerformanceMonitor />

      <Sidebar
        // eslint-disable-next-line no-console
        onCompose={() => console.log('Compose')}
        // eslint-disable-next-line no-console
        onPhantom={() => console.log('Phantom')}
        // eslint-disable-next-line no-console
        onSelfDestruct={() => console.log('Self-destruct')}
        // eslint-disable-next-line no-console
        onPanic={() => console.log('Panic')}
      />

      <main className="main-content">
        <EmailList onEmailSelect={setSelectedEmail} selectedEmailId={selectedEmail?.id || null} />
        <EmailPreview email={selectedEmail} />
      </main>
    </div>
  );
};
