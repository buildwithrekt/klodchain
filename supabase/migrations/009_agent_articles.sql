-- Agent articles table
CREATE TABLE IF NOT EXISTS agent_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thread_content JSONB, -- Array of tweets for thread format
  topic TEXT, -- market_analysis, token_spotlight, network_stats, whale_alert, etc.
  related_token_address TEXT,
  metrics JSONB, -- Stats used to generate the article
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_agent_articles_agent ON agent_articles(agent_name);
CREATE INDEX idx_agent_articles_created ON agent_articles(created_at DESC);
CREATE INDEX idx_agent_articles_topic ON agent_articles(topic);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_articles;
