'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useVoiceLive } from '../hooks.browser';
import type { VoiceLiveConfig } from '../../types';
import type {
  BaseVoiceComponentProps,
  ThemeVariant,
  VoiceEventHandlers,
  EnhancedSessionConfig,
  AccessibilityProps,
  LoadingProps,
  StyleProps,
  VoiceComponentState
} from '../types';

export interface VoiceChatProps extends 
  BaseVoiceComponentProps,
  VoiceEventHandlers,
  AccessibilityProps,
  LoadingProps,
  StyleProps {
  
  // Required props
  config: VoiceLiveConfig;
  
  // Configuration props
  sessionConfig?: EnhancedSessionConfig;
  theme?: ThemeVariant;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  
  // Feature flags
  showAdvancedControls?: boolean;
  showConnectionStatus?: boolean;
  showSessionInfo?: boolean;
  showVolumeControls?: boolean;
  showRecordingTimer?: boolean;
  showWaveform?: boolean;
  showTranscript?: boolean;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  
  // Behavior props
  maxRecordingDuration?: number;
  recordingTimeoutWarning?: number;
  enableKeyboardShortcuts?: boolean;
  enableHotkeys?: boolean;
  enableVoiceActivation?: boolean;
  
  // UI customization
  headerText?: string;
  connectButtonText?: string;
  disconnectButtonText?: string;
  startRecordingText?: string;
  stopRecordingText?: string;
  
  // Icons
  icons?: {
    microphone?: React.ReactNode;
    speaker?: React.ReactNode;
    connect?: React.ReactNode;
    disconnect?: React.ReactNode;
    settings?: React.ReactNode;
    waveform?: React.ReactNode;
  };
  
  // Advanced props
  debug?: boolean;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  telemetry?: boolean;
  
  // Performance props
  optimizeForMobile?: boolean;
  reduceAnimations?: boolean;
  
  // Analytics props (for k-kaundal)
  userId?: string;
  sessionName?: string;
  analyticsCallback?: (event: string, data: any) => void;
  
  // Component control methods (instead of ref)
  onComponentReady?: (methods: VoiceChatMethods) => void;
}

// Methods that would have been in ref, now passed via callback
export interface VoiceChatMethods {
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
  getState: () => VoiceComponentState;
  reset: () => void;
  exportSession: () => Promise<any>;
  getAnalytics: () => any;
  setVolume: (volume: number) => void;
  takeScreenshot: () => string;
}

