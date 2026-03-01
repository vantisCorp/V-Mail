import { useState, useEffect } from 'react';
import { Email, Folder } from '../types';

export const useEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');

  useEffect(() => {
    const mockEmails: Email[] = [
      {
        id: '1',
        from: 'john.doe@example.com',
        to: 'user@vantis.com',
        subject: 'Project Update - Q1 2024',
        body: 'Hi,\n\nHere is the project update for Q1 2024. We have made significant progress on all fronts...\n\nBest regards,\nJohn',
        date: new Date('2024-03-01T10:30:00'),
        read: false,
        starred: true,
        encrypted: true,
        hasAttachments: true,
        attachments: [
          {
            id: 'att1',
            name: 'Q1_Report.pdf',
            size: 1024000,
            type: 'application/pdf',
            url: '#',
            uploadedAt: new Date('2024-03-01T10:30:00'),
          },
        ],
        folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
      },
      {
        id: '2',
        from: 'security@vantis.com',
        to: 'user@vantis.com',
        subject: 'Security Alert: New Login Detected',
        body: 'A new login was detected from IP 192.168.1.1. If this was not you, please change your password immediately.',
        date: new Date('2024-02-28T15:45:00'),
        read: true,
        starred: false,
        encrypted: true,
        hasAttachments: false,
        folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
      },
      {
        id: '3',
        from: 'newsletter@tech.com',
        to: 'user@vantis.com',
        subject: 'Weekly Tech Newsletter',
        body: 'This week in tech: AI breakthroughs, new gadgets, and more...',
        date: new Date('2024-02-27T09:00:00'),
        read: true,
        starred: false,
        encrypted: false,
        hasAttachments: false,
        folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
      },
      {
        id: '4',
        from: 'phantom1@vantis-phantom.com',
        to: 'user@vantis.com',
        subject: 'Secret Message',
        body: 'This message was sent using a Phantom Alias. Your identity is protected.',
        date: new Date('2024-02-26T14:20:00'),
        read: false,
        starred: false,
        encrypted: true,
        hasAttachments: false,
        phantomAlias: 'phantom1@vantis-phantom.com',
        folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
      },
      {
        id: '5',
        from: 'urgent@company.com',
        to: 'user@vantis.com',
        subject: 'URGENT: Meeting Tomorrow',
        body: 'Please attend the emergency meeting tomorrow at 10 AM.',
        date: new Date('2024-02-25T11:30:00'),
        read: false,
        starred: true,
        encrypted: true,
        hasAttachments: false,
        selfDestruct: new Date('2024-03-01T11:30:00'),
        folder: { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
      },
    ];

    setTimeout(() => {
      setEmails(mockEmails);
      setIsLoading(false);
    }, 500);
  }, []);

  const folders: Folder[] = [
    { id: 'inbox', name: 'Inbox', count: 5, icon: '📥' },
    { id: 'sent', name: 'Sent', count: 3, icon: '📤' },
    { id: 'drafts', name: 'Drafts', count: 2, icon: '📝' },
    { id: 'starred', name: 'Starred', count: 2, icon: '⭐' },
    { id: 'trash', name: 'Trash', count: 1, icon: '🗑️' },
  ];

  const selectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const getFilteredEmails = (): Email[] => {
    if (selectedFolder === 'starred') {
      return emails.filter((email) => email.starred);
    }
    return emails.filter((email) => email.folder.id === selectedFolder);
  };

  const markAsRead = (emailId: string) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === emailId ? { ...email, read: true } : email
      )
    );
  };

  const toggleStar = (emailId: string) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === emailId ? { ...email, starred: !email.starred } : email
      )
    );
  };

  const deleteEmail = (emailId: string) => {
    setEmails((prev) => prev.filter((email) => email.id !== emailId));
  };

  return {
    emails,
    isLoading,
    folders,
    selectedFolder,
    selectFolder,
    getFilteredEmails,
    markAsRead,
    toggleStar,
    deleteEmail,
  };
};
