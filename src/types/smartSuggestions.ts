/**
 * Smart Email Suggestions Type Definitions
 * Part of v1.4.0 AI-Powered Intelligence
 */

export enum SuggestionType {
  REPLY = 'reply',
  QUICK_ACTION = 'quick_action',
  FOLLOW_UP = 'follow_up',
  ATTACHMENT = 'attachment',
  RECIPIENT = 'recipient',
  SUBJECT = 'subject',
  LABEL = 'label',
  SCHEDULE = 'schedule',
  TEMPLATE = 'template',
}

export type ConfidenceScore = number;

export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ReplySuggestion {
  id: string;
  type: SuggestionType.REPLY;
  text: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  category: ReplyCategory;
  context: string;
  explanation?: string;
  variables?: Record<string, string>;
}

export enum ReplyCategory {
  ACKNOWLEDGEMENT = 'acknowledgement',
  CONFIRMATION = 'confirmation',
  REJECTION = 'rejection',
  FOLLOW_UP = 'follow_up',
  THANK_YOU = 'thank_you',
  APOLOGY = 'apology',
  REQUEST = 'request',
  INFORMATION = 'information',
  SCHEDULING = 'scheduling',
  CANCELLATION = 'cancellation',
  QUESTION = 'question',
  INQUIRY = 'inquiry',
  CUSTOM = 'custom',
}

export interface QuickActionSuggestion {
  id: string;
  type: SuggestionType.QUICK_ACTION;
  action: QuickActionType;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  context?: string;
}

export enum QuickActionType {
  ARCHIVE = 'archive',
  DELETE = 'delete',
  MARK_READ = 'mark_read',
  MARK_UNREAD = 'mark_unread',
  STAR = 'star',
  UNSTAR = 'unstar',
  SNOOZE = 'snooze',
  MOVE_TO_INBOX = 'move_to_inbox',
  MOVE_TO_SPAM = 'move_to_spam',
  LABEL = 'label',
  FORWARD = 'forward',
  REPLY_ALL = 'reply_all',
  FLAG = 'flag',
  PIN = 'pin',
}

export interface FollowUpSuggestion {
  id: string;
  type: SuggestionType.FOLLOW_UP;
  action: FollowUpAction;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  suggestedDate?: Date;
  suggestedTime?: string;
  notes?: string;
}

export enum FollowUpAction {
  REMIND_LATER = 'remind_later',
  REMIND_TOMORROW = 'remind_tomorrow',
  REMIND_WEEK = 'remind_week',
  REMIND_MONTH = 'remind_month',
  CUSTOM_REMINDER = 'custom_reminder',
  SCHEDULE_MEETING = 'schedule_meeting',
  SEND_EMAIL = 'send_email',
  CALL = 'call',
  TASK = 'task',
}

export interface AttachmentSuggestion {
  id: string;
  type: SuggestionType.ATTACHMENT;
  fileName: string;
  fileType: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  filePath?: string;
  description?: string;
}

export interface RecipientSuggestion {
  id: string;
  type: SuggestionType.RECIPIENT;
  recipientType: RecipientType;
  email: string;
  name: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  avatar?: string;
  relationship?: string;
}

export enum RecipientType {
  CC = 'cc',
  BCC = 'bcc',
  ADDITIONAL = 'additional',
}

export interface SubjectSuggestion {
  id: string;
  type: SuggestionType.SUBJECT;
  subject: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  category?: SubjectCategory;
}

export enum SubjectCategory {
  URGENT = 'urgent',
  FOLLOW_UP = 'follow_up',
  QUESTION = 'question',
  INFORMATION = 'information',
  MEETING = 'meeting',
  PROJECT = 'project',
  TASK = 'task',
}

export interface LabelSuggestion {
  id: string;
  type: SuggestionType.LABEL;
  label: string;
  color: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
}

export interface ScheduleSuggestion {
  id: string;
  type: SuggestionType.SCHEDULE;
  sendAt: Date;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  timezone: string;
}

