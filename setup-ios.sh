#!/bin/bash

# iOS Development Environment Setup Script for SendNReceive App
# This script automates the complete iOS development setup

set -e  # Exit on any error

echo "🚀 Setting up iOS Development Environment for SendNReceive App"
echo "=============================================================="

# 1) Navigate to the correct app directory
cd "/Users/emmanuelyeboah/Library/CloudStorage/OneDrive-Persoonlijk/Bureaublad/eym-wallet-website-feat-comprehensive-redesign-mvp/sendnreceive-app" || exit 1
echo "✅ Working directory: $(pwd)"

# 2) Kill stale Metro / Simulator processes
echo "🧹 Cleaning up stale processes..."
lsof -ti :8081 | xargs -I {} kill -9 {} 2>/dev/null || true
killall Simulator 2>/dev/null || true
echo "✅ Cleaned up stale processes"

# 3) Clear caches (Watchman + Metro + haste maps)
echo "🗑️  Clearing caches..."
watchman watch-del-all 2>/dev/null || true
rm -rf "$TMPDIR"/metro-* "$TMPDIR"/haste-map-* 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
echo "✅ Caches cleared"

# 4) Install/update dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed"

# 5) Install iOS pods
echo "🍎 Installing iOS pods..."
cd ios
pod install
cd ..
echo "✅ iOS pods installed"

# 6) Start Metro bundler with API base (in background)
echo "🌐 Starting Metro bundler..."
EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear &
METRO_PID=$!
echo "✅ Metro started with PID: $METRO_PID"

# 7) Wait a moment for Metro to start
echo "⏳ Waiting for Metro to initialize..."
sleep 5

# 8) Build and run iOS app
echo "📱 Building and running iOS app..."
npx expo run:ios --device "iPhone 16 Pro"

echo ""
echo "🎉 iOS Development Environment Setup Complete!"
echo "=============================================="
echo "✅ Metro bundler is running in the background"
echo "✅ iOS app is built and installed on simulator"
echo "✅ API base configured: http://192.168.178.174:4000"
echo ""
echo "📱 Next steps:"
echo "   1. Open iOS Simulator"
echo "   2. Tap the SendNReceive app icon"
echo "   3. The app should load successfully"
echo ""
echo "🔄 To restart Metro: kill $METRO_PID && EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear"
echo "🛑 To stop Metro: kill $METRO_PID"








