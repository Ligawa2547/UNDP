import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generates a secure token for offer letters and contracts
 * Format: token-{uuid}-{timestamp}-{randomHash}
 */
export function generateToken(): string {
  const uuid = uuidv4();
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  return `${uuid}-${timestamp}-${randomBytes}`;
}

/**
 * Generates a unique contract reference number
 * Format: CTR-{date}-{randomAlphanumeric}
 */
export function generateContractReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return `CTR-${date}-${random}`;
}

/**
 * Generates a unique BSAFE upload reference
 * Format: BSAFE-{timestamp}-{randomHash}
 */
export function generateBSAFEReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return `BSAFE-${timestamp}-${random}`;
}

/**
 * Validates a token format
 */
export function isValidToken(token: string): boolean {
  const tokenRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9]+-[a-f0-9]{16}$/;
  return tokenRegex.test(token);
}

/**
 * Calculates token expiry date (default 30 days from now)
 */
export function getTokenExpiryDate(days: number = 30): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Checks if a token has expired
 */
export function isTokenExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return new Date() > expiry;
}
