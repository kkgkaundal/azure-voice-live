'use client';

import React, { useState } from 'react';
import { VoiceLiveConfig, SessionConfig, QuickVoiceProps } from '../../types';
import { useVoiceLive } from '../hooks';


const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg'
};

export const QuickVoice: React.FC<QuickVoiceProps> = ({
  config,
  sessionConfig,
  className = '',
  placeholder = 'Hold to speak...',
  size = 'md',
  onComplete
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const voiceLive = useVoiceLive({
    config,
    sessionConfig: sessionConfig || {
      instructions: 'You are a quick voice assistant. Provide very brief responses.',
      voice: {
        name: "en-US-Ava:DragonHDLatestNeural",
        type: "azure-standard",
        temperature: 0.6
      }
    },
    autoConnect: true
  });

  const {
    isConnected,
    isRecording,
    error,
    startRecording,
    stopRecording,
    startPlayback,
    stopPlayback,
    client
  } = voiceLive;

  // Handle mouse/touch events for hold-to-speak
  const handleStart = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    
    setIsHolding(true);
    try {
      await startRecording();
      startPlayback();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsHolding(false);
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isHolding) return;
    
    setIsHolding(false);
    stopRecording();
    
    if (onComplete && transcript) {
      onComplete({ transcript, timestamp: new Date() });
    }
  };

  // Listen for speech events
  React.useEffect(() => {
    if (!client) return;

    const handleSpeechStarted = () => {
      setTranscript('Listening...');
    };

    const handleSpeechStopped = () => {
      setTranscript('Processing...');
    };

    const handleAudioReceived = () => {
      setTranscript('Response received');
      setTimeout(() => setTranscript(''), 2000);
    };

    client.on('speechStarted', handleSpeechStarted);
    client.on('speechStopped', handleSpeechStopped);
    client.on('audioReceived', handleAudioReceived);

    return () => {
      client.off('speechStarted', handleSpeechStarted);
      client.off('speechStopped', handleSpeechStopped);
      client.off('audioReceived', handleAudioReceived);
    };
  }, [client]);

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        disabled={!isConnected}
        className={`w-full ${sizes[size]} rounded-lg font-medium transition-all transform select-none ${
          isHolding
            ? 'bg-red-500 text-white scale-95 shadow-lg'
            : isConnected
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isHolding ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Release to send</span>
            </>
          ) : (
            <>
              <span>🎤</span>
              <span>{isConnected ? placeholder : 'Connecting...'}</span>
            </>
          )}
        </div>
      </button>

      {/* Status Overlay */}
      {transcript && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            {transcript}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-500 text-white text-sm rounded shadow-lg z-10">
          ⚠️ {error.message}
        </div>
      )}

      {/* Connection Indicator */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
        isConnected ? 'bg-green-400' : 'bg-gray-400'
      }`}></div>
    </div>
  );
};