# iOS Development Guide for SendNReceive App

## 🎯 Quick Start

### Automated Setup (Recommended)
```bash
./setup-ios.sh
```

### Manual Setup
```bash
# 1. Navigate to app directory
cd "/Users/emmanuelyeboah/Library/CloudStorage/OneDrive-Persoonlijk/Bureaublad/eym-wallet-website-feat-comprehensive-redesign-mvp/sendnreceive-app"

# 2. Start Metro with API base
EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear

# 3. In another terminal, build and run iOS app
npx expo run:ios --device "iPhone 16 Pro"
```

## 🔧 Configuration Files

### Key Files Created/Modified:
- ✅ `babel.config.js` - Reanimated plugin configuration
- ✅ `index.js` - Proper import order for gesture-handler and reanimated
- ✅ `ios/Podfile` - DEFINES_MODULE conflict fixes
- ✅ `setup-ios.sh` - Automated setup script

### API Configuration:
- **API Base**: `http://192.168.178.174:4000`
- **Metro Port**: `8081`
- **Bundle ID**: `com.jemappelle187.sendnreceiveapp`

## 🚨 Troubleshooting

### Common Issues:

1. **Metro starts from wrong directory**
   ```bash
   # Kill Metro and restart from correct directory
   lsof -ti :8081 | xargs kill -9
   cd sendnreceive-app
   EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear
   ```

2. **Hermes runtime errors**
   ```bash
   # Clear all caches and rebuild
   watchman watch-del-all
   rm -rf $TMPDIR/metro-* .expo
   npx expo run:ios --device "iPhone 16 Pro"
   ```

3. **DEFINES_MODULE conflicts**
   ```bash
   # Reinstall pods (already fixed in Podfile)
   cd ios && pod install && cd ..
   ```

4. **React Native version mismatch**
   ```bash
   # Force correct versions
   npx expo install react-native@0.79.5 react@18.2.0
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

## 📱 Development Workflow

### Daily Development:
1. **Start Metro**: `EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear`
2. **Open Simulator**: Tap SendNReceive app icon
3. **Make changes**: Code changes will hot reload automatically
4. **Test features**: Stripe, Plaid, bank transfers, etc.

### Rebuilding Native Code:
```bash
# When adding new native dependencies
cd ios && pod install && cd ..
npx expo run:ios --device "iPhone 16 Pro"
```

## 🎯 Current Status

- ✅ **Metro Bundler**: Running on port 8081
- ✅ **iOS App**: Built and installed on iPhone 16 Pro simulator
- ✅ **Native Dependencies**: All properly linked (Stripe, Reanimated, Plaid, etc.)
- ✅ **API Configuration**: Backend connected to `http://192.168.178.174:4000`
- ✅ **Hermes Error**: Fixed with proper Babel and import configuration

## 🔄 Background Processes

- **Metro PID**: Check with `ps aux | grep expo`
- **Stop Metro**: `kill <PID>` or `lsof -ti :8081 | xargs kill -9`
- **Restart Metro**: `EXPO_PUBLIC_API_BASE=http://192.168.178.174:4000 npx expo start --clear`

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Run `./setup-ios.sh` to reset everything
3. Verify you're in the correct directory (`sendnreceive-app/`)
4. Ensure Metro is running from the app directory, not the monorepo root

