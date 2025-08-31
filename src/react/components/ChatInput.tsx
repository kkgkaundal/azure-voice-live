"use client";

import React from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
}) => {
  return (
    <div className="chat-input flex items-center gap-2 w-full">
      <input
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        className="flex-1"
      />
      <button className="btn send" onClick={onSend}>
        <Send size={18} />
      </button>
    </div>
  );
};
