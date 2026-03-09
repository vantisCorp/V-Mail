import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  EmailRule,
  RuleCondition,
  RuleAction,
  CreateRulePayload,
  UpdateRulePayload,
  RuleTestResult,
  RuleStatistics,
  RuleFilter,
  RuleTemplate,
  EmailContext,
  RuleExecutionContext,
  RuleExecution,
  RuleType,
  RuleStatus,
  RulePriority,
  ConditionLogic,
  RuleFieldType,
  RuleOperator,
  RuleActionType
} from '../types/emailRules';

/**
 * Email Rules & Automation Hook
 *
 * Provides functionality for managing email automation rules including:
 * - Rule CRUD operations
 * - Rule testing and validation
 * - Rule execution on emails
 * - Rule statistics and analytics
 * - Rule templates
 */

const currentUser = {
  id: 'user-1',
  name: 'Current User'
};

// Mock data generators
const generateMockRules = (): EmailRule[] => {
  return [
    {
      id: 'rule-1',
      name: 'Auto-reply to Support Emails',
      description: 'Automatically reply to emails sent to support',
      type: RuleType.AUTO_REPLY,
      status: RuleStatus.ACTIVE,
      priority: RulePriority.HIGH,
      conditions: [
        {
          id: 'cond-1',
          field: RuleFieldType.TO,
          operator: RuleOperator.CONTAINS,
          value: 'support@',
          caseSensitive: false
        }
      ],
      conditionLogic: ConditionLogic.AND,
      actions: [
        {
          id: 'act-1',
          type: RuleActionType.AUTO_REPLY,
          parameters: {
            templateId: 'tpl-support-auto-reply',
            subject: 'Thank you for contacting support'
          },
          stopProcessing: false
        },
        {
          id: 'act-2',
          type: RuleActionType.ADD_LABEL,
          parameters: { label: 'Support' },
          stopProcessing: false
        }
      ],
      triggerOnIncoming: true,
      triggerOnOutgoing: false,
      triggerOnScheduled: false,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: '2025-01-10T09:00:00Z',
      lastExecuted: '2025-01-20T14:30:00Z',
      executionCount: 142,
      executionHistory: []
    },
    {
      id: 'rule-2',
      name: 'Flag Important Emails',
      description: 'Auto-star emails from important contacts',
      type: RuleType.CATEGORIZATION,
      status: RuleStatus.ACTIVE,
      priority: RulePriority.MEDIUM,
      conditions: [
        {
          id: 'cond-2',
          field: RuleFieldType.FROM,
          operator: RuleOperator.CONTAINS,
          value: ['ceo@', 'manager@', 'director@'],
          caseSensitive: false
        }
      ],
      conditionLogic: ConditionLogic.OR,
      actions: [
        {
          id: 'act-3',
          type: RuleActionType.MARK_AS_STARRED,
          parameters: {},
          stopProcessing: false
        },
        {
          id: 'act-4',
          type: RuleActionType.ADD_LABEL,
          parameters: { label: 'Important' },
          stopProcessing: false
        }
      ],
      triggerOnIncoming: true,
      triggerOnOutgoing: false,
      triggerOnScheduled: false,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: '2025-01-08T10:30:00Z',
      lastExecuted: '2025-01-20T11:15:00Z',
      executionCount: 89,
      executionHistory: []
    },
    {
      id: 'rule-3',
      name: 'Newsletter Cleanup',
      description: 'Archive newsletters older than 30 days',
      type: RuleType.CLEANUP,
      status: RuleStatus.ACTIVE,
      priority: RulePriority.LOW,
      conditions: [
        {
          id: 'cond-3',
          field: RuleFieldType.FROM,
          operator: RuleOperator.CONTAINS,
          value: ['newsletter', 'noreply'],
          caseSensitive: false
        }
      ],
      conditionLogic: ConditionLogic.AND,
      actions: [
        {
          id: 'act-5',
          type: RuleActionType.ARCHIVE,
          parameters: {},
          stopProcessing: true
        },
        {
          id: 'act-6',
          type: RuleActionType.MARK_AS_READ,
          parameters: {},
          stopProcessing: false
        }
      ],
      triggerOnIncoming: true,
      triggerOnOutgoing: false,
      triggerOnScheduled: false,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: '2025-01-05T14:00:00Z',
      executionCount: 256,
      executionHistory: []
    }
  ];
};

