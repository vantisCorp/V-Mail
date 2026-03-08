/**
 * Email Summarization Type Definitions
 * Part of v1.4.0 AI-Powered Intelligence
 */

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Type of summarization approach
 */
export enum SummaryType {
  /** Extract sentences from original text */
  EXTRACTIVE = 'extractive',
  /** Generate new sentences that capture meaning */
  ABSTRACTIVE = 'abstractive',
  /** Hybrid approach */
  HYBRID = 'hybrid',
}

/**
 * Length of summary
 */
export enum SummaryLength {
  /** Very brief (1-2 sentences) */
  VERY_SHORT = 'very_short',
  /** Brief (3-5 sentences) */
  SHORT = 'short',
  /** Medium (1-2 paragraphs) */
  MEDIUM = 'medium',
  /** Detailed (3-4 paragraphs) */
  LONG = 'long',
}

/**
 * Priority level of content in summary
 */
export enum ContentPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// ============================================================================
// Content Types
// ============================================================================

/**
 * Key point extracted from email
 */
export interface KeyPoint {
  id: string;
  text: string;
  importance: number; // 0-1
  category: string;
  priority: ContentPriority;
  sourceEmailId?: string;
  timestamp?: string;
}

/**
 * Action item extracted from email
 */
export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: ContentPriority;
  sourceEmailId?: string;
  timestamp?: string;
}

/**
 * Summary segment
 */
export interface SummarySegment {
  id: string;
  text: string;
  type: 'topic' | 'key_point' | 'action_item' | 'decision' | 'question';
  importance: number;
  sourceEmails: string[];
}

/**
 * Email summary result
 */
export interface EmailSummary {
  id: string;
  summary: string;
  tlDr: string;
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
  segments: SummarySegment[];
  metadata: SummaryMetadata;
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}

/**
 * Summary metadata
 */
