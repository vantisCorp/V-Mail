/**
 * Voice Email Assistant - Type Definitions
 * Issue #31 - V-Mail v1.4.0 AI-Powered Intelligence
 */

/**
 * Voice command types supported by the assistant
 */
export enum VoiceCommandType {
  /** Compose a new email */
  COMPOSE = 'COMPOSE',
  /** Reply to an email */
  REPLY = 'REPLY',
  /** Forward an email */
  FORWARD = 'FORWARD',
  /** Archive an email */
  ARCHIVE = 'ARCHIVE',
  /** Delete an email */
  DELETE = 'DELETE',
  /** Mark as read/unread */
  MARK = 'MARK',
  /** Search emails */
  SEARCH = 'SEARCH',
  /** Navigate folders */
  NAVIGATE = 'NAVIGATE',
  /** Label emails */
  LABEL = 'LABEL',
  /** Open/read an email */
  OPEN = 'OPEN',
  /** Unknown command */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Mark action types
 */
export enum MarkAction {
  READ = 'read',
  UNREAD = 'unread',
  STAR = 'star',
  UNSTAR = 'unstar',
  IMPORTANT = 'important',
  UNIMPORTANT = 'unimportant',
}

/**
 * Voice recognition status
 */
export enum VoiceRecognitionStatus {
  /** Idle - not listening */
  IDLE = 'idle',
  /** Listening for voice input */
  LISTENING = 'listening',
  /** Processing voice input */
  PROCESSING = 'processing',
  /** Recognized speech successfully */
  SUCCESS = 'success',
  /** Recognition failed */
  ERROR = 'error',
  /** Recognition timeout */
  TIMEOUT = 'timeout',
}

/**
 * Speech synthesis status
 */
export enum SpeechSynthesisStatus {
  /** Idle - not speaking */
  IDLE = 'idle',
  /** Speaking */
  SPEAKING = 'speaking',
  /** Paused */
  PAUSED = 'paused',
  /** Failed to speak */
  ERROR = 'error',
}

/**
 * Language code for voice recognition
 */
export enum VoiceLanguage {
  ENGLISH_US = 'en-US',
  ENGLISH_UK = 'en-GB',
  SPANISH = 'es-ES',
  FRENCH = 'fr-FR',
  GERMAN = 'de-DE',
  ITALIAN = 'it-IT',
  PORTUGUESE = 'pt-PT',
  RUSSIAN = 'ru-RU',
  CHINESE = 'zh-CN',
  JAPANESE = 'ja-JP',
  KOREAN = 'ko-KR',
  ARABIC = 'ar-SA',
  HINDI = 'hi-IN',
}

/**
 * Voice command result
 */
export interface VoiceCommand {
  id: string;
  type: VoiceCommandType;
  transcript: string;
  confidence: number;
  timestamp: number;
  // Command-specific data
  recipients?: string[];
  subject?: string;
  body?: string;
  emailId?: string;
  folderId?: string;
  labelId?: string;
  searchQuery?: string;
  markAction?: MarkAction;
  metadata?: Record<string, any>;
}

/**
 * Voice recognition result
 */
export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
}

/**
 * Speech synthesis options
 */
export interface SpeechSynthesisOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  voice?: string; // Voice URI
}

/**
 * Email reading context
 */
export interface EmailReadingContext {
  emailId: string;
  readSubject?: boolean;
  readSender?: boolean;
  readBody?: boolean;
  readDate?: boolean;
  skipSignature?: boolean;
}

/**
 * Voice assistant configuration
 */
export interface VoiceAssistantConfig {
  /** Preferred language for recognition */
  language: VoiceLanguage;
  /** Enable continuous listening */
  continuousListening: boolean;
  /** Auto-stop after silence (ms) */
  silenceTimeout: number;
  /** Enable command confirmation */
  requireConfirmation: boolean;
  /** Enable voice feedback */
  enableVoiceFeedback: boolean;
  /** Confidence threshold for command execution */
  confidenceThreshold: number;
  /** Enable email reading */
  enableEmailReading: boolean;
  /** Default speech rate */
  defaultSpeechRate: number;
  /** Default speech pitch */
  defaultSpeechPitch: number;
  /** Default speech volume */
  defaultSpeechVolume: number;
  /** Max retry attempts for recognition */
  maxRetryAttempts: number;
}

