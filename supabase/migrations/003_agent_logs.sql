-- Migration: Add agent_logs table for AI-generated agent thoughts
-- Each agent has a unique personality and comments on network events

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  agent_name TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX idx_agent_logs_agent_id ON agent_logs(agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "agent_logs_public_read" ON agent_logs
  FOR SELECT USING (true);

-- Only service role can write
CREATE POLICY "agent_logs_service_write" ON agent_logs
  FOR ALL USING (auth.role() = 'service_role');
