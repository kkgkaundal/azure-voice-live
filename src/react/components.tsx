import React, { ReactNode } from 'react';
import { useVoiceLive, UseVoiceLiveOptions, UseVoiceLiveReturn } from './hooks';

export interface VoiceLiveProviderProps extends UseVoiceLiveOptions {
  children: (voiceLive: UseVoiceLiveReturn) => ReactNode;
}

export function VoiceLiveProvider({ children, ...options }: VoiceLiveProviderProps): JSX.Element {
  const voiceLive = useVoiceLive(options);
  return <>{children(voiceLive)}</>;
}

export interface VoiceLiveControlsProps {
  voiceLive: UseVoiceLiveReturn;
  className?: string;
}

export function VoiceLiveControls({ voiceLive, className }: VoiceLiveControlsProps): JSX.Element {
  const {
    isConnected,
    isRecording,
    isPlaybackActive,
    isInitializing,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    startPlayback,
    stopPlayback,
    error,
    client
  } = voiceLive;

  const isClientReady = !!client && !isInitializing;

  return (
    <div className={className}>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error.message}
        </div>
      )}

      {isInitializing && (
        <div style={{ color: 'blue', marginBottom: '10px' }}>
          Initializing client...
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        Status: {
          !isClientReady ? 'Initializing...' :
          isConnected ? 'Connected' : 'Disconnected'
        }
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!isConnected ? (
          <button onClick={connect} disabled={!isClientReady || isInitializing}>
            Connect
          </button>
        ) : (
          <button onClick={disconnect} disabled={!isClientReady}>
            Disconnect
          </button>
        )}
        
        {isConnected && isClientReady && (
          <>
            {!isRecording ? (
              <button onClick={startRecording}>Start Recording</button>
            ) : (
              <button onClick={stopRecording}>Stop Recording</button>
            )}
            
            {!isPlaybackActive ? (
              <button onClick={startPlayback}>Start Playback</button>
            ) : (
              <button onClick={stopPlayback}>Stop Playback</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}