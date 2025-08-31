import { useEffect, useRef, useState, useCallback } from 'react';
import { VoiceLiveClient } from '../core/voice-live-client';
import { VoiceLiveConfig, SessionConfig, VoiceLiveEvent } from '../types';
import { BrowserAudioAdapter, BrowserConnectionAdapter } from '../adapters/browser';

export interface UseVoiceLiveOptions {
  config: VoiceLiveConfig;
  sessionConfig?: SessionConfig;
  autoConnect?: boolean;
}

export interface UseVoiceLiveReturn {
  client: VoiceLiveClient | null;
  isConnected: boolean;
  isRecording: boolean;
  isPlaybackActive: boolean;
  sessionId: string | undefined;
  error: Error | null;
  isInitializing: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
}

// Browser-specific client creation
function createBrowserClient(config: VoiceLiveConfig): VoiceLiveClient {
  return new VoiceLiveClient(
    config,
    new BrowserAudioAdapter(),
    new BrowserConnectionAdapter()
  );
}


export function useVoiceLive(options: UseVoiceLiveOptions): UseVoiceLiveReturn {
  const clientRef = useRef<VoiceLiveClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const isConnectingRef = useRef(false);

  const initializeClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;

    setIsInitializing(true);
    try {
      clientRef.current = createBrowserClient(options.config);
      return clientRef.current;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [options.config]);

  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) return;
    isConnectingRef.current = true;
    try {
      setError(null);
      const client = await initializeClient();
      if (!client) {
        throw new Error('Failed to initialize client');
      }
      await client.connect(options.sessionConfig);
    } catch (err) {
      setError(err as Error);
    } finally {
      isConnectingRef.current = false;
    }
  }, [initializeClient, options.sessionConfig, isConnected]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const client = await initializeClient();
      if (!client) {
        throw new Error('Client not initialized');
      }

      await client.startRecording();
    } catch (err) {
      setError(err as Error);
    }
  }, [initializeClient]);

  const stopRecording = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopRecording();
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.startPlayback();
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopPlayback();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    const setupClient = async (): Promise<void> => {
      if (!mounted) return;

      try {
        const client = await initializeClient();
        if (!client || !mounted) return;

        const handleConnected = () => mounted && setIsConnected(true);
        const handleDisconnected = () => mounted && setIsConnected(false);
        const handleRecordingStarted = () => mounted && setIsRecording(true);
        const handleRecordingStopped = () => mounted && setIsRecording(false);
        const handlePlaybackStarted = () => mounted && setIsPlaybackActive(true);
        const handlePlaybackStopped = () => mounted && setIsPlaybackActive(false);
        const handleSessionCreated = (event: any) => mounted && setSessionId(event.session.id);
        const handleError = (err: Error) => mounted && setError(err);

        client.on('connected', handleConnected);
        client.on('disconnected', handleDisconnected);
        client.on('recordingStarted', handleRecordingStarted);
        client.on('recordingStopped', handleRecordingStopped);
        client.on('playbackStarted', handlePlaybackStarted);
        client.on('playbackStopped', handlePlaybackStopped);
        client.on('sessionCreated', handleSessionCreated);
        client.on('error', handleError);

        cleanup = () => {
          if (client) {
            client.off('connected', handleConnected);
            client.off('disconnected', handleDisconnected);
            client.off('recordingStarted', handleRecordingStarted);
            client.off('recordingStopped', handleRecordingStopped);
            client.off('playbackStarted', handlePlaybackStarted);
            client.off('playbackStopped', handlePlaybackStopped);
            client.off('sessionCreated', handleSessionCreated);
            client.off('error', handleError);
            
            client.disconnect();
          }
        };
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    setupClient();

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup();
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [options.config, connect, initializeClient]);

  return {
    client: clientRef.current,
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
    stopPlayback,
  };
}

export function useVoiceLiveEvents(
  client: VoiceLiveClient | null,
  eventHandler: (event: VoiceLiveEvent) => void
): void {
  useEffect(() => {
    if (!client) return;

    const safeEventHandler = (event: VoiceLiveEvent) => {
      try {
        eventHandler(event);
      } catch (error) {
        console.error('Error in voice live event handler:', error);
      }
    };

    client.on('event', safeEventHandler);
    return () => {
      client.off('event', safeEventHandler);
    };
  }, [client, eventHandler]);
}

export function useVoiceLiveClient(config: VoiceLiveConfig): {
  client: VoiceLiveClient | null;
  createClient: () => VoiceLiveClient;
  error: Error | null;
} {
  const [client, setClient] = useState<VoiceLiveClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const createClientInstance = useCallback(() => {
    try {
      setError(null);
      const newClient = createBrowserClient(config);
      setClient(newClient);
      return newClient;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [config]);

  return {
    client,
    createClient: createClientInstance,
    error
  };
}