// Enhanced theme configurations
const themeConfigs = {
  light: {
    container: 'bg-white border-gray-200 text-gray-800 shadow-sm',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200',
    status: 'bg-gray-50 border-gray-200',
    error: 'bg-red-50 border-red-200 text-red-800',
    text: 'text-gray-600',
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    indicator: {
      connected: 'bg-green-400 shadow-lg shadow-green-200',
      recording: 'bg-red-400 animate-pulse shadow-lg shadow-red-200',
      playback: 'bg-blue-400 shadow-lg shadow-blue-200',
      inactive: 'bg-gray-300'
    }
  },
  dark: {
    container: 'bg-gray-800 border-gray-700 text-white shadow-lg',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200',
    success: 'bg-green-500 hover:bg-green-600 text-white transition-all duration-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white transition-all duration-200',
    status: 'bg-gray-700 border-gray-600',
    error: 'bg-red-900 border-red-700 text-red-200',
    text: 'text-gray-300',
    gradient: 'bg-gradient-to-r from-blue-400 to-blue-500',
    indicator: {
      connected: 'bg-green-400 shadow-lg shadow-green-300/50',
      recording: 'bg-red-400 animate-pulse shadow-lg shadow-red-300/50',
      playback: 'bg-blue-400 shadow-lg shadow-blue-300/50',
      inactive: 'bg-gray-500'
    }
  },
  blue: {
    container: 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-blue-400 hover:bg-blue-500 text-white transition-colors duration-200',
    success: 'bg-green-600 hover:bg-green-700 text-white transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white transition-all duration-200',
    status: 'bg-blue-100 border-blue-300',
    error: 'bg-red-50 border-red-200 text-red-800',
    text: 'text-blue-700',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    indicator: {
      connected: 'bg-green-400 shadow-lg shadow-green-200',
      recording: 'bg-red-400 animate-pulse shadow-lg shadow-red-200',
      playback: 'bg-blue-500 shadow-lg shadow-blue-300',
      inactive: 'bg-blue-300'
    }
  },
  green: {
    container: 'bg-green-50 border-green-200 text-green-900 shadow-sm',
    primary: 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-green-400 hover:bg-green-500 text-white transition-colors duration-200',
    success: 'bg-green-600 hover:bg-green-700 text-white transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white transition-all duration-200',
    status: 'bg-green-100 border-green-300',
    error: 'bg-red-50 border-red-200 text-red-800',
    text: 'text-green-700',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    indicator: {
      connected: 'bg-green-500 shadow-lg shadow-green-300',
      recording: 'bg-red-400 animate-pulse shadow-lg shadow-red-200',
      playback: 'bg-blue-400 shadow-lg shadow-blue-200',
      inactive: 'bg-green-300'
    }
  },
  purple: {
    container: 'bg-purple-50 border-purple-200 text-purple-900 shadow-sm',
    primary: 'bg-purple-600 hover:bg-purple-700 text-white transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-purple-400 hover:bg-purple-500 text-white transition-colors duration-200',
    success: 'bg-green-600 hover:bg-green-700 text-white transition-all duration-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white transition-all duration-200',
    status: 'bg-purple-100 border-purple-300',
    error: 'bg-red-50 border-red-200 text-red-800',
    text: 'text-purple-700',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
    indicator: {
      connected: 'bg-green-400 shadow-lg shadow-green-200',
      recording: 'bg-red-400 animate-pulse shadow-lg shadow-red-200',
      playback: 'bg-purple-400 shadow-lg shadow-purple-200',
      inactive: 'bg-purple-300'
    }
  },
  custom: {
    container: 'bg-white border-gray-200 text-gray-800',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105 transition-all duration-200',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200',
    status: 'bg-gray-50 border-gray-200',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    text: 'text-gray-600',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    indicator: {
      connected: 'bg-emerald-400 shadow-lg shadow-emerald-200',
      recording: 'bg-rose-400 animate-pulse shadow-lg shadow-rose-200',
      playback: 'bg-indigo-400 shadow-lg shadow-indigo-200',
      inactive: 'bg-gray-300'
    }
  }
};

// Size configurations
const sizeConfigs = {
  sm: {
    container: 'p-4 text-sm',
    button: 'px-3 py-2 text-sm',
    indicator: 'w-2 h-2',
    header: 'text-lg',
    spacing: 'space-y-3',
    waveform: 'h-12'
  },
  md: {
    container: 'p-6 text-base',
    button: 'px-4 py-2 text-base',
    indicator: 'w-3 h-3',
    header: 'text-xl',
    spacing: 'space-y-4',
    waveform: 'h-16'
  },
  lg: {
    container: 'p-8 text-lg',
    button: 'px-6 py-3 text-lg',
    indicator: 'w-4 h-4',
    header: 'text-2xl',
    spacing: 'space-y-6',
    waveform: 'h-20'
  }
};

// Default icons
const defaultIcons = {
  microphone: '🎤',
  speaker: '🔊',
  connect: '🔌',
  disconnect: '❌',
  settings: '⚙️',
  waveform: '〰️'
};