export interface TemplateSuggestion {
  id: string;
  type: SuggestionType.TEMPLATE;
  templateId: string;
  templateName: string;
  subject: string;
  body: string;
  confidence: ConfidenceScore;
  priority: SuggestionPriority;
  reason: string;
  category?: string;
}

export type Suggestion =
  | ReplySuggestion
  | QuickActionSuggestion
  | FollowUpSuggestion
  | AttachmentSuggestion
  | RecipientSuggestion
  | SubjectSuggestion
  | LabelSuggestion
  | ScheduleSuggestion
  | TemplateSuggestion;

export interface SuggestionContext {
  emailId: string;
  subject: string;
  sender: string;
  recipients: string[];
  content: string;
  attachments?: string[];
  threadLength?: number;
  timestamp: Date;
  category?: string;
  labels?: string[];
  priority?: string;
}

export interface UserBehavior {
  commonActions: Record<QuickActionType, number>;
  frequentRecipients: string[];
  commonLabels: string[];
  responseTimes: number[];
  preferredReplyCategories: ReplyCategory[];
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  context: SuggestionContext;
  timestamp: string;
  processingTime: number;
  modelVersion: string;
  metadata: {
    totalSuggestions: number;
    byType: Record<SuggestionType, number>;
    byPriority: Record<SuggestionPriority, number>;
    avgConfidence: number;
  };
}

export interface SuggestionConfig {
  enabled: boolean;
  maxSuggestions: number;
  minConfidence: number;
  enableLearning: boolean;
  enablePersonalization: boolean;
  suggestionTypes: SuggestionType[];
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
  responseTimeLimit: number;
  enableFollowUpDetection: boolean;
  enableAttachmentSuggestions: boolean;
  enableRecipientSuggestions: boolean;
}

export const DEFAULT_SUGGESTION_CONFIG: SuggestionConfig = {
  enabled: true,
  maxSuggestions: 10,
  minConfidence: 0.5,
  enableLearning: true,
  enablePersonalization: true,
  suggestionTypes: [
    SuggestionType.REPLY,
    SuggestionType.QUICK_ACTION,
    SuggestionType.FOLLOW_UP,
    SuggestionType.LABEL,
    SuggestionType.RECIPIENT
  ],
  priorityWeights: {
    high: 1.0,
    medium: 0.7,
    low: 0.4
  },
  responseTimeLimit: 100,
  enableFollowUpDetection: true,
  enableAttachmentSuggestions: true,
  enableRecipientSuggestions: true
};

export interface SuggestionFeedback {
  suggestionId: string;
  accepted: boolean;
  timestamp: Date;
  context?: string;
  rating?: number;
  comment?: string;
}

export interface TrainingExample {
  suggestion: Suggestion;
  feedback: SuggestionFeedback;
  emailContext: SuggestionContext;
  outcome: 'positive' | 'negative' | 'neutral';
}

export interface SuggestionStatistics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  acceptanceRate: number;
  avgConfidence: number;
  avgResponseTime: number;
  byType: Record<SuggestionType, {
    total: number;
    accepted: number;
    acceptanceRate: number;
  }>;
  byCategory: Record<string, {
    total: number;
    accepted: number;
    acceptanceRate: number;
  }>;
  topSuggestions: Suggestion[];
  recentFeedback: SuggestionFeedback[];
}

