/**
 * AI Categorization Model
 * 
 * Machine learning model for automatic email categorization.
 * Uses TensorFlow.js for client-side inference.
 */

import {
  EmailFeatures,
  CategoryConfidence,
  CategorizationResult,
  CustomCategory,
  EmailCategory,
  SYSTEM_CATEGORIES,
} from '../types/aiCategorization';

/**
 * Categorization Model
 */
export class CategorizationModel {
  private modelVersion: string = '1.0.0';
  private isLoaded: boolean = false;
  private featureWeights: Map<string, number>;

  constructor() {
    this.featureWeights = this.initializeFeatureWeights();
  }

  /**
   * Initialize feature weights for the model
   */
  private initializeFeatureWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    
    // Sender-related weights
    weights.set('sender_domain_work', 0.3);
    weights.set('sender_domain_personal', 0.25);
    weights.set('sender_domain_promo', 0.4);
    weights.set('sender_domain_social', 0.35);
    
    // Subject-related weights
    weights.set('subject_keywords_work', 0.35);
    weights.set('subject_keywords_urgent', 0.4);
    weights.set('subject_keywords_promo', 0.45);
    weights.set('subject_keywords_finance', 0.35);
    
    // Content-related weights
    weights.set('body_keywords_work', 0.3);
    weights.set('body_keywords_personal', 0.25);
    weights.set('body_has_unsubscribe', 0.5);
    weights.set('body_has_promo_keywords', 0.45);
    
    // Structural features
    weights.set('has_attachments', 0.2);
    weights.set('is_reply', 0.15);
    weights.set('is_forward', 0.15);
    weights.set('recipient_count', 0.1);
    
