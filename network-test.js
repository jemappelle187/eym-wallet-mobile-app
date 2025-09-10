// Simple network test script
const fetch = require('node-fetch');

async function testNetwork() {
  const urls = [
    'http://192.168.178.174:4000/health',
    'http://localhost:4000/health',
    'http://127.0.0.1:4000/health',
    'http://0.0.0.0:4000/health'
  ];

  console.log('🧪 Testing network connectivity...\n');

  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      console.log(`✅ SUCCESS: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
    console.log('');
  }
}

testNetwork().catch(console.error);



