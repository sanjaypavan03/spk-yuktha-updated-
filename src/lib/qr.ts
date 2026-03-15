/**
 * QR Code Generation Utilities
 * Generates unique QR identifiers and creates QR code URLs
 */

export function generateQRCode(): string {
  // Generate a unique, random, non-guessable QR identifier
  // Using Web Crypto API (browser-safe) or Node.js crypto
  if (typeof window === 'undefined') {
    // Server-side: Use Node.js crypto
    const { randomUUID } = require('crypto');
    return randomUUID();
  } else {
    // Client-side: Use Web Crypto API
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);

    const hex = (n: number) => n.toString(16).padStart(2, '0');
    buffer[6] = (buffer[6] & 0x0f) | 0x40; // version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // variant 1

    return [
      hex(buffer[0]) + hex(buffer[1]) + hex(buffer[2]) + hex(buffer[3]),
      hex(buffer[4]) + hex(buffer[5]),
      hex(buffer[6]) + hex(buffer[7]),
      hex(buffer[8]) + hex(buffer[9]),
      hex(buffer[10]) +
        hex(buffer[11]) +
        hex(buffer[12]) +
        hex(buffer[13]) +
        hex(buffer[14]) +
        hex(buffer[15]),
    ].join('-');
  }
}

/**
 * Validate QR code format
 */
export function isValidQRCode(qrCode: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(qrCode);
}

/**
 * Get public emergency URL for QR code
 */
export function getQRPublicUrl(qrCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/qr/${qrCode}`;
}
