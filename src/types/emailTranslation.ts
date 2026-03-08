/**
 * Email Translation Types
 * Part of v1.4.0 AI-Powered Intelligence
 */

// ============================================================================
// Enums
// ============================================================================

export enum SupportedLanguage {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  RUSSIAN = 'ru',
  CHINESE = 'zh',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ARABIC = 'ar',
  HINDI = 'hi',
  DUTCH = 'nl',
  POLISH = 'pl',
  TURKISH = 'tr',
  VIETNAMESE = 'vi',
  THAI = 'th',
  INDONESIAN = 'id',
  SWEDISH = 'sv',
  NORWEGIAN = 'no',
}

export enum TranslationTone {
  /** Professional/business tone */
  PROFESSIONAL = 'PROFESSIONAL',
  /** Casual/friendly tone */
  CASUAL = 'CASUAL',
  /** Formal tone */
  FORMAL = 'FORMAL',
  /** Neutral tone */
  NEUTRAL = 'NEUTRAL',
}

export enum TranslationQuality {
  /** High quality - context-aware, tone-matched */
  HIGH = 'HIGH',
  /** Standard quality - accurate translation */
  STANDARD = 'STANDARD',
  /** Quick translation - basic accuracy */
  QUICK = 'QUICK',
}

export enum TranslationStatus {
  /** Translation in progress */
  PENDING = 'PENDING',
  /** Translation completed successfully */
  COMPLETED = 'COMPLETED',
  /** Translation failed */
  FAILED = 'FAILED',
  /** Translation cancelled */
  CANCELLED = 'CANCELLED',
}

export enum TranslationSource {
  /** Original text, not translated */
  ORIGINAL = 'ORIGINAL',
  /** Translated by AI */
  AI = 'AI',
  /** Translated by human */
  HUMAN = 'HUMAN',
  /** From translation memory cache */
  CACHE = 'CACHE',
}

// ============================================================================
// Interfaces
// ============================================================================

export interface EmailForTranslation {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
}

export interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  tone: TranslationTone;
  quality: TranslationQuality;
  status: TranslationStatus;
  source: TranslationSource;
  confidence: number;
  alternatives?: TranslationAlternative[];
  metadata: TranslationMetadata;
  timestamp: string;
}

export interface TranslationAlternative {
  text: string;
  tone: TranslationTone;
  confidence: number;
}

export interface TranslationMetadata {
  processingTime: number;
  wordCount: number;
  characterCount: number;
  detectedLanguage?: SupportedLanguage;
  toneMatch: number;
  contextScore: number;
  modelVersion: string;
}

export interface EmailTranslationResult {
  id: string;
  emailId: string;
  subjectTranslation: Translation;
  bodyTranslation: Translation;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  tone: TranslationTone;
  overallConfidence: number;
  metadata: {
    totalProcessingTime: number;
    totalWordCount: number;
    translationSource: TranslationSource;
  };
  timestamp: string;
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  context?: string;
  frequency: number;
  lastUsed: string;
  quality: number;
}

export interface TranslationConfig {
  /** Default target language for translations */
  defaultTargetLanguage: SupportedLanguage;
  /** Default source language (auto-detect if not specified) */
  defaultSourceLanguage?: SupportedLanguage;
  /** Default translation tone */
  defaultTone: TranslationTone;
  /** Translation quality level */
  quality: TranslationQuality;
  /** Enable translation memory caching */
  enableMemory: boolean;
  /** Enable context-aware translation */
  enableContext: boolean;
  /** Enable tone detection and matching */
  enableToneDetection: boolean;
  /** Enable alternative translations */
  enableAlternatives: boolean;
  /** Maximum text length for translation */
  maxLength: number;
  /** Enable learning from user corrections */
  enableLearning: boolean;
}

export interface TranslationStatistics {
  totalTranslations: number;
  totalWordsTranslated: number;
  totalCharactersTranslated: number;
  averageProcessingTime: number;
  averageConfidence: number;
  translationsByLanguage: Record<string, number>;
  translationsByTone: Record<TranslationTone, number>;
  translationsBySource: Record<TranslationSource, number>;
  cacheHits: number;
  cacheMisses: number;
  memorySize: number;
}

export interface UserCorrection {
  originalText: string;
  originalTranslation: string;
  correctedTranslation: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  timestamp: string;
}

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  alternatives: Array<{ language: SupportedLanguage; confidence: number }>;
}

