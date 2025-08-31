import React from 'react';

export const VoiceHistory = ({ voiceHistory }: any) => (
  <div className="w-1/2 bg-white rounded shadow p-2 max-h-40 overflow-y-auto">
    <div className="font-bold text-indigo-700 mb-2">Voice History</div>
    {voiceHistory.length === 0 ? (
      <div className="text-gray-400 text-center">No voice history.</div>
    ) : (
      voiceHistory.map((voice: any, idx: number) => (
        <div key={idx} className="mb-1 text-xs text-gray-600 flex items-center gap-2">
          <audio controls src={voice.url} className="w-24" />
          <span className="font-semibold">{voice.userId}</span>
        </div>
      ))
    )}
  </div>
);
