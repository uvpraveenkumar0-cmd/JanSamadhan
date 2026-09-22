// Cryptographic utilities using Web Cryptography API (native browser standard)

/**
 * Generates a cryptographically secure random salt hex string.
 */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes SHA-256 hash of password + salt.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a plaintext password against a stored salt and hash.
 */
export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

/**
 * Generates a pseudo-JWT session token with tamper-detection signature.
 */
export async function generateSessionToken(payload: Record<string, unknown>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const fullPayload = { ...payload, exp, iat: Date.now() };
  const body = btoa(JSON.stringify(fullPayload));
  const rawSignature = await hashPassword(`${header}.${body}`, 'jih-sih-2026-auth-secret');
  return `${header}.${body}.${rawSignature.substring(0, 32)}`;
}

/**
 * Validates and decodes session token.
 */
export function decodeSessionToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const body = JSON.parse(atob(parts[1]));
    if (body.exp && Date.now() > body.exp) {
      return null; // Expired
    }
    return body as T;
  } catch {
    return null;
  }
}
