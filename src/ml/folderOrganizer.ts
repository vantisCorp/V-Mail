/**
 * Smart Folder Organizer ML Model
 * Part of v1.4.0 AI-Powered Intelligence
 */

import {
  EmailForOrganization,
  SmartFolder,
  FolderType,
  FolderCategory,
  OrganizationStrategy,
  ConfidenceLevel,
  EmailPriority,
  FolderRule,
  FolderMetadata,
  Suggestion,
  RoutingResult,
  OrganizationConfig,
  OrganizationStatistics,
  UserAction,
  OrganizationContext,
  DEFAULT_ORGANIZATION_CONFIG,
  CONFIDENCE_THRESHOLDS,
  WORK_KEYWORDS,
  PERSONAL_KEYWORDS,
  PROMOTIONS_KEYWORDS,
  FINANCE_KEYWORDS,
  TRAVEL_KEYWORDS,
  SHOPPING_KEYWORDS,
  NEWSLETTER_KEYWORDS,
  URGENT_KEYWORDS,
  SYSTEM_SENDERS
} from '../types/smartFolders';

export type { OrganizationContext };

// ============================================================================
// Smart Folder Organizer Model Class
// ============================================================================

export class FolderOrganizer {
  private config: OrganizationConfig;
  private modelVersion: string = '1.0.0';
  private cache: Map<string, any>;
  private learningData: {
    userActions: UserAction[];
    folderPatterns: Map<string, number>;
    senderPatterns: Map<string, string>;
    keywordPatterns: Map<string, number>;
    learningEnabled: boolean;
  };

  constructor(config?: Partial<OrganizationConfig>) {
    this.config = { ...DEFAULT_ORGANIZATION_CONFIG, ...config };
    this.cache = new Map();
    this.learningData = {
      userActions: [],
      folderPatterns: new Map(),
      senderPatterns: new Map(),
      keywordPatterns: new Map(),
      learningEnabled: this.config.enableLearning
    };
  }

  // ============================================================================
  // Main Organization Methods
  // ============================================================================

