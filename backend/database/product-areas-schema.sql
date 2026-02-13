-- Product Areas Schema
-- Higher-level categorization on top of existing categories

-- Product Areas table
CREATE TABLE IF NOT EXISTS product_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  keywords TEXT, -- JSON array of keywords for AI matching
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for posts and product areas (many-to-many)
CREATE TABLE IF NOT EXISTS post_product_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  product_area_id UUID NOT NULL REFERENCES product_areas(id) ON DELETE CASCADE,
  confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, product_area_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_product_areas_post_id ON post_product_areas(post_id);
CREATE INDEX IF NOT EXISTS idx_post_product_areas_product_area_id ON post_product_areas(product_area_id);
CREATE INDEX IF NOT EXISTS idx_product_areas_active ON product_areas(is_active);

-- Insert 19 product areas
INSERT INTO product_areas (name, description, sort_order, keywords) VALUES
('Knowledge & Retrieval', 'Knowledge sources, file upload, grounding, SharePoint, RAG pipelines, chunking, embedding', 1, '["knowledge", "source", "grounding", "sharepoint", "rag", "retrieval", "embedding", "chunking", "file upload", "graph indexing", "federated"]'),
('Actions & Tools', 'Connectors, Power Automate actions, HTTP/REST, custom connectors, MCP, data operations, AI actions', 2, '["action", "tool", "connector", "power automate", "http", "rest", "mcp", "api", "integration", "code interpreter", "summarize", "classify"]'),
('Triggers & Autonomous Agents', 'Event triggers, schedule triggers, webhooks, autonomous orchestration, background processing', 3, '["trigger", "event", "schedule", "webhook", "autonomous", "orchestration", "background", "entra", "graph event"]'),
('Channels', 'Teams, M365 Copilot, Web Chat, Direct Line, mobile, embedding, app registration', 4, '["channel", "teams", "m365", "copilot", "web chat", "direct line", "mobile", "embed", "app registration", "manifest", "bot registration"]'),
('Testing & Evaluation', 'Test pane, Activity Map, transcripts, automated testing, prompt evaluation, safety checks', 5, '["test", "testing", "evaluation", "eval", "activity map", "transcript", "batch test", "quality", "safety", "hallucination", "debugger"]'),
('Models & Orchestration', 'Generative orchestration, prompt templates, LLM selection, few-shot prompting, system messages', 6, '["model", "orchestration", "prompt", "llm", "gpt", "phi", "generative", "planning", "tool use", "nlu", "performance tuning"]'),
('Code Interpreter / Execution', 'Python execution, sandboxed computing, file handling, JSON/CSV parsing, code safety', 7, '["code interpreter", "python", "execution", "sandbox", "json", "csv", "excel", "parse", "image generation"]'),
('Data & Connections', 'Connection management, OAuth flows, expired connections, linked environments, secrets', 8, '["connection", "auth", "oauth", "expired", "stale", "environment", "tenant", "identity", "secret", "policy"]'),
('Dialog / Topic Authoring', 'Topic builder, generative nodes, classic dialogs, routing logic, slot filling, variables', 9, '["topic", "dialog", "node", "authoring", "routing", "slot filling", "variable", "fallback", "conversation flow"]'),
('Agent Flows (Workflow Engine)', 'Agent flows designer, flow runs, variables, long-running operations, failure handling', 10, '["flow", "workflow", "agent flow", "designer", "run", "variable", "output", "long running", "failure"]'),
('Admin, Security & Governance', 'Environment roles, transcript governance, data residency, DLP, tenant controls, ALM', 11, '["admin", "security", "governance", "role", "transcript", "residency", "dlp", "data loss prevention", "tenant", "alm", "permission"]'),
('Publishing & Lifecycle', 'Publishing to Teams/M365, version management, rollback, packaging for ISVs, app approval', 12, '["publish", "publishing", "version", "rollback", "package", "isv", "approval", "store", "deployment", "release"]'),
('Analytics & Monitoring', 'Usage analytics, trigger analytics, action success rates, quality metrics, error tracing', 13, '["analytics", "monitoring", "usage", "metric", "success rate", "satisfaction", "error", "trace", "performance", "latency"]'),
('Developer & Extensibility', 'SDK, Bot Framework, Direct Line API, webhooks, VS Code extension, Git integration, pro-dev', 14, '["sdk", "developer", "extensibility", "bot framework", "api", "webhook", "vs code", "git", "source control", "pro dev", "component library"]'),
('Voice & Multimodal', 'Voice/IVR channel, speech-to-text, text-to-speech, audio understanding, multimodal input', 15, '["voice", "ivr", "stt", "tts", "speech", "audio", "multimodal", "image", "screenshot"]'),
('UX / UI / Interaction', 'Conversation design, Adaptive Cards, structured UI, rich cards, message threading, persona', 16, '["ux", "ui", "interaction", "design", "adaptive card", "card", "structured", "message", "thread", "persona", "conversation design"]'),
('Compliance & Risk', 'Responsible AI, safety filters, hallucination reduction, PII handling, customer lockbox', 17, '["compliance", "risk", "responsible ai", "safety", "hallucination", "pii", "lockbox", "logging", "observability"]'),
('Lifecycle / Operations', 'Runtime isolation, scaling, concurrency, agent health, quotas, consumption, cost estimation', 18, '["runtime", "scaling", "concurrency", "health", "heartbeat", "quota", "consumption", "cost", "compute"]'),
('Multi-persona / Multi-identity', 'C1 vs C2 roles, user-auth vs maker-auth, mixed identity execution, end-user triggers', 19, '["c1", "c2", "persona", "identity", "multi user", "user auth", "maker auth", "mixed identity", "role"]')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE product_areas IS 'High-level product areas (19 categories) - broader than granular categories';
COMMENT ON TABLE post_product_areas IS 'Maps posts to 1-2 product areas max';
