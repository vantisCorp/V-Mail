/**
 * Email Summarization ML Model
 * Part of v1.4.0 AI-Powered Intelligence
 */

import {
  EmailSummary,
  EmailForSummarization,
  EmailThread,
  SummarizationContext,
  KeyPoint,
  ActionItem,
  SummarySegment,
  SummaryType,
  SummaryLength,
  ContentPriority,
  SummarizationConfig,
  DEFAULT_SUMMARIZATION_CONFIG,
  ACTION_ITEM_PATTERNS,
  DECISION_PATTERNS,
  QUESTION_PATTERNS,
  KEY_POINT_KEYWORDS,
  STOP_WORDS,
  TLDR_PHRASES
} from '../types/emailSummarization';

export type { SummarizationContext, SummarizationConfig };

// ============================================================================
// Summarization Model Class
// ============================================================================

export class SummarizationModel {
  private config: SummarizationConfig;
  private modelVersion: string = '1.0.0';
  private cache: Map<string, { result: EmailSummary; timestamp: number }>;

  constructor(config?: Partial<SummarizationConfig>) {
    this.config = { ...DEFAULT_SUMMARIZATION_CONFIG, ...config };
    this.cache = new Map();
  }

  // ============================================================================
  // Main Summarization Methods
  // ============================================================================

  /**
   * Summarize a thread or collection of emails
   */
  summarize(context: SummarizationContext): EmailSummary {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(context);
    if (this.config.performance.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.result;
      }
    }

    const emails = context.emails;
    if (emails.length === 0) {
      return this.createEmptySummary();
    }

    // Combine all email content
    const fullText = this.combineEmails(emails);
    const sentences = this.extractSentences(fullText);

    // Generate summary based on type
    let summary: string;
    switch (context.summaryType) {
      case SummaryType.ABSTRACTIVE:
        summary = this.generateAbstractiveSummary(sentences, context);
        break;
      case SummaryType.HYBRID:
        summary = this.generateHybridSummary(sentences, context);
        break;
      case SummaryType.EXTRACTIVE:
      default:
        summary = this.generateExtractiveSummary(sentences, context);
        break;
    }

    // Generate TL;DR
    const tlDr = this.generateTlDr(summary, context);

    // Extract key points
    const keyPoints = this.config.features.keyPointExtraction && context.includeKeyPoints
      ? this.extractKeyPoints(emails)
      : [];

    // Extract action items
    const actionItems = this.config.features.actionItemExtraction && context.includeActionItems
      ? this.extractActionItems(emails)
      : [];

    // Create summary segments
    const segments = this.createSummarySegments(summary, sentences, emails);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Calculate metadata
    const totalWords = fullText.split(/\s+/).filter(w => w.length > 0).length;
    const summaryWordCount = summary.split(/\s+/).filter(w => w.length > 0).length;

    const result: EmailSummary = {
      id: `summary-${Date.now()}`,
      summary,
      tlDr,
      keyPoints,
      actionItems,
      segments,
      metadata: {
        totalEmails: emails.length,
        totalWords,
        summaryWordCount,
        compressionRatio: totalWords > 0 ? totalWords / summaryWordCount : 1,
        summaryType: context.summaryType,
        summaryLength: context.summaryLength,
        language: context.language || 'en',
        confidence: this.calculateConfidence(summary, sentences.length)
      },
      processingTime,
      modelVersion: this.modelVersion,
      timestamp: new Date().toISOString()
    };

    // Cache result
    if (this.config.performance.cacheEnabled) {
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      if (this.cache.size > this.config.performance.cacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
    }

    return result;
  }

  /**
   * Summarize a single email
   */
  summarizeEmail(email: EmailForSummarization, length: SummaryLength = SummaryLength.MEDIUM): EmailSummary {
    return this.summarize({
      emails: [email],
      summaryType: SummaryType.EXTRACTIVE,
      summaryLength: length,
      includeActionItems: true,
      includeKeyPoints: true
    });
  }

  // ============================================================================
  // Summary Generation Methods
  // ============================================================================

  /**
   * Generate extractive summary (select important sentences)
   */
  private generateExtractiveSummary(
    sentences: string[],
    context: SummarizationContext
  ): string {
    if (sentences.length === 0) {
return '';
}

    // Score sentences
    const scoredSentences = sentences.map((sentence, index) => ({
      sentence,
      score: this.scoreSentence(sentence, index, sentences.length),
      index
    }));

    // Sort by score
    scoredSentences.sort((a, b) => b.score - a.score);

    // Select top sentences based on summary length
    const maxSentences = this.getMaxSentences(context.summaryLength);
    const topSentences = scoredSentences.slice(0, maxSentences);

    // Sort back by original position
    topSentences.sort((a, b) => a.index - b.index);

    return topSentences.map(s => s.sentence).join(' ');
  }

