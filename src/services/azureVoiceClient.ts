import EventEmitter from 'events';
import { Buffer } from 'buffer';
// import WebSocket from 'ws';
import {
  SessionConfig,
  AuthOptions,
  WebSocketMessage,
  AudioCaptureEvents,
} from '../interfaces/types';
import { captureAudio } from './audioCapture';
import { createWavBuffer } from '../utils/audioUtils';

export class AzureVoiceLiveClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private endpoint: string;
  private auth: AuthOptions;
  private isRecording: boolean = false;
  private sessionConfig: SessionConfig;
  private audioContext: AudioContext;
  private lastAudioItemId: string | null = null;
  private stopEvent: boolean = false;
  private audioBufferQueue: ArrayBuffer[] = [];
  private _isPlaying: boolean = false;
  private status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private analyser: AnalyserNode | null = null;
  private peerConnection: RTCPeerConnection | null = null;

  constructor(
    resourceName: string,
    model: string,
    auth: AuthOptions,
    voice: string = 'en-US-JennyNeural',
    sessionConfig: SessionConfig = {},
  ) {
    super();
    this.endpoint = `wss://${resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-05-01-preview&model=${model}${
      auth.type === 'api-key' ? `&api-key=${auth.value}` : ''
    }`;
    this.auth = auth;
    this.sessionConfig = sessionConfig;
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.status = 'disconnected';
  }

  /**
   * Gets the AudioContext instance
   */
  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  /**
   * Gets the current playback state
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Connects to the Azure Voice WebSocket
   */
  async connect(): Promise<void> {
    // Await avatar initialization to ensure it's ready before WebSocket connection
    // await this.initAvatar();
    this.status = 'connecting';
    this.emit('onConnecting');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.endpoint, [],);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onopen = () => {
        this.status = 'connected';
        this.emit('onConnected');
        this.sendSessionUpdate(this.sessionConfig);
        resolve();
      };

      this.ws.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            switch (data.type) {
              case 'session.created':
                this.emit('onSessionCreated', data.session?.id || 'unknown');
                break;
              case 'session.update':
                this.sessionConfig = { ...this.sessionConfig, ...data.session };
                this.emit('onSessionUpdate', this.sessionConfig);
                break;
              case 'input_audio_buffer.speech_started':
                this.emit('onSpeechStarted');
                this.stopAudioPlayback();
                break;
              case 'response.audio.delta':
                if (data.item_id !== this.lastAudioItemId) {
                  this.lastAudioItemId = data.item_id ?? null;
                }
                const audioData = Buffer.from(data.delta!, 'base64');
                this.emit('onAudioReceived', audioData);
                await this.playAudio(audioData.buffer);
                break;
              case 'error':
                const error = new Error(
                  `Azure Error: Type=${data.error?.type}, Code=${data.error?.code}, Message=${data.error?.message}`
                );
                this.emit('onError', error);
                break;
              default:
                this.emit(data.type, data);
            }
          } catch (error) {
            this.emit(
              'onError',
              new Error(`Failed to parse JSON event: ${error}`)
            );
          }
        } else if (event.data instanceof ArrayBuffer) {
          this.emit('onAudioReceived', event.data);
          await this.playAudio(event.data);
        }
      };

      this.ws.onerror = (error) => {
        this.status = 'disconnected';
        this.emit('onError', error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.emit('onDisconnected');
        this.isRecording = false;
        this.ws = null;
      };
    });
  }

  /**
   * Sends updated session configuration
   */
  sendSessionUpdate(config: Partial<SessionConfig>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.sessionConfig = { ...this.sessionConfig, ...config };
    this.ws.send(
      JSON.stringify({
        type: 'session.update',
        session: this.sessionConfig,
        event_id: '',
      })
    );
    this.emit('onSessionUpdate', this.sessionConfig);
  }

  /**
   * Sends audio input
   */
  async sendAudioInput(audioNodeId: string = 'audio-node'): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    try {
      this.isRecording = true;
      this.emit('onListeningStart');

      const events: AudioCaptureEvents = {
        onAudioData: (base64Audio: string) => {
          if (
            this.ws &&
            this.ws.readyState === WebSocket.OPEN &&
            !this.stopEvent
          ) {
            const param = {
              type: 'input_audio_buffer.append',
              audio: base64Audio,
              event_id: '',
              audio_node_id: audioNodeId,
            };
            this.ws.send(JSON.stringify(param));
            this.emit('onAudioSent', base64Audio);
          }
        },
        onError: (error: Error) => this.emit('onError', error),
        onStart: () => this.emit('onListeningStart'),
        onStop: () => {
          this.isRecording = false;
          this.emit('onListeningStop');
        },
      };

      await captureAudio(events, () => this.stopEvent || !this.isRecording);
    } catch (err) {
      this.emit('onError', err);
      throw err;
    }
  }

  /**
   * Plays audio data
   */
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    try {
      if (!audioData || audioData.byteLength === 0) {
        this.emit('onError', new Error('Received empty audio data'));
        return;
      }
      this.audioBufferQueue.push(audioData);
      if (!this._isPlaying) {
        this._isPlaying = true;
        await this.playBufferedAudio();
      }
    } catch (error) {
      this.emit('onError', new Error(`Failed to play audio: ${error}`));
      this._isPlaying = false;
    }
  }

  /**
   * Plays queued audio buffers and syncs with avatar
   */
  private async playBufferedAudio(): Promise<void> {
    while (this.audioBufferQueue.length > 0) {
      const audioData = this.audioBufferQueue.shift()!;
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        const wavBuffer = createWavBuffer(audioData, 24000);
        const audioBuffer = await this.audioContext.decodeAudioData(wavBuffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        if (this.analyser) {
          source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        } else {
          source.connect(this.audioContext.destination);
        }
        source.start();
        await new Promise((resolve) => {
          source.onended = resolve;
        });
      } catch (error) {
        this.emit(
          'onError',
          new Error(`Failed to play buffered audio: ${error}`)
        );
      }
    }
    this._isPlaying = false;
  }

  /**
   * Stops audio playback
   */
  private stopAudioPlayback(): void {
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend();
      setTimeout(() => this.audioContext.resume(), 1000);
    }
  }

  /**
   * Disconnects and cleans up
   */
  disconnect(): void {
    this.stopEvent = true;
    this.isRecording = false;
    this.status = 'disconnected';
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.audioContext.close();
    this.emit('onDisconnected');
  }

  /**
   * Gets session configuration
   */
  getSessionConfig(): SessionConfig {
    return { ...this.sessionConfig };
  }

  /**
   * Stops audio capture
   */
  stop(): void {
    this.stopEvent = true;
  }

  /**
   * Starts audio capture
   */
  start(): void {
    this.stopEvent = false;
  }

  /**
   * Gets connection status
   */
  getStatus(): string {
    return this.status;
  }
}