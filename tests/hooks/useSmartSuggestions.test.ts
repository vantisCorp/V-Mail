import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSmartSuggestions
} from '../../src/hooks/useSmartSuggestions';
import {
  SuggestionType,
  SuggestionContext,
  ReplyCategory,
  QuickActionType,
  FollowUpAction,
  RecipientType,
  SuggestionPriority
} from '../../src/types/smartSuggestions';

const mockEmailContext: SuggestionContext = {
  emailId: 'email-123',
  subject: 'Meeting Tomorrow',
  sender: 'john@example.com',
  recipients: ['jane@example.com'],
  content: 'Hi Jane, would you be available for a meeting tomorrow at 2 PM to discuss the project? Let me know your availability.',
  attachments: [],
  threadLength: 1,
  timestamp: new Date()
};

const mockFollowUpContext: SuggestionContext = {
  emailId: 'email-456',
  subject: 'Re: Project Update',
  sender: 'boss@company.com',
  recipients: ['me@company.com'],
  content: 'I will follow up with you next week regarding the project status. Please prepare the documentation.',
  attachments: [],
  threadLength: 3,
  timestamp: new Date()
};

const mockAttachmentContext: SuggestionContext = {
  emailId: 'email-789',
  subject: 'Invoice for Services',
  sender: 'billing@company.com',
  recipients: ['me@company.com'],
  content: 'Please find attached the invoice for last month\'s services. Kindly review and process payment.',
  attachments: ['invoice.pdf'],
  timestamp: new Date()
};

const mockPromoContext: SuggestionContext = {
  emailId: 'email-promo',
  subject: 'CONGRATULATIONS! You won!',
  sender: 'lottery@spam.com',
  recipients: ['me@company.com'],
  content: 'Congratulations! You have won a FREE prize! Click here to claim your lottery winnings NOW!',
  timestamp: new Date()
};

