/**
 * Emergency token utilities
 * Generates and validates unique tokens for emergency QR codes
 * 
 * IMPORTANT: Use generateEmergencyTokenBrowser() for client components
 * This fixes the "crypto-browserify is not a function" error
 */

// ============================================
// Browser-Safe Token Generation (CLIENT SIDE)
// ============================================

/**
 * Generate a unique emergency token using Web Crypto API
 * @deprecated Use server-side generation via /api/emergency-token instead
 */
export async function generateEmergencyTokenBrowser(): Promise<string> {
  console.warn('generateEmergencyTokenBrowser is deprecated. Use server-side generation.');
  // Use Web Crypto API (available in all modern browsers)
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);

  // Convert to UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = (n: number) => n.toString(16).padStart(2, '0');

  buffer[6] = (buffer[6] & 0x0f) | 0x40; // version 4
  buffer[8] = (buffer[8] & 0x3f) | 0x80; // variant 1

  const uuid = [
    hex(buffer[0]) + hex(buffer[1]) + hex(buffer[2]) + hex(buffer[3]),
    hex(buffer[4]) + hex(buffer[5]),
    hex(buffer[6]) + hex(buffer[7]),
    hex(buffer[8]) + hex(buffer[9]),
    hex(buffer[10]) + hex(buffer[11]) + hex(buffer[12]) + hex(buffer[13]) + hex(buffer[14]) + hex(buffer[15])
  ].join('-');

  return uuid;
}

/**
 * DEPRECATED: Use generateEmergencyTokenBrowser() instead
 * This function causes "crypto-browserify is not a function" error in client components
 * @deprecated Use generateEmergencyTokenBrowser() for client or create a Server Action for server
 */
export async function generateEmergencyToken(): Promise<string> {
  console.warn(
    '⚠️  generateEmergencyToken() uses Node.js crypto and will fail in client components. ' +
    'Use generateEmergencyTokenBrowser() instead, or create a Server Action for secure generation.'
  );
  return generateEmergencyTokenBrowser();
}

/**
 * Validate if a token has the correct format
 * @param token - The token to validate
 * @returns true if token is a valid UUID format
 */
export function isValidEmergencyToken(token: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

/**
 * Create the public emergency URL from a token
 * @param token - The emergency token
 * @param baseUrl - Optional base URL (defaults to current origin)
 * @returns The full URL to the emergency info page
 */
export function getEmergencyUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
  return `${base}/emergency/${token}`;
}

/**
 * Store emergency token in localStorage (client-side)
 * Maps to the current user's emergency info
 * @param token - The emergency token to store
 */
export function storeEmergencyToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('yuktha-emergency-token', token);
  }
}

/**
 * Retrieve emergency token from localStorage (client-side)
 * @returns The stored emergency token or null if not found
 */
export function getStoredEmergencyToken(): string | null {
  console.log('DEBUG: getStoredEmergencyToken called. window type:', typeof window);
  if (typeof window !== 'undefined') {
    try {
      console.log('DEBUG: localStorage type:', typeof localStorage);
      return localStorage.getItem('yuktha-emergency-token');
    } catch (e: any) {
      console.error('DEBUG: localStorage.getItem failed:', e.message);
      return null;
    }
  }
  return null;
}

/**
 * Clear emergency token from localStorage (client-side)
 */
export function clearEmergencyToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('yuktha-emergency-token');
  }
}
