import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailRules } from '../../src/hooks/useEmailRules';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EmailRule,
  RuleType,
  RuleStatus,
  RulePriority,
  ConditionLogic,
  RuleFieldType,
  RuleOperator,
  RuleActionType
} from '../../src/types/emailRules';

describe('useEmailRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and State', () => {
    it('should initialize with empty state and loading', () => {
      const { result } = renderHook(() => useEmailRules());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.rules).toEqual([]);
      expect(result.current.templates).toEqual([]);
    });

    it('should load rules and templates after initialization', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rules.length).toBeGreaterThan(0);
      expect(result.current.templates.length).toBeGreaterThan(0);
    });

    it('should initialize selectedRule as null', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedRule).toBeNull();
    });
  });

  describe('Rule CRUD Operations', () => {
    it('should create a new rule', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newRule = await act(async () => {
        return await result.current.createRule({
          name: 'Test Rule',
          description: 'Test description',
          type: RuleType.CUSTOM,
          priority: RulePriority.MEDIUM,
          conditions: [
            {
              field: RuleFieldType.FROM,
              operator: RuleOperator.CONTAINS,
              value: 'test@example.com'
            }
          ],
          conditionLogic: ConditionLogic.AND,
          actions: [
            {
              type: RuleActionType.ADD_LABEL,
              parameters: { label: 'Test' }
            }
          ]
        });
      });

      expect(newRule).not.toBeNull();
      expect(newRule?.name).toBe('Test Rule');
      expect(result.current.rules.length).toBe(4); // 3 initial + 1 new
    });

    it('should update an existing rule', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ruleToUpdate = result.current.rules[0];
      const originalName = ruleToUpdate.name;

      await act(async () => {
        await result.current.updateRule(ruleToUpdate.id, {
          name: 'Updated Rule Name',
          status: RuleStatus.PAUSED
        });
      });

      const updatedRule = result.current.rules.find((r) => r.id === ruleToUpdate.id);
      expect(updatedRule?.name).toBe('Updated Rule Name');
      expect(updatedRule?.status).toBe(RuleStatus.PAUSED);
      expect(updatedRule?.name).not.toBe(originalName);
    });

    it('should delete a rule', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ruleToDelete = result.current.rules[0];
      const initialCount = result.current.rules.length;

      await act(async () => {
        await result.current.deleteRule(ruleToDelete.id);
      });

      expect(result.current.rules.length).toBe(initialCount - 1);
      expect(result.current.rules.find((r) => r.id === ruleToDelete.id)).toBeUndefined();
    });

    it('should get rule by ID', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ruleToFind = result.current.rules[0];
      const foundRule = result.current.getRuleById(ruleToFind.id);

      expect(foundRule).not.toBeNull();
      expect(foundRule?.id).toBe(ruleToFind.id);
      expect(foundRule?.name).toBe(ruleToFind.name);
    });
  });

  describe('Rule Status Management', () => {
    it('should toggle rule status from active to paused', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeRule = result.current.rules.find((r) => r.status === RuleStatus.ACTIVE);
      expect(activeRule).toBeDefined();

      await act(async () => {
        await result.current.toggleRuleStatus(activeRule!.id);
      });

      const toggledRule = result.current.rules.find((r) => r.id === activeRule!.id);
      expect(toggledRule?.status).toBe(RuleStatus.PAUSED);
    });

    it('should toggle rule status from paused to active', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First pause a rule
      const activeRule = result.current.rules.find((r) => r.status === RuleStatus.ACTIVE);
      await act(async () => {
        await result.current.toggleRuleStatus(activeRule!.id);
      });

      // Then toggle back
      await act(async () => {
        await result.current.toggleRuleStatus(activeRule!.id);
      });

      const toggledRule = result.current.rules.find((r) => r.id === activeRule!.id);
      expect(toggledRule?.status).toBe(RuleStatus.ACTIVE);
    });
  });

  describe('Rule Testing', () => {
    it('should test rule with matching email', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const testEmail = {
        id: 'test-email-1',
        from: 'support@company.com',
        to: ['user@company.com'],
        subject: 'Test Subject',
        body: 'Test body',
        hasAttachments: false,
        attachmentNames: [],
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      const testResult = result.current.testRule(rule.id, testEmail);

      expect(testResult.ruleId).toBe(rule.id);
      expect(testResult.ruleName).toBe(rule.name);
      expect(testResult.matchedConditions).toBeDefined();
    });

    it('should evaluate single condition', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const condition = {
        id: 'cond-test',
        field: RuleFieldType.FROM,
        operator: RuleOperator.CONTAINS,
        value: 'test@example.com',
        caseSensitive: false
      };

      const matchingEmail = {
        id: 'test-1',
        from: 'test@example.com',
        to: [],
        subject: '',
        body: '',
        hasAttachments: false,
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      const nonMatchingEmail = {
        ...matchingEmail,
        from: 'other@example.com'
      };

      expect(result.current.evaluateCondition(condition, matchingEmail)).toBe(true);
      expect(result.current.evaluateCondition(condition, nonMatchingEmail)).toBe(false);
    });

    it('should evaluate conditions with AND logic', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const conditions = [
        {
          id: 'cond-1',
          field: RuleFieldType.FROM,
          operator: RuleOperator.CONTAINS,
          value: 'test',
          caseSensitive: false
        },
        {
          id: 'cond-2',
          field: RuleFieldType.SUBJECT,
          operator: RuleOperator.CONTAINS,
          value: 'urgent',
          caseSensitive: false
        }
      ];

      const matchingEmail = {
        id: 'test-1',
        from: 'test@example.com',
        to: [],
        subject: 'urgent issue',
        body: '',
        hasAttachments: false,
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      const partialMatchEmail = {
        ...matchingEmail,
        subject: 'regular issue'
      };

      expect(result.current.evaluateConditions(conditions, ConditionLogic.AND, matchingEmail)).toBe(true);
      expect(result.current.evaluateConditions(conditions, ConditionLogic.AND, partialMatchEmail)).toBe(false);
    });

    it('should evaluate conditions with OR logic', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const conditions = [
        {
          id: 'cond-1',
          field: RuleFieldType.FROM,
          operator: RuleOperator.CONTAINS,
          value: 'test',
          caseSensitive: false
        },
        {
          id: 'cond-2',
          field: RuleFieldType.SUBJECT,
          operator: RuleOperator.CONTAINS,
          value: 'urgent',
          caseSensitive: false
        }
      ];

      const matchingEmail = {
        id: 'test-1',
        from: 'other@example.com',
        to: [],
        subject: 'urgent issue',
        body: '',
        hasAttachments: false,
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      expect(result.current.evaluateConditions(conditions, ConditionLogic.OR, matchingEmail)).toBe(true);
    });
  });

  describe('Rule Execution', () => {
    it('should execute rule on matching email', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const testEmail = {
        id: 'test-exec-1',
        from: 'support@company.com',
        to: ['user@company.com'],
        subject: 'Support Request',
        body: 'Need help',
        hasAttachments: false,
        attachmentNames: [],
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      await act(async () => {
        await result.current.executeRule(rule.id, testEmail);
      });

      const updatedRule = result.current.rules.find((r) => r.id === rule.id);
      expect(updatedRule?.executionCount).toBeGreaterThan(0);
      expect(updatedRule?.lastExecuted).toBeDefined();
    });

    it('should execute rule in dry run mode', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const testEmail = {
        id: 'test-dryrun',
        from: 'support@company.com',
        to: ['user@company.com'],
        subject: 'Test',
        body: 'Test',
        hasAttachments: false,
        attachmentNames: [],
        labels: [],
        folder: 'Inbox',
        dateReceived: new Date().toISOString(),
        size: 1000,
        isRead: false,
        isStarred: false,
        isArchived: false,
        direction: 'incoming' as const
      };

      const initialCount = rule.executionCount;

      await act(async () => {
        await result.current.executeRule(rule.id, testEmail, true);
      });

      const updatedRule = result.current.rules.find((r) => r.id === rule.id);
      expect(updatedRule?.executionCount).toBe(initialCount); // Should not increment in dry run
    });
  });

  describe('Rule Statistics', () => {
    it('should get rule statistics', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const stats = result.current.getRuleStatistics(rule.id);

      expect(stats).not.toBeNull();
      expect(stats?.ruleId).toBe(rule.id);
      expect(stats?.ruleName).toBe(rule.name);
      expect(stats?.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(stats?.successRate).toBeDefined();
    });

    it('should return null for non-existent rule statistics', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getRuleStatistics('non-existent-rule');
      expect(stats).toBeNull();
    });
  });

  describe('Rule Filtering', () => {
    it('should filter rules by type', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const autoReplyRules = result.current.getFilteredRules({
        type: RuleType.AUTO_REPLY
      });

      autoReplyRules.forEach((rule) => {
        expect(rule.type).toBe(RuleType.AUTO_REPLY);
      });
    });

    it('should filter rules by status', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeRules = result.current.getFilteredRules({
        status: RuleStatus.ACTIVE
      });

      activeRules.forEach((rule) => {
        expect(rule.status).toBe(RuleStatus.ACTIVE);
      });
    });

    it('should filter rules by search query', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const searchResults = result.current.getFilteredRules({
        searchQuery: 'support'
      });

      searchResults.forEach((rule) => {
        const matchName = rule.name.toLowerCase().includes('support');
        const matchDesc = rule.description?.toLowerCase().includes('support');
        expect(matchName || matchDesc).toBe(true);
      });
    });

    it('should filter rules by priority', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const highPriorityRules = result.current.getFilteredRules({
        priority: RulePriority.HIGH
      });

      highPriorityRules.forEach((rule) => {
        expect(rule.priority).toBe(RulePriority.HIGH);
      });
    });
  });

  describe('Template Operations', () => {
    it('should create rule from template', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const template = result.current.templates[0];
      const initialCount = result.current.rules.length;

      await act(async () => {
        await result.current.createRuleFromTemplate(template.id, 'Rule from Template', RulePriority.MEDIUM);
      });

      expect(result.current.rules.length).toBe(initialCount + 1);
      const newRule = result.current.rules.find((r) => r.name === 'Rule from Template');
      expect(newRule).toBeDefined();
      expect(newRule?.type).toBe(template.type);
    });
  });

  describe('State Management', () => {
    it('should set selected rule', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ruleToSelect = result.current.rules[0];

      act(() => {
        result.current.setSelectedRule(ruleToSelect);
      });

      expect(result.current.selectedRule).toBe(ruleToSelect);
    });

    it('should update selected rule when deleted', async () => {
      const { result } = renderHook(() => useEmailRules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ruleToDelete = result.current.rules[0];

      act(() => {
        result.current.setSelectedRule(ruleToDelete);
      });

      await waitFor(() => {
        expect(result.current.selectedRule).toBe(ruleToDelete);
      });

      await act(async () => {
        await result.current.deleteRule(ruleToDelete.id);
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.selectedRule).toBeNull();
      });
    });
  });
});
