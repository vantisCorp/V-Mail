import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface AutoReplyRule {
  id: string;
  enabled: boolean;
  trigger: 'all' | 'sender' | 'subject' | 'keywords';
  triggerValue?: string;
  subject: string;
  body: string;
  delayMinutes: number;
  schedule: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    weekdays?: number[];
    startTime?: string;
    endTime?: string;
  };
}

interface AutoReplyContext {
  rules: AutoReplyRule[];
  addRule: (rule: Omit<AutoReplyRule, 'id'>) => void;
  updateRule: (id: string, rule: AutoReplyRule) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  checkAutoReply: (sender: string, subject: string, body: string) => AutoReplyRule | null;
}

export const useAutoReply = (): AutoReplyContext => {
  const { addNotification } = useNotifications();
  const [rules, setRules] = useState<AutoReplyRule[]>([
    {
      id: 'default',
      enabled: false,
      trigger: 'all',
      subject: 'Out of Office',
      body: 'Thank you for your email. I am currently out of the office and will respond as soon as possible.',
      delayMinutes: 60,
      schedule: {
        enabled: false
      }
    }
  ]);

  const addRule = useCallback(
    (rule: Omit<AutoReplyRule, 'id'>) => {
      const newRule: AutoReplyRule = {
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      setRules((prevRules) => [...prevRules, newRule]);
      addNotification('success', 'Auto-reply rule created');
    },
    [addNotification]
  );

  const updateRule = useCallback(
    (id: string, updatedRule: AutoReplyRule) => {
      setRules((prevRules) => prevRules.map((r) => (r.id === id ? updatedRule : r)));
      addNotification('success', 'Auto-reply rule updated');
    },
    [addNotification]
  );

  const deleteRule = useCallback(
    (id: string) => {
      setRules((prevRules) => prevRules.filter((r) => r.id !== id));
      addNotification('success', 'Auto-reply rule deleted');
    },
    [addNotification]
  );

  const toggleRule = useCallback(
    (id: string) => {
      setRules((prevRules) =>
        prevRules.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        )
      );
      addNotification('success', 'Auto-reply rule toggled');
    },
    [addNotification]
  );

  const checkSchedule = (rule: AutoReplyRule): boolean => {
    if (!rule.schedule.enabled) {
      return true;
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now.getDay();

    // Check date range
    if (rule.schedule.startDate && currentDate < rule.schedule.startDate) {
      return false;
    }

    if (rule.schedule.endDate && currentDate > rule.schedule.endDate) {
      return false;
    }

    // Check time range
    if (rule.schedule.startTime && currentTime < rule.schedule.startTime) {
      return false;
    }

    if (rule.schedule.endTime && currentTime > rule.schedule.endTime) {
      return false;
    }

    // Check weekdays
    if (rule.schedule.weekdays && rule.schedule.weekdays.length > 0) {
      if (!rule.schedule.weekdays.includes(currentDay)) {
        return false;
      }
    }

    return true;
  };

  const checkAutoReply = useCallback(
    (sender: string, subject: string, body: string): AutoReplyRule | null => {
      for (const rule of rules) {
        if (!rule.enabled) {
          continue;
        }

        if (!checkSchedule(rule)) {
          continue;
        }

        let shouldTrigger = false;

        switch (rule.trigger) {
          case 'all':
            shouldTrigger = true;
            break;

          case 'sender':
            shouldTrigger = sender.toLowerCase().includes(
              (rule.triggerValue || '').toLowerCase()
            );
            break;

          case 'subject':
            shouldTrigger = subject.toLowerCase().includes(
              (rule.triggerValue || '').toLowerCase()
            );
            break;

          case 'keywords': {
            const keywords = (rule.triggerValue || '')
              .split(',')
              .map((k) => k.trim().toLowerCase());
            const combinedText = `${subject} ${body}`.toLowerCase();
            shouldTrigger = keywords.some((keyword) => combinedText.includes(keyword));
            break;
          }
        }

        if (shouldTrigger) {
          return rule;
        }
      }

      return null;
    },
    [rules]
  );

  return {
    rules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    checkAutoReply
  };
};
