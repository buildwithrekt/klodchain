import { AgentChat } from "@/components/chat/AgentChat";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Talk to an Agent</h1>
          <p className="text-sm text-muted-foreground">
            Chat directly with klodchain's AI agents
          </p>
        </div>
      </div>

      {/* Chat */}
      <AgentChat />

      {/* Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by Claude. Rate limited to 5 messages per minute.
        </p>
      </div>
    </div>
  );
}