/**
 * Voice assistant statistics
 */
export interface VoiceAssistantStatistics {
  /** Total voice commands processed */
  totalCommands: number;
  /** Successful commands */
  successfulCommands: number;
  /** Failed commands */
  failedCommands: number;
  /** Recognition attempts */
  recognitionAttempts: number;
  /** Successful recognitions */
  successfulRecognitions: number;
  /** Total speaking time (ms) */
  totalSpeakingTime: number;
  /** Emails read aloud */
  emailsRead: number;
  /** Commands by type */
  commandsByType: Record<VoiceCommandType, number>;
  /** Average recognition confidence */
  averageConfidence: number;
  /** Last reset timestamp */
  lastReset: number;
}

/**
 * Voice phrase patterns for command detection
 */
export interface VoicePhrasePattern {
  type: VoiceCommandType;
  patterns: RegExp[];
  examples: string[];
}

/**
 * Voice event types
 */
export enum VoiceEventType {
  /** Started listening */
  STARTED = 'STARTED',
  /** Stopped listening */
  STOPPED = 'STOPPED',
  /** Speech detected */
  SPEECH_DETECTED = 'SPEECH_DETECTED',
  /** Speech ended */
  SPEECH_ENDED = 'SPEECH_ENDED',
  /** Result received */
  RESULT = 'RESULT',
  /** Error occurred */
  ERROR = 'ERROR',
  /** Timeout occurred */
  TIMEOUT = 'TIMEOUT',
  /** Command executed */
  COMMAND_EXECUTED = 'COMMAND_EXECUTED',
  /** Started speaking */
  SPEAKING_STARTED = 'SPEAKING_STARTED',
  /** Stopped speaking */
  SPEAKING_STOPPED = 'SPEAKING_STOPPED',
}

/**
 * Voice event
 */
export interface VoiceEvent {
  type: VoiceEventType;
  timestamp: number;
  data?: any;
}

// Constants

/** Default voice assistant configuration */
export const DEFAULT_VOICE_CONFIG: VoiceAssistantConfig = {
  language: VoiceLanguage.ENGLISH_US,
  continuousListening: false,
  silenceTimeout: 3000,
  requireConfirmation: true,
  enableVoiceFeedback: true,
  confidenceThreshold: 0.7,
  enableEmailReading: true,
  defaultSpeechRate: 1,
  defaultSpeechPitch: 1,
  defaultSpeechVolume: 1,
  maxRetryAttempts: 3
};