export interface TranslationContext {
  email: EmailForTranslation;
  targetLanguage?: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
  tone?: TranslationTone;
  quality?: TranslationQuality;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  defaultTargetLanguage: SupportedLanguage.ENGLISH,
  defaultTone: TranslationTone.NEUTRAL,
  quality: TranslationQuality.STANDARD,
  enableMemory: true,
  enableContext: true,
  enableToneDetection: true,
  enableAlternatives: false,
  maxLength: 10000,
  enableLearning: true
};

// ============================================================================
// Constants
// ============================================================================

/** Language names for display */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  [SupportedLanguage.ENGLISH]: 'English',
  [SupportedLanguage.SPANISH]: 'Spanish',
  [SupportedLanguage.FRENCH]: 'French',
  [SupportedLanguage.GERMAN]: 'German',
  [SupportedLanguage.ITALIAN]: 'Italian',
  [SupportedLanguage.PORTUGUESE]: 'Portuguese',
  [SupportedLanguage.RUSSIAN]: 'Russian',
  [SupportedLanguage.CHINESE]: 'Chinese',
  [SupportedLanguage.JAPANESE]: 'Japanese',
  [SupportedLanguage.KOREAN]: 'Korean',
  [SupportedLanguage.ARABIC]: 'Arabic',
  [SupportedLanguage.HINDI]: 'Hindi',
  [SupportedLanguage.DUTCH]: 'Dutch',
  [SupportedLanguage.POLISH]: 'Polish',
  [SupportedLanguage.TURKISH]: 'Turkish',
  [SupportedLanguage.VIETNAMESE]: 'Vietnamese',
  [SupportedLanguage.THAI]: 'Thai',
  [SupportedLanguage.INDONESIAN]: 'Indonesian',
  [SupportedLanguage.SWEDISH]: 'Swedish',
  [SupportedLanguage.NORWEGIAN]: 'Norwegian'
};

/** Common language pairs for optimization */
export const COMMON_LANGUAGE_PAIRS = [
  ['en', 'es'],
  ['en', 'fr'],
  ['en', 'de'],
  ['en', 'zh'],
  ['en', 'ja'],
  ['es', 'en'],
  ['fr', 'en'],
  ['de', 'en']
];

/** Professional tone indicators */
export const PROFESSIONAL_INDICATORS = [
  'dear', 'sincerely', 'regards', 'respectfully', 'kindly',
  'please find attached', 'i am writing to', 'thank you for your attention'
];

/** Casual tone indicators */
export const CASUAL_INDICATORS = [
  'hey', 'hi there', 'thanks', 'cheers', 'best', 'talk soon',
  'catch up', 'no worries', 'sounds good', 'let me know'
];

/** Formal tone indicators */
export const FORMAL_INDICATORS = [
  'to whom it may concern', 'dear sir or madam', 'yours faithfully',
  'i hereby', 'please accept', 'in accordance with', 'pursuant to'
];

/** Common translation phrases for quality checking */
export const COMMON_PHRASES: Record<string, Partial<Record<SupportedLanguage, string[]>>> = {
  'thank you': {
    [SupportedLanguage.SPANISH]: ['gracias', 'muchas gracias'],
    [SupportedLanguage.FRENCH]: ['merci', 'je vous remercie'],
    [SupportedLanguage.GERMAN]: ['danke', 'vielen dank'],
    [SupportedLanguage.ITALIAN]: ['grazie', 'molte grazie']
  },
  'best regards': {
    [SupportedLanguage.SPANISH]: ['saludos', 'atentamente'],
    [SupportedLanguage.FRENCH]: ['cordialement', 'bien cordialement'],
    [SupportedLanguage.GERMAN]: ['mit freundlichen grüßen', 'beste grüße'],
    [SupportedLanguage.ITALIAN]: ['cordiali saluti', 'distinti saluti']
  }
};

/** Language detection patterns */
export const LANGUAGE_PATTERNS: Partial<Record<SupportedLanguage, RegExp[]>> = {
  [SupportedLanguage.ENGLISH]: [
    /\b(the|is|are|was|were|have|has|had|do|does|did|will|would|can|could|shall|should)\b/i
  ],
  [SupportedLanguage.SPANISH]: [
    /\b(el|la|los|las|es|son|está|están|tiene|tienen|hacer|hago|haré)\b/i
  ],
  [SupportedLanguage.FRENCH]: [
    /\b(le|la|les|est|sont|avoir|être|je|tu|il|elle|nous|vous|ils)\b/i
  ],
  [SupportedLanguage.GERMAN]: [
    /\b(der|die|das|ist|sind|haben|werden|kann|können|muss|müssen)\b/i
  ]
};