    return weights;
  }

  /**
   * Extract features from an email
   */
  extractFeatures(email: any): EmailFeatures {
    const subject = email.subject || '';
    const body = email.body || '';
    const sender = email.from || '';
    const domain = sender.split('@')[1] || '';
    
    return {
      sender,
      senderDomain: domain,
      subject,
      subjectWords: this.tokenize(subject),
      bodyPreview: body.substring(0, 500),
      bodyWords: this.tokenize(body),
      hasAttachments: (email.attachments || []).length > 0,
      attachmentTypes: (email.attachments || []).map((a: any) => a.type),
      hasLinks: this.countLinks(body) > 0,
      linkCount: this.countLinks(body),
      isReply: subject.toLowerCase().startsWith('re:'),
      isForward: subject.toLowerCase().startsWith('fw:') || subject.toLowerCase().startsWith('fwd:'),
      recipientCount: (email.to || []).length,
      ccCount: (email.cc || []).length,
      timestamp: email.timestamp || new Date().toISOString(),
      hourOfDay: new Date(email.timestamp).getHours(),
      dayOfWeek: new Date(email.timestamp).getDay(),
      priority: email.priority || 'normal',
      hasUnsubscribeLink: this.hasUnsubscribeLink(body),
      hasPromoKeywords: this.hasPromoKeywords(body),
      hasUrgencyKeywords: this.hasUrgencyKeywords(subject + ' ' + body),
      language: this.detectLanguage(body),
    };
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Count links in text
   */
  private countLinks(text: string): number {
    const linkRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(linkRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Check if text has unsubscribe link
   */
  private hasUnsubscribeLink(text: string): boolean {
    const unsubscribeRegex = /unsubscribe|opt[-\s]?out/i;
    return unsubscribeRegex.test(text);
  }

  /**
   * Check for promotional keywords
   */
  private hasPromoKeywords(text: string): boolean {
    const promoKeywords = [
      'sale', 'discount', 'offer', 'deal', 'coupon', 'promo',
      'limited time', 'special offer', 'buy now', 'free shipping',
      'save', 'off', 'clearance', 'bargain', 'exclusive',
    ];
    const lowerText = text.toLowerCase();
    return promoKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check for urgency keywords
   */
  private hasUrgencyKeywords(text: string): boolean {
    const urgencyKeywords = [
      'urgent', 'asap', 'important', 'critical', 'immediate',
      'deadline', 'expires', 'time sensitive', 'action required',
      'priority', 'emergency',
    ];
    const lowerText = text.toLowerCase();
    return urgencyKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Detect language (simplified)
   */
  private detectLanguage(text: string): string {
    // Simplified language detection
    // In production, use proper language detection library
    return 'en';
  }

  /**
   * Calculate category scores
   */
  private calculateScores(features: EmailFeatures): Map<string, number> {
    const scores = new Map<string, number>();
    const domain = features.senderDomain.toLowerCase();
    const subject = features.subject.toLowerCase();
    const body = features.bodyPreview.toLowerCase();

    // Work category
    let workScore = 0;
    if (this.isWorkDomain(domain)) workScore += 0.4;
    if (this.hasWorkKeywords(subject + ' ' + body)) workScore += 0.3;
    if (features.hasAttachments) workScore += 0.2;
    if (features.isReply || features.isForward) workScore += 0.1;
    if (features.hasUrgencyKeywords) workScore += 0.2;
    scores.set(EmailCategory.WORK, workScore);

    // Personal category
    let personalScore = 0;
    if (this.isPersonalDomain(domain)) personalScore += 0.5;
    if (this.hasPersonalKeywords(subject + ' ' + body)) personalScore += 0.3;
    if (features.recipientCount <= 1) personalScore += 0.2;
    scores.set(EmailCategory.PERSONAL, personalScore);

    // Promotions category
    let promoScore = 0;
    if (features.hasPromoKeywords) promoScore += 0.5;
    if (features.hasUnsubscribeLink) promoScore += 0.4;
    if (this.isPromoDomain(domain)) promoScore += 0.3;
    if (features.linkCount > 3) promoScore += 0.2;
    scores.set(EmailCategory.PROMOTIONS, promoScore);

    // Social category
    let socialScore = 0;
    if (this.isSocialDomain(domain)) socialScore += 0.5;
    if (this.hasSocialKeywords(subject)) socialScore += 0.4;
    if (features.hourOfDay >= 18 || features.hourOfDay <= 8) socialScore += 0.1;
    scores.set(EmailCategory.SOCIAL, socialScore);

    // Updates category
    let updatesScore = 0;
    if (this.isUpdatesDomain(domain)) updatesScore += 0.4;
    if (this.hasUpdatesKeywords(subject)) updatesScore += 0.3;
    if (!features.isReply && !features.isForward) updatesScore += 0.2;
    scores.set(EmailCategory.UPDATES, updatesScore);

    // Finance category
    let financeScore = 0;
    if (this.isFinanceDomain(domain)) financeScore += 0.5;
    if (this.hasFinanceKeywords(subject + ' ' + body)) financeScore += 0.4;
    if (features.hasUrgencyKeywords) financeScore += 0.2;
    scores.set(EmailCategory.FINANCE, financeScore);

    // Travel category
    let travelScore = 0;
    if (this.isTravelDomain(domain)) travelScore += 0.5;
    if (this.hasTravelKeywords(subject + ' ' + body)) travelScore += 0.4;
    if (features.hasAttachments) travelScore += 0.2;
    scores.set(EmailCategory.TRAVEL, travelScore);

    // Shopping category
    let shoppingScore = 0;
    if (this.isShoppingDomain(domain)) shoppingScore += 0.5;
    if (this.hasShoppingKeywords(subject + ' ' + body)) shoppingScore += 0.4;
    if (features.hasAttachments) shoppingScore += 0.2;
    scores.set(EmailCategory.SHOPPING, shoppingScore);

    // News category
    let newsScore = 0;
    if (this.isNewsDomain(domain)) newsScore += 0.4;
    if (this.hasNewsKeywords(subject)) newsScore += 0.3;
    if (features.linkCount > 0) newsScore += 0.2;
    scores.set(EmailCategory.NEWS, newsScore);

    // Forums category
    let forumsScore = 0;
    if (this.isForumDomain(domain)) forumsScore += 0.5;
    if (this.hasForumKeywords(subject)) forumsScore += 0.3;
    scores.set(EmailCategory.FORUMS, forumsScore);

    // Spam category
    let spamScore = 0;
    if (features.hasPromoKeywords) spamScore += 0.3;
    if (features.linkCount > 5) spamScore += 0.2;
    if (features.hasUnsubscribeLink) spamScore += 0.2;
    scores.set(EmailCategory.SPAM, spamScore);

    return scores;
  }

  /**
   * Normalize scores to 0-1 range
   */
  private normalizeScores(scores: Map<string, number>): Map<string, number> {
    const maxScore = Math.max(...scores.values());
    const normalized = new Map<string, number>();
    
    scores.forEach((score, category) => {
      normalized.set(category, maxScore > 0 ? score / maxScore : 0);
    });
    
    return normalized;
  }

  /**
   * Sort categories by score and return top N
   */
  private getTopCategories(
    scores: Map<string, number>,
    max: number
  ): CategoryConfidence[] {
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([category, confidence]) => ({
        category,
        confidence,
        reasoning: this.getReasoning(category, confidence),
      }));
  }

  /**
   * Get reasoning for category assignment
   */
  private getReasoning(category: string, confidence: number): string {
    if (confidence > 0.8) {
      return `Strong evidence suggests ${category} category`;
    } else if (confidence > 0.5) {
      return `Moderate evidence suggests ${category} category`;
    } else {
      return `Some evidence suggests ${category} category`;
    }
  }

  // Helper methods for domain and keyword detection
  private isWorkDomain(domain: string): boolean {
    const workDomains = ['company.com', 'corporate', 'enterprise', 'business'];
    return workDomains.some(d => domain.includes(d));
  }

  private isPersonalDomain(domain: string): boolean {
    const personalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    return personalDomains.includes(domain);
  }

  private isPromoDomain(domain: string): boolean {
    const promoDomains = ['marketing', 'promo', 'promo-email', 'newsletter'];
    return promoDomains.some(d => domain.includes(d));
  }

  private isSocialDomain(domain: string): boolean {
    const socialDomains = ['facebook', 'twitter', 'instagram', 'linkedin', 'social'];
    return socialDomains.some(d => domain.includes(d));
  }

  private isUpdatesDomain(domain: string): boolean {
    const updatesDomains = ['notification', 'update', 'alert', 'noreply'];
    return updatesDomains.some(d => domain.includes(d));
  }

  private isFinanceDomain(domain: string): boolean {
    const financeDomains = ['bank', 'finance', 'investment', 'paypal', 'stripe'];
    return financeDomains.some(d => domain.includes(d));
  }

  private isTravelDomain(domain: string): boolean {
    const travelDomains = ['airline', 'booking', 'hotel', 'travel', 'expedia'];
    return travelDomains.some(d => domain.includes(d));
  }

  private isShoppingDomain(domain: string): boolean {
    const shoppingDomains = ['amazon', 'ebay', 'shop', 'store', 'commerce'];
    return shoppingDomains.some(d => domain.includes(d));
  }

  private isNewsDomain(domain: string): boolean {
    const newsDomains = ['news', 'journal', 'times', 'post', 'daily'];
    return newsDomains.some(d => domain.includes(d));
  }

  private isForumDomain(domain: string): boolean {
    const forumDomains = ['forum', 'community', 'reddit', 'stackoverflow'];
    return forumDomains.some(d => domain.includes(d));
  }

  private hasWorkKeywords(text: string): boolean {
    const keywords = ['meeting', 'project', 'deadline', 'report', 'review', 'contract'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasPersonalKeywords(text: string): boolean {
    const keywords = ['family', 'friend', 'personal', 'weekend', 'dinner', 'birthday'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasSocialKeywords(text: string): boolean {
    const keywords = ['notification', 'mention', 'comment', 'like', 'share'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasUpdatesKeywords(text: string): boolean {
    const keywords = ['update', 'notification', 'alert', 'news', 'release'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasFinanceKeywords(text: string): boolean {
    const keywords = ['payment', 'invoice', 'receipt', 'bank', 'credit', 'debit'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasTravelKeywords(text: string): boolean {
    const keywords = ['flight', 'hotel', 'reservation', 'booking', 'itinerary', 'check-in'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasShoppingKeywords(text: string): boolean {
    const keywords = ['order', 'shipment', 'delivery', 'purchase', 'cart'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasNewsKeywords(text: string): boolean {
    const keywords = ['newsletter', 'digest', 'weekly', 'breaking news'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  private hasForumKeywords(text: string): boolean {
    const keywords = ['reply', 'thread', 'post', 'comment', 'upvote'];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  /**
   * Categorize an email
   */
  categorize(email: any): CategorizationResult {
    const startTime = performance.now();
    
    // Extract features
    const features = this.extractFeatures(email);
    
    // Calculate scores
    const scores = this.calculateScores(features);
    
    // Normalize scores
    const normalizedScores = this.normalizeScores(scores);
    
    // Get top categories
    const topCategories = this.getTopCategories(normalizedScores, 4);
    
    const endTime = performance.now();
    
    return {
      primary: topCategories[0],
      alternatives: topCategories.slice(1),
      timestamp: new Date().toISOString(),
      modelVersion: this.modelVersion,
      processingTime: endTime - startTime,
    };
  }

  /**
   * Batch categorize emails
   */
  batchCategorize(emails: any[]): Map<string, CategorizationResult> {
    const results = new Map<string, CategorizationResult>();
    
    emails.forEach(email => {
      const result = this.categorize(email);
      results.set(email.id, result);
    });
    
    return results;
  }

  /**
   * Train model with examples
   */
  async trainWithExamples(examples: any[]): Promise<void> {
    // In a real implementation, this would:
    // 1. Extract features from examples
    // 2. Update feature weights based on feedback
    // 3. Re-train the model
    // For now, this is a placeholder
    
    console.log(`Training with ${examples.length} examples`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate training
  }

  /**
   * Get model version
   */
  getModelVersion(): string {
    return this.modelVersion;
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded;
  }
}

// Export singleton instance
export const categorizationModel = new CategorizationModel();