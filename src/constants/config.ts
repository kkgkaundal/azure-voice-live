import { SessionConfig } from '../interfaces/types';

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  instructions: 'You are a helpful AI assistant',
  voice: {
    name: 'en-US-Ava:DragonHDLatestNeural',
    type: 'azure-standard',
  },
};
