/**
 * Configuration for an Azure Voice session
 */
export interface SessionConfig {
  id?: string;
  /** System instructions for the AI */
  instructions?: string;
  /** Voice activity detection settings */
  turn_detection?: {
    type: string; // e.g., "azure_semantic_vad"
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    remove_filler_words?: boolean;
    auto_truncate?: boolean;
    end_of_utterance_detection?: {
      model: string;
      threshold: number;
      timeout: number;
    };
  };
  /** Noise reduction configuration */
  input_audio_noise_reduction?: { type: string };
  /** Echo cancellation configuration */
  input_audio_echo_cancellation?: { type: string };
  /** Transcription model */
  input_audio_transcription?: { model: string };
  /** Voice configuration */
  voice?: {
    name: string; // e.g., "en-US-JennyNeural"
    type: string; // e.g., "azure-standard"
    temperature?: number;
    rate?: string; // e.g., "1"
  };
  /** Supported modalities */
  modalities?: string[]; // e.g., ["text", "audio"]
  /** Avatar configuration */
  avatar?: {
    character: string; // e.g., "lisa"
    customized: boolean;
    style: string; // e.g., "casual-sitting"
  };
  /** Temperature for response generation */
  temperature?: number;
}

/**
 * Authentication options for Azure Voice service
 */
export interface AuthOptions {
  type: 'api-key' | 'token';
  value: string;
}

/**
 * Events for audio capture
 */
export interface AudioCaptureEvents {
  onAudioData: (base64Audio: string) => void;
  onError: (error: Error) => void;
  onStart: () => void;
  onStop: () => void;
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: string;
  session?: { id?: string } | SessionConfig;
  item_id?: string;
  delta?: string;
  error?: { type?: string; code?: string; message?: string };
  audio_node_id?: string;
  audio?: string;
  event_id?: string;
}

/**
 * Events for Azure Voice Live Client
 */
export interface AzureVoiceLiveEvents {
  onConnecting: () => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onListeningStart: () => void;
  onListeningStop: () => void;
  onSpeechStarted: () => void;
  onSessionCreated: (sessionId: string) => void;
  onSessionUpdate: (config: SessionConfig) => void;
  onAudioSent: (audio: string) => void;
  onAudioReceived: (audio: ArrayBuffer) => void;
  onVisemeReceived: (visemeId: number) => void;
  onError: (error: Error) => void;
}
