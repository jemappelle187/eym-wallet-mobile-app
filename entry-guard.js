#!/usr/bin/env node

/**
 * Entry Point Guard for SendNReceive App
 * 
 * This script ensures the correct entry point configuration for Expo Router.
 * Run this if you encounter "App entry not found" errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking entry point configuration...');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Are you in the correct directory?');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check main entry point
if (packageJson.main !== 'index.js') {
  console.log('⚠️  package.json main is not "index.js"');
  packageJson.main = 'index.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fixed package.json main -> index.js');
} else {
  console.log('✅ package.json main is correct');
}

// Check index.js content
const indexJsPath = path.join(process.cwd(), 'index.js');
if (!fs.existsSync(indexJsPath)) {
  console.log('⚠️  index.js not found, creating...');
  fs.writeFileSync(indexJsPath, "import 'expo-router/entry';\n");
  console.log('✅ Created index.js with expo-router/entry');
} else {
  const indexContent = fs.readFileSync(indexJsPath, 'utf8');
  if (!indexContent.includes('expo-router/entry')) {
    console.log('⚠️  index.js does not use expo-router/entry, fixing...');
    fs.writeFileSync(indexJsPath, "import 'expo-router/entry';\n");
    console.log('✅ Fixed index.js to use expo-router/entry');
  } else {
    console.log('✅ index.js is correct');
  }
}

// Check if app/ directory exists (Expo Router requirement)
const appDirPath = path.join(process.cwd(), 'app');
if (!fs.existsSync(appDirPath)) {
  console.log('⚠️  app/ directory not found. This app may not be using Expo Router.');
} else {
  console.log('✅ app/ directory found (Expo Router setup)');
}

console.log('\n🎉 Entry point configuration is correct!');
console.log('📱 If you still see "App entry not found":');
console.log('   1. Clear Metro cache: npx expo start --clear');
console.log('   2. Rebuild: npx expo run:ios --device "iPhone 16 Pro"');
console.log('   3. Check Metro logs for any JavaScript errors');








