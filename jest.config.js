module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^microsoft-cognitiveservices-speech-sdk$':
      '<rootDir>/node_modules/microsoft-cognitiveservices-speech-sdk/distrib/lib/microsoft.cognitiveservices.speech.sdk.js',
  },
};
