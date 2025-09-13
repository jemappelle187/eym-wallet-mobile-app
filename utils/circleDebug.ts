// Circle API Key Validation and Debugging
export function validateCircleKey(k?: string) {
  const redacted = k ? k.replace(/:.+$/, ':•••') : '<undefined>';
  const parts = (k || '').split(':');
  console.log('[Circle] key parts:', parts.length, 'sample:', redacted);
  if (parts.length !== 3) {
    throw new Error(
      `Circle API key format invalid. Expected 3 parts (ENV:ID:SECRET). Got ${parts.length}.`
    );
  }
  if (!parts[0].includes('TEST_API_KEY')) {
    console.warn('[Circle] First part should be TEST_API_KEY for sandbox.');
  }
  console.log('[Circle] ✅ API key format is valid');
  return true;
}

export function debugCircleConfig(apiBase: string, apiKey: string) {
  console.log('[Circle] Using base:', apiBase);
  console.log('[Circle] Key starts with:', (apiKey || '').split(':')[0]);
  console.log('[Circle] Key length:', (apiKey || '').length);
  console.log('[Circle] Key has colons:', (apiKey || '').split(':').length - 1);
}