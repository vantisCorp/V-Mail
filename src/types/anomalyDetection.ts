/**
 * Anomaly Detection - Type Definitions
 * Issue #32 - V-Mail v1.4.0 AI-Powered Intelligence
 */

/**
 * Anomaly severity levels
 */
export enum AnomalySeverity {
  /** Informational - no action required */
  INFO = 'INFO',
  /** Low severity - minor concern */
  LOW = 'LOW',
  /** Medium severity - moderate concern */
  MEDIUM = 'MEDIUM',
  /** High severity - significant concern */
  HIGH = 'HIGH',
  /** Critical severity - immediate action required */
  CRITICAL = 'CRITICAL',
}

/**
 * Anomaly types
 */
export enum AnomalyType {
  /** Phishing attempt detected */
  PHISHING = 'PHISHING',
  /** Spam pattern detected */
  SPAM = 'SPAM',
  /** Suspicious sender behavior */
  SUSPICIOUS_SENDER = 'SUSPICIOUS_SENDER',
  /** Unusual email content */
  UNUSUAL_CONTENT = 'UNUSUAL_CONTENT',
  /** Suspicious attachment */
  SUSPICIOUS_ATTACHMENT = 'SUSPICIOUS_ATTACHMENT',
  /** Unusual sending pattern */
  UNUSUAL_SENDING_PATTERN = 'UNUSUAL_SENDING_PATTERN',
  /** Potential impersonation */
  IMPOSTER = 'IMPOSTER',
  /** Malicious links detected */
  MALICIOUS_LINK = 'MALICIOUS_LINK',
  /** Unusual login activity */
  UNUSUAL_LOGIN = 'UNUSUAL_LOGIN',
  /** Suspicious forwarding rule */
  SUSPICIOUS_FORWARDING = 'SUSPICIOUS_FORWARDING',
  /** Bulk email anomaly */
  BULK_ANOMALY = 'BULK_ANOMALY',
  /** Unknown anomaly type */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Detection status
 */
export enum DetectionStatus {
  /** Not yet analyzed */
  PENDING = 'PENDING',
  /** Currently analyzing */
  ANALYZING = 'ANALYZING',
  /** Analysis complete */
  COMPLETED = 'COMPLETED',
  /** Analysis failed */
  FAILED = 'FAILED',
}

/**
 * Risk score level
 */
export enum RiskLevel {
  /** Minimal risk */
  MINIMAL = 'MINIMAL',
  /** Low risk */
  LOW = 'LOW',
  /** Moderate risk */
  MODERATE = 'MODERATE',
  /** High risk */
  HIGH = 'HIGH',
  /** Severe risk */
  SEVERE = 'SEVERE',
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  id: string;
  emailId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  riskScore: number;
  confidence: number;
  status: DetectionStatus;
  timestamp: number;
  description: string;
  indicators: AnomalyIndicator[];
  recommendedActions: RecommendedAction[];
  metadata?: Record<string, any>;
}

/**
 * Anomaly indicator
 */
export interface AnomalyIndicator {
  type: string;
  value: string;
  confidence: number;
  source: string;
  details?: string;
}

/**
 * Recommended action
 */
export interface RecommendedAction {
  type: ActionType;
  description: string;
  priority: number;
  automated: boolean;
}

/**
 * Action types
 */
export enum ActionType {
  BLOCK_SENDER = 'BLOCK_SENDER',
  MARK_AS_SPAM = 'MARK_AS_SPAM',
  DELETE_EMAIL = 'DELETE_EMAIL',
  REPORT_PHISHING = 'REPORT_PHISHING',
  VERIFY_SENDER = 'VERIFY_SENDER',
  ALERT_USER = 'ALERT_USER',
  QUARANTINE_EMAIL = 'QUARANTINE_EMAIL',
  REMOVE_LINKS = 'REMOVE_LINKS',
  SCAN_ATTACHMENT = 'SCAN_ATTACHMENT',
  REQUIRE_2FA = 'REQUIRE_2FA',
}

/**
 * Phishing indicators
 */
export interface PhishingIndicator {
  type: PhishingIndicatorType;
  value: string;
  confidence: number;
  details?: string;
}

export enum PhishingIndicatorType {
  SUSPICIOUS_URL = 'SUSPICIOUS_URL',
  DOMAIN_MISMATCH = 'DOMAIN_MISMATCH',
  URGENCY_LANGUAGE = 'URGENCY_LANGUAGE',
  CREDENTIAL_REQUEST = 'CREDENTIAL_REQUEST',
  SENDER_SPOOF = 'SENDER_SPOOF',
  GRAMMAR_ERROR = 'GRAMMAR_ERROR',
  GENERIC_GREETING = 'GENERIC_GREETING',
  MISMATCHED_LINKS = 'MISMATCHED_LINKS',
  SUSPICIOUS_ATTACHMENT = 'SUSPICIOUS_ATTACHMENT',
}

/**
 * Spam indicators
 */
export interface SpamIndicator {
  type: SpamIndicatorType;
  value: string;
  confidence: number;
}

export enum SpamIndicatorType {
  PROMOTIONAL_LANGUAGE = 'PROMOTIONAL_LANGUAGE',
  UNSUBSCRIBE_LINK = 'UNSUBSCRIBE_LINK',
  EXCESSIVE_CAPS = 'EXCESSIVE_CAPS',
  EXCESSIVE_PUNCTUATION = 'EXCESSIVE_PUNCTUATION',
  PRICE_MENTION = 'PRICE_MENTION',
  URGENCY_WORDS = 'URGENCY_WORDS',
  SUSPICIOUS_SENDER = 'SUSPICIOUS_SENDER',
  UNSUBSCRIBE_FAIL = 'UNSUBSCRIBE_FAIL',
}

/**
 * Sender reputation data
 */
export interface SenderReputation {
  email: string;
  domain: string;
  score: number;
  category: SenderCategory;
  trustLevel: TrustLevel;
  historicalData: SenderHistoricalData;
  flags: SenderFlag[];
}

export enum SenderCategory {
  TRUSTED = 'TRUSTED',
  KNOWN = 'KNOWN',
  UNKNOWN = 'UNKNOWN',
  SUSPICIOUS = 'SUSPICIOUS',
  MALICIOUS = 'MALICIOUS',
}

export enum TrustLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE',
}

