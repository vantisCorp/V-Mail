import {
  Suggestion,
  SuggestionType,
  SuggestionContext,
  SuggestionResult,
  SuggestionConfig,
  DEFAULT_SUGGESTION_CONFIG,
  ReplySuggestion,
  QuickActionSuggestion,
  FollowUpSuggestion,
  AttachmentSuggestion,
  RecipientSuggestion,
  LabelSuggestion,
  ConfidenceScore,
  SuggestionPriority,
  ReplyCategory,
  QuickActionType,
  FollowUpAction,
  RecipientType,
  REPLY_TEMPLATES,
  QUICK_ACTION_PATTERNS,
  TrainingExample,
  UserBehavior
} from '../types/smartSuggestions';

export class SuggestionEngine {
  private config: SuggestionConfig;
  private modelVersion: string = '1.0.0';
  private trainingData: TrainingExample[] = [];
  private userBehavior: UserBehavior | null = null;

  constructor(config?: Partial<SuggestionConfig>) {
    this.config = { ...DEFAULT_SUGGESTION_CONFIG, ...config };
    this.loadUserBehavior();
  }

  generateSuggestions(context: SuggestionContext): SuggestionResult {
    const startTime = performance.now();
    const suggestions: Suggestion[] = [];

    if (this.config.suggestionTypes.includes(SuggestionType.REPLY)) {
      const replySuggestions = this.generateReplySuggestions(context);
      suggestions.push(...replySuggestions);
    }

    if (this.config.suggestionTypes.includes(SuggestionType.QUICK_ACTION)) {
      const actionSuggestions = this.generateQuickActionSuggestions(context);
      suggestions.push(...actionSuggestions);
    }

    if (this.config.suggestionTypes.includes(SuggestionType.FOLLOW_UP)) {
      const followUpSuggestions = this.generateFollowUpSuggestions(context);
      suggestions.push(...followUpSuggestions);
    }

    if (this.config.suggestionTypes.includes(SuggestionType.ATTACHMENT)) {
      const attachmentSuggestions = this.generateAttachmentSuggestions(context);
      suggestions.push(...attachmentSuggestions);
    }

    if (this.config.suggestionTypes.includes(SuggestionType.RECIPIENT)) {
      const recipientSuggestions = this.generateRecipientSuggestions(context);
      suggestions.push(...recipientSuggestions);
    }

    if (this.config.suggestionTypes.includes(SuggestionType.LABEL)) {
      const labelSuggestions = this.generateLabelSuggestions(context);
      suggestions.push(...labelSuggestions);
    }

    const filteredSuggestions = this.filterAndSortSuggestions(suggestions);
    const limitedSuggestions = filteredSuggestions.slice(0, this.config.maxSuggestions);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    return {
      suggestions: limitedSuggestions,
      context,
      timestamp: new Date().toISOString(),
      processingTime,
      modelVersion: this.modelVersion,
      metadata: this.calculateMetadata(limitedSuggestions)
    };
  }

  private generateReplySuggestions(context: SuggestionContext): ReplySuggestion[] {
    const suggestions: ReplySuggestion[] = [];
    const content = context.content.toLowerCase();
    const subject = context.subject.toLowerCase();

    const category = this.detectReplyCategory(content, subject);
    const templates = REPLY_TEMPLATES[category];

    templates.forEach((template, index) => {
      const confidence = this.calculateReplyConfidence(template, context, category);

      if (confidence >= this.config.minConfidence) {
        suggestions.push({
          id: `reply-${category}-${index}-${Date.now()}`,
          type: SuggestionType.REPLY,
          text: template,
          confidence,
          priority: this.determinePriority(confidence),
          category,
          context: 'Based on email content and detected category',
          explanation: this.getReplyExplanation(category)
        });
      }
    });

    if (this.config.enablePersonalization && this.userBehavior) {
      const personalizedSuggestions = this.generatePersonalizedReplies(context);
      suggestions.push(...personalizedSuggestions);
    }

    return suggestions;
  }

