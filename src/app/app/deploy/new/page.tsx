"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
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
  Check,
  EyeOff,
  Rocket,
} from "lucide-react";
import {
  AgentFormData,
  AgentSymbol,
  AgentClass,
  AgentDomain,
  AGENT_CLASSES,
  AGENT_DOMAINS,
  AGENT_SYMBOLS,
  PERSONALITY_TRAITS,
  TONE_OPTIONS,
} from "@/types/custom-agent";
import { createAgent } from "@/lib/agents/storage";
import { toast } from "sonner";

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

const STEPS = ["Identity", "Behavior", "API", "Launch"];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    symbol: "eye",
    agentClass: "sentinel",
    domain: "markets",
    traits: [],
    tone: "sharp",
    mission: "",
    apiKey: "",
  });

  const updateForm = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleTrait = (trait: string) => {
    const traits = formData.traits.includes(trait)
      ? formData.traits.filter((t) => t !== trait)
      : formData.traits.length < 3
      ? [...formData.traits, trait]
      : formData.traits;
    updateForm({ traits });
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.name.length >= 2 && formData.name.length <= 10;
      case 1:
        return formData.traits.length >= 1 && formData.mission.length >= 10;
      case 2:
        return formData.apiKey.startsWith("sk-");
      default:
        return true;
    }
  };

  const handleDeploy = () => {
    try {
      createAgent(formData);
      toast.success(`${formData.name.toUpperCase()} is now live`);
      router.push("/deploy");
    } catch {
      toast.error("Failed to deploy agent");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/deploy">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">New Agent</h1>
          <p className="text-xs text-muted-foreground">
            {STEPS[step]} · Step {step + 1}/4
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Step 1: Identity */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Codename
                </Label>
                <Input
                  placeholder="C3P, Gladax, Tori..."
                  value={formData.name}
                  onChange={(e) =>
                    updateForm({ name: e.target.value.toUpperCase().slice(0, 10) })
                  }
                  className="mt-2 font-mono text-lg tracking-wider"
                />
              </div>

              {/* Symbol */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Symbol
                </Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {AGENT_SYMBOLS.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => updateForm({ symbol })}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.symbol === symbol
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {SYMBOL_ICONS[symbol]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Class
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(Object.entries(AGENT_CLASSES) as [AgentClass, typeof AGENT_CLASSES[AgentClass]][]).map(
                    ([key, cls]) => (
                      <button
                        key={key}
                        onClick={() => updateForm({ agentClass: key })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.agentClass === key
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/30"
                        }`}
                      >
                        <span className={`font-medium ${cls.color}`}>
                          {cls.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cls.description}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Domain */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Domain
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(Object.entries(AGENT_DOMAINS) as [AgentDomain, typeof AGENT_DOMAINS[AgentDomain]][]).map(
                    ([key, domain]) => (
                      <button
                        key={key}
                        onClick={() => updateForm({ domain: key })}
                        className={`p-2 rounded-lg border text-left text-sm transition-all flex items-center gap-2 ${
                          formData.domain === key
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/30"
                        }`}
                      >
                        <span>{domain.emoji}</span>
                        <span>{domain.label}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Behavior */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Traits */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Traits (pick up to 3)
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PERSONALITY_TRAITS.map((trait) => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        formData.traits.includes(trait)
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:border-primary/30"
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Voice
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => updateForm({ tone: tone.value })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.tone === tone.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium">{tone.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tone.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mission */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Mission
                </Label>
                <Input
                  placeholder="e.g. Track whale movements and large transfers"
                  value={formData.mission}
                  onChange={(e) => updateForm({ mission: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What should this agent focus on?
                </p>
              </div>
            </div>
          )}

          {/* Step 3: API */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <p className="text-amber-400">
                  Your key stays in your browser. Never stored on our servers.
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Anthropic API Key
                </Label>
                <div className="relative mt-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-ant-..."
                    value={formData.apiKey}
                    onChange={(e) => updateForm({ apiKey: e.target.value })}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Get yours at{" "}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Launch */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-primary/30">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  {SYMBOL_ICONS[formData.symbol]}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${AGENT_CLASSES[formData.agentClass]?.color}`}>
                    {formData.name || "AGENT"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {AGENT_CLASSES[formData.agentClass]?.label} · {AGENT_DOMAINS[formData.domain]?.label}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-muted-foreground">Traits</span>
                  <span>{formData.traits.join(", ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-muted-foreground">Voice</span>
                  <span className="capitalize">{formData.tone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-muted-foreground">Mission</span>
                  <span className="text-right max-w-[200px] truncate">
                    {formData.mission}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">API</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    <Check className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleDeploy} className="gap-2">
            <Rocket className="h-4 w-4" />
            Deploy
          </Button>
        )}
      </div>
    </div>
  );
}
