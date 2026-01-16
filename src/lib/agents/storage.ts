// localStorage utilities for custom agents

import { CustomAgent, AgentFormData } from "@/types/custom-agent";

const STORAGE_KEY = "klodchain_custom_agents";
const API_KEYS_STORAGE_KEY = "klodchain_agent_api_keys";

export function getCustomAgents(): CustomAgent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse custom agents:", error);
    return [];
  }
}

export function saveCustomAgents(agents: CustomAgent[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch (error) {
    console.error("Failed to save custom agents:", error);
  }
}

export function getAgentApiKey(agentId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!stored) return null;
    const keys = JSON.parse(stored);
    return keys[agentId] || null;
  } catch (error) {
    console.error("Failed to get agent API key:", error);
    return null;
  }
}

export function saveAgentApiKey(agentId: string, apiKey: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    const keys = stored ? JSON.parse(stored) : {};
    keys[agentId] = apiKey;
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Failed to save agent API key:", error);
  }
}

export function removeAgentApiKey(agentId: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!stored) return;
    const keys = JSON.parse(stored);
    delete keys[agentId];
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Failed to remove agent API key:", error);
  }
}

export function createAgent(formData: AgentFormData): CustomAgent {
  const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const agent: CustomAgent = {
    id,
    name: formData.name.toUpperCase(),
    symbol: formData.symbol,
    agentClass: formData.agentClass,
    domain: formData.domain,
    personality: {
      traits: formData.traits,
      tone: formData.tone,
      mission: formData.mission,
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    interactions: 0,
  };

  // Save the agent
  const agents = getCustomAgents();
  agents.push(agent);
  saveCustomAgents(agents);

  // Save the API key separately in localStorage (never sent to server for storage)
  if (formData.apiKey) {
    saveAgentApiKey(id, formData.apiKey);
  }

  return agent;
}

export function updateAgent(id: string, updates: Partial<CustomAgent>): CustomAgent | null {
  const agents = getCustomAgents();
  const index = agents.findIndex(a => a.id === id);

  if (index === -1) return null;

  agents[index] = { ...agents[index], ...updates };
  saveCustomAgents(agents);

  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const agents = getCustomAgents();
  const filtered = agents.filter(a => a.id !== id);

  if (filtered.length === agents.length) return false;

  saveCustomAgents(filtered);
  removeAgentApiKey(id);

  return true;
}

export function toggleAgentActive(id: string): CustomAgent | null {
  const agents = getCustomAgents();
  const agent = agents.find(a => a.id === id);

  if (!agent) return null;

  return updateAgent(id, { isActive: !agent.isActive });
}

export function incrementAgentInteractions(id: string): void {
  const agents = getCustomAgents();
  const agent = agents.find(a => a.id === id);

  if (agent) {
    updateAgent(id, {
      interactions: agent.interactions + 1,
      lastActiveAt: new Date().toISOString(),
    });
  }
}

export function getActiveAgents(): CustomAgent[] {
  return getCustomAgents().filter(a => a.isActive);
}

export function getTotalInteractions(): number {
  return getCustomAgents().reduce((sum, agent) => sum + agent.interactions, 0);
}
