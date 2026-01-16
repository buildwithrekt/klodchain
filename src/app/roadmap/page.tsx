import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Circle,
  Wallet,
  Coins,
  Vote,
  BarChart3,
  Rocket,
  Blocks
} from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap",
};

interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "upcoming";
  icon: React.ReactNode;
  items: {
    text: string;
    done: boolean;
  }[];
}

const roadmap: RoadmapPhase[] = [
  {
    phase: 1,
    title: "Core Infrastructure",
    description: "Foundation of the klodchain simulator",
    status: "completed",
    icon: <Blocks className="h-6 w-6" />,
    items: [
      { text: "6 autonomous KLOD agents", done: true },
      { text: "Real-time block production", done: true },
      { text: "Transaction processing (pending/confirmed/failed)", done: true },
      { text: "Block & Transaction explorer", done: true },
      { text: "Validators leaderboard", done: true },
      { text: "Epoch progress tracking", done: true },
      { text: "TPS counter", done: true },
    ],
  },
  {
    phase: 2,
    title: "Wallet & Accounts",
    description: "User interaction with the blockchain",
    status: "upcoming",
    icon: <Wallet className="h-6 w-6" />,
    items: [
      { text: "Faucet to get test KLOD", done: false },
      { text: "Account explorer page", done: false },
      { text: "Wallet connection (Phantom/Solflare)", done: false },
      { text: "Transaction history by account", done: false },
      { text: "Account balance tracking", done: false },
    ],
  },
  {
    phase: 3,
    title: "Tokens & Programs",
    description: "SPL-like token and NFT simulation",
    status: "upcoming",
    icon: <Coins className="h-6 w-6" />,
    items: [
      { text: "SPL-like token creation", done: false },
      { text: "NFT minting simulation", done: false },
      { text: "Token explorer", done: false },
      { text: "Program registry", done: false },
      { text: "Token transfers", done: false },
    ],
  },
  {
    phase: 4,
    title: "Staking & Governance",
    description: "Decentralized participation mechanics",
    status: "upcoming",
    icon: <Vote className="h-6 w-6" />,
    items: [
      { text: "Stake delegation to validators", done: false },
      { text: "Staking rewards distribution", done: false },
      { text: "Governance proposals", done: false },
      { text: "On-chain voting", done: false },
      { text: "Slashing simulation", done: false },
    ],
  },
  {
    phase: 5,
    title: "Analytics & API",
    description: "Data insights and developer tools",
    status: "upcoming",
    icon: <BarChart3 className="h-6 w-6" />,
    items: [
      { text: "Historical charts (TPS, volume)", done: false },
      { text: "Public API documentation", done: false },
      { text: "Webhooks for events", done: false },
      { text: "Data export (CSV/JSON)", done: false },
      { text: "Network health dashboard", done: false },
    ],
  },
  {
    phase: 6,
    title: "Advanced Features",
    description: "Next-level blockchain simulation",
    status: "upcoming",
    icon: <Rocket className="h-6 w-6" />,
    items: [
      { text: "DeFi simulation (AMM, swap)", done: false },
      { text: "Multi-cluster support", done: false },
      { text: "Unique agent personalities", done: false },
      { text: "Mobile application", done: false },
      { text: "Replay historical blocks", done: false },
    ],
  },
];

function StatusBadge({ status }: { status: RoadmapPhase["status"] }) {
  if (status === "completed") {
    return <Badge variant="success">Completed</Badge>;
  }
  if (status === "in-progress") {
    return <Badge variant="default" className="animate-pulse">In Progress</Badge>;
  }
  return <Badge variant="secondary">Upcoming</Badge>;
}

export default function RoadmapPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Roadmap</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The journey of klodchain from educational simulator to a full-featured
          blockchain experience. Built by autonomous AI agents.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />

        <div className="space-y-8">
          {roadmap.map((phase) => (
            <div key={phase.phase} className="relative">
              {/* Timeline dot */}
              <div className="absolute left-8 -translate-x-1/2 hidden md:flex">
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    phase.status === "completed"
                      ? "bg-green-500 border-green-500"
                      : phase.status === "in-progress"
                      ? "bg-primary border-primary animate-pulse"
                      : "bg-background border-muted-foreground"
                  }`}
                />
              </div>

              <Card className={`md:ml-16 ${phase.status === "completed" ? "border-green-500/30" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          phase.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {phase.icon}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Phase {phase.phase}: {phase.title}
                        </CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={phase.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2">
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={
                            item.done ? "text-foreground" : "text-muted-foreground"
                          }
                        >
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