const generateMockTemplates = (): RuleTemplate[] => {
  return [
    {
      id: 'tpl-1',
      name: 'Vacation Auto-Reply',
      description: 'Automatically reply with vacation message',
      category: 'Auto-Reply',
      type: RuleType.AUTO_REPLY,
      conditions: [
        {
          field: RuleFieldType.FROM,
          operator: RuleOperator.NOT_EQUALS,
          value: ['internal@', 'team@']
        }
      ],
      conditionLogic: ConditionLogic.AND,
      actions: [
        {
          type: RuleActionType.AUTO_REPLY,
          parameters: {
            subject: 'Out of Office',
            message: 'I am currently out of office...'
          }
        }
      ],
      isSystem: true,
      popularity: 234
    },
    {
      id: 'tpl-2',
      name: 'Invoice Processing',
      description: 'Label and forward invoices to finance',
      category: 'Categorization',
      type: RuleType.CATEGORIZATION,
      conditions: [
        {
          field: RuleFieldType.SUBJECT,
          operator: RuleOperator.CONTAINS,
          value: ['invoice', 'payment', 'receipt']
        }
      ],
      conditionLogic: ConditionLogic.OR,
      actions: [
        {
          type: RuleActionType.ADD_LABEL,
          parameters: { label: 'Finance' }
        },
        {
          type: RuleActionType.FORWARD,
          parameters: { to: 'finance@company.com' }
        }
      ],
      isSystem: true,
      popularity: 189
    },
    {
      id: 'tpl-3',
      name: 'Spam Filter',
      description: 'Move suspicious emails to spam',
      category: 'Cleanup',
      type: RuleType.CLEANUP,
      conditions: [
        {
          field: RuleFieldType.SUBJECT,
          operator: RuleOperator.CONTAINS,
          value: ['winner', 'congratulations', 'free money']
        }
      ],
      conditionLogic: ConditionLogic.OR,
      actions: [
        {
          type: RuleActionType.MOVE_TO_FOLDER,
          parameters: { folder: 'Spam' }
        }
      ],
      isSystem: true,
      popularity: 456
    }
  ];
};

