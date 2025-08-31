export * from './hooks';

// Only export components if React is available
let components: any = {};
let predefinedComponents: any = {};

try {
  components = require('./components');
  predefinedComponents = require('./components');
} catch (error) {
  // React/JSX not available
  components = {};
  predefinedComponents = {};
}

// Legacy components (backwards compatibility)
export const VoiceLiveProvider = components.VoiceLiveProvider || (() => null);
export const VoiceLiveControls = components.VoiceLiveControls || (() => null);

// Predefined components
export const VoiceChat = predefinedComponents.VoiceChat || (() => null);
export const VoiceRecorder = predefinedComponents.VoiceRecorder || (() => null);
export const VoiceStatus = predefinedComponents.VoiceStatus || (() => null);
export const QuickVoice = predefinedComponents.QuickVoice || (() => null);

// Re-export everything from components for convenience
export * from './components';