#!/bin/bash

echo "🔍 Network Diagnostics for MTN API"
echo "=================================="

# Test the current endpoint
echo "1. Testing current endpoint: https://api.mtn.com"
echo "-----------------------------------------------"
echo "DNS Resolution:"
nslookup api.mtn.com

echo -e "\nTLS Handshake:"
curl -vk https://api.mtn.com/mobile-money/send 2>&1 | head -20

echo -e "\n2. Testing MTN MoMo Sandbox (likely correct endpoint)"
echo "------------------------------------------------------"
echo "DNS Resolution:"
nslookup sandbox.momodeveloper.mtn.com

echo -e "\nTLS Handshake:"
curl -vk https://sandbox.momodeveloper.mtn.com/ 2>&1 | head -20

echo -e "\n3. iOS ATS Diagnostics (if on macOS)"
echo "--------------------------------------"
if command -v nscurl &> /dev/null; then
    echo "Testing ATS compatibility for api.mtn.com:"
    nscurl --ats-diagnostics https://api.mtn.com 2>&1 | head -10
    
    echo -e "\nTesting ATS compatibility for sandbox.momodeveloper.mtn.com:"
    nscurl --ats-diagnostics https://sandbox.momodeveloper.mtn.com 2>&1 | head -10
else
    echo "nscurl not available (requires macOS)"
fi

echo -e "\n4. Quick connectivity test"
echo "---------------------------"
echo "Google (should work):"
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://www.google.com

echo -e "\nCurrent MTN endpoint:"
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://api.mtn.com

echo -e "\nMTN MoMo Sandbox:"
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://sandbox.momodeveloper.mtn.com

echo -e "\n✅ Diagnostics complete!"
echo "If api.mtn.com fails but sandbox.momodeveloper.mtn.com works,"
echo "update MTN_BASE_URL to the correct endpoint."
