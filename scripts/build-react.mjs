import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building React components...');

// Clean React dist directory
const reactDistDir = path.join(__dirname, '../dist/react');
if (fs.existsSync(reactDistDir)) {
  fs.rmSync(reactDistDir, { recursive: true, force: true });
}

try {
  // Build React components
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.react.json', { stdio: 'inherit' });
  
  // Create package.json for React export
  const reactPackageJson = {
    "name": "azure-voice-live-react",
    "main": "./react/react.js",
    "module": "./react/react.js", 
    "types": "./react/react.d.ts",
    "sideEffects": false
  };
  
  fs.writeFileSync(
    path.join(reactDistDir, 'package.json'),
    JSON.stringify(reactPackageJson, null, 2)
  );
  
  console.log('✅ React build completed successfully!');
  console.log('📦 Components available at: dist/react/');
  console.log('📥 Import with: import { VoiceChat } from "azure-voice-live/react"');
  
  // List generated files for verification
  console.log('\n📁 Generated files:');
  const listFiles = (dir, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${file}/`);
        listFiles(filePath, prefix + '  ');
      } else {
        console.log(`${prefix}📄 ${file}`);
      }
    });
  };
  listFiles(reactDistDir);
  
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}