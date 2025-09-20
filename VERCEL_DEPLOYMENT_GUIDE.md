# 🚀 Vercel Deployment Guide

## Using Real Sandbox APIs Instead of Mock Servers

This guide shows how to deploy your sendnreceive app to Vercel using **real sandbox APIs** instead of mock servers for proper testing and development.

## 📋 **Pre-Deployment Checklist**

### 1. **Environment Configuration**
- ✅ Circle API: Sandbox in dev, Production in prod
- ✅ Mobile money API: Real MTN sandbox via auto-convert-api
- ✅ Error handling for API failures

### 2. **Real API Services**
- ✅ MTN Mobile Money: `https://sandbox.momodeveloper.mtn.com`
- ✅ Circle W3S API: `https://api-sandbox.circle.com/v1/w3s` (dev) / `https://api.circle.com/v1/w3s` (prod)
- ✅ Auto-convert-api backend for MTN integration

## 🔧 **Deployment Steps**

### **Step 1: Deploy Backend to Vercel**

1. **Deploy the mock backend server:**
   ```bash
   # In your sendnreceive-app directory
   vercel --prod
   ```

2. **Note your Vercel backend URL:**
   - Example: `https://your-app-name.vercel.app`

### **Step 2: Update Environment Variables**

1. **In your Vercel dashboard:**
   - Go to your project settings
   - Add environment variables:
     ```
     EXPO_PUBLIC_AUTO_CONVERT_API_BASE=https://your-app-name.vercel.app
     EXPO_PUBLIC_CIRCLE_API_BASE=https://api.circle.com/v1/w3s/w3s
     EXPO_PUBLIC_CIRCLE_API_KEY=your-production-key
     ```

### **Step 3: Deploy Frontend**

1. **Build and deploy your React Native app:**
   ```bash
   # Build for production
   npx expo build:web
   
   # Deploy to Vercel
   vercel --prod
   ```

## 🛡️ **Error Prevention Features**

### **1. API Credential Validation**
- ✅ **Pre-flight validation**: Checks API key format on startup
- ✅ **Health checks**: Validates API connectivity before requests
- ✅ **Clear error messages**: Specific guidance for fixing issues
- ✅ **Graceful fallbacks**: Uses demo data when APIs fail

### **2. Circle API Error Prevention**
- ✅ **401 Error Handling**: Detects invalid credentials with fix suggestions
- ✅ **403 Error Handling**: Identifies permission issues
- ✅ **Network Error Handling**: Provides network-specific guidance
- ✅ **Fallback Data**: Returns demo responses when API fails

### **3. Environment Configuration**
- ✅ **Automatic validation**: Checks all required environment variables
- ✅ **Development vs Production**: Different endpoints for dev/prod
- ✅ **Vercel integration**: Proper environment variable setup
- ✅ **Configuration warnings**: Alerts for misconfigurations

## 🔍 **Testing Your Deployment**

### **1. Test Mobile Money API**
```bash
# Test your deployed backend
curl https://your-app-name.vercel.app/health
curl https://your-app-name.vercel.app/v1/momo/status
```

### **2. Test Error Handling**
- Try mobile money transactions when backend is down
- Verify demo responses are returned
- Check that app doesn't crash

## 📱 **Production Configuration**

### **Environment Variables for Production:**
```env
# Circle API (Production)
EXPO_PUBLIC_CIRCLE_API_BASE=https://api.circle.com/v1/w3s
EXPO_PUBLIC_CIRCLE_API_KEY=your-production-key

# Mobile Money API (Vercel Backend)
EXPO_PUBLIC_AUTO_CONVERT_API_BASE=https://your-app-name.vercel.app

# Disable mock mode
EXPO_PUBLIC_USE_MOCK_API=false
```

## 🚨 **Troubleshooting**

### **"Resource not found" Error:**
1. Check if backend is deployed to Vercel
2. Verify environment variables are set
3. Check network connectivity
4. Review Vercel function logs

### **Backend Not Responding:**
1. Check Vercel function status
2. Verify `vercel.json` configuration
3. Test endpoints manually
4. Check function logs in Vercel dashboard

## ✅ **Success Indicators**

- ✅ App loads without "Resource not found" errors
- ✅ Mobile money transactions work (or show demo mode)
- ✅ Circle API transactions work
- ✅ Error handling works gracefully
- ✅ No crashes when backend is unavailable

## 🔄 **Continuous Deployment**

Set up automatic deployments:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Enable automatic deployments on push
4. Monitor deployment logs for any issues

---

**Note:** This configuration ensures your app works in both development and production environments, with graceful fallbacks when services are unavailable.
