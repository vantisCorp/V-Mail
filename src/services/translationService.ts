/**
 * Email Translation Service
 * Part of v1.4.0 AI-Powered Intelligence
 */

import {
  Translation,
  EmailTranslationResult,
  TranslationMemory,
  TranslationConfig,
  TranslationStatistics,
  UserCorrection,
  LanguageDetectionResult,
  TranslationContext,
  SupportedLanguage,
  TranslationTone,
  TranslationQuality,
  TranslationStatus,
  TranslationSource,
  TranslationAlternative,
  DEFAULT_TRANSLATION_CONFIG,
  LANGUAGE_PATTERNS,
  PROFESSIONAL_INDICATORS,
  CASUAL_INDICATORS,
  FORMAL_INDICATORS,
  COMMON_PHRASES
} from '../types/emailTranslation';

// ============================================================================
// Translation Service Class
// ============================================================================

export class TranslationService {
  private config: TranslationConfig;
  private modelVersion: string = '1.0.0';
  private memory: Map<string, TranslationMemory>;
  private corrections: UserCorrection[];
  private statistics: TranslationStatistics;

  constructor(config?: Partial<TranslationConfig>) {
    this.config = { ...DEFAULT_TRANSLATION_CONFIG, ...config };
    this.memory = new Map();
    this.corrections = [];
    this.statistics = this.initStatistics();
  }

  // ============================================================================
  // Main Translation Methods
  // ============================================================================

  /**
   * Translate an entire email
   */
  async translateEmail(context: TranslationContext): Promise<EmailTranslationResult> {
    const startTime = performance.now();
    const { email, targetLanguage, sourceLanguage, tone, quality } = context;

    const target = targetLanguage || this.config.defaultTargetLanguage;
    const source = sourceLanguage || (await this.detectLanguage(email.body));
    const translationTone = tone || this.config.defaultTone;
    const translationQuality = quality || this.config.quality;

    // Translate subject
    const subjectTranslation = await this.translateText(
      email.subject,
      source,
      target,
      translationTone,
      translationQuality
    );

    // Translate body
    const bodyTranslation = await this.translateText(email.body, source, target, translationTone, translationQuality);

    const endTime = performance.now();
    const overallConfidence = (subjectTranslation.confidence + bodyTranslation.confidence) / 2;

    const result: EmailTranslationResult = {
      id: `translation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      emailId: email.id,
      subjectTranslation,
      bodyTranslation,
      sourceLanguage: source,
      targetLanguage: target,
      tone: translationTone,
      overallConfidence,
      metadata: {
        totalProcessingTime: endTime - startTime,
        totalWordCount: subjectTranslation.metadata.wordCount + bodyTranslation.metadata.wordCount,
        translationSource: bodyTranslation.source
      },
      timestamp: new Date().toISOString()
    };

    // Update statistics
    this.updateStatistics(result);

    return result;
  }

  /**
   * Translate a text string
   */
  async translateText(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    tone: TranslationTone = TranslationTone.NEUTRAL,
    quality: TranslationQuality = TranslationQuality.STANDARD
  ): Promise<Translation> {
    const startTime = performance.now();

    // Check memory cache first
    if (this.config.enableMemory) {
      const cached = this.getFromMemory(text, sourceLanguage, targetLanguage);
      if (cached) {
        this.statistics.cacheHits++;
        return cached;
      }
    }

    this.statistics.cacheMisses++;

    // Perform translation
    const translatedText = await this.performTranslation(text, sourceLanguage, targetLanguage, tone, quality);

    // Generate alternatives if enabled
    const alternatives = this.config.enableAlternatives
      ? await this.generateAlternatives(text, sourceLanguage, targetLanguage, tone)
      : undefined;

    const endTime = performance.now();
    const confidence = this.calculateConfidence(text, translatedText, sourceLanguage, targetLanguage);

    const translation: Translation = {
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      tone,
      quality,
      status: TranslationStatus.COMPLETED,
      source: TranslationSource.AI,
      confidence,
      alternatives,
      metadata: {
        processingTime: endTime - startTime,
        wordCount: this.countWords(text),
        characterCount: text.length,
        detectedLanguage: sourceLanguage,
        toneMatch: this.detectToneMatch(text, tone),
        contextScore: this.calculateContextScore(text),
        modelVersion: this.modelVersion
      },
      timestamp: new Date().toISOString()
    };

    // Store in memory
    if (this.config.enableMemory) {
      this.storeInMemory(text, translatedText, sourceLanguage, targetLanguage);
    }

    return translation;
  }

  /**
   * Detect the language of a text
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    const results: Array<{ language: SupportedLanguage; score: number }> = [];

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      results.push({ language: lang as SupportedLanguage, score });
    }

    // Sort by score and return the highest
    results.sort((a, b) => b.score - a.score);

    if (results.length > 0 && results[0].score > 0) {
      return results[0].language;
    }

    // Default to English if detection fails
    return SupportedLanguage.ENGLISH;
  }

  /**
   * Get detailed language detection result
   */
  async detectLanguageWithConfidence(text: string): Promise<LanguageDetectionResult> {
    const results: Array<{ language: SupportedLanguage; confidence: number }> = [];

    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      let matchCount = 0;
      let totalChecks = 0;

      for (const pattern of patterns) {
        totalChecks++;
        if (pattern.test(text)) {
          matchCount++;
        }
      }

      const confidence = totalChecks > 0 ? matchCount / totalChecks : 0;
      results.push({ language: lang as SupportedLanguage, confidence });
    }

    results.sort((a, b) => b.confidence - a.confidence);

    const primary = results[0];
    const alternatives = results.slice(1, 4);

    return {
      language: primary.language,
      confidence: primary.confidence,
      alternatives
    };
  }

  /**
   * Detect the tone of a text
   */
  detectTone(text: string): TranslationTone {
    const lowerText = text.toLowerCase();

    // Check for formal indicators
    for (const indicator of FORMAL_INDICATORS) {
      if (lowerText.includes(indicator)) {
        return TranslationTone.FORMAL;
      }
    }

    // Check for professional indicators
    let professionalCount = 0;
    for (const indicator of PROFESSIONAL_INDICATORS) {
      if (lowerText.includes(indicator)) {
        professionalCount++;
      }
    }
    if (professionalCount >= 2) {
      return TranslationTone.PROFESSIONAL;
    }

    // Check for casual indicators
    let casualCount = 0;
    for (const indicator of CASUAL_INDICATORS) {
      if (lowerText.includes(indicator)) {
        casualCount++;
      }
    }
    if (casualCount >= 2) {
      return TranslationTone.CASUAL;
    }

    return TranslationTone.NEUTRAL;
  }

  /**
   * Record a user correction for learning
   */
  recordCorrection(correction: UserCorrection): void {
    if (!this.config.enableLearning) {
      return;
    }

    this.corrections.push(correction);

    // Update memory with corrected translation
    if (this.config.enableMemory) {
      this.storeInMemory(
        correction.originalText,
        correction.correctedTranslation,
        correction.sourceLanguage,
        correction.targetLanguage
      );
    }
  }

  /**
   * Get translation statistics
   */
  getStatistics(): TranslationStatistics {
    return {
      ...this.statistics,
      memorySize: this.memory.size
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async performTranslation(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    tone: TranslationTone,
    quality: TranslationQuality
  ): Promise<string> {
    // Simulate translation with language-specific patterns
    // In a real implementation, this would call an external translation API

    // Check for common phrases first
    const lowerText = text.toLowerCase();
    const phrases = COMMON_PHRASES[lowerText];
    if (phrases && phrases[targetLanguage]) {
      return phrases[targetLanguage][0];
    }

    // Apply tone-specific adjustments
    let translatedText = this.applyTranslationRules(text, sourceLanguage, targetLanguage, tone);

    // Apply quality-based processing
    if (quality === TranslationQuality.HIGH) {
      translatedText = this.enhanceTranslation(translatedText, targetLanguage, tone);
    }

    return translatedText;
  }

  private applyTranslationRules(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    _tone: TranslationTone
  ): string {
    // Simulated translation logic
    // In production, this would use actual translation APIs

    let result = text;

    // Apply common phrase translations
    const phrases = Object.keys(COMMON_PHRASES);
    for (const phrase of phrases) {
      if (text.toLowerCase().includes(phrase)) {
        const translations = COMMON_PHRASES[phrase];
        if (translations && translations[targetLanguage]) {
          const replacement = translations[targetLanguage][0];
          result = result.replace(new RegExp(phrase, 'gi'), replacement);
        }
      }
    }

    // If no specific translations found, add language indicator
    if (result === text && sourceLanguage !== targetLanguage) {
      // Simulate basic word order and structure changes
      result = this.simulateTranslation(text, sourceLanguage, targetLanguage);
    }

    return result;
  }

  private simulateTranslation(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): string {
    // Simulate translation based on language patterns
    const languagePrefix = this.getLanguagePrefix(targetLanguage);
    return `[${languagePrefix}] ${text}`;
  }

  private getLanguagePrefix(lang: SupportedLanguage): string {
    const prefixes: Partial<Record<SupportedLanguage, string>> = {
      [SupportedLanguage.SPANISH]: 'ES',
      [SupportedLanguage.FRENCH]: 'FR',
      [SupportedLanguage.GERMAN]: 'DE',
      [SupportedLanguage.ITALIAN]: 'IT',
      [SupportedLanguage.PORTUGUESE]: 'PT',
      [SupportedLanguage.RUSSIAN]: 'RU',
      [SupportedLanguage.CHINESE]: 'ZH',
      [SupportedLanguage.JAPANESE]: 'JA',
      [SupportedLanguage.KOREAN]: 'KO',
      [SupportedLanguage.ARABIC]: 'AR'
    };
    return prefixes[lang] || 'TR';
  }

  private enhanceTranslation(text: string, targetLanguage: SupportedLanguage, tone: TranslationTone): string {
    // Apply tone-specific enhancements
    if (tone === TranslationTone.PROFESSIONAL || tone === TranslationTone.FORMAL) {
      return text;
    }
    return text;
  }

  private async generateAlternatives(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    tone: TranslationTone
  ): Promise<TranslationAlternative[]> {
    const alternatives: TranslationAlternative[] = [];

    // Generate alternative with different tone
    const alternativeTone = tone === TranslationTone.CASUAL ? TranslationTone.PROFESSIONAL : TranslationTone.CASUAL;

    const alternativeText = await this.performTranslation(
      text,
      sourceLanguage,
      targetLanguage,
      alternativeTone,
      TranslationQuality.STANDARD
    );

    alternatives.push({
      text: alternativeText,
      tone: alternativeTone,
      confidence: 0.85
    });

    return alternatives;
  }

  private calculateConfidence(
    originalText: string,
    translatedText: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): number {
    // Base confidence on various factors
    let confidence = 0.8;

    // Check if translation was actually performed
    if (originalText === translatedText && sourceLanguage !== targetLanguage) {
      confidence -= 0.3;
    }

    // Check for common phrases (higher confidence)
    const lowerText = originalText.toLowerCase();
    if (COMMON_PHRASES[lowerText]) {
      confidence += 0.15;
    }

    // Ensure confidence is within bounds
    return Math.min(1, Math.max(0, confidence));
  }

  private detectToneMatch(text: string, expectedTone: TranslationTone): number {
    const detectedTone = this.detectTone(text);
    return detectedTone === expectedTone ? 1.0 : 0.7;
  }

  private calculateContextScore(text: string): number {
    // Simple context score based on text structure
    const hasParagraphs = text.includes('\n\n');
    const hasListItems = text.includes('\n-') || text.includes('\n*');
    const hasQuestions = text.includes('?');

    let score = 0.5;
    if (hasParagraphs) {
      score += 0.2;
    }
    if (hasListItems) {
      score += 0.15;
    }
    if (hasQuestions) {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private getFromMemory(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Translation | null {
    const key = this.getMemoryKey(text, sourceLanguage, targetLanguage);
    const cached = this.memory.get(key);

    if (cached) {
      return {
        id: `cached-${Date.now()}`,
        originalText: text,
        translatedText: cached.translatedText,
        sourceLanguage,
        targetLanguage,
        tone: TranslationTone.NEUTRAL,
        quality: TranslationQuality.STANDARD,
        status: TranslationStatus.COMPLETED,
        source: TranslationSource.CACHE,
        confidence: cached.quality,
        metadata: {
          processingTime: 0,
          wordCount: this.countWords(text),
          characterCount: text.length,
          toneMatch: 1,
          contextScore: 1,
          modelVersion: this.modelVersion
        },
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  private storeInMemory(
    originalText: string,
    translatedText: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): void {
    const key = this.getMemoryKey(originalText, sourceLanguage, targetLanguage);
    const existing = this.memory.get(key);

    const memory: TranslationMemory = {
      id: `mem-${Date.now()}`,
      sourceText: originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      frequency: existing ? existing.frequency + 1 : 1,
      lastUsed: new Date().toISOString(),
      quality: existing ? existing.quality : 0.9
    };

    this.memory.set(key, memory);
  }

  private getMemoryKey(text: string, sourceLanguage: SupportedLanguage, targetLanguage: SupportedLanguage): string {
    return `${sourceLanguage}-${targetLanguage}-${text.substring(0, 100)}`;
  }

  private updateStatistics(result: EmailTranslationResult): void {
    this.statistics.totalTranslations++;
    this.statistics.totalWordsTranslated += result.metadata.totalWordCount;
    this.statistics.totalCharactersTranslated +=
      result.subjectTranslation.originalText.length + result.bodyTranslation.originalText.length;

    // Update language counts
    const langKey = `${result.sourceLanguage}-${result.targetLanguage}`;
    this.statistics.translationsByLanguage[langKey] = (this.statistics.translationsByLanguage[langKey] || 0) + 1;

    // Update tone counts
    this.statistics.translationsByTone[result.tone]++;

    // Update source counts
    this.statistics.translationsBySource[result.metadata.translationSource]++;
  }

  private initStatistics(): TranslationStatistics {
    return {
      totalTranslations: 0,
      totalWordsTranslated: 0,
      totalCharactersTranslated: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      translationsByLanguage: {},
      translationsByTone: {
        [TranslationTone.PROFESSIONAL]: 0,
        [TranslationTone.CASUAL]: 0,
        [TranslationTone.FORMAL]: 0,
        [TranslationTone.NEUTRAL]: 0
      },
      translationsBySource: {
        [TranslationSource.ORIGINAL]: 0,
        [TranslationSource.AI]: 0,
        [TranslationSource.HUMAN]: 0,
        [TranslationSource.CACHE]: 0
      },
      cacheHits: 0,
      cacheMisses: 0,
      memorySize: 0
    };
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  updateConfig(config: Partial<TranslationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  clearMemory(): void {
    this.memory.clear();
  }

  clearCorrections(): void {
    this.corrections = [];
  }

  resetStatistics(): void {
    this.statistics = this.initStatistics();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTranslationService(config?: Partial<TranslationConfig>): TranslationService {
  return new TranslationService(config);
}
