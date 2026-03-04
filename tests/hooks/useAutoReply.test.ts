import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoReply } from '../../src/hooks/useAutoReply';

// Mock useNotifications
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

describe('useAutoReply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default rules', () => {
      const { result } = renderHook(() => useAutoReply());
      expect(result.current.rules).toHaveLength(1);
      expect(result.current.rules[0].trigger).toBe('all');
    });
  });

  describe('addRule', () => {
    it('should add a new rule', () => {
      const { result } = renderHook(() => useAutoReply());

      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'sender',
          triggerValue: 'test@example.com',
          subject: 'Test Rule',
          body: 'This is a test',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      expect(result.current.rules).toHaveLength(2);
      expect(result.current.rules[1].subject).toBe('Test Rule');
    });

    it('should generate unique ID for new rule', () => {
      const { result } = renderHook(() => useAutoReply());

      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'all',
          subject: 'Rule 1',
          body: 'Body 1',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'all',
          subject: 'Rule 2',
          body: 'Body 2',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      expect(result.current.rules[1].id).not.toBe(result.current.rules[2].id);
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', () => {
      const { result } = renderHook(() => useAutoReply());
      const ruleId = result.current.rules[0].id;

      act(() => {
        result.current.updateRule(ruleId, {
          ...result.current.rules[0],
          subject: 'Updated Subject',
        });
      });

      expect(result.current.rules[0].subject).toBe('Updated Subject');
    });
  });

  describe('deleteRule', () => {
    it('should delete a rule by ID', () => {
      const { result } = renderHook(() => useAutoReply());
      const initialLength = result.current.rules.length;

      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'all',
          subject: 'To Delete',
          body: 'Delete me',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      expect(result.current.rules).toHaveLength(initialLength + 1);

      const newRuleId = result.current.rules[initialLength].id;

      act(() => {
        result.current.deleteRule(newRuleId);
      });

      expect(result.current.rules).toHaveLength(initialLength);
    });
  });

  describe('toggleRule', () => {
    it('should toggle rule enabled state', () => {
      const { result } = renderHook(() => useAutoReply());
      const ruleId = result.current.rules[0].id;
      const initialState = result.current.rules[0].enabled;

      act(() => {
        result.current.toggleRule(ruleId);
      });

      expect(result.current.rules[0].enabled).toBe(!initialState);
    });
  });

  describe('checkAutoReply', () => {
    it('should return rule for all trigger', () => {
      const { result } = renderHook(() => useAutoReply());

      // First enable the default rule
      act(() => {
        result.current.updateRule(result.current.rules[0].id, {
          ...result.current.rules[0],
          enabled: true,
          subject: 'All Emails',
        });
      });

      const rule = result.current.checkAutoReply(
        'anyone@example.com',
        'Any Subject',
        'Any Body'
      );

      expect(rule).not.toBeNull();
      expect(rule?.subject).toBe('All Emails');
    });

    it('should return rule for sender trigger', () => {
      const { result } = renderHook(() => useAutoReply());

      // Add a sender rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'sender',
          triggerValue: 'test@example.com',
          subject: 'Sender Rule',
          body: 'Reply to sender',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      const rule = result.current.checkAutoReply(
        'test@example.com',
        'Any Subject',
        'Any Body'
      );

      expect(rule).not.toBeNull();
      expect(rule?.subject).toBe('Sender Rule');
    });

    it('should return rule for subject trigger', () => {
      const { result } = renderHook(() => useAutoReply());

      // Add a subject rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'subject',
          triggerValue: 'urgent',
          subject: 'Subject Rule',
          body: 'Reply to urgent',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      const rule = result.current.checkAutoReply(
        'anyone@example.com',
        'This is URGENT!',
        'Any Body'
      );

      expect(rule).not.toBeNull();
      expect(rule?.subject).toBe('Subject Rule');
    });

    it('should return rule for keywords trigger', () => {
      const { result } = renderHook(() => useAutoReply());

      // Add a keywords rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'keywords',
          triggerValue: 'help, support',
          subject: 'Keywords Rule',
          body: 'Reply to keywords',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      const rule = result.current.checkAutoReply(
        'anyone@example.com',
        'Any Subject',
        'I need help with support'
      );

      expect(rule).not.toBeNull();
      expect(rule?.subject).toBe('Keywords Rule');
    });

    it('should not match disabled rule', () => {
      const { result } = renderHook(() => useAutoReply());

      // Default rule is already disabled, add another disabled rule
      act(() => {
        result.current.addRule({
          enabled: false,
          trigger: 'sender',
          triggerValue: 'test@example.com',
          subject: 'Disabled Rule',
          body: 'Disabled reply',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      const rule = result.current.checkAutoReply(
        'test@example.com',
        'Any Subject',
        'Any Body'
      );

      // Should return null since all rules are disabled
      expect(rule).toBeNull();
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useAutoReply());

      // Add a sender rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'sender',
          triggerValue: 'test@example.com',
          subject: 'Sender Rule',
          body: 'Reply to sender',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      const rule = result.current.checkAutoReply(
        'TEST@EXAMPLE.COM',
        'Any Subject',
        'Any Body'
      );

      expect(rule).not.toBeNull();
      expect(rule?.subject).toBe('Sender Rule');
    });

    it('should handle multiple keywords', () => {
      const { result } = renderHook(() => useAutoReply());

      // Add a keywords rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'keywords',
          triggerValue: 'help, support',
          subject: 'Keywords Rule',
          body: 'Reply to keywords',
          delayMinutes: 0,
          schedule: { enabled: false },
        });
      });

      let rule = result.current.checkAutoReply(
        'anyone@example.com',
        'Any Subject',
        'I need help'
      );

      expect(rule?.subject).toBe('Keywords Rule');

      rule = result.current.checkAutoReply(
        'anyone@example.com',
        'Any Subject',
        'I need support'
      );

      expect(rule?.subject).toBe('Keywords Rule');
    });

    it('should respect schedule when enabled', () => {
      const { result } = renderHook(() => useAutoReply());

      // Default rule is already disabled, add a scheduled rule
      act(() => {
        result.current.addRule({
          enabled: true,
          trigger: 'all',
          subject: 'Scheduled Rule',
          body: 'Scheduled reply',
          delayMinutes: 0,
          schedule: {
            enabled: true,
            startDate: '2099-01-01', // Future date
          },
        });
      });

      const rule = result.current.checkAutoReply(
        'anyone@example.com',
        'Any Subject',
        'Any Body'
      );

      // Should return null since schedule is in the future
      expect(rule).toBeNull();
    });
  });
});