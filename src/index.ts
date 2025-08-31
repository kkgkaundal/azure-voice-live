import { VoiceLiveClient } from './core/voice-live-client';
import { VoiceLiveConfig } from './types';
import { isBrowser, isNode } from './utils/environment';

export async function createClient(config: VoiceLiveConfig): Promise<VoiceLiveClient> {
  if (isBrowser) {
    const { BrowserAudioAdapter, BrowserConnectionAdapter } = await import('./adapters/browser');
    return new VoiceLiveClient(
      config,
      new BrowserAudioAdapter(),
      new BrowserConnectionAdapter()
    );
  } else if (isNode) {
    const { NodeAudioAdapter, NodeConnectionAdapter } = await import('./adapters/node');
    return new VoiceLiveClient(
      config,
      new NodeAudioAdapter(),
      new NodeConnectionAdapter()
    );
  } else {
    throw new Error('Unsupported environment');
  }
}

// Synchronous version for backwards compatibility and React hooks
export function createClientSync(config: VoiceLiveConfig): VoiceLiveClient {
  try {
    if (isBrowser) {
      const { BrowserAudioAdapter, BrowserConnectionAdapter } = require('./adapters/browser');
      return new VoiceLiveClient(
        config,
        new BrowserAudioAdapter(),
        new BrowserConnectionAdapter()
      );
    } else if (isNode) {
      const { NodeAudioAdapter, NodeConnectionAdapter } = require('./adapters/node');
      return new VoiceLiveClient(
        config,
        new NodeAudioAdapter(),
        new NodeConnectionAdapter()
      );
    } else {
      throw new Error('Unsupported environment');
    }
  } catch (error) {
    throw new Error(`Failed to create client: ${error}`);
  }
}

// Re-export everything at module level
export * from './types';
export * from './core/voice-live-client';
export * from './utils/environment';
export * from './react/index'

// These exports will be available but may error at runtime if environment doesn't support them
export { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';
export { NodeAudioAdapter, NodeConnectionAdapter } from './adapters/node';

// Default export (synchronous for compatibility)
export default createClientSync;