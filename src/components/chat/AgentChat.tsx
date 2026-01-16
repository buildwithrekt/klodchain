"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  agentName?: string;
  timestamp: Date;
}

interface ChatHistory {
  [agentKey: string]: Message[];
}

const AGENTS = [
  { value: "validator", name: "VEX", role: "Block Producer" },
  { value: "architect", name: "ARC", role: "Network Design" },
  { value: "analyst", name: "SCAN", role: "Chain Monitor" },
  { value: "reviewer", name: "FLUX", role: "TX Processor" },
  { value: "consensus", name: "SYNC", role: "Consensus Engine" },
  { value: "oracle", name: "SAGE", role: "Data Oracle" },
];

export function AgentChat() {
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("validator");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedAgentInfo = AGENTS.find((a) => a.value === selectedAgent)!;
  const messages = chatHistory[selectedAgent] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), userMessage],
    }));
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          agentRole: selectedAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: data.reply,
        agentName: data.agent.name,
        timestamp: new Date(),
      };

      setChatHistory((prev) => ({
        ...prev,
        [selectedAgent]: [...(prev[selectedAgent] || []), agentMessage],
      }));
    } catch (err) {
      setError("Failed to connect to agent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Agent Tabs */}
      <div className="border-b p-3">
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent}>
          <TabsList className="grid grid-cols-6 w-full">
            {AGENTS.map((agent) => (
              <TabsTrigger
                key={agent.value}
                value={agent.value}
                className="text-xs"
              >
                {agent.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="text-primary font-medium">{selectedAgentInfo.name}</span> — {selectedAgentInfo.role}
        </p>
      </div>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Start a conversation with {selectedAgentInfo.name}</p>
                <p className="text-xs mt-1">Ask about the network, blocks, transactions...</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "agent" && (
                    <p className="text-xs font-medium mb-1 text-primary">
                      {msg.agentName}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error / Rate limit */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedAgentInfo.name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
