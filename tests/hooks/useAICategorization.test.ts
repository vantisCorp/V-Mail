import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAICategorization } from '../../src/hooks/useAICategorization';
import { EmailCategory } from '../../src/types/aiCategorization';

describe('useAICategorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useAICategorization());

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isTraining).toBe(false);
      expect(result.current.allCategories.length).toBeGreaterThan(0);
    });

    it('should categorize an email', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-1',
        from: 'john@company.com',
        to: ['user@example.com'],
        subject: 'Project Update - Meeting Tomorrow',
        body: 'Hi, we have a project meeting tomorrow at 2pm. Please attend.',
        timestamp: new Date().toISOString(),
        priority: 'normal',
        attachments: []
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult).toBeDefined();
      expect(categorizationResult.primary).toBeDefined();
      expect(categorizationResult.primary.category).toBeDefined();
      expect(categorizationResult.primary.confidence).toBeGreaterThanOrEqual(0);
      expect(categorizationResult.primary.confidence).toBeLessThanOrEqual(1);
      expect(categorizationResult.alternatives).toBeDefined();
      expect(categorizationResult.modelVersion).toBeDefined();
      expect(categorizationResult.processingTime).toBeGreaterThan(0);
    });

    it('should categorize a promotional email correctly', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-2',
        from: 'promo@marketing.com',
        to: ['user@example.com'],
        subject: '50% OFF - Limited Time Offer!',
        body: "Don't miss our amazing sale! 50% off everything. Buy now before it expires. Unsubscribe: link",
        timestamp: new Date().toISOString(),
        priority: 'low',
        attachments: []
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult.primary.category).toBe(EmailCategory.PROMOTIONS);
      expect(categorizationResult.primary.confidence).toBeGreaterThan(0.5);
    });

    it('should categorize a work email correctly', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-3',
        from: 'colleague@company.com',
        to: ['user@example.com'],
        subject: 'Review needed for Q4 report',
        body: 'Please review the attached Q4 report and provide feedback by Friday.',
        timestamp: new Date().toISOString(),
        priority: 'high',
        attachments: [{ type: 'application/pdf' }]
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult.primary.category).toBe(EmailCategory.WORK);
      expect(categorizationResult.primary.confidence).toBeGreaterThan(0.5);
    });

    it('should categorize a personal email correctly', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-4',
        from: 'friend@gmail.com',
        to: ['user@example.com'],
        subject: 'Dinner this weekend?',
        body: 'Hey! Want to grab dinner this weekend? Let me know what works for you.',
        timestamp: new Date().toISOString(),
        priority: 'normal',
        attachments: []
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult.primary.category).toBe(EmailCategory.PERSONAL);
      expect(categorizationResult.primary.confidence).toBeGreaterThan(0.4);
    });

    it('should categorize a finance email correctly', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-5',
        from: 'bank@finance.com',
        to: ['user@example.com'],
        subject: 'Your monthly statement is ready',
        body: 'Your monthly bank statement for October is now available. View your payment history.',
        timestamp: new Date().toISOString(),
        priority: 'normal',
        attachments: []
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult.primary.category).toBe(EmailCategory.FINANCE);
      expect(categorizationResult.primary.confidence).toBeGreaterThan(0.4);
    });
  });

  describe('Batch Categorization', () => {
    it('should batch categorize multiple emails', async () => {
      const { result } = renderHook(() => useAICategorization());

      const emails = [
        {
          id: 'email-1',
          from: 'john@company.com',
          to: ['user@example.com'],
          subject: 'Project Meeting',
          body: 'Meeting at 2pm',
          timestamp: new Date().toISOString()
        },
        {
          id: 'email-2',
          from: 'promo@marketing.com',
          to: ['user@example.com'],
          subject: 'SALE!',
          body: 'Buy now',
          timestamp: new Date().toISOString()
        },
        {
          id: 'email-3',
          from: 'friend@gmail.com',
          to: ['user@example.com'],
          subject: 'Dinner?',
          body: "Let's eat",
          timestamp: new Date().toISOString()
        }
      ];

      let batchResult;
      await act(async () => {
        batchResult = await result.current.batchCategorize(emails);
      });

      expect(batchResult).toBeDefined();
      expect(batchResult.processedCount).toBe(3);
      expect(batchResult.failedCount).toBe(0);
      expect(batchResult.results.size).toBe(3);
      expect(batchResult.totalTime).toBeGreaterThan(0);
    });

    it('should handle errors in batch categorization', async () => {
      const { result } = renderHook(() => useAICategorization());

      const emails = [
        {
          id: 'email-1',
          from: 'john@company.com',
          to: ['user@example.com'],
          subject: 'Project Meeting',
          body: 'Meeting at 2pm',
          timestamp: new Date().toISOString()
        },
        // Invalid email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        null as any
      ];

      let batchResult;
      await act(async () => {
        batchResult = await result.current.batchCategorize(emails);
      });

      expect(batchResult.processedCount).toBe(1);
      expect(batchResult.failedCount).toBe(1);
    });
  });

  describe('Custom Categories', () => {
    it('should create a custom category', () => {
      const { result } = renderHook(() => useAICategorization());

      act(() => {
        result.current.createCustomCategory({
          name: 'Family',
          description: 'Emails from family members',
          icon: 'heart',
          color: '#ff6b6b',
          keywords: ['mom', 'dad', 'sister', 'brother'],
          senders: ['family@domain.com'],
          subjects: ['family'],
          examples: []
        });
      });

      expect(result.current.customCategories).toHaveLength(1);
      expect(result.current.customCategories[0].name).toBe('Family');
      expect(result.current.customCategories[0].id).toBeDefined();
      expect(result.current.customCategories[0].createdAt).toBeDefined();
    });

    it('should update a custom category', () => {
      const { result } = renderHook(() => useAICategorization());

      let categoryId: string;
      act(() => {
        const category = result.current.createCustomCategory({
          name: 'Family',
          description: 'Emails from family',
          icon: 'heart',
          color: '#ff6b6b',
          keywords: [],
          senders: [],
          subjects: [],
          examples: []
        });
        categoryId = category.id;
      });

      act(() => {
        result.current.updateCustomCategory(categoryId, {
          name: 'Extended Family',
          description: 'Emails from extended family members'
        });
      });

      const updated = result.current.customCategories.find((c) => c.id === categoryId);
      expect(updated?.name).toBe('Extended Family');
      expect(updated?.description).toBe('Emails from extended family members');
    });

    it('should delete a custom category', () => {
      const { result } = renderHook(() => useAICategorization());

      let categoryId: string;
      act(() => {
        const category = result.current.createCustomCategory({
          name: 'Test',
          description: 'Test category',
          icon: 'test',
          color: '#000000',
          keywords: [],
          senders: [],
          subjects: [],
          examples: []
        });
        categoryId = category.id;
      });

      expect(result.current.customCategories).toHaveLength(1);

      act(() => {
        result.current.deleteCustomCategory(categoryId);
      });

      expect(result.current.customCategories).toHaveLength(0);
    });
  });

  describe('Categorization Rules', () => {
    it('should create a rule', () => {
      const { result } = renderHook(() => useAICategorization());

      act(() => {
        result.current.createRule({
          categoryId: EmailCategory.IMPORTANT,
          name: 'Urgent emails',
          enabled: true,
          priority: 0,
          conditions: [
            {
              field: 'subject',
              operator: 'contains',
              value: 'urgent',
              caseSensitive: false
            }
          ],
          logicOperator: 'or'
        });
      });

      expect(result.current.categorizationRules).toHaveLength(1);
      expect(result.current.categorizationRules[0].name).toBe('Urgent emails');
    });

    it('should apply rules before ML categorization', async () => {
      const { result } = renderHook(() => useAICategorization());

      act(() => {
        result.current.createRule({
          categoryId: EmailCategory.IMPORTANT,
          name: 'Mark urgent as important',
          enabled: true,
          priority: 0,
          conditions: [
            {
              field: 'subject',
              operator: 'contains',
              value: 'urgent',
              caseSensitive: false
            }
          ],
          logicOperator: 'or'
        });
      });

      const email = {
        id: 'email-1',
        from: 'someone@company.com',
        to: ['user@example.com'],
        subject: 'URGENT: Action required',
        body: 'Please respond immediately',
        timestamp: new Date().toISOString()
      };

      let categorizationResult;
      await act(async () => {
        categorizationResult = await result.current.categorizeEmail(email);
      });

      expect(categorizationResult.primary.category).toBe(EmailCategory.IMPORTANT);
      expect(categorizationResult.primary.confidence).toBe(1.0);
      expect(categorizationResult.primary.reasoning).toContain('rule');
    });

    it('should update a rule', () => {
      const { result } = renderHook(() => useAICategorization());

      let ruleId: string;
      act(() => {
        const rule = result.current.createRule({
          categoryId: EmailCategory.IMPORTANT,
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          conditions: [],
          logicOperator: 'or'
        });
        ruleId = rule.id;
      });

      act(() => {
        result.current.updateRule(ruleId, {
          enabled: false,
          name: 'Disabled Rule'
        });
      });

      const updated = result.current.categorizationRules.find((r) => r.id === ruleId);
      expect(updated?.enabled).toBe(false);
      expect(updated?.name).toBe('Disabled Rule');
    });

    it('should delete a rule', () => {
      const { result } = renderHook(() => useAICategorization());

      let ruleId: string;
      act(() => {
        const rule = result.current.createRule({
          categoryId: EmailCategory.IMPORTANT,
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          conditions: [],
          logicOperator: 'or'
        });
        ruleId = rule.id;
      });

      expect(result.current.categorizationRules).toHaveLength(1);

      act(() => {
        result.current.deleteRule(ruleId);
      });

      expect(result.current.categorizationRules).toHaveLength(0);
    });
  });

  describe('Training', () => {
    it('should add training example', () => {
      const { result } = renderHook(() => useAICategorization());

      act(() => {
        result.current.addTrainingExample({
          emailId: 'email-1',
          categoryId: EmailCategory.WORK,
          userId: 'user-1',
          feedbackType: 'positive'
        });
      });

      expect(result.current.trainingExamples).toHaveLength(1);
      expect(result.current.trainingExamples[0].emailId).toBe('email-1');
      expect(result.current.trainingExamples[0].categoryId).toBe(EmailCategory.WORK);
    });

    it('should not trigger auto-training when disabled', () => {
      const { result } = renderHook(() =>
        useAICategorization({
          enableAutoTraining: false
        })
      );

      act(() => {
        result.current.addTrainingExample({
          emailId: 'email-1',
          categoryId: EmailCategory.WORK,
          userId: 'user-1',
          feedbackType: 'positive'
        });
      });

      // Should not be training
      expect(result.current.isTraining).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      const { result } = renderHook(() => useAICategorization());

      const emails = [
        {
          id: 'email-1',
          from: 'john@company.com',
          to: ['user@example.com'],
          subject: 'Work email',
          body: 'Project update',
          timestamp: new Date().toISOString()
        },
        {
          id: 'email-2',
          from: 'friend@gmail.com',
          to: ['user@example.com'],
          subject: 'Personal email',
          body: "Let's meet",
          timestamp: new Date().toISOString()
        }
      ];

      await act(async () => {
        await result.current.batchCategorize(emails);
      });

      const stats = result.current.getStatistics();

      expect(stats.totalEmailsCategorized).toBe(2);
      expect(stats.categoryCounts).toBeDefined();
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.modelVersion).toBeDefined();
      expect(stats.processingTimeAvg).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should toggle enabled state', () => {
      const { result } = renderHook(() => useAICategorization());

      expect(result.current.isEnabled).toBe(true);

      act(() => {
        result.current.toggleEnabled();
      });

      expect(result.current.isEnabled).toBe(false);

      act(() => {
        result.current.toggleEnabled();
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should throw error when categorization disabled', async () => {
      const { result } = renderHook(() =>
        useAICategorization({
          enabled: false
        })
      );

      const email = {
        id: 'email-1',
        from: 'john@company.com',
        to: ['user@example.com'],
        subject: 'Test',
        body: 'Test body',
        timestamp: new Date().toISOString()
      };

      await expect(async () => {
        await result.current.categorizeEmail(email);
      }).rejects.toThrow('Categorization is disabled');
    });

    it('should update configuration', () => {
      const { result } = renderHook(() => useAICategorization());

      act(() => {
        result.current.updateConfig({
          minConfidence: 0.8,
          maxAlternatives: 2
        });
      });

      expect(result.current.modelConfig.minConfidence).toBe(0.8);
      expect(result.current.modelConfig.maxAlternatives).toBe(2);
    });
  });

  describe('Utilities', () => {
    it('should clear categorization results', async () => {
      const { result } = renderHook(() => useAICategorization());

      const email = {
        id: 'email-1',
        from: 'john@company.com',
        to: ['user@example.com'],
        subject: 'Test',
        body: 'Test',
        timestamp: new Date().toISOString()
      };

      await act(async () => {
        await result.current.categorizeEmail(email);
      });

      expect(result.current.categorizationResults.size).toBe(1);

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.categorizationResults.size).toBe(0);
    });
  });
});
