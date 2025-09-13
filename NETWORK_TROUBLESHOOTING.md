# Network Troubleshooting Guide

## "Network request failed" Error Fixes

### 1. Emulator/Simulator Network Issues

**Android Emulator:**
- Can't reach `localhost` - use `http://10.0.2.2:<port>` instead
- For Genymotion: use `http://10.0.3.2:<port>`

**iOS Simulator:**
- Can use `http://localhost:<port>` directly

**Physical Device:**
- Use your machine's LAN IP (e.g., `http://192.168.1.23:<port>`)
- Ensure both device and machine are on same network
- Check firewall settings

### 2. Cleartext HTTP Issues (Android 9+ / iOS ATS)

**Android (API 28+):**
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:usesCleartextTraffic="true"
  android:networkSecurityConfig="@xml/network_security_config" ...>
</application>
```

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">your-dev-host</domain>
  </domain-config>
</network-security-config>
```

**iOS (Info.plist):**
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key><true/>
</dict>
```

### 3. Android Permissions
Ensure in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

### 4. Quick Diagnostic Commands

**Test from your dev machine:**
```bash
# Test if your API endpoint is reachable
curl -v https://your-api-endpoint.com/health

# Test local development server
curl -v http://localhost:3000/health
```

**In the app, check console logs for:**
- `✅ HTTPS connectivity OK` - Confirms basic HTTPS works (using fetch test)
- `➡️ About to call MTN API:` - Shows exact URL being called
- `💥 Transport error:` - Shows network-level failures

### 5. Common Solutions by Platform

**If using local development server:**
- Android Emulator: Change `localhost` to `10.0.2.2`
- iOS Simulator: Keep `localhost`
- Physical Device: Use LAN IP

**If using HTTPS endpoint:**
- Check TLS certificate chain
- Verify device date/time is correct
- Test with curl first

**If using HTTP endpoint:**
- Enable cleartext traffic (see above)
- Add network security config
- Consider using HTTPS instead

### 6. MTN API Specific Issues

**Sandbox vs Production:**
- Ensure you're using the correct base URL
- Check if IP whitelisting is required
- Verify API keys and authentication

**Regional Restrictions:**
- Some MTN endpoints are region-specific
- Check if you need to use a different endpoint for your region

### 7. Debug Steps

1. **Check connectivity:** Look for `✅ HTTPS connectivity OK` logs
2. **Test HTTPS:** Look for `✅ HTTPS connectivity OK`
3. **Check URL:** Look for `➡️ About to call MTN API:`
4. **Check error:** Look for `💥 Transport error:` or `ERROR Mobile money action:`

### 8. Quick Fixes

**Most Common Issues:**
1. **Android Emulator + localhost** → Change to `10.0.2.2`
2. **HTTP + Android 9+** → Enable cleartext traffic
3. **Physical device + localhost** → Use LAN IP
4. **TLS issues** → Check certificate chain

**Test these in order:**
1. Try the diagnostic logs first
2. Check if Google.com works (HTTPS test)
3. Try your API endpoint with curl
4. Apply the appropriate fix based on your setup
