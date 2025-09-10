import * as Clipboard from 'expo-clipboard';

/**
 * Copies text to clipboard and clears it after a specified delay (default: 30 seconds).
 * Optionally, calls onCleared callback after clearing.
 * @param {string} text - The text to copy.
 * @param {number} delayMs - Delay in milliseconds before clearing clipboard (default: 30000).
 * @param {function} onCleared - Optional callback after clipboard is cleared.
 */
export async function copyWithAutoClear(text, delayMs = 30000, onCleared) {
  await Clipboard.setStringAsync(text);
  setTimeout(async () => {
    // Only clear if clipboard still contains the same text
    const current = await Clipboard.getStringAsync();
    if (current === text) {
      await Clipboard.setStringAsync('');
      if (onCleared) onCleared();
    }
  }, delayMs);
} 