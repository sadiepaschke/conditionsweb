-- Enable Apache AGE extension
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Create the conditions graph
SELECT create_graph('conditions_graph');

-- Enum types
CREATE TYPE domain_type AS ENUM (
  'historical', 'situational', 'population', 'community',
  'structural', 'organizational', 'market', 'ecological'
);

CREATE TYPE confidence_level AS ENUM ('explicit', 'inferred', 'suggested_by_ai');

CREATE TYPE connection_type AS ENUM (
  'produces', 'maintains', 'enables', 'constrains',
  'blocks', 'amplifies', 'depends_on', 'addresses', 'partially_addresses'
);

CREATE TYPE ontological_frame_type AS ENUM (
  'human_systems', 'ecological_relational', 'spiritual_ceremonial', 'mixed'
);

CREATE TYPE web_status_type AS ENUM ('draft', 'validated', 'reviewed');
CREATE TYPE web_scope_type AS ENUM ('organizational', 'program');

-- Web metadata (one per mapping session)
CREATE TABLE web_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,  -- nullable for now, multi-tenant ready
  scope web_scope_type DEFAULT 'organizational',
  org_name TEXT NOT NULL,
  program_name TEXT,
  target_population TEXT,
  geography TEXT,
  sector TEXT,
  ontological_frame ontological_frame_type DEFAULT 'human_systems',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed TIMESTAMPTZ,
  status web_status_type DEFAULT 'draft'
);

-- Conditions (nodes in the web)
CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_id UUID NOT NULL REFERENCES web_metadata(id) ON DELETE CASCADE,
  ai_node_id TEXT,  -- The "n1", "n2" IDs from AI JSON
  name TEXT NOT NULL,
  description TEXT,
  domain domain_type NOT NULL,
  subpopulation TEXT[],
  source_turn INTEGER,
  confidence confidence_level DEFAULT 'explicit',
  felt_experience TEXT,
  is_program_contribution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Connections (edges between conditions)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_id UUID NOT NULL REFERENCES web_metadata(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  type connection_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subpopulation paths
CREATE TABLE subpopulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_id UUID NOT NULL REFERENCES web_metadata(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT
);

-- Conversation turns (for resume and replay)
CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_id UUID NOT NULL REFERENCES web_metadata(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL,  -- 'user' or 'model'
  content TEXT NOT NULL,
  raw_web_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conditions_web_id ON conditions(web_id);
CREATE INDEX idx_conditions_domain ON conditions(domain);
CREATE INDEX idx_conditions_ai_node_id ON conditions(web_id, ai_node_id);
CREATE INDEX idx_connections_web_id ON connections(web_id);
CREATE INDEX idx_connections_source ON connections(source_id);
CREATE INDEX idx_connections_target ON connections(target_id);
CREATE INDEX idx_conversation_turns_web ON conversation_turns(web_id, turn_number);
CREATE INDEX idx_web_metadata_org ON web_metadata(org_id);
