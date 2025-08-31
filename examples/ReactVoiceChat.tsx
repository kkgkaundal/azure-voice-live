// Minimal React/Next.js usage example for azure-voice-live
import React from 'react';
import { VoiceChat } from '../src/react';

export default function ExampleVoiceChat() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Azure Voice Live - React Example</h2>
      <VoiceChat
        config={{
          endpoint: "https://your-endpoint.azure.com/",
          apiKey: "YOUR_API_KEY",
          model: "gpt-4o-mini-realtime-preview"
        }}
      />
    </div>
  );
}
