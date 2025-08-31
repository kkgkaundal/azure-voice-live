import WebSocket from 'isomorphic-ws';
import EventEmitter from 'events';
import { Buffer } from 'buffer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import {
  SessionConfig,
  AuthOptions,
  WebSocketMessage,
  AudioCaptureEvents,
} from '../interfaces/types';
import { captureAudio } from './audioCapture';
import { createWavBuffer } from '../utils/audioUtils';

// Interface for avatar configuration
interface AvatarConfig {
  modelUrl?: string;
  canvasId: string;
  customized: boolean;
  talkingAvatarCharacter?: string;
  talkingAvatarStyle?: string;
  backgroundColor?: string;
  speechRegion: string;
  speechKey: string;
}

// Azure viseme mapping
const visemeMap: { [key: number]: string } = {
  0: 'silence',
  1: 'AA',
  2: 'E',
  3: 'I',
  4: 'O',
  5: 'U',
};

/**
 * Client for interacting with Azure Voice Live API with default Azure avatar integration
 */
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
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private avatar: THREE.Object3D | null = null;
  private analyser: AnalyserNode | null = null;
  private avatarConfig: AvatarConfig | null = null;
  private avatarSynthesizer: SpeechSDK.AvatarSynthesizer | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private voice: string;

  constructor(
    resourceName: string,
    model: string,
    auth: AuthOptions,
    voice: string = 'en-US-JennyNeural',
    sessionConfig: SessionConfig = {},
    avatarConfig: AvatarConfig | null = null
  ) {
    super();
    this.endpoint = `wss://${resourceName}.cognitiveservices.azure.com/voice-live/realtime?api-version=2025-05-01-preview&model=${model}${
      auth.type === 'api-key' ? `&api-key=${auth.value}` : ''
    }`;
    this.auth = auth;
    this.sessionConfig = sessionConfig;
    this.avatarConfig = avatarConfig ?? null;
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.status = 'disconnected';
    this.voice = voice;
    if (this.avatarConfig && this.avatarConfig?.canvasId) {
      // Initialize Three.js scene
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.camera.position.z = 5;
      const canvas = document.getElementById(
        this.avatarConfig.canvasId
      ) as HTMLCanvasElement;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: this.avatarConfig.backgroundColor === 'transparent',
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Set background
      if (
        this.avatarConfig.backgroundColor &&
        this.avatarConfig.backgroundColor !== 'transparent'
      ) {
        this.renderer.setClearColor(this.avatarConfig.backgroundColor, 1);
      } else {
        this.renderer.setClearColor(0x000000, 0);
      }

      // Create video element for Azure avatar stream
      this.videoElement = document.createElement('video');
      this.videoElement.style.position = 'absolute';
      this.videoElement.style.top = '0';
      this.videoElement.style.left = '0';
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      (canvas.parentElement as HTMLElement).appendChild(this.videoElement);

      // Initialize avatar
      this.initAvatar();

      // Set up audio analyser (fallback)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    }
  }

  /**
   * Initializes the default Azure avatar using Speech SDK
   */
  private async initAvatar(): Promise<void> {
    if (
      this.avatarConfig?.customized ||
      !this.avatarConfig?.speechRegion ||
      !this.avatarConfig?.speechKey
    ) {
      await this.loadGLTFAvatar();
      return;
    }

    try {
      // Fetch ICE servers for WebRTC
      const iceResponse = await fetch(
        `https://${this.avatarConfig.speechRegion}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
        {
          method: 'GET',
          headers: { 'Ocp-Apim-Subscription-Key': this.avatarConfig.speechKey },
        }
      );
      if (!iceResponse.ok) {
        throw new Error(
          `Failed to fetch ICE servers: ${iceResponse.statusText}`
        );
      }
      const iceData = await iceResponse.json();
      const iceServerUrl = iceData.Urls[0]; // Adjusted to match Azure's response structure
      const iceUsername = iceData.Username;
      const iceCredential = iceData.Password;

      // Create WebRTC peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [iceServerUrl],
            username: iceUsername,
            credential: iceCredential,
          },
        ],
      });

      // Create Speech and Avatar config
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        this.avatarConfig.speechKey,
        this.avatarConfig.speechRegion
      );
      speechConfig.speechSynthesisVoiceName = this.voice;

      const videoFormat = new SpeechSDK.AvatarVideoFormat();
      const avatarCharacter =
        this.avatarConfig.talkingAvatarCharacter || 'lisa';
      const avatarStyle =
        this.avatarConfig.talkingAvatarStyle || 'graceful-sitting';
      const avatarConfig = new SpeechSDK.AvatarConfig(
        avatarCharacter,
        avatarStyle,
        videoFormat
      );
      if (this.avatarConfig.backgroundColor) {
        avatarConfig.backgroundColor = this.avatarConfig.backgroundColor;
      }

      // Create AvatarSynthesizer
      this.avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(
        speechConfig,
        avatarConfig
      );

      //   // Handle viseme events
      //   this.avatarSynthesizer.visemeReceived = (s, e) => {
      //     this.updateLipSync(e.visemeId);
      //     this.emit('onVisemeReceived', e.visemeId);
      //   };

      this.avatarSynthesizer.avatarEventReceived = (s, e) => {
        console.log(`Avatar event: ${e.description}`);
      };

      // Start avatar
      await this.avatarSynthesizer.startAvatarAsync(this.peerConnection);
      console.log('Azure default avatar started');

      // Attach video stream
      this.peerConnection.ontrack = (event) => {
        this.videoElement!.srcObject = event.streams[0];
      };

      // Basic lighting for Three.js (if needed)
      const light = new THREE.DirectionalLight(0xffffff, 0.8);
      light.position.set(0, 1, 1);
      this.scene?.add(light);
      this.scene?.add(new THREE.AmbientLight(0x404040));

      this.animate();
    } catch (error) {
      this.emit(
        'onError',
        new Error(
          `Failed to initialize Azure avatar: ${error}. Ensure S0 tier and preview access.`
        )
      );
      await this.loadGLTFAvatar();
    }
  }

  /**
   * Fallback: Load GLTF avatar
   */
  private async loadGLTFAvatar(): Promise<void> {
    const loader = new GLTFLoader();
    try {
      let modelUrl = this.avatarConfig?.modelUrl;
      if (!this.avatarConfig?.customized) {
        modelUrl = `./assets/${this.avatarConfig?.talkingAvatarCharacter || 'lisa'}.gltf`;
      }
      if (!modelUrl) {
        throw new Error('No model URL provided');
      }

      const gltf = await loader.loadAsync(modelUrl);
      this.avatar = gltf.scene;
      if (this.avatarConfig?.talkingAvatarStyle) {
        this.applyAvatarStyle(this.avatarConfig.talkingAvatarStyle);
      }
      this.scene?.add(this.avatar);
      this.animate();
    } catch (error) {
      this.emit('onError', new Error(`GLTF fallback failed: ${error}`));
    }
  }

  /**
   * Applies avatar style
   */
  private applyAvatarStyle(style: string): void {
    if (style === 'graceful-sitting' && this.avatar) {
      this.avatar.position.set(0, -1, 0);
    }
  }

  /**
   * Animation loop
   */
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    if (this.avatar && this.analyser && !this.avatarSynthesizer) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      const amplitude =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      this.updateLipSync(Math.floor(amplitude / 50));
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Updates lip-sync using viseme ID or amplitude
   */
  private updateLipSync(visemeIdOrAmplitude: number): void {
    if (!this.avatar) return;
    let viseme = visemeMap[visemeIdOrAmplitude] || 'silence';
    const mesh = this.avatar.getObjectByName('mouth') as THREE.Mesh;
    if (mesh && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[0] = viseme === 'AA' ? 1 : 0;
      mesh.morphTargetInfluences[1] = viseme === 'E' ? 1 : 0;
      mesh.morphTargetInfluences[2] = viseme === 'I' ? 1 : 0;
    }
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
      this.ws = new WebSocket(this.endpoint, [], {
        headers:
          this.auth.type === 'token'
            ? { Authorization: `Bearer ${this.auth.value}` }
            : {},
      });
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

        // Transcribe audio to text for avatar input
        if (this.avatarSynthesizer && this.avatarConfig) {
          const audioStream = SpeechSDK.PushAudioInputStream.create();
          const audioConfig =
            SpeechSDK.AudioConfig.fromStreamInput(audioStream);
          const nodeBuffer = Buffer.from(wavBuffer);
          audioStream.write(nodeBuffer.buffer);
          audioStream.close();

          const recognizer = new SpeechSDK.SpeechRecognizer(
            SpeechSDK.SpeechConfig.fromSubscription(
              this.avatarConfig?.speechKey,
              this.avatarConfig?.speechRegion
            ),
            audioConfig
          );

          await new Promise<void>((resolve) => {
            recognizer.recognizeOnceAsync(
              (result) => {
                const text = result.text;
                if (text) {
                  this.avatarSynthesizer!.speakTextAsync(text);
                }
                recognizer.close();
                resolve();
              },
              (error) => {
                this.emit(
                  'onError',
                  new Error(`Transcription failed: ${error}`)
                );
                recognizer.close();
                resolve();
              }
            );
          });
        }
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
    if (this.avatarSynthesizer) {
      this.avatarSynthesizer.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.audioContext.close();
    this.renderer?.dispose();
    if (this.videoElement) {
      this.videoElement.remove();
    }
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
