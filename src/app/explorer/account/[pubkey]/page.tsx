import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ExplorerAccountPage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;

  // If it's a wallet address (starts with klod_), redirect to wallet page
  if (pubkey.startsWith("klod_")) {
    redirect(`/accounts/${pubkey}`);
  }

  // If it ends with "klod" (memecoin address), check if it's a token
  if (pubkey.endsWith("klod")) {
    const { data: token } = await supabase
      .from("memecoins")
      .select("address")
      .eq("address", pubkey)
      .single();

    if (token) {
      redirect(`/token/${pubkey}`);
    }
  }

  // Check if it's a blockchain account
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("pubkey", pubkey)
    .single();

  if (!account) {
    // Check validators
    const { data: validator } = await supabase
      .from("validators")
      .select("*")
      .eq("pubkey", pubkey)
      .single();

    if (validator) {
      // Show validator info - for now redirect to a simple page
      return (
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">Validator</h1>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Pubkey</p>
            <p className="font-mono text-sm break-all">{validator.pubkey}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{validator.name || "Unknown"}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Stake</p>
              <p className="font-semibold">{(validator.stake / 1e9).toFixed(2)} KLOD</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Blocks Produced</p>
              <p className="font-semibold">{validator.blocks_produced}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold">{validator.is_active ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>
      );
    }

    notFound();
  }

  // Show blockchain account info
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <div className="bg-muted p-4 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground mb-2">Pubkey</p>
        <p className="font-mono text-sm break-all">{account.pubkey}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="font-semibold">{(account.lamports / 1e9).toFixed(4)} KLOD</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Owner</p>
          <p className="font-mono text-xs truncate">{account.owner}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Executable</p>
          <p className="font-semibold">{account.executable ? "Yes" : "No"}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Rent Epoch</p>
          <p className="font-semibold">{account.rent_epoch}</p>
        </div>
      </div>
    </div>
  );
}
