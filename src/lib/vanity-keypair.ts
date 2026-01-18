import { Keypair } from "@solana/web3.js";

export interface VanityResult {
  keypair: Keypair;
  publicKey: string;
  attempts: number;
}

/**
 * Generate a keypair with a public key ending in the specified suffix
 * Warning: This is CPU-intensive and may take a while for longer suffixes
 *
 * For 4 chars like "klod": ~5-10 million attempts on average
 * At ~50k attempts/sec, this takes ~2-3 minutes
 */
export function generateVanityKeypair(
  suffix: string,
  maxAttempts: number = 50_000_000,
  onProgress?: (attempts: number) => void
): VanityResult | null {
  const suffixLower = suffix.toLowerCase();
  let attempts = 0;

  while (attempts < maxAttempts) {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();

    attempts++;

    // Report progress every 10k attempts
    if (onProgress && attempts % 10000 === 0) {
      onProgress(attempts);
    }

    // Check if ends with suffix (case-insensitive)
    if (publicKey.toLowerCase().endsWith(suffixLower)) {
      return {
        keypair,
        publicKey,
        attempts,
      };
    }
  }

  return null; // Max attempts reached
}

/**
 * Async generator version that yields progress and doesn't block
 */
export async function* generateVanityKeypairAsync(
  suffix: string,
  maxAttempts: number = 50_000_000
): AsyncGenerator<{ type: "progress"; attempts: number } | { type: "found"; result: VanityResult }> {
  const suffixLower = suffix.toLowerCase();
  let attempts = 0;
  const batchSize = 1000;

  while (attempts < maxAttempts) {
    // Process in batches to allow UI updates
    for (let i = 0; i < batchSize && attempts < maxAttempts; i++) {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      attempts++;

      if (publicKey.toLowerCase().endsWith(suffixLower)) {
        yield {
          type: "found",
          result: { keypair, publicKey, attempts },
        };
        return;
      }
    }

    // Yield progress and allow event loop to process
    yield { type: "progress", attempts };
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * Estimate time to find a vanity address
 * Base58 has 58 characters, so probability is 1/58^n for n character suffix
 */
export function estimateVanityTime(suffixLength: number, attemptsPerSecond: number = 50000): {
  probability: number;
  expectedAttempts: number;
  estimatedSeconds: number;
} {
  // Base58 alphabet size
  const alphabetSize = 58;
  const combinations = Math.pow(alphabetSize, suffixLength);
  const probability = 1 / combinations;
  const expectedAttempts = combinations / 2; // Average case
  const estimatedSeconds = expectedAttempts / attemptsPerSecond;

  return {
    probability,
    expectedAttempts: Math.round(expectedAttempts),
    estimatedSeconds: Math.round(estimatedSeconds),
  };
}
