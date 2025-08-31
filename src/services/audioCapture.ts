import { AudioCaptureEvents } from '../interfaces/types';

/**
 * Captures audio from the user's microphone and processes it
 * @param events - Event handlers for audio capture
 * @param stopSignal - Function to check if capture should stop
 * @returns Promise that resolves when capture stops
 */
export async function captureAudio(
  events: AudioCaptureEvents,
  stopSignal: () => boolean
): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000, // Consistent with Azure API
    });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    let isRecording = true;

    events.onStart();

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (!isRecording || stopSignal()) return;

      try {
        const inputData = e.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        const bytes = new Uint8Array(int16Data.buffer);
        const binary = String.fromCharCode(...bytes);
        const base64Audio = btoa(binary);
        events.onAudioData(base64Audio);
      } catch (error) {
        events.onError(error as Error);
      }
    };

    return new Promise((resolve) => {
      const checkStop = () => {
        if (stopSignal()) {
          isRecording = false;
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
          events.onStop();
          resolve();
        } else {
          setTimeout(checkStop, 50);
        }
      };
      checkStop();
    });
  } catch (error) {
    events.onError(error as Error);
    throw error;
  }
}