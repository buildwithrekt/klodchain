"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import {
  Coins,
  Upload,
  X,
  Twitter,
  Globe,
  MessageCircle,
  Loader2,
  AlertCircle,
  Wallet,
  Sparkles,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function CreateTokenPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "uploading" | "signing" | "confirming">("form");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    twitter_url: "",
    website_url: "",
    telegram_url: "",
    initial_buy_sol: "0.01", // Default dev buy
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast.error("Name and symbol are required");
      return;
    }

    if (!imageFile) {
      toast.error("Token image is required");
      return;
    }

    setLoading(true);
    setStep("form");

    try {
      // 1. Upload metadata and get transaction + mint keypair from API
      setStep("uploading");
      toast.info("Uploading metadata to IPFS...");

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("symbol", formData.symbol);
      submitData.append("description", formData.description);
      submitData.append("twitter_url", formData.twitter_url);
      submitData.append("website_url", formData.website_url);
      submitData.append("telegram_url", formData.telegram_url);
      submitData.append("creator_wallet", publicKey.toBase58());
      submitData.append("image", imageFile);
      submitData.append("initial_buy_sol", formData.initial_buy_sol);

      const res = await fetch("/api/tokens/create", {
        method: "POST",
        body: submitData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create token");
      }

      const { transaction: txBase64, mint, mintSecretKey } = data;

      // 2. Reconstruct mint keypair from server response
      const mintSecretKeyBytes = Buffer.from(mintSecretKey, "base64");
      const mintKeypair = Keypair.fromSecretKey(mintSecretKeyBytes);

      // 3. Deserialize transaction
      setStep("signing");
      toast.info("Please sign the transaction in your wallet...");

      const txBuffer = Buffer.from(txBase64, "base64");
      const transaction = VersionedTransaction.deserialize(txBuffer);

      // 4. Sign with mint keypair
      transaction.sign([mintKeypair]);

      // 5. Sign with user wallet
      const signedTx = await signTransaction(transaction);

      // 6. Send transaction to Solana
      setStep("confirming");
      toast.info("Sending transaction to Solana...");

      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.info(`Transaction sent: ${signature.slice(0, 8)}...`);

      // 7. Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        throw new Error("Transaction failed on chain");
      }

      // 8. Confirm with our backend
      await fetch(`/api/tokens/${mint}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      toast.success(`${formData.name} created successfully!`, {
        description: `Address: ...${mint.slice(-8)}`,
      });

      router.push(`/app/token/${mint}`);
    } catch (error: unknown) {
      console.error("Create token error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create token";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setStep("form");
    }
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-6 space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app/tokens">Tokens</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <Coins className="h-6 w-6 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold">Launch Token on Klodchain</h1>
          <p className="text-muted-foreground text-sm">
            Create a real memecoin on Solana mainnet
          </p>
        </div>
      </motion.div>

      {/* Wallet Warning */}
      {!connected && (
        <motion.div variants={staggerItem}>
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium">Wallet not connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your Solana wallet to create a token.
                  </p>
                </div>
                <Button onClick={() => setVisible(true)} variant="outline" size="sm">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div variants={staggerItem}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Real token on Klodchain</p>
                <p className="text-sm text-muted-foreground">
                  1 billion supply, bonding curve pricing, tradeable on any bots
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  ~{(0.02 + parseFloat(formData.initial_buy_sol || "0")).toFixed(3)} SOL
                </p>
                <p className="text-xs text-muted-foreground">
                  Fee + Initial Buy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form */}
      <motion.div variants={staggerItem}>
        <form onSubmit={handleSubmit}>
          <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <CardDescription>
              Fill in the details for your new token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Token Image *</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="text-sm text-muted-foreground">
                  <p>Recommended: 256x256px</p>
                  <p>Max size: 5MB</p>
                </div>
              </div>
            </div>

            {/* Name & Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Token"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  maxLength={32}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="AWESOME"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell the world about your token..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Initial Dev Buy */}
            <div className="space-y-2">
              <Label htmlFor="initial_buy">Initial Buy (SOL) *</Label>
              <Input
                id="initial_buy"
                type="number"
                placeholder="0.01"
                value={formData.initial_buy_sol}
                onChange={(e) =>
                  setFormData({ ...formData, initial_buy_sol: e.target.value })
                }
                min="0.001"
                max="50"
                step="0.001"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 0.001 SOL. This creates initial liquidity and enables price discovery.
              </p>
            </div>

            {/* Klodchain Address Info */}
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Klodchain Address</p>
                <p className="text-sm text-muted-foreground">
                  Your token address will end in &quot;klod&quot;
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label>Social Links (optional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="https://twitter.com/yourtoken"
                    value={formData.twitter_url}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter_url: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="https://yourtoken.com"
                    value={formData.website_url}
                    onChange={(e) =>
                      setFormData({ ...formData, website_url: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="https://t.me/yourtoken"
                    value={formData.telegram_url}
                    onChange={(e) =>
                      setFormData({ ...formData, telegram_url: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-500">Real Transaction</p>
                  <p className="text-muted-foreground">
                    This will create a real token on Solana mainnet via Klodchain.
                    Make sure you have SOL in your wallet for transaction fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href="/app/tokens" className="flex-1">
                <Button variant="outline" className="w-full" type="button" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !connected}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {step === "uploading" && "Uploading..."}
                    {step === "signing" && "Sign in wallet..."}
                    {step === "confirming" && "Confirming..."}
                    {step === "form" && "Processing..."}
                  </>
                ) : connected ? (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Create Token
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}