export const useEmailRules = () => {
  // State
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<EmailRule | null>(null);

  // Initialize mock data
  useEffect(() => {
    setTimeout(() => {
      setRules(generateMockRules());
      setTemplates(generateMockTemplates());
      setIsLoading(false);
    }, 500);
  }, []);

  // Rule CRUD Operations
  const createRule = useCallback(async (payload: CreateRulePayload): Promise<EmailRule | null> => {
    const newRule: EmailRule = {
      id: `rule-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      status: RuleStatus.ACTIVE,
      priority: payload.priority,
      conditions: payload.conditions.map((c, idx) => ({
        ...c,
        id: `cond-${Date.now()}-${idx}`
      })),
      conditionLogic: payload.conditionLogic,
      actions: payload.actions.map((a, idx) => ({
        ...a,
        id: `act-${Date.now()}-${idx}`
      })),
      triggerOnIncoming: payload.triggerOnIncoming ?? true,
      triggerOnOutgoing: payload.triggerOnOutgoing ?? false,
      triggerOnScheduled: payload.triggerOnScheduled ?? false,
      schedule: payload.schedule,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      executionCount: 0,
      executionHistory: []
    };

    setRules((prev) => [...prev, newRule]);
    return newRule;
  }, []);

  const updateRule = useCallback(async (ruleId: string, payload: UpdateRulePayload): Promise<EmailRule | null> => {
    let updatedRule: EmailRule | null = null;

    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === ruleId) {
          updatedRule = {
            ...rule,
            ...payload,
            conditions: payload.conditions
              ? payload.conditions.map((c, idx) => ({
                  ...c,
                  id: `cond-${Date.now()}-${idx}`
                }))
              : rule.conditions,
            actions: payload.actions
              ? payload.actions.map((a, idx) => ({
                  ...a,
                  id: `act-${Date.now()}-${idx}`
                }))
              : rule.actions,
            updatedBy: currentUser.id,
            updatedByName: currentUser.name,
            updatedAt: new Date().toISOString()
          };
          return updatedRule;
        }
        return rule;
      })
    );

    return updatedRule;
  }, []);

  const deleteRule = useCallback(
    async (ruleId: string): Promise<boolean> => {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      if (selectedRule?.id === ruleId) {
        setSelectedRule(null);
      }
      return true;
    },
    [selectedRule]
  );

  const getRuleById = useCallback(
    (ruleId: string): EmailRule | null => {
      return rules.find((r) => r.id === ruleId) || null;
    },
    [rules]
  );

  // Rule Status Management
  const toggleRuleStatus = useCallback(async (ruleId: string): Promise<boolean> => {
    let success = false;
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === ruleId) {
          success = true;
          const newStatus = rule.status === RuleStatus.ACTIVE ? RuleStatus.PAUSED : RuleStatus.ACTIVE;
          return {
            ...rule,
            status: newStatus,
            updatedBy: currentUser.id,
            updatedByName: currentUser.name,
            updatedAt: new Date().toISOString()
          };
        }
        return rule;
      })
    );
    return success;
  }, []);

  // Rule Testing
  const testRule = useCallback(
    (ruleId: string, email: EmailContext): RuleTestResult => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      const matchedConditions: string[] = [];
      const warnings: string[] = [];

      // Evaluate conditions
      const matches = evaluateConditions(rule.conditions, rule.conditionLogic, email);

      if (matches) {
        rule.conditions.forEach((condition) => {
          if (evaluateCondition(condition, email)) {
            matchedConditions.push(condition.id);
          }
        });

        // Check for potential issues
        rule.actions.forEach((action) => {
          if (action.type === RuleActionType.FORWARD && !action.parameters.to) {
            warnings.push('Forward action missing "to" parameter');
          }
          if (action.type === RuleActionType.MOVE_TO_FOLDER && !action.parameters.folder) {
            warnings.push('Move action missing "folder" parameter');
          }
        });
      }

      return {
        ruleId,
        ruleName: rule.name,
        matches,
        matchedConditions,
        actionsToExecute: matches ? rule.actions : [],
        warnings: warnings.length > 0 ? warnings : undefined
      };
    },
    [rules]
  );

  const evaluateCondition = useCallback((condition: RuleCondition, email: EmailContext): boolean => {
    let value: any;
    const negate = condition.negate || false;

    // Get value from email context
    switch (condition.field) {
      case RuleFieldType.FROM:
        value = email.from;
        break;
      case RuleFieldType.TO:
        value = email.to.join(', ');
        break;
      case RuleFieldType.CC:
        value = email.cc?.join(', ') || '';
        break;
      case RuleFieldType.SUBJECT:
        value = email.subject;
        break;
      case RuleFieldType.BODY:
        value = email.body;
        break;
      case RuleFieldType.ATTACHMENTS:
        value = email.hasAttachments;
        break;
      case RuleFieldType.PRIORITY:
        value = email.priority;
        break;
      case RuleFieldType.LABEL:
        value = email.labels;
        break;
      case RuleFieldType.FOLDER:
        value = email.folder;
        break;
      case RuleFieldType.DATE_RECEIVED:
        value = email.dateReceived;
        break;
      case RuleFieldType.SIZE:
        value = email.size;
        break;
      case RuleFieldType.HEADER:
        value = condition.customHeader ? email.headers?.[condition.customHeader] : '';
        break;
      default:
        return false;
    }

    // Apply operator
    let result = false;
    const conditionValue = condition.value;
    const caseSensitive = condition.caseSensitive || false;

    switch (condition.operator) {
      case RuleOperator.EQUALS:
        result = caseSensitive
          ? String(value) === String(conditionValue)
          : String(value).toLowerCase() === String(conditionValue).toLowerCase();
        break;
      case RuleOperator.NOT_EQUALS:
        result = caseSensitive
          ? String(value) !== String(conditionValue)
          : String(value).toLowerCase() !== String(conditionValue).toLowerCase();
        break;
      case RuleOperator.CONTAINS: {
        const containsValue = caseSensitive ? String(value) : String(value).toLowerCase();
        const containsCondition = caseSensitive ? String(conditionValue) : String(conditionValue).toLowerCase();
        result = containsValue.includes(containsCondition);
        break;
      }
      case RuleOperator.NOT_CONTAINS: {
        const notContainsValue = caseSensitive ? String(value) : String(value).toLowerCase();
        const notContainsCondition = caseSensitive ? String(conditionValue) : String(conditionValue).toLowerCase();
        result = !notContainsValue.includes(notContainsCondition);
        break;
      }
      case RuleOperator.STARTS_WITH: {
        const startsValue = caseSensitive ? String(value) : String(value).toLowerCase();
        const startsCondition = caseSensitive ? String(conditionValue) : String(conditionValue).toLowerCase();
        result = startsValue.startsWith(startsCondition);
        break;
      }
      case RuleOperator.ENDS_WITH: {
        const endsValue = caseSensitive ? String(value) : String(value).toLowerCase();
        const endsCondition = caseSensitive ? String(conditionValue) : String(conditionValue).toLowerCase();
        result = endsValue.endsWith(endsCondition);
        break;
      }
      case RuleOperator.GREATER_THAN:
        result = Number(value) > Number(conditionValue);
        break;
      case RuleOperator.LESS_THAN:
        result = Number(value) < Number(conditionValue);
        break;
      case RuleOperator.REGEX:
        try {
          const regex = new RegExp(String(conditionValue), caseSensitive ? '' : 'i');
          result = regex.test(String(value));
        } catch {
          result = false;
        }
        break;
      case RuleOperator.IS_EMPTY:
        result = !value || (Array.isArray(value) && value.length === 0);
        break;
      case RuleOperator.IS_NOT_EMPTY:
        result = value && (!Array.isArray(value) || value.length > 0);
        break;
    }

    return negate ? !result : result;
  }, []);

  const evaluateConditions = useCallback(
    (conditions: RuleCondition[], logic: ConditionLogic, email: EmailContext): boolean => {
      if (conditions.length === 0) {
        return true;
      }

      if (logic === ConditionLogic.AND) {
        return conditions.every((condition) => evaluateCondition(condition, email));
      } else {
        return conditions.some((condition) => evaluateCondition(condition, email));
      }
    },
    [evaluateCondition]
  );

  // Rule Execution
  const executeRule = useCallback(
    async (ruleId: string, email: EmailContext, dryRun: boolean = false): Promise<boolean> => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) {
        return false;
      }

      const startTime = Date.now();
      const matches = evaluateConditions(rule.conditions, rule.conditionLogic, email);

      if (!matches) {
        return false;
      }

      const execution: RuleExecution = {
        id: `exec-${Date.now()}`,
        ruleId,
        ruleName: rule.name,
        emailId: email.id,
        emailSubject: email.subject,
        emailFrom: email.from,
        triggeredAt: new Date().toISOString(),
        executedAt: new Date().toISOString(),
        duration: 0,
        success: true,
        actionsExecuted: []
      };

      if (!dryRun) {
        // Execute actions (in a real implementation, this would call actual email operations)
        const actionsExecuted: string[] = [];
        for (const action of rule.actions) {
          try {
            // Simulate action execution
            actionsExecuted.push(action.id);
            if (action.stopProcessing) {
              break;
            }
          } catch (error) {
            execution.success = false;
            execution.errorMessage = String(error);
            break;
          }
        }
        execution.actionsExecuted = actionsExecuted;

        // Update rule execution history
        setRules((prev) =>
          prev.map((r) => {
            if (r.id === ruleId) {
              return {
                ...r,
                executionCount: r.executionCount + 1,
                lastExecuted: new Date().toISOString(),
                executionHistory: [execution, ...r.executionHistory].slice(0, 100)
              };
            }
            return r;
          })
        );
      }

      execution.duration = Date.now() - startTime;
      return true;
    },
    [rules, evaluateConditions]
  );

  // Rule Statistics
  const getRuleStatistics = useCallback(
    (ruleId: string): RuleStatistics | null => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) {
        return null;
      }

      const successfulExecutions = rule.executionHistory.filter((e) => e.success).length;
      const failedExecutions = rule.executionHistory.filter((e) => !e.success).length;

      return {
        ruleId,
        ruleName: rule.name,
        totalExecutions: rule.executionCount,
        successfulExecutions,
        failedExecutions,
        successRate: rule.executionCount > 0 ? (successfulExecutions / rule.executionCount) * 100 : 0,
        avgExecutionTime:
          rule.executionHistory.length > 0
            ? rule.executionHistory.reduce((sum, e) => sum + e.duration, 0) / rule.executionHistory.length
            : 0,
        lastExecuted: rule.lastExecuted || '',
        executionsByDay: [],
        executionsByHour: [],
        topTriggeredConditions: []
      };
    },
    [rules]
  );

  // Rule Filtering
  const getFilteredRules = useCallback(
    (filter: RuleFilter): EmailRule[] => {
      return rules.filter((rule) => {
        if (filter.type && rule.type !== filter.type) {
          return false;
        }
        if (filter.status && rule.status !== filter.status) {
          return false;
        }
        if (filter.priority && rule.priority !== filter.priority) {
          return false;
        }
        if (filter.createdBy && rule.createdBy !== filter.createdBy) {
          return false;
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          const matchName = rule.name.toLowerCase().includes(query);
          const matchDescription = rule.description?.toLowerCase().includes(query);
          if (!matchName && !matchDescription) {
            return false;
          }
        }

        return true;
      });
    },
    [rules]
  );

  // Template Operations
  const createRuleFromTemplate = useCallback(
    async (templateId: string, name: string, priority: RulePriority): Promise<EmailRule | null> => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return null;
      }

      return createRule({
        name,
        description: template.description,
        type: template.type,
        priority,
        conditions: template.conditions,
        conditionLogic: template.conditionLogic,
        actions: template.actions
      });
    },
    [templates, createRule]
  );

  return {
    // State
    rules,
    templates,
    isLoading,
    selectedRule,

    // Setters
    setSelectedRule,

    // Rule CRUD
    createRule,
    updateRule,
    deleteRule,
    getRuleById,
    toggleRuleStatus,

    // Rule Testing
    testRule,
    evaluateCondition,
    evaluateConditions,

    // Rule Execution
    executeRule,

    // Statistics
    getRuleStatistics,

    // Filtering
    getFilteredRules,

    // Templates
    createRuleFromTemplate
  };
};