export interface SummaryMetadata {
  totalEmails: number;
  totalWords: number;
  summaryWordCount: number;
  compressionRatio: number; // original words / summary words
  summaryType: SummaryType;
  summaryLength: SummaryLength;
  language: string;
  confidence: number;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Email for summarization
 */
export interface EmailForSummarization {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  threadId?: string;
  isReply?: boolean;
  inReplyTo?: string;
}

/**
 * Thread for summarization
 */
export interface EmailThread {
  id: string;
  subject: string;
  emails: EmailForSummarization[];
  participants: string[];
  startDate: Date;
  endDate: Date;
  totalMessages: number;
}

/**
 * Summarization context
 */
export interface SummarizationContext {
  thread?: EmailThread;
  emails: EmailForSummarization[];
  summaryType: SummaryType;
  summaryLength: SummaryLength;
  includeActionItems: boolean;
  includeKeyPoints: boolean;
  maxSentences?: number;
  language?: string;
  userPreferences?: SummarizationPreferences;
}

/**
 * User preferences for summarization
 */
export interface SummarizationPreferences {
  defaultSummaryType: SummaryType;
  defaultSummaryLength: SummaryLength;
  includeActionItems: boolean;
  includeKeyPoints: boolean;
  includeDecisions: boolean;
  includeQuestions: boolean;
  minImportance: number;
  customPrompt?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for summarization model
 */
export interface SummarizationConfig {
  /** Default summary type */
  defaultSummaryType?: SummaryType;
  /** Default summary length */
  defaultSummaryLength?: SummaryLength;
  /** Model settings */
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
    maxProcessingTime: number; // ms
  };
  /** Summarization settings */
  summarization: {
    maxSentences: number;
    minSentenceLength: number;
    maxSentenceLength: number;
    keywordDensity: number;
    positionWeight: number; // weight for first/last sentences
  };
  /** Feature settings */
  features: {
    actionItemExtraction: boolean;
    keyPointExtraction: boolean;
    decisionExtraction: boolean;
    questionExtraction: boolean;
    sentimentAnalysis: boolean;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_SUMMARIZATION_CONFIG: SummarizationConfig = {
  defaultSummaryType: SummaryType.EXTRACTIVE,
  defaultSummaryLength: SummaryLength.MEDIUM,
  model: {
    name: 'summarizer',
    version: '1.0.0',
    maxTokens: 500,
    temperature: 0.7
  },
  performance: {
    cacheEnabled: true,
    cacheSize: 100,
    maxProcessingTime: 500
  },
  summarization: {
    maxSentences: 5,
    minSentenceLength: 10,
    maxSentenceLength: 200,
    keywordDensity: 0.1,
    positionWeight: 0.3
  },
  features: {
    actionItemExtraction: true,
    keyPointExtraction: true,
    decisionExtraction: true,
    questionExtraction: true,
    sentimentAnalysis: false
  }
};

/**
 * Default user preferences
 */
export const DEFAULT_SUMMARIZATION_PREFERENCES: SummarizationPreferences = {
  defaultSummaryType: SummaryType.EXTRACTIVE,
  defaultSummaryLength: SummaryLength.MEDIUM,
  includeActionItems: true,
  includeKeyPoints: true,
  includeDecisions: true,
  includeQuestions: true,
  minImportance: 0.5
};

// ============================================================================
// Action Item Patterns
// ============================================================================

export const ACTION_ITEM_PATTERNS = [
  /\b(please|kindly|need to|should|will|going to)\s+(.*?)(?:\.|$)/gi,
  /\b(action|task|to-do|todo):\s+(.*?)(?:\.|$)/gi,
  /\b(by|due|deadline):\s+(.*?)(?:\.|$)/gi,
  /\b(assign|assigned to|assignee):\s+(.*?)(?:\.|$)/gi,
  /\b(follow up|followup|follow-up):\s+(.*?)(?:\.|$)/gi,
  /\b(review|check|verify):\s+(.*?)(?:\.|$)/gi,
  /\b(complete|finish|done):\s+(.*?)(?:\.|$)/gi,
  /\b(send|email|write):\s+(.*?)(?:\.|$)/gi
];

export const DECISION_PATTERNS = [
  /\b(decided|agreed|concluded|resolved):\s+(.*?)(?:\.|$)/gi,
  /\b(decision|agreement|conclusion|resolution):\s+(.*?)(?:\.|$)/gi,
  /\b(will|going to|shall):\s+(.*?)(?:\.|$)/gi,
  /\b(not|won't|will not):\s+(.*?)(?:\.|$)/gi
];

export const QUESTION_PATTERNS = [
  /\?/g,
  /\b(what|where|when|why|who|how|which|whose)\b/gi,
  /\b(can|could|would|should|will)\s+(.*?)(?:\?|$)/gi
];

// ============================================================================
// Key Point Keywords
// ============================================================================

export const KEY_POINT_KEYWORDS = [
  'important', 'critical', 'essential', 'crucial', 'key', 'main', 'primary',
  'note', 'remember', 'keep in mind', 'attention', 'focus', 'highlight',
  'significant', 'major', 'notable', 'worth mentioning', 'point out',
  'emphasize', 'stress', 'underline', 'make clear', 'clarify',
  'ensure', 'make sure', 'guarantee', 'confirm', 'verify',
  'require', 'need', 'must', 'should', 'ought to',
  'deadline', 'due date', 'timeline', 'schedule', 'milestone',
  'goal', 'objective', 'target', 'aim', 'purpose',
  'result', 'outcome', 'impact', 'effect', 'consequence',
  'next steps', 'following', 'subsequent', 'then', 'after that',
  'conclusion', 'summary', 'recap', 'overview', 'in summary'
];

export const STOP_WORDS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'her', 'our', 'their', 'mine',
  'yours', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'himself',
  'herself', 'itself', 'ourselves', 'yourselves', 'themselves', 'what',
  'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'also', 'now', 'here', 'there', 'then', 'once', 'never', 'always',
  'often', 'sometimes', 'usually', 'still', 'already', 'yet', 'again'
];

// ============================================================================
// Summary Templates
// ============================================================================

export const SUMMARY_TEMPLATES = {
  very_short: 'TL;DR: {summary}',
  short: 'Summary: {summary}',
  medium: '## Summary\n\n{summary}\n\n## Key Points\n\n{key_points}\n\n## Action Items\n\n{action_items}',
  long: '## Thread Summary\n\n{summary}\n\n## Key Points\n\n{key_points}\n\n## Action Items\n\n{action_items}\n\n## Decisions Made\n\n{decisions}\n\n## Questions\n\n{questions}'
};

export const TLDR_PHRASES = [
  'In short,',
  'To summarize,',
  'Bottom line:',
  'TL;DR:',
  'Key takeaway:',
  'Main point:'
];
