/**
 * Represents a chat message
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  type: 'text' | 'audio';
  content: string; // Text or base64 audio
  timestamp: string;
  duration?: number; // Audio duration in seconds (if applicable)
}
