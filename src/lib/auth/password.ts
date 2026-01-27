const DEFAULT_ITERATIONS = 210_000;
const KEYLEN_BYTES = 32;
const HASH = 'SHA-256';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function deriveKeyBytes(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
  lengthBytes: number
): Promise<Uint8Array<ArrayBuffer>> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: HASH, salt, iterations },
    baseKey,
    lengthBytes * 8
  );

  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(salt);

  const key = await deriveKeyBytes(password, salt, DEFAULT_ITERATIONS, KEYLEN_BYTES);
  return `pbkdf2$${HASH.toLowerCase()}$${DEFAULT_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(key)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 5) return false;

  const [algorithm, digest, iterationsStr, saltHex, expectedHex] = parts;
  if (algorithm !== 'pbkdf2') return false;
  if (digest.toLowerCase() !== HASH.toLowerCase()) return false;

  const iterations = Number(iterationsStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(expectedHex);
  const derived = await deriveKeyBytes(password, salt, iterations, expected.length);

  return timingSafeEqualBytes(expected, derived);
}
