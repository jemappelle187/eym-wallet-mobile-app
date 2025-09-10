# Payment API Integration Guide for EYM Wallet

## Overview
This guide provides step-by-step instructions for integrating free payment APIs into the EYM Wallet app for testing and development purposes.

## 🚀 Quick Start

### 1. Install Required Dependencies

```bash
# Navigate to your app directory
cd sendnreceive-app

# Install payment-related dependencies
npm install @stripe/stripe-react-native
npm install react-native-plaid-link-sdk
npm install react-native-paypal-wrapper
```

### 2. Configure Environment Variables

Create a `.env` file in your app root:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_ENV=sandbox

# Mobile Money APIs (Regional)
MTN_API_KEY=your_mtn_api_key
VODAFONE_API_KEY=your_vodafone_api_key
AIRTEL_API_KEY=your_airtel_api_key
```

## 📱 Payment APIs Integration

### 1. Stripe Integration

**Free Tier Benefits:**
- No monthly fees
- 2.9% + 30¢ per successful transaction
- Unlimited test transactions
- 135+ currencies supported

**Setup Steps:**

1. **Create Stripe Account:**
   - Go to [stripe.com](https://stripe.com)
   - Sign up for a free account
   - Get your test API keys from the dashboard

2. **Configure Stripe in App:**

```javascript
// In your App.js or payment initialization
import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {
  return (
    <StripeProvider publishableKey="pk_test_your_key">
      {/* Your app components */}
    </StripeProvider>
  );
};
```

3. **Test Card Numbers:**
   - Success: `4242424242424242`
   - Decline: `4000000000000002`
   - Insufficient funds: `4000000000009995`

### 2. Plaid Integration

**Free Tier Benefits:**
- 100 API calls per month
- 11,000+ financial institutions
- Real-time balance checking
- Transaction categorization

**Setup Steps:**

1. **Create Plaid Account:**
   - Go to [plaid.com](https://plaid.com)
   - Sign up for developer account
   - Get your sandbox credentials

2. **Configure Plaid:**

```javascript
// In PaymentAPIs.js
export const PAYMENT_CONFIG = {
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: 'sandbox',
    enabled: true,
    supportedCountries: ['US', 'CA', 'GB', 'FR', 'DE', 'ES', 'NL']
  }
};
```

3. **Test Bank Credentials:**
   - Username: `user_good`
   - Password: `pass_good`

### 3. Mobile Money APIs

#### MTN Mobile Money (Ghana, Uganda, Tanzania)

**Setup:**
1. Register for MTN Mobile Money API
2. Get sandbox credentials
3. Configure webhook endpoints

**Test Numbers:**
- Ghana: `+233244123456`
- Uganda: `+256701234567`
- Tanzania: `+255712345678`

#### Vodafone Cash (Ghana, Egypt, Tanzania)

**Setup:**
1. Apply for Vodafone Cash API access
2. Complete KYC verification
3. Get test environment credentials

#### Airtel Money (Ghana, Nigeria, Uganda, Tanzania)

**Setup:**
1. Register for Airtel Money API
2. Submit business documentation
3. Get sandbox access

### 4. PayPal Integration

**Free Tier Benefits:**
- No setup fees
- 2.9% + fixed fee per transaction
- Global reach (200+ countries)

**Setup Steps:**

1. **Create PayPal Developer Account:**
   - Go to [developer.paypal.com](https://developer.paypal.com)
   - Create a developer account
   - Get sandbox credentials

2. **Configure PayPal:**

```javascript
// In PaymentAPIs.js
export const PAYMENT_CONFIG = {
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    environment: 'sandbox',
    enabled: true,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  }
};
```

### 5. Regional Payment Providers

#### Square (US/Canada)

**Free Tier:**
- No monthly fees
- 2.6% + 10¢ per transaction
- Excellent mobile SDK

**Setup:**
1. Create Square Developer account
2. Get sandbox credentials
3. Configure webhooks

## 🔧 Implementation Examples

### Using the PaymentIntegration Component

```javascript
import PaymentIntegration from '../components/PaymentIntegration';

const DepositScreen = () => {
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    // Update user balance, show success message, etc.
  };

  const handlePaymentError = (error) => {
    console.log('Payment failed:', error);
    // Show error message, retry options, etc.
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowPayment(true)}>
        <Text>Add Money</Text>
      </TouchableOpacity>

      <PaymentIntegration
        isVisible={showPayment}
        onClose={() => setShowPayment(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        paymentType="deposit"
        defaultAmount="100"
        defaultCurrency="USD"
      />
    </View>
  );
};
```

### Direct API Usage

```javascript
import { paymentManager } from '../utils/PaymentAPIs';