describe('useSmartSuggestions Hook', () => {
  let result: { current: ReturnType<typeof useSmartSuggestions> };

  beforeEach(() => {
    localStorage.clear();
    const { result: hookResult } = renderHook(() => useSmartSuggestions());
    result = hookResult;
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.lastResult).toBeNull();
    });

    it('should initialize with empty statistics', () => {
      const stats = result.current.statistics;
      expect(stats.totalSuggestions).toBe(0);
      expect(stats.acceptedSuggestions).toBe(0);
      expect(stats.rejectedSuggestions).toBe(0);
      expect(stats.acceptanceRate).toBe(0);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for a valid email context', async () => {
      let suggestionResult;

      await act(async () => {
        suggestionResult = await result.current.generateSuggestions(mockEmailContext);
      });

      expect(suggestionResult).toBeDefined();
      expect(suggestionResult!.suggestions.length).toBeGreaterThan(0);
      expect(suggestionResult!.context.emailId).toBe('email-123');
      expect(suggestionResult!.modelVersion).toBeDefined();
      expect(suggestionResult!.processingTime).toBeLessThan(100);
    });

    it('should update suggestions state after generation', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      expect(result.current.lastResult).not.toBeNull();
    });

    it('should use cached suggestions on subsequent calls', async () => {
      let firstResult;
      let secondResult;

      await act(async () => {
        firstResult = await result.current.generateSuggestions(mockEmailContext);
      });

      await act(async () => {
        secondResult = await result.current.generateSuggestions(mockEmailContext);
      });

      expect(firstResult).toBe(secondResult);
    });

    it('should generate suggestions with correct metadata', async () => {
      let suggestionResult;

      await act(async () => {
        suggestionResult = await result.current.generateSuggestions(mockEmailContext);
      });

      expect(suggestionResult!.metadata).toBeDefined();
      expect(suggestionResult!.metadata.totalSuggestions).toBeGreaterThan(0);
      expect(suggestionResult!.metadata.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(suggestionResult!.metadata.avgConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('reply suggestions', () => {
    it('should generate reply suggestions', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const replySuggestions = result.current.getReplySuggestions('email-123');
      expect(replySuggestions.length).toBeGreaterThanOrEqual(0);

      replySuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.REPLY);
        expect(suggestion.text).toBeDefined();
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should categorize reply suggestions correctly', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const replySuggestions = result.current.getReplySuggestions('email-123');

      replySuggestions.forEach(suggestion => {
        expect(Object.values(ReplyCategory)).toContain(suggestion.category);
      });
    });

    it('should generate scheduling reply for meeting email', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const replySuggestions = result.current.getReplySuggestions('email-123');
      const schedulingSuggestion = replySuggestions.find(
        s => s.category === ReplyCategory.SCHEDULING
      );

      if (schedulingSuggestion) {
        expect(schedulingSuggestion.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('quick action suggestions', () => {
    it('should generate quick action suggestions', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const actionSuggestions = result.current.getQuickActionSuggestions('email-123');
      expect(actionSuggestions.length).toBeGreaterThanOrEqual(0);

      actionSuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.QUICK_ACTION);
        expect(Object.values(QuickActionType)).toContain(suggestion.action);
        expect(suggestion.reason).toBeDefined();
      });
    });

    it('should suggest spam action for lottery email', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockPromoContext);
      });

      const actionSuggestions = result.current.getQuickActionSuggestions('email-promo');
      const spamSuggestion = actionSuggestions.find(
        s => s.action === QuickActionType.MOVE_TO_SPAM
      );

      expect(spamSuggestion).toBeDefined();
      expect(spamSuggestion?.confidence).toBeGreaterThan(0.5);
    });

    it('should have valid priority for quick actions', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const actionSuggestions = result.current.getQuickActionSuggestions('email-123');

      actionSuggestions.forEach(suggestion => {
        expect(Object.values(SuggestionPriority)).toContain(suggestion.priority);
      });
    });
  });

  describe('follow-up suggestions', () => {
    it('should generate follow-up suggestions', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockFollowUpContext);
      });

      const followUpSuggestions = result.current.getFollowUpSuggestions('email-456');
      expect(followUpSuggestions.length).toBeGreaterThanOrEqual(0);

      followUpSuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.FOLLOW_UP);
        expect(Object.values(FollowUpAction)).toContain(suggestion.action);
        expect(suggestion.reason).toBeDefined();
      });
    });

    it('should suggest follow-up for "next week" mention', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockFollowUpContext);
      });

      const followUpSuggestions = result.current.getFollowUpSuggestions('email-456');
      const weekFollowUp = followUpSuggestions.find(
        s => s.action === FollowUpAction.REMIND_WEEK
      );

      expect(weekFollowUp).toBeDefined();
      expect(weekFollowUp?.reason).toBeDefined();
    });

    it('should suggest follow-up for long threads', async () => {
      const longThreadContext: SuggestionContext = {
        ...mockEmailContext,
        emailId: 'long-thread',
        threadLength: 5
      };

      await act(async () => {
        await result.current.generateSuggestions(longThreadContext);
      });

      const followUpSuggestions = result.current.getFollowUpSuggestions('long-thread');
      expect(followUpSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('attachment suggestions', () => {
    it('should generate attachment suggestions when keywords present', async () => {
      const attachmentContext: SuggestionContext = {
        ...mockEmailContext,
        emailId: 'attachment-email',
        content: 'Please find attached the invoice for your review.'
      };

      await act(async () => {
        await result.current.generateSuggestions(attachmentContext);
      });

      const attachmentSuggestions = result.current.getAttachmentSuggestions('attachment-email');

      attachmentSuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.ATTACHMENT);
        expect(suggestion.fileName).toBeDefined();
        expect(suggestion.fileType).toBeDefined();
      });
    });

    it('should not crash when no attachment keywords', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const attachmentSuggestions = result.current.getAttachmentSuggestions('email-123');
      expect(Array.isArray(attachmentSuggestions)).toBe(true);
    });
  });

  describe('recipient suggestions', () => {
    it('should generate recipient suggestions', async () => {
      const teamContext: SuggestionContext = {
        ...mockEmailContext,
        emailId: 'team-email',
        content: 'I need to discuss this with my manager and the team.'
      };

      await act(async () => {
        await result.current.generateSuggestions(teamContext);
      });

      const recipientSuggestions = result.current.getRecipientSuggestions('team-email');

      recipientSuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.RECIPIENT);
        expect(Object.values(RecipientType)).toContain(suggestion.recipientType);
        expect(suggestion.email).toBeDefined();
        expect(suggestion.name).toBeDefined();
      });
    });
  });

  describe('label suggestions', () => {
    it('should generate label suggestions based on content', async () => {
      const projectContext: SuggestionContext = {
        ...mockEmailContext,
        emailId: 'project-email',
        subject: 'Project Update',
        content: 'Here is the latest update on the project milestone.'
      };

      await act(async () => {
        await result.current.generateSuggestions(projectContext);
      });

      const labelSuggestions = result.current.getLabelSuggestions('project-email');

      labelSuggestions.forEach(suggestion => {
        expect(suggestion.type).toBe(SuggestionType.LABEL);
        expect(suggestion.label).toBeDefined();
        expect(suggestion.color).toBeDefined();
      });
    });

    it('should suggest Finance label for invoice emails', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockAttachmentContext);
      });

      const labelSuggestions = result.current.getLabelSuggestions('email-789');
      const financeLabel = labelSuggestions.find(s => s.label === 'Finance');

      expect(financeLabel).toBeDefined();
    });

    it('should suggest Meeting label for meeting emails', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const labelSuggestions = result.current.getLabelSuggestions('email-123');
      const meetingLabel = labelSuggestions.find(s => s.label === 'Meeting');

      expect(meetingLabel).toBeDefined();
    });
  });

  describe('batchGenerateSuggestions', () => {
    it('should generate suggestions for multiple emails', async () => {
      const contexts = [mockEmailContext, mockFollowUpContext, mockAttachmentContext];
      let results;

      await act(async () => {
        results = await result.current.batchGenerateSuggestions(contexts);
      });

      expect(results!.length).toBe(3);
      results!.forEach((r: any, index: number) => {
        expect(r.suggestions.length).toBeGreaterThanOrEqual(0);
        expect(r.context.emailId).toBe(contexts[index].emailId);
      });
    });

    it('should handle empty array', async () => {
      let results;

      await act(async () => {
        results = await result.current.batchGenerateSuggestions([]);
      });

      expect(results!.length).toBe(0);
    });
  });

  describe('acceptSuggestion', () => {
    it('should update statistics when accepting suggestion', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const suggestions = result.current.suggestions;
      if (suggestions.length > 0) {
        await act(async () => {
          result.current.acceptSuggestion(suggestions[0].id);
        });

        const stats = result.current.statistics;
        expect(stats.acceptedSuggestions).toBe(1);
        expect(stats.acceptanceRate).toBe(1);
      }
    });

    it('should add feedback to recent feedback', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const suggestions = result.current.suggestions;
      if (suggestions.length > 0) {
        await act(async () => {
          result.current.acceptSuggestion(suggestions[0].id);
        });

        const stats = result.current.statistics;
        expect(stats.recentFeedback.length).toBe(1);
        expect(stats.recentFeedback[0].accepted).toBe(true);
      }
    });
  });

  describe('rejectSuggestion', () => {
    it('should update statistics when rejecting suggestion', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const suggestions = result.current.suggestions;
      if (suggestions.length > 0) {
        await act(async () => {
          result.current.rejectSuggestion(suggestions[0].id);
        });

        const stats = result.current.statistics;
        expect(stats.rejectedSuggestions).toBe(1);
        expect(stats.acceptanceRate).toBe(0);
      }
    });
  });

  describe('addFeedback', () => {
    it('should add detailed feedback', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const suggestions = result.current.suggestions;
      if (suggestions.length > 0) {
        await act(async () => {
          result.current.addFeedback(suggestions[0].id, {
            suggestionId: suggestions[0].id,
            accepted: true,
            timestamp: new Date(),
            rating: 4,
            comment: 'Great suggestion!'
          });
        });

        const stats = result.current.statistics;
        expect(stats.recentFeedback.length).toBe(1);
        expect(stats.recentFeedback[0].rating).toBe(4);
        expect(stats.recentFeedback[0].comment).toBe('Great suggestion!');
      }
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = result.current.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxSuggestions).toBeDefined();
      expect(config.minConfidence).toBeDefined();
    });

    it('should update configuration', async () => {
      await act(async () => {
        result.current.updateConfig({ maxSuggestions: 5 });
      });

      const config = result.current.getConfig();
      expect(config.maxSuggestions).toBe(5);
    });
  });

  describe('clearSuggestions', () => {
    it('should clear all suggestions', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);

      await act(async () => {
        result.current.clearSuggestions();
      });

      expect(result.current.suggestions.length).toBe(0);
      expect(result.current.lastResult).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should return current statistics', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const stats = result.current.getStatistics();
      expect(stats.totalSuggestions).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      await act(async () => {
        result.current.resetStatistics();
      });

      const stats = result.current.statistics;
      expect(stats.totalSuggestions).toBe(0);
      expect(stats.acceptedSuggestions).toBe(0);
    });
  });

  describe('resetLearning', () => {
    it('should reset all learning data', async () => {
      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const suggestions = result.current.suggestions;
      if (suggestions.length > 0) {
        await act(async () => {
          result.current.acceptSuggestion(suggestions[0].id);
        });
      }

      await act(async () => {
        result.current.resetLearning();
      });

      const stats = result.current.statistics;
      expect(stats.totalSuggestions).toBe(0);
      expect(stats.recentFeedback.length).toBe(0);
    });
  });

  describe('performance', () => {
    it('should generate suggestions within 100ms', async () => {
      const start = performance.now();

      await act(async () => {
        await result.current.generateSuggestions(mockEmailContext);
      });

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('should batch process efficiently', async () => {
      const contexts = Array.from({ length: 10 }, (_, i) => ({
        ...mockEmailContext,
        emailId: `email-${i}`
      }));

      const start = performance.now();

      await act(async () => {
        await result.current.batchGenerateSuggestions(contexts);
      });

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
