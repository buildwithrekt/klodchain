"use client";

import { motion } from "framer-motion";
import { AgentChat } from "@/components/chat/AgentChat";
import { MessageCircle } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function ChatPage() {
  return (
    <motion.div
      className="container mx-auto px-4 py-6 max-w-3xl"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
        <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
          <MessageCircle className="h-6 w-6 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold">Talk to an Agent</h1>
          <p className="text-sm text-muted-foreground">
            Chat directly with klodchain's AI agents
          </p>
        </div>
      </motion.div>

      {/* Chat */}
      <motion.div variants={staggerItem}>
        <AgentChat />
      </motion.div>

      {/* Info */}
      <motion.div variants={staggerItem} className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by Claude. Rate limited to 5 messages per minute.
        </p>
      </motion.div>
    </motion.div>
  );
}
