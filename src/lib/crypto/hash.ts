// SHA256 utilities using Web Crypto API

export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashBlock(
  slot: number,
  pohHash: string,
  transactionSignatures: string[]
): Promise<string> {
  const data = `${slot}:${pohHash}:${transactionSignatures.join(",")}`;
  return sha256(data);
}

export function generateRandomHash(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
