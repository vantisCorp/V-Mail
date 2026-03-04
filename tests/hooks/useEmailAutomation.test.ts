import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailAutomation } from '../../src/hooks/useEmailAutomation';
import {
  RuleStatus,
  RulePriority,
  ActionType,
  TriggerType,
  ConditionOperator
} from '../../src/types/emailAutomation';

describe('useEmailAutomation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should load rules after initialization', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rules.length).toBeGreaterThan(0);
      expect(result.current.categories.length).toBeGreaterThan(0);
      expect(result.current.executionLogs.length).toBeGreaterThan(0);
    });

    it('should load mock rules', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rules.length).toBe(5);
      expect(result.current.rules[0].name).toBe('Auto-Reply to Support Emails');
    });
  });

  describe('Rule CRUD Operations', () => {
    it('should create a new rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.rules.length;

      await act(async () => {
        await result.current.createRule({
          name: 'Test Rule',
          status: RuleStatus.ACTIVE,
          priority: RulePriority.NORMAL,
          triggerType: TriggerType.FROM,
          conditions: [
            {
              field: TriggerType.FROM,
              operator: ConditionOperator.EQUALS,
              value: 'test@example.com'
            }
          ],
          conditionGroups: [],
          actions: [
            {
              type: ActionType.ADD_LABEL,
              parameters: { label: 'Test' }
            }
          ],
          createdBy: 'user-1'
        });
      });

      expect(result.current.rules.length).toBe(initialCount + 1);
    });

    it('should update an existing rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const originalName = rule.name;

      await act(async () => {
        await result.current.updateRule(rule.id, {
          name: 'Updated Rule Name'
        });
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.name).toBe('Updated Rule Name');
      expect(updated?.name).not.toBe(originalName);
    });

    it('should delete a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.rules.length;
      const ruleToDelete = result.current.rules[0];

      await act(async () => {
        await result.current.deleteRule(ruleToDelete.id);
      });

      expect(result.current.rules.length).toBeLessThan(initialCount);
      expect(result.current.getRuleById(ruleToDelete.id)).toBeNull();
    });

    it('should duplicate a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalRule = result.current.rules[0];
      const initialCount = result.current.rules.length;

      await act(async () => {
        await result.current.duplicateRule(originalRule.id);
      });

      expect(result.current.rules.length).toBe(initialCount + 1);
      
      const duplicate = result.current.rules.find(r => 
        r.name === `${originalRule.name} (Copy)` && r.id !== originalRule.id
      );
      expect(duplicate).toBeDefined();
      expect(duplicate?.status).toBe(RuleStatus.DISABLED);
      expect(duplicate?.executionCount).toBe(0);
    });
  });

  describe('Rule Status Management', () => {
    it('should activate a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules.find(r => r.status === RuleStatus.PAUSED);
      expect(rule).toBeDefined();

      await act(async () => {
        await result.current.activateRule(rule!.id);
      });

      const updated = result.current.getRuleById(rule!.id);
      expect(updated?.status).toBe(RuleStatus.ACTIVE);
    });

    it('should pause a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules.find(r => r.status === RuleStatus.ACTIVE);
      expect(rule).toBeDefined();

      await act(async () => {
        await result.current.pauseRule(rule!.id);
      });

      const updated = result.current.getRuleById(rule!.id);
      expect(updated?.status).toBe(RuleStatus.PAUSED);
    });

    it('should disable a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];

      await act(async () => {
        await result.current.disableRule(rule.id);
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.status).toBe(RuleStatus.DISABLED);
    });
  });

  describe('Condition Management', () => {
    it('should add a condition to a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const initialConditionCount = rule.conditions.length;

      await act(async () => {
        await result.current.addCondition(rule.id, {
          field: TriggerType.SUBJECT,
          operator: ConditionOperator.CONTAINS,
          value: 'test'
        });
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.conditions.length).toBe(initialConditionCount + 1);
    });

    it('should update a condition', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const condition = rule.conditions[0];
      const originalValue = condition.value;

      await act(async () => {
        await result.current.updateCondition(rule.id, condition.id, {
          value: 'updated value'
        });
      });

      const updated = result.current.getRuleById(rule.id);
      const updatedCondition = updated?.conditions.find(c => c.id === condition.id);
      expect(updatedCondition?.value).toBe('updated value');
      expect(updatedCondition?.value).not.toBe(originalValue);
    });

    it('should remove a condition', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const condition = rule.conditions[0];
      const initialCount = rule.conditions.length;

      await act(async () => {
        await result.current.removeCondition(rule.id, condition.id);
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.conditions.length).toBe(initialCount - 1);
      expect(updated?.conditions.find(c => c.id === condition.id)).toBeUndefined();
    });
  });

  describe('Action Management', () => {
    it('should add an action to a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const initialActionCount = rule.actions.length;

      await act(async () => {
        await result.current.addAction(rule.id, {
          type: ActionType.FLAG,
          parameters: {}
        });
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.actions.length).toBe(initialActionCount + 1);
    });

    it('should update an action', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const action = rule.actions[0];

      await act(async () => {
        await result.current.updateAction(rule.id, action.id, {
          delay: 60
        });
      });

      const updated = result.current.getRuleById(rule.id);
      const updatedAction = updated?.actions.find(a => a.id === action.id);
      expect(updatedAction?.delay).toBe(60);
    });

    it('should remove an action', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const action = rule.actions[0];
      const initialCount = rule.actions.length;

      await act(async () => {
        await result.current.removeAction(rule.id, action.id);
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.actions.length).toBe(initialCount - 1);
    });

    it('should reorder actions', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const originalActionIds = rule.actions.map(a => a.id);
      const reversedIds = [...originalActionIds].reverse();

      await act(async () => {
        await result.current.reorderActions(rule.id, reversedIds);
      });

      const updated = result.current.getRuleById(rule.id);
      expect(updated?.actions.map(a => a.id)).toEqual(reversedIds);
    });
  });

  describe('Rule Testing', () => {
    it('should test a rule with matching conditions', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      
      const testResult = await result.current.testRule(rule.id, {
        [rule.triggerType]: rule.conditions[0].value
      });

      expect(testResult).toBeDefined();
      expect(testResult?.matched).toBe(true);
    });

    it('should test a rule with non-matching conditions', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      
      const testResult = await result.current.testRule(rule.id, {
        [rule.triggerType]: 'non-matching-value'
      });

      expect(testResult).toBeDefined();
      expect(testResult?.matched).toBe(false);
      expect(testResult?.unmatchedConditions.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const testResult = await result.current.testRule('non-existent-id', {});
      expect(testResult).toBeNull();
    });
  });

  describe('Rule Validation', () => {
    it('should validate a complete rule', () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      const validRule = {
        name: 'Valid Rule',
        status: RuleStatus.ACTIVE,
        priority: RulePriority.NORMAL,
        triggerType: TriggerType.FROM,
        conditions: [
          {
            field: TriggerType.FROM,
            operator: ConditionOperator.EQUALS,
            value: 'test@example.com'
          }
        ],
        conditionGroups: [],
        actions: [
          {
            type: ActionType.ADD_LABEL,
            parameters: { label: 'Test' }
          }
        ],
        createdBy: 'user-1'
      };

      const errors = result.current.validateRule(validRule);
      expect(errors).toEqual([]);
    });

    it('should validate rule with missing name', () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      const invalidRule = {
        name: '',
        status: RuleStatus.ACTIVE,
        priority: RulePriority.NORMAL,
        triggerType: TriggerType.FROM,
        conditions: [],
        conditionGroups: [],
        actions: [],
        createdBy: 'user-1'
      };

      const errors = result.current.validateRule(invalidRule);
      expect(errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should validate rule with missing conditions', () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      const invalidRule = {
        name: 'Test Rule',
        status: RuleStatus.ACTIVE,
        priority: RulePriority.NORMAL,
        triggerType: TriggerType.FROM,
        conditions: [],
        conditionGroups: [],
        actions: [],
        createdBy: 'user-1'
      };

      const errors = result.current.validateRule(invalidRule);
      expect(errors.some(e => e.field === 'conditions')).toBe(true);
    });

    it('should validate rule with missing actions', () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      const invalidRule = {
        name: 'Test Rule',
        status: RuleStatus.ACTIVE,
        priority: RulePriority.NORMAL,
        triggerType: TriggerType.FROM,
        conditions: [
          {
            field: TriggerType.FROM,
            operator: ConditionOperator.EQUALS,
            value: 'test@example.com'
          }
        ],
        conditionGroups: [],
        actions: [],
        createdBy: 'user-1'
      };

      const errors = result.current.validateRule(invalidRule);
      expect(errors.some(e => e.field === 'actions')).toBe(true);
    });
  });

  describe('Rule Statistics', () => {
    it('should get statistics for a rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const statistics = result.current.getRuleStatistics(rule.id);

      expect(statistics).toBeDefined();
      expect(statistics?.ruleId).toBe(rule.id);
      expect(statistics?.ruleName).toBe(rule.name);
      expect(statistics?.totalExecutions).toBe(rule.executionCount);
    });

    it('should return null for non-existent rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const statistics = result.current.getRuleStatistics('non-existent-id');
      expect(statistics).toBeNull();
    });
  });

  describe('Filtering and Search', () => {
    it('should filter rules by status', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeRules = result.current.getFilteredRules({
        status: RuleStatus.ACTIVE
      });

      expect(activeRules.every(r => r.status === RuleStatus.ACTIVE)).toBe(true);
    });

    it('should filter rules by priority', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const highPriorityRules = result.current.getFilteredRules({
        priority: RulePriority.HIGH
      });

      expect(highPriorityRules.every(r => r.priority === RulePriority.HIGH)).toBe(true);
    });

    it('should search rules by name', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredRules({
        search: 'Auto-Reply'
      });

      expect(filtered.every(r => 
        r.name.toLowerCase().includes('auto-reply')
      )).toBe(true);
    });

    it('should apply multiple filters together', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const filtered = result.current.getFilteredRules({
        status: RuleStatus.ACTIVE,
        priority: RulePriority.HIGH
      });

      expect(filtered.every(r => 
        r.status === RuleStatus.ACTIVE && r.priority === RulePriority.HIGH
      )).toBe(true);
    });
  });

  describe('Category Management', () => {
    it('should create a category', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.categories.length;

      await act(async () => {
        await result.current.createCategory({
          name: 'Test Category',
          description: 'Test Description',
          color: '#FF0000',
          icon: 'test'
        });
      });

      expect(result.current.categories.length).toBe(initialCount + 1);
    });

    it('should update a category', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const category = result.current.categories[0];
      const originalName = category.name;

      await act(async () => {
        await result.current.updateCategory(category.id, {
          name: 'Updated Category'
        });
      });

      const updated = result.current.categories.find(c => c.id === category.id);
      expect(updated?.name).toBe('Updated Category');
      expect(updated?.name).not.toBe(originalName);
    });

    it('should delete a category', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const category = result.current.categories[0];
      const initialCount = result.current.categories.length;

      await act(async () => {
        await result.current.deleteCategory(category.id);
      });

      expect(result.current.categories.length).toBe(initialCount - 1);
    });
  });

  describe('Utility Functions', () => {
    it('should get rule by id', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const found = result.current.getRuleById(rule.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(rule.id);
    });

    it('should get active rules', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeRules = result.current.getActiveRules();
      expect(activeRules.every(r => r.status === RuleStatus.ACTIVE)).toBe(true);
    });

    it('should get execution logs', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const logs = result.current.getExecutionLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should get execution logs for specific rule', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const rule = result.current.rules[0];
      const logs = result.current.getExecutionLogs(rule.id);

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.every(l => l.ruleId === rule.id)).toBe(true);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh rules', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshRules();
      });

      expect(result.current.rules).toBeDefined();
      expect(result.current.rules.length).toBeGreaterThan(0);
    });

    it('should refresh execution logs', async () => {
      const { result } = renderHook(() => useEmailAutomation());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshExecutionLogs();
      });

      expect(result.current.executionLogs).toBeDefined();
      expect(result.current.executionLogs.length).toBeGreaterThan(0);
    });
  });
});