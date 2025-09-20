#!/usr/bin/env node

/**
 * Vercel Environment Setup Script
 * Helps configure environment variables for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Environment Setup\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: Run this script from the sendnreceive-app directory');
  process.exit(1);
}

// Environment variables template
const envTemplate = {
  development: {
    EXPO_PUBLIC_CIRCLE_API_KEY: 'TEST_API_KEY:your_sandbox_key_here',
    EXPO_PUBLIC_CIRCLE_API_BASE: 'https://api-sandbox.circle.com/v1/w3s',
    EXPO_PUBLIC_AUTO_CONVERT_API_BASE: 'http://127.0.0.1:4000',
    EXPO_PUBLIC_USE_MOCK_API: 'false',
    EXPO_PUBLIC_WEBHOOK_SECRET: 'your_webhook_secret_here'
  },
  production: {
    EXPO_PUBLIC_CIRCLE_API_KEY: 'LIVE_API_KEY:your_production_key_here',
    EXPO_PUBLIC_CIRCLE_API_BASE: 'https://api.circle.com/v1/w3s',
    EXPO_PUBLIC_AUTO_CONVERT_API_BASE: 'https://your-auto-convert-api.vercel.app',
    EXPO_PUBLIC_USE_MOCK_API: 'false',
    EXPO_PUBLIC_WEBHOOK_SECRET: 'your_production_webhook_secret_here'
  }
};

// Generate .env files
function generateEnvFile(environment, variables) {
  const envContent = Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const envPath = path.join(process.cwd(), `.env.${environment}`);
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created ${envPath}`);
}

// Generate Vercel environment variables file
function generateVercelEnvFile() {
  const vercelEnvContent = `# Vercel Environment Variables
# Copy these to your Vercel dashboard under Settings > Environment Variables

# Circle API Configuration
EXPO_PUBLIC_CIRCLE_API_KEY=LIVE_API_KEY:your_production_key_here
EXPO_PUBLIC_CIRCLE_API_BASE=https://api.circle.com/v1/w3s
EXPO_PUBLIC_WEBHOOK_SECRET=your_production_webhook_secret_here

# Backend API Configuration
EXPO_PUBLIC_AUTO_CONVERT_API_BASE=https://your-auto-convert-api.vercel.app
EXPO_PUBLIC_USE_MOCK_API=false

# Instructions:
# 1. Replace 'your_production_key_here' with your actual Circle API key
# 2. Replace 'your-auto-convert-api.vercel.app' with your actual Vercel backend URL
# 3. Replace 'your_production_webhook_secret_here' with your actual webhook secret
# 4. Add these variables to your Vercel project settings
`;

  const vercelEnvPath = path.join(process.cwd(), 'vercel-env-variables.txt');
  fs.writeFileSync(vercelEnvPath, vercelEnvContent);
  console.log(`✅ Created ${vercelEnvPath}`);
}

// Generate setup instructions
function generateSetupInstructions() {
  const instructions = `# 🔧 Vercel Deployment Setup Instructions

## 1. Environment Variables Setup

### For Development:
- Use the generated \`.env.development\` file
- Update \`EXPO_PUBLIC_CIRCLE_API_KEY\` with your sandbox key
- Start local development server

### For Production (Vercel):
1. **Get your Circle API credentials:**
   - Log into Circle dashboard
   - Copy your production API key
   - Format: \`LIVE_API_KEY:your_actual_key_here\`

2. **Deploy your backend:**
   - Deploy \`auto-convert-api\` to Vercel
   - Note the deployment URL

3. **Set Vercel environment variables:**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add the variables from \`vercel-env-variables.txt\`
   - Replace placeholder values with actual credentials

## 2. Validation

The app now includes automatic validation:
- ✅ API key format validation
- ✅ API connectivity checks
- ✅ Graceful error handling
- ✅ Fallback to demo data when APIs fail

## 3. Testing

After deployment:
1. Test mobile money transactions
2. Verify Circle API integration
3. Check error handling with invalid credentials
4. Confirm fallback behavior

## 4. Troubleshooting

If you see "Invalid credentials (401)" errors:
1. Check API key format (must start with \`LIVE_API_KEY:\`)
2. Verify key is active in Circle dashboard
3. Ensure environment variables are set in Vercel
4. Check Vercel deployment logs

## 5. Health Check

Use the API Health Status component in the app to:
- Check API connectivity
- Validate configuration
- Get troubleshooting guidance
`;

  const instructionsPath = path.join(process.cwd(), 'VERCEL_SETUP_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`✅ Created ${instructionsPath}`);
}

// Main execution
try {
  console.log('📝 Generating environment files...\n');
  
  generateEnvFile('development', envTemplate.development);
  generateEnvFile('production', envTemplate.production);
  generateVercelEnvFile();
  generateSetupInstructions();
  
  console.log('\n🎉 Environment setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update API keys in the generated .env files');
  console.log('2. Follow instructions in VERCEL_SETUP_INSTRUCTIONS.md');
  console.log('3. Set environment variables in your Vercel dashboard');
  console.log('4. Deploy and test your application');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
