import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import type { Label, LabelStats, LabeledEmail } from '../types/labels';

const generateId = () => `label-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899' // pink
];

export const useLabels = () => {
  const { addNotification } = useNotifications();
  const [labels, setLabels] = useState<Label[]>([]);
  const [labeledEmails, setLabeledEmails] = useState<LabeledEmail[]>([]);
  const [stats, setStats] = useState<LabelStats>({
    totalLabels: 0,
    totalLabeledEmails: 0
  });

  const updateStats = useCallback((newLabels: Label[], newLabeledEmails: LabeledEmail[]) => {
    const uniqueEmails = new Set(newLabeledEmails.map(le => le.emailId));
    setStats({
      totalLabels: newLabels.length,
      totalLabeledEmails: uniqueEmails.size
    });
  }, []);

  const getRandomColor = useCallback(() => {
    return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
  }, []);

  const addLabel = useCallback(
    (label: Omit<Label, 'id' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const newLabel: Label = {
        ...label,
        id: generateId(),
        color: label.color || getRandomColor(),
        createdAt: now
      };
      setLabels((prevLabels) => {
        const newLabels = [...prevLabels, newLabel];
        updateStats(newLabels, labeledEmails);
        return newLabels;
      });
      addNotification('success', `Label "${label.name}" created`);
    },
    [addNotification, getRandomColor, labeledEmails, updateStats]
  );

  const updateLabel = useCallback(
    (id: string, updates: Partial<Label>) => {
      setLabels((prevLabels) =>
        prevLabels.map((label) =>
          label.id === id ? { ...label, ...updates } : label
        )
      );
      addNotification('success', 'Label updated');
    },
    [addNotification]
  );

  const deleteLabel = useCallback(
    (id: string) => {
      const label = labels.find((l) => l.id === id);
      setLabels((prevLabels) => {
        const newLabels = prevLabels.filter((l) => l.id !== id);
        const newLabeledEmails = labeledEmails.filter((le) => le.labelId !== id);
        setLabeledEmails(newLabeledEmails);
        updateStats(newLabels, newLabeledEmails);
        return newLabels;
      });
      addNotification('success', `Label "${label?.name}" deleted`);
    },
    [labels, labeledEmails, addNotification, updateStats]
  );

  const applyLabelToEmail = useCallback(
    (emailId: string, labelId: string) => {
      const exists = labeledEmails.find(
        (le) => le.emailId === emailId && le.labelId === labelId
      );
      if (exists) {
return;
}

      const newLabeledEmail: LabeledEmail = {
        emailId,
        labelId,
        appliedAt: new Date().toISOString()
      };
      setLabeledEmails((prev) => {
        const newLabeledEmails = [...prev, newLabeledEmail];
        updateStats(labels, newLabeledEmails);
        return newLabeledEmails;
      });
    },
    [labeledEmails, labels, updateStats]
  );

  const removeLabelFromEmail = useCallback(
    (emailId: string, labelId: string) => {
      setLabeledEmails((prev) => {
        const newLabeledEmails = prev.filter(
          (le) => le.emailId !== emailId || le.labelId !== labelId
        );
        updateStats(labels, newLabeledEmails);
        return newLabeledEmails;
      });
    },
    [labels, updateStats]
  );

  const toggleLabelOnEmail = useCallback(
    (emailId: string, labelId: string) => {
      const exists = labeledEmails.find(
        (le) => le.emailId === emailId && le.labelId === labelId
      );
      if (exists) {
        removeLabelFromEmail(emailId, labelId);
      } else {
        applyLabelToEmail(emailId, labelId);
      }
    },
    [labeledEmails, applyLabelToEmail, removeLabelFromEmail]
  );

  const getEmailLabels = useCallback(
    (emailId: string): Label[] => {
      const emailLabelIds = labeledEmails
        .filter((le) => le.emailId === emailId)
        .map((le) => le.labelId);
      return labels.filter((label) => emailLabelIds.includes(label.id));
    },
    [labeledEmails, labels]
  );

  const getLabelEmails = useCallback(
    (labelId: string): string[] => {
      return labeledEmails
        .filter((le) => le.labelId === labelId)
        .map((le) => le.emailId);
    },
    [labeledEmails]
  );

  const duplicateLabel = useCallback(
    (id: string) => {
      const label = labels.find((l) => l.id === id);
      if (!label) {
return;
}

      const newLabel: Label = {
        ...label,
        id: generateId(),
        name: `${label.name} (Copy)`,
        createdAt: new Date().toISOString()
      };
      setLabels((prev) => {
        const newLabels = [...prev, newLabel];
        updateStats(newLabels, labeledEmails);
        return newLabels;
      });
      addNotification('success', `Label "${label.name}" duplicated`);
    },
    [labels, labeledEmails, addNotification, updateStats]
  );

  return {
    labels,
    labeledEmails,
    stats,
    addLabel,
    updateLabel,
    deleteLabel,
    applyLabelToEmail,
    removeLabelFromEmail,
    toggleLabelOnEmail,
    getEmailLabels,
    getLabelEmails,
    duplicateLabel
  };
};