const processPayment = async () => {
  try {
    const result = await paymentManager.processPayment({
      method: 'card',
      amount: 100,
      currency: 'USD',
      cardNumber: '4242424242424242',
      expMonth: 12,
      expYear: 2025,
      cvc: '123'
    });

    if (result.success) {
      console.log('Payment processed:', result);
    } else {
      console.log('Payment failed:', result.error);
    }
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

## 🧪 Testing Procedures

### 1. Stripe Testing

```javascript
// Test successful payment
const testSuccessfulPayment = async () => {
  const result = await paymentManager.processPayment({
    method: 'card',
    amount: 100,
    currency: 'USD',
    cardNumber: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvc: '123'
  });
  console.log('Success test result:', result);
};

// Test declined payment
const testDeclinedPayment = async () => {
  const result = await paymentManager.processPayment({
    method: 'card',
    amount: 100,
    currency: 'USD',
    cardNumber: '4000000000000002',
    expMonth: 12,
    expYear: 2025,
    cvc: '123'
  });
  console.log('Decline test result:', result);
};
```

### 2. Mobile Money Testing

```javascript
// Test MTN Mobile Money
const testMTNPayment = async () => {
  const result = await paymentManager.processPayment({
    method: 'mobile_money',
    amount: 100,
    currency: 'GHS',
    phoneNumber: '+233244123456',
    provider: 'mtn'
  });
  console.log('MTN payment result:', result);
};
```

### 3. Plaid Testing

```javascript
// Test bank account linking
const testBankLinking = async () => {
  const result = await paymentManager.linkBankAccount();
  console.log('Bank linking result:', result);
};

// Test balance retrieval
const testBalanceCheck = async () => {
  const result = await paymentManager.getAccountBalance('test_account_id');
  console.log('Balance check result:', result);
};
```

## 🔒 Security Best Practices

### 1. API Key Management

```javascript
// Use environment variables
const config = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY
  }
};

// Never expose secret keys in client-side code
// Always use server-side endpoints for sensitive operations
```

### 2. Input Validation

```javascript
const validatePaymentInput = (paymentData) => {
  const { amount, currency, method } = paymentData;
  
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  if (!currency || !['USD', 'EUR', 'GHS', 'NGN'].includes(currency)) {
    throw new Error('Unsupported currency');
  }
  
  if (!method || !['card', 'mobile_money', 'bank', 'paypal'].includes(method)) {
    throw new Error('Unsupported payment method');
  }
};
```

### 3. Error Handling

```javascript
const handlePaymentError = (error) => {
  // Log error for debugging
  console.error('Payment error:', error);
  
  // Show user-friendly message
  const userMessage = getErrorMessage(error.code);
  Alert.alert('Payment Error', userMessage);
  
  // Report to analytics
  analytics.track('payment_error', {
    error_code: error.code,
    payment_method: error.method,
    amount: error.amount
  });
};
```

## 📊 Analytics and Monitoring

### 1. Payment Analytics

```javascript
// Track payment events
const trackPaymentEvent = (event, data) => {
  analytics.track(event, {
    payment_method: data.method,
    amount: data.amount,
    currency: data.currency,
    success: data.success,
    timestamp: new Date().toISOString()
  });
};

// Usage examples
trackPaymentEvent('payment_initiated', paymentData);
trackPaymentEvent('payment_completed', result);
trackPaymentEvent('payment_failed', error);
```

### 2. Performance Monitoring

```javascript
// Monitor payment processing time
const measurePaymentTime = async (paymentFunction) => {
  const startTime = Date.now();
  
  try {
    const result = await paymentFunction();
    const processingTime = Date.now() - startTime;
    
    analytics.track('payment_processing_time', {
      method: result.method,
      processing_time: processingTime,
      success: result.success
    });
    
    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    analytics.track('payment_processing_time', {
      method: error.method,
      processing_time: processingTime,
      success: false,
      error: error.message
    });
    
    throw error;
  }
};
```

## 🚀 Deployment Checklist

### Pre-Production

- [ ] All API keys configured for production
- [ ] Webhook endpoints set up and tested
- [ ] Error handling implemented
- [ ] Analytics tracking configured
- [ ] Security measures in place
- [ ] Payment flow tested end-to-end
- [ ] Compliance requirements met

### Production

- [ ] Monitor payment success rates
- [ ] Track processing times
- [ ] Monitor error rates
- [ ] Set up alerts for payment failures
- [ ] Regular security audits
- [ ] Backup payment methods configured

## 📞 Support and Resources

### API Documentation

- [Stripe Documentation](https://stripe.com/docs)
- [Plaid Documentation](https://plaid.com/docs)
- [PayPal Developer Docs](https://developer.paypal.com/docs)
- [MTN Mobile Money API](https://developers.mtn.com)
- [Vodafone Cash API](https://developers.vodafone.com)

### Testing Tools

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Plaid Sandbox](https://plaid.com/docs/sandbox)
- [PayPal Sandbox](https://developer.paypal.com/docs/api-basics/sandbox)

### Community Support

- [Stripe Community](https://support.stripe.com)
- [Plaid Community](https://community.plaid.com)
- [PayPal Developer Community](https://developer.paypal.com/community)

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Monthly:**
   - Review API usage and costs
   - Check for API updates and deprecations
   - Monitor payment success rates

2. **Quarterly:**
   - Security audit of payment flows
   - Performance optimization review
   - Compliance check updates

3. **Annually:**
   - Full payment system review
   - New payment method evaluation
   - Cost optimization analysis

This guide provides a comprehensive foundation for integrating multiple payment APIs into your EYM Wallet app. Start with the free tiers and gradually expand as your user base grows.
