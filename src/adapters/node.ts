import { EventEmitter } from 'eventemitter3';
import { AudioAdapter, ConnectionAdapter } from '../types';

export class NodeAudioAdapter extends EventEmitter implements AudioAdapter {
  private recording = false;
  private playback = false;
  private mic: any;
  private speaker: any;

  constructor() {
    super();
    
    // Try to load optional audio modules
    try {
      const Mic = require('mic');
      this.mic = Mic({
        rate: '24000',
        channels: '1',
        debug: false,
        exitOnSilence: 6,
        fileType: 'raw',
        encoding: 'signed-integer',
        bitDepth: '16'
      });
    } catch (error) {
      console.warn('mic module not available - npm install mic for audio recording support');
    }

    try {
      const Speaker = require('speaker');
      this.speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 24000,
        signed: true,
      });
    } catch (error) {
      console.warn('speaker module not available - npm install speaker for audio playback support');
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mic) {
      throw new Error('Microphone not available. Install the "mic" package: npm install mic');
    }

    if (this.recording) return;

    const micInputStream = this.mic.getAudioStream();
    
    micInputStream.on('data', (data: Buffer) => {
      if (this.recording) {
        this.emit('audioData', data.buffer);
      }
    });

    micInputStream.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.mic.start();
    this.recording = true;
  }

  stopRecording(): void {
    if (this.mic && this.recording) {
      this.mic.stop();
      this.recording = false;
    }
  }

  startPlayback(): void {
    this.playback = true;
  }

  stopPlayback(): void {
    this.playback = false;
    if (this.speaker) {
      try {
        this.speaker.pause();
      } catch (error) {
        // Ignore pause errors
      }
    }
  }

  playAudio(data: ArrayBuffer): void {
    if (!this.playback || !this.speaker) return;

    try {
      const buffer = Buffer.from(data);
      this.speaker.write(buffer);
    } catch (error) {
      this.emit('error', new Error(`Failed to play audio: ${error}`));
    }
  }

  isRecordingSupported(): boolean {
    return !!this.mic;
  }

  isPlaybackSupported(): boolean {
    return !!this.speaker;
  }
}

export class NodeConnectionAdapter extends EventEmitter implements ConnectionAdapter {
  private ws: any;

  async connect(url: string, headers: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const WebSocket = require('ws');
        
        this.ws = new WebSocket(url, {
          headers
        });

        this.ws.on('open', () => {
          resolve();
        });

        this.ws.on('message', (data: any) => {
          this.emit('message', data.toString());
        });

        this.ws.on('error', (error: Error) => {
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          this.emit('close');
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws.readyState !== 1) { // 1 = OPEN
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(new Error(`Failed to create WebSocket connection. Install the "ws" package: npm install ws. Error: ${error}`));
      }
    });
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
      this.ws.send(data);
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}