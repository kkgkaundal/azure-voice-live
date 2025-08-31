import { EventEmitter } from 'eventemitter3';
import { AudioAdapter, ConnectionAdapter } from '../types';
import { createWavBuffer } from '../utils/audioUtils';

export class BrowserAudioAdapter extends EventEmitter implements AudioAdapter {
  private mediaRecorder?: MediaRecorder;
  private audioContext?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private processor?: ScriptProcessorNode;
  private stream?: MediaStream;
  private isRecording = false;
  private isPlaybackActive = false;
  private audioBufferQueue: ArrayBuffer[] = [];
  private _isPlaying: boolean = false;
  private analyser: AnalyserNode | null = null;

  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Use any to avoid TypeScript webkit issues
      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextConstructor({
        sampleRate: 24000
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (this.isRecording) {
          const inputData = event.inputBuffer.getChannelData(0);
          const int16Array = new Int16Array(inputData.length);
          
          for (let i = 0; i < inputData.length; i++) {
            const sample = inputData[i];
            if (sample !== undefined) {
              int16Array[i] = Math.max(-32768, Math.min(32767, sample * 32768));
            }
          }
          
          this.emit('audioData', int16Array.buffer);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
    } catch (error) {
      this.emit('error', new Error(`Failed to start recording: ${error}`));
    }
  }

  stopRecording(): void {
    this.isRecording = false;
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = undefined;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = undefined;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
  }

  startPlayback(): void {
    this.isPlaybackActive = true;
  }

  stopPlayback(): void {
    this.isPlaybackActive = false;
  }


    /**
   * Plays audio data
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
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
        const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const wavBuffer = createWavBuffer(audioData, 24000);
        const audioBuffer = await audioContext.decodeAudioData(wavBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        if (this.analyser) {
          source.connect(this.analyser);
          this.analyser.connect(audioContext.destination);
        } else {
          source.connect(audioContext.destination);
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

  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  isPlaybackSupported(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }
}

export class BrowserConnectionAdapter extends EventEmitter implements ConnectionAdapter {
  private ws?: WebSocket;

  async connect(url: string, headers: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For browser WebSocket, we'll need to handle auth differently
        // since headers can't be set directly in browser WebSocket
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.emit('message', event.data);
        };

        this.ws.onerror = (error) => {
          const err = new Error('WebSocket error');
          this.emit('error', err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.emit('close');
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
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