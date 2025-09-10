// PayPal OAuth Authentication Helper
// Uses btoa for Base64 encoding in React Native

export async function getPayPalAccessToken({
  clientId = 'AUf8-gxwh8B0MEzQPtDPwiJxn3Ulivg5gp7DTl9xs3GPwt8GDrxFa54KTOJn3q28rMNPAcK_9VMIgy_J',
  clientSecret = 'EDY1B7N_6rU9wgs6qXr01Wg-GplY3FjAeQ3F4f5CKxiIO87WvOShOhsLGl8vQfoyw0WdvGGcy08YxJi0',
  baseUrl = 'https://api-m.sandbox.paypal.com',
} = {}) {
  console.log('🔐 Getting PayPal access token with btoa encoding...');
  console.log('🔑 Using credentials:', {
    clientId: clientId,
    clientSecretLength: clientSecret?.length || 0,
    baseUrl: baseUrl
  });

  // Use btoa for Base64 encoding in React Native
  const basic = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  console.log('📡 PayPal API Response Status:', res.status);
  console.log('📡 PayPal API Response Headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const debugId = res.headers.get('paypal-debug-id');
    const error = new Error(
      `PayPal OAuth failed: ${res.status}. debug-id=${debugId || 'n/a'} body=${text}`
    );
    console.error('❌ PayPal OAuth Error:', error.message);
    throw error;
  }

  const data = await res.json();
  console.log('✅ PayPal access token obtained successfully');
  return data; // { access_token, token_type, expires_in, ... }
}

// Test function to verify credentials
export async function testPayPalCredentials() {
  try {
    const token = await getPayPalAccessToken();
    console.log('✅ PayPal credentials test successful:', {
      tokenType: token.token_type,
      expiresIn: token.expires_in,
      hasAccessToken: !!token.access_token
    });
    return { success: true, token };
  } catch (error) {
    console.error('❌ PayPal credentials test failed:', error.message);
    return { success: false, error: error.message };
  }
}
