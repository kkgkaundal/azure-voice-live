import { EventEmitter } from 'eventemitter3';
import { 
  VoiceLiveConfig, 
  SessionConfig, 
  VoiceLiveEvent, 
  AudioAdapter, 
  ConnectionAdapter,
  AudioDeltaEvent,
  SessionCreatedEvent,
  ErrorEvent
} from '../types';
import { createWavBuffer } from '../utils/audioUtils';

export class VoiceLiveClient extends EventEmitter {
  private config: VoiceLiveConfig;
  private audioAdapter: AudioAdapter;
  private connectionAdapter: ConnectionAdapter;
  private connected = false;
  private sessionId?: string;

  constructor(
    config: VoiceLiveConfig,
    audioAdapter: AudioAdapter,
    connectionAdapter: ConnectionAdapter
  ) {
    super();
    this.config = config;
    this.audioAdapter = audioAdapter;
    this.connectionAdapter = connectionAdapter;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Audio events
    this.audioAdapter.on('audioData', (data: ArrayBuffer) => {
      this.sendAudioData(data);
    });

    this.audioAdapter.on('error', (error: Error) => {
      this.emit('error', error);
    });

    // Connection events
    this.connectionAdapter.on('message', (message: string) => {
      this.handleMessage(message);
    });

    this.connectionAdapter.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.connectionAdapter.on('close', () => {
      this.connected = false;
      this.emit('disconnected');
    });
  }

  async connect(sessionConfig?: SessionConfig): Promise<void> {
    if (this.connected) {
      throw new Error('Already connected');
    }

    const wsEndpoint = this.config.endpoint
      .replace(/\/$/, '')
      .replace('https://', 'wss://');
    
    const url = `${wsEndpoint}/voice-live/realtime?api-version=${this.config.apiVersion || '2025-05-01-preview'}&model=${this.config.model}${
      this.config.apiKey ? `&api-key=${this.config.apiKey}` : ''
    }`;
    
    const headers: Record<string, string> = {
      'x-ms-client-request-id': this.generateRequestId(),
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.apiKey) {
      headers['api-key'] = this.config.apiKey;
    } else {
      throw new Error('Either token or apiKey must be provided');
    }

    await this.connectionAdapter.connect(url, headers);
    this.connected = true;

    // Send session configuration
    if (sessionConfig) {
      await this.updateSession(sessionConfig);
    }

    this.emit('connected');
  }

  async updateSession(config: SessionConfig): Promise<void> {
    const sessionUpdate = {
      type: 'session.update',
      session: {
        instructions: config.instructions || 'You are a helpful AI assistant.',
        voice: config.voice || {
          name: 'en-US-Ava:DragonHDLatestNeural',
          type: 'azure-standard',
          temperature: 0.8,
        },
        turn_detection: config.turnDetection || {
          type: 'azure_semantic_vad',
          threshold: 0.3,
          prefixPaddingMs: 200,
          silenceDurationMs: 200,
          removeFillerWords: false,
        },
        input_audio_noise_reduction: config.audioSettings?.noiseReduction !== false ? {
          type: 'azure_deep_noise_suppression'
        } : undefined,
        input_audio_echo_cancellation: config.audioSettings?.echoCancellation !== false ? {
          type: 'server_echo_cancellation'
        } : undefined,
      },
      event_id: this.generateRequestId(),
    };

    this.connectionAdapter.send(JSON.stringify(sessionUpdate));
  }

  async startRecording(): Promise<void> {
    if (!this.audioAdapter.isRecordingSupported()) {
      throw new Error('Audio recording is not supported in this environment');
    }

    await this.audioAdapter.startRecording();
    this.emit('recordingStarted');
  }

  stopRecording(): void {
    this.audioAdapter.stopRecording();
    this.emit('recordingStopped');
  }

  startPlayback(): void {
    if (!this.audioAdapter.isPlaybackSupported()) {
      console.warn('Audio playback is not supported in this environment');
      return;
    }

    this.audioAdapter.startPlayback();
    this.emit('playbackStarted');
  }

  stopPlayback(): void {
    this.audioAdapter.stopPlayback();
    this.emit('playbackStopped');
  }

  disconnect(): void {
    this.stopRecording();
    this.stopPlayback();
    this.connectionAdapter.close();
    this.connected = false;
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  private sendAudioData(data: ArrayBuffer): void {
    if (!this.connected) return;
    const base64Audio = this.arrayBufferToBase64(data);
    const message = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
      event_id: this.generateRequestId(),
    };

    this.connectionAdapter.send(JSON.stringify(message));
  }

  private handleMessage(message: string): void {
    try {
      const event: VoiceLiveEvent = JSON.parse(message);
      
      switch (event.type) {
        case 'session.created':
          const sessionEvent = event as SessionCreatedEvent;
          this.sessionId = sessionEvent.session.id;
          this.emit('sessionCreated', sessionEvent);
          break;

        case 'response.audio.delta':
          const audioEvent = event as AudioDeltaEvent;
          const audioData = this.base64ToArrayBuffer(audioEvent.delta);
          this.audioAdapter.playAudio(audioData);
          this.emit('audioReceived', audioEvent);
          break;

        case 'input_audio_buffer.speech_started':
          this.stopPlayback();
          this.emit('speechStarted', event);
          break;

        case 'input_audio_buffer.speech_stopped':
          this.emit('speechStopped', event);
          break;

        case 'error':
          const errorEvent = event as ErrorEvent;
          this.emit('error', new Error(`${errorEvent.error.type}: ${errorEvent.error.message}`));
          break;

        default:
          this.emit('event', event);
          break;
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  private generateRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}