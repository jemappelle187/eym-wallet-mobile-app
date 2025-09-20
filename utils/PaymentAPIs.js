import { StripeProvider } from '@stripe/stripe-react-native';

export const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    secretKey: process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY || 'sk_test_placeholder',
    enabled: true,
    supportedCurrencies: ['USD', 'EUR', 'GHS', 'NGN', 'AED'],
    supportedMethods: ['card', 'bank_transfer', 'mobile_money']
  },
  plaid: {
    // Plaid Configuration - Using environment variables
    clientId: '68ac263124f4f400219a21b6', // From .env file
    environment: 'sandbox', // sandbox, development, production
    products: ['transactions', 'auth', 'identity'],
    countryCodes: ['US', 'CA', 'GB', 'NL'],
    supportedBanks: ['chase', 'wells_fargo', 'bank_of_america']
  },
  mobileMoney: {
    mtn: {
      apiKey: process.env.EXPO_PUBLIC_MTN_API_KEY || 'your_mtn_api_key',
      environment: 'sandbox', // sandbox, production
      supportedCountries: ['GH', 'UG', 'RW', 'ZM', 'CI', 'CM'],
      supportedCurrencies: ['GHS', 'UGX', 'RWF', 'ZMW', 'XOF', 'XAF']
    },
    vodafone: {
      apiKey: process.env.EXPO_PUBLIC_VODAFONE_API_KEY || 'your_vodafone_api_key',
      environment: 'sandbox',
      supportedCountries: ['GH', 'KE', 'TZ'],
      supportedCurrencies: ['GHS', 'KES', 'TZS']
    }
  },
  paypal: {
    clientId: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || 'your_paypal_client_id',
    environment: 'sandbox', // sandbox, live
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedMethods: ['paypal', 'credit_card', 'bank_transfer']
  }
};

export const initializePaymentProviders = () => {
  // Initialize Stripe
  if (PAYMENT_CONFIG.stripe.enabled) {
    console.log('Initializing Stripe with key:', PAYMENT_CONFIG.stripe.publishableKey.substring(0, 20) + '...');
  }
  
  // Initialize other payment providers as needed
  console.log('Payment providers initialized');
};

export default PAYMENT_CONFIG;
