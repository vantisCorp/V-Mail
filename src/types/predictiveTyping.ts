/**
 * Predictive Typing / Smart Compose Type Definitions
 * Part of v1.4.0 AI-Powered Intelligence
 */

// ============================================================================
// Suggestion Types
// ============================================================================

/**
 * Types of predictive suggestions
 */
export enum SuggestionType {
  /** Text completion for current word/phrase */
  COMPLETION = 'completion',
  /** Full phrase suggestions */
  PHRASE = 'phrase',
  /** Grammar corrections */
  GRAMMAR = 'grammar',
  /** Style improvements */
  STYLE = 'style',
  /** Template suggestions */
  TEMPLATE = 'template',
  /** Email address suggestions */
  EMAIL = 'email',
  /** Subject suggestions */
  SUBJECT = 'subject',
}

/**
 * Priority level of suggestions
 */
export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Source of the suggestion
 */
export enum SuggestionSource {
  /** Language model prediction */
  LANGUAGE_MODEL = 'language_model',
  /** User's previous writing patterns */
  USER_PATTERN = 'user_pattern',
  /** Common phrases/templates */
  COMMON = 'common',
  /** Grammar checker */
  GRAMMAR_CHECKER = 'grammar_checker',
  /** Style guide */
  STYLE_GUIDE = 'style_guide',
}

// ============================================================================
// Suggestion Types
// ============================================================================

/**
 * Base interface for all suggestions
 */
export interface BaseSuggestion {
  id: string;
  type: SuggestionType;
  text: string;
  confidence: number; // 0-1
  priority: SuggestionPriority;
  source: SuggestionSource;
  timestamp: string;
}

/**
 * Text completion suggestion
 */
export interface CompletionSuggestion extends BaseSuggestion {
  type: SuggestionType.COMPLETION;
  startIndex: number;
  endIndex: number;
  originalText: string;
  displayText: string;
  isFullWord: boolean;
}

/**
 * Phrase suggestion
 */
export interface PhraseSuggestion extends BaseSuggestion {
  type: SuggestionType.PHRASE;
  category: string; // e.g., 'greeting', 'closing', 'transition'
  phrase: string;
  context: string;
}

/**
 * Grammar correction suggestion
 */
export interface GrammarSuggestion extends BaseSuggestion {
  type: SuggestionType.GRAMMAR;
  startIndex: number;
  endIndex: number;
  originalText: string;
  correction: string;
  explanation: string;
  errorType: string; // e.g., 'spelling', 'punctuation', 'agreement'
}

/**
 * Style improvement suggestion
 */
export interface StyleSuggestion extends BaseSuggestion {
  type: SuggestionType.STYLE;
  startIndex: number;
  endIndex: number;
  originalText: string;
  improvedText: string;
  explanation: string;
  styleType: string; // e.g., 'conciseness', 'clarity', 'tone'
}

/**
 * Template suggestion
 */
export interface TemplateSuggestion extends BaseSuggestion {
  type: SuggestionType.TEMPLATE;
  templateId: string;
  templateName: string;
  templateContent: string;
  category: string;
  variables: string[]; // Placeholders to fill
}

/**
 * Email address suggestion
 */
export interface EmailSuggestion extends BaseSuggestion {
  type: SuggestionType.EMAIL;
  email: string;
  name: string;
  avatar?: string;
  frequency: number; // How often this email is used
  lastContacted?: string;
}

/**
 * Subject suggestion
 */
export interface SubjectSuggestion extends BaseSuggestion {
  type: SuggestionType.SUBJECT;
  subject: string;
  category: string;
  basedOn: 'content' | 'recipient' | 'history';
}

/**
 * Union type for all suggestions
 */
export type Suggestion =
  | CompletionSuggestion
  | PhraseSuggestion
  | GrammarSuggestion
  | StyleSuggestion
  | TemplateSuggestion
  | EmailSuggestion
  | SubjectSuggestion;

