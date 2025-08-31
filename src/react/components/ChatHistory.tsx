import React from 'react';

export const ChatHistory = ({ messages }: any) => (
  <div className="w-1/2 bg-white rounded shadow p-2 max-h-40 overflow-y-auto">
    <div className="font-bold text-gray-700 mb-2">Chat History</div>
    {messages.length === 0 ? (
      <div className="text-gray-400 text-center">No chat history.</div>
    ) : (
      messages.map((msg: any, idx: number) => (
        <div key={idx} className="mb-1 text-xs text-gray-600">
          <span className="font-semibold">{msg.userId}:</span> {msg.text}
        </div>
      ))
    )}
  </div>
);