  private generateQuickActionSuggestions(context: SuggestionContext): QuickActionSuggestion[] {
    const suggestions: QuickActionSuggestion[] = [];
    const content = context.content.toLowerCase();
    const subject = context.subject.toLowerCase();

    Object.entries(QUICK_ACTION_PATTERNS).forEach(([action, patterns]) => {
      const actionType = action as QuickActionType;
      const matches = patterns.filter((pattern) => content.includes(pattern) || subject.includes(pattern));

      if (matches.length > 0) {
        const confidence = Math.min(0.9, 0.5 + matches.length * 0.1);

        suggestions.push({
          id: `action-${actionType}-${Date.now()}`,
          type: SuggestionType.QUICK_ACTION,
          action: actionType,
          confidence,
          priority: this.determinePriority(confidence),
          reason: `Detected keywords: ${matches.join(', ')}`,
          context: 'Based on email content analysis'
        });
      }
    });

    if (this.config.enablePersonalization && this.userBehavior) {
      const behaviorSuggestions = this.generateBehaviorBasedActions(context);
      suggestions.push(...behaviorSuggestions);
    }

    return suggestions;
  }

  private generateFollowUpSuggestions(context: SuggestionContext): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    const content = context.content.toLowerCase();

    const followUpKeywords = [
      {
        keywords: ['follow up', 'get back to you', 'will contact', 'let you know'],
        action: FollowUpAction.REMIND_WEEK,
        reason: 'Sender mentioned they will follow up'
      },
      { keywords: ['tomorrow', 'next day'], action: FollowUpAction.REMIND_TOMORROW, reason: 'Mentioned tomorrow' },
      { keywords: ['next week', 'week from now'], action: FollowUpAction.REMIND_WEEK, reason: 'Mentioned next week' },
      {
        keywords: ['next month', 'month from now'],
        action: FollowUpAction.REMIND_MONTH,
        reason: 'Mentioned next month'
      },
      {
        keywords: ['meeting', 'call', 'discuss', 'schedule'],
        action: FollowUpAction.SCHEDULE_MEETING,
        reason: 'Scheduling discussion requested'
      }
    ];

    followUpKeywords.forEach(({ keywords, action, reason }) => {
      const matches = keywords.filter((keyword) => content.includes(keyword));

      if (matches.length > 0) {
        const confidence = 0.7 + matches.length * 0.05;

        suggestions.push({
          id: `followup-${action}-${Date.now()}`,
          type: SuggestionType.FOLLOW_UP,
          action,
          confidence: Math.min(0.95, confidence),
          priority: SuggestionPriority.MEDIUM,
          reason,
          suggestedDate: this.calculateSuggestedDate(action)
        });
      }
    });

