/**
 * Duplicate Email Detection Types
 * Part of v1.4.0 AI-Powered Intelligence
 */

// ============================================================================
// Enums
// ============================================================================

export enum DuplicateType {
  /** Exact duplicate - identical content */
  EXACT = 'EXACT',
  /** Near duplicate - very similar content with minor differences */
  NEAR = 'NEAR',
  /** Partial duplicate - significant content overlap */
  PARTIAL = 'PARTIAL',
  /** Thread duplicate - same thread/conversation */
  THREAD = 'THREAD',
}

export enum SimilarityAlgorithm {
  /** Exact string matching */
  EXACT = 'EXACT',
  /** Levenshtein distance-based similarity */
  LEVENSHTEIN = 'LEVENSHTEIN',
  /** Cosine similarity of word vectors */
  COSINE = 'COSINE',
  /** Jaccard similarity of word sets */
  JACCARD = 'JACCARD',
  /** Combined approach using multiple algorithms */
  HYBRID = 'HYBRID',
}

export enum DuplicateAction {
  /** Keep original, discard duplicate */
  AUTO_DELETE = 'AUTO_DELETE',
  /** Mark duplicate as read */
  MARK_READ = 'MARK_READ',
  /** Move duplicate to folder */
  MOVE_TO_FOLDER = 'MOVE_TO_FOLDER',
  /** Add tag/label to duplicate */
  ADD_LABEL = 'ADD_LABEL',
  /** Show duplicate in inbox with indicator */
  SHOW_INDICATOR = 'SHOW_INDICATOR',
  /** Do nothing - manual review */
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export enum DuplicateSeverity {
  /** High confidence duplicate (>90% similarity) */
  HIGH = 'HIGH',
  /** Medium confidence duplicate (70-90% similarity) */
  MEDIUM = 'MEDIUM',
  /** Low confidence duplicate (50-70% similarity) */
  LOW = 'LOW',
}

// ============================================================================
// Interfaces
// ============================================================================

export interface EmailForDetection {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string;
  attachments?: Array<{ name: string; size: number }>;
}

export interface DuplicateResult {
  id: string;
  duplicateId: string;
  type: DuplicateType;
  severity: DuplicateSeverity;
  similarityScore: number;
  confidence: number;
  matchedFields: string[];
  differences: string[];
  originalEmail: EmailForDetection;
  duplicateEmail: EmailForDetection;
  metadata: DuplicateMetadata;
  timestamp: string;
}

export interface DuplicateGroup {
  id: string;
  groupId: string;
  primaryEmailId: string;
  duplicateIds: string[];
  type: DuplicateType;
  severity: DuplicateSeverity;
  averageSimilarity: number;
  emails: EmailForDetection[];
  created: string;
  updated: string;
}

export interface DuplicateMetadata {
  algorithm: SimilarityAlgorithm;
  processingTime: number;
  fieldSimilarity: {
    subject: number;
    body: number;
    from: number;
    attachments: number;
  };
  contentHash: {
    original: string;
    duplicate: string;
  };
  reason: string;
}

export interface DetectionConfig {
  /** Minimum similarity threshold for detection (0-1) */
  minSimilarityThreshold: number;
  /** Algorithm to use for similarity detection */
  algorithm: SimilarityAlgorithm;
  /** Default action for detected duplicates */
  defaultAction: DuplicateAction;
  /** Whether to enable automatic deduplication */
  autoDeduplicate: boolean;
  /** Enable thread-level deduplication */
  detectThreadDuplicates: boolean;
  /** Enable partial duplicate detection */
  detectPartialDuplicates: boolean;
  /** Weight for subject similarity */
  subjectWeight: number;
  /** Weight for body similarity */
  bodyWeight: number;
  /** Weight for sender similarity */
  fromWeight: number;
  /** Maximum time difference (in hours) for duplicates */
  maxTimeDifference: number;
  /** Enable cache for performance */
  enableCache: boolean;
  /** Enable learning from user feedback */
  enableLearning: boolean;
}

export interface DetectionStatistics {
  totalEmailsProcessed: number;
  totalDuplicatesFound: number;
  totalGroups: number;
  averageSimilarity: number;
  duplicatesByType: Record<DuplicateType, number>;
  duplicatesBySeverity: Record<DuplicateSeverity, number>;
  totalProcessingTime: number;
  averageProcessingTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface UserFeedback {
  duplicateId: string;
  isDuplicate: boolean;
  correctAction: DuplicateAction;
  timestamp: string;
}

export interface DetectionContext {
  emails: EmailForDetection[];
  config?: Partial<DetectionConfig>;
  existingGroups?: DuplicateGroup[];
  userHistory?: UserFeedback[];
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  minSimilarityThreshold: 0.7,
  algorithm: SimilarityAlgorithm.HYBRID,
  defaultAction: DuplicateAction.SHOW_INDICATOR,
  autoDeduplicate: false,
  detectThreadDuplicates: true,
  detectPartialDuplicates: true,
  subjectWeight: 0.3,
  bodyWeight: 0.5,
  fromWeight: 0.2,
  maxTimeDifference: 168, // 7 days
  enableCache: true,
  enableLearning: true,
};

// ============================================================================
// Constants
// ============================================================================

/** Common phrases that indicate forwarded/replied emails */
export const FORWARD_INDICATORS = [
  '-----Original Message-----',
  'From:',
  'Sent:',
  'To:',
  'Subject:',
  ' forwarded message ',
  ' begin forwarded message ',
];

/** Subject prefixes that should be ignored for comparison */
export const SUBJECT_PREFIXES = [
  'Re:',
  'RE:',
  'Fwd:',
  'FWD:',
  'FW:',
  'Forward:',
  'Reply:',
];

/** Signature patterns to ignore in body comparison */
export const SIGNATURE_PATTERNS = [
  /--\s*\n/,
  /___\s*\n/,
  /Best regards,?/i,
  /Regards,?/i,
  /Sincerely,?/i,
  /Thanks,?/i,
  /Thank you,?/i,
];

/** Footer patterns to ignore in body comparison */
export const FOOTER_PATTERNS = [
  /Confidentiality Notice:?/i,
  /This message contains privileged/i,
  /Disclaimer:?/i,
  /If you received this in error/i,
];

/** Thresholds for duplicate classification */
export const DUPLICATE_THRESHOLDS = {
  EXACT: 0.98,
  NEAR: 0.85,
  PARTIAL: 0.7,
  THREAD: 0.5,
} as const;

/** Severity thresholds */
export const SEVERITY_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
} as const;