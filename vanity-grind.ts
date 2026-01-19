import { Keypair } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const TARGET_SUFFIX = process.argv[2] || "k1od";
const REPORT_INTERVAL = 100000;

// Supabase client - accept both naming conventions
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getReserveCount(): Promise<number> {
  const { count } = await supabase
    .from("vanity_keypairs")
    .select("*", { count: "exact", head: true })
    .eq("suffix", TARGET_SUFFIX)
    .eq("is_used", false);
  return count || 0;
}

async function saveKeypair(keypair: Keypair): Promise<boolean> {
  const { error } = await supabase.from("vanity_keypairs").insert({
    public_key: keypair.publicKey.toBase58(),
    secret_key: Buffer.from(keypair.secretKey).toString("base64"),
    suffix: TARGET_SUFFIX,
    is_used: false,
  });

  if (error) {
    if (error.code === "23505") {
      return false;
    }
    console.error("\n❌ DB Error:", error.message);
    return false;
  }
  return true;
}

async function grind() {
  console.log(`\n🔍 Grinding for addresses ending with "${TARGET_SUFFIX}"...\n`);
  console.log(`Probability: ~1 in ${Math.pow(58, TARGET_SUFFIX.length).toLocaleString()} attempts`);

  const reserveCount = await getReserveCount();
  console.log(`📦 Current reserve: ${reserveCount} available keypairs`);
  console.log(`\nPress Ctrl+C to stop\n`);

  let attempts = 0;
  let found = 0;
  const startTime = Date.now();

  while (true) {
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toBase58();
    attempts++;

    if (address.endsWith(TARGET_SUFFIX)) {
      const saved = await saveKeypair(keypair);

      if (saved) {
        found++;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const newReserve = await getReserveCount();

        console.log(`\n✅ FOUND #${found}: ${address}`);
        console.log(`   Attempts: ${attempts.toLocaleString()} | Time: ${elapsed}s`);
        console.log(`   Reserve: ${newReserve} keypairs available\n`);
      }
    }

    if (attempts % REPORT_INTERVAL === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = Math.round(attempts / elapsed);
      const expectedAttempts = Math.pow(58, TARGET_SUFFIX.length);
      const eta = Math.round((expectedAttempts - (attempts % expectedAttempts)) / rate);

      process.stdout.write(
        `\r⏳ ${attempts.toLocaleString()} attempts | ${rate.toLocaleString()}/s | Found: ${found} | ETA: ~${Math.round(eta / 60)}min`
      );
    }
  }
}

process.on("SIGINT", async () => {
  console.log("\n\n👋 Stopping grinder...");
  const finalCount = await getReserveCount();
  console.log(`📦 Final reserve: ${finalCount} keypairs available\n`);
  process.exit(0);
});

grind().catch(console.error);