/**
 * Voice Assistant Service
 * Issue #31 - V-Mail v1.4.0 AI-Powered Intelligence
 */

import {
  VoiceCommand,
  VoiceCommandType,
  VoiceRecognitionResult,
  SpeechSynthesisOptions,
  VoiceAssistantConfig,
  VoiceAssistantStatistics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  VoiceLanguage,
  VoiceRecognitionStatus,
  SpeechSynthesisStatus,
  MarkAction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  VoicePhrasePattern,
  FOLDER_NAME_VARIATIONS,
  CONFIRMATION_PHRASES,
  CANCELLATION_PHRASES,
  VOICE_PHRASE_PATTERNS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  VOICE_FEEDBACK_MESSAGES,
  DEFAULT_VOICE_CONFIG
} from '../types/voiceAssistant';

export class VoiceAssistantService {
  private static instance: VoiceAssistantService;
  private config: VoiceAssistantConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private status: VoiceRecognitionStatus = VoiceRecognitionStatus.IDLE;
  private speakingStatus: SpeechSynthesisStatus = SpeechSynthesisStatus.IDLE;
  private statistics: VoiceAssistantStatistics;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<VoiceAssistantConfig>) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.synthesis = window.speechSynthesis;
    this.statistics = this.initializeStatistics();
    this.initializeRecognition();
  }

  static getInstance(config?: Partial<VoiceAssistantConfig>): VoiceAssistantService {
    if (!VoiceAssistantService.instance) {
      VoiceAssistantService.instance = new VoiceAssistantService(config);
    }
    return VoiceAssistantService.instance;
  }

  private initializeStatistics(): VoiceAssistantStatistics {
    return {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      recognitionAttempts: 0,
      successfulRecognitions: 0,
      totalSpeakingTime: 0,
      emailsRead: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      commandsByType: {} as any,
      averageConfidence: 0,
      lastReset: Date.now()
    };
  }

  private initializeRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.config.continuousListening;
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.language;

      this.recognition.onstart = () => {
        this.status = VoiceRecognitionStatus.LISTENING;
        this.emit('STARTED');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        const result = this.processRecognitionResult(event);
        this.emit('RESULT', result);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onerror = (event: any) => {
        this.status = VoiceRecognitionStatus.ERROR;
        this.emit('ERROR', event.error);
        this.statistics.recognitionAttempts++;
      };

      this.recognition.onend = () => {
        this.status = VoiceRecognitionStatus.IDLE;
        this.emit('STOPPED');
      };

      this.recognition.onspeechstart = () => {
        this.emit('SPEECH_DETECTED');
        this.resetSilenceTimer();
      };

      this.recognition.onspeechend = () => {
        this.emit('SPEECH_ENDED');
        this.startSilenceTimer();
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processRecognitionResult(event: any): VoiceRecognitionResult {
    const results = event.results;
    const lastResult = results[results.length - 1];
    const transcript = lastResult[0].transcript.trim();
    const confidence = lastResult[0].confidence;
    const isFinal = lastResult.isFinal;

    const result: VoiceRecognitionResult = {
      transcript,
      confidence,
      isFinal
    };

    if (lastResult.length > 1) {
      result.alternatives = Array.from(lastResult)
        .slice(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((alt: any) => ({
          transcript: alt.transcript,
          confidence: alt.confidence
        }));
    }

    if (isFinal) {
      this.statistics.successfulRecognitions++;
      this.updateAverageConfidence(confidence);
    }

    return result;
  }

  private startSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    this.silenceTimer = setTimeout(() => {
      if (this.status === VoiceRecognitionStatus.LISTENING) {
        this.stopListening();
        this.emit('TIMEOUT');
      }
    }, this.config.silenceTimeout);
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private updateAverageConfidence(confidence: number): void {
    const total = this.statistics.successfulRecognitions;
    const current = this.statistics.averageConfidence;
    this.statistics.averageConfidence = (current * (total - 1) + confidence) / total;
  }

  startListening(): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    if (this.status === VoiceRecognitionStatus.LISTENING) {
      return;
    }

    try {
      this.recognition.start();
    } catch {
      this.status = VoiceRecognitionStatus.ERROR;
      throw new Error('Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.status === VoiceRecognitionStatus.LISTENING) {
      this.recognition.stop();
      this.resetSilenceTimer();
    }
  }

  async recognizeCommand(transcript: string): Promise<VoiceCommand> {
    this.status = VoiceRecognitionStatus.PROCESSING;
    this.statistics.recognitionAttempts++;

    const command = this.parseCommand(transcript);

    if (command.type !== VoiceCommandType.UNKNOWN && command.confidence >= this.config.confidenceThreshold) {
      this.statistics.totalCommands++;
      this.statistics.successfulCommands++;
      this.updateCommandsByType(command.type);
      this.emit('COMMAND_EXECUTED', command);
    } else {
      this.statistics.totalCommands++;
      this.statistics.failedCommands++;
    }

    this.status = VoiceRecognitionStatus.IDLE;
    return command;
  }

  private parseCommand(transcript: string): VoiceCommand {
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const pattern of VOICE_PHRASE_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = normalizedTranscript.match(regex);
        if (match) {
          const command = this.buildCommand(pattern.type, normalizedTranscript, match);
          return command;
        }
      }
    }

    return this.buildUnknownCommand(normalizedTranscript);
  }

  private buildCommand(type: VoiceCommandType, transcript: string, match: RegExpMatchArray): VoiceCommand {
    const command: VoiceCommand = {
      id: this.generateId(),
      type,
      transcript,
      confidence: this.calculateConfidence(transcript, type),
      timestamp: Date.now()
    };

    // Extract command-specific data based on type
    switch (type) {
      case VoiceCommandType.COMPOSE:
      case VoiceCommandType.FORWARD:
        if (match[1]) {
          command.recipients = this.extractRecipients(match[1]);
        }
        break;
      case VoiceCommandType.REPLY:
        if (match[1]) {
          command.emailId = match[1].trim();
        }
        break;
      case VoiceCommandType.MARK:
        command.markAction = this.extractMarkAction(transcript);
        break;
      case VoiceCommandType.SEARCH:
        if (match[1]) {
          command.searchQuery = match[1].trim();
        }
        break;
      case VoiceCommandType.NAVIGATE:
        if (match[1]) {
          command.folderId = this.normalizeFolderName(match[1].trim());
        }
        break;
      case VoiceCommandType.LABEL:
        if (match[1]) {
          command.labelId = match[1].trim();
        }
        break;
      case VoiceCommandType.OPEN:
        if (match[1]) {
          command.emailId = match[1].trim();
        }
        break;
    }

    return command;
  }

  private buildUnknownCommand(transcript: string): VoiceCommand {
    return {
      id: this.generateId(),
      type: VoiceCommandType.UNKNOWN,
      transcript,
      confidence: 0,
      timestamp: Date.now()
    };
  }

  private calculateConfidence(transcript: string, _type: VoiceCommandType): number {
    // Base confidence from pattern matching
    let confidence = 0.8;

    // Increase confidence for clear, complete phrases
    if (transcript.length > 10) {
      confidence += 0.1;
    }

    // Decrease confidence for very short or incomplete phrases
    if (transcript.length < 5) {
      confidence -= 0.2;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private extractRecipients(text: string): string[] {
    const recipients: string[] = [];

    // Extract email addresses
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailRegex);
    if (emails) {
      recipients.push(...emails);
    }

    // Extract names (simple heuristic)
    const nameRegex = /(?:to|for|cc|bcc)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const nameMatches = text.match(nameRegex);
    if (nameMatches) {
      nameMatches.forEach((match) => {
        const name = match.replace(/^(?:to|for|cc|bcc)\s+/i, '').trim();
        if (!recipients.includes(name)) {
          recipients.push(name);
        }
      });
    }

    return recipients;
  }

  private extractMarkAction(transcript: string): MarkAction {
    const lower = transcript.toLowerCase();

    if (lower.includes('unread')) {
      return MarkAction.UNREAD;
    }
    if (lower.includes('unstar') || lower.includes('unimportant')) {
      return MarkAction.UNSTAR;
    }
    if (lower.includes('star')) {
      return MarkAction.STAR;
    }
    if (lower.includes('important')) {
      return MarkAction.IMPORTANT;
    }

    return MarkAction.READ;
  }

  private normalizeFolderName(folderName: string): string {
    const lowerName = folderName.toLowerCase().trim();

    for (const [canonical, variations] of Object.entries(FOLDER_NAME_VARIATIONS)) {
      if (variations.includes(lowerName)) {
        return canonical;
      }
    }

    return lowerName;
  }

  speak(text: string, options?: SpeechSynthesisOptions): void {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = options?.rate ?? this.config.defaultSpeechRate;
    utterance.pitch = options?.pitch ?? this.config.defaultSpeechPitch;
    utterance.volume = options?.volume ?? this.config.defaultSpeechVolume;

    if (options?.voice) {
      const voices = this.synthesis.getVoices();
      const voice = voices.find((v) => v.voiceURI === options.voice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      this.speakingStatus = SpeechSynthesisStatus.SPEAKING;
      this.emit('SPEAKING_STARTED');
    };

    utterance.onend = () => {
      this.speakingStatus = SpeechSynthesisStatus.IDLE;
      // duration is not available on all browsers, so we skip it
      this.emit('SPEAKING_STOPPED');
    };

    utterance.onerror = () => {
      this.speakingStatus = SpeechSynthesisStatus.ERROR;
      this.emit('ERROR', 'Speech synthesis failed');
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synthesis && this.speakingStatus === SpeechSynthesisStatus.SPEAKING) {
      this.synthesis.cancel();
      this.speakingStatus = SpeechSynthesisStatus.IDLE;
      this.currentUtterance = null;
    }
  }

  readEmail(text: string, options?: SpeechSynthesisOptions): void {
    if (!this.config.enableEmailReading) {
      throw new Error('Email reading is disabled');
    }
    this.speak(text, options);
    this.statistics.emailsRead++;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis?.getVoices() || [];
  }

  isConfirmation(transcript: string): boolean {
    const normalized = transcript.toLowerCase().trim();
    return CONFIRMATION_PHRASES.some((phrase) => normalized.includes(phrase));
  }

  isCancellation(transcript: string): boolean {
    const normalized = transcript.toLowerCase().trim();
    return CANCELLATION_PHRASES.some((phrase) => normalized.includes(phrase));
  }

  provideFeedback(message: string): void {
    if (this.config.enableVoiceFeedback) {
      this.speak(message);
    }
  }

  updateConfig(newConfig: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.recognition) {
      this.recognition.continuous = this.config.continuousListening;
      this.recognition.lang = this.config.language;
    }
  }

  getConfig(): VoiceAssistantConfig {
    return { ...this.config };
  }

  getStatistics(): VoiceAssistantStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
  }

  getStatus(): VoiceRecognitionStatus {
    return this.status;
  }

  getSpeakingStatus(): SpeechSynthesisStatus {
    return this.speakingStatus;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateCommandsByType(type: VoiceCommandType): void {
    if (!this.statistics.commandsByType[type]) {
      this.statistics.commandsByType[type] = 0;
    }
    this.statistics.commandsByType[type]++;
  }
}
