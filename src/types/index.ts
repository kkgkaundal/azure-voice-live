export interface VoiceLiveConfig {
  endpoint: string;
  apiKey?: string;
  token?: string;
  apiVersion?: string;
  model: string;
}

export interface SessionConfig {
  instructions?: string;
  voice?: VoiceConfig;
  turnDetection?: TurnDetectionConfig;
  audioSettings?: AudioSettings;
}

export interface VoiceConfig {
  name: string;
  type: 'azure-standard' | 'azure-neural';
  temperature?: number;
}

export interface TurnDetectionConfig {
  type: 'azure_semantic_vad' | 'server_vad';
  threshold?: number;
  prefixPaddingMs?: number;
  silenceDurationMs?: number;
  removeFillerWords?: boolean;
  endOfUtteranceDetection?: {
    model: string;
    threshold: number;
    timeout: number;
  };
}

export interface AudioSettings {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  noiseReduction?: boolean;
  echoCancellation?: boolean;
}

export interface VoiceLiveEvent {
  type: string;
  eventId?: string;
  [key: string]: any;
}

export interface SessionCreatedEvent extends VoiceLiveEvent {
  type: 'session.created';
  session: {
    id: string;
    model: string;
    voice: VoiceConfig;
  };
}

export interface AudioDeltaEvent extends VoiceLiveEvent {
  type: 'response.audio.delta';
  itemId: string;
  delta: string;
}

export interface SpeechStartedEvent extends VoiceLiveEvent {
  type: 'input_audio_buffer.speech_started';
}

export interface SpeechStoppedEvent extends VoiceLiveEvent {
  type: 'input_audio_buffer.speech_stopped';
}

export interface ErrorEvent extends VoiceLiveEvent {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
  };
}

export interface AudioAdapter {
  startRecording(): Promise<void>;
  stopRecording(): void;
  startPlayback(): void;
  stopPlayback(): void;
  isRecordingSupported(): boolean;
  isPlaybackSupported(): boolean;
  on(event: 'audioData', listener: (data: ArrayBuffer) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  off(event: 'audioData' | 'error', listener: (...args: any[]) => void): void;
  playAudio(data: ArrayBuffer): void;
}

export interface ConnectionAdapter {
  connect(url: string, headers: Record<string, string>): Promise<void>;
  send(data: string): void;
  close(): void;
  on(event: 'message', listener: (data: string) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'close', listener: () => void): void;
  off(event: 'message' | 'error' | 'close', listener: (...args: any[]) => void): void;
}


export interface QuickVoiceProps {
  config: VoiceLiveConfig;
  sessionConfig?: SessionConfig;
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  onComplete?: (result: any) => void;
}


export interface VoiceChatProps {
  config: VoiceLiveConfig;
  sessionConfig?: SessionConfig;
  className?: string;
  theme?: 'light' | 'dark' | 'blue' | 'green';
  showAdvancedControls?: boolean;
  onStateChange?: (state: any) => void;
}

export interface VoiceRecorderProps {
  config: VoiceLiveConfig;
  sessionConfig?: SessionConfig;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'detailed';
  onAudioReceived?: (audio: any) => void;
  onTranscript?: (text: string) => void;
}

export interface VoiceStatusProps {
  config: VoiceLiveConfig;
  className?: string;
  variant?: 'compact' | 'detailed' | 'badge';
  showSessionId?: boolean;
  autoConnect?: boolean;
}