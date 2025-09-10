# Plaid Integration Guide for EYM Wallet

## Overview
This guide explains how to integrate Plaid Link into the EYM Wallet mobile app for bank account linking and ACH transfers.

## Backend Integration Status
✅ **Backend is fully configured and ready**
- Plaid API credentials are set up
- All endpoints are available and tested
- Link token creation is working

## Available Backend Endpoints

### 1. Get Link Token
```bash
POST /v1/plaid/link-token
Content-Type: application/json

{
  "userId": "demo_user"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "link_token": "link-sandbox-...",
    "expiration": "2025-09-08T23:46:46Z",
    "request_id": "ICm2OohfvI9Hcut"
  }
}
```

### 2. Exchange Public Token
```bash
POST /v1/plaid/exchange-token
Content-Type: application/json

{
  "publicToken": "public-sandbox-..."
}
```

### 3. Get Accounts
```bash
POST /v1/plaid/accounts
Content-Type: application/json

{
  "accessToken": "access-sandbox-..."
}
```

### 4. Get Balances
```bash
POST /v1/plaid/balances
Content-Type: application/json

{
  "accessToken": "access-sandbox-..."
}
```

## Frontend Integration Steps

### 1. Install Plaid React Native SDK
```bash
npm install react-native-plaid-link-sdk
```

### 2. iOS Configuration
Add to `ios/Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### 3. Android Configuration
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 4. Basic Integration Example
```javascript
import { PlaidLink } from 'react-native-plaid-link-sdk';

const BankLinkingScreen = () => {
  const [linkToken, setLinkToken] = useState(null);

  // Get link token from backend
  const getLinkToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/plaid/link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo_user' })
      });
      const data = await response.json();
      setLinkToken(data.data.link_token);
    } catch (error) {
      console.error('Failed to get link token:', error);
    }
  };

  const onSuccess = async (publicToken) => {
    try {
      // Exchange public token for access token
      const response = await fetch(`${API_BASE}/v1/plaid/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken })
      });
      const data = await response.json();
      console.log('Access token:', data.data.access_token);
      
      // Get accounts
      const accountsResponse = await fetch(`${API_BASE}/v1/plaid/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: data.data.access_token })
      });
      const accounts = await accountsResponse.json();
      console.log('Accounts:', accounts.data.accounts);
    } catch (error) {
      console.error('Failed to exchange token:', error);
    }
  };

  const onExit = (error) => {
    if (error) {
      console.error('Plaid Link error:', error);
    }
  };

  return (
    <View>
      <Button title="Link Bank Account" onPress={getLinkToken} />
      
      {linkToken && (
        <PlaidLink
          token={linkToken}
          onSuccess={onSuccess}
          onExit={onExit}
        />
      )}
    </View>
  );
};
```

## Testing with Sandbox

### Test Credentials
- **Username:** `user_good`
- **Password:** `pass_good`
- **PIN:** `1234`

### Test Scenarios
1. **Successful Link:** Use `user_good`/`pass_good`
2. **Incorrect Credentials:** Use `user_bad`/`pass_bad`
3. **Insufficient Funds:** Use `user_good`/`pass_good` with specific test accounts

## Integration with Bank Transfer Flow

### Current Flow (Simulator)
1. User selects "Bank Transfer"
2. App shows simulator with mock bank details
3. Transfer auto-completes after 5 seconds
4. EUR → EURC conversion happens

### Future Flow (Real Plaid)
1. User selects "Bank Transfer"
2. App shows Plaid Link for bank selection
3. User links their real bank account
4. App initiates ACH transfer via Plaid
5. Real money transfer happens
6. EUR → EURC conversion happens

## Environment Variables

### Backend (.env)
```env
PLAID_CLIENT_ID=68ac263124f4f400219a21b6
PLAID_SECRET=39e2daa3274c9e905880ee1affa002
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions,auth
```

### Frontend (app.config.js)
```javascript
export default {
  expo: {
    extra: {
      PLAID_ENV: 'sandbox',
      PLAID_PRODUCTS: 'transactions,auth'
    }
  }
};
```

## Security Considerations

1. **Never store access tokens in the app**
2. **Use secure backend endpoints for all Plaid operations**
3. **Implement proper error handling**
4. **Use HTTPS in production**
5. **Validate all responses from Plaid**

## Production Checklist

- [ ] Switch `PLAID_ENV` to `production`
- [ ] Update Plaid credentials to production keys
- [ ] Test with real bank accounts
- [ ] Implement proper error handling
- [ ] Add user consent flows
- [ ] Implement account verification
- [ ] Set up webhooks for transaction updates

## Support

- [Plaid Documentation](https://plaid.com/docs/)
- [React Native SDK](https://github.com/plaid/react-native-plaid-link-sdk)
- [Sandbox Testing](https://plaid.com/docs/sandbox/)

## Current Status

✅ **Backend Integration:** Complete and tested
⏳ **Frontend Integration:** Ready to implement
⏳ **Testing:** Ready for sandbox testing
⏳ **Production:** Pending production credentials

