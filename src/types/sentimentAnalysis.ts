/**
 * Sentiment Analysis Type Definitions
 * Part of v1.4.0 AI-Powered Intelligence
 */

// ============================================================================
// Sentiment Types
// ============================================================================

/**
 * Overall sentiment of text
 */
export enum Sentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

/**
 * Specific emotions detected in text
 */
export enum Emotion {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  ANTICIPATION = 'anticipation',
  TRUST = 'trust',
  NEUTRAL = 'neutral',
}

/**
 * Tone of communication
 */
export enum Tone {
  FORMAL = 'formal',
  CASUAL = 'casual',
  URGENT = 'urgent',
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  AGGRESSIVE = 'aggressive',
  PASSIVE = 'passive',
  ASSERTIVE = 'assertive',
  POLITE = 'polite',
}

// ============================================================================
// Sentiment Score Types
// ============================================================================

/**
 * Confidence score for sentiment analysis (0-1)
 */
export type SentimentConfidence = number;

/**
 * Sentiment score range from -1 (negative) to 1 (positive)
 */
export type SentimentScore = number;

// ============================================================================
// Analysis Result Types
// ============================================================================

/**
 * Result of sentiment analysis
 */
export interface SentimentAnalysisResult {
  overall: Sentiment;
  confidence: SentimentConfidence;
  score: SentimentScore;
  emotions: EmotionScore[];
  tone: ToneScore[];
  timestamp: string;
  processingTime: number;
  modelVersion: string;
}

/**
 * Emotion with confidence score
 */
export interface EmotionScore {
  emotion: Emotion;
  score: number; // 0-1
  confidence: SentimentConfidence;
}

/**
 * Tone with confidence score
 */
