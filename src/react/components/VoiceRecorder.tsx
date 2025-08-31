'use client';

import React, { useState, useEffect } from 'react';
import { VoiceLiveConfig, SessionConfig, VoiceRecorderProps } from '../../types';
import { useVoiceLive } from '../hooks';

const sizes = {
  sm: {
    container: 'p-4',
    button: 'w-12 h-12 text-lg',
    text: 'text-sm',
    status: 'text-xs'
  },
  md: {
    container: 'p-6',
    button: 'w-16 h-16 text-xl',
    text: 'text-base',
    status: 'text-sm'
  },
  lg: {
    container: 'p-8',
    button: 'w-20 h-20 text-2xl',
    text: 'text-lg',
    status: 'text-base'
  }
};

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  config,
  sessionConfig,
  className = '',
  size = 'md',
  variant = 'detailed',
  onAudioReceived,
  onTranscript
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const currentSize = sizes[size];

  const voiceLive = useVoiceLive({
    config,
    sessionConfig: sessionConfig || {
      instructions: 'You are a voice recorder assistant. Provide brief confirmations.',
      voice: {
        name: "en-US-Ava:DragonHDLatestNeural",
        type: "azure-standard",
        temperature: 0.5
      }
    },
    autoConnect: true
  });

  const {
    isConnected,
    isRecording,
    error,
    isInitializing,
    startRecording,
    stopRecording,
    client
  } = voiceLive;

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Listen for audio events
  useEffect(() => {
    if (!client) return;

    const handleAudioReceived = (event: any) => {
      if (onAudioReceived) {
        onAudioReceived(event);
      }
    };

    client.on('audioReceived', handleAudioReceived);
    return () => {
      client.off('audioReceived', handleAudioReceived);
    };
  }, [client, onAudioReceived]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  if (isInitializing) {
    return (
      <div className={`${currentSize.container} bg-white rounded-lg border shadow ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <button
          onClick={handleToggleRecording}
          disabled={!isConnected}
          className={`${currentSize.button} rounded-full flex items-center justify-center font-medium transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : isConnected
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className={`font-mono ${currentSize.status}`}>
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${currentSize.container} bg-white rounded-lg border shadow-lg ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className={`font-bold ${currentSize.text} mb-2`}>🎙️ Voice Recorder</h3>
        <div className={`${currentSize.status} text-gray-600`}>
          {!isConnected ? 'Connecting...' : isRecording ? 'Recording in progress' : 'Ready to record'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className={currentSize.status}>{error.message}</span>
          </div>
        </div>
      )}

      {/* Recording Button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleToggleRecording}
          disabled={!isConnected}
          className={`${currentSize.button} rounded-full flex items-center justify-center font-medium transition-all transform hover:scale-105 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-200'
              : isConnected
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>

        {/* Recording Timer */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className={`font-mono font-bold text-red-600 ${currentSize.text}`}>
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            <span className={currentSize.status}>Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-gray-300'}`}></div>
            <span className={currentSize.status}>Recording</span>
          </div>
        </div>
      </div>
    </div>
  );
};