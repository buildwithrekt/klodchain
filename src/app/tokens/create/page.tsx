"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";

export default function CreateTokenPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    twitter_url: "",
    website_url: "",
    telegram_url: "",
  });

  useEffect(() => {
    const pubkey = localStorage.getItem("klodchain_wallet");
    if (pubkey) {
      setWalletPubkey(pubkey);
      fetchWalletBalance(pubkey);
    }
  }, []);

  const fetchWalletBalance = async (pubkey: string) => {
    try {
      const res = await fetch(`/api/wallet/${pubkey}`);
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

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

    if (!walletPubkey) {
      toast.error("Please connect your wallet first");
      router.push("/wallet");
      return;
    }

    if (walletBalance < 1) {
      toast.error("Insufficient balance. Token creation costs 1 KLOD");
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast.error("Name and symbol are required");
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("symbol", formData.symbol);
      submitData.append("description", formData.description);
      submitData.append("twitter_url", formData.twitter_url);
      submitData.append("website_url", formData.website_url);
      submitData.append("telegram_url", formData.telegram_url);
      submitData.append("creator_pubkey", walletPubkey);
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const res = await fetch("/api/tokens/create", {
        method: "POST",
        body: submitData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${formData.name} created successfully!`);
        router.push(`/token/${data.token.address}`);
      } else {
        toast.error(data.error || "Failed to create token");
      }
    } catch (error) {
      console.error("Create token error:", error);
      toast.error("Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tokens">Tokens</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Token</h1>
          <p className="text-muted-foreground text-sm">
            Launch your memecoin on klodchain
          </p>
        </div>
      </div>

      {/* Wallet Warning */}
      {!walletPubkey && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Wallet not connected</p>
                <p className="text-sm text-muted-foreground">
                  Please{" "}
                  <Link href="/wallet" className="text-primary hover:underline">
                    connect your wallet
                  </Link>{" "}
                  to create a token.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creation Cost */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Creation Cost</p>
              <p className="text-sm text-muted-foreground">
                1 billion tokens supply, bonding curve pricing
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">1 KLOD</p>
              {walletPubkey && (
                <p className="text-sm text-muted-foreground">
                  Balance: {walletBalance} KLOD
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
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
              <Label>Token Image</Label>
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
              />
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
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href="/tokens" className="flex-1">
                <Button variant="outline" className="w-full" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !walletPubkey || walletBalance < 1}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Token (1 KLOD)"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