// Waveform Visualizer Component
const WaveformVisualizer: React.FC<{ 
  isRecording: boolean; 
  size: keyof typeof sizeConfigs; 
  theme: any;
  animated: boolean;
}> = ({ isRecording, size, theme, animated }) => {
  const [bars, setBars] = useState(Array(20).fill(0.1));

  useEffect(() => {
    if (!isRecording || !animated) {
      setBars(Array(20).fill(0.1));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => 0.1 + Math.random() * 0.9));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, animated]);

  return (
    <div className={`flex items-end justify-center gap-1 ${sizeConfigs[size].waveform} px-4`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`${theme.primary.includes('blue') ? 'bg-blue-500' : 'bg-current'} rounded-full transition-all duration-100 ease-out`}
          style={{
            width: '3px',
            height: `${height * 100}%`,
            opacity: isRecording ? 0.8 : 0.3,
            animationDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  );
};

// Live Transcript Component
const LiveTranscript: React.FC<{ 
  transcript: string; 
  theme: any;
  size: keyof typeof sizeConfigs;
}> = ({ transcript, theme, size }) => {
  return (
    <div className={`${theme.status} p-3 rounded-lg border mt-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-medium ${sizeConfigs[size].container.includes('text-sm') ? 'text-sm' : 'text-base'}`}>
          Live Transcript
        </span>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      <div className={`text-sm ${theme.text} min-h-[2rem] max-h-24 overflow-y-auto`}>
        {transcript || (
          <span className="italic opacity-60">
            Start speaking to see live transcription for k-kaundal...
          </span>
        )}
      </div>
    </div>
  );
};

// Main VoiceChat Component
export const VoiceChat: React.FC<VoiceChatProps> = ({
  // Required props
  config,
  
  // Configuration
  sessionConfig,
  theme = 'light',
  size = 'md',
  variant = 'default',
  
  // Feature flags
  showAdvancedControls = false,
  showConnectionStatus = true,
  showSessionInfo = true,
  showVolumeControls = false,
  showRecordingTimer = true,
  showWaveform = true,
  showTranscript = false,
  autoConnect = false,
  autoReconnect = true,
  
  // Behavior
  maxRecordingDuration,
  recordingTimeoutWarning,
  enableKeyboardShortcuts = false,
  enableHotkeys = false,
  enableVoiceActivation = false,
  
  // UI customization
  headerText = 'Voice Chat',
  connectButtonText = 'Connect',
  disconnectButtonText = 'Disconnect',
  startRecordingText = 'Start Chat',
  stopRecordingText = 'Stop Chat',
  
  // Icons
  icons = defaultIcons,
  
  // Event handlers
  onStateChange,
  onConnect,
  onDisconnect,
  onRecordingStart,
  onRecordingStop,
  onPlaybackStart,
  onPlaybackStop,
  onError,
  onSessionCreated,
  onAudioReceived,
  onTranscriptReceived,
  
  // Base props
  className = '',
  id,
  'data-testid': dataTestId,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  // Loading
  loading = false,
  loadingText = 'Loading...',
  loadingComponent,
  
  // Style
  animated = true,
  style,
  
  // Debug
  debug = false,
  logLevel = 'warn',
  telemetry = true,
  
  // Performance
  optimizeForMobile = false,
  reduceAnimations = false,
  
  // Analytics (for k-kaundal)
  userId = 'k-kaundal',
  sessionName,
  analyticsCallback,
  onComponentReady
}) => {
  
  // State management
  const [recordingTime, setRecordingTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sessionStats, setSessionStats] = useState({
    startTime: null as Date | null,
    totalRecordingTime: 0,
    messageCount: 0,
    errorCount: 0
  });
  const [mounted, setMounted] = useState(false);

  // Memoized configurations
  const currentTheme = useMemo(() => themeConfigs[theme], [theme]);
  const currentSize = useMemo(() => sizeConfigs[size], [size]);

  // Enhanced session config
  const enhancedSessionConfig = useMemo(() => ({
    instructions: `You are a helpful AI assistant created for ${userId}. Be concise and helpful. Current time: 2025-08-31 10:12:46 UTC`,
    voice: {
      name: "en-US-Ava:DragonHDLatestNeural",
      type: "azure-standard",
      temperature: 0.8
    },
    audioSettings: {
      sampleRate: 24000,
      channels: 1,
      noiseReduction: true,
      echoCancellation: true
    },
    metadata: {
      userId,
      sessionName: sessionName || `Voice Chat - ${new Date().toISOString()}`,
      timestamp: '2025-08-31T10:12:46.000Z',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
    },
    ...sessionConfig
  }), [sessionConfig, userId, sessionName]);

  // Voice Live hook
  const voiceLive = useVoiceLive({
    config,
    sessionConfig: sessionConfig,
    autoConnect
  });

  const {
    isConnected,
    isRecording,
    isPlaybackActive,
    sessionId,
    error,
    isInitializing,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    startPlayback,
    stopPlayback
  } = voiceLive;

  // Component state
  const componentState: VoiceComponentState = useMemo(() => ({
    isConnected,
    isRecording,
    isPlaybackActive,
    sessionId,
    error,
    isInitializing,
    connectionStatus: error ? 'error' : isConnected ? 'connected' : isInitializing ? 'connecting' : 'disconnected',
    recordingStatus: isRecording ? 'recording' : 'idle'
  }), [isConnected, isRecording, isPlaybackActive, sessionId, error, isInitializing]);

  // Analytics tracking
  const trackEvent = useCallback((event: string, data: any = {}) => {
    if (analyticsCallback) {
      analyticsCallback(event, {
        ...data,
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        component: 'VoiceChat',
        version: '2.0.4'
      });
    }
    
    if (debug) {
      console.log(`[VoiceChat-${userId}] ${event}:`, data);
    }
  }, [analyticsCallback, userId, sessionId, debug]);

  // Component methods (instead of ref)
  const componentMethods: VoiceChatMethods = useMemo(() => ({
    connect,
    disconnect,
    startRecording,
    stopRecording,
    toggleRecording: async () => {
      if (isRecording) {
        stopRecording();
        trackEvent('recording_toggled', { action: 'stop' });
      } else {
        await startRecording();
        trackEvent('recording_toggled', { action: 'start' });
      }
    },
    getState: () => componentState,
    reset: () => {
      setRecordingTime(0);
      setVolume(0.8);
      setLiveTranscript('');
      setSessionStats({
        startTime: null,
        totalRecordingTime: 0,
        messageCount: 0,
        errorCount: 0
      });
      trackEvent('component_reset');
    },
    exportSession: async () => {
      const sessionData = {
        config,
        sessionConfig: enhancedSessionConfig,
        stats: sessionStats,
        state: componentState,
        transcript: liveTranscript,
        userId,
        exportTime: '2025-08-31T10:12:46.000Z'
      };
      trackEvent('session_exported', { dataSize: JSON.stringify(sessionData).length });
      return sessionData;
    },
    getAnalytics: () => sessionStats,
    setVolume: (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);
      trackEvent('volume_changed', { volume: clampedVolume });
    },
    takeScreenshot: () => {
      return JSON.stringify({
        state: componentState,
        ui: { theme, size, variant },
        timestamp: '2025-08-31T10:12:46.000Z',
        user: userId
      }, null, 2);
    }
  }), [
    connect, disconnect, startRecording, stopRecording, isRecording,
    componentState, config, enhancedSessionConfig, sessionStats,
    liveTranscript, userId, trackEvent, theme, size, variant
  ]);

  // Provide methods to parent component
  useEffect(() => {
    if (onComponentReady && mounted) {
      onComponentReady(componentMethods);
    }
  }, [onComponentReady, componentMethods, mounted]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
    setSessionStats(prev => ({ ...prev, startTime: new Date() }));
    trackEvent('component_mounted', { 
      theme, 
      size, 
      variant, 
      timestamp: '2025-08-31T10:12:46.000Z',
      user: userId 
    });
  }, [theme, size, variant, trackEvent, userId]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && mounted) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          setSessionStats(current => ({
            ...current,
            totalRecordingTime: current.totalRecordingTime + 1
          }));
          
          if (recordingTimeoutWarning && newTime === recordingTimeoutWarning) {
            console.warn(`Recording timeout warning reached for ${userId}`);
            trackEvent('recording_timeout_warning', { duration: newTime });
          }
          
          if (maxRecordingDuration && newTime >= maxRecordingDuration) {
            stopRecording();
            trackEvent('recording_max_duration_reached', { duration: newTime });
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, mounted, maxRecordingDuration, recordingTimeoutWarning, stopRecording, trackEvent, userId]);

  // State change handler
  useEffect(() => {
    if (onStateChange) {
      onStateChange(componentState);
    }
    trackEvent('state_changed', componentState);
  }, [componentState, onStateChange, trackEvent]);

  // Event handlers
  useEffect(() => {
    if (isConnected && onConnect) {
      onConnect();
      trackEvent('connected');
    }
    if (!isConnected && onDisconnect) {
      onDisconnect();
      trackEvent('disconnected');
    }
  }, [isConnected, onConnect, onDisconnect, trackEvent]);

  useEffect(() => {
    if (isRecording && onRecordingStart) {
      onRecordingStart();
      trackEvent('recording_started');
    }
    if (!isRecording && onRecordingStop) {
      onRecordingStop();
      trackEvent('recording_stopped');
    }
  }, [isRecording, onRecordingStart, onRecordingStop, trackEvent]);

  useEffect(() => {
    if (isPlaybackActive && onPlaybackStart) {
      onPlaybackStart();
      trackEvent('playback_started');
    }
    if (!isPlaybackActive && onPlaybackStop) {
      onPlaybackStop();
      trackEvent('playback_stopped');
    }
  }, [isPlaybackActive, onPlaybackStart, onPlaybackStop, trackEvent]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
      setSessionStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      trackEvent('error_occurred', { message: error.message });
    }
  }, [error, onError, trackEvent]);

  useEffect(() => {
    if (sessionId && onSessionCreated) {
      onSessionCreated(sessionId);
      trackEvent('session_created', { sessionId });
    }
  }, [sessionId, onSessionCreated, trackEvent]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts || !mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            if (isConnected) {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
              trackEvent('keyboard_shortcut_used', { 
                key: 'Enter', 
                action: isRecording ? 'stop' : 'start',
                user: userId 
              });
            }
            break;
          case 'Escape':
            event.preventDefault();
            if (isRecording) {
              stopRecording();
              trackEvent('keyboard_shortcut_used', { 
                key: 'Escape', 
                action: 'stop',
                user: userId 
              });
            }
            break;
          case 'r':
            event.preventDefault();
            if (isConnected && !isRecording) {
              startRecording();
              trackEvent('keyboard_shortcut_used', { 
                key: 'r', 
                action: 'start',
                user: userId 
              });
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, mounted, isConnected, isRecording, startRecording, stopRecording, trackEvent, userId]);

  // Conversation handlers
  const handleStartConversation = useCallback(async () => {
    try {
      await startRecording();
      startPlayback();
      setSessionStats(prev => ({ ...prev, messageCount: prev.messageCount + 1 }));
      trackEvent('conversation_started', { user: userId });
    } catch (err) {
      console.error(`Failed to start conversation for ${userId}:`, err);
      trackEvent('conversation_start_failed', { 
        error: err instanceof Error ? err.message : 'Unknown error',
        user: userId 
      });
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  }, [startRecording, startPlayback, onError, trackEvent, userId]);

  const handleStopConversation = useCallback(() => {
    stopRecording();
    stopPlayback();
    trackEvent('conversation_stopped', { user: userId });
  }, [stopRecording, stopPlayback, trackEvent, userId]);

  // Format time utility
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    trackEvent('volume_changed', { volume: clampedVolume, user: userId });
  }, [trackEvent, userId]);

  // Don't render until mounted (SSR safety)
  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading || isInitializing) {
    return (
      <div 
        className={`${currentSize.container} ${currentTheme.container} rounded-lg border ${className}`}
        style={style}
        id={id}
        data-testid={dataTestId}
      >
        {loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className={currentTheme.text}>
                {loadingText} {userId && debug && `(${userId})`}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${currentSize.container} ${currentTheme.container} rounded-lg border ${animated && !reduceAnimations ? 'transition-all duration-200' : ''} ${className}`}
      style={style}
      id={id}
      data-testid={dataTestId}
      role="region"
      aria-label={ariaLabel || `${headerText} interface for ${userId}`}
      aria-describedby={ariaDescribedBy}
    >
      {/* Header */}
      {variant !== 'minimal' && (
        <div className={`mb-6 ${currentSize.spacing}`}>
          <h3 className={`${currentSize.header} font-bold mb-2 flex items-center gap-2`}>
            <span>{icons.microphone}</span>
            {headerText}
            {userId && debug && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                {userId}
              </span>
            )}
          </h3>
          <p className={currentTheme.text}>
            {isConnected 
              ? isRecording 
                ? `Recording voice for ${userId}...` 
                : 'Ready for conversation'
              : 'Click connect to start your AI conversation'
            }
          </p>
          {debug && (
            <p className="text-xs opacity-75 mt-1">
              Session: {sessionId || 'N/A'} | Time: 2025-08-31 10:12:46 UTC
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-lg border mb-6 ${currentTheme.error}`} role="alert">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div>
              <div className="font-semibold">Error for {userId}</div>
              <div className="text-sm">{error.message}</div>
              {debug && (
                <div className="text-xs mt-1 opacity-75">
                  Session: {sessionId || 'N/A'} | Time: {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {showConnectionStatus && variant !== 'minimal' && (
        <div className={`p-4 rounded-lg border mb-6 ${currentTheme.status}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Status</span>
            <div className="flex gap-3">
              <div className="flex items-center gap-1">
                <div className={`${currentSize.indicator} rounded-full ${currentTheme.indicator[isConnected ? 'connected' : 'inactive']}`}></div>
                <span className="text-sm">Connected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`${currentSize.indicator} rounded-full ${currentTheme.indicator[isRecording ? 'recording' : 'inactive']}`}></div>
                <span className="text-sm">Recording</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`${currentSize.indicator} rounded-full ${currentTheme.indicator[isPlaybackActive ? 'playback' : 'inactive']}`}></div>
                <span className="text-sm">Audio</span>
              </div>
            </div>
          </div>
          
          {/* Recording Timer */}
          {showRecordingTimer && isRecording && (
            <div className="flex items-center gap-2 justify-center mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
              {maxRecordingDuration && (
                <span className="text-xs text-gray-500">
                  / {formatTime(maxRecordingDuration)}
                </span>
              )}
            </div>
          )}
          
          {/* Session Info */}
          {showSessionInfo && sessionId && (
            <div className="text-sm mt-2">
              <span className="font-medium">Session:</span> {sessionId.slice(0, 12)}...
              {debug && sessionStats.startTime && (
                <div className="text-xs mt-1 opacity-75">
                  User: {userId} | Started: {sessionStats.startTime.toLocaleTimeString()} | 
                  Messages: {sessionStats.messageCount} | 
                  Total Recording: {formatTime(sessionStats.totalRecordingTime)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Waveform Visualization */}
      {showWaveform && isConnected && (
        <div className={`mb-4 ${currentTheme.text}`}>
          <WaveformVisualizer 
            isRecording={isRecording} 
            size={size} 
            theme={currentTheme}
            animated={animated && !reduceAnimations}
          />
        </div>
      )}

      {/* Main Controls */}
      <div className={`flex flex-wrap gap-3 mb-4 ${variant === 'compact' ? 'justify-center' : ''}`}>
        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isInitializing}
            className={`flex items-center gap-2 ${currentSize.button} rounded-lg font-medium ${currentTheme.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`${connectButtonText} to voice service for ${userId}`}
          >
            <span>{icons.connect}</span>
            {isInitializing ? 'Connecting...' : connectButtonText}
          </button>
        ) : (
          <>
            <button
              onClick={disconnect}
              className={`flex items-center gap-2 ${currentSize.button} rounded-lg font-medium ${currentTheme.secondary}`}
              aria-label={`${disconnectButtonText} for ${userId}`}
            >
              <span>{icons.disconnect}</span>
              {disconnectButtonText}
            </button>

            {!isRecording ? (
              <button
                onClick={handleStartConversation}
                className={`flex items-center gap-2 ${currentSize.button} rounded-lg font-medium ${currentTheme.success}`}
                aria-label={`${startRecordingText} for ${userId}`}
              >
                <span>{icons.microphone}</span>
                {startRecordingText}
              </button>
            ) : (
              <button
                onClick={handleStopConversation}
                className={`flex items-center gap-2 ${currentSize.button} rounded-lg font-medium ${animated && !reduceAnimations ? 'animate-pulse' : ''} ${currentTheme.danger}`}
                aria-label={`${stopRecordingText} for ${userId}`}
              >
                <span>⏹️</span>
                {stopRecordingText}
              </button>
            )}
          </>
        )}
      </div>

      {/* Live Transcript */}
      {showTranscript && isConnected && (
        <LiveTranscript 
          transcript={liveTranscript} 
          theme={currentTheme}
          size={size}
        />
      )}

      {/* Advanced Controls */}
      {showAdvancedControls && isConnected && variant !== 'minimal' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              isRecording 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            aria-label={`${isRecording ? 'Stop' : 'Start'} microphone for ${userId}`}
          >
            {isRecording ? '⏸️ Stop Mic' : '🎙️ Start Mic'}
          </button>
          
          <button
            onClick={isPlaybackActive ? stopPlayback : startPlayback}
            className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              isPlaybackActive 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`${isPlaybackActive ? 'Mute' : 'Unmute'} audio for ${userId}`}
          >
            {isPlaybackActive ? '🔇 Mute' : '🔊 Unmute'}
          </button>

          {/* Volume Control */}
          {showVolumeControls && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-sm">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                aria-label={`Volume control for ${userId}`}
              />
              <span className="text-xs text-gray-600 w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {enableKeyboardShortcuts && variant !== 'minimal' && (
        <div className="text-xs text-gray-500 text-center mb-4">
          <div>
            Shortcuts for {userId}: Ctrl+Enter (toggle), Esc (stop), Ctrl+R (start)
            {debug && ' | Debug mode active'}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debug && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg border text-xs">
          <details>
            <summary className="cursor-pointer font-medium">
              Debug Info - {userId} Session (2025-08-31 10:12:46 UTC)
            </summary>
            <div className="mt-2 space-y-2">
              <div><strong>Component State:</strong></div>
              <pre className="overflow-auto text-[10px] bg-white p-2 rounded">
                {JSON.stringify(componentState, null, 2)}
              </pre>
              
              <div><strong>Session Statistics:</strong></div>
              <pre className="overflow-auto text-[10px] bg-white p-2 rounded">
                {JSON.stringify(sessionStats, null, 2)}
              </pre>
              
              <div><strong>Configuration:</strong></div>
              <pre className="overflow-auto text-[10px] bg-white p-2 rounded">
                {JSON.stringify({ theme, size, variant, userId, timestamp: '2025-08-31T10:12:46.000Z' }, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

VoiceChat.displayName = 'VoiceChat';

export default VoiceChat;