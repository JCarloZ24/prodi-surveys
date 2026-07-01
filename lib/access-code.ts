import { randomBytes } from "crypto";

// Unambiguous base32 alphabet (no 0/O/1/I/L) — 32 chars, so each random byte maps
// uniformly (256 = 8 × 32, no modulo bias) onto one symbol.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Server-only. Generates a long, crypto-random access code for a self-service
// survey link. The link exposes a pre-filled draft (name/email/org), so the code
// must be unguessable — this is NOT the deterministic 4-char code() in lib/format.ts.
// Default 26 chars ≈ 130 bits of entropy.
export function generateAccessCode(len = 26): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
