// Browser-specific entry point
import { VoiceLiveClient } from './core/voice-live-client';
import { VoiceLiveConfig } from './types';
import { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';

// Platform detection for browser
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export function createClient(config: VoiceLiveConfig): VoiceLiveClient {
  if (!isBrowser) {
    throw new Error('This build is only for browser environments. Use the Node.js build for server-side usage.');
  }

  return new VoiceLiveClient(
    config,
    new BrowserAudioAdapter(),
    new BrowserConnectionAdapter()
  );
}

// Synchronous version for React hooks (browser-specific)
export function createClientSync(config: VoiceLiveConfig): VoiceLiveClient {
  return createClient(config);
}

// Re-export everything needed for browser
export * from './types';
export * from './core/voice-live-client';
export { BrowserAudioAdapter, BrowserConnectionAdapter } from './adapters/browser';

// Check if React is available before trying to load React components
const isReactAvailable = () => {
  try {
    return typeof window !== 'undefined' && 
           (window as any).React && 
           typeof (window as any).React.createElement === 'function';
  } catch (error) {
    return false;
  }
};

// React exports - browser-specific with safety checks
export let react: any = {};

// Only load React components if React is available
if (isReactAvailable()) {
  try {
    const hooks = require('./react/hooks.browser');
    const components = require('./react/components');
    
    react = {
      ...hooks,
      ...components
    };
  } catch (error) {
    console.warn('React components not available:', error);
    react = {};
  }
}

// Safe component exports - return dummy components if React not available
const createDummyComponent = (name: string) => {
  return () => {
    console.warn(`${name} component requires React to be loaded first`);
    return null;
  };
};

// Export components with fallbacks
export const VoiceChat = react.VoiceChat || createDummyComponent('VoiceChat');
export const VoiceRecorder = react.VoiceRecorder || createDummyComponent('VoiceRecorder');
export const VoiceStatus = react.VoiceStatus || createDummyComponent('VoiceStatus');
export const QuickVoice = react.QuickVoice || createDummyComponent('QuickVoice');
export const VoiceLiveProvider = react.VoiceLiveProvider || createDummyComponent('VoiceLiveProvider');
export const VoiceLiveControls = react.VoiceLiveControls || createDummyComponent('VoiceLiveControls');

// Hook exports with fallbacks
export const useVoiceLive = react.useVoiceLive || (() => {
  throw new Error('useVoiceLive hook requires React to be loaded first');
});
export const useVoiceLiveEvents = react.useVoiceLiveEvents || (() => {
  throw new Error('useVoiceLiveEvents hook requires React to be loaded first');
});
export const useVoiceLiveClient = react.useVoiceLiveClient || (() => {
  throw new Error('useVoiceLiveClient hook requires React to be loaded first');
});

// Default export
export default createClient;

// Export for UMD build with React check
if (typeof window !== 'undefined') {
  (window as any).AzureVoiceLive = {
    createClient,
    createClientSync,
    VoiceLiveClient,
    BrowserAudioAdapter,
    BrowserConnectionAdapter,
    
    // Core functionality always available
    isReactAvailable,
    
    // React components (may be dummy functions)
    VoiceChat,
    VoiceRecorder,
    VoiceStatus,
    QuickVoice,
    VoiceLiveProvider,
    VoiceLiveControls,
    
    // Hooks (may throw errors)
    useVoiceLive,
    useVoiceLiveEvents,
    useVoiceLiveClient,
    
    // React object for advanced usage
    react
  };
}