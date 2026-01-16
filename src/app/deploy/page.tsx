"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
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
  Power,
  Trash2,
  Activity,
  Bot,
  Cpu,
  Zap,
  MessageCircle,
} from "lucide-react";
import { CustomAgent, AGENT_CLASSES, AGENT_DOMAINS, AgentSymbol } from "@/types/custom-agent";
import {
  getCustomAgents,
  getActiveAgents,
  getTotalInteractions,
  toggleAgentActive,
  deleteAgent,
} from "@/lib/agents/storage";
import { CustomAgentFeed } from "@/components/deploy/CustomAgentFeed";
import { DeleteAgentModal, ChatAgentModal } from "@/components/deploy/AgentModals";

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

export default function DeployPage() {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [mounted, setMounted] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(null);

  useEffect(() => {
    setMounted(true);
    setAgents(getCustomAgents());
  }, []);

  const handleToggleActive = (id: string) => {
    toggleAgentActive(id);
    setAgents(getCustomAgents());
  };

  const openDeleteModal = (agent: CustomAgent) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedAgent) {
      deleteAgent(selectedAgent.id);
      setAgents(getCustomAgents());
      setDeleteModalOpen(false);
      setSelectedAgent(null);
    }
  };

  const openChatModal = (agent: CustomAgent) => {
    setSelectedAgent(agent);
    setChatModalOpen(true);
  };

  const activeCount = mounted ? getActiveAgents().length : 0;
  const totalInteractions = mounted ? getTotalInteractions() : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agent Factory</h1>
            <p className="text-sm text-muted-foreground">
              Deploy autonomous watchers on klodchain
            </p>
          </div>
        </div>
      </div>

      {/* Stats + CTA Row */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <Card className="col-span-3 p-4">
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">Deployed</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-3 p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-3 p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{totalInteractions}</p>
              <p className="text-xs text-muted-foreground">Thoughts</p>
            </div>
          </div>
        </Card>
        <div className="col-span-3">
          <Link href="/deploy/new" className="block h-full">
            <Card className="h-full p-4 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="flex items-center justify-center gap-2 h-full">
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">New Agent</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Agents List */}
        <div className="col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Your Agents
            </h2>
            <span className="text-xs text-muted-foreground">
              {agents.length} total
            </span>
          </div>

          {agents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Ghost className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-1">No agents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Deploy your first autonomous agent
                </p>
                <Link href="/deploy/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Agent
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`transition-all ${
                    agent.isActive
                      ? "border-l-2 border-l-primary"
                      : "opacity-50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`p-2.5 rounded-lg ${
                          agent.isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {SYMBOL_ICONS[agent.symbol]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              AGENT_CLASSES[agent.agentClass]?.color || "text-foreground"
                            }`}
                          >
                            {agent.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {AGENT_CLASSES[agent.agentClass]?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {AGENT_DOMAINS[agent.domain]?.emoji}{" "}
                          {agent.personality.mission}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right text-xs text-muted-foreground hidden sm:block">
                        <p>{agent.interactions} thoughts</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openChatModal(agent)}
                          title="Chat with agent"
                        >
                          <MessageCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(agent.id)}
                          title={agent.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power
                            className={`h-4 w-4 ${
                              agent.isActive
                                ? "text-green-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDeleteModal(agent)}
                          title="Delete agent"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Agent Feed */}
        <div className="col-span-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Live Feed
            </h2>
          </div>
          <CustomAgentFeed />
        </div>
      </div>

      {/* Modals */}
      <DeleteAgentModal
        agent={selectedAgent}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
      />
      <ChatAgentModal
        agent={selectedAgent}
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
      />
    </div>
  );
}
