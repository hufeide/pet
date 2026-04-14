/**
 * Test setup - runs before all tests
 */

import { afterEach, vi } from 'vitest';
import { createPinia } from 'pinia';

// Polyfill crypto.randomUUID for Node.js environment
// This is needed because vitest's node environment doesn't include crypto.randomUUID
// which is used by the store for generating message IDs
if (!('crypto' in globalThis) || typeof globalThis.crypto.randomUUID !== 'function') {
  const crypto = await import('crypto');
  globalThis.crypto = {
    ...crypto,
    randomUUID: () => crypto.randomUUID(),
  } as any;
}

// Create Pinia instance for tests
const pinia = createPinia();

// Set up global cleanup
afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks();
});

// Export pinia for use in tests
export { pinia };
