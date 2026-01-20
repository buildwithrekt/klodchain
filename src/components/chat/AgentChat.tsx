"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, AlertCircle, Volume2, VolumeX } from "lucide-react";

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
  { value: "validator", name: "VEX", role: "Block Producer", gender: "M" },
  { value: "architect", name: "ARC", role: "Network Design", gender: "F" },
  { value: "analyst", name: "SCAN", role: "Chain Monitor", gender: "M" },
  { value: "reviewer", name: "FLUX", role: "TX Processor", gender: "F" },
  { value: "consensus", name: "SYNC", role: "Consensus", gender: "M" },
  { value: "oracle", name: "SAGE", role: "Data Oracle", gender: "F" },
];

export function AgentChat() {
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("validator");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedAgentInfo = AGENTS.find((a) => a.value === selectedAgent)!;
  const messages = chatHistory[selectedAgent] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTextToSpeech = async (text: string, agentRole: string) => {
    if (!voiceEnabled) return;

    try {
      setIsPlayingAudio(true);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, agentRole }),
      });

      if (!response.ok) {
        console.error("TTS failed");
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("Error playing TTS:", err);
      setIsPlayingAudio(false);
    }
  };

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

      // Play TTS for agent response
      if (voiceEnabled) {
        playTextToSpeech(data.reply, selectedAgent);
      }
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

  const toggleVoice = () => {
    if (voiceEnabled && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingAudio(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Agent Tabs */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <Tabs value={selectedAgent} onValueChange={setSelectedAgent} className="flex-1">
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
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            className="ml-2 shrink-0 gap-2"
            onClick={toggleVoice}
          >
            {voiceEnabled ? (
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="text-xs">Voice {voiceEnabled ? "ON" : "OFF"}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">{selectedAgentInfo.name}</span> — {selectedAgentInfo.role}
          {voiceEnabled && (
            <span className="ml-2 text-primary">
              (Voice: {selectedAgentInfo.gender === "M" ? "Masculine" : "Feminine"})
            </span>
          )}
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
                {voiceEnabled && (
                  <p className="text-xs mt-2 text-primary">Voice mode enabled - agent will speak responses</p>
                )}
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