  /**
   * Generate abstractive summary (simplified - would use real NLP in production)
   */
  private generateAbstractiveSummary(
    sentences: string[],
    context: SummarizationContext
  ): string {
    // For simplicity, we'll use extractive with sentence transformation
    const extractive = this.generateExtractiveSummary(sentences, context);

    // Apply transformations (simplified)
    const abstractive = extractive
      .replace(/\b(I think|I believe|In my opinion)\b/gi, '')
      .replace(/\b(very|really|quite|extremely)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return abstractive;
  }

  /**
   * Generate hybrid summary
   */
  private generateHybridSummary(
    sentences: string[],
    context: SummarizationContext
  ): string {
    const extractive = this.generateExtractiveSummary(sentences, context);
    const abstractive = this.generateAbstractiveSummary(sentences, context);

    // Combine both approaches (take the shorter, more concise one)
    return extractive.length <= abstractive.length ? extractive : abstractive;
  }

  /**
   * Generate TL;DR
   */
  private generateTlDr(summary: string, context: SummarizationContext): string {
    const sentences = this.extractSentences(summary);
    const firstSentence = sentences[0] || summary;

    // Get random TL;DR phrase
    const phrase = TLDR_PHRASES[Math.floor(Math.random() * TLDR_PHRASES.length)];

    // Shorten first sentence if needed
    const words = firstSentence.split(/\s+/);
    const maxWords = 15;
    const shortened = words.slice(0, maxWords).join(' ');
    const suffix = words.length > maxWords ? '...' : '';

    return `${phrase} ${shortened}${suffix}`;
  }

  // ============================================================================
  // Sentence Processing Methods
  // ============================================================================

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|||')
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length >= this.config.summarization.minSentenceLength);
  }

  /**
   * Score a sentence for importance
   */
  private scoreSentence(
    sentence: string,
    index: number,
    totalSentences: number
  ): number {
    let score = 0;

    // Position score (first and last sentences are often important)
    const positionScore = this.config.summarization.positionWeight * (
      index === 0 ? 1 :
      index === totalSentences - 1 ? 0.8 :
      0.5
    );
    score += positionScore;

    // Keyword score
    const words = sentence.toLowerCase().split(/\s+/);
    const keywordMatches = words.filter(w => KEY_POINT_KEYWORDS.some(k => w.includes(k)));
    const keywordScore = keywordMatches.length / Math.max(words.length, 1);
    score += keywordScore * 2;

    // Length score (prefer medium-length sentences)
    const wordCount = words.length;
    const lengthScore = wordCount >= 5 && wordCount <= 30 ? 1 : 0.5;
    score += lengthScore;

    // Sentence structure score
    if (sentence.includes(':')) {
score += 0.3;
} // Lists, definitions
    if (sentence.includes('-')) {
score += 0.2;
} // Dashes (often for emphasis)
    if (/[A-Z]/.test(sentence[0])) {
score += 0.2;
} // Starts with capital

    return score;
  }

  /**
   * Get max sentences for summary length
   */
  private getMaxSentences(length: SummaryLength): number {
    switch (length) {
      case SummaryLength.VERY_SHORT: return 2;
      case SummaryLength.SHORT: return 5;
      case SummaryLength.MEDIUM: return 10;
      case SummaryLength.LONG: return 15;
      default: return 5;
    }
  }

  // ============================================================================
  // Key Point Extraction
  // ============================================================================

  /**
   * Extract key points from emails
   */
  private extractKeyPoints(emails: EmailForSummarization[]): KeyPoint[] {
    const keyPoints: KeyPoint[] = [];

    emails.forEach(email => {
      const sentences = this.extractSentences(email.body);

      sentences.forEach((sentence, index) => {
        const importance = this.scoreSentence(sentence, index, sentences.length);

        if (importance > 0.5) {
          // Check for key point keywords
          const lowerSentence = sentence.toLowerCase();
          const hasKeyword = KEY_POINT_KEYWORDS.some(k => lowerSentence.includes(k));

          if (hasKeyword) {
            keyPoints.push({
              id: `kp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: sentence,
              importance,
              category: this.categorizeKeyPoint(sentence),
              priority: importance > 0.7 ? ContentPriority.HIGH : ContentPriority.MEDIUM,
              sourceEmailId: email.id,
              timestamp: email.timestamp instanceof Date
                ? email.timestamp.toISOString()
                : email.timestamp
            });
          }
        }
      });
    });

    // Sort by importance and return top items
    return keyPoints
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }

  /**
   * Categorize a key point
   */
  private categorizeKeyPoint(sentence: string): string {
    const lower = sentence.toLowerCase();

    if (/deadline|due|schedule|timeline/.test(lower)) {
return 'timeline';
}
    if (/require|need|must|should/.test(lower)) {
return 'requirement';
}
    if (/decision|agreed|concluded/.test(lower)) {
return 'decision';
}
    if (/important|critical|crucial/.test(lower)) {
return 'important';
}
    if (/goal|objective|target/.test(lower)) {
return 'objective';
}
    if (/next|following|then/.test(lower)) {
return 'next_steps';
}

    return 'general';
  }

  // ============================================================================
  // Action Item Extraction
  // ============================================================================

  /**
   * Extract action items from emails
   */
  private extractActionItems(emails: EmailForSummarization[]): ActionItem[] {
    const actionItems: ActionItem[] = [];

    emails.forEach(email => {
      const sentences = this.extractSentences(email.body);

      sentences.forEach(sentence => {
        // Check action item patterns
        for (const pattern of ACTION_ITEM_PATTERNS) {
          const matches = sentence.matchAll(pattern);
          for (const match of matches) {
            if (match[0] && match[0].length > 5) {
              actionItems.push({
                id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: match[0].trim(),
                status: 'pending',
                priority: this.determineActionPriority(sentence),
                sourceEmailId: email.id,
                timestamp: email.timestamp instanceof Date
                  ? email.timestamp.toISOString()
                  : email.timestamp
              });
            }
          }
        }
      });
    });

    return actionItems.slice(0, 10);
  }

  /**
   * Determine action item priority
   */
  private determineActionPriority(sentence: string): ContentPriority {
    const lower = sentence.toLowerCase();

    if (/urgent|asap|immediately|critical|important/.test(lower)) {
      return ContentPriority.HIGH;
    }
    if (/soon|quickly|priority/.test(lower)) {
      return ContentPriority.MEDIUM;
    }
    return ContentPriority.LOW;
  }

  // ============================================================================
  // Summary Segments
  // ============================================================================

  /**
   * Create summary segments
   */
  private createSummarySegments(
    summary: string,
    originalSentences: string[],
    emails: EmailForSummarization[]
  ): SummarySegment[] {
    const segments: SummarySegment[] = [];
    const summarySentences = this.extractSentences(summary);

    summarySentences.forEach((sentence, index) => {
      segments.push({
        id: `segment-${index}`,
        text: sentence,
        type: this.determineSegmentType(sentence),
        importance: 1 - (index * 0.1), // Earlier sentences are more important
        sourceEmails: emails.map(e => e.id)
      });
    });

    return segments;
  }

  /**
   * Determine segment type
   */
  private determineSegmentType(sentence: string): SummarySegment['type'] {
    const lower = sentence.toLowerCase();

    if (/\?/.test(sentence)) {
return 'question';
}
    if (/decision|agreed|concluded|resolved/.test(lower)) {
return 'decision';
}
    if (/please|need|should|must|will/.test(lower)) {
return 'action_item';
}
    if (/important|key|main|primary/.test(lower)) {
return 'key_point';
}

    return 'topic';
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Combine emails into single text
   */
  private combineEmails(emails: EmailForSummarization[]): string {
    return emails
      .map(e => `${e.subject}\n${e.body}`)
      .join('\n\n');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(summary: string, originalSentences: number): number {
    if (!summary) {
return 0;
}

    const summaryWords = summary.split(/\s+/).length;
    const coverageRatio = summaryWords / (originalSentences * 10); // Rough estimate

    return Math.min(1, Math.max(0.5, coverageRatio));
  }

  /**
   * Create empty summary
   */
  private createEmptySummary(): EmailSummary {
    return {
      id: `summary-${Date.now()}`,
      summary: '',
      tlDr: 'No content to summarize.',
      keyPoints: [],
      actionItems: [],
      segments: [],
      metadata: {
        totalEmails: 0,
        totalWords: 0,
        summaryWordCount: 0,
        compressionRatio: 0,
        summaryType: SummaryType.EXTRACTIVE,
        summaryLength: SummaryLength.MEDIUM,
        language: 'en',
        confidence: 0
      },
      processingTime: 0,
      modelVersion: this.modelVersion,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get cache key
   */
  private getCacheKey(context: SummarizationContext): string {
    const emailIds = context.emails.map(e => e.id).sort().join(',');
    return `${emailIds}-${context.summaryType}-${context.summaryLength}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SummarizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate cache key (public method for hook)
   */
  generateCacheKey(context: SummarizationContext): string {
    return this.getCacheKey(context);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSummarizationModel(config?: Partial<SummarizationConfig>): SummarizationModel {
  return new SummarizationModel(config);
}
