// Generate a UUID that works in all environments
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else {
      uuid += chars.charAt(Math.floor(Math.random() * 16));
    }
  }
  return uuid;
}
