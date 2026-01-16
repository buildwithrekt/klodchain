"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  Flame,
  Compass,
  FlaskConical,
  Lock,
  Gem,
  Link2,
  Ghost,
  Radar,
  ScrollText,
  Anchor,
  Sparkles,
} from "lucide-react";
import { CustomAgent, AgentSymbol, AGENT_CLASSES, AGENT_DOMAINS } from "@/types/custom-agent";
import { getAgentApiKey } from "@/lib/agents/storage";

const SYMBOL_ICONS: Record<AgentSymbol, React.ReactNode> = {
  eye: <Eye className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  compass: <Compass className="h-5 w-5" />,
  flask: <FlaskConical className="h-5 w-5" />,
  lock: <Lock className="h-5 w-5" />,
  crystal: <Gem className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
  ghost: <Ghost className="h-5 w-5" />,
  radar: <Radar className="h-5 w-5" />,
  scroll: <ScrollText className="h-5 w-5" />,
  anchor: <Anchor className="h-5 w-5" />,
  prism: <Sparkles className="h-5 w-5" />,
};

// Delete Modal
interface DeleteModalProps {
  agent: CustomAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteAgentModal({
  agent,
  open,
  onOpenChange,
  onConfirm,
}: DeleteModalProps) {
  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Terminate Agent</DialogTitle>
              <DialogDescription>
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              {SYMBOL_ICONS[agent.symbol]}
            </div>
            <div>
              <p className={`font-bold ${AGENT_CLASSES[agent.agentClass]?.color}`}>
                {agent.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {AGENT_CLASSES[agent.agentClass]?.label} · {agent.interactions} thoughts
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Are you sure you want to terminate <strong>{agent.name}</strong>?
            All configuration and history will be lost.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Terminate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Chat Modal
interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

interface ChatModalProps {
  agent: CustomAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatAgentModal({ agent, open, onOpenChange }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset messages when modal opens with new agent
  useEffect(() => {
    if (open && agent) {
      setMessages([]);
      setInput("");
    }
  }, [open, agent?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !agent || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    const apiKey = getAgentApiKey(agent.id);
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "No API key configured for this agent." },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/agents/custom-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, apiKey, message: userMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: "Failed to respond. Check your API key." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Connection error." },
      ]);
    }

    setIsLoading(false);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {SYMBOL_ICONS[agent.symbol]}
            </div>
            <div>
              <DialogTitle className={AGENT_CLASSES[agent.agentClass]?.color}>
                {agent.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {AGENT_CLASSES[agent.agentClass]?.label}
                </Badge>
                <span>{AGENT_DOMAINS[agent.domain]?.emoji} {AGENT_DOMAINS[agent.domain]?.label}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {agent.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mission: {agent.personality.mission}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2">
          <Input
            placeholder={`Message ${agent.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={isLoading}
          />
          <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