export const REPLY_TEMPLATES: Record<ReplyCategory, string[]> = {
  [ReplyCategory.ACKNOWLEDGEMENT]: [
    'Thank you for your email. I have received it and will review it shortly.',
    'Got it, thanks for reaching out.',
    'I acknowledge receipt of your message and will get back to you soon.'
  ],
  [ReplyCategory.CONFIRMATION]: [
    'Thank you for confirming. I will proceed as discussed.',
    'Confirmed! I\'ll take care of this right away.',
    'This is confirmed. Please let me know if you need anything else.'
  ],
  [ReplyCategory.REJECTION]: [
    'Thank you for your request, but I\'m unable to accommodate it at this time.',
    'I appreciate you reaching out, but I\'ll have to decline.',
    'Unfortunately, I cannot proceed with this request. Thank you for understanding.'
  ],
  [ReplyCategory.FOLLOW_UP]: [
    'Thanks for the update. I\'ll follow up with you next week.',
    'I\'ll be in touch soon to discuss this further.',
    'Let\'s schedule a follow-up meeting to discuss next steps.'
  ],
  [ReplyCategory.THANK_YOU]: [
    'Thank you so much for your help with this.',
    'I really appreciate your assistance and time.',
    'Many thanks for your support on this matter.'
  ],
  [ReplyCategory.APOLOGY]: [
    'I sincerely apologize for any inconvenience this may have caused.',
    'Please accept my apologies for this oversight.',
    'I\'m sorry for the delay and any inconvenience it may have caused.'
  ],
  [ReplyCategory.REQUEST]: [
    'Could you please provide more information about this?',
    'I would appreciate your help with the following:',
    'Would it be possible to get an update on this matter?'
  ],
  [ReplyCategory.INFORMATION]: [
    'Here\'s the information you requested:',
    'I\'m happy to provide the details below:',
    'Please find the information you asked for attached.'
  ],
  [ReplyCategory.SCHEDULING]: [
    'Would you be available for a meeting next week?',
    'Let me know what times work best for you to discuss this.',
    'I\'d like to schedule a call to go over the details.'
  ],
  [ReplyCategory.CANCELLATION]: [
    'I\'m sorry to inform you that I need to cancel our meeting.',
    'Due to unforeseen circumstances, I won\'t be able to attend.',
    'I regret to inform you that I must cancel our scheduled appointment.'
  ],
  [ReplyCategory.QUESTION]: [
    'I have a question regarding this matter.',
    'Could you clarify something for me?',
    'I\'d like to ask about a few details.'
  ],
  [ReplyCategory.INQUIRY]: [
    'I\'m writing to inquire about',
    'I\'d like to request information about',
    'Could you please provide details regarding'
  ],
  [ReplyCategory.CUSTOM]: []
};

export const QUICK_ACTION_PATTERNS: Record<QuickActionType, string[]> = {
  [QuickActionType.ARCHIVE]: [
    'completed',
    'done',
    'resolved',
    'closed',
    'finished'
  ],
  [QuickActionType.DELETE]: [
    'spam',
    'unsubscribe',
    'unwanted',
    'junk',
    'not interested'
  ],
  [QuickActionType.MARK_READ]: [
    'read',
    'seen'
  ],
  [QuickActionType.MARK_UNREAD]: [
    'unread',
    'not seen'
  ],
  [QuickActionType.STAR]: [
    'important',
    'urgent',
    'priority',
    'critical',
    'asap'
  ],
  [QuickActionType.UNSTAR]: [
    'unimportant',
    'not priority'
  ],
  [QuickActionType.SNOOZE]: [
    'later',
    'not now',
    'next week',
    'next month',
    'follow up'
  ],
  [QuickActionType.MOVE_TO_INBOX]: [
    'inbox',
    'move to inbox'
  ],
  [QuickActionType.MOVE_TO_SPAM]: [
    'lottery',
    'winner',
    'free money',
    'congratulations',
    'claim prize'
  ],
  [QuickActionType.FORWARD]: [
    'fyi',
    'for your information',
    'please share',
    'pass this on'
  ],
  [QuickActionType.LABEL]: [
    'project',
    'client',
    'invoice',
    'contract',
    'meeting'
  ],
  [QuickActionType.REPLY_ALL]: [
    'reply all',
    'respond to all'
  ],
  [QuickActionType.FLAG]: [
    'flag',
    'flagged'
  ],
  [QuickActionType.PIN]: [
    'pin',
    'pinned',
    'top'
  ]
};
