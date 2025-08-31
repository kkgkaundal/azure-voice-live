
// React types
export * from './types';

// React hooks
export * from './react/hooks.browser';

export { 
  VoiceRecorder,
} from './react/components/VoiceRecorder';

export { 
  VoiceStatus,
} from './react/components/VoiceStatus';

export { 
  QuickVoice,
} from './react/components/QuickVoice';

// Browser client creation for React apps
import { VoiceLiveClient } from './core/voice-live-client';
import { VoiceLiveConfig } from './types';
import { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';

export function createVoiceLiveClient(config: VoiceLiveConfig): VoiceLiveClient {
  if (typeof window === 'undefined') {
    throw new Error('createVoiceLiveClient can only be used in browser environments (React/Next.js client-side)');
  }

  return new VoiceLiveClient(
    config,
    new BrowserAudioAdapter(),
    new BrowserConnectionAdapter()
  );
}

// Re-export core types
export type { VoiceLiveConfig, SessionConfig } from './types';
export type { VoiceLiveClient } from './core/voice-live-client';