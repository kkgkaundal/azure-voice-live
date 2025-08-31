import { ReactNode } from 'react';
import { VoiceLiveConfig, SessionConfig } from '../../types';

// Base component props
export interface BaseVoiceComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Theme system
export type ThemeVariant = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'custom';
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'minimal' | 'detailed';

// State interfaces
export interface VoiceComponentState {
  isConnected: boolean;
  isRecording: boolean;
  isPlaybackActive: boolean;
  sessionId?: string;
  error?: Error | null;
  isInitializing: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  recordingStatus: 'idle' | 'recording' | 'processing' | 'completed';
}

// Event handlers
export interface VoiceEventHandlers {
  onStateChange?: (state: VoiceComponentState) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackStop?: () => void;
  onError?: (error: Error) => void;
  onSessionCreated?: (sessionId: string) => void;
  onAudioReceived?: (audio: any) => void;
  onTranscriptReceived?: (transcript: string) => void;
}

// Audio configuration
export interface AudioSettings {
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  noiseReduction?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
}

// Enhanced session configuration
export interface EnhancedSessionConfig extends SessionConfig {
  audioSettings?: AudioSettings;
  metadata?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

// Accessibility props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
  tabIndex?: number;
}

// Loading and error states
export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
}

// Animation and styling
export interface StyleProps {
  animated?: boolean;
  animationDuration?: number;
  customTheme?: Partial<ThemeConfig>;
  style?: React.CSSProperties;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  borderRadius: string;
  spacing: Record<string, string>;
  typography: {
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
  };
}