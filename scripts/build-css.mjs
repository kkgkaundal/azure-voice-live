import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Building Tailwind CSS...');

try {
  // Ensure dist/css directory exists
  const cssDistDir = path.join(__dirname, '../dist/css');
  if (!fs.existsSync(cssDistDir)) {
    fs.mkdirSync(cssDistDir, { recursive: true });
  }

  // Check if source file exists
  const sourceFile = path.join(__dirname, '../src/react/styles/tailwind.css');
  if (!fs.existsSync(sourceFile)) {
    console.error('❌ Source file not found:', sourceFile);
    console.log('Creating basic Tailwind CSS file...');
    
    // Create basic file
    const basicCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Basic Azure Voice Live styles */
.voice-btn {
  @apply inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors;
}
.voice-btn-primary { @apply bg-blue-600 text-white hover:bg-blue-700; }
.voice-btn-success { @apply bg-green-600 text-white hover:bg-green-700; }
.voice-btn-danger { @apply bg-red-600 text-white hover:bg-red-700; }
.voice-card { @apply bg-white rounded-lg border border-gray-200 shadow-sm p-6; }
.voice-indicator { @apply w-3 h-3 rounded-full; }
.voice-indicator-connected { @apply bg-green-400; }
.voice-indicator-recording { @apply bg-red-400 animate-pulse; }
.voice-indicator-inactive { @apply bg-gray-300; }
`;
    
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
    fs.writeFileSync(sourceFile, basicCSS);
  }

  // Try different ways to run Tailwind CSS
  const commands = [
    'npx tailwindcss',
    'npx @tailwindcss/cli',
    './node_modules/.bin/tailwindcss',
    'yarn tailwindcss'
  ];

  let success = false;
  let lastError = null;

  for (const cmd of commands) {
    try {
      console.log(`Trying: ${cmd}...`);
      
      // Build minified CSS
      execSync(`${cmd} -i src/react/styles/tailwind.css -o dist/css/azure-voice-live.css --minify`, {
        stdio: 'inherit'
      });

      // Build development CSS
      execSync(`${cmd} -i src/react/styles/tailwind.css -o dist/css/azure-voice-live.dev.css`, {
        stdio: 'inherit'
      });

      success = true;
      break;
    } catch (error) {
      lastError = error;
      console.log(`❌ ${cmd} failed, trying next...`);
    }
  }

  if (!success) {
    console.log('⚠️  Tailwind CSS CLI not found. Creating basic CSS files...');
    
    // Create basic CSS files without Tailwind processing
    const basicProcessedCSS = `/* Azure Voice Live - Basic Styles */
.voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.voice-btn-primary {
  background-color: #2563eb;
  color: white;
}
.voice-btn-primary:hover {
  background-color: #1d4ed8;
}

.voice-btn-success {
  background-color: #16a34a;
  color: white;
}
.voice-btn-success:hover {
  background-color: #15803d;
}

.voice-btn-danger {
  background-color: #dc2626;
  color: white;
}
.voice-btn-danger:hover {
  background-color: #b91c1c;
}

.voice-btn-secondary {
  background-color: #4b5563;
  color: white;
}
.voice-btn-secondary:hover {
  background-color: #374151;
}

.voice-card {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.voice-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.voice-indicator-connected {
  background-color: #4ade80;
  animation: pulse 2s infinite;
}

.voice-indicator-recording {
  background-color: #f87171;
  animation: pulse 1s infinite;
}

.voice-indicator-playback {
  background-color: #60a5fa;
  animation: pulse 2s infinite;
}

.voice-indicator-inactive {
  background-color: #d1d5db;
}

.voice-theme-light {
  background-color: white;
  color: #111827;
  border-color: #e5e7eb;
}

.voice-theme-dark {
  background-color: #1f2937;
  color: white;
  border-color: #374151;
}

.voice-theme-blue {
  background-color: #dbeafe;
  color: #1e3a8a;
  border-color: #93c5fd;
}

.voice-theme-green {
  background-color: #dcfce7;
  color: #14532d;
  border-color: #86efac;
}

.voice-theme-purple {
  background-color: #f3e8ff;
  color: #581c87;
  border-color: #c084fc;
}

.voice-recording-active {
  animation: pulse 1.5s infinite;
}

.voice-wave {
  width: 0.25rem;
  background-color: #3b82f6;
  border-radius: 9999px;
  animation: voice-wave 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

@keyframes voice-wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.5);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .voice-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
  .voice-card {
    padding: 1rem;
  }
}
`;

    fs.writeFileSync(path.join(cssDistDir, 'azure-voice-live.css'), basicProcessedCSS);
    fs.writeFileSync(path.join(cssDistDir, 'azure-voice-live.dev.css'), basicProcessedCSS);
    
    console.log('✅ Basic CSS files created successfully!');
  } else {
    console.log('✅ Tailwind CSS build completed successfully!');
  }

  console.log('📄 Generated files:');
  console.log('  - dist/css/azure-voice-live.css');
  console.log('  - dist/css/azure-voice-live.dev.css');

} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  
  // Try to install Tailwind CSS
  console.log('🔧 Attempting to install Tailwind CSS...');
  try {
    execSync('npm install -D tailwindcss@latest', { stdio: 'inherit' });
    console.log('✅ Tailwind CSS installed. Please run the build again.');
  } catch (installError) {
    console.error('❌ Failed to install Tailwind CSS automatically.');
    console.log('💡 Please run: npm install -D tailwindcss@latest');
  }
  
  process.exit(1);
}