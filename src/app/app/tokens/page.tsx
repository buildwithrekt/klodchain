"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Search,
  Upload,
  X,
  Twitter,
  Globe,
  MessageCircle,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import type { Token } from "@/types";
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
  scaleIn,
  gridItem,
} from "@/lib/animations";

type CreateStep = "form" | "confirming" | "deploying" | "success";

export default function TokensPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");

  // Wallet state
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("form");
  const [createdToken, setCreatedToken] = useState<Token | null>(null);
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
    fetchTokens();
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [sort]);

  const fetchWalletBalance = async (pubkey: string) => {
    if (!pubkey || !pubkey.startsWith("klod_")) return;
    try {
      const res = await fetch(`/api/wallet/${pubkey}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.wallet.balance);
      }
    } catch {
      // Silently fail - wallet might not exist
    }
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        limit: "50",
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/tokens?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTokens();
  };

  const handleCreateClick = () => {
    if (!walletPubkey) {
      toast.error("Please connect your wallet first");
      router.push("/wallet");
      return;
    }
    setModalOpen(true);
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

  const resetForm = () => {
    setFormData({
      name: "",
      symbol: "",
      description: "",
      twitter_url: "",
      website_url: "",
      telegram_url: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setCreateStep("form");
    setCreatedToken(null);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Only reset if we're closing and not in the middle of creation
      if (createStep === "form" || createStep === "success") {
        resetForm();
      }
    }
    setModalOpen(open);
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

    // Start the animated creation flow
    setCreateStep("confirming");

    // Simulate confirmation delay
    await new Promise((r) => setTimeout(r, 1500));
    setCreateStep("deploying");

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
        setCreatedToken(data.token);
        setCreateStep("success");
        toast.success(`${formData.name} created successfully!`);
      } else {
        toast.error(data.error || "Failed to create token");
        setCreateStep("form");
      }
    } catch (error) {
      console.error("Create token error:", error);
      toast.error("Failed to create token");
      setCreateStep("form");
    }
  };

  const handleViewToken = () => {
    if (createdToken) {
      setModalOpen(false);
      router.push(`/token/${createdToken.address}`);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "0";
    if (price < 0.000001) return price.toFixed(9);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatMarketCap = (mc: number) => {
    if (mc >= 1_000_000) return `${(mc / 1_000_000).toFixed(2)}M`;
    if (mc >= 1_000) return `${(mc / 1_000).toFixed(2)}K`;
    return mc.toFixed(2);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeInUp}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tokens</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Coins className="h-6 w-6 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold">Tokens</h1>
            <p className="text-muted-foreground text-sm">
              Create and trade memecoins on klodchain
            </p>
          </div>
        </div>

        {/* Create Button with Modal */}
        <Dialog open={modalOpen} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="gap-2" onClick={handleCreateClick}>
                <Plus className="h-4 w-4" />
                Create Token
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {createStep === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DialogHeader>
                    <DialogTitle>Create Token</DialogTitle>
                    <DialogDescription>
                      Launch your memecoin on klodchain for 1 KLOD
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Balance Display */}
                    <motion.div
                      className="p-3 rounded-lg bg-muted/50 flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <span className="text-sm text-muted-foreground">Your balance</span>
                      <span className="font-mono font-semibold">{walletBalance} KLOD</span>
                    </motion.div>

                    {/* Image Upload */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Label>Token Image</Label>
                      <div className="flex items-center gap-4">
                        <AnimatePresence mode="wait">
                          {imagePreview ? (
                            <motion.div
                              key="preview"
                              className="relative"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <div className="h-16 w-16 rounded-full overflow-hidden">
                                <Image
                                  src={imagePreview}
                                  alt="Preview"
                                  width={64}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <motion.button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <X className="h-3 w-3" />
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="upload"
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                              whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Upload className="h-5 w-5 text-muted-foreground" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <div className="text-xs text-muted-foreground">
                          <p>256x256px recommended</p>
                          <p>Max 5MB</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Name & Symbol */}
                    <motion.div
                      className="grid grid-cols-2 gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="My Token"
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
                          placeholder="TOKEN"
                          value={formData.symbol}
                          onChange={(e) =>
                            setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                          }
                          maxLength={10}
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell the world about your token..."
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={2}
                      />
                    </motion.div>

                    {/* Social Links */}
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label>Social Links (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          placeholder="https://twitter.com/..."
                          value={formData.twitter_url}
                          onChange={(e) =>
                            setFormData({ ...formData, twitter_url: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          placeholder="https://..."
                          value={formData.website_url}
                          onChange={(e) =>
                            setFormData({ ...formData, website_url: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          placeholder="https://t.me/..."
                          value={formData.telegram_url}
                          onChange={(e) =>
                            setFormData({ ...formData, telegram_url: e.target.value })
                          }
                        />
                      </div>
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={walletBalance < 1}
                      >
                        Create Token (1 KLOD)
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}

              {createStep === "confirming" && (
                <motion.div
                  key="confirming"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">Confirming...</h3>
                  <p className="text-muted-foreground text-sm">
                    Preparing your token deployment
                  </p>
                  <motion.div
                    className="mt-6 flex justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {createStep === "deploying" && (
                <motion.div
                  key="deploying"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">Deploying Token...</h3>
                  <p className="text-muted-foreground text-sm">
                    Creating ${formData.symbol} on klodchain
                  </p>
                  <motion.div
                    className="mt-6 max-w-xs mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {createStep === "success" && createdToken && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8 text-center"
                >
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Check className="w-10 h-10 text-green-500" />
                    </motion.div>
                  </motion.div>

                  <motion.h3
                    className="text-2xl font-bold mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    Token Created!
                  </motion.h3>

                  <motion.p
                    className="text-muted-foreground mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    ${createdToken.symbol} is now live on klodchain
                  </motion.p>

                  {/* Token Preview Card */}
                  <motion.div
                    className="bg-muted/50 rounded-xl p-4 mb-6 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {createdToken.image_url ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={createdToken.image_url}
                            alt={createdToken.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {createdToken.symbol?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{createdToken.name}</p>
                        <p className="text-sm text-muted-foreground">${createdToken.symbol}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-background/50 rounded p-2">
                      {createdToken.address}
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          resetForm();
                        }}
                      >
                        Create Another
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button className="w-full" onClick={handleViewToken}>
                        View Token
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </motion.div>
        </form>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="market_cap">Market Cap</SelectItem>
            <SelectItem value="volume">Volume 24h</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Token Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <motion.div variants={scaleIn}>
          <Card>
            <CardContent className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a memecoin on klodchain!
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={handleCreateClick}>Create Token</Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {tokens.filter(t => t && t.symbol && t.name).map((token, index) => (
            <motion.div
              key={token.address}
              variants={gridItem}
              custom={index}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link href={`/token/${token.address}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {token.image_url ? (
                        <motion.div
                          className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Image
                            src={token.image_url}
                            alt={token.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                        >
                          <span className="text-xl font-bold text-primary">
                            {token.symbol?.charAt(0) || "?"}
                          </span>
                        </motion.div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{token.name || "Unknown"}</h3>
                        <p className="text-sm text-muted-foreground">${token.symbol || "???"}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-mono">{formatPrice(token.price)} USDK</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-mono">{formatMarketCap(token.market_cap)} USDK</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Volume 24h</span>
                        <span className="font-mono">{formatMarketCap(token.volume_24h)} USDK</span>
                      </div>
                    </div>

                    {token.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {token.description}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {token.address.slice(0, 8)}...klod
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