// ============================================================================
// Context Types
// ============================================================================

/**
 * Writing context for prediction
 */
export interface WritingContext {
  emailId?: string;
  /** Current text being composed */
  text: string;
  /** Current cursor position */
  cursorPosition: number;
  /** Field being edited */
  field: 'body' | 'subject' | 'to' | 'cc' | 'bcc';
  /** Recipients (for context) */
  recipients: string[];
  /** Sender */
  sender: string;
  /** Previous emails in thread */
  threadHistory?: string[];
  /** User preferences */
  userPreferences?: UserPreferences;
}

/**
 * User preferences for predictive typing
 */
export interface UserPreferences {
  /** Enable/disable predictive typing */
  enabled: boolean;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Maximum number of suggestions to show */
  maxSuggestions: number;
  /** Enable grammar checking */
  enableGrammar: boolean;
  /** Enable style suggestions */
  enableStyle: boolean;
  /** Enable template suggestions */
  enableTemplates: boolean;
  /** Learning rate for user patterns */
  learningRate: number;
  /** Language preferences */
  language: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Result of getting suggestions
 */
export interface SuggestionsResult {
  suggestions: Suggestion[];
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}

/**
 * Typing statistics for learning
 */
export interface TypingStatistics {
  totalCharacters: number;
  totalWords: number;
  averageWordLength: number;
  commonWords: Record<string, number>;
  commonPhrases: Record<string, number>;
  typingSpeed: number; // words per minute
  acceptanceRate: number; // percentage of suggestions accepted
}

/**
 * User writing pattern for learning
 */
export interface WritingPattern {
  phrases: Record<string, number>;
  wordPairs: Record<string, number>;
  emailPatterns: Record<string, number>;
  subjectPatterns: Record<string, number>;
  lastUpdated: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for predictive typing
 */
export interface PredictiveTypingConfig {
  /** Language model configuration */
  model: {
    name: string;
    version: string;
    maxTokens: number;
    temperature: number;
  };
  /** Performance settings */
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    debounceMs: number;
  };
  /** Learning settings */
  learning: {
    enabled: boolean;
    persistenceEnabled: boolean;
    minSamples: number;
  };
  /** Suggestion settings */
  suggestions: {
    maxCompletions: number;
    maxPhrases: number;
    maxCorrections: number;
    minConfidence: number;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_PREDICTIVE_TYPING_CONFIG: PredictiveTypingConfig = {
  model: {
    name: 'smart-compose',
    version: '1.0.0',
    maxTokens: 100,
    temperature: 0.7,
  },
  performance: {
    cacheEnabled: true,
    cacheSize: 1000,
    debounceMs: 150,
  },
  learning: {
    enabled: true,
    persistenceEnabled: true,
    minSamples: 5,
  },
  suggestions: {
    maxCompletions: 5,
    maxPhrases: 3,
    maxCorrections: 2,
    minConfidence: 0.3,
  },
};

// ============================================================================
// Default User Preferences
// ============================================================================

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  enabled: true,
  minConfidence: 0.4,
  maxSuggestions: 5,
  enableGrammar: true,
  enableStyle: false,
  enableTemplates: true,
  learningRate: 0.1,
  language: 'en',
};

// ============================================================================
// Common Phrases Database
// ============================================================================

export const COMMON_PHRASES = {
  greetings: [
    'Dear {name},',
    'Hi {name},',
    'Hello {name},',
    'Good morning,',
    'Good afternoon,',
  ],
  openings: [
    'I hope this email finds you well.',
    'I am writing to regarding...',
    'Following up on our previous conversation...',
    'Thank you for your email.',
    'I wanted to reach out to you regarding...',
  ],
  transitions: [
    'Furthermore,',
    'In addition,',
    'Moving on to the next point,',
    'With regards to the above,',
    'Additionally,',
  ],
  closings: [
    'Best regards,',
    'Sincerely,',
    'Best,',
    'Thank you,',
    'Looking forward to hearing from you,',
    'Regards,',
  ],
  actions: [
    'Please let me know if you have any questions.',
    'Feel free to contact me if you need any clarification.',
    'I will get back to you as soon as possible.',
    'Please confirm receipt of this email.',
  ],
};

export const EMAIL_TEMPLATES = {
  meeting: {
    id: 'template-meeting',
    name: 'Meeting Request',
    category: 'scheduling',
    content: 'Dear {name},\n\nI would like to request a meeting to discuss {topic}.\n\nPlease let me know your availability for the following dates:\n- {date1}\n- {date2}\n- {date3}\n\nBest regards,\n{sender}',
  },
  follow_up: {
    id: 'template-follow-up',
    name: 'Follow Up',
    category: 'follow-up',
    content: 'Hi {name},\n\nI wanted to follow up on our previous conversation regarding {topic}.\n\nHave you had a chance to review the materials I sent?\n\nPlease let me know if you need any additional information.\n\nBest,\n{sender}',
  },
  introduction: {
    id: 'template-introduction',
    name: 'Introduction',
    category: 'introduction',
    content: 'Dear {name},\n\nI would like to introduce myself. My name is {sender} and I am the {role} at {company}.\n\nI am reaching out to you regarding {reason}.\n\nI look forward to connecting with you.\n\nBest regards,\n{sender}',
  },
  thank_you: {
    id: 'template-thank-you',
    name: 'Thank You',
    category: 'thank-you',
    content: 'Dear {name},\n\nThank you very much for {action}.\n\nI truly appreciate your help and support.\n\nPlease let me know if there is anything I can do to return the favor.\n\nBest regards,\n{sender}',
  },
  apology: {
    id: 'template-apology',
    name: 'Apology',
    category: 'apology',
    content: 'Dear {name},\n\nI would like to sincerely apologize for {issue}.\n\nI understand that this has caused inconvenience and I take full responsibility.\n\nI will ensure that this does not happen again in the future.\n\nPlease accept my sincerest apologies.\n\nSincerely,\n{sender}',
  },
};

// ============================================================================
// Grammar and Style Rules
// ============================================================================

export const COMMON_GRAMMAR_ERRORS = {
  its: {
    pattern: /\bits\b/gi,
    correction: 'it\'s',
    explanation: 'Use "it\'s" as a contraction for "it is" or "it has"',
  },
  your: {
    pattern: /\byour\b/gi,
    correction: 'you\'re',
    explanation: 'Use "you\'re" as a contraction for "you are"',
  },
  their: {
    pattern: /\btheir\b/gi,
    correction: 'they\'re',
    explanation: 'Use "they\'re" as a contraction for "they are"',
  },
  then: {
    pattern: /\bthen\b/gi,
    correction: 'than',
    explanation: 'Use "than" for comparisons, "then" for time',
  },
  could: {
    pattern: /\bcould of\b/gi,
    correction: 'could have',
    explanation: 'The correct phrase is "could have", not "could of"',
  },
  should: {
    pattern: /\bshould of\b/gi,
    correction: 'should have',
    explanation: 'The correct phrase is "should have", not "should of"',
  },
  would: {
    pattern: /\bwould of\b/gi,
    correction: 'would have',
    explanation: 'The correct phrase is "would have", not "would of"',
  },
};

export const STYLE_IMPROVEMENTS = {
  wordy: {
    pattern: /\b(in order to)\b/gi,
    improvement: 'to',
    explanation: 'Simplify by removing unnecessary words',
  },
  passive: {
    pattern: /\b(was|were) (written|sent|done|made|created)\b/gi,
    improvement: 'active voice suggestion',
    explanation: 'Consider using active voice for clearer communication',
  },
  filler: {
    pattern: /\b(basically|actually|literally|really)\b/gi,
    improvement: 'remove',
    explanation: 'Remove filler words for more professional writing',
  },
};