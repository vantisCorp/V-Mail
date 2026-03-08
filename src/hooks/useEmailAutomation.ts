/**
 * Email Automation & Rules Hook
 * Manages automation rules, conditions, actions, and execution
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  AutomationRule,
  RuleCondition,
  RuleAction,
  ConditionGroup,
  TriggerType,
  ActionType,
  ConditionOperator,
  RuleStatus,
  RulePriority,
  RuleExecutionLog,
  RuleTestResult,
  RuleStatistics,
  RuleCategory,
  RuleValidationError,
  CreateRulePayload,
  UpdateRulePayload,
  CreateConditionPayload,
  CreateActionPayload,
  CreateCategoryPayload
} from '../types/emailAutomation';

// Mock data generators
const generateId = () => `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateMockRules = (): AutomationRule[] => {
  return [
    {
      id: 'rule-1',
      name: 'Auto-Reply to Support Emails',
      description: 'Automatically reply to emails sent to support inbox',
      status: RuleStatus.ACTIVE,
      priority: RulePriority.HIGH,
      triggerType: TriggerType.TO,
      conditions: [
        {
          id: 'cond-1',
          field: TriggerType.TO,
          operator: ConditionOperator.EQUALS,
          value: 'support@company.com',
          caseSensitive: false
        }
      ],
      conditionGroups: [],
      actions: [
        {
          id: 'act-1',
          type: ActionType.AUTO_REPLY,
          parameters: {
            templateId: 'template-support-reply',
            delay: 0
          }
        },
        {
          id: 'act-2',
          type: ActionType.ADD_LABEL,
          parameters: {
            label: 'Support',
            color: '#FF6B6B'
          }
        }
      ],
      applyTo: 'incoming',
      executeOn: 'receive',
      createdBy: 'admin',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      executionCount: 156,
      lastExecutedAt: '2024-01-20T15:30:00Z',
      successCount: 155,
      failureCount: 1
    },
    {
      id: 'rule-2',
      name: 'Invoice Forwarding',
      description: 'Forward invoices to accounting department',
      status: RuleStatus.ACTIVE,
      priority: RulePriority.NORMAL,
      triggerType: TriggerType.SUBJECT,
      conditions: [
        {
          id: 'cond-2',
          field: TriggerType.SUBJECT,
          operator: ConditionOperator.CONTAINS,
          value: 'invoice',
          caseSensitive: false
        }
      ],
      conditionGroups: [],
      actions: [
        {
          id: 'act-3',
          type: ActionType.FORWARD,
          parameters: {
            to: ['accounting@company.com'],
            includeAttachments: true,
            addNote: 'Invoice received from {{from}}'
          }
        },
        {
          id: 'act-4',
          type: ActionType.ADD_LABEL,
          parameters: {
            label: 'Invoice',
            color: '#4ECDC4'
          }
        },
        {
          id: 'act-5',
          type: ActionType.MOVE_TO_FOLDER,
          parameters: {
            folderId: 'folder-invoices',
            createFolder: true
          }
        }
      ],
      applyTo: 'incoming',
      executeOn: 'receive',
      createdBy: 'admin',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
      executionCount: 89,
      lastExecutedAt: '2024-01-19T14:22:00Z',
      successCount: 89,
      failureCount: 0
    },
    {
      id: 'rule-3',
      name: 'Archive Old Emails',
      description: 'Move emails older than 90 days to archive',
      status: RuleStatus.ACTIVE,
      priority: RulePriority.LOW,
      triggerType: TriggerType.RECEIVED,
      conditions: [
        {
          id: 'cond-3',
          field: TriggerType.RECEIVED,
          operator: ConditionOperator.BEFORE,
          value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          caseSensitive: false
        }
      ],
      conditionGroups: [],
      actions: [
        {
          id: 'act-6',
          type: ActionType.ARCHIVE,
          parameters: {}
        }
      ],
      applyTo: 'incoming',
      executeOn: 'receive',
      createdBy: 'admin',
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-05T08:00:00Z',
      executionCount: 1245,
      lastExecutedAt: '2024-01-20T03:00:00Z',
      successCount: 1240,
      failureCount: 5
    },
    {
      id: 'rule-4',
      name: 'Flag Important Clients',
      description: 'Flag emails from important clients',
      status: RuleStatus.ACTIVE,
      priority: RulePriority.HIGH,
      triggerType: TriggerType.FROM,
      conditions: [
        {
          id: 'cond-4',
          field: TriggerType.FROM,
          operator: ConditionOperator.IN,
          value: ['client1@company.com', 'client2@company.com', 'client3@company.com'],
          caseSensitive: false
        }
      ],
      conditionGroups: [],
      actions: [
        {
          id: 'act-7',
          type: ActionType.FLAG,
          parameters: {
            importance: 'high'
          }
        },
        {
          id: 'act-8',
          type: ActionType.ADD_LABEL,
          parameters: {
            label: 'Important Client',
            color: '#FFE66D'
          }
        }
      ],
      applyTo: 'incoming',
      executeOn: 'receive',
      createdBy: 'admin',
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-08T11:00:00Z',
      executionCount: 234,
      lastExecutedAt: '2024-01-20T16:45:00Z',
      successCount: 234,
      failureCount: 0
    },
    {
      id: 'rule-5',
      name: 'Auto-Reply to Out of Office',
      description: 'Send out of office auto-reply',
      status: RuleStatus.PAUSED,
      priority: RulePriority.URGENT,
      triggerType: TriggerType.FROM,
      conditions: [
        {
          id: 'cond-5',
          field: TriggerType.SUBJECT,
          operator: ConditionOperator.CONTAINS,
          value: 'out of office',
          caseSensitive: false
        }
      ],
      conditionGroups: [],
      actions: [
        {
          id: 'act-9',
          type: ActionType.AUTO_REPLY,
          parameters: {
            templateId: 'template-ooo-reply',
            delay: 60
          }
        }
      ],
      applyTo: 'incoming',
      executeOn: 'receive',
      createdBy: 'admin',
      createdAt: '2024-01-12T13:00:00Z',
      updatedAt: '2024-01-18T10:30:00Z',
      executionCount: 45,
      lastExecutedAt: '2024-01-18T10:30:00Z',
      successCount: 45,
      failureCount: 0
    }
  ];
};

const generateMockExecutionLogs = (): RuleExecutionLog[] => {
  return [
    {
      id: 'log-1',
      ruleId: 'rule-1',
      ruleName: 'Auto-Reply to Support Emails',
      emailId: 'email-123',
      emailSubject: 'Need help with account',
      status: 'success',
      executedActions: [
        {
          actionId: 'act-1',
          actionType: ActionType.AUTO_REPLY,
          status: 'success',
          duration: 234
        },
        {
          actionId: 'act-2',
          actionType: ActionType.ADD_LABEL,
          status: 'success',
          duration: 45
        }
      ],
      executedAt: '2024-01-20T15:30:00Z',
      executedBy: 'system',
      totalDuration: 279
    },
    {
      id: 'log-2',
      ruleId: 'rule-2',
      ruleName: 'Invoice Forwarding',
      emailId: 'email-124',
      emailSubject: 'Invoice #12345',
      status: 'success',
      executedActions: [
        {
          actionId: 'act-3',
          actionType: ActionType.FORWARD,
          status: 'success',
          duration: 567
        },
        {
          actionId: 'act-4',
          actionType: ActionType.ADD_LABEL,
          status: 'success',
          duration: 34
        },
        {
          actionId: 'act-5',
          actionType: ActionType.MOVE_TO_FOLDER,
          status: 'success',
          duration: 89
        }
      ],
      executedAt: '2024-01-20T14:22:00Z',
      executedBy: 'system',
      totalDuration: 690
    },
    {
      id: 'log-3',
      ruleId: 'rule-1',
      ruleName: 'Auto-Reply to Support Emails',
      emailId: 'email-125',
      emailSubject: 'Support request',
      status: 'failure',
      executedActions: [
        {
          actionId: 'act-1',
          actionType: ActionType.AUTO_REPLY,
          status: 'failure',
          error: 'Template not found',
          duration: 123
        }
      ],
      executedAt: '2024-01-20T13:15:00Z',
      executedBy: 'system',
      totalDuration: 123
    }
  ];
};

const generateMockCategories = (): RuleCategory[] => {
  return [
    {
      id: 'cat-1',
      name: 'Auto-Replies',
      description: 'Rules for automatic email responses',
      color: '#FF6B6B',
      icon: 'reply',
      ruleCount: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'cat-2',
      name: 'Organization',
      description: 'Rules for organizing emails',
      color: '#4ECDC4',
      icon: 'folder',
      ruleCount: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'cat-3',
      name: 'Prioritization',
      description: 'Rules for flagging important emails',
      color: '#FFE66D',
      icon: 'flag',
      ruleCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'cat-4',
      name: 'Cleanup',
      description: 'Rules for managing old emails',
      color: '#95E1D3',
      icon: 'trash',
      ruleCount: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];
};

const DEFAULT_CATEGORIES = generateMockCategories();

export const useEmailAutomation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executionLogs, setExecutionLogs] = useState<RuleExecutionLog[]>([]);
  const [categories, setCategories] = useState<RuleCategory[]>(DEFAULT_CATEGORIES);

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRules(generateMockRules());
      setExecutionLogs(generateMockExecutionLogs());
      setIsLoading(false);
    };
    initialize();
  }, []);

  // CRUD Operations for Rules
  const createRule = useCallback(async (payload: CreateRulePayload): Promise<AutomationRule | null> => {
    const newRule: AutomationRule = {
      ...payload,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0
    };

    setRules(prev => [...prev, newRule]);
    return newRule;
  }, []);

  const updateRule = useCallback(async (id: string, payload: UpdateRulePayload): Promise<AutomationRule | null> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === id) {
        return {
          ...rule,
          ...payload,
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));

    return rules.find(r => r.id === id) || null;
  }, [rules]);

  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    setRules(prev => prev.filter(rule => rule.id !== id));
    return true;
  }, []);

  const duplicateRule = useCallback(async (ruleId: string, newName?: string): Promise<AutomationRule | null> => {
    const originalRule = rules.find(r => r.id === ruleId);
    if (!originalRule) {
return null;
}

    const newRule: AutomationRule = {
      ...originalRule,
      id: generateId(),
      name: newName || `${originalRule.name} (Copy)`,
      status: RuleStatus.DISABLED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      lastExecutedAt: undefined
    };

    setRules(prev => [...prev, newRule]);
    return newRule;
  }, [rules]);

  // Rule status management
  const activateRule = useCallback(async (id: string): Promise<boolean> => {
    return (await updateRule(id, { status: RuleStatus.ACTIVE })) !== null;
  }, [updateRule]);

  const pauseRule = useCallback(async (id: string): Promise<boolean> => {
    return (await updateRule(id, { status: RuleStatus.PAUSED })) !== null;
  }, [updateRule]);

  const disableRule = useCallback(async (id: string): Promise<boolean> => {
    return (await updateRule(id, { status: RuleStatus.DISABLED })) !== null;
  }, [updateRule]);

  // Condition management
  const addCondition = useCallback(async (ruleId: string, condition: CreateConditionPayload): Promise<RuleCondition | null> => {
    const newCondition: RuleCondition = {
      ...condition,
      id: generateId()
    };

    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          conditions: [...rule.conditions, newCondition],
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));

    return newCondition;
  }, []);

  const updateCondition = useCallback(async (ruleId: string, conditionId: string, updates: Partial<RuleCondition>): Promise<boolean> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          conditions: rule.conditions.map(c =>
            c.id === conditionId ? { ...c, ...updates } : c
          ),
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));
    return true;
  }, []);

  const removeCondition = useCallback(async (ruleId: string, conditionId: string): Promise<boolean> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          conditions: rule.conditions.filter(c => c.id !== conditionId),
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));
    return true;
  }, []);

  // Action management
  const addAction = useCallback(async (ruleId: string, action: CreateActionPayload): Promise<RuleAction | null> => {
    const newAction: RuleAction = {
      ...action,
      id: generateId()
    };

    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          actions: [...rule.actions, newAction],
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));

    return newAction;
  }, []);

  const updateAction = useCallback(async (ruleId: string, actionId: string, updates: Partial<RuleAction>): Promise<boolean> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          actions: rule.actions.map(a =>
            a.id === actionId ? { ...a, ...updates } : a
          ),
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));
    return true;
  }, []);

  const removeAction = useCallback(async (ruleId: string, actionId: string): Promise<boolean> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        return {
          ...rule,
          actions: rule.actions.filter(a => a.id !== actionId),
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));
    return true;
  }, []);

  // Reorder actions
  const reorderActions = useCallback(async (ruleId: string, actionIds: string[]): Promise<boolean> => {
    setRules(prev => prev.map(rule => {
      if (rule.id === ruleId) {
        const actionMap = new Map(rule.actions.map(a => [a.id, a]));
        const reorderedActions = actionIds.map(id => actionMap.get(id)!).filter(Boolean);

        return {
          ...rule,
          actions: reorderedActions,
          updatedAt: new Date().toISOString()
        };
      }
      return rule;
    }));
    return true;
  }, []);

  // Rule testing
  const testRule = useCallback(async (ruleId: string, emailData: Record<string, any>): Promise<RuleTestResult | null> => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) {
return null;
}

    const startTime = Date.now();
    const matchedConditions: string[] = [];
    const unmatchedConditions: string[] = [];
    let matched = true;

    // Test conditions
    for (const condition of rule.conditions) {
      const emailValue = emailData[condition.field];
      let conditionMatched = false;

      switch (condition.operator) {
        case ConditionOperator.EQUALS:
          conditionMatched = emailValue === condition.value;
          break;
        case ConditionOperator.CONTAINS:
          conditionMatched = String(emailValue).toLowerCase().includes(String(condition.value).toLowerCase());
          break;
        case ConditionOperator.IN:
          conditionMatched = Array.isArray(condition.value) && condition.value.includes(emailValue);
          break;
        default:
          conditionMatched = emailValue === condition.value;
      }

      if (condition.negate) {
        conditionMatched = !conditionMatched;
      }

      if (conditionMatched) {
        matchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
      } else {
        unmatchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
        matched = false;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      matchedConditions,
      unmatchedConditions,
      executionTime,
      timestamp: new Date().toISOString()
    };
  }, [rules]);

  // Rule validation
  const validateRule = useCallback((rule: Partial<CreateRulePayload>): RuleValidationError[] => {
    const errors: RuleValidationError[] = [];

    if (!rule.name || rule.name.trim() === '') {
      errors.push({ field: 'name', message: 'Rule name is required' });
    }

    if (!rule.triggerType) {
      errors.push({ field: 'triggerType', message: 'Trigger type is required' });
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push({ field: 'conditions', message: 'At least one condition is required' });
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push({ field: 'actions', message: 'At least one action is required' });
    }

    // Validate conditions
    rule.conditions?.forEach((condition, index) => {
      if (!condition.field) {
        errors.push({ field: `conditions[${index}].field`, message: 'Condition field is required' });
      }
      if (!condition.operator) {
        errors.push({ field: `conditions[${index}].operator`, message: 'Condition operator is required' });
      }
      if (condition.value === undefined || condition.value === null || condition.value === '') {
        errors.push({ field: `conditions[${index}].value`, message: 'Condition value is required' });
      }
    });

    // Validate actions
    rule.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push({ field: `actions[${index}].type`, message: 'Action type is required' });
      }
    });

    return errors;
  }, []);

  // Rule statistics
  const getRuleStatistics = useCallback((ruleId: string): RuleStatistics | null => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) {
return null;
}

    const logs = executionLogs.filter(l => l.ruleId === ruleId);
    const successCount = logs.filter(l => l.status === 'success').length;
    const failureCount = logs.filter(l => l.status === 'failure').length;

    const actionStats = logs.reduce((acc, log) => {
      log.executedActions.forEach(action => {
        const existing = acc.find(a => a.actionType === action.actionType);
        if (existing) {
          existing.count++;
        } else {
          acc.push({
            actionType: action.actionType,
            count: 1,
            successRate: action.status === 'success' ? 1 : 0
          });
        }
      });
      return acc;
    }, [] as Array<{ actionType: ActionType; count: number; successRate: number }>);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      totalExecutions: rule.executionCount,
      successfulExecutions: rule.successCount,
      failedExecutions: rule.failureCount,
      successRate: rule.executionCount > 0 ? (rule.successCount / rule.executionCount) * 100 : 0,
      lastExecutedAt: rule.lastExecutedAt || '',
      averageExecutionTime: logs.length > 0 ? logs.reduce((sum, log) => sum + log.totalDuration, 0) / logs.length : 0,
      actionStats,
      executionsByDay: [],
      recentErrors: logs.filter(l => l.status === 'failure').slice(-5).map(l => ({
        timestamp: l.executedAt,
        error: l.executedActions.find(a => a.status === 'failure')?.error || 'Unknown error'
      }))
    };
  }, [rules, executionLogs]);

  // Filter and search
  const getFilteredRules = useCallback((filter?: {
    status?: RuleStatus;
    priority?: RulePriority;
    categoryId?: string;
    search?: string;
  }): AutomationRule[] => {
    let filtered = [...rules];

    if (filter?.status) {
      filtered = filtered.filter(r => r.status === filter.status);
    }

    if (filter?.priority) {
      filtered = filtered.filter(r => r.priority === filter.priority);
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [rules]);

  // Category management
  const createCategory = useCallback(async (category: CreateCategoryPayload): Promise<RuleCategory> => {
    const newCategory: RuleCategory = {
      ...category,
      id: generateId(),
      ruleCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<CreateCategoryPayload>): Promise<boolean> => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));
    return true;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    return true;
  }, []);

  // Utility functions
  const getRuleById = useCallback((id: string): AutomationRule | null => {
    return rules.find(r => r.id === id) || null;
  }, [rules]);

  const getActiveRules = useCallback((): AutomationRule[] => {
    return rules.filter(r => r.status === RuleStatus.ACTIVE);
  }, [rules]);

  const getExecutionLogs = useCallback((ruleId?: string): RuleExecutionLog[] => {
    if (ruleId) {
      return executionLogs.filter(l => l.ruleId === ruleId);
    }
    return executionLogs;
  }, [executionLogs]);

  // Refresh functions
  const refreshRules = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRules(generateMockRules());
    setIsLoading(false);
  }, []);

  const refreshExecutionLogs = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setExecutionLogs(generateMockExecutionLogs());
  }, []);

  return {
    // State
    isLoading,
    rules,
    executionLogs,
    categories,

    // Rule CRUD
    createRule,
    updateRule,
    deleteRule,
    duplicateRule,

    // Rule status
    activateRule,
    pauseRule,
    disableRule,

    // Condition management
    addCondition,
    updateCondition,
    removeCondition,

    // Action management
    addAction,
    updateAction,
    removeAction,
    reorderActions,

    // Testing and validation
    testRule,
    validateRule,

    // Statistics
    getRuleStatistics,

    // Filter and search
    getFilteredRules,

    // Category management
    createCategory,
    updateCategory,
    deleteCategory,

    // Utility functions
    getRuleById,
    getActiveRules,
    getExecutionLogs,

    // Refresh functions
    refreshRules,
    refreshExecutionLogs
  };
};
