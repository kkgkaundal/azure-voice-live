// Minimal Node.js usage example for azure-voice-live
const { default: createClient } = require('../dist/node');

const client = createClient({
  endpoint: 'https://your-endpoint.azure.com/',
  apiKey: 'YOUR_API_KEY',
  model: 'gpt-4o-mini-realtime-preview',
});

client.on('connected', () => {
  console.log('Connected to Azure Voice Live!');
  // You can now send/receive messages, audio, etc.
});

client.connect();