    if (context.threadLength && context.threadLength > 3) {
      suggestions.push({
        id: `followup-thread-${Date.now()}`,
        type: SuggestionType.FOLLOW_UP,
        action: FollowUpAction.REMIND_TOMORROW,
        confidence: 0.6,
        priority: SuggestionPriority.LOW,
        reason: 'Email thread is getting long - consider following up',
        suggestedDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    return suggestions;
  }

  private generateAttachmentSuggestions(context: SuggestionContext): AttachmentSuggestion[] {
    const suggestions: AttachmentSuggestion[] = [];
    const content = context.content.toLowerCase();

    if (!this.config.enableAttachmentSuggestions) {
      return suggestions;
    }

    const attachmentKeywords = [
      { keyword: 'attached', reason: 'Email mentions attachments' },
      { keyword: 'attachment', reason: 'Email mentions attachments' },
      { keyword: 'document', reason: 'Document mentioned in email' },
      { keyword: 'file', reason: 'File mentioned in email' },
      { keyword: 'resume', reason: 'Resume mentioned in email' },
      { keyword: 'cv', reason: 'CV mentioned in email' },
      { keyword: 'invoice', reason: 'Invoice mentioned in email' },
      { keyword: 'report', reason: 'Report mentioned in email' }
    ];

    attachmentKeywords.forEach(({ keyword, reason }) => {
      if (content.includes(keyword)) {
        suggestions.push({
          id: `attachment-${keyword}-${Date.now()}`,
          type: SuggestionType.ATTACHMENT,
          fileName: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}.pdf`,
          fileType: 'application/pdf',
          confidence: 0.7,
          priority: SuggestionPriority.MEDIUM,
          reason,
          description: `Consider attaching a ${keyword} based on email content`
        });
      }
    });

    return suggestions;
  }

  private generateRecipientSuggestions(context: SuggestionContext): RecipientSuggestion[] {
    const suggestions: RecipientSuggestion[] = [];

    if (!this.config.enableRecipientSuggestions) {
      return suggestions;
    }

    const teamKeywords = {
      manager: ['manager', 'supervisor', 'lead'],
      team: ['team', 'colleague', 'coworker'],
      hr: ['hr', 'human resources', 'personnel'],
      finance: ['finance', 'accounting', 'billing'],
      legal: ['legal', 'attorney', 'counsel']
    };

    Object.entries(teamKeywords).forEach(([role, keywords]) => {
      const matches = keywords.filter((keyword) => context.content.toLowerCase().includes(keyword));

      if (matches.length > 0) {
        suggestions.push({
          id: `recipient-${role}-${Date.now()}`,
          type: SuggestionType.RECIPIENT,
          recipientType: RecipientType.CC,
          email: `${role}@company.com`,
          name: `${role.charAt(0).toUpperCase() + role.slice(1)}`,
          confidence: 0.6 + matches.length * 0.05,
          priority: SuggestionPriority.MEDIUM,
          reason: `Mentioned ${matches.join(', ')} - consider adding ${role}`
        });
      }
    });

    if (this.config.enablePersonalization && this.userBehavior?.frequentRecipients) {
      this.userBehavior.frequentRecipients.slice(0, 3).forEach((email, index) => {
        suggestions.push({
          id: `recipient-frequent-${index}-${Date.now()}`,
          type: SuggestionType.RECIPIENT,
          recipientType: RecipientType.CC,
          email,
          name: email.split('@')[0],
          confidence: 0.5,
          priority: SuggestionPriority.LOW,
          reason: 'Frequent contact based on your email history'
        });
      });
    }

    return suggestions;
  }

  private generateLabelSuggestions(context: SuggestionContext): LabelSuggestion[] {
    const suggestions: LabelSuggestion[] = [];
    const content = context.content.toLowerCase();
    const subject = context.subject.toLowerCase();

    const labelMappings = [
      { keywords: ['invoice', 'payment', 'billing', 'receipt'], label: 'Finance', color: '#e74c3c' },
      { keywords: ['meeting', 'schedule', 'calendar', 'appointment'], label: 'Meeting', color: '#3498db' },
      { keywords: ['project', 'task', 'milestone', 'deadline'], label: 'Project', color: '#9b59b6' },
      { keywords: ['client', 'customer', 'account'], label: 'Client', color: '#f39c12' },
      { keywords: ['urgent', 'important', 'priority', 'asap'], label: 'Important', color: '#e74c3c' },
      { keywords: ['personal', 'family', 'friend'], label: 'Personal', color: '#2ecc71' },
      { keywords: ['travel', 'trip', 'vacation'], label: 'Travel', color: '#1abc9c' },
      { keywords: ['newsletter', 'update', 'announcement'], label: 'Updates', color: '#95a5a6' }
    ];

    labelMappings.forEach(({ keywords, label, color }) => {
      const matches = keywords.filter((keyword) => content.includes(keyword) || subject.includes(keyword));

      if (matches.length > 0) {
        const confidence = 0.6 + matches.length * 0.05;

        suggestions.push({
          id: `label-${label}-${Date.now()}`,
          type: SuggestionType.LABEL,
          label,
          color,
          confidence: Math.min(0.95, confidence),
          priority: this.determinePriority(confidence),
          reason: `Detected keywords: ${matches.join(', ')}`
        });
      }
    });

    return suggestions;
  }

  private detectReplyCategory(content: string, subject: string): ReplyCategory {
    const fullText = `${content} ${subject}`.toLowerCase();

    const categoryPatterns: Record<ReplyCategory, string[]> = {
      [ReplyCategory.ACKNOWLEDGEMENT]: ['received', 'got it', 'acknowledge', 'noted'],
      [ReplyCategory.CONFIRMATION]: ['confirm', 'agreed', 'accepted', 'approved'],
      [ReplyCategory.REJECTION]: ['unable', 'cannot', 'decline', 'unfortunately'],
      [ReplyCategory.FOLLOW_UP]: ['follow up', 'get back', 'later', 'next week'],
      [ReplyCategory.THANK_YOU]: ['thank', 'appreciate', 'grateful', 'thanks'],
      [ReplyCategory.APOLOGY]: ['sorry', 'apologize', 'regret', 'mistake'],
      [ReplyCategory.REQUEST]: ['request', 'need', 'please', 'would like'],
      [ReplyCategory.INFORMATION]: ['information', 'details', 'here is', 'attached'],
      [ReplyCategory.SCHEDULING]: ['meeting', 'schedule', 'available', 'call'],
      [ReplyCategory.CANCELLATION]: ['cancel', 'cannot attend', 'unable to make'],
      [ReplyCategory.QUESTION]: ['question', 'clarify', 'ask about', 'wondering'],
      [ReplyCategory.INQUIRY]: ['inquire', 'request information', 'like to know'],
      [ReplyCategory.CUSTOM]: []
    };

    let bestMatch = ReplyCategory.CUSTOM;
    let maxMatches = 0;

    Object.entries(categoryPatterns).forEach(([category, patterns]) => {
      const matches = patterns.filter((pattern) => fullText.includes(pattern));
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        bestMatch = category as ReplyCategory;
      }
    });

    return bestMatch;
  }

  private calculateReplyConfidence(
    template: string,
    context: SuggestionContext,
    category: ReplyCategory
  ): ConfidenceScore {
    let confidence = 0.5;

    if (this.userBehavior?.preferredReplyCategories.includes(category)) {
      confidence += 0.2;
    }

    if (template.length > 50 && template.length < 200) {
      confidence += 0.1;
    }

    const contentWords = context.content.toLowerCase().split(/\s+/);
    const templateWords = template.toLowerCase().split(/\s+/);
    const commonWords = contentWords.filter((word) => templateWords.includes(word));
    const similarity = commonWords.length / templateWords.length;
    confidence += similarity * 0.2;

    return Math.min(0.95, confidence);
  }

  private determinePriority(confidence: ConfidenceScore): SuggestionPriority {
    if (confidence >= 0.8) {
      return SuggestionPriority.HIGH;
    }
    if (confidence >= 0.6) {
      return SuggestionPriority.MEDIUM;
    }
    return SuggestionPriority.LOW;
  }

  private getReplyExplanation(category: ReplyCategory): string {
    const explanations: Record<ReplyCategory, string> = {
      [ReplyCategory.ACKNOWLEDGEMENT]: 'Email appears to require acknowledgment',
      [ReplyCategory.CONFIRMATION]: 'Email requires confirmation of receipt or agreement',
      [ReplyCategory.REJECTION]: 'Email appears to require a polite decline',
      [ReplyCategory.FOLLOW_UP]: 'Email suggests future action or follow-up needed',
      [ReplyCategory.THANK_YOU]: 'Email warrants expression of gratitude',
      [ReplyCategory.APOLOGY]: 'Email situation may require an apology',
      [ReplyCategory.REQUEST]: 'Email contains a request that should be addressed',
      [ReplyCategory.INFORMATION]: 'Email requests information or details',
      [ReplyCategory.SCHEDULING]: 'Email involves scheduling or time coordination',
      [ReplyCategory.CANCELLATION]: 'Email may require cancellation notification',
      [ReplyCategory.QUESTION]: 'Email contains questions that need answering',
      [ReplyCategory.INQUIRY]: 'Email is an inquiry requesting information',
      [ReplyCategory.CUSTOM]: 'Based on email content analysis'
    };

    return explanations[category];
  }

  private generatePersonalizedReplies(_context: SuggestionContext): ReplySuggestion[] {
    const suggestions: ReplySuggestion[] = [];

    if (!this.userBehavior) {
      return suggestions;
    }

    this.userBehavior.preferredReplyCategories.slice(0, 2).forEach((category, index) => {
      const templates = REPLY_TEMPLATES[category];
      if (templates.length > 0) {
        suggestions.push({
          id: `reply-personal-${index}-${Date.now()}`,
          type: SuggestionType.REPLY,
          text: templates[0],
          confidence: 0.7,
          priority: SuggestionPriority.MEDIUM,
          category,
          context: 'Based on your preferences',
          explanation: 'This is one of your preferred reply types'
        });
      }
    });

    return suggestions;
  }

  private generateBehaviorBasedActions(_context: SuggestionContext): QuickActionSuggestion[] {
    const suggestions: QuickActionSuggestion[] = [];

    if (!this.userBehavior) {
      return suggestions;
    }

    const sortedActions = Object.entries(this.userBehavior.commonActions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sortedActions.forEach(([action, count]) => {
      const actionType = action as QuickActionType;
      if (count > 5) {
        suggestions.push({
          id: `action-behavior-${action}-${Date.now()}`,
          type: SuggestionType.QUICK_ACTION,
          action: actionType,
          confidence: 0.6,
          priority: SuggestionPriority.LOW,
          reason: `You frequently use this action (${count} times)`,
          context: 'Based on your usage patterns'
        });
      }
    });

    return suggestions;
  }

  private calculateSuggestedDate(action: FollowUpAction): Date {
    const now = new Date();

    switch (action) {
      case FollowUpAction.REMIND_TOMORROW:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case FollowUpAction.REMIND_WEEK:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case FollowUpAction.REMIND_MONTH:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
  }

  private filterAndSortSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const filtered = suggestions.filter((s) => s.confidence >= this.config.minConfidence);

    const weightedSuggestions = filtered.map((suggestion) => {
      let weight = suggestion.confidence;

      switch (suggestion.priority) {
        case SuggestionPriority.HIGH:
          weight *= this.config.priorityWeights.high;
          break;
        case SuggestionPriority.MEDIUM:
          weight *= this.config.priorityWeights.medium;
          break;
        case SuggestionPriority.LOW:
          weight *= this.config.priorityWeights.low;
          break;
      }

      return { suggestion, weight };
    });

    weightedSuggestions.sort((a, b) => b.weight - a.weight);

    return weightedSuggestions.map(({ suggestion }) => suggestion);
  }

  private calculateMetadata(suggestions: Suggestion[]) {
    const byType: Record<SuggestionType, number> = {} as unknown;
    const byPriority: Record<SuggestionPriority, number> = {} as unknown;
    let totalConfidence = 0;

    suggestions.forEach((suggestion) => {
      byType[suggestion.type] = (byType[suggestion.type] || 0) + 1;
      byPriority[suggestion.priority] = (byPriority[suggestion.priority] || 0) + 1;
      totalConfidence += suggestion.confidence;
    });

    return {
      totalSuggestions: suggestions.length,
      byType,
      byPriority,
      avgConfidence: suggestions.length > 0 ? totalConfidence / suggestions.length : 0
    };
  }

  private loadUserBehavior(): void {
    try {
      const stored = localStorage.getItem('vmail_user_behavior');
      if (stored) {
        this.userBehavior = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user behavior:', error);
    }
  }

  private saveUserBehavior(): void {
    if (this.userBehavior) {
      try {
        localStorage.setItem('vmail_user_behavior', JSON.stringify(this.userBehavior));
      } catch (error) {
        console.warn('Failed to save user behavior:', error);
      }
    }
  }

  private updateUserBehavior(feedback: TrainingExample): void {
    if (!this.userBehavior) {
      this.userBehavior = {
        commonActions: {} as unknown,
        frequentRecipients: [],
        commonLabels: [],
        responseTimes: [],
        preferredReplyCategories: [],
        workingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC'
        }
      };
    }

    if (feedback.suggestion.type === SuggestionType.QUICK_ACTION) {
      const action = (feedback.suggestion as QuickActionSuggestion).action;
      this.userBehavior.commonActions[action] = (this.userBehavior.commonActions[action] || 0) + 1;
    }

    if (feedback.suggestion.type === SuggestionType.REPLY && feedback.outcome === 'positive') {
      const category = (feedback.suggestion as ReplySuggestion).category;
      if (!this.userBehavior.preferredReplyCategories.includes(category)) {
        this.userBehavior.preferredReplyCategories.push(category);
      }
    }

    this.saveUserBehavior();
  }

  addTrainingExample(example: TrainingExample): void {
    this.trainingData.push(example);

    if (this.config.enableLearning) {
      this.updateUserBehavior(example);
    }
  }

  getTrainingStats() {
    return {
      totalExamples: this.trainingData.length,
      positiveOutcomes: this.trainingData.filter((e) => e.outcome === 'positive').length,
      negativeOutcomes: this.trainingData.filter((e) => e.outcome === 'negative').length,
      neutralOutcomes: this.trainingData.filter((e) => e.outcome === 'neutral').length
    };
  }

  clearTrainingData(): void {
    this.trainingData = [];
  }

  updateConfig(config: Partial<SuggestionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SuggestionConfig {
    return { ...this.config };
  }

  resetUserBehavior(): void {
    this.userBehavior = null;
    localStorage.removeItem('vmail_user_behavior');
  }
}

export function createSuggestionEngine(config?: Partial<SuggestionConfig>): SuggestionEngine {
  return new SuggestionEngine(config);
}

export function generateSuggestions(context: SuggestionContext, config?: Partial<SuggestionConfig>): SuggestionResult {
  const engine = createSuggestionEngine(config);
  return engine.generateSuggestions(context);
}
