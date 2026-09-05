import crypto from 'node:crypto';

/**
 * CLI script to generate a cryptographically secure 32-byte hex secret key
 * for PASETO v4 symmetric token encryption and signing.
 */
function generatePasetoKey(): void {
  const secretKey = crypto.randomBytes(32).toString('hex');

  console.log('=== KarkhanaX PASETO Secret Key Generator ===');
  console.log('Generated 32-Byte Hex Key:');
  console.log(secretKey);
  console.log('\nCopy and paste this value into your .env or .env.local file as:');
  console.log(`PASETO_SECRET_KEY=${secretKey}`);
  console.log('=============================================\n');
}

generatePasetoKey();

