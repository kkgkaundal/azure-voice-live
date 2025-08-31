const { createClient } = require('azure-voice-live-sdk');
require('dotenv').config();

async function main() {
  const client = createClient({
    endpoint: process.env.AZURE_VOICE_LIVE_ENDPOINT,
    apiKey: process.env.AZURE_VOICE_LIVE_API_KEY,
    model: process.env.AZURE_VOICE_LIVE_MODEL
  });

  // Event listeners
  client.on('connected', () => {
    console.log('✅ Connected to Azure Voice Live');
  });

  client.on('sessionCreated', (event) => {
    console.log('🎯 Session created:', event.session.id);
  });

  client.on('speechStarted', () => {
    console.log('🎤 Speech started');
  });

  client.on('speechStopped', () => {
    console.log('🔇 Speech stopped');
  });

  client.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  try {
    // Connect and configure session
    await client.connect({
      instructions: 'You are a helpful AI assistant. Respond naturally and conversationally.',
      voice: {
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: 0.8
      }
    });

    // Start recording and playback
    await client.startRecording();
    client.startPlayback();

    console.log('🎙️ Voice chat started! Speak into your microphone.');
    console.log('Press Ctrl+C to quit');

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down...');
      client.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start voice chat:', error);
    process.exit(1);
  }
}

main();