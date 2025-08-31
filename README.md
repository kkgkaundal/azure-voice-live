# Azure Voice Live SDK

A universal TypeScript SDK for Azure Voice Live API that works seamlessly across Node.js, browsers, and JavaScript frameworks like React and Next.js.

![NPM Version](https://img.shields.io/npm/v/azure-voice-live)
![License](https://img.shields.io/npm/l/azure-voice-live)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

## Features

- 🌐 **Universal**: Works in Node.js, browsers, and frameworks
- 🎯 **TypeScript First**: Full type safety and IntelliSense
- ⚡ **Real-time**: Bi-directional audio streaming
- 🎙️ **Audio Processing**: Built-in recording and playback
- ⚛️ **React Hooks**: Ready-to-use React integration
- 📱 **Framework Ready**: Next.js, React, and more
- 🔐 **Secure**: Support for API keys and tokens

## Installation

```bash
npm install azure-voice-live
```

## Quick Start

### Basic Usage (Browser)

```typescript
import { createClient } from 'azure-voice-live/browser';

const client = createClient({
  endpoint: 'https://your-endpoint.openai.azure.com/',
  apiKey: 'your-api-key',
  model: 'gpt-4o-mini-realtime-preview'
});

// Connect and configure session
await client.connect({
  instructions: 'You are a helpful AI assistant.',
  voice: {
    name: "en-US-Ava:DragonHDLatestNeural",
    type: "azure-standard",
    temperature: 0.8
  }
});

// Start conversation
await client.startRecording();
client.startPlayback();
```

### Node.js Usage

```typescript
import { createClient } from 'azure-voice-live/node';

const client = createClient({
  endpoint: 'https://your-endpoint.openai.azure.com/',
  apiKey: 'your-api-key',
  model: 'gpt-4o-mini-realtime-preview'
});

// Setup event listeners
client.on('connected', () => console.log('Connected!'));
client.on('audioReceived', (event) => console.log('Audio received'));

await client.connect();
```

## React Integration

### Using React Hooks

```tsx
import { useVoiceLive } from 'azure-voice-live/browser';

function VoiceChat() {
  const {
    isConnected,
    isRecording,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    error
  } = useVoiceLive({
    config: {
      endpoint: 'https://your-endpoint.openai.azure.com/',
      apiKey: 'your-api-key',
      model: 'gpt-4o-mini-realtime-preview'
    },
    sessionConfig: {
      instructions: 'You are a helpful assistant.',
      voice: {
        name: "en-US-Ava:DragonHDLatestNeural",
        type: "azure-standard"
      }
    },
    autoConnect: false
  });

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect</button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}
      
      {isConnected && (
        <button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? 'Stop' : 'Start'} Recording
        </button>
      )}
      
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Using React Components

```tsx
import { VoiceLiveProvider, VoiceLiveControls } from 'azure-voice-live/browser';

function App() {
  const config = {
    endpoint: 'https://your-endpoint.openai.azure.com/',
    apiKey: 'your-api-key',
    model: 'gpt-4o-mini-realtime-preview'
  };

  return (
    <VoiceLiveProvider config={config}>
      {(voiceLive) => (
        <div>
          <h1>Voice Assistant</h1>
          <VoiceLiveControls voiceLive={voiceLive} />
        </div>
      )}
    </VoiceLiveProvider>
  );
}
```

## Next.js Integration

### 1. Installation and Setup

```bash
npm install azure-voice-live-sdk
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_AZURE_ENDPOINT=https://your-endpoint.openai.azure.com/
NEXT_PUBLIC_AZURE_API_KEY=your-azure-api-key
NEXT_PUBLIC_AZURE_MODEL=gpt-4o-mini-realtime-preview
```

### 3. Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        buffer: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 4. Voice Live Component

Create `components/VoiceLiveDemo.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const VoiceLiveComponent = dynamic(() => import('./VoiceLiveComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function VoiceLiveDemo() {
  return <VoiceLiveComponent />;
}
```

Create `components/VoiceLiveComponent.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import type { VoiceLiveClient } from 'azure-voice-live-sdk';

export default function VoiceLiveComponent() {
  const [client, setClient] = useState<VoiceLiveClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initClient = async () => {
      const { createClient } = await import('azure-voice-live/browser');
      
      const voiceClient = createClient({
        endpoint: process.env.NEXT_PUBLIC_AZURE_ENDPOINT!,
        apiKey: process.env.NEXT_PUBLIC_AZURE_API_KEY!,
        model: process.env.NEXT_PUBLIC_AZURE_MODEL!
      });

      voiceClient.on('connected', () => setIsConnected(true));
      voiceClient.on('disconnected', () => setIsConnected(false));
      
      setClient(voiceClient);
    };

    initClient();
  }, []);

  const handleConnect = async () => {
    if (!client) return;
    
    await client.connect({
      instructions: 'You are a helpful AI assistant.',
      voice: {
        name: "en-US-Ava:DragonHDLatestNeural",
        type: "azure-standard"
      }
    });
  };

  return (
    <div>
      <button onClick={handleConnect} disabled={!client || isConnected}>
        {isConnected ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
}
```

### 5. Using in Pages

```tsx
// pages/voice-chat.tsx
import VoiceLiveDemo from '../components/VoiceLiveDemo';

export default function VoiceChatPage() {
  return (
    <div>
      <h1>Voice Chat</h1>
      <VoiceLiveDemo />
    </div>
  );
}
```

## API Reference

### VoiceLiveConfig

```typescript
interface VoiceLiveConfig {
  endpoint: string;           // Azure endpoint URL
  apiKey?: string;           // API key for authentication
  token?: string;            // Bearer token for authentication
  model: string;             // Model name (e.g., 'gpt-4o-mini-realtime-preview')
  apiVersion?: string;       // API version (default: '2025-05-01-preview')
}
```

### SessionConfig

```typescript
interface SessionConfig {
  instructions?: string;     // System instructions for the AI
  voice?: {
    name: string;           // Voice name (e.g., 'en-US-Ava:DragonHDLatestNeural')
    type: string;           // Voice type (e.g., 'azure-standard')
    temperature?: number;   // Response creativity (0.0-1.0)
  };
  audioSettings?: {
    sampleRate?: number;    // Audio sample rate (default: 24000)
    channels?: number;      // Audio channels (default: 1)
    noiseReduction?: boolean;
    echoCancellation?: boolean;
  };
}
```

### VoiceLiveClient Methods

```typescript
class VoiceLiveClient {
  // Connection
  connect(sessionConfig?: SessionConfig): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // Audio
  startRecording(): Promise<void>;
  stopRecording(): void;
  startPlayback(): void;
  stopPlayback(): void;

  // Events
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;
}
```

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Client connected to Azure | - |
| `disconnected` | Client disconnected | - |
| `sessionCreated` | Session established | `{ session: { id: string } }` |
| `recordingStarted` | Audio recording started | - |
| `recordingStopped` | Audio recording stopped | - |
| `playbackStarted` | Audio playback started | - |
| `playbackStopped` | Audio playback stopped | - |
| `speechStarted` | Speech detection started | - |
| `speechStopped` | Speech detection stopped | - |
| `audioReceived` | Audio response received | `{ delta: string }` |
| `error` | Error occurred | `Error` |

## Examples

### Basic HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Azure Voice Live</title>
</head>
<body>
  <button id="connect">Connect</button>
  <button id="record" disabled>Start Recording</button>
  
  <script src="https://unpkg.com/azure-voice-live-sdk/dist/browser/index.js"></script>
  <script>
    const client = AzureVoiceLive.createClient({
      endpoint: 'https://your-endpoint.openai.azure.com/',
      apiKey: 'your-api-key',
      model: 'gpt-4o-mini-realtime-preview'
    });

    document.getElementById('connect').onclick = async () => {
      await client.connect({
        instructions: 'You are a helpful assistant.',
        voice: { name: "en-US-Ava:DragonHDLatestNeural", type: "azure-standard" }
      });
      document.getElementById('record').disabled = false;
    };

    document.getElementById('record').onclick = async () => {
      await client.startRecording();
      client.startPlayback();
    };
  </script>
</body>
</html>
```

### Advanced React Hook Usage

```tsx
import { useVoiceLive, useVoiceLiveEvents } from 'azure-voice-live/browser';

function AdvancedVoiceChat() {
  const voiceLive = useVoiceLive({
    config: { /* ... */ },
    sessionConfig: { /* ... */ },
    autoConnect: true
  });

  // Listen to all events
  useVoiceLiveEvents(voiceLive.client, (event) => {
    console.log('Voice Live Event:', event);
  });

  return (
    <div>
      <h2>Status: {voiceLive.isConnected ? 'Connected' : 'Disconnected'}</h2>
      {voiceLive.error && <div>Error: {voiceLive.error.message}</div>}
      
      <div>
        <button onClick={voiceLive.connect} disabled={voiceLive.isConnected}>
          Connect
        </button>
        <button onClick={voiceLive.startRecording} disabled={!voiceLive.isConnected}>
          Start Recording
        </button>
      </div>
    </div>
  );
}
```

## Platform Support

| Platform | Status | Import Path |
|----------|--------|-------------|
| Browser | ✅ | `azure-voice-live-sdk/browser` |
| Node.js | ✅ | `azure-voice-live-sdk/node` |
| React | ✅ | `azure-voice-live-sdk/browser` |
| Next.js | ✅ | `azure-voice-live-sdk/browser` |
| React Native | 🚧 | Coming soon |

## Troubleshooting

### Common Issues

**1. "Module not found" in Next.js**
- Add webpack fallbacks in `next.config.js`
- Use dynamic imports for client-side only code

**2. SSR errors**
- Use `dynamic` imports with `ssr: false`
- Check for `window` availability before initialization

**3. Audio permissions**
- Ensure HTTPS in production
- Handle microphone permission requests

**4. TypeScript errors**
- Install `@types/node` for Node.js projects
- Use proper import paths for your platform

### Browser Requirements

- Modern browsers with WebRTC support
- HTTPS for microphone access
- Web Audio API support

### Node.js Requirements

- Node.js 18+
- Optional: `mic` and `speaker` packages for audio I/O

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/k-kaundal/azure-voice-live-sdk)
- 🐛 [Issues](https://github.com/k-kaundal/azure-voice-live-sdk/issues)
- 💬 [Discussions](https://github.com/k-kaundal/azure-voice-live-sdk/discussions)

---

Made with ❤️ by [k-kaundal](https://github.com/k-kaundal)