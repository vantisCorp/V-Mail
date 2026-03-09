/**
 * Duplicate Email Detection ML Model
 * Part of v1.4.0 AI-Powered Intelligence
 */

import {
  EmailForDetection,
  DuplicateResult,
  DuplicateGroup,
  DuplicateType,
  DuplicateSeverity,
  DuplicateAction,
  SimilarityAlgorithm,
  DetectionConfig,
  DetectionStatistics,
  DetectionContext,
  UserFeedback,
  DEFAULT_DETECTION_CONFIG,
  DUPLICATE_THRESHOLDS,
  SEVERITY_THRESHOLDS,
  SUBJECT_PREFIXES,
  SIGNATURE_PATTERNS,
  FOOTER_PATTERNS,
  FORWARD_INDICATORS
} from '../types/duplicateDetection';

export type { DetectionContext };

// ============================================================================
// Duplicate Detection Model Class
// ============================================================================

export class DuplicateDetector {
  private config: DetectionConfig;
  private modelVersion: string = '1.0.0';
  private cache: Map<string, DuplicateResult[]>;
  private learningData: {
    userFeedback: UserFeedback[];
    commonPatterns: Map<string, number>;
    userEmails: Map<string, EmailForDetection[]>;
    learningEnabled: boolean;
  };

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
    this.cache = new Map();
    this.learningData = {
      userFeedback: [],
      commonPatterns: new Map(),
      userEmails: new Map(),
      learningEnabled: this.config.enableLearning
    };
  }

  // ============================================================================
  // Main Detection Methods
  // ============================================================================

  /**
   * Detect duplicates in a collection of emails
   */
  detectDuplicates(context: DetectionContext): DuplicateResult[] {
    const emails = context.emails;

    if (emails.length < 2) {
      return [];
    }

    const results: DuplicateResult[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < emails.length; i++) {
      for (let j = i + 1; j < emails.length; j++) {
        const pairKey = this.getPairKey(emails[i], emails[j]);

        if (processedPairs.has(pairKey)) {
          continue;
        }
        processedPairs.add(pairKey);

        // Check cache
        const cacheKey = this.getCacheKey(emails[i], emails[j]);
        if (this.config.enableCache) {
          const cached = this.cache.get(cacheKey);
          if (cached && cached.length > 0) {
            results.push(...cached);
            continue;
          }
        }

        // Detect duplicate
        const duplicate = this.detectPair(emails[i], emails[j]);
        if (duplicate) {
          results.push(duplicate);

          // Cache result
          if (this.config.enableCache) {
            this.cache.set(cacheKey, [duplicate]);
          }
        }
      }
    }
    return results;
  }

  /**
   * Detect duplicate between two emails
   */
  detectPair(email1: EmailForDetection, email2: EmailForDetection): DuplicateResult | null {
    const startTime = performance.now();

    // Check time difference
    const timeDiff = this.getTimeDifference(email1.date, email2.date);
    if (timeDiff > this.config.maxTimeDifference) {
      return null;
    }

    // Calculate field similarities
    const subjectSimilarity = this.calculateSubjectSimilarity(email1.subject, email2.subject);
    const bodySimilarity = this.calculateBodySimilarity(email1.body, email2.body);
    const fromSimilarity = email1.from === email2.from ? 1.0 : 0.0;
    const attachmentSimilarity = this.calculateAttachmentSimilarity(email1.attachments || [], email2.attachments || []);

    // Calculate overall similarity
    const similarity = this.calculateOverallSimilarity(
      subjectSimilarity,
      bodySimilarity,
      fromSimilarity,
      attachmentSimilarity
    );

    // Check if meets threshold
    if (similarity < this.config.minSimilarityThreshold) {
      return null;
    }

    // Determine duplicate type and severity
    const type = this.determineDuplicateType(similarity, subjectSimilarity, bodySimilarity);
    const severity = this.determineSeverity(similarity);

    // Identify matched fields and differences
    const matchedFields = this.getMatchedFields(
      subjectSimilarity,
      bodySimilarity,
      fromSimilarity,
      attachmentSimilarity
    );
    const differences = this.getDifferences(email1, email2, subjectSimilarity, bodySimilarity);

    // Generate content hashes
    const contentHashOriginal = this.generateContentHash(email1);
    const contentHashDuplicate = this.generateContentHash(email2);

    const endTime = performance.now();

    return {
      id: `duplicate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      duplicateId: `${email1.id}-${email2.id}`,
      type,
      severity,
      similarityScore: similarity,
      confidence: this.calculateConfidence(similarity, subjectSimilarity, bodySimilarity),
      matchedFields,
      differences,
      originalEmail: email1,
      duplicateEmail: email2,
      metadata: {
        algorithm: this.config.algorithm,
        processingTime: endTime - startTime,
        fieldSimilarity: {
          subject: subjectSimilarity,
          body: bodySimilarity,
          from: fromSimilarity,
          attachments: attachmentSimilarity
        },
        contentHash: {
          original: contentHashOriginal,
          duplicate: contentHashDuplicate
        },
        reason: this.generateReason(type, severity, similarity)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Group duplicates into logical groups
   */
  groupDuplicates(duplicates: DuplicateResult[]): DuplicateGroup[] {
    const groups = new Map<string, DuplicateGroup>();
    const emailToGroup = new Map<string, string>();

    // Create groups based on connected emails
    for (const duplicate of duplicates) {
      const originalGroupId = emailToGroup.get(duplicate.originalEmail.id);
      const duplicateGroupId = emailToGroup.get(duplicate.duplicateEmail.id);

      if (originalGroupId && duplicateGroupId && originalGroupId === duplicateGroupId) {
        // Both emails already in same group
        const group = groups.get(originalGroupId)!;
        group.duplicateIds.push(duplicate.duplicateEmail.id);
        if (!group.emails.find((e) => e.id === duplicate.duplicateEmail.id)) {
          group.emails.push(duplicate.duplicateEmail);
        }
      } else if (originalGroupId && !duplicateGroupId) {
        // Add duplicate email to existing group
        const group = groups.get(originalGroupId)!;
        group.duplicateIds.push(duplicate.duplicateEmail.id);
        emailToGroup.set(duplicate.duplicateEmail.id, originalGroupId);
        if (!group.emails.find((e) => e.id === duplicate.duplicateEmail.id)) {
          group.emails.push(duplicate.duplicateEmail);
        }
      } else if (!originalGroupId && duplicateGroupId) {
        // Add original email to existing group
        const group = groups.get(duplicateGroupId)!;
        group.duplicateIds.push(duplicate.originalEmail.id);
        emailToGroup.set(duplicate.originalEmail.id, duplicateGroupId);
        if (!group.emails.find((e) => e.id === duplicate.originalEmail.id)) {
          group.emails.push(duplicate.originalEmail);
        }
      } else {
        // Create new group
        const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const group: DuplicateGroup = {
          id: groupId,
          groupId,
          primaryEmailId: duplicate.originalEmail.id,
          duplicateIds: [duplicate.originalEmail.id, duplicate.duplicateEmail.id],
          type: duplicate.type,
          severity: duplicate.severity,
          averageSimilarity: duplicate.similarityScore,
          emails: [duplicate.originalEmail, duplicate.duplicateEmail],
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        groups.set(groupId, group);
        emailToGroup.set(duplicate.originalEmail.id, groupId);
        emailToGroup.set(duplicate.duplicateEmail.id, groupId);
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Suggest action for handling duplicate
   */
  suggestAction(duplicate: DuplicateResult): DuplicateAction {
    // High severity duplicates: consider auto-delete
    if (duplicate.severity === DuplicateSeverity.HIGH && this.config.autoDeduplicate) {
      return DuplicateAction.AUTO_DELETE;
    }

    // Medium severity: mark as read or show indicator
    if (duplicate.severity === DuplicateSeverity.MEDIUM) {
      return this.config.defaultAction;
    }

    // Low severity: manual review
    return DuplicateAction.MANUAL_REVIEW;
  }

  /**
   * Record user feedback for learning
   */
  recordFeedback(feedback: UserFeedback): void {
    if (!this.learningData.learningEnabled) {
      return;
    }

    this.learningData.userFeedback.push(feedback);

    // Update common patterns
    const pattern = feedback.duplicateId;
    const count = this.learningData.commonPatterns.get(pattern) || 0;
    this.learningData.commonPatterns.set(pattern, count + 1);
  }

  /**
   * Get detection statistics
   */
  getStatistics(duplicates: DuplicateResult[]): DetectionStatistics {
    const totalDuplicates = duplicates.length;
    const totalProcessingTime = duplicates.reduce((sum, d) => sum + d.metadata.processingTime, 0);
    const averageSimilarity =
      totalDuplicates > 0 ? duplicates.reduce((sum, d) => sum + d.similarityScore, 0) / totalDuplicates : 0;

    const duplicatesByType = {
      [DuplicateType.EXACT]: 0,
      [DuplicateType.NEAR]: 0,
      [DuplicateType.PARTIAL]: 0,
      [DuplicateType.THREAD]: 0
    };

    const duplicatesBySeverity = {
      [DuplicateSeverity.HIGH]: 0,
      [DuplicateSeverity.MEDIUM]: 0,
      [DuplicateSeverity.LOW]: 0
    };

    for (const duplicate of duplicates) {
      duplicatesByType[duplicate.type]++;
      duplicatesBySeverity[duplicate.severity]++;
    }

    return {
      totalEmailsProcessed: 0, // To be tracked externally
      totalDuplicatesFound: totalDuplicates,
      totalGroups: 0, // To be calculated from group results
      averageSimilarity,
      duplicatesByType,
      duplicatesBySeverity,
      totalProcessingTime,
      averageProcessingTime: totalDuplicates > 0 ? totalProcessingTime / totalDuplicates : 0,
      cacheHits: 0, // To be tracked in hook
      cacheMisses: 0 // To be tracked in hook
    };
  }

  // ============================================================================
  // Similarity Calculation Methods
  // ============================================================================

  private calculateOverallSimilarity(subject: number, body: number, from: number, attachments: number): number {
    return (
      subject * this.config.subjectWeight +
      body * this.config.bodyWeight +
      from * this.config.fromWeight +
      attachments * 0.0 // Attachment weight is derived from other fields
    );
  }

  private calculateSubjectSimilarity(subject1: string, subject2: string): number {
    const clean1 = this.cleanSubject(subject1);
    const clean2 = this.cleanSubject(subject2);

    // Exact match
    if (clean1 === clean2) {
      return 1.0;
    }

    // Use appropriate algorithm
    switch (this.config.algorithm) {
      case SimilarityAlgorithm.EXACT:
        return clean1 === clean2 ? 1.0 : 0.0;
      case SimilarityAlgorithm.LEVENSHTEIN:
        return this.levenshteinSimilarity(clean1, clean2);
      case SimilarityAlgorithm.JACCARD:
        return this.jaccardSimilarity(clean1, clean2);
      case SimilarityAlgorithm.COSINE:
      case SimilarityAlgorithm.HYBRID:
      default:
        return this.cosineSimilarity(clean1, clean2);
    }
  }

  private calculateBodySimilarity(body1: string, body2: string): number {
    const clean1 = this.cleanBody(body1);
    const clean2 = this.cleanBody(body2);

    // Exact match
    if (clean1 === clean2) {
      return 1.0;
    }

    // Use appropriate algorithm
    switch (this.config.algorithm) {
      case SimilarityAlgorithm.EXACT:
        return clean1 === clean2 ? 1.0 : 0.0;
      case SimilarityAlgorithm.LEVENSHTEIN:
        return this.levenshteinSimilarity(clean1, clean2);
      case SimilarityAlgorithm.JACCARD:
        return this.jaccardSimilarity(clean1, clean2);
      case SimilarityAlgorithm.COSINE:
      case SimilarityAlgorithm.HYBRID:
      default:
        return this.cosineSimilarity(clean1, clean2);
    }
  }

  private calculateAttachmentSimilarity(
    attachments1: Array<{ name: string; size: number }>,
    attachments2: Array<{ name: string; size: number }>
  ): number {
    if (attachments1.length === 0 && attachments2.length === 0) {
      return 1.0;
    }

    if (attachments1.length !== attachments2.length) {
      return 0.0;
    }

    let matches = 0;
    for (const att1 of attachments1) {
      const match = attachments2.find((att2) => att2.name === att1.name);
      if (match && Math.abs(att1.size - match.size) < 1000) {
        matches++;
      }
    }

    return matches / attachments1.length;
  }

  // ============================================================================
  // Text Similarity Algorithms
  // ============================================================================

  private cosineSimilarity(str1: string, str2: string): number {
    const words1 = this.tokenize(str1);
    const words2 = this.tokenize(str2);

    if (words1.length === 0 && words2.length === 0) {
      return 1.0;
    }

    const uniqueWords = new Set([...words1, ...words2]);
    const vector1: number[] = [];
    const vector2: number[] = [];

    for (const word of uniqueWords) {
      vector1.push(words1.filter((w) => w === word).length);
      vector2.push(words2.filter((w) => w === word).length);
    }

    const dotProduct = vector1.reduce((sum, v, i) => sum + v * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, v) => sum + v * v, 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0.0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  private jaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(this.tokenize(str1));
    const set2 = new Set(this.tokenize(str2));

    if (set1.size === 0 && set2.size === 0) {
      return 1.0;
    }

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) {
      return 1.0;
    }

    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private cleanSubject(subject: string): string {
    let cleaned = subject.toLowerCase().trim();

    // Remove common prefixes
    for (const prefix of SUBJECT_PREFIXES) {
      cleaned = cleaned.replace(new RegExp(`^${prefix}\\s*`, 'i'), '');
    }

    return cleaned;
  }

  private cleanBody(body: string): string {
    let cleaned = body.toLowerCase().trim();

    // Remove forwarded/replied content
    for (const indicator of FORWARD_INDICATORS) {
      const index = cleaned.indexOf(indicator.toLowerCase());
      if (index !== -1) {
        cleaned = cleaned.substring(0, index);
      }
    }

    // Remove signatures
    for (const pattern of SIGNATURE_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove footers
    for (const pattern of FOOTER_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,.!?;:"'(){}[\]<>]+/)
      .filter((word) => word.length > 2);
  }

  private getTimeDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d1.getTime() - d2.getTime());
    return diff / (1000 * 60 * 60); // hours
  }

  private determineDuplicateType(similarity: number, subjectSimilarity: number, bodySimilarity: number): DuplicateType {
    if (similarity >= DUPLICATE_THRESHOLDS.EXACT && subjectSimilarity === 1.0 && bodySimilarity === 1.0) {
      return DuplicateType.EXACT;
    } else if (similarity >= DUPLICATE_THRESHOLDS.NEAR) {
      return DuplicateType.NEAR;
    } else if (similarity >= DUPLICATE_THRESHOLDS.PARTIAL) {
      return DuplicateType.PARTIAL;
    } else {
      return DuplicateType.THREAD;
    }
  }

  private determineSeverity(similarity: number): DuplicateSeverity {
    if (similarity >= SEVERITY_THRESHOLDS.HIGH) {
      return DuplicateSeverity.HIGH;
    } else if (similarity >= SEVERITY_THRESHOLDS.MEDIUM) {
      return DuplicateSeverity.MEDIUM;
    } else {
      return DuplicateSeverity.LOW;
    }
  }

  private calculateConfidence(similarity: number, subjectSimilarity: number, bodySimilarity: number): number {
    // Confidence based on consistency of similarities
    const variance = Math.abs(similarity - subjectSimilarity) + Math.abs(similarity - bodySimilarity);
    return Math.max(0, 1 - variance / 2);
  }

  private getMatchedFields(
    subjectSimilarity: number,
    bodySimilarity: number,
    fromSimilarity: number,
    attachmentSimilarity: number
  ): string[] {
    const matched: string[] = [];
    const threshold = 0.8;

    if (subjectSimilarity >= threshold) {
      matched.push('subject');
    }
    if (bodySimilarity >= threshold) {
      matched.push('body');
    }
    if (fromSimilarity >= threshold) {
      matched.push('from');
    }
    if (attachmentSimilarity >= threshold) {
      matched.push('attachments');
    }

    return matched;
  }

  private getDifferences(
    email1: EmailForDetection,
    email2: EmailForDetection,
    subjectSimilarity: number,
    bodySimilarity: number
  ): string[] {
    const differences: string[] = [];

    if (subjectSimilarity < 1.0) {
      differences.push('subject');
    }
    if (bodySimilarity < 1.0) {
      differences.push('body');
    }
    if (email1.from !== email2.from) {
      differences.push('sender');
    }
    if (email1.to.join(',') !== email2.to.join(',')) {
      differences.push('recipients');
    }

    const att1 = email1.attachments || [];
    const att2 = email2.attachments || [];
    if (att1.length !== att2.length) {
      differences.push('attachments');
    }

    return differences;
  }

  private generateContentHash(email: EmailForDetection): string {
    const content = `${email.subject}|${email.body}|${email.from}`;
    return this.hashString(content);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateReason(type: DuplicateType, severity: DuplicateSeverity, similarity: number): string {
    const typeDesc = type.toLowerCase().replace('_', ' ');
    const severityDesc = severity.toLowerCase();
    return `Detected as ${typeDesc} duplicate with ${severityDesc} severity (${(similarity * 100).toFixed(1)}% similarity)`;
  }

  private getPairKey(email1: EmailForDetection, email2: EmailForDetection): string {
    const ids = [email1.id, email2.id].sort();
    return `${ids[0]}-${ids[1]}`;
  }

  private getCacheKey(email1: EmailForDetection, email2: EmailForDetection): string {
    return this.getPairKey(email1, email2);
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  generateCacheKey(email1: EmailForDetection, email2: EmailForDetection): string {
    return this.getCacheKey(email1, email2);
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearLearningData(): void {
    this.learningData.userFeedback = [];
    this.learningData.commonPatterns = new Map();
    this.learningData.userEmails = new Map();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createDuplicateDetector(config?: Partial<DetectionConfig>): DuplicateDetector {
  return new DuplicateDetector(config);
}
