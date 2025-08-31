import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AzureVoiceLive',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [
        'microsoft-cognitiveservices-speech-sdk',
        'isomorphic-ws',
        'events',
      ],
      output: {
        globals: {
          'microsoft-cognitiveservices-speech-sdk': 'SpeechSDK',
          'isomorphic-ws': 'WebSocket',
          events: 'EventEmitter',
        },
      },
    },
  },
});
