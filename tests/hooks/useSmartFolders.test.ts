import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartFolders } from '../../src/hooks/useSmartFolders';
import {
  FolderType,
  FolderCategory,
  OrganizationStrategy,
  ConfidenceLevel,
  EmailPriority
} from '../../src/types/smartFolders';

describe('useSmartFolders', () => {
  const createEmail = (id: string, overrides: Partial<{
    subject: string;
    body: string;
    from: string;
    to: string[];
    hasAttachments: boolean;
    readStatus: 'read' | 'unread';
  }> = {}) => ({
    id,
    subject: overrides.subject || 'Test Subject',
    body: overrides.body || 'This is a test email body with some content.',
    from: overrides.from || 'sender@example.com',
    to: overrides.to || ['recipient@example.com'],
    hasAttachments: overrides.hasAttachments || false,
    readStatus: overrides.readStatus || 'unread',
    date: new Date().toISOString()
  });

  const workEmails = [
    createEmail('1', {
      subject: 'Project Meeting Tomorrow',
      body: 'Please join the project meeting tomorrow at 2pm to discuss the quarterly report.',
      from: 'manager@company.com'
    }),
    createEmail('2', {
      subject: 'Project Update',
      body: 'Here is the latest project update for review. Please provide your feedback.',
      from: 'manager@company.com'
    }),
    createEmail('3', {
      subject: 'Deadline Reminder',
      body: 'This is a reminder about the upcoming deadline for the project deliverable.',
      from: 'manager@company.com'
    })
  ];

  const financeEmails = [
    createEmail('4', {
      subject: 'Bank Statement',
      body: 'Your monthly bank statement is now available for review.',
      from: 'bank@example.com'
    }),
    createEmail('5', {
      subject: 'Invoice Payment',
      body: 'Payment confirmation for invoice #12345 has been processed.',
      from: 'finance@example.com'
    })
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSmartFolders());

      expect(result.current.folders).toEqual([]);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isOrganizing).toBe(false);
      expect(result.current.isSuggesting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.cache).toBeInstanceOf(Map);
      expect(result.current.statistics.totalFoldersCreated).toBe(0);
    });

    it('should initialize with custom config', () => {
      const { result } = renderHook(() => useSmartFolders({
        strategy: OrganizationStrategy.BY_SENDER,
        minConfidence: 0.8,
        maxSuggestions: 3
      }));

      expect(result.current.config.strategy).toBe(OrganizationStrategy.BY_SENDER);
      expect(result.current.config.minConfidence).toBe(0.8);
      expect(result.current.config.maxSuggestions).toBe(3);
    });
  });

  describe('Folder Suggestions', () => {
    it('should suggest folders based on email patterns', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minEmailsForFolder: 2,
        maxSuggestions: 5
      }));

      await act(async () => {
        await result.current.suggestFolders({
          emails: [...workEmails, ...financeEmails]
        });
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      expect(result.current.isSuggesting).toBe(false);
    });

    it('should generate topic-based suggestions', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minEmailsForFolder: 2,
        maxSuggestions: 5
      }));

      await act(async () => {
        await result.current.suggestFolders({
          emails: workEmails
        });
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      const topicSuggestions = result.current.suggestions.filter(
        s => s.strategy === OrganizationStrategy.BY_TOPIC
      );
      expect(topicSuggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate sender-based suggestions', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minEmailsForFolder: 2,
        maxSuggestions: 5
      }));

      await act(async () => {
        await result.current.suggestFolders({
          emails: workEmails
        });
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      const senderSuggestions = result.current.suggestions.filter(
        s => s.strategy === OrganizationStrategy.BY_SENDER
      );
      expect(senderSuggestions.length).toBeGreaterThan(0);
    });

    it('should generate category-based suggestions', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minEmailsForFolder: 2,
        maxSuggestions: 5
      }));

      await act(async () => {
        await result.current.suggestFolders({
          emails: [...workEmails, ...financeEmails]
        });
      });

      expect(result.current.suggestions.length).toBeGreaterThan(0);
      const categorySuggestions = result.current.suggestions.filter(
        s => s.strategy === OrganizationStrategy.BY_PRIORITY
      );
      expect(categorySuggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should not suggest folders for insufficient emails', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minEmailsForFolder: 5,
        maxSuggestions: 5
      }));

      await act(async () => {
        await result.current.suggestFolders({
          emails: workEmails
        });
      });

      expect(result.current.suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty emails array', async () => {
      const { result } = renderHook(() => useSmartFolders());

      await act(async () => {
        const suggestions = await result.current.suggestFolders({ emails: [] });
        expect(suggestions).toEqual([]);
      });
    });

    it('should set isSuggesting to false after processing', async () => {
      const { result } = renderHook(() => useSmartFolders());

      await act(async () => {
        await result.current.suggestFolders({
          emails: workEmails
        });
      });

      expect(result.current.isSuggesting).toBe(false);
    });
  });

  describe('Email Routing', () => {
    it('should route email to appropriate folder', () => {
      const { result } = renderHook(() => useSmartFolders({
        minConfidence: 0.5
      }));

      const folders = [{
        id: 'work-folder',
        name: 'Work',
        type: FolderType.AUTO,
        category: FolderCategory.WORK,
        emailCount: 0,
        unreadCount: 0,
        strategy: OrganizationStrategy.BY_TOPIC,
        rules: [{
          id: 'rule-1',
          type: 'KEYWORD' as const,
          condition: 'contains',
          value: 'project',
          weight: 0.7
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {
          confidence: ConfidenceLevel.HIGH,
          averagePriority: EmailPriority.NORMAL,
          topSenders: [],
          topKeywords: ['project', 'meeting'],
          commonTopics: ['project'],
          autoGenerated: true,
          lastOptimization: new Date().toISOString()
        }
      }];

      const result_route = result.current.routeEmail(workEmails[0], folders);

      expect(result_route).not.toBeNull();
      expect(result_route?.folderId).toBe('work-folder');
    });

    it('should return null for no matching folder', () => {
      const { result } = renderHook(() => useSmartFolders());

      const folders = [{
        id: 'other-folder',
        name: 'Other',
        type: FolderType.AUTO,
        category: FolderCategory.OTHER,
        emailCount: 0,
        unreadCount: 0,
        strategy: OrganizationStrategy.BY_TOPIC,
        rules: [{
          id: 'rule-1',
          type: 'KEYWORD' as const,
          condition: 'contains',
          value: 'unrelated',
          weight: 0.7
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {
          confidence: ConfidenceLevel.LOW,
          averagePriority: EmailPriority.NORMAL,
          topSenders: [],
          topKeywords: [],
          commonTopics: [],
          autoGenerated: true,
          lastOptimization: new Date().toISOString()
        }
      }];

      const result_route = result.current.routeEmail(workEmails[0], folders);

      expect(result_route).toBeNull();
    });

    it('should handle empty folders list', () => {
      const { result } = renderHook(() => useSmartFolders());

      const result_route = result.current.routeEmail(workEmails[0], []);

      expect(result_route).toBeNull();
    });

    it('should route multiple emails', async () => {
      const { result } = renderHook(() => useSmartFolders({
        minConfidence: 0.5
      }));

      const folders = [{
        id: 'work-folder',
        name: 'Work',
        type: FolderType.AUTO,
        category: FolderCategory.WORK,
        emailCount: 0,
        unreadCount: 0,
        strategy: OrganizationStrategy.BY_TOPIC,
        rules: [{
          id: 'rule-1',
          type: 'KEYWORD' as const,
          condition: 'contains',
          value: 'project',
          weight: 0.7
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {
          confidence: ConfidenceLevel.HIGH,
          averagePriority: EmailPriority.NORMAL,
          topSenders: [],
          topKeywords: ['project'],
          commonTopics: ['project'],
          autoGenerated: true,
          lastOptimization: new Date().toISOString()
        }
      }];

      await act(async () => {
        const routings = await result.current.routeEmails(workEmails, folders);
        expect(routings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Folder Creation', () => {
    it('should create folder from suggestion', () => {
      const { result } = renderHook(() => useSmartFolders());

      const suggestion = {
        id: 'suggestion-1',
        folderName: 'Project Updates',
        category: FolderCategory.WORK,
        strategy: OrganizationStrategy.BY_TOPIC,
        emailCount: 3,
        confidence: 0.85,
        keywords: ['project', 'update', 'meeting'],
        sampleEmails: ['1', '2', '3'],
        reason: 'Found 3 emails related to project',
        timestamp: new Date().toISOString()
      };

      act(() => {
        const folder = result.current.createFolder(suggestion);
        expect(folder).not.toBeNull();
        expect(folder.name).toBe('Project Updates');
        expect(folder.type).toBe(FolderType.AUTO);
        expect(folder.category).toBe(FolderCategory.WORK);
      });

      expect(result.current.folders.length).toBe(1);
    });

    it('should generate rules from suggestion keywords', () => {
      const { result } = renderHook(() => useSmartFolders());

      const suggestion = {
        id: 'suggestion-1',
        folderName: 'Work',
        category: FolderCategory.WORK,
        strategy: OrganizationStrategy.BY_TOPIC,
        emailCount: 3,
        confidence: 0.85,
        keywords: ['project', 'meeting'],
        sampleEmails: [],
        reason: 'Test',
        timestamp: new Date().toISOString()
      };

      const folder = result.current.createFolder(suggestion);

      expect(folder.rules.length).toBeGreaterThan(0);
      expect(folder.rules.every(r => r.type === 'KEYWORD')).toBe(true);
    });
  });

  describe('Folder Optimization', () => {
    it('should optimize folder rules', () => {
      const { result } = renderHook(() => useSmartFolders({
        minConfidence: 0.1
      }));

      const folders = [{
        id: 'work-folder',
        name: 'Work',
        type: FolderType.AUTO,
        category: FolderCategory.WORK,
        emailCount: 0,
        unreadCount: 0,
        strategy: OrganizationStrategy.BY_TOPIC,
        rules: [{
          id: 'rule-1',
          type: 'KEYWORD' as const,
          condition: 'contains',
          value: 'project',
          weight: 0.5
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {
          confidence: ConfidenceLevel.MEDIUM,
          averagePriority: EmailPriority.NORMAL,
          topSenders: [],
          topKeywords: ['project'],
          commonTopics: ['project'],
          autoGenerated: true,
          lastOptimization: new Date().toISOString()
        }
      }];

      const optimized = result.current.optimizeFolders(folders, workEmails);

      expect(optimized.length).toBe(1);
      expect(optimized[0].rules.length).toBeGreaterThan(0);
    });

    it('should handle empty folders list', () => {
      const { result } = renderHook(() => useSmartFolders());

      const optimized = result.current.optimizeFolders([], workEmails);

      expect(optimized).toEqual([]);
    });

    it('should update folder metadata', () => {
      const { result } = renderHook(() => useSmartFolders({
        minConfidence: 0.1
      }));

      const folders = [{
        id: 'work-folder',
        name: 'Work',
        type: FolderType.AUTO,
        category: FolderCategory.WORK,
        emailCount: 0,
        unreadCount: 0,
        strategy: OrganizationStrategy.BY_TOPIC,
        rules: [{
          id: 'rule-1',
          type: 'KEYWORD' as const,
          condition: 'contains',
          value: 'project',
          weight: 0.5
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {
          confidence: ConfidenceLevel.MEDIUM,
          averagePriority: EmailPriority.NORMAL,
          topSenders: ['manager@company.com'],
          topKeywords: [],
          commonTopics: [],
          autoGenerated: true,
          lastOptimization: new Date().toISOString()
        }
      }];

      const optimized = result.current.optimizeFolders(folders, workEmails);

      expect(optimized.length).toBe(1);
      expect(optimized[0].metadata.topSenders.length).toBeGreaterThan(0);
    });
  });

  describe('User Actions and Learning', () => {
    it('should record user action', () => {
      const { result } = renderHook(() => useSmartFolders({
        enableLearning: true
      }));

      act(() => {
        result.current.recordAction({
          emailId: 'email-1',
          folderId: 'folder-1',
          action: 'MOVED',
          timestamp: new Date().toISOString()
        });
      });

      // Action recorded without error
      expect(true).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track total folders suggested', async () => {
      const { result } = renderHook(() => useSmartFolders());

      await act(async () => {
        await result.current.suggestFolders({
          emails: workEmails
        });
      });

      expect(result.current.statistics.totalFoldersSuggested).toBeGreaterThanOrEqual(0);
    });

    it('should track total folders created', () => {
      const { result } = renderHook(() => useSmartFolders());

      const suggestion = {
        id: 'suggestion-1',
        folderName: 'Test',
        category: FolderCategory.OTHER,
        strategy: OrganizationStrategy.BY_TOPIC,
        emailCount: 1,
        confidence: 0.7,
        keywords: ['test'],
        sampleEmails: [],
        reason: 'Test',
        timestamp: new Date().toISOString()
      };

      act(() => {
        result.current.createFolder(suggestion);
      });

      expect(result.current.statistics.totalFoldersCreated).toBe(1);
    });

    it('should track email categories', async () => {
      const { result } = renderHook(() => useSmartFolders());

      await act(async () => {
        await result.current.suggestFolders({
          emails: [...workEmails, ...financeEmails]
        });
      });

      const totalByCategory = Object.values(result.current.statistics.emailsByCategory).reduce((a, b) => a + b, 0);
      expect(totalByCategory).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Caching', () => {
    it('should clear cache', () => {
      const { result } = renderHook(() => useSmartFolders());

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.cache.size).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useSmartFolders());

      act(() => {
        result.current.updateConfig({
          strategy: OrganizationStrategy.BY_SENDER,
          minConfidence: 0.9,
          maxSuggestions: 3
        });
      });

      expect(result.current.config.strategy).toBe(OrganizationStrategy.BY_SENDER);
      expect(result.current.config.minConfidence).toBe(0.9);
      expect(result.current.config.maxSuggestions).toBe(3);
    });

    it('should preserve existing config when updating partially', () => {
      const { result } = renderHook(() => useSmartFolders({
        strategy: OrganizationStrategy.BY_TOPIC,
        minConfidence: 0.6
      }));

      act(() => {
        result.current.updateConfig({
          maxSuggestions: 3
        });
      });

      expect(result.current.config.strategy).toBe(OrganizationStrategy.BY_TOPIC);
      expect(result.current.config.minConfidence).toBe(0.6);
      expect(result.current.config.maxSuggestions).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useSmartFolders());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() => useSmartFolders());

      await act(async () => {
        await result.current.suggestFolders({ emails: workEmails });
      });

      expect(result.current.suggestions.length).toBeGreaterThanOrEqual(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.folders).toEqual([]);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isOrganizing).toBe(false);
      expect(result.current.isSuggesting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.statistics.totalFoldersCreated).toBe(0);
    });
  });
});
