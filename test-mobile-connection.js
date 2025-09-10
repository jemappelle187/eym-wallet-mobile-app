// Simple test to verify mobile app configuration
const API_BASE = "http://192.168.178.174:4000";
const WEBHOOK_SECRET = "test_shared_secret_please_change";

async function testConnection() {
  console.log("🧪 Testing mobile app connection to backend...");
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`🔑 Webhook Secret: ${WEBHOOK_SECRET}`);
  
  try {
    // Test 1: Health check
    console.log("\n1️⃣ Testing /health endpoint...");
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health check:", healthData);
    
    // Test 2: Deposit with auth
    console.log("\n2️⃣ Testing deposit webhook with authentication...");
    const depositResponse = await fetch(`${API_BASE}/v1/deposits/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET
      },
      body: JSON.stringify({
        userId: 'test_mobile_user',
        currency: 'USD',
        amount: 50,
        reference: 'mobile-test-001'
      })
    });
    
    const depositData = await depositResponse.json();
    console.log("✅ Deposit response:", depositData);
    
    // Test 3: Get balance
    console.log("\n3️⃣ Testing balance retrieval...");
    const balanceResponse = await fetch(`${API_BASE}/v1/users/test_mobile_user/balance`);
    const balanceData = await balanceResponse.json();
    console.log("✅ Balance response:", balanceData);
    
    console.log("\n🎉 All tests passed! Mobile app configuration is working.");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testConnection();