export interface SenderHistoricalData {
  totalEmails: number;
  flaggedEmails: number;
  spamCount: number;
  phishingCount: number;
  lastEmailDate: number;
  firstEmailDate: number;
}

export enum SenderFlag {
  NEW_SENDER = 'NEW_SENDER',
  RECENTLY_FLAGGED = 'RECENTLY_FLAGGED',
  DOMAIN_MISMATCH = 'DOMAIN_MISMATCH',
  SUSPICIOUS_DOMAIN = 'SUSPICIOUS_DOMAIN',
  COMPROMISED = 'COMPROMISED',
}

/**
 * Behavioral analysis result
 */
export interface BehavioralAnalysis {
  sender: string;
  anomalyScore: number;
  patterns: BehavioralPattern[];
  baseline: BehavioralBaseline;
}

export interface BehavioralPattern {
  type: PatternType;
  deviation: number;
  confidence: number;
  description: string;
}

export enum PatternType {
  UNUSUAL_TIME = 'UNUSUAL_TIME',
  UNUSUAL_VOLUME = 'UNUSUAL_VOLUME',
  UNUSUAL_RECIPIENT = 'UNUSUAL_RECIPIENT',
  UNUSUAL_CONTENT = 'UNUSUAL_CONTENT',
  UNUSUAL_ATTACHMENT = 'UNUSUAL_ATTACHMENT',
  UNUSUAL_FORMAT = 'UNUSUAL_FORMAT',
}

export interface BehavioralBaseline {
  avgEmailsPerDay: number;
  avgSubjectLength: number;
  avgBodyLength: number;
  commonSendHours: number[];
  commonRecipients: string[];
  typicalAttachmentTypes: string[];
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  /** Enable phishing detection */
  enablePhishingDetection: boolean;
  /** Enable spam detection */
  enableSpamDetection: boolean;
  /** Enable behavioral analysis */
  enableBehavioralAnalysis: boolean;
  /** Enable sender reputation check */
  enableSenderReputation: boolean;
  /** Enable malicious link detection */
  enableLinkScan: boolean;
  /** Enable attachment scanning */
  enableAttachmentScan: boolean;
  /** Minimum confidence threshold */
  confidenceThreshold: number;
  /** Risk score threshold for alerts */
  riskScoreThreshold: number;
  /** Enable automated actions */
  enableAutomatedActions: boolean;
  /** Maximum analysis time (ms) */
  maxAnalysisTime: number;
  /** Enable detailed logging */
  enableDetailedLogging: boolean;
  /** Cache size for results */
  cacheSize: number;
}

/**
 * Anomaly detection statistics
 */
