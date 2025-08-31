'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues during development
import { VoiceChat } from '../../../src/react/components/VoiceChat';

export default function DevHomePage() {
  const [buildTime, setBuildTime] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLive, setIsLive] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mock config for development
  const config = {
    endpoint: 'https://demo.openai.azure.com/',
    apiKey: 'demo-key-for-development',
    model: 'gpt-4o-mini-realtime-preview'
  };

  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true);
    
    // Update build time and current time
    const now = new Date();
    setBuildTime(now.toLocaleString());
    setCurrentTime(now.toLocaleTimeString());
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // Simulate live connection indicator
    const liveInterval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(liveInterval);
    };
  }, []);

  // Don't render time-sensitive content until mounted
  if (!mounted) {
    return (
      <div className="dev-container">
        <div className="dev-header">
          <h1>Azure Voice Live SDK - Development</h1>
          <p>👋 Welcome k-kaundal! Loading development environment...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dev-container">
      {/* Development Status */}
      <div className={`dev-status ${isLive ? 'live-indicator' : ''}`}>
        🔴 Live Development
      </div>

      {/* Header */}
      <div className="dev-header">
        <h1>Azure Voice Live SDK - Development</h1>
        <p>👋 Welcome k-kaundal! Real-time component testing environment</p>
        <p><small>Session started: {buildTime}</small></p>
      </div>

      {/* Component Grid */}
      <div className="dev-grid">
        {/* VoiceChat Component */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">🎙️ VoiceChat Component</h3>
            <VoiceChat
              config={config}
              theme="blue"
              size="md"
              showAdvancedControls={true}
              onStateChange={(state) => {
                console.log('🔄 VoiceChat state changed:', state);
              }}
            />
          </div>
        </div>

        {/* Development Info */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">🔧 Development Info</h3>
            <div className="space-y-2 text-sm">
              <div><strong>User:</strong> k-kaundal</div>
              <div><strong>Time:</strong> <span className="font-mono">{currentTime}</span></div>
              <div><strong>Date:</strong> <span className="font-mono">{new Date().toLocaleDateString()}</span></div>
              <div><strong>Mode:</strong> Development</div>
              <div><strong>Status:</strong> <span className="voice-indicator voice-indicator-connected inline-block mr-1"></span> Live</div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Quick Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Edit files in src/ for live updates</li>
                <li>• Check console for state changes</li>
                <li>• CSS updates apply instantly</li>
                <li>• Hot reload enabled</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Theme Testing */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">🎨 Theme Testing</h3>
            {(['light', 'dark', 'blue', 'green', 'purple'] as const).map(theme => (
              <div key={theme} className={`voice-theme-${theme} p-3 mb-2 rounded border`}>
                <div className="font-medium capitalize">{theme} Theme</div>
                <div className="flex gap-2 mt-2">
                  <button className="voice-btn voice-btn-primary voice-btn-sm">Primary</button>
                  <button className="voice-btn voice-btn-success voice-btn-sm">Success</button>
                  <div className="voice-indicator voice-indicator-connected"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Updates */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">📡 Live Updates</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>File watching active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Auto-rebuild enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Hot reload ready</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
              <strong>Watching Files:</strong>
              <ul className="mt-1 space-y-1 font-mono text-[10px]">
                <li>• src/react/styles/**/*.css</li>
                <li>• src/react/components/**/*</li>
              </ul>
            </div>

            <div className="mt-3 p-3 bg-green-50 rounded text-xs">
              <strong>Dev Server Info:</strong>
              <div className="mt-1 space-y-1 font-mono text-[10px]">
                <div>Port: 3001</div>
                <div>Started: {buildTime}</div>
                <div>PID: {typeof window !== 'undefined' ? 'Client' : 'Server'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">🔧 Component Status</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>VoiceChat</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Loaded</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hooks</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>CSS</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Applied</span>
              </div>
              <div className="flex items-center justify-between">
                <span>TypeScript</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Compiled</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded text-xs">
              <strong>Build Info:</strong>
              <div className="mt-1 space-y-1">
                <div>Target: Development</div>
                <div>Source Maps: Enabled</div>
                <div>HMR: Active</div>
                <div>TypeScript: Enabled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Console */}
        <div className="voice-card">
          <div className="voice-card-body">
            <h3 className="text-lg font-bold mb-4">📊 Live Console</h3>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
              <div>[{currentTime}] 🚀 Dev server started</div>
              <div>[{currentTime}] 📦 Components loaded</div>
              <div>[{currentTime}] 🎨 CSS applied</div>
              <div>[{currentTime}] ⚡ Hot reload active</div>
              <div>[{currentTime}] 👋 Welcome k-kaundal!</div>
              <div className="text-yellow-400">[{currentTime}] 🔄 Watching for changes...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8 p-4 border-t">
        <div>Azure Voice Live SDK Development Environment</div>
        <div>Built with ❤️ for k-kaundal • {currentTime}</div>
      </div>
    </div>
  );
}