import React from 'react';

export const ChatMessages = ({ messages, setMessages, userId }: any) => {
  return (
    <div className="flex-1 overflow-y-auto p-2 bg-gray-50 rounded shadow-inner max-h-64">
      {messages.length === 0 ? (
        <div className="text-gray-400 text-center">No messages yet.</div>
      ) : (
        messages.map((msg: any, idx: number) => (
          <div key={idx} className={`mb-2 flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.userId === userId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <div className="text-xs font-semibold mb-1">{msg.userId}</div>
              <div>{msg.text}</div>
              <div className="text-xs text-gray-400 mt-1 text-right">{msg.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
