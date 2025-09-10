import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveBiometricEnabled(enabled) {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getBiometricEnabled() {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

export async function deleteBiometricEnabled() {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function saveSecurityCode(code) {
  await SecureStore.setItemAsync('security_code', code);
}

export async function getSecurityCode() {
  return await SecureStore.getItemAsync('security_code');
}

export async function deleteSecurityCode() {
  await SecureStore.deleteItemAsync('security_code');
} 