
import { VoiceLiveClient } from './core/voice-live-client';
import { AzureVoiceLiveClient } from './services/azureVoiceClient';
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
    // Only import Node adapters in Node.js, never in browser bundles
    // Use eval to avoid static analysis by bundlers
    const { NodeAudioAdapter, NodeConnectionAdapter } = eval('require("./adapters/node")');
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
      // Only require Node adapters in Node.js, never in browser bundles
      // Use eval to avoid static analysis by bundlers
      const { NodeAudioAdapter, NodeConnectionAdapter } = eval('require("./adapters/node")');
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

// Only export browser adapters by default; node adapters are not for browser use
export { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';
// Do not export NodeAudioAdapter, NodeConnectionAdapter in browser bundles

// Default export (synchronous for compatibility)
export default createClientSync;
export { AzureVoiceLiveClient };