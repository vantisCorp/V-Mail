import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoiceAssistant } from '../../src/hooks/useVoiceAssistant';
import {
  VoiceCommandType,
  VoiceRecognitionStatus,
  SpeechSynthesisStatus,
  VoiceLanguage,
  MarkAction
} from '../../src/types/voiceAssistant';
import { VoiceAssistantService } from '../../src/services/voiceAssistantService';

// Mock the VoiceAssistantService
vi.mock('../../src/services/voiceAssistantService', () => ({
  VoiceAssistantService: {
    getInstance: vi.fn()
  }
}));

describe('useVoiceAssistant', () => {
  let mockService: {
    startListening: ReturnType<typeof vi.fn>;
    stopListening: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    stopSpeaking: ReturnType<typeof vi.fn>;
    readEmail: ReturnType<typeof vi.fn>;
    recognizeCommand: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
    resetStatistics: ReturnType<typeof vi.fn>;
    getStatistics: ReturnType<typeof vi.fn>;
    getAvailableVoices: ReturnType<typeof vi.fn>;
    isConfirmation: ReturnType<typeof vi.fn>;
    isCancellation: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      startListening: vi.fn(),
      stopListening: vi.fn(),
      speak: vi.fn(),
      stopSpeaking: vi.fn(),
      readEmail: vi.fn(),
      recognizeCommand: vi.fn(),
      updateConfig: vi.fn(),
      resetStatistics: vi.fn(),
      getStatistics: vi.fn().mockReturnValue({
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        recognitionAttempts: 0,
        successfulRecognitions: 0,
        totalSpeakingTime: 0,
        emailsRead: 0,
        commandsByType: {},
        averageConfidence: 0,
        lastReset: Date.now()
      }),
      getAvailableVoices: vi.fn().mockReturnValue([]),
      isConfirmation: vi.fn().mockReturnValue(false),
      isCancellation: vi.fn().mockReturnValue(false),
      on: vi.fn(),
      off: vi.fn()
    };

    vi.mocked(VoiceAssistantService.getInstance).mockReturnValue(mockService as any);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      expect(result.current.isListening).toBe(false);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.recognitionStatus).toBe(VoiceRecognitionStatus.IDLE);
      expect(result.current.synthesisStatus).toBe(SpeechSynthesisStatus.IDLE);
      expect(result.current.currentCommand).toBeNull();
      expect(result.current.lastTranscript).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        language: VoiceLanguage.SPANISH,
        continuousListening: true,
        confidenceThreshold: 0.8
      };
      const { result } = renderHook(() => useVoiceAssistant(customConfig));

      expect(result.current.config.language).toBe(VoiceLanguage.SPANISH);
      expect(result.current.config.continuousListening).toBe(true);
      expect(result.current.config.confidenceThreshold).toBe(0.8);
    });

    it('should initialize with zero statistics', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      expect(result.current.statistics.totalCommands).toBe(0);
      expect(result.current.statistics.successfulCommands).toBe(0);
      expect(result.current.statistics.failedCommands).toBe(0);
    });
  });

  describe('startListening', () => {
    it('should start listening successfully', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.startListening();
      });

      expect(mockService.startListening).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when starting listening', () => {
      mockService.startListening.mockImplementation(() => {
        throw new Error('Speech recognition not supported');
      });

      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.startListening();
      });

      expect(result.current.error).toBe('Speech recognition not supported');
    });
  });

  describe('stopListening', () => {
    it('should stop listening', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.stopListening();
      });

      expect(mockService.stopListening).toHaveBeenCalled();
    });
  });

  describe('speak', () => {
    it('should speak text successfully', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.speak('Hello World');
      });

      expect(mockService.speak).toHaveBeenCalledWith('Hello World', undefined);
    });

    it('should speak with options', () => {
      const { result } = renderHook(() => useVoiceAssistant());
      const options = { rate: 1.5, pitch: 1.2, volume: 0.8 };

      act(() => {
        result.current.speak('Hello World', options);
      });

      expect(mockService.speak).toHaveBeenCalledWith('Hello World', options);
    });

    it('should handle speak errors', () => {
      mockService.speak.mockImplementation(() => {
        throw new Error('Speech synthesis failed');
      });

      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.speak('Hello World');
      });

      expect(result.current.error).toBe('Speech synthesis failed');
    });
  });

  describe('stopSpeaking', () => {
    it('should stop speaking', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.stopSpeaking();
      });

      expect(mockService.stopSpeaking).toHaveBeenCalled();
    });
  });

  describe('readEmail', () => {
    it('should read email successfully', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.readEmail('Email content');
      });

      expect(mockService.readEmail).toHaveBeenCalledWith('Email content', undefined);
    });

    it('should handle readEmail errors', () => {
      mockService.readEmail.mockImplementation(() => {
        throw new Error('Email reading is disabled');
      });

      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.readEmail('Email content');
      });

      expect(result.current.error).toBe('Email reading is disabled');
    });
  });

  describe('recognizeCommand', () => {
    it('should recognize command successfully', async () => {
      const mockCommand = {
        id: '1',
        type: VoiceCommandType.COMPOSE,
        transcript: 'Compose email to John',
        confidence: 0.85,
        timestamp: Date.now()
      };

      mockService.recognizeCommand.mockResolvedValue(mockCommand);

      const { result } = renderHook(() => useVoiceAssistant());

      let command: any;
      await act(async () => {
        command = await result.current.recognizeCommand('Compose email to John');
      });

      expect(command).toEqual(mockCommand);
      expect(mockService.recognizeCommand).toHaveBeenCalledWith('Compose email to John');
    });

    it('should handle recognition errors', async () => {
      mockService.recognizeCommand.mockRejectedValue(new Error('Recognition failed'));

      const { result } = renderHook(() => useVoiceAssistant());

      let command: any;
      await act(async () => {
        command = await result.current.recognizeCommand('Test command');
      });

      expect(command.type).toBe(VoiceCommandType.UNKNOWN);
      expect(command.confidence).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.updateConfig({
          language: VoiceLanguage.FRENCH,
          confidenceThreshold: 0.9
        });
      });

      expect(result.current.config.language).toBe(VoiceLanguage.FRENCH);
      expect(result.current.config.confidenceThreshold).toBe(0.9);
      expect(mockService.updateConfig).toHaveBeenCalled();
    });
  });

  describe('resetStatistics', () => {
    it('should reset statistics', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.resetStatistics();
      });

      expect(mockService.resetStatistics).toHaveBeenCalled();
    });
  });

  describe('getAvailableVoices', () => {
    it('should return available voices', () => {
      const mockVoices = [
        { voiceURI: 'voice-1', name: 'Voice 1', lang: 'en-US' },
        { voiceURI: 'voice-2', name: 'Voice 2', lang: 'es-ES' }
      ];

      mockService.getAvailableVoices.mockReturnValue(mockVoices);

      const { result } = renderHook(() => useVoiceAssistant());

      const voices = result.current.getAvailableVoices();

      expect(voices).toEqual(mockVoices);
    });
  });

  describe('isConfirmation', () => {
    it('should detect confirmation phrase', () => {
      mockService.isConfirmation.mockReturnValue(true);

      const { result } = renderHook(() => useVoiceAssistant());

      const confirmed = result.current.isConfirmation('yes');

      expect(confirmed).toBe(true);
      expect(mockService.isConfirmation).toHaveBeenCalledWith('yes');
    });

    it('should detect non-confirmation phrase', () => {
      mockService.isConfirmation.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceAssistant());

      const confirmed = result.current.isConfirmation('no');

      expect(confirmed).toBe(false);
    });
  });

  describe('isCancellation', () => {
    it('should detect cancellation phrase', () => {
      mockService.isCancellation.mockReturnValue(true);

      const { result } = renderHook(() => useVoiceAssistant());

      const cancelled = result.current.isCancellation('cancel');

      expect(cancelled).toBe(true);
      expect(mockService.isCancellation).toHaveBeenCalledWith('cancel');
    });

    it('should detect non-cancellation phrase', () => {
      mockService.isCancellation.mockReturnValue(false);

      const { result } = renderHook(() => useVoiceAssistant());

      const cancelled = result.current.isCancellation('continue');

      expect(cancelled).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      mockService.startListening.mockImplementation(() => {
        throw new Error('Test error');
      });

      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.startListening();
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Event Handling', () => {
    it('should set up event listeners on mount', () => {
      renderHook(() => useVoiceAssistant());

      expect(mockService.on).toHaveBeenCalledWith('STARTED', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('STOPPED', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('RESULT', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('ERROR', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('TIMEOUT', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('SPEAKING_STARTED', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('SPEAKING_STOPPED', expect.any(Function));
      expect(mockService.on).toHaveBeenCalledWith('COMMAND_EXECUTED', expect.any(Function));
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete voice workflow', async () => {
      const mockCommand = {
        id: '1',
        type: VoiceCommandType.SEARCH,
        transcript: 'Search for emails from John',
        confidence: 0.9,
        timestamp: Date.now(),
        searchQuery: 'John'
      };

      mockService.recognizeCommand.mockResolvedValue(mockCommand);

      const { result } = renderHook(() => useVoiceAssistant());

      // Start listening
      act(() => {
        result.current.startListening();
      });

      expect(mockService.startListening).toHaveBeenCalled();

      // Recognize command
      let command: any;
      await act(async () => {
        command = await result.current.recognizeCommand('Search for emails from John');
      });

      expect(command.type).toBe(VoiceCommandType.SEARCH);
      expect(command.searchQuery).toBe('John');

      // Stop listening
      act(() => {
        result.current.stopListening();
      });

      expect(mockService.stopListening).toHaveBeenCalled();
    });

    it('should handle speak and stop workflow', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      // Start speaking
      act(() => {
        result.current.speak('Hello World');
      });

      expect(mockService.speak).toHaveBeenCalledWith('Hello World', undefined);

      // Stop speaking
      act(() => {
        result.current.stopSpeaking();
      });

      expect(mockService.stopSpeaking).toHaveBeenCalled();
    });

    it('should handle config updates', () => {
      const { result } = renderHook(() => useVoiceAssistant());

      act(() => {
        result.current.updateConfig({
          language: VoiceLanguage.GERMAN,
          confidenceThreshold: 0.85,
          continuousListening: true
        });
      });

      expect(result.current.config.language).toBe(VoiceLanguage.GERMAN);
      expect(result.current.config.confidenceThreshold).toBe(0.85);
      expect(result.current.config.continuousListening).toBe(true);
    });

    it('should handle multiple commands sequentially', async () => {
      const commands = [
        { id: '1', type: VoiceCommandType.COMPOSE, transcript: 'Compose email', confidence: 0.8, timestamp: Date.now() },
        { id: '2', type: VoiceCommandType.SEARCH, transcript: 'Search emails', confidence: 0.9, timestamp: Date.now() },
        { id: '3', type: VoiceCommandType.ARCHIVE, transcript: 'Archive this', confidence: 0.85, timestamp: Date.now() }
      ];

      commands.forEach((cmd) => {
        mockService.recognizeCommand.mockResolvedValueOnce(cmd);
      });

      const { result } = renderHook(() => useVoiceAssistant());

      for (const expectedCmd of commands) {
        let command: any;
        await act(async () => {
          command = await result.current.recognizeCommand(expectedCmd.transcript);
        });
        expect(command.type).toBe(expectedCmd.type);
      }
    });
  });
});
