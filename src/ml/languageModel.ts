/**
 * Predictive Typing / Smart Compose ML Model
 * Part of v1.4.0 AI-Powered Intelligence
 */

import {
  WritingContext,
  SuggestionsResult,
  Suggestion,
  CompletionSuggestion,
  PhraseSuggestion,
  GrammarSuggestion,
  StyleSuggestion,
  TemplateSuggestion,
  EmailSuggestion,
  SubjectSuggestion,
  SuggestionType,
  SuggestionPriority,
  SuggestionSource,
  PredictiveTypingConfig,
  DEFAULT_PREDICTIVE_TYPING_CONFIG,
  WritingPattern,
  TypingStatistics,
  COMMON_PHRASES,
  EMAIL_TEMPLATES,
  COMMON_GRAMMAR_ERRORS,
  STYLE_IMPROVEMENTS
} from '../types/predictiveTyping';

// ============================================================================
// Language Model Class
// ============================================================================

export class LanguageModel {
  private config: PredictiveTypingConfig;
  private modelVersion: string = '1.0.0';
  private cache: Map<string, SuggestionsResult>;
  private writingPattern: WritingPattern;
  private userPatterns: Map<string, number>;

  constructor(config?: Partial<PredictiveTypingConfig>) {
    this.config = { ...DEFAULT_PREDICTIVE_TYPING_CONFIG, ...config };
    this.cache = new Map();
    this.writingPattern = {
      phrases: {},
      wordPairs: {},
      emailPatterns: {},
      subjectPatterns: {},
      lastUpdated: new Date().toISOString()
    };
    this.userPatterns = new Map();
  }

  // ============================================================================
  // Main Prediction Methods
  // ============================================================================

