export default {
  watch: {
    src: ['src/**/*.{ts,tsx,js,jsx}', 'src/**/*.css'],
    examples: ['examples/**/*.{ts,tsx,js,jsx}'],
    ignore: ['node_modules/**', 'dist/**', '.git/**'],
  },
  build: {
    targets: ['types', 'react', 'css'],
    quick: true, // Skip heavy builds during development
  },
  serve: {
    port: 3000,
    examples: {
      nextjs: 3001,
      react: 3002,
      vanilla: 3003,
    }
  }
};