export interface AnomalyDetectionStatistics {
  /** Total emails analyzed */
  totalAnalyzed: number;
  /** Anomalies detected */
  anomaliesDetected: number;
  /** Phishing emails detected */
  phishingDetected: number;
  /** Spam emails detected */
  spamDetected: number;
  /** False positives reported */
  falsePositives: number;
  /** Average analysis time (ms) */
  avgAnalysisTime: number;
  /** Detection rate by type */
  detectionsByType: Record<AnomalyType, number>;
  /** Detection rate by severity */
  detectionsBySeverity: Record<AnomalySeverity, number>;
  /** Overall detection accuracy */
  accuracy: number;
  /** Last reset timestamp */
  lastReset: number;
}

/**
 * Link analysis result
 */
export interface LinkAnalysis {
  url: string;
  isMalicious: boolean;
  riskScore: number;
  categories: LinkCategory[];
  resolvedIp?: string;
  domainAge?: number;
  sslValid?: boolean;
}

export enum LinkCategory {
  PHISHING = 'PHISHING',
  MALWARE = 'MALWARE',
  SPAM = 'SPAM',
  SUSPICIOUS = 'SUSPICIOUS',
  ADULT = 'ADULT',
  GAMBLING = 'GAMBLING',
  REDIRECT = 'REDIRECT',
  SHORTENER = 'SHORTENER',
}

/**
 * Attachment analysis result
 */
export interface AttachmentAnalysis {
  filename: string;
  mimeType: string;
  size: number;
  isMalicious: boolean;
  riskScore: number;
  indicators: AttachmentIndicator[];
  sha256?: string;
}

export interface AttachmentIndicator {
  type: string;
  value: string;
  confidence: number;
}

// Constants

/** Default anomaly detection configuration */
export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  enablePhishingDetection: true,
  enableSpamDetection: true,
  enableBehavioralAnalysis: true,
  enableSenderReputation: true,
  enableLinkScan: true,
  enableAttachmentScan: true,
  confidenceThreshold: 0.7,
  riskScoreThreshold: 0.5,
  enableAutomatedActions: false,
  maxAnalysisTime: 5000,
  enableDetailedLogging: false,
  cacheSize: 1000,
};

/** Phishing indicator weights */
export const PHISHING_INDICATOR_WEIGHTS: Record<PhishingIndicatorType, number> = {
  [PhishingIndicatorType.SUSPICIOUS_URL]: 0.9,
  [PhishingIndicatorType.DOMAIN_MISMATCH]: 0.85,
  [PhishingIndicatorType.URGENCY_LANGUAGE]: 0.6,
  [PhishingIndicatorType.CREDENTIAL_REQUEST]: 0.95,
  [PhishingIndicatorType.SENDER_SPOOF]: 0.9,
  [PhishingIndicatorType.GRAMMAR_ERROR]: 0.3,
  [PhishingIndicatorType.GENERIC_GREETING]: 0.4,
  [PhishingIndicatorType.MISMATCHED_LINKS]: 0.85,
  [PhishingIndicatorType.SUSPICIOUS_ATTACHMENT]: 0.8,
};

/** Spam indicator weights */
export const SPAM_INDICATOR_WEIGHTS: Record<SpamIndicatorType, number> = {
  [SpamIndicatorType.PROMOTIONAL_LANGUAGE]: 0.5,
  [SpamIndicatorType.UNSUBSCRIBE_LINK]: 0.4,
  [SpamIndicatorType.EXCESSIVE_CAPS]: 0.6,
  [SpamIndicatorType.EXCESSIVE_PUNCTUATION]: 0.5,
  [SpamIndicatorType.PRICE_MENTION]: 0.4,
  [SpamIndicatorType.URGENCY_WORDS]: 0.5,
  [SpamIndicatorType.SUSPICIOUS_SENDER]: 0.7,
  [SpamIndicatorType.UNSUBSCRIBE_FAIL]: 0.8,
};

/** Urgency phrases for phishing detection */
export const URGENCY_PHRASES = [
  'act now',
  'urgent',
  'immediate action',
  'verify your account',
  'account suspended',
  'security alert',
  'update your information',
  'confirm your identity',
  'limited time',
  'expires in',
  'last warning',
  'final notice',
  'dear customer',
  'dear user',
  'click here immediately',
];

/** Suspicious TLDs */
export const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.gq',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.work',
  '.click',
  '.link',
  '.info',
  '.biz',
];

/** Known malicious URL patterns */
export const MALICIOUS_URL_PATTERNS = [
  /(?:login|signin|verify|update|confirm|secure|account)\s*[-._]?\s*(?:here|now|today)/i,
  /(?:paypal|amazon|google|microsoft|apple|facebook|netflix)\s*[-._]?\s*(?:verify|secure|update)/i,
  /(?:password|credential|social\s*security|credit\s*card)\s*[-._]?\s*(?:verify|confirm)/i,
];