  /**
   * Get suggestions for given context
   */
  getSuggestions(context: WritingContext): SuggestionsResult {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(context);
    if (this.config.performance.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const suggestions: Suggestion[] = [];

    // Get completions
    if (context.field === 'body' || context.field === 'subject') {
      const completions = this.getCompletions(context);
      suggestions.push(...completions);
    }

    // Get phrases
    if (context.field === 'body') {
      const phrases = this.getPhrases(context);
      suggestions.push(...phrases);
    }

    // Get grammar corrections
    if (context.field === 'body' && context.userPreferences?.enableGrammar) {
      const grammar = this.getGrammarCorrections(context);
      suggestions.push(...grammar);
    }

    // Get style suggestions
    if (context.field === 'body' && context.userPreferences?.enableStyle) {
      const style = this.getStyleSuggestions(context);
      suggestions.push(...style);
    }

    // Get templates
    if (context.field === 'body' && context.userPreferences?.enableTemplates) {
      const templates = this.getTemplateSuggestions(context);
      suggestions.push(...templates);
    }

    // Get email suggestions
    if (context.field === 'to' || context.field === 'cc' || context.field === 'bcc') {
      const emails = this.getEmailSuggestions(context);
      suggestions.push(...emails);
    }

    // Get subject suggestions
    if (context.field === 'subject' && context.text.length < 50) {
      const subjects = this.getSubjectSuggestions(context);
      suggestions.push(...subjects);
    }

    // Sort by confidence and limit
    const sortedSuggestions = suggestions
      .filter((s) => s.confidence >= this.config.suggestions.minConfidence)
      .sort((a, b) => {
        const priorityOrder = {
          [SuggestionPriority.HIGH]: 0,
          [SuggestionPriority.MEDIUM]: 1,
          [SuggestionPriority.LOW]: 2
        };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, context.userPreferences?.maxSuggestions || 5);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    const result: SuggestionsResult = {
      suggestions: sortedSuggestions,
      processingTime,
      modelVersion: this.modelVersion,
      timestamp: new Date().toISOString()
    };

    // Cache result
    if (this.config.performance.cacheEnabled) {
      this.cache.set(cacheKey, result);
      if (this.cache.size > this.config.performance.cacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
    }

    return result;
  }

  // ============================================================================
  // Completion Suggestions
  // ============================================================================

  private getCompletions(context: WritingContext): CompletionSuggestion[] {
    const completions: CompletionSuggestion[] = [];
    const { text, cursorPosition } = context;

    // Get current word
    const words = text.substring(0, cursorPosition).split(/\s+/);
    const currentWord = words[words.length - 1] || '';

    if (currentWord.length < 2) {
      return completions;
    }

    // Generate completions based on common patterns
    const suggestions = this.generateWordCompletions(currentWord, context);

    suggestions.forEach((suggestion, index) => {
      completions.push({
        id: `completion-${Date.now()}-${index}`,
        type: SuggestionType.COMPLETION,
        text: suggestion.text,
        confidence: suggestion.confidence,
        priority: SuggestionPriority.HIGH,
        source: SuggestionSource.LANGUAGE_MODEL,
        timestamp: new Date().toISOString(),
        startIndex: cursorPosition - currentWord.length,
        endIndex: cursorPosition,
        originalText: currentWord,
        displayText: suggestion.text,
        isFullWord: suggestion.isFullWord
      });
    });

    return completions.slice(0, this.config.suggestions.maxCompletions);
  }

  private generateWordCompletions(
    currentWord: string,
    _context: WritingContext
  ): Array<{ text: string; confidence: number; isFullWord: boolean }> {
    const completions: Array<{ text: string; confidence: number; isFullWord: boolean }> = [];

    // Common word completions
    const commonWords = [
      'the',
      'and',
      'that',
      'have',
      'for',
      'not',
      'you',
      'with',
      'this',
      'from',
      'they',
      'we',
      'say',
      'her',
      'she',
      'or',
      'an',
      'will',
      'my',
      'one',
      'all',
      'would',
      'there',
      'their',
      'what',
      'so',
      'up',
      'out',
      'if',
      'about',
      'who',
      'get',
      'which',
      'go',
      'me',
      'when',
      'make',
      'can',
      'like',
      'time',
      'no',
      'just',
      'him',
      'know',
      'take',
      'people',
      'into',
      'year',
      'your',
      'good'
    ];

    // Check for matches
    commonWords.forEach((word) => {
      if (word.startsWith(currentWord.toLowerCase()) && word !== currentWord.toLowerCase()) {
        completions.push({
          text: word,
          confidence: 0.8 - (word.length - currentWord.length) * 0.05,
          isFullWord: true
        });
      }
    });

    // Add user-specific completions
    this.userPatterns.forEach((frequency, pattern) => {
      if (pattern.startsWith(currentWord.toLowerCase()) && pattern !== currentWord.toLowerCase()) {
        completions.push({
          text: pattern,
          confidence: Math.min(0.95, 0.6 + frequency * 0.1),
          isFullWord: true
        });
      }
    });

    return completions;
  }

  // ============================================================================
  // Phrase Suggestions
  // ============================================================================

  private getPhrases(context: WritingContext): PhraseSuggestion[] {
    const phrases: PhraseSuggestion[] = [];
    const { text, cursorPosition } = context;

    // Get recent text
    const recentText = text.substring(Math.max(0, cursorPosition - 100), cursorPosition);

    // Check for phrase opportunities
    Object.entries(COMMON_PHRASES).forEach(([category, phraseList]) => {
      phraseList.forEach((phrase) => {
        const score = this.calculatePhraseMatch(recentText, phrase);
        if (score > 0.5) {
          phrases.push({
            id: `phrase-${Date.now()}-${Math.random()}`,
            type: SuggestionType.PHRASE,
            text: phrase,
            confidence: score,
            priority: SuggestionPriority.MEDIUM,
            source: SuggestionSource.COMMON,
            timestamp: new Date().toISOString(),
            category,
            phrase,
            context: recentText
          });
        }
      });
    });

    return phrases.slice(0, this.config.suggestions.maxPhrases);
  }

  private calculatePhraseMatch(context: string, phrase: string): number {
    // Simple heuristic: check if phrase starts with words similar to context
    const contextWords = context.toLowerCase().split(/\s+/).slice(-2);
    const phraseWords = phrase.toLowerCase().split(/\s+/).slice(0, 2);

    let matchScore = 0;
    contextWords.forEach((word, index) => {
      if (phraseWords[index] && phraseWords[index].startsWith(word)) {
        matchScore += 0.3;
      }
    });

    return Math.min(1, matchScore);
  }

  // ============================================================================
  // Grammar Corrections
  // ============================================================================

  private getGrammarCorrections(context: WritingContext): GrammarSuggestion[] {
    const corrections: GrammarSuggestion[] = [];
    const { text } = context;

    Object.entries(COMMON_GRAMMAR_ERRORS).forEach(([key, error]) => {
      const matches = text.matchAll(error.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          corrections.push({
            id: `grammar-${Date.now()}-${Math.random()}`,
            type: SuggestionType.GRAMMAR,
            text: error.correction,
            confidence: 0.85,
            priority: SuggestionPriority.HIGH,
            source: SuggestionSource.GRAMMAR_CHECKER,
            timestamp: new Date().toISOString(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            originalText: match[0],
            correction: error.correction,
            explanation: error.explanation,
            errorType: key
          });
        }
      }
    });

    return corrections.slice(0, this.config.suggestions.maxCorrections);
  }

  // ============================================================================
  // Style Suggestions
  // ============================================================================

  private getStyleSuggestions(context: WritingContext): StyleSuggestion[] {
    const suggestions: StyleSuggestion[] = [];
    const { text } = context;

    Object.entries(STYLE_IMPROVEMENTS).forEach(([key, improvement]) => {
      const matches = text.matchAll(improvement.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          suggestions.push({
            id: `style-${Date.now()}-${Math.random()}`,
            type: SuggestionType.STYLE,
            text: improvement.improvement,
            confidence: 0.7,
            priority: SuggestionPriority.MEDIUM,
            source: SuggestionSource.STYLE_GUIDE,
            timestamp: new Date().toISOString(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            originalText: match[0],
            improvedText: improvement.improvement === 'remove' ? '' : improvement.improvement,
            explanation: improvement.explanation,
            styleType: key
          });
        }
      }
    });

    return suggestions.slice(0, this.config.suggestions.maxCorrections);
  }

  // ============================================================================
  // Template Suggestions
  // ============================================================================

  private getTemplateSuggestions(context: WritingContext): TemplateSuggestion[] {
    const templates: TemplateSuggestion[] = [];

    // Suggest templates based on context
    Object.values(EMAIL_TEMPLATES).forEach((template) => {
      const relevanceScore = this.calculateTemplateRelevance(context, template);
      if (relevanceScore > 0.6) {
        templates.push({
          id: `template-${template.id}`,
          type: SuggestionType.TEMPLATE,
          text: template.name,
          confidence: relevanceScore,
          priority: SuggestionPriority.LOW,
          source: SuggestionSource.COMMON,
          timestamp: new Date().toISOString(),
          templateId: template.id,
          templateName: template.name,
          templateContent: template.content,
          category: template.category,
          variables: this.extractTemplateVariables(template.content)
        });
      }
    });

    return templates;
  }

  private calculateTemplateRelevance(context: WritingContext, _template: unknown): number {
    let score = 0.5;

    // Boost score if email is empty (new email)
    if (context.text.length < 50) {
      score += 0.3;
    }

    // Boost score based on recipient count
    if (context.recipients.length === 1) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private extractTemplateVariables(content: string): string[] {
    const matches = content.match(/\{(\w+)\}/g);
    return matches ? matches.map((m) => m.slice(1, -1)) : [];
  }

  // ============================================================================
  // Email Suggestions
  // ============================================================================

  private getEmailSuggestions(context: WritingContext): EmailSuggestion[] {
    const emails: EmailSuggestion[] = [];
    const { text } = context;

    // Simulate email suggestions from contacts
    const mockContacts = [
      { email: 'john.doe@example.com', name: 'John Doe', frequency: 10 },
      { email: 'jane.smith@example.com', name: 'Jane Smith', frequency: 8 },
      { email: 'bob.wilson@example.com', name: 'Bob Wilson', frequency: 5 },
      { email: 'alice.johnson@example.com', name: 'Alice Johnson', frequency: 3 },
      { email: 'charlie.brown@example.com', name: 'Charlie Brown', frequency: 2 }
    ];

    mockContacts.forEach((contact) => {
      const score = this.calculateEmailMatch(text, contact);
      if (score > 0.5) {
        emails.push({
          id: `email-${contact.email}`,
          type: SuggestionType.EMAIL,
          text: contact.email,
          confidence: score,
          priority: SuggestionPriority.HIGH,
          source: SuggestionSource.USER_PATTERN,
          timestamp: new Date().toISOString(),
          email: contact.email,
          name: contact.name,
          frequency: contact.frequency
        });
      }
    });

    return emails;
  }

  private calculateEmailMatch(input: string, contact: unknown): number {
    const lowerInput = input.toLowerCase();
    const lowerName = contact.name.toLowerCase();
    const lowerEmail = contact.email.toLowerCase();

    let score = 0;

    // Match name
    if (lowerName.includes(lowerInput)) {
      score += 0.6;
    }

    // Match email
    if (lowerEmail.includes(lowerInput)) {
      score += 0.5;
    }

    // Boost based on frequency
    score += Math.min(0.3, contact.frequency * 0.05);

    return Math.min(1, score);
  }

  // ============================================================================
  // Subject Suggestions
  // ============================================================================

  private getSubjectSuggestions(context: WritingContext): SubjectSuggestion[] {
    const subjects: SubjectSuggestion[] = [];

    // Generate subject suggestions based on content
    if (context.text.length > 20) {
      const keywords = this.extractKeywords(context.text);
      if (keywords.length > 0) {
        subjects.push({
          id: `subject-${Date.now()}`,
          type: SuggestionType.SUBJECT,
          text: `Re: ${keywords.slice(0, 3).join(', ')}`,
          confidence: 0.7,
          priority: SuggestionPriority.MEDIUM,
          source: SuggestionSource.LANGUAGE_MODEL,
          timestamp: new Date().toISOString(),
          subject: `Re: ${keywords.slice(0, 3).join(', ')}`,
          category: 'response',
          basedOn: 'content'
        });
      }
    }

    // Default suggestions
    const defaultSubjects = [
      { subject: 'Update regarding our conversation', category: 'update' },
      { subject: 'Following up', category: 'follow-up' },
      { subject: 'Question about', category: 'question' }
    ];

    defaultSubjects.forEach((ds, index) => {
      subjects.push({
        id: `subject-default-${index}`,
        type: SuggestionType.SUBJECT,
        text: ds.subject,
        confidence: 0.5,
        priority: SuggestionPriority.LOW,
        source: SuggestionSource.COMMON,
        timestamp: new Date().toISOString(),
        subject: ds.subject,
        category: ds.category,
        basedOn: 'history'
      });
    });

    return subjects;
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    // Remove common words
    const commonWords = ['this', 'that', 'with', 'from', 'have', 'will', 'your', 'about', 'which'];
    const filtered = words.filter((word) => !commonWords.includes(word));

    // Get unique words
    return [...new Set(filtered)].slice(0, 5);
  }

  // ============================================================================
  // Learning Methods
  // ============================================================================

  /**
   * Learn from user's writing patterns
   */
  learnFromUser(text: string, _acceptedSuggestion?: Suggestion): void {
    const words = text.split(/\s+/);

    // Learn individual words
    words.forEach((word) => {
      const lowerWord = word.toLowerCase();
      if (word.length > 2) {
        this.userPatterns.set(lowerWord, (this.userPatterns.get(lowerWord) || 0) + 1);
      }
    });

    // Learn word pairs
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i].toLowerCase()} ${words[i + 1].toLowerCase()}`;
      this.writingPattern.wordPairs[pair] = (this.writingPattern.wordPairs[pair] || 0) + 1;
    }

    // Update timestamp
    this.writingPattern.lastUpdated = new Date().toISOString();
  }

  /**
   * Get typing statistics
   */
  getTypingStatistics(text: string): TypingStatistics {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const characters = text.length;

    const wordLengths = words.map((w) => w.length);
    const averageWordLength = wordLengths.length > 0 ? wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length : 0;

    // Count common words
    const wordCounts: Record<string, number> = {};
    words.forEach((word) => {
      const lowerWord = word.toLowerCase();
      wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1;
    });

    return {
      totalCharacters: characters,
      totalWords: words.length,
      averageWordLength,
      commonWords: wordCounts,
      commonPhrases: this.writingPattern.wordPairs,
      typingSpeed: 0, // Would be calculated over time
      acceptanceRate: 0 // Would be calculated over time
    };
  }

  /**
   * Get writing pattern
   */
  getWritingPattern(): WritingPattern {
    return { ...this.writingPattern };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getCacheKey(context: WritingContext): string {
    return `${context.field}-${context.text.substring(0, 50)}-${context.cursorPosition}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createLanguageModel(config?: Partial<PredictiveTypingConfig>): LanguageModel {
  return new LanguageModel(config);
}
