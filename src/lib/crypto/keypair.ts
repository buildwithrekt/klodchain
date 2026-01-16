// Mock ed25519 keypairs for simulation

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generateBase58(length: number): string {
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += BASE58_ALPHABET[byte % BASE58_ALPHABET.length];
  }
  return result;
}

export function generatePubkey(): string {
  // Solana pubkeys are 32 bytes, typically 43-44 chars in base58
  return generateBase58(44);
}

export function generateSignature(): string {
  // Solana signatures are 64 bytes, typically 87-88 chars in base58
  return generateBase58(88);
}

export interface Keypair {
  pubkey: string;
  secretKey: string;
}

export function generateKeypair(): Keypair {
  return {
    pubkey: generatePubkey(),
    secretKey: generateBase58(64), // Mock secret key
  };
}

// Pre-defined keypairs for autonomous agents (for consistent simulation)
export const AGENT_KEYPAIRS: { pubkey: string; secretKey: string; name: string; role: string }[] = [
  {
    pubkey: "K1odVa1idator111111111111111111111111111111",
    secretKey: "secret1",
    name: "KLOD Validator",
    role: "validator",
  },
  {
    pubkey: "K1odArchitect222222222222222222222222222222",
    secretKey: "secret2",
    name: "KLOD Architect",
    role: "architect",
  },
  {
    pubkey: "K1odAna1yst3333333333333333333333333333333",
    secretKey: "secret3",
    name: "KLOD Analyst",
    role: "analyst",
  },
  {
    pubkey: "K1odReviewer44444444444444444444444444444",
    secretKey: "secret4",
    name: "KLOD Reviewer",
    role: "reviewer",
  },
  {
    pubkey: "K1odConsensus5555555555555555555555555555",
    secretKey: "secret5",
    name: "KLOD Consensus",
    role: "consensus",
  },
  {
    pubkey: "K1od0rac1e666666666666666666666666666666",
    secretKey: "secret6",
    name: "KLOD Oracle",
    role: "oracle",
  },
];
