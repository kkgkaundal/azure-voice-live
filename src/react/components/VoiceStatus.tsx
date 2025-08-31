'use client';

import React from 'react';
import { VoiceLiveConfig, VoiceStatusProps } from '../../node';
import { useVoiceLive } from '../hooks';

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  config,
  className = '',
  variant = 'detailed',
  showSessionId = true,
  autoConnect = false
}) => {
  const voiceLive = useVoiceLive({
    config,
    autoConnect
  });

  const {
    isConnected,
    isRecording,
    isPlaybackActive,
    sessionId,
    error,
    isInitializing
  } = voiceLive;

  const getStatusColor = () => {
    if (error) return 'red';
    if (isRecording) return 'green';
    if (isConnected) return 'blue';
    return 'gray';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isInitializing) return 'Initializing';
    if (isRecording) return 'Recording';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  if (variant === 'badge') {
    const color = getStatusColor();
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border-red-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[color]} ${className}`}>
        <div className={`w-2 h-2 rounded-full bg-current`}></div>
        {getStatusText()}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${className}`}>
        <div className="flex gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`} title="Connection"></div>
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-400' : 'bg-gray-300'}`} title="Recording"></div>
          <div className={`w-3 h-3 rounded-full ${isPlaybackActive ? 'bg-blue-400' : 'bg-gray-300'}`} title="Playback"></div>
        </div>
        <span className="text-sm font-medium">{getStatusText()}</span>
        {error && <span className="text-red-600 text-sm">⚠️</span>}
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white rounded-lg border shadow ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Voice Live Status</h4>
        {isInitializing && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`}></div>
          <div className="text-xs text-gray-600">Connection</div>
          <div className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            {isConnected ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isRecording ? 'bg-red-400' : 'bg-gray-300'}`}></div>
          <div className="text-xs text-gray-600">Recording</div>
          <div className={`text-sm font-medium ${isRecording ? 'text-red-600' : 'text-gray-400'}`}>
            {isRecording ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${isPlaybackActive ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
          <div className="text-xs text-gray-600">Playback</div>
          <div className={`text-sm font-medium ${isPlaybackActive ? 'text-blue-600' : 'text-gray-400'}`}>
            {isPlaybackActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Session ID */}
      {showSessionId && sessionId && (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Session ID</div>
          <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {sessionId.slice(0, 12)}...
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          ⚠️ {error.message}
        </div>
      )}
    </div>
  );
};