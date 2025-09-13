#!/bin/bash

echo "🔍 Backend Connectivity Diagnostic"
echo "=================================="

# Check if server is running on port 4000
echo "1. Checking if server is running on port 4000..."
if lsof -iTCP:4000 -sTCP:LISTEN > /dev/null 2>&1; then
    echo "✅ Server is running on port 4000"
    lsof -iTCP:4000 -sTCP:LISTEN
else
    echo "❌ No server found on port 4000"
    echo "   Start your backend server first!"
    exit 1
fi

echo ""
echo "2. Testing localhost connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ localhost:4000/health is reachable"
    curl -s http://localhost:4000/health
else
    echo "❌ localhost:4000/health is not reachable"
    echo "   Check if your server has a /health endpoint"
fi

echo ""
echo "3. Testing LAN IP connectivity..."
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.178.174")
echo "   Using LAN IP: $LAN_IP"

if curl -s -o /dev/null -w "%{http_code}" http://$LAN_IP:4000/health > /dev/null 2>&1; then
    echo "✅ $LAN_IP:4000/health is reachable"
    curl -s http://$LAN_IP:4000/health
else
    echo "❌ $LAN_IP:4000/health is not reachable"
    echo "   Server might be bound to 127.0.0.1 only (not 0.0.0.0)"
fi

echo ""
echo "4. Platform-specific recommendations:"
echo "   • iOS Simulator: Use http://localhost:4000 ✅"
echo "   • Android Emulator: Use http://10.0.2.2:4000"
echo "   • Physical Device: Use http://$LAN_IP:4000"

echo ""
echo "5. If still failing, check:"
echo "   • macOS Firewall: System Settings → Network → Firewall"
echo "   • Server binding: Should bind to 0.0.0.0:4000, not 127.0.0.1:4000"
echo "   • Docker: Use -p 4000:4000 and bind to 0.0.0.0 inside container"
