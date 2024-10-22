import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// get client for prisma
export const prismaClient = new PrismaClient();

/**
 * Hashes a password using the PBKDF2 algorithm with a static salt.
 *
 * - this is running on the server
 *
 * @param password - The plain text password to be hashed.
 * @returns A promise that resolves to the hashed password in hexadecimal format.
 *
 * @throws Will reject the promise if an error occurs during hashing.
 */
export function hashPassword(password: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, 'salt', 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey.toString('hex'));
      }
    });
  });
}
