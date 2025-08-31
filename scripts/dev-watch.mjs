import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Azure Voice Live Development Mode...');
console.log('👋 Hello k-kaundal! Development environment starting at', new Date().toISOString());

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, prefix, message) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${prefix}${colors.reset} ${message}`);
};

// Build functions
const buildFunctions = {
  async types() {
    log(colors.blue, '🔧 TYPES', 'Building TypeScript declarations...');
    execSync('npx tsc --project tsconfig.types.json', { stdio: 'pipe' });
    log(colors.green, '✅ TYPES', 'TypeScript declarations built');
  },

  async react() {
    log(colors.cyan, '⚛️  REACT', 'Building React components...');
    execSync('npx tsc --project tsconfig.react.json', { stdio: 'pipe' });
    log(colors.green, '✅ REACT', 'React components built');
  },

  async css() {
    log(colors.magenta, '🎨 CSS', 'Building Tailwind CSS...');
    try {
      execSync('npx tailwindcss -i src/react/styles/tailwind.css -o dist/css/azure-voice-live.dev.css', { stdio: 'pipe' });
      log(colors.green, '✅ CSS', 'CSS built successfully');
    } catch (error) {
      log(colors.yellow, '⚠️  CSS', 'Tailwind not found, using basic CSS');
      // Create basic CSS as fallback
      const basicCSS = `/* Azure Voice Live - Development Build */
.voice-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; }
.voice-btn-primary { background: #2563eb; color: white; }
.voice-card { background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; }
.voice-indicator { width: 0.75rem; height: 0.75rem; border-radius: 50%; }
.voice-indicator-connected { background: #4ade80; }
.voice-indicator-recording { background: #f87171; animation: pulse 1s infinite; }
.voice-indicator-inactive { background: #d1d5db; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`;
      
      fs.mkdirSync('dist/css', { recursive: true });
      fs.writeFileSync('dist/css/azure-voice-live.dev.css', basicCSS);
    }
  },

  async all() {
    await Promise.all([
      this.types(),
      this.react(),
      this.css()
    ]);
  }
};

// Initial build
log(colors.yellow, '🏗️  BUILD', 'Running initial build...');
try {
  await buildFunctions.all();
  log(colors.green, '🎉 READY', 'Initial build completed! Watching for changes...');
} catch (error) {
  log(colors.red, '❌ ERROR', `Initial build failed: ${error.message}`);
}

// File watchers
const watchers = {
  // TypeScript source files
  src: chokidar.watch(['src/**/*.ts', 'src/**/*.tsx'], {
    ignored: ['src/**/*.test.*', 'src/**/*.spec.*'],
    ignoreInitial: true
  }),

  // CSS files
  css: chokidar.watch(['src/react/styles/**/*.css'], {
    ignoreInitial: true
  }),

  // React components
  react: chokidar.watch(['src/react/**/*.{ts,tsx}'], {
    ignoreInitial: true
  })
};

// Watch handlers
watchers.src.on('change', async (filePath) => {
  log(colors.blue, '📝 CHANGE', `${path.basename(filePath)} modified`);
  try {
    if (filePath.includes('/react/')) {
      await buildFunctions.react();
    }
    await buildFunctions.types();
    log(colors.green, '✅ REBUILT', `Changes applied for ${path.basename(filePath)}`);
  } catch (error) {
    log(colors.red, '❌ ERROR', `Build failed: ${error.message}`);
  }
});

watchers.css.on('change', async (filePath) => {
  log(colors.magenta, '🎨 CSS', `${path.basename(filePath)} modified`);
  try {
    await buildFunctions.css();
    log(colors.green, '✅ CSS', 'Styles updated');
  } catch (error) {
    log(colors.red, '❌ CSS', `CSS build failed: ${error.message}`);
  }
});

watchers.react.on('change', async (filePath) => {
  log(colors.cyan, '⚛️  REACT', `${path.basename(filePath)} modified`);
  try {
    await buildFunctions.react();
    log(colors.green, '✅ REACT', 'React components updated');
  } catch (error) {
    log(colors.red, '❌ REACT', `React build failed: ${error.message}`);
  }
});

// File addition/deletion handlers
['add', 'unlink'].forEach(event => {
  watchers.src.on(event, (filePath) => {
    log(colors.yellow, '📁 FILE', `${event}: ${path.basename(filePath)}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  log(colors.yellow, '👋 BYE', 'Shutting down development server...');
  Object.values(watchers).forEach(watcher => watcher.close());
  process.exit(0);
});

// Keep the script running
console.log('\n' + colors.green + '🔥 Development server is running!' + colors.reset);
console.log(colors.cyan + '📝 Edit files in src/ to see live updates' + colors.reset);
console.log(colors.yellow + '⏹️  Press Ctrl+C to stop' + colors.reset + '\n');