export interface ToneScore {
  tone: Tone;
  score: number; // 0-1
  confidence: SentimentConfidence;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context for sentiment analysis
 */
export interface SentimentContext {
  emailId: string;
  subject: string;
  body: string;
  sender: string;
  recipients: string[];
  timestamp: Date;
  previousEmails?: EmailSentimentHistory[];
}

/**
 * Email sentiment history for thread analysis
 */
export interface EmailSentimentHistory {
  emailId: string;
  timestamp: Date;
  sender: string;
  sentiment: Sentiment;
  score: SentimentScore;
}

// ============================================================================
// Suggestion Types
// ============================================================================

/**
 * Suggested reply tone based on sentiment analysis
 */
export interface ReplyToneSuggestion {
  recommendedTone: Tone;
  confidence: SentimentConfidence;
  reason: string;
  example: string;
}

/**
 * Analysis feedback for user
 */
export interface SentimentFeedback {
  detectedSentiment: Sentiment;
  detectedTone: Tone;
  dominantEmotion: Emotion;
  interpretation: string;
  recommendations: string[];
  warnings?: string[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Sentiment statistics for a period
 */
export interface SentimentStatistics {
  totalEmails: number;
  sentimentDistribution: Record<Sentiment, number>;
  emotionDistribution: Record<Emotion, number>;
  toneDistribution: Record<Tone, number>;
  averageSentimentScore: number;
  sentimentTrend: SentimentTrend[];
  topPositiveEmails: SentimentEntry[];
  topNegativeEmails: SentimentEntry[];
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Sentiment trend over time
 */
export interface SentimentTrend {
  date: Date;
  averageScore: number;
  sentiment: Sentiment;
  emailCount: number;
}

/**
 * Sentiment entry for statistics
 */
export interface SentimentEntry {
  emailId: string;
  subject: string;
  sentiment: Sentiment;
  score: SentimentScore;
  timestamp: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for sentiment analysis
 */
export interface SentimentConfig {
  enabled: boolean;
  enableEmotionDetection: boolean;
  enableToneAnalysis: boolean;
  enableReplySuggestions: boolean;
  minConfidence: number;
  cacheResults: boolean;
  cacheTimeout: number; // milliseconds
  languages: string[];
}

/**
 * Default sentiment analysis configuration
 */
export const DEFAULT_SENTIMENT_CONFIG: SentimentConfig = {
  enabled: true,
  enableEmotionDetection: true,
  enableToneAnalysis: true,
  enableReplySuggestions: true,
  minConfidence: 0.5,
  cacheResults: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  languages: ['en', 'en-US', 'en-GB']
};

// ============================================================================
// Word/Phrase Dictionaries for Analysis
// ============================================================================

/**
 * Positive words for sentiment scoring
 */
export const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'outstanding', 'brilliant', 'superb', 'awesome', 'terrific',
  'happy', 'pleased', 'delighted', 'thrilled', 'excited', 'joyful',
  'love', 'enjoy', 'like', 'appreciate', 'thank', 'thanks',
  'success', 'successful', 'accomplish', 'achieve', 'congratulations',
  'beautiful', 'perfect', 'best', 'positive', 'optimistic', 'hopeful',
  'grateful', 'blessed', 'fortunate', 'lucky', 'pleasure', 'glad',
  'recommend', 'approved', 'accepted', 'agreed', 'confirmed'
];

/**
 * Negative words for sentiment scoring
 */
export const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'horrible', 'dreadful', 'poor',
  'disappointing', 'unfortunate', 'regret', 'sorry', 'sad',
  'angry', 'upset', 'frustrated', 'annoyed', 'irritated', 'furious',
  'hate', 'dislike', 'displeased', 'unhappy', 'miserable',
  'fail', 'failure', 'failed', 'reject', 'rejected', 'denied',
  'problem', 'issue', 'trouble', 'difficult', 'challenge',
  'worst', 'negative', 'pessimistic', 'hopeless', 'impossible',
  'worried', 'concerned', 'anxious', 'stressed', 'overwhelmed',
  'unacceptable', 'unfair', 'unjust', 'wrong', 'mistake', 'error'
];

/**
 * Words indicating urgency
 */
export const URGENT_WORDS = [
  'urgent', 'asap', 'immediately', 'right now', 'today', 'now',
  'emergency', 'critical', 'priority', 'important', 'deadline',
  'time sensitive', 'hurry', 'quickly', 'soon', 'at once'
];

/**
 * Formal words for tone detection
 */
export const FORMAL_WORDS = [
  'dear', 'sincerely', 'regards', 'respectfully', 'cordially',
  'furthermore', 'moreover', 'therefore', 'consequently', 'additionally',
  'accordingly', 'herewith', 'please find', 'attached hereto',
  'hereby', 'whereas', 'pursuant to', 'notwithstanding'
];

/**
 * Casual words for tone detection
 */
export const CASUAL_WORDS = [
  'hey', 'hi', 'hello', 'hiya', 'yo', 'what\'s up', 'sup',
  'cool', 'awesome', 'great', 'thanks', 'cheers', 'thanks a lot',
  'btw', 'by the way', 'lol', 'omg', 'wow', 'yeah', 'yep',
  'kinda', 'sorta', 'gonna', 'wanna', 'gotta'
];

/**
 * Aggressive words for tone detection
 */
export const AGGRESSIVE_WORDS = [
  'demand', 'must', 'have to', 'need to', 'expect', 'require',
  'insist', 'insist on', 'immediately', 'right now', 'or else',
  'better', 'should', 'should have', 'ought to'
];

/**
 * Emotion word mappings
 */
export const EMOTION_WORDS: Record<Emotion, string[]> = {
  [Emotion.JOY]: [
    'happy', 'joy', 'joyful', 'excited', 'delighted', 'thrilled',
    'elated', 'ecstatic', 'overjoyed', 'cheerful', 'gleeful',
    'amused', 'entertained', 'pleased', 'content', 'satisfied'
  ],
  [Emotion.SADNESS]: [
    'sad', 'unhappy', 'depressed', 'down', 'blue', 'gloomy',
    'miserable', 'heartbroken', 'devastated', 'disappointed',
    'discouraged', 'hopeless', 'sorrowful', 'grieving'
  ],
  [Emotion.ANGER]: [
    'angry', 'furious', 'mad', 'irate', 'outraged', 'annoyed',
    'irritated', 'frustrated', 'upset', 'livid', 'incensed',
    'enraged', 'hostile', 'resentful', 'indignant'
  ],
  [Emotion.FEAR]: [
    'afraid', 'scared', 'frightened', 'terrified', 'anxious',
    'worried', 'concerned', 'nervous', 'apprehensive', 'uneasy',
    'fearful', 'dreadful', 'panic', 'fear'
  ],
  [Emotion.SURPRISE]: [
    'surprised', 'shocked', 'amazed', 'astonished', 'stunned',
    'astounded', 'flabbergasted', 'bewildered', 'confused'
  ],
  [Emotion.DISGUST]: [
    'disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated',
    'appalled', 'horrified', 'dislike', 'loathe'
  ],
  [Emotion.ANTICIPATION]: [
    'expect', 'anticipate', 'look forward', 'hope', 'eager',
    'await', 'prepare', 'plan', 'foresee'
  ],
  [Emotion.TRUST]: [
    'trust', 'believe', 'confidence', 'faith', 'rely', 'depend',
    'certain', 'sure', 'assured', 'convinced'
  ],
  [Emotion.NEUTRAL]: []
};

// ============================================================================
// Tone Recommendation Examples
// ============================================================================

/**
 * Reply tone examples
 */
export const REPLY_TONE_EXAMPLES: Record<Tone, string[]> = {
  [Tone.FORMAL]: [
    'Dear [Name], Thank you for your email. I will review the information and respond shortly.',
    'Dear [Name], I acknowledge receipt of your message and will address the matter at hand.'
  ],
  [Tone.CASUAL]: [
    'Hey [Name], Thanks for reaching out! I\'ll take a look and get back to you soon.',
    'Hi [Name], Got your message! Let me check on that and let you know.'
  ],
  [Tone.URGENT]: [
    'Dear [Name], I am treating this as urgent and will respond immediately.',
    '[Name], This requires immediate attention. I am prioritizing this request.'
  ],
  [Tone.PROFESSIONAL]: [
    'Dear [Name], Thank you for your inquiry. I will provide a comprehensive response.',
    'Hello [Name], I appreciate your message and will follow up appropriately.'
  ],
  [Tone.FRIENDLY]: [
    'Hi [Name], Thanks so much for your message! I\'m happy to help with this.',
    'Hello [Name], Great to hear from you! Let me assist you with this.'
  ],
  [Tone.AGGRESSIVE]: [],
  [Tone.PASSIVE]: [
    'Dear [Name], I understand your concern and will look into this when possible.'
  ],
  [Tone.ASSERTIVE]: [
    'Dear [Name], I will address this matter and provide a clear resolution.',
    '[Name], I understand the requirements and will proceed accordingly.'
  ],
  [Tone.POLITE]: [
    'Dear [Name], Thank you for your email. I would be happy to assist you.',
    'Hello [Name], I appreciate your message and will do my best to help.'
  ]
};

// ============================================================================
// Training Data Types
// ============================================================================

/**
 * Training example for sentiment model
 */
export interface SentimentTrainingExample {
  text: string;
  sentiment: Sentiment;
  emotion?: Emotion;
  tone?: Tone;
  confidence: number;
}

/**
 * Feedback from user on sentiment analysis
 */
export interface SentimentFeedbackRecord {
  emailId: string;
  originalSentiment: Sentiment;
  correctSentiment: Sentiment;
  originalTone: Tone;
  correctTone: Tone;
  timestamp: Date;
  comment?: string;
}
