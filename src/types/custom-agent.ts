// Custom agent types for user-deployed agents

export type AgentSymbol =
  | "eye"
  | "flame"
  | "compass"
  | "flask"
  | "lock"
  | "crystal"
  | "link"
  | "ghost"
  | "radar"
  | "scroll"
  | "anchor"
  | "prism";

export type AgentClass =
  | "sentinel"
  | "scribe"
  | "pathfinder"
  | "alchemist"
  | "warden"
  | "prophet"
  | "weaver"
  | "phantom";

export type AgentDomain =
  | "markets"
  | "security"
  | "governance"
  | "collectibles"
  | "protocols"
  | "economics"
  | "bridges"
  | "intelligence"
  | "social"
  | "infrastructure";

export interface CustomAgent {
  id: string;
  name: string;
  symbol: AgentSymbol;
  agentClass: AgentClass;
  domain: AgentDomain;
  personality: {
    traits: string[];
    tone: "sharp" | "calm" | "cryptic" | "direct";
    mission: string;
  };
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string;
  interactions: number;
}

export interface AgentFormData {
  name: string;
  symbol: AgentSymbol;
  agentClass: AgentClass;
  domain: AgentDomain;
  traits: string[];
  tone: "sharp" | "calm" | "cryptic" | "direct";
  mission: string;
  apiKey: string;
}

export const AGENT_CLASSES: Record<AgentClass, { label: string; description: string; color: string; icon: string }> = {
  sentinel: {
    label: "Sentinel",
    description: "Watches the chain. Never sleeps.",
    color: "text-cyan-400",
    icon: "eye"
  },
  scribe: {
    label: "Scribe",
    description: "Records everything. Forgets nothing.",
    color: "text-amber-400",
    icon: "scroll"
  },
  pathfinder: {
    label: "Pathfinder",
    description: "Finds opportunities others miss.",
    color: "text-emerald-400",
    icon: "compass"
  },
  alchemist: {
    label: "Alchemist",
    description: "Transforms data into insights.",
    color: "text-purple-400",
    icon: "flask"
  },
  warden: {
    label: "Warden",
    description: "Guards assets. Questions everything.",
    color: "text-red-400",
    icon: "lock"
  },
  prophet: {
    label: "Prophet",
    description: "Sees patterns before they form.",
    color: "text-indigo-400",
    icon: "crystal"
  },
  weaver: {
    label: "Weaver",
    description: "Connects chains. Bridges worlds.",
    color: "text-blue-400",
    icon: "link"
  },
  phantom: {
    label: "Phantom",
    description: "Operates in shadows. Surfaces intel.",
    color: "text-zinc-400",
    icon: "ghost"
  },
};

export const AGENT_DOMAINS: Record<AgentDomain, { label: string; emoji: string }> = {
  markets: { label: "Markets & Trading", emoji: "📈" },
  security: { label: "Security & Threats", emoji: "🛡️" },
  governance: { label: "Governance & DAOs", emoji: "🏛️" },
  collectibles: { label: "NFTs & Collectibles", emoji: "🎨" },
  protocols: { label: "Protocols & dApps", emoji: "⚙️" },
  economics: { label: "Tokenomics", emoji: "💎" },
  bridges: { label: "Cross-chain", emoji: "🌉" },
  intelligence: { label: "On-chain Intel", emoji: "🔍" },
  social: { label: "Social & Community", emoji: "👥" },
  infrastructure: { label: "Infrastructure", emoji: "🏗️" },
};

export const AGENT_SYMBOLS: AgentSymbol[] = [
  "eye",
  "flame",
  "compass",
  "flask",
  "lock",
  "crystal",
  "link",
  "ghost",
  "radar",
  "scroll",
  "anchor",
  "prism",
];

export const PERSONALITY_TRAITS = [
  "Vigilant",
  "Analytical",
  "Ruthless",
  "Patient",
  "Curious",
  "Paranoid",
  "Methodical",
  "Intuitive",
  "Relentless",
  "Skeptical",
  "Precise",
  "Adaptive",
];

export const TONE_OPTIONS = [
  { value: "sharp" as const, label: "Sharp", description: "Quick, cutting observations" },
  { value: "calm" as const, label: "Calm", description: "Measured, deliberate analysis" },
  { value: "cryptic" as const, label: "Cryptic", description: "Mysterious, thought-provoking" },
  { value: "direct" as const, label: "Direct", description: "No fluff, just facts" },
];
