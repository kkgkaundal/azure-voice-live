// Node.js-specific entry point
import { VoiceLiveClient } from './core/voice-live-client';
import { VoiceLiveConfig } from './types';
import { NodeAudioAdapter, NodeConnectionAdapter } from './adapters/node';

// Platform detection for Node.js
const isNode = typeof process !== 'undefined' && process.versions?.node;

export function createClient(config: VoiceLiveConfig): VoiceLiveClient {
  if (!isNode) {
    throw new Error('This build is only for Node.js environments. Use the browser build for client-side usage.');
  }

  return new VoiceLiveClient(
    config,
    new NodeAudioAdapter(),
    new NodeConnectionAdapter()
  );
}

// Re-export everything needed for Node.js
export * from './types';
export * from './core/voice-live-client';
export { NodeAudioAdapter, NodeConnectionAdapter } from './adapters/node';

// Default export
export default createClient;