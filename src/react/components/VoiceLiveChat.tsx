import React, { useState, useEffect } from 'react';
import { VoiceChat } from './VoiceChat';
import { ChatMessages } from './ChatMessages';
import { VoiceRecorder } from './VoiceRecorder';
import { SessionManager } from './SessionManager';
import { ChatHistory } from './ChatHistory';
import { VoiceHistory } from './VoiceHistory';
import '../styles/tailwind.css';

export interface VoiceLiveChatProps {
  apiKey: string;
  userId: string;
  hostId?: string;
}

export const VoiceLiveChat: React.FC<VoiceLiveChatProps> = ({ apiKey, userId, hostId }) => {
  // Session, chat, and audio state management
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [voiceHistory, setVoiceHistory] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Authenticate and initialize session here
    if (apiKey && userId) {
      // Simulate session creation
      setSession({ apiKey, userId, hostId });
      setIsAuthenticated(true);
    }
  }, [apiKey, userId, hostId]);

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-full">Authenticating...</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4">
      <SessionManager session={session} />
      <ChatMessages messages={messages} setMessages={setMessages} userId={userId} />
      <VoiceChat voiceHistory={voiceHistory} setVoiceHistory={setVoiceHistory} />
      <VoiceRecorder session={session} onVoiceSent={(voice: any) => setVoiceHistory([...voiceHistory, voice])} />
      <div className="flex gap-4">
        <ChatHistory messages={messages} />
        <VoiceHistory voiceHistory={voiceHistory} />
      </div>
    </div>
  );
};
