"use client";

import React, { useState, useEffect, useRef } from "react";
import createClient, { VoiceLiveClient } from "../../browser";
import { VoiceControls } from "./VoiceControls";
import { ChatInput } from "./ChatInput";
import "./VoiceLiveChat.css";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
}

// Props for the VoiceLiveChat component
export interface VoiceLiveChatProps {
  apiKey: string;
  endpoint: string;
  model: string;
  userId: string;
  hostId?: string;
  /**
   * Custom value for coneds (any type, passed from parent)
   */
  coneds?: any;
}

/**
 * VoiceLiveChat: Modern chat UI with Azure AI integration.
 * Handles all connection, chat, and voice logic internally.
 * Accepts a `coneds` prop for custom value passing.
 */
export const VoiceLiveChat: React.FC<VoiceLiveChatProps> = ({
  apiKey,
  endpoint,
  model,
  coneds,
  ...props
}) => {
  const [status, setStatus] = useState("Ready to connect");
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const clientRef = useRef<VoiceLiveClient | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const client = createClient({
      endpoint,
      apiKey,
      model,
      apiVersion: "2025-05-01-preview",
    });

    clientRef.current = client;

    client.on("connected", () => {
      setIsConnected(true);
      setIsInitializing(false);
      setStatus("Connected to Azure Voice Live");
    });

    client.on("disconnected", () => {
      setIsConnected(false);
      setStatus("Disconnected");
    });

    client.on("recordingStarted", () => {
      setIsRecording(true);
      setStatus("🎤 Listening...");
    });

    client.on("recordingStopped", () => {
      setIsRecording(false);
      setStatus("Recording stopped");
    });

    client.on("playbackStarted", () => {
      setIsPlaybackActive(true);
      setStatus("🔊 Playback started");
    });

    client.on("playbackStopped", () => {
      setIsPlaybackActive(false);
      setStatus("Playback stopped");
    });

    client.on("sessionCreated", (evt: any) => {
      setSessionId(evt.session.id);
    });

    client.on("event", (evt: any) => {
      if (evt.output?.text) {
        addMessage("agent", evt.output.text);
      }
    });

    client.on("error", (err: Error) => {
      setError(err);
      setStatus("Error occurred");
    });

    return () => {
      client.disconnect();
    };
  }, [endpoint, apiKey, model]);

  // --- Helpers ---
  const addMessage = (role: "user" | "agent", text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // --- Handlers ---
  const handleConnect = async () => {
    if (!clientRef.current) return;
    setIsInitializing(true);
    try {
      await clientRef.current.connect({
        instructions:
          "You are Ava, a friendly AI English teacher. Keep answers simple and fun!",
        voice: {
          name: "en-US-Ava:DragonHDLatestNeural",
          type: "azure-standard",
          temperature: 0.8,
        },
      });
    } catch (err) {
      setError(err as Error);
      setIsInitializing(false);
    }
  };

  const handleDisconnect = () => clientRef.current?.disconnect();

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage("user", input);
    clientRef.current?.emit("userMessage", { text: input });
    setInput("");
  };

  const handleToggleRecording = () => {
    if (!clientRef.current) return;
    if (isRecording) clientRef.current.stopRecording();
    else clientRef.current.startRecording();
  };

  const handleTogglePlayback = () => {
    if (!clientRef.current) return;
    if (isPlaybackActive) clientRef.current.stopPlayback();
    else clientRef.current.startPlayback();
  };

  // --- UI ---
  return (
    <div className="chat-container" {...props}>
      {/* Header */}
      <div className="chat-header">
        <h2>🧑‍🏫 Ava - English Teacher</h2>
        <div className="status">{status}</div>
      </div>

      {/* Chat History */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.role === "user" ? "user" : "agent"}`}
          >
            <div className="chat-meta">
              <span className="role">
                {msg.role === "user" ? "You" : "Ava"}
              </span>
              <span className="time">{msg.timestamp}</span>
            </div>
            <div className="chat-text">{msg.text}</div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Controls */}
      <div className="chat-controls">
        <button
          className="btn connect"
          onClick={handleConnect}
          disabled={isConnected || isInitializing}
        >
          Connect
        </button>
        <button
          className="btn disconnect"
          onClick={handleDisconnect}
          disabled={!isConnected}
        >
          Disconnect
        </button>
      </div>

      {/* Input + Voice */}
      <div className="chat-input-row flex gap-2 items-center">
        <ChatInput input={input} setInput={setInput} onSend={handleSend} />
        <VoiceControls
          isRecording={isRecording}
          isPlaybackActive={isPlaybackActive}
          onToggleRecording={handleToggleRecording}
          onTogglePlayback={handleTogglePlayback}
        />
      </div>

      {/* Error + Session Info */}
      {error && <div className="error-text">{error.message}</div>}
      {sessionId && <div className="session-info">Session ID: {sessionId}</div>}

      {/* Example usage of coneds prop (for debugging/demo) */}
      {coneds !== undefined && (
        <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: 8 }}>
          <strong>coneds:</strong> {JSON.stringify(coneds)}
        </div>
      )}
    </div>
  );
};
