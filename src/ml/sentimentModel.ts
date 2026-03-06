/**
 * Sentiment Analysis ML Model
 * Part of v1.4.0 AI-Powered Intelligence
 * 
 * Provides sentiment, emotion, and tone analysis for email content.
 */

import {
  Sentiment,
  Emotion,
  Tone,
  SentimentScore,
  SentimentConfidence,
  SentimentAnalysisResult,
  SentimentContext,
  EmotionScore,
  ToneScore,
  ReplyToneSuggestion,
  SentimentFeedback,
  SentimentConfig,
  DEFAULT_SENTIMENT_CONFIG,
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
  URGENT_WORDS,
  FORMAL_WORDS,
  CASUAL_WORDS,
  AGGRESSIVE_WORDS,
  EMOTION_WORDS,
  REPLY_TONE_EXAMPLES,
} from '../types/sentimentAnalysis';

/**
 * Sentiment Analysis Model
 */
export class SentimentModel {
  private config: SentimentConfig;
  private modelVersion: string = '1.0.0';
  private cache: Map<string, { result: SentimentAnalysisResult; timestamp: number }>;

  constructor(config?: Partial<SentimentConfig>) {
    this.config = { ...DEFAULT_SENTIMENT_CONFIG, ...config };
    this.cache = new Map();
  }

  // ============================================================================
  // Main Analysis Methods
  // ============================================================================

  /**
   * Analyze sentiment of email content
   */
  analyze(context: SentimentContext): SentimentAnalysisResult {
    const startTime = performance.now();

    // Check cache first
    if (this.config.cacheResults) {
      const cached = this.cache.get(context.emailId);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.result;
      }
    }

    const fullText = `${context.subject} ${context.body}`.toLowerCase();
    const words = this.tokenize(fullText);

    // Calculate sentiment score
    const sentimentScore = this.calculateSentimentScore(words);
    const overallSentiment = this.determineSentiment(sentimentScore);
    const sentimentConfidence = this.calculateSentimentConfidence(sentimentScore, words);

    // Calculate emotions
    const emotions = this.config.enableEmotionDetection
      ? this.detectEmotions(words)
      : [];

    // Calculate tones
    const tones = this.config.enableToneAnalysis
      ? this.detectTones(words, fullText)
      : [];

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    const result: SentimentAnalysisResult = {
      overall: overallSentiment,
      confidence: sentimentConfidence,
      score: sentimentScore,
      emotions,
      tone: tones,
      timestamp: new Date().toISOString(),
      processingTime,
      modelVersion: this.modelVersion,
    };

    // Cache the result
    if (this.config.cacheResults) {
      this.cache.set(context.emailId, { result, timestamp: Date.now() });
    }

    return result;
  }

  /**
   * Analyze multiple emails
   */
  analyzeBatch(contexts: SentimentContext[]): SentimentAnalysisResult[] {
    return contexts.map(context => this.analyze(context));
  }

  // ============================================================================
  // Sentiment Calculation Methods
  // ============================================================================

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Calculate sentiment score from words
   */
  private calculateSentimentScore(words: string[]): SentimentScore {
    let positiveCount = 0;
    let negativeCount = 0;
    let total = 0;

    // Count positive and negative words
    words.forEach(word => {
      if (POSITIVE_WORDS.includes(word)) {
        positiveCount++;
        total++;
      }
      if (NEGATIVE_WORDS.includes(word)) {
        negativeCount++;
        total++;
      }
    });

    // Handle edge cases
    if (total === 0) {
      return 0; // Neutral if no sentiment words found
    }

    // Calculate score from -1 to 1
    const rawScore = (positiveCount - negativeCount) / Math.max(total, 1);
    
    // Apply intensity scaling
    const intensity = Math.min(1, total / 10); // Max intensity at 10 sentiment words
    const scaledScore = rawScore * (0.5 + intensity * 0.5);

    return Math.max(-1, Math.min(1, scaledScore));
  }

  /**
   * Determine sentiment category from score
   */
  private determineSentiment(score: SentimentScore): Sentiment {
    if (score > 0.1) return Sentiment.POSITIVE;
    if (score < -0.1) return Sentiment.NEGATIVE;
    return Sentiment.NEUTRAL;
  }

  /**
   * Calculate confidence in sentiment detection
   */
  private calculateSentimentConfidence(score: SentimentScore, words: string[]): SentimentConfidence {
    // Base confidence on how far from neutral
    let confidence = Math.abs(score);

    // Boost confidence if there are many sentiment words
    const sentimentWords = words.filter(
      w => POSITIVE_WORDS.includes(w) || NEGATIVE_WORDS.includes(w)
    );
    const wordRatio = Math.min(1, sentimentWords.length / 5);
    
    // Combine factors
    confidence = (confidence * 0.7) + (wordRatio * 0.3);

    return Math.max(0.3, Math.min(0.99, confidence));
  }

  // ============================================================================
  // Emotion Detection Methods
  // ============================================================================

  /**
   * Detect emotions in text
   */
  private detectEmotions(words: string[]): EmotionScore[] {
    const emotionScores: Map<Emotion, { count: number; total: number }> = new Map();

    // Initialize all emotions
    Object.values(Emotion).forEach(emotion => {
      emotionScores.set(emotion, { count: 0, total: 0 });
    });

    // Count emotion words
    words.forEach(word => {
      Object.entries(EMOTION_WORDS).forEach(([emotion, emotionWords]) => {
        if (emotionWords.includes(word)) {
          const current = emotionScores.get(emotion as Emotion)!;
          current.count++;
          current.total = emotionWords.length;
        }
      });
    });

    // Calculate scores
    const results: EmotionScore[] = [];
    emotionScores.forEach((data, emotion) => {
      if (data.count > 0) {
        const score = data.count / words.length;
        const confidence = Math.min(0.95, data.count / Math.max(data.total, 1) + 0.3);
        
        results.push({
          emotion,
          score: Math.min(1, score * 10), // Scale up for visibility
          confidence,
        });
      }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top emotions with score > 0
    return results.slice(0, 5);
  }

  // ============================================================================
  // Tone Detection Methods
  // ============================================================================

  /**
   * Detect tones in text
   */
  private detectTones(words: string[], fullText: string): ToneScore[] {
    const tones: ToneScore[] = [];

    // Check for formal tone
    const formalCount = words.filter(w => FORMAL_WORDS.includes(w)).length;
    if (formalCount > 2) {
      tones.push({
        tone: Tone.FORMAL,
        score: Math.min(1, formalCount / 10),
        confidence: Math.min(0.9, 0.5 + formalCount * 0.1),
      });
    }

    // Check for casual tone
    const casualCount = words.filter(w => CASUAL_WORDS.includes(w)).length;
    if (casualCount > 2) {
      tones.push({
        tone: Tone.CASUAL,
        score: Math.min(1, casualCount / 10),
        confidence: Math.min(0.9, 0.5 + casualCount * 0.1),
      });
    }

    // Check for urgent tone
    const urgentCount = words.filter(w => URGENT_WORDS.includes(w)).length;
    if (urgentCount > 0) {
      tones.push({
        tone: Tone.URGENT,
        score: Math.min(1, urgentCount / 5),
        confidence: Math.min(0.95, 0.6 + urgentCount * 0.15),
      });
    }

    // Check for aggressive tone
    const aggressiveCount = words.filter(w => AGGRESSIVE_WORDS.includes(w)).length;
    if (aggressiveCount > 2) {
      tones.push({
        tone: Tone.AGGRESSIVE,
        score: Math.min(1, aggressiveCount / 8),
        confidence: Math.min(0.85, 0.5 + aggressiveCount * 0.1),
      });
    }

    // Check for polite tone
    const politenessMarkers = ['please', 'thank', 'thanks', 'kindly', 'appreciate'];
    const politeCount = words.filter(w => politenessMarkers.includes(w)).length;
    if (politeCount > 1) {
      tones.push({
        tone: Tone.POLITE,
        score: Math.min(1, politeCount / 5),
        confidence: Math.min(0.9, 0.5 + politeCount * 0.15),
      });
    }

    // Check for professional tone (formal but not overly formal)
    if (formalCount > 1 && formalCount < 5 && politeCount > 0) {
      tones.push({
        tone: Tone.PROFESSIONAL,
        score: 0.7,
        confidence: 0.75,
      });
    }

    // Check for friendly tone (casual with politeness)
    if (casualCount > 0 && politeCount > 0) {
      tones.push({
        tone: Tone.FRIENDLY,
        score: 0.7,
        confidence: 0.7,
      });
    }

    // Sort by score
    tones.sort((a, b) => b.score - a.score);

    return tones.slice(0, 4);
  }

  // ============================================================================
  // Recommendation Methods
  // ============================================================================

  /**
   * Generate reply tone suggestions based on analysis
   */
  suggestReplyTone(result: SentimentAnalysisResult): ReplyToneSuggestion {
    const { overall, tone } = result;

    let recommendedTone: Tone;
    let reason: string;
    let example: string;

    // Determine recommended reply tone based on incoming email
    if (tone.find(t => t.tone === Tone.URGENT)) {
      recommendedTone = Tone.URGENT;
      reason = 'The incoming email indicates urgency. Respond promptly and prioritize.';
      example = REPLY_TONE_EXAMPLES[Tone.URGENT][0];
    } else if (tone.find(t => t.tone === Tone.AGGRESSIVE)) {
      recommendedTone = Tone.POLITE;
      reason = 'The incoming email has an aggressive tone. Respond calmly and professionally.';
      example = REPLY_TONE_EXAMPLES[Tone.POLITE][0];
    } else if (tone.find(t => t.tone === Tone.FORMAL)) {
      recommendedTone = Tone.FORMAL;
      reason = 'The incoming email is formal. Match the formality level in your response.';
      example = REPLY_TONE_EXAMPLES[Tone.FORMAL][0];
    } else if (tone.find(t => t.tone === Tone.CASUAL)) {
      recommendedTone = Tone.CASUAL;
      reason = 'The incoming email is casual. Feel free to respond in a relaxed manner.';
      example = REPLY_TONE_EXAMPLES[Tone.CASUAL][0];
    } else if (overall === Sentiment.NEGATIVE) {
      recommendedTone = Tone.POLITE;
      reason = 'The incoming email has negative sentiment. Respond with empathy and professionalism.';
      example = REPLY_TONE_EXAMPLES[Tone.POLITE][0];
    } else if (overall === Sentiment.POSITIVE) {
      recommendedTone = Tone.FRIENDLY;
      reason = 'The incoming email is positive. Match the friendly tone in your response.';
      example = REPLY_TONE_EXAMPLES[Tone.FRIENDLY][0];
    } else {
      recommendedTone = Tone.PROFESSIONAL;
      reason = 'The incoming email is neutral. Respond professionally and clearly.';
      example = REPLY_TONE_EXAMPLES[Tone.PROFESSIONAL][0];
    }

    return {
      recommendedTone,
      confidence: 0.75,
      reason,
      example,
    };
  }

  /**
   * Generate sentiment feedback for user
   */
  generateFeedback(result: SentimentAnalysisResult): SentimentFeedback {
    const { overall, emotions, tone } = result;

    const dominantEmotion = emotions.length > 0 ? emotions[0].emotion : Emotion.NEUTRAL;
    const dominantTone = tone.length > 0 ? tone[0].tone : Tone.PROFESSIONAL;

    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Generate recommendations based on analysis
    if (overall === Sentiment.NEGATIVE) {
      recommendations.push('Consider responding with empathy and understanding.');
      if (emotions.find(e => e.emotion === Emotion.ANGER)) {
        warnings.push('This email contains expressions of anger. Handle with care.');
      }
    }

    if (tone.find(t => t.tone === Tone.URGENT)) {
      recommendations.push('This email appears urgent. Consider prioritizing your response.');
    }

    if (tone.find(t => t.tone === Tone.AGGRESSIVE)) {
      warnings.push('The tone may be perceived as aggressive. Consider a calm response.');
    }

    // Generate interpretation
    let interpretation = `This email has a ${overall} sentiment`;
    if (emotions.length > 0) {
      interpretation += ` with ${dominantEmotion.toLowerCase()} as the dominant emotion`;
    }
    if (tone.length > 0) {
      interpretation += `. The tone is ${dominantTone.toLowerCase()}.`;
    } else {
      interpretation += '.';
    }

    return {
      detectedSentiment: overall,
      detectedTone: dominantTone,
      dominantEmotion,
      interpretation,
      recommendations,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ============================================================================
  // Statistics Methods
  // ============================================================================

  /**
   * Calculate sentiment trend from multiple results
   */
  calculateTrend(results: SentimentAnalysisResult[]): {
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    if (results.length === 0) {
      return { averageScore: 0, trend: 'stable' };
    }

    const scores = results.map(r => r.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate trend from first half to second half
    const midpoint = Math.floor(scores.length / 2);
    const firstHalfAvg = scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / Math.max(1, midpoint);
    const secondHalfAvg = scores.slice(midpoint).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - midpoint);

    let trend: 'improving' | 'declining' | 'stable';
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 0.1) {
      trend = 'improving';
    } else if (diff < -0.1) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { averageScore, trend };
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SentimentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SentimentConfig {
    return { ...this.config };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get model version
   */
  getVersion(): string {
    return this.modelVersion;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a sentiment model instance
 */
export function createSentimentModel(config?: Partial<SentimentConfig>): SentimentModel {
  return new SentimentModel(config);
}

/**
 * Analyze sentiment of a single text
 */
export function analyzeSentiment(
  text: string,
  config?: Partial<SentimentConfig>
): SentimentAnalysisResult {
  const model = createSentimentModel(config);
  const context: SentimentContext = {
    emailId: 'single-analysis',
    subject: '',
    body: text,
    sender: '',
    recipients: [],
    timestamp: new Date(),
  };
  return model.analyze(context);
}
