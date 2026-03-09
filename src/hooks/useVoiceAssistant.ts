import { useState, useCallback, useRef, useEffect } from 'react';
import {
  VoiceCommand,
  VoiceCommandType,
  VoiceRecognitionResult,
  SpeechSynthesisOptions,
  VoiceAssistantConfig,
  VoiceAssistantStatistics,
  VoiceRecognitionStatus,
  SpeechSynthesisStatus,
  DEFAULT_VOICE_CONFIG
} from '../types/voiceAssistant';
import { VoiceAssistantService } from '../services/voiceAssistantService';

export interface UseVoiceAssistantReturn {
  isListening: boolean;
  isSpeaking: boolean;
  recognitionStatus: VoiceRecognitionStatus;
  synthesisStatus: SpeechSynthesisStatus;
  currentCommand: VoiceCommand | null;
  lastTranscript: string;
  error: string | null;
  config: VoiceAssistantConfig;
  statistics: VoiceAssistantStatistics;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, options?: SpeechSynthesisOptions) => void;
  stopSpeaking: () => void;
  readEmail: (text: string, options?: SpeechSynthesisOptions) => void;
  recognizeCommand: (transcript: string) => Promise<VoiceCommand>;
  updateConfig: (config: Partial<VoiceAssistantConfig>) => void;
  resetStatistics: () => void;
  getAvailableVoices: () => SpeechSynthesisVoice[];
  isConfirmation: (transcript: string) => boolean;
  isCancellation: (transcript: string) => boolean;
  clearError: () => void;
}

export function useVoiceAssistant(initialConfig?: Partial<VoiceAssistantConfig>): UseVoiceAssistantReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<VoiceRecognitionStatus>(VoiceRecognitionStatus.IDLE);
  const [synthesisStatus, setSynthesisStatus] = useState<SpeechSynthesisStatus>(SpeechSynthesisStatus.IDLE);
  const [currentCommand, setCurrentCommand] = useState<VoiceCommand | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<VoiceAssistantConfig>({
    ...DEFAULT_VOICE_CONFIG,
    ...initialConfig
  });
  const [statistics, setStatistics] = useState<VoiceAssistantStatistics>({
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    recognitionAttempts: 0,
    successfulRecognitions: 0,
    totalSpeakingTime: 0,
    emailsRead: 0,
    commandsByType: {} as unknown,
    averageConfidence: 0,
    lastReset: Date.now()
  });

  const serviceRef = useRef<VoiceAssistantService | null>(null);

  useEffect(() => {
    serviceRef.current = VoiceAssistantService.getInstance(config);

    // Set up event listeners
    serviceRef.current.on('STARTED', () => {
      setIsListening(true);
      setRecognitionStatus(VoiceRecognitionStatus.LISTENING);
    });

    serviceRef.current.on('STOPPED', () => {
      setIsListening(false);
      setRecognitionStatus(VoiceRecognitionStatus.IDLE);
    });

    serviceRef.current.on('RESULT', (result: VoiceRecognitionResult) => {
      setLastTranscript(result.transcript);
      setRecognitionStatus(result.isFinal ? VoiceRecognitionStatus.SUCCESS : VoiceRecognitionStatus.LISTENING);
    });

    serviceRef.current.on('ERROR', (err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
      setRecognitionStatus(VoiceRecognitionStatus.ERROR);
    });

    serviceRef.current.on('TIMEOUT', () => {
      setRecognitionStatus(VoiceRecognitionStatus.TIMEOUT);
    });

    serviceRef.current.on('SPEAKING_STARTED', () => {
      setIsSpeaking(true);
      setSynthesisStatus(SpeechSynthesisStatus.SPEAKING);
    });

    serviceRef.current.on('SPEAKING_STOPPED', () => {
      setIsSpeaking(false);
      setSynthesisStatus(SpeechSynthesisStatus.IDLE);
      updateStatistics();
    });

    serviceRef.current.on('COMMAND_EXECUTED', (command: VoiceCommand) => {
      setCurrentCommand(command);
      updateStatistics();
    });

    return () => {
      // Cleanup listeners
      if (serviceRef.current) {
        serviceRef.current.off('STARTED', () => {
          /* noop */
        });
        serviceRef.current.off('STOPPED', () => {
          /* noop */
        });
        serviceRef.current.off('RESULT', () => {
          /* noop */
        });
        serviceRef.current.off('ERROR', () => {
          /* noop */
        });
        serviceRef.current.off('TIMEOUT', () => {
          /* noop */
        });
        serviceRef.current.off('SPEAKING_STARTED', () => {
          /* noop */
        });
        serviceRef.current.off('SPEAKING_STOPPED', () => {
          /* noop */
        });
        serviceRef.current.off('COMMAND_EXECUTED', () => {
          /* noop */
        });
      }
    };
  }, []);

  const updateStatistics = useCallback(() => {
    if (serviceRef.current) {
      setStatistics(serviceRef.current.getStatistics());
    }
  }, []);

  const startListening = useCallback(() => {
    try {
      setError(null);
      serviceRef.current?.startListening();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start listening');
      setRecognitionStatus(VoiceRecognitionStatus.ERROR);
    }
  }, []);

  const stopListening = useCallback(() => {
    serviceRef.current?.stopListening();
  }, []);

  const speak = useCallback((text: string, options?: SpeechSynthesisOptions) => {
    try {
      setError(null);
      serviceRef.current?.speak(text, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to speak');
      setSynthesisStatus(SpeechSynthesisStatus.ERROR);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    serviceRef.current?.stopSpeaking();
  }, []);

  const readEmail = useCallback((text: string, options?: SpeechSynthesisOptions) => {
    try {
      setError(null);
      serviceRef.current?.readEmail(text, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read email');
    }
  }, []);

  const recognizeCommand = useCallback(async (transcript: string): Promise<VoiceCommand> => {
    try {
      setError(null);
      const command = await serviceRef.current!.recognizeCommand(transcript);
      setCurrentCommand(command);
      updateStatistics();
      return command;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recognize command');
      return {
        id: '',
        type: VoiceCommandType.UNKNOWN,
        transcript,
        confidence: 0,
        timestamp: Date.now()
      };
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<VoiceAssistantConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      serviceRef.current?.updateConfig(updated);
      return updated;
    });
  }, []);

  const resetStatistics = useCallback(() => {
    serviceRef.current?.resetStatistics();
    updateStatistics();
  }, []);

  const getAvailableVoices = useCallback((): SpeechSynthesisVoice[] => {
    return serviceRef.current?.getAvailableVoices() || [];
  }, []);

  const isConfirmation = useCallback((transcript: string): boolean => {
    return serviceRef.current?.isConfirmation(transcript) || false;
  }, []);

  const isCancellation = useCallback((transcript: string): boolean => {
    return serviceRef.current?.isCancellation(transcript) || false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    isSpeaking,
    recognitionStatus,
    synthesisStatus,
    currentCommand,
    lastTranscript,
    error,
    config,
    statistics,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    readEmail,
    recognizeCommand,
    updateConfig,
    resetStatistics,
    getAvailableVoices,
    isConfirmation,
    isCancellation,
    clearError
  };
}
