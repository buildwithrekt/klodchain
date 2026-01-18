"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Blocks,
  Zap,
  Users,
  Activity,
  ArrowRight,
  Play,
  Terminal,
  Cpu,
  Network,
  Clock,
  BarChart3,
  Eye,
  Wallet,
  Droplets,
  TrendingUp,
  Send,
  Coins,
  Search,
} from "lucide-react";

// Floating blocks animation
function FloatingBlocks() {
  const blocks = [
    { left: "5%", top: "15%" },
    { left: "15%", top: "60%" },
    { right: "10%", top: "20%" },
    { right: "20%", top: "70%" },
    { left: "40%", top: "10%" },
    { right: "35%", bottom: "15%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {blocks.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          style={pos}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
}

// Live block animation
function LiveBlockFeed() {
  const [blocks, setBlocks] = useState<{ slot: number; hash: string; txCount: number; validator: string }[]>([]);

  useEffect(() => {
    const generateHash = () => {
      return Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    };

    const validators = ["KLOD-1", "KLOD-2", "KLOD-3", "KLOD-4", "KLOD-5", "KLOD-6"];

    let slot = 156789432;
    const interval = setInterval(() => {
      setBlocks((prev) => {
        const newBlock = {
          slot: slot++,
          hash: generateHash(),
          txCount: Math.floor(Math.random() * 12) + 1,
          validator: validators[Math.floor(Math.random() * validators.length)],
        };
        return [newBlock, ...prev.slice(0, 3)];
      });
    }, 2000);

    // Initial blocks
    setBlocks(
      Array.from({ length: 3 }, (_, i) => ({
        slot: slot++,
        hash: generateHash(),
        txCount: Math.floor(Math.random() * 12) + 1,
        validator: validators[Math.floor(Math.random() * validators.length)],
      }))
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <motion.div
          key={block.slot}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1 - i * 0.2, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex items-center justify-between gap-4 p-2 rounded-lg bg-muted/50 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center"
            >
              <Blocks className="w-4 h-4 text-primary" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-primary font-medium">
                #{block.slot.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {block.hash}...
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>{block.txCount} txs</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span className="font-medium">{block.validator}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Animated text character by character
function AnimatedTitle() {
  const line1 = "Autonomous";
  const line2 = "AI-powered";
  const line3 = "blockchain.";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.2,
      },
    },
  };

  const charVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.h1
      className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <span className="block">
        {line1.split("").map((char, i) => (
          <motion.span key={i} variants={charVariants}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
      <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
        {line2.split("").map((char, i) => (
          <motion.span key={i} variants={charVariants}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
      <span className="block text-muted-foreground/80">
        {line3.split("").map((char, i) => (
          <motion.span key={i} variants={charVariants}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </motion.h1>
  );
}

// Interactive How It Works Demo
function HowItWorksDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const walletAddress = "klod_7xQk4mNp...z9fRm";

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className="grid lg:grid-cols-2 gap-12 items-center"
    >
      {/* Steps */}
      <motion.div variants={fadeInUp} className="space-y-4">
        {[
          {
            title: "Create your wallet",
            description: "One click to generate your Klodchain wallet. No seed phrase needed.",
            icon: Wallet,
          },
          {
            title: "Save your private key",
            description: "Your key is shown once. Save it somewhere safe.",
            icon: Eye,
          },
          {
            title: "Claim free $USDK",
            description: "Get $130 USDK every 24 hours from the faucet.",
            icon: Droplets,
          },
          {
            title: "Start transacting",
            description: "Send tokens, create your own coin, explore the blockchain.",
            icon: Send,
          },
        ].map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
              step === index
                ? "bg-primary/5 border-primary/30"
                : "border-transparent opacity-40"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                step === index ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Animated UI Preview */}
      <motion.div variants={fadeInUp} className="relative">
        <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
          {/* Window Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">app.klodchain.com/wallet</span>
          </div>

          {/* Fixed height container to prevent layout shifts */}
          <div className="relative h-[320px] p-6">
            {/* Step 0: Create Wallet */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto rotate-12">
                  <div className="w-10 h-10 rounded-xl border-2 border-primary/50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">klodchain Wallet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create or import your wallet</p>
                </div>
                <div className="space-y-3 max-w-xs mx-auto">
                  <motion.button
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium"
                    animate={step === 0 ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Create New Wallet
                  </motion.button>
                  <button className="w-full py-3 rounded-lg border text-sm font-medium">
                    Import Existing Wallet
                  </button>
                </div>
              </div>
            </div>

            {/* Step 1: Private Key */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <Eye className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Save Your Private Key</span>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">This is the only time you will see this:</p>
                  <div className="font-mono text-xs break-all bg-background/50 rounded p-2">
                    a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  <motion.button
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    animate={step === 1 ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    I Saved It
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Step 2: Faucet Ready */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">$0.00 <span className="text-lg text-muted-foreground">USDK</span></p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{walletAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                    Send
                  </button>
                  <motion.button
                    className="py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2"
                    animate={step === 2 ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Claim Faucet
                  </motion.button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    <span className="text-sm">$130 USDK / 24h</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Ready
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Dashboard with balance */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">$130.00 <span className="text-lg text-muted-foreground">USDK</span></p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{walletAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                    Send
                  </button>
                  <button className="py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    23h 45m
                  </button>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Transactions</p>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Faucet Claim</p>
                        <p className="text-xs text-muted-foreground">2s ago</p>
                      </div>
                    </div>
                    <span className="text-green-500 font-mono text-sm font-medium">+$130.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -z-10 -top-4 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -z-10 -bottom-4 -left-4 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      </motion.div>
    </motion.div>
  );
}

// Create Memecoin Demo
function CreateMemecoinDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className="grid lg:grid-cols-2 gap-12 items-center"
    >
      {/* Animated UI Preview */}
      <motion.div variants={fadeInUp} className="relative order-2 lg:order-1">
        <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
          {/* Window Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">app.klodchain.com/tokens/create</span>
          </div>

          {/* Fixed height container */}
          <div className="relative h-[380px] p-6">
            {/* Step 0: Create Form */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create Token</h3>
                    <p className="text-xs text-muted-foreground">Launch your memecoin on klodchain</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.div
                    className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
                    animate={step === 0 ? { borderColor: ["hsl(var(--muted-foreground) / 0.3)", "hsl(var(--primary) / 0.5)", "hsl(var(--muted-foreground) / 0.3)"] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</label>
                        <div className="mt-1 px-3 py-2 rounded-lg border bg-background text-sm">DOGE AI</div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Symbol</label>
                        <div className="mt-1 px-3 py-2 rounded-lg border bg-background text-sm font-mono">$DOGEAI</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</label>
                  <div className="mt-1 px-3 py-2 rounded-lg border bg-background text-sm text-muted-foreground">
                    The smartest doge on the blockchain...
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Creation cost</span>
                  <span className="font-mono font-medium">1 KLOD</span>
                </div>
              </div>
            </div>

            {/* Step 1: Confirming */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <motion.div
                  className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary"
                  animate={step === 1 ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div>
                  <h3 className="font-semibold">Creating Token...</h3>
                  <p className="text-sm text-muted-foreground mt-1">Deploying bonding curve</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Processing on Klodchain
                </div>
              </div>
            </div>

            {/* Step 2: Success */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <motion.div
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={step === 2 ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <div>
                  <h3 className="font-semibold text-green-500">Token Created!</h3>
                  <p className="text-sm text-muted-foreground mt-1">$DOGEAI is now live</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-4 py-2">
                  <p className="text-xs text-muted-foreground">Contract Address</p>
                  <p className="font-mono text-xs">klod_doge7xQk4mNp...9fRm</p>
                </div>
              </div>
            </div>

            {/* Step 3: Token Card */}
            <div
              className={`absolute inset-6 transition-all duration-300 ${
                step === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Token</p>
                <div className="rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                      D
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">DOGE AI</h4>
                        <span className="text-xs text-muted-foreground font-mono">$DOGEAI</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">The smartest doge on the blockchain</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Price</p>
                      <p className="font-mono text-sm font-medium">$0.001</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Market Cap</p>
                      <p className="font-mono text-sm font-medium">$1.0K</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Holders</p>
                      <p className="font-mono text-sm font-medium">1</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 rounded-lg border text-sm font-medium">Share</button>
                  <button className="py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Buy $DOGEAI</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -z-10 -top-4 -left-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -z-10 -bottom-4 -right-4 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      </motion.div>

      {/* Features */}
      <motion.div variants={fadeInUp} className="space-y-6 order-1 lg:order-2">
        <div className="space-y-4">
          {[
            {
              icon: TrendingUp,
              title: "Bonding Curve Pricing",
              description: "Price automatically adjusts based on supply. Early buyers get better prices.",
            },
            {
              icon: Zap,
              title: "Instant Deployment",
              description: "Your token is live in seconds. No smart contract coding needed.",
            },
            {
              icon: Users,
              title: "Built-in Liquidity",
              description: "The bonding curve acts as an automatic market maker. Always tradeable.",
            },
            {
              icon: Eye,
              title: "Full Transparency",
              description: "All trades visible on the explorer. Track holders and volume in real-time.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="https://app.klodchain.com/tokens/create">
              Create Your Token
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const FEATURES = [
  {
    icon: Wallet,
    title: "Create Your Wallet",
    description: "Connect with Phantom or Solflare and get your Klodchain wallet instantly. Your gateway to the AI-powered blockchain.",
  },
  {
    icon: Droplets,
    title: "USDk Faucet",
    description: "Claim free USDk, our upcoming stablecoin. Test transactions without spending real money.",
  },
  {
    icon: TrendingUp,
    title: "Launch Tokens",
    description: "Create your own token with a bonding curve. Watch the price evolve as people buy and sell.",
  },
  {
    icon: Send,
    title: "Instant Transfers",
    description: "Send tokens to any Klodchain wallet. Transactions confirm in milliseconds, powered by AI validators.",
  },
  {
    icon: Search,
    title: "Full Transparency",
    description: "Every transaction appears in real-time. Explore blocks, accounts, and token movements live.",
  },
  {
    icon: Coins,
    title: "Token Ecosystem",
    description: "Trade tokens, check holders, and track market caps. A complete DeFi playground on Klodchain.",
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-[calc(100vh)] flex items-center justify-center overflow-hidden"
      >
        <GridBackground />
        <FloatingBlocks />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="max-w-6xl mx-auto px-4 py-24 md:py-32 relative z-10"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center text-center gap-8"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">6 AI Agents Online</span>
            </motion.div>

            {/* Main Title */}
            <AnimatedTitle />

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              Autonomous AI agents produce blocks, process transactions,
              and run the network. No humans required.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 mt-4"
            >
              <Button
                size="lg"
                className="text-base px-8 gap-2 group"
                asChild
              >
                <Link href="https://app.klodchain.com">
                  Launch Explorer
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 gap-2"
                asChild
              >
                <Link href="#features">
                  <Play className="h-4 w-4" />
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Live Preview */}
            <motion.div
              variants={fadeInUp}
              className="mt-12 w-full max-w-xl"
            >
              <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-2xl shadow-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">klodchain — live blocks</span>
                </div>
                <LiveBlockFeed />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Features</span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Everything you need to
              <br />
              <span className="text-muted-foreground">understand Klodchain</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              A complete simulation environment that mirrors Klodchain&apos;s architecture,
              from Proof of History to account state management.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="h-full rounded-2xl border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 mb-4">
              <Network className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">How It Works</span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Get started in seconds
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              Connect your wallet and start exploring the AI-powered blockchain.
            </motion.p>
          </motion.div>

          {/* Interactive Demo */}
          <HowItWorksDemo />
        </div>
      </section>

      {/* Create Memecoins Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 mb-4">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Experimental</span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Create KLOD Memecoins
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground max-w-2xl mx-auto text-lg"
            >
              Launch your own token with automatic bonding curve pricing.
              No coding required, just 1 KLOD to deploy.
            </motion.p>
          </motion.div>

          <CreateMemecoinDemo />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 md:p-12 text-center overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
              >
                <Blocks className="h-8 w-8 text-primary" />
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to explore?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
                Jump into the live simulation and see how Klodchain produces blocks,
                processes transactions, and maintains consensus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-base px-8 gap-2 group"
                  asChild
                >
                  <Link href="https://app.klodchain.com">
                    Launch Explorer
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8"
                  asChild
                >
                  <Link href="/roadmap">View Roadmap</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
