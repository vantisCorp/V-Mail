import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { EmailList } from '../components/EmailList';
import { EmailPreview } from '../components/EmailPreview';
import { NotificationSystem } from '../components/NotificationSystem';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
import { useEmails } from '../hooks/useEmails';
import { Email } from '../types';

export const Trash: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);

  const { emails } = useEmails();

  return (
    <div className="app">
      <NotificationSystem />
      <PerformanceMonitor />

      <Sidebar
        onCompose={() => console.log('Compose')}
        onPhantom={() => console.log('Phantom')}
        onSelfDestruct={() => console.log('Self-destruct')}
        onPanic={() => console.log('Panic')}
      />

      <main className="main-content">
        <EmailList
          onEmailSelect={setSelectedEmail}
          selectedEmailId={selectedEmail?.id || null}
        />
        <EmailPreview email={selectedEmail} />
      </main>
    </div>
  );
};