/** Voice phrase patterns for common commands */
export const VOICE_PHRASE_PATTERNS: VoicePhrasePattern[] = [
  {
    type: VoiceCommandType.COMPOSE,
    patterns: [
      /compose\s+(?:an? )?email\s+(?:to\s+)?(.+)?/i,
      /write\s+(?:an? )?email\s+(?:to\s+)?(.+)?/i,
      /new\s+email\s+(?:to\s+)?(.+)?/i,
      /send\s+(?:an? )?email\s+(?:to\s+)?(.+)?/i
    ],
    examples: [
      'Compose an email to John',
      'Write a new email',
      'Send email to mary@example.com'
    ]
  },
  {
    type: VoiceCommandType.REPLY,
    patterns: [
      /reply\s+(?:to\s+)?(?:this\s+)?email/i,
      /reply\s+(?:to\s+)?(.+)/i,
      /respond\s+(?:to\s+)?(?:this\s+)?email/i
    ],
    examples: [
      'Reply to this email',
      'Reply to John',
      'Respond to this message'
    ]
  },
  {
    type: VoiceCommandType.FORWARD,
    patterns: [
      /forward\s+(?:this\s+)?email\s+(?:to\s+)?(.+)?/i,
      /forward\s+(?:to\s+)?(.+)/i,
      /send\s+this\s+to\s+(.+)/i
    ],
    examples: [
      'Forward this email to John',
      'Forward to team@example.com',
      'Send this to Sarah'
    ]
  },
  {
    type: VoiceCommandType.ARCHIVE,
    patterns: [
      /archive\s+(?:this\s+)?email/i,
      /archive\s+it/i,
      /move\s+(?:this\s+)?email\s+to\s+archive/i
    ],
    examples: [
      'Archive this email',
      'Archive it',
      'Move to archive'
    ]
  },
  {
    type: VoiceCommandType.DELETE,
    patterns: [
      /delete\s+(?:this\s+)?email/i,
      /delete\s+it/i,
      /remove\s+(?:this\s+)?email/i
    ],
    examples: [
      'Delete this email',
      'Delete it',
      'Remove this message'
    ]
  },
  {
    type: VoiceCommandType.MARK,
    patterns: [
      /mark\s+(?:as\s+)?read/i,
      /mark\s+(?:as\s+)?unread/i,
      /mark\s+(?:as\s+)?starred?/i,
      /mark\s+(?:as\s+)?important/i,
      /un(?:star|important)/i
    ],
    examples: [
      'Mark as read',
      'Mark as unread',
      'Star this email',
      'Mark as important'
    ]
  },
  {
    type: VoiceCommandType.SEARCH,
    patterns: [
      /search\s+(?:for\s+)?(.+)/i,
      /find\s+(?:emails?\s+)?(?:from\s+)?(.+)/i,
      /look\s+(?:for\s+)?(.+)/i,
      /show\s+me\s+(.+)/i
    ],
    examples: [
      'Search for emails from John',
      'Find emails about project',
      'Show me unread emails'
    ]
  },
  {
    type: VoiceCommandType.NAVIGATE,
    patterns: [
      /go\s+to\s+(.+)/i,
      /navigate\s+to\s+(.+)/i,
      /open\s+(?:folder\s+)?(.+)/i,
      /show\s+(?:folder\s+)?(.+)/i
    ],
    examples: [
      'Go to inbox',
      'Navigate to sent folder',
      'Open spam folder'
    ]
  },
  {
    type: VoiceCommandType.LABEL,
    patterns: [
      /label\s+(?:this\s+)?(?:email\s+)?(?:as\s+)?(.+)/i,
      /add\s+label\s+(.+)/i,
      /tag\s+(?:this\s+)?(?:email\s+)?(?:with\s+)?(.+)/i
    ],
    examples: [
      'Label this as important',
      'Add label project',
      'Tag this with work'
    ]
  },
  {
    type: VoiceCommandType.OPEN,
    patterns: [
      /open\s+(?:email\s+)?(?:from\s+)?(.+)/i,
      /read\s+(?:email\s+)?(?:from\s+)?(.+)/i,
      /show\s+(?:email\s+)?(?:from\s+)?(.+)/i
    ],
    examples: [
      'Open email from John',
      'Read email from Mary',
      'Show me the latest email'
    ]
  }
];

/** Folder name variations for navigation */
export const FOLDER_NAME_VARIATIONS: Record<string, string[]> = {
  inbox: ['inbox', 'incoming', 'received'],
  sent: ['sent', 'outbox', 'outgoing'],
  drafts: ['drafts', 'draft'],
  archive: ['archive', 'archived'],
  spam: ['spam', 'junk', 'trash'],
  trash: ['trash', 'deleted', 'bin'],
  starred: ['starred', 'important', 'favorites'],
  important: ['important', 'priority', 'urgent']
};

/** Confirmation phrases */
export const CONFIRMATION_PHRASES = [
  'yes',
  'yeah',
  'sure',
  'confirm',
  'do it',
  'proceed',
  'go ahead',
  'okay',
  'ok',
  'please do'
];

/** Cancellation phrases */
export const CANCELLATION_PHRASES = [
  'no',
  'nope',
  'cancel',
  'stop',
  'don\'t',
  'never mind',
  'forget it',
  'abort'
];

/** Voice feedback messages */
export const VOICE_FEEDBACK_MESSAGES = {
  listening: 'I\'m listening',
  processing: 'Processing your command',
  confirmation: 'Are you sure you want to do that?',
  commandExecuted: 'Command executed',
  commandFailed: 'Sorry, I couldn\'t execute that command',
  unrecognized: 'Sorry, I didn\'t catch that',
  timeout: 'I didn\' hear anything',
  error: 'An error occurred'
};