  /**
   * Suggest new folders based on email patterns
   */
  suggestFolders(context: OrganizationContext): Suggestion[] {
    const startTime = performance.now();
    const emails = context.emails;

    if (emails.length === 0) {
      return [];
    }

    // Analyze emails to find patterns
    const patterns = this.analyzePatterns(emails);

    // Generate suggestions based on patterns
    const suggestions: Suggestion[] = [];

    // Generate topic-based suggestions
    const topicSuggestions = this.generateTopicSuggestions(patterns, emails);
    suggestions.push(...topicSuggestions);

    // Generate sender-based suggestions
    const senderSuggestions = this.generateSenderSuggestions(patterns, emails);
    suggestions.push(...senderSuggestions);

    // Generate category-based suggestions
    const categorySuggestions = this.generateCategorySuggestions(patterns, emails);
    suggestions.push(...categorySuggestions);

    // Sort by confidence and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxSuggestions);

    const endTime = performance.now();

    return sortedSuggestions.map((s) => ({
      ...s,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Route an email to the most appropriate folder
   */
  routeEmail(email: EmailForOrganization, folders: SmartFolder[]): RoutingResult | null {
    if (folders.length === 0) {
      return null;
    }

    const scores = folders.map((folder) => ({
      folderId: folder.id,
      confidence: this.calculateFolderMatch(email, folder)
    }));

    // Sort by confidence
    scores.sort((a, b) => b.confidence - a.confidence);

    const bestMatch = scores[0];

    // Check if meets minimum confidence
    if (bestMatch.confidence < this.config.minConfidence) {
      return null;
    }

    // Generate alternative folders
    const alternatives = scores.slice(1, 4).map((s) => ({
      folderId: s.folderId,
      confidence: s.confidence
    }));

    return {
      emailId: email.id,
      folderId: bestMatch.folderId,
      confidence: bestMatch.confidence,
      alternativeFolders: alternatives,
      reason: this.generateRoutingReason(
        bestMatch.confidence,
        folders.find((f) => f.id === bestMatch.folderId)
      ),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a smart folder based on a suggestion
   */
  createFolder(suggestion: Suggestion, existingFolders: SmartFolder[]): SmartFolder {
    const folder: SmartFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suggestion.folderName,
      type: FolderType.AUTO,
      category: suggestion.category,
      description: suggestion.reason,
      emailCount: suggestion.emailCount,
      unreadCount: 0,
      strategy: suggestion.strategy,
      rules: this.generateRules(suggestion),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: {
        confidence: this.mapConfidence(suggestion.confidence),
        averagePriority: EmailPriority.NORMAL,
        topSenders: [],
        topKeywords: suggestion.keywords,
        commonTopics: suggestion.keywords,
        autoGenerated: true,
        lastOptimization: new Date().toISOString()
      }
    };

    return folder;
  }

  /**
   * Optimize folder rules based on email patterns
   */
  optimizeFolders(folders: SmartFolder[], emails: EmailForOrganization[]): SmartFolder[] {
    return folders.map((folder) => {
      const folderEmails = this.getFolderEmails(folder, emails);

      if (folderEmails.length === 0) {
        return folder;
      }

      // Update metadata
      const updatedMetadata = this.updateFolderMetadata(folder, folderEmails);

      // Update rules
      const updatedRules = this.optimizeFolderRules(folder, folderEmails);

      return {
        ...folder,
        emailCount: folderEmails.length,
        unreadCount: folderEmails.filter((e) => e.readStatus === 'unread').length,
        rules: updatedRules,
        metadata: updatedMetadata,
        lastActivity: new Date().toISOString()
      };
    });
  }

  /**
   * Record user action for learning
   */
  recordAction(action: UserAction): void {
    if (!this.learningData.learningEnabled) {
      return;
    }

    this.learningData.userActions.push(action);

    // Update patterns
    const patternKey = `${action.emailId}-${action.folderId}`;
    const count = this.learningData.folderPatterns.get(patternKey) || 0;
    this.learningData.folderPatterns.set(patternKey, count + 1);
  }

  /**
   * Get organization statistics
   */
  getStatistics(context: OrganizationContext): OrganizationStatistics {
    const emails = context.emails;
    const totalEmails = emails.length;

    // Categorize emails
    const emailsByCategory: Record<FolderCategory, number> = {
      [FolderCategory.WORK]: 0,
      [FolderCategory.PERSONAL]: 0,
      [FolderCategory.PROMOTIONS]: 0,
      [FolderCategory.SOCIAL]: 0,
      [FolderCategory.FINANCE]: 0,
      [FolderCategory.TRAVEL]: 0,
      [FolderCategory.SHOPPING]: 0,
      [FolderCategory.NEWSLETTERS]: 0,
      [FolderCategory.SYSTEM]: 0,
      [FolderCategory.OTHER]: 0
    };

    for (const email of emails) {
      const category = this.categorizeEmail(email);
      emailsByCategory[category]++;
    }

    return {
      totalEmailsProcessed: totalEmails,
      totalFoldersCreated: context.existingFolders?.filter((f) => f.type === FolderType.AUTO).length || 0,
      totalFoldersSuggested: 0, // To be tracked in hook
      totalRoutings: 0, // To be tracked in hook
      averageConfidence: 0, // To be calculated from routings
      emailsByCategory,
      foldersByType: {
        [FolderType.AUTO]: context.existingFolders?.filter((f) => f.type === FolderType.AUTO).length || 0,
        [FolderType.MANUAL]: context.existingFolders?.filter((f) => f.type === FolderType.MANUAL).length || 0,
        [FolderType.SYSTEM]: context.existingFolders?.filter((f) => f.type === FolderType.SYSTEM).length || 0,
        [FolderType.TEMPORARY]: context.existingFolders?.filter((f) => f.type === FolderType.TEMPORARY).length || 0
      },
      accuracy: 0, // To be calculated from user feedback
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // ============================================================================
  // Pattern Analysis Methods
  // ============================================================================

  private analyzePatterns(emails: EmailForOrganization[]): any {
    const patterns: any = {
      senders: new Map<string, number>(),
      keywords: new Map<string, number>(),
      topics: new Map<string, number>(),
      categories: new Map<FolderCategory, number>()
    };

    for (const email of emails) {
      // Analyze sender
      const senderCount = patterns.senders.get(email.from) || 0;
      patterns.senders.set(email.from, senderCount + 1);

      // Analyze keywords
      const keywords = this.extractKeywords(email);
      for (const keyword of keywords) {
        const keywordCount = patterns.keywords.get(keyword) || 0;
        patterns.keywords.set(keyword, keywordCount + 1);
      }

      // Analyze topics
      const topics = this.extractTopics(email);
      for (const topic of topics) {
        const topicCount = patterns.topics.get(topic) || 0;
        patterns.topics.set(topic, topicCount + 1);
      }

      // Categorize
      const category = this.categorizeEmail(email);
      const categoryCount = patterns.categories.get(category) || 0;
      patterns.categories.set(category, categoryCount + 1);
    }

    return patterns;
  }

  // ============================================================================
  // Suggestion Generation Methods
  // ============================================================================

  private generateTopicSuggestions(patterns: any, emails: EmailForOrganization[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const sortedTopics = Array.from(patterns.topics.entries() as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, this.config.maxSuggestions);

    for (const [topic, count] of sortedTopics) {
      if ((count as number) < this.config.minEmailsForFolder) {
        continue;
      }

      const topicEmails = emails.filter(
        (e) =>
          this.extractTopics(e).includes(topic) ||
          e.subject.toLowerCase().includes(topic.toLowerCase()) ||
          e.body.toLowerCase().includes(topic.toLowerCase())
      );

      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        folderName: this.capitalizeFirst(topic),
        category: this.determineCategory(topic),
        strategy: OrganizationStrategy.BY_TOPIC,
        emailCount: topicEmails.length,
        confidence: Math.min(1, ((count as number) / emails.length) * 3),
        keywords: [topic, ...this.extractKeywords(topicEmails[0]).slice(0, 3)],
        sampleEmails: topicEmails.slice(0, 3).map((e) => e.id),
        reason: `Found ${count} emails related to "${topic}"`,
        timestamp: new Date().toISOString()
      });
    }

    return suggestions;
  }

  private generateSenderSuggestions(patterns: any, emails: EmailForOrganization[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const sortedSenders = Array.from(patterns.senders.entries() as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, this.config.maxSuggestions);

    for (const [sender, count] of sortedSenders) {
      if ((count as number) < this.config.minEmailsForFolder) {
        continue;
      }

      const senderEmails = emails.filter((e) => e.from === sender);

      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        folderName: sender.split('@')[0].replace(/[._]/g, ' '),
        category: this.determineCategoryFromSender(sender, senderEmails),
        strategy: OrganizationStrategy.BY_SENDER,
        emailCount: senderEmails.length,
        confidence: Math.min(1, ((count as number) / emails.length) * 2),
        keywords: this.extractKeywords(senderEmails[0]).slice(0, 3),
        sampleEmails: senderEmails.slice(0, 3).map((e) => e.id),
        reason: `Found ${count} emails from ${sender}`,
        timestamp: new Date().toISOString()
      });
    }

    return suggestions;
  }

  private generateCategorySuggestions(patterns: any, emails: EmailForOrganization[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const sortedCategories = Array.from(patterns.categories.entries() as [string, number][]).sort(
      ([, a], [, b]) => b - a
    );

    for (const [category, count] of sortedCategories) {
      if ((count as number) < this.config.minEmailsForFolder) {
        continue;
      }

      const categoryEmails = emails.filter((e) => this.categorizeEmail(e) === category);

      suggestions.push({
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        folderName: category.toLowerCase(),
        category: category as FolderCategory,
        strategy: OrganizationStrategy.BY_PRIORITY,
        emailCount: categoryEmails.length,
        confidence: Math.min(1, ((count as number) / emails.length) * 2),
        keywords: this.getCategoryKeywords(category as FolderCategory),
        sampleEmails: categoryEmails.slice(0, 3).map((e) => e.id),
        reason: `Found ${count} emails in ${category} category`,
        timestamp: new Date().toISOString()
      });
    }

    return suggestions;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private categorizeEmail(email: EmailForOrganization): FolderCategory {
    const content = `${email.subject} ${email.body}`.toLowerCase();

    // Check for work keywords
    if (WORK_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.WORK;
    }

    // Check for personal keywords
    if (PERSONAL_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.PERSONAL;
    }

    // Check for promotions
    if (PROMOTIONS_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.PROMOTIONS;
    }

    // Check for finance
    if (FINANCE_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.FINANCE;
    }

    // Check for travel
    if (TRAVEL_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.TRAVEL;
    }

    // Check for shopping
    if (SHOPPING_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.SHOPPING;
    }

    // Check for newsletters
    if (NEWSLETTER_KEYWORDS.some((k) => content.includes(k))) {
      return FolderCategory.NEWSLETTERS;
    }

    // Check for system senders
    if (SYSTEM_SENDERS.some((s) => email.from.toLowerCase().includes(s))) {
      return FolderCategory.SYSTEM;
    }

    return FolderCategory.OTHER;
  }

  private extractKeywords(email: EmailForOrganization): string[] {
    const content = `${email.subject} ${email.body}`.toLowerCase();
    const words = content
      .split(/[\s,.!?;:"'(){}[\]<>]+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !WORK_KEYWORDS.includes(word) &&
          !PERSONAL_KEYWORDS.includes(word) &&
          !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'will', 'email'].includes(word)
      );

    // Count word frequency
    const frequency: Map<string, number> = new Map();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    // Return top keywords
    return Array.from(frequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractTopics(email: EmailForOrganization): string[] {
    const topics: string[] = [];
    const content = `${email.subject} ${email.body}`;

    // Extract from subject
    const words = content
      .toLowerCase()
      .split(/[\s,.!?;:"'(){}[\]<>]+/)
      .filter((word) => word.length > 4 && !WORK_KEYWORDS.includes(word));

    // Extract main topics (nouns and important words)
    const importantWords = words
      .filter(
        (word) =>
          word.endsWith('tion') ||
          word.endsWith('ment') ||
          word.endsWith('ment') ||
          word.endsWith('ing') ||
          word.endsWith('project') ||
          word.endsWith('report') ||
          word.endsWith('update')
      )
      .slice(0, 3);

    topics.push(...importantWords);

    return topics;
  }

  private calculateFolderMatch(email: EmailForOrganization, folder: SmartFolder): number {
    let score = 0;
    const content = `${email.subject} ${email.body}`.toLowerCase();

    // Check rules
    for (const rule of folder.rules) {
      if (rule.type === 'SENDER' && email.from.toLowerCase().includes(rule.value.toLowerCase())) {
        score += rule.weight;
      }
      if (rule.type === 'SUBJECT' && email.subject.toLowerCase().includes(rule.value.toLowerCase())) {
        score += rule.weight;
      }
      if (rule.type === 'KEYWORD' && content.includes(rule.value.toLowerCase())) {
        score += rule.weight;
      }
    }

    // Check metadata keywords
    for (const keyword of folder.metadata.topKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }

    // Normalize score
    return Math.min(1, score);
  }

  private getFolderEmails(folder: SmartFolder, emails: EmailForOrganization[]): EmailForOrganization[] {
    return emails.filter((email) => {
      const score = this.calculateFolderMatch(email, folder);
      return score >= this.config.minConfidence;
    });
  }

  private updateFolderMetadata(folder: SmartFolder, emails: EmailForOrganization[]): FolderMetadata {
    const keywords = this.extractTopKeywords(emails);
    const senders = this.extractTopSenders(emails);
    const priority = this.calculateAveragePriority(emails);

    return {
      ...folder.metadata,
      topKeywords: keywords,
      topSenders: senders,
      averagePriority: priority
    };
  }

  private optimizeFolderRules(folder: SmartFolder, emails: EmailForOrganization[]): FolderRule[] {
    const rules: FolderRule[] = [];
    const keywords = this.extractTopKeywords(emails);
    const senders = this.extractTopSenders(emails);

    // Add keyword rules
    for (const keyword of keywords.slice(0, 3)) {
      rules.push({
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'KEYWORD',
        condition: 'contains',
        value: keyword,
        weight: 0.5
      });
    }

    // Add sender rules
    for (const sender of senders.slice(0, 2)) {
      rules.push({
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'SENDER',
        condition: 'equals',
        value: sender,
        weight: 0.7
      });
    }

    return rules;
  }

  private extractTopKeywords(emails: EmailForOrganization[]): string[] {
    const keywordCount: Map<string, number> = new Map();

    for (const email of emails) {
      const keywords = this.extractKeywords(email);
      for (const keyword of keywords) {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
      }
    }

    return Array.from(keywordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractTopSenders(emails: EmailForOrganization[]): string[] {
    const senderCount: Map<string, number> = new Map();

    for (const email of emails) {
      senderCount.set(email.from, (senderCount.get(email.from) || 0) + 1);
    }

    return Array.from(senderCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sender]) => sender);
  }

  private calculateAveragePriority(emails: EmailForOrganization[]): EmailPriority {
    let urgentCount = 0;
    const content = emails
      .map((e) => `${e.subject} ${e.body}`)
      .join(' ')
      .toLowerCase();

    for (const keyword of URGENT_KEYWORDS) {
      if (content.includes(keyword)) {
        urgentCount++;
      }
    }

    if (urgentCount > 3) {
      return EmailPriority.URGENT;
    }
    if (urgentCount > 0) {
      return EmailPriority.HIGH;
    }
    return EmailPriority.NORMAL;
  }

  private generateRules(suggestion: Suggestion): FolderRule[] {
    const rules: FolderRule[] = [];

    for (const keyword of suggestion.keywords) {
      rules.push({
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'KEYWORD',
        condition: 'contains',
        value: keyword,
        weight: 0.5
      });
    }

    return rules;
  }

  private determineCategory(topic: string): FolderCategory {
    const topicLower = topic.toLowerCase();

    if (WORK_KEYWORDS.some((k) => topicLower.includes(k))) {
      return FolderCategory.WORK;
    }
    if (FINANCE_KEYWORDS.some((k) => topicLower.includes(k))) {
      return FolderCategory.FINANCE;
    }
    if (TRAVEL_KEYWORDS.some((k) => topicLower.includes(k))) {
      return FolderCategory.TRAVEL;
    }

    return FolderCategory.OTHER;
  }

  private determineCategoryFromSender(sender: string, emails: EmailForOrganization[]): FolderCategory {
    const content = emails
      .map((e) => `${e.subject} ${e.body}`)
      .join(' ')
      .toLowerCase();
    return this.categorizeEmail({ ...emails[0], body: content });
  }

  private getCategoryKeywords(category: FolderCategory): string[] {
    switch (category) {
      case FolderCategory.WORK:
        return WORK_KEYWORDS.slice(0, 3);
      case FolderCategory.FINANCE:
        return FINANCE_KEYWORDS.slice(0, 3);
      case FolderCategory.TRAVEL:
        return TRAVEL_KEYWORDS.slice(0, 3);
      case FolderCategory.SHOPPING:
        return SHOPPING_KEYWORDS.slice(0, 3);
      case FolderCategory.PROMOTIONS:
        return PROMOTIONS_KEYWORDS.slice(0, 3);
      case FolderCategory.NEWSLETTERS:
        return NEWSLETTER_KEYWORDS.slice(0, 3);
      default:
        return [];
    }
  }

  private mapConfidence(confidence: number): ConfidenceLevel {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
      return ConfidenceLevel.HIGH;
    }
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      return ConfidenceLevel.MEDIUM;
    }
    return ConfidenceLevel.LOW;
  }

  private generateRoutingReason(confidence: number, folder?: SmartFolder): string {
    const level = this.mapConfidence(confidence);
    return `Matched to ${folder?.name || 'folder'} with ${level.toLowerCase()} confidence (${(confidence * 100).toFixed(1)}%)`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  updateConfig(config: Partial<OrganizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearLearningData(): void {
    this.learningData.userActions = [];
    this.learningData.folderPatterns = new Map();
    this.learningData.senderPatterns = new Map();
    this.learningData.keywordPatterns = new Map();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createFolderOrganizer(config?: Partial<OrganizationConfig>): FolderOrganizer {
  return new FolderOrganizer(config);
}
