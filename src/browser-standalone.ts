// Standalone browser build without React dependencies
import { VoiceLiveClient } from './core/voice-live-client';
import { VoiceLiveConfig } from './types';
import { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';

// Platform detection for browser
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export function createClient(config: VoiceLiveConfig): VoiceLiveClient {
  if (!isBrowser) {
    throw new Error('This build is only for browser environments.');
  }

  return new VoiceLiveClient(
    config,
    new BrowserAudioAdapter(),
    new BrowserConnectionAdapter()
  );
}

// Re-export core functionality
export * from './types';
export * from './core/voice-live-client';
export { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';

// Default export
export default createClient;

// Export for UMD build
if (typeof window !== 'undefined') {
  (window as any).AzureVoiceLive = {
    createClient,
    VoiceLiveClient,
    BrowserAudioAdapter,
    BrowserConnectionAdapter
  };
}