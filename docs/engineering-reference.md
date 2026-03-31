# CONDITIONS WEB
## Engineering Reference (Updated)

**Audience:** Technical Development Team
**Anthralytic | March 18, 2026**

Part of the Conditions Web document set:
1. Conditions Domains Framework (intellectual architecture, your reference)
2. Engineering Reference (this document, build guide)
3. Conditions Web Pitch (nonprofit/foundation audience)
4. Conditions Web System Prompt (AI conversation prompt)

---

## What This Document Is

This is the build guide for the Conditions Web module. It translates the intellectual architecture (in the Conditions Domains Framework document) into what you need to implement: data model, classification logic, conversation flow, visualization specs, deliverable generation, and quick-reference tables.

The Conditions Domains Framework contains the theoretical grounding, the source framework synthesis, and detailed prose descriptions of each domain. Refer to it when you need to understand why a domain exists, what it draws from, or what kinds of conditions belong in it. The AI system prompt is the actual prompt loaded into the conversational AI. It is derived from the framework and this engineering reference but compressed for context window efficiency.

This document covers: what the module produces (deliverables), the workflow sequence, the database architecture, the data model, domain quick-reference with enum values and colors, classification decision logic for boundary cases, connection types, the conversation flow by phase, onboarding logic including ontological commitment, visualization specifications, and the migration mapping from the existing nine-type system.

---

## What the Conditions Web Produces

The Conditions Web module is an AI-guided conversational mapping process. The user talks with the AI. The AI surfaces conditions across eight domains. The output is a Conditions Web: a relational map of the conditions within which the organization operates, centered on the target population.

### The Deliverables

The Conditions Web has two sides. The frontend is the visual, interactive web: conditions as nodes, connections as lines, filterable by domain and subpopulation. The backend is a relational database: conditions with attributes, connections with types and directionality, subpopulation paths, and web metadata. These are not separate things. They are two sides of the same artifact. The visual web renders what the database contains. The database stores what the visual web displays. Every other deliverable is generated from this same foundation. The Conditions Strategy module reads from the database directly.

The organization receives five deliverables:

1. **The Conditions Web (frontend + backend)** — the interactive visual map and the relational database that powers it. The visual web is what the organization sees and works with. The database is what makes it queryable, updatable, and connectable to the rest of the Anthralytic suite. Two sides of the same coin.

2. **A narrative summary** — an AI-generated plain-language description of the web: what domains were covered, what the major condition clusters are, where the highest-density relational origins appear, and what was not covered or remains uncertain. Generated from the database.

3. **A theory of change** — a simplified abstraction that traces the major causal pathways from the program's contributions through the conditions they interact with toward the changes the organization seeks. The ToC generator reads the conditions data, identifies program-connected pathways, and renders them in a format funders recognize. Generated from the database.

4. **A logic model** — a further abstraction that translates the web into the linear inputs-activities-outputs-outcomes format funders expect. Each level of abstraction (web → ToC → logic model) loses information but remains grounded in the actual situation because all draw from the same underlying database.

5. **Direct database access (Path 3 / foundation upgrade)** — the backend is always a relational database. This deliverable exposes it: direct access with data export capability in portable formats (CSV, JSON). For sophisticated organizations with data teams, this means connecting their conditions data to their own analytics, dashboards, and reporting. For foundations, querying across multiple grantees' databases produces portfolio-level intelligence.

---

## Workflow Sequence

**Step 1: Onboarding.** Before the mapping conversation begins, the app collects orientation information through a 3-step onboarding flow: organization name, program name, geography, sector, target population, and ontological commitment (what the organization's work is rooted in). This determines how the AI weights domains and what examples it draws from.

**Step 2: AI-guided mapping conversation.** The AI conducts a structured but natural conversation in five phases covering all eight domains. It follows the organization's language, surfaces subpopulation variation, and tracks cross-domain connections. The AI uses the domain framework as an internal checklist (never naming domains aloud) and the cross-cutting dimensions as lenses to apply in every domain.

**Step 3: Draft web generation.** The AI generates the visual web and narrative summary from the conversation. Conditions are classified by domain, connections are labeled by type, and subpopulation paths are distinguished. The web builds in real time during conversation — conditions appear as the user describes them.

**Step 4: Organization validation.** The organization reviews the draft web. They can edit condition names, add missing conditions, correct connections, and flag conditions the AI mischaracterized.

**Step 5: Human review (Conditions Web Review).** A human evaluator (certified reviewer or Anthralytic staff) reviews the web for completeness, fidelity to the organization's language, adequate representation of ecological/spiritual conditions if relevant, and honest gaps. This is a paid engagement, prompted by the platform at 12 months.

**Step 6: Handoff to Conditions Strategy.** The validated web feeds into the Conditions Strategy module, which guides the organization through identifying high-leverage conditions, mapping where the program's work intersects with the web, and developing evaluation design.

---

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript, D3.js for force-directed graph
- **AI:** Google Gemini API (gemini-2.5-flash) — NOT Anthropic API
- **Backend API:** Express.js (Node/TypeScript)
- **Database:** PostgreSQL with Apache AGE extension (graph + relational hybrid)
- **Dev tooling:** Docker Compose for database, Netlify Functions as fallback proxy
- **Deployment:** Netlify (frontend), Docker/VPS (database + API)

### Architecture Decision: PostgreSQL with Apache AGE

The data model is relational by nature, but the Conditions Web is fundamentally a network: conditions connected to other conditions, with queries that need to traverse chains of connections (for generative density, causal pathway tracing for the ToC generator, and cross-portfolio pattern detection for foundations).

**Decision: PostgreSQL with Apache AGE.** This provides a hybrid architecture:
- **Relational tables (SQL)** for structured data: web metadata, org records, conditions CRUD, connection CRUD, conversation turns. Fast indexed access for filtering and standard queries.
- **Apache AGE graph (Cypher)** for network traversal: tracing causal pathways from program contributions through the connection graph for ToC generation, computing generative density, and cross-portfolio pattern detection for foundations.

Both sides are kept in sync — every condition and connection exists in both the relational tables and the AGE graph. The relational tables are the source of truth for CRUD; the graph is the query engine for traversal.

**Why not plain PostgreSQL?** Recursive CTEs can handle graph traversal but become expensive and hard to maintain as traversal depth increases. Cypher queries express path traversal naturally: `MATCH path = (p:Condition {is_program_contribution: true})-[*1..6]->(c:Condition) RETURN path`.

**Why not a standalone graph database?** The structured data (web metadata, org records, users, conversation turns) needs relational storage. Running both PostgreSQL and a separate graph DB adds operational complexity. AGE gives graph capabilities inside PostgreSQL.

### Multi-Tenancy

Designed for multi-tenancy from the start. The `web_metadata` table has an `org_id` column (nullable for now). All queries scope by `web_id`, so tenant isolation is naturally enforced. When user accounts are added later, `org_id` connects webs to organizations. Cross-portfolio queries for foundations query across multiple `web_id`s within the same database.

---

## Onboarding: Ontological Commitment Logic

Before the mapping conversation begins, the onboarding flow captures basic context and one critical orientation question: what is the organization's work rooted in?

The onboarding is a 3-step flow:
1. **Organization info:** org name, program name, geography, sector
2. **Target population:** free-text description of who the org serves
3. **Ontological commitment:** what the work is rooted in

### Ontological frame values

| Value | Description |
|-------|-------------|
| `human_systems` (default) | Works primarily within policies, institutions, markets, social services. Default domain examples and weights. |
| `ecological_relational` | Rooted in ecological relationships: land, water, food systems. Ecological conditions (Domain 8) get full standing. No translation into Western analytical equivalents. |
| `spiritual_ceremonial` | Grounded in spiritual or ceremonial practice. Spiritual conditions get full standing in the organization's language. Not reduced to "cultural practices." |
| `mixed` | Spans multiple frames. AI follows the organization's lead. |

The `ontological_frame` value is stored in web metadata and injected into the AI system prompt. It shapes AI behavior throughout the conversation. It also informs the Review Checklist.

---

## Data Model

### Condition Node

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `web_id` | uuid (FK) | Foreign key to the web this condition belongs to |
| `ai_node_id` | string | The AI-assigned ID (n1, n2, etc.) for real-time sync |
| `name` | string | Short label in the organization's language |
| `description` | string | Longer description from conversation context |
| `domain` | enum | One of: `historical`, `situational`, `population`, `community`, `structural`, `organizational`, `market`, `ecological` |
| `subpopulation` | string[] | Which subpopulation paths this condition applies to. Empty = shared across all. |
| `source_turn` | int | Conversation turn where this condition was surfaced |
| `confidence` | enum | `explicit`, `inferred`, `suggested_by_ai` |
| `felt_experience` | string? | How this condition is experienced (mattering, belonging, dignity, or their opposites) |
| `is_program_contribution` | boolean | Whether this condition is something the program creates or strengthens |
| `created_at` | datetime | When this condition was added to the web |

### Connection (Edge)

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `web_id` | uuid (FK) | Foreign key to the web |
| `source_id` | uuid (FK) | The condition that produces/enables/constrains |
| `target_id` | uuid (FK) | The condition being affected |
| `type` | enum | One of: `produces`, `maintains`, `enables`, `constrains`, `blocks`, `amplifies`, `depends_on`, `addresses`, `partially_addresses` |
| `description` | string? | Optional narrative describing the relationship |

### Subpopulation Path

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `web_id` | uuid (FK) | Foreign key to the web |
| `label` | string | Name of this subpopulation path |
| `description` | string | What characterizes this path |

### Web Metadata

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier for this web |
| `org_id` | uuid (FK) | Foreign key to the organization (nullable, multi-tenant ready) |
| `org_name` | string | Organization name |
| `program_name` | string? | Specific program if applicable |
| `target_population` | string | Description of who the org serves |
| `ontological_frame` | enum | `human_systems`, `ecological_relational`, `spiritual_ceremonial`, `mixed` |
| `geography` | string | Where the work happens |
| `sector` | string | Area of work |
| `created_at` | datetime | When the web was created |
| `last_reviewed` | datetime? | Last human review date |
| `status` | enum | `draft`, `validated`, `reviewed` |

### Conversation Turns

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `web_id` | uuid (FK) | Foreign key to the web |
| `turn_number` | int | Sequential turn number |
| `role` | string | `user` or `model` |
| `content` | text | Full message content (including JSON for model turns) |
| `raw_web_data` | jsonb | Parsed web JSON from that turn, if any |
| `created_at` | datetime | When this turn occurred |

---

## Domain Quick Reference

Eight domains. Each domain has a color assignment for visualization, a one-sentence definition, example conditions, and the AI question that opens it in conversation.

### Domain 1: Historical & Systemic
- **Enum:** `historical`
- **Color:** #3D405B (deep slate)
- **Definition:** Conditions produced by the long arc of history that created the current situation.
- **Examples:** Redlining legacy, boarding school policy, deindustrialization, colonial land patterns, generational poverty, environmental racism history
- **AI opens with:** "What happened, over time, that produced the situation your participants are now in?"

### Domain 2: Situational
- **Enum:** `situational`
- **Color:** #C99D28 (gold dark)
- **Definition:** What is happening right now in the broader environment that affects the work.
- **Examples:** Current housing crisis, recent policy change, economic downturn, political shift, pandemic effects, rising food prices
- **AI opens with:** "What's happening right now in the broader environment that's affecting your work or the people you serve?"

### Domain 3: Population
- **Enum:** `population`
- **Color:** #7A6A4A (warm brown)
- **Definition:** Conditions characterizing the groups the organization serves, including subpopulation variation.
- **Examples:** Housing status, legal status, trauma history, family configuration, cultural identity, resilience strategies, skills, aspirations
- **AI opens with:** "Tell me about the people you serve. What's true about their situations? Are they all arriving from similar paths, or are there meaningfully different paths?"

### Domain 4: Community & Cultural
- **Enum:** `community`
- **Color:** #6B8F71 (forest green)
- **Definition:** Shared norms, cultural practices, informal networks, social fabric, and community knowledge.
- **Examples:** Mutual aid networks, cultural practices, community norms, peer networks, neighborhood assets, stigma, community trauma
- **AI opens with:** "What exists in the community beyond formal services? What do people rely on that no organization provides?"

### Domain 5: Structural & Political
- **Enum:** `structural`
- **Color:** #8B4513 (saddle brown)
- **Definition:** Formal and informal structures of rules, power, governance, and enforcement.
- **Examples:** Zoning laws, eligibility requirements, enforcement practices, informal gatekeeping, hiring networks, funding system norms
- **AI opens with:** "What rules, formal and informal, shape your participants' lives? Who has power over what?"

### Domain 6: Organizational & Institutional
- **Enum:** `organizational`
- **Color:** #8B7355 (tan)
- **Definition:** Conditions within and between formal organizations in the landscape.
- **Examples:** Staff capacity, leadership stability, funding continuity, funder requirements, inter-agency coordination, referral systems, org culture
- **AI opens with:** "What has to be true inside your organization for the program to function? Who else is in this space, and how do you work together?"

### Domain 7: Market & Exchange
- **Enum:** `market`
- **Color:** #B08D57 (muted gold)
- **Definition:** How resources, services, labor, and value move through systems of exchange.
- **Examples:** Labor market conditions, rent levels, informal economy, payday lending, food deserts, transportation costs, financial services access
- **AI opens with:** "What's the economic picture for your participants? What does it cost to live where they live, and where does income come from?"

### Domain 8: Ecological & Place-Based
- **Enum:** `ecological`
- **Color:** #81B29A (muted sage)
- **Definition:** Land, water, air, climate, built environment, ecological systems, and more-than-human relationships.
- **Examples:** Air/water quality, housing stock, infrastructure, flood risk, soil health, sacred sites, land ownership, relationship with river/land
- **AI opens with:** "Where does the work happen? What's the physical environment like? What ecological conditions affect the people you serve?"

---

## Cross-Cutting Dimensions Quick Reference

Six dimensions. These are not domains. They are lenses the AI applies in every domain. They do not get their own nodes in the web, but they inform how the AI probes conditions and may be captured as metadata on condition nodes.

| Dimension | What it means | AI prompt pattern |
|-----------|---------------|-------------------|
| **Power** | Who has it, how it operates, how it is maintained. | "Who decides this? Who benefits? Who is excluded?" |
| **Time & History** | How fast conditions change, what preceded them, trajectory, cycles. | "Has this always been this way? What changed?" |
| **Relational Character** | Trust, coercion, reciprocity, extraction, solidarity between actors. | "What is the relationship like between X and Y?" |
| **Geography & Place** | Distance, proximity, borders, urban/rural, built environment. | "Where does this happen? Does location shape access?" |
| **Leverage** | How consequential based on web position. High connections = high leverage. | Computed from web structure, not asked directly. |
| **Felt Experience** | Mattering, belonging, dignity, and their opposites. | "What does it communicate to them about whether they matter?" |

---

## Domain Classification Logic

When a condition surfaces in conversation, the AI classifies it into a domain. Most conditions have an obvious home. Boundary cases require the decision logic below. A condition can connect to conditions in any domain. The domain classification is about where the condition lives, not what it connects to.

### Primary Classification Questions

The AI asks these in sequence. First match determines the domain.

| Question | Domain |
|----------|--------|
| Accumulated over decades/generations, no one currently deciding it? | 1. Historical & Systemic |
| Happening right now, recent, changing? | 2. Situational |
| About the specific people served, their circumstances, identities? | 3. Population |
| About shared community life, informal networks, cultural practices? | 4. Community & Cultural |
| About formal/informal rules, policies, governance, power structures? | 5. Structural & Political |
| About a specific organization's capacity, culture, inter-org dynamics? | 6. Organizational |
| About how resources, money, labor flow, economic access? | 7. Market & Exchange |
| About physical environment, land, water, climate, infrastructure? | 8. Ecological & Place-Based |

### Boundary Cases

| Condition example | Classify as | Reasoning |
|-------------------|-------------|-----------|
| "The funder requires SROI reporting" | Structural | System-wide norm from funding environment |
| "Our funder requires quarterly reports" | Organizational | Specific organizational relationship |
| "No grocery stores in the neighborhood" | Market | Market failure (supply absent) |
| "Contaminated water" | Ecological | Physical/environmental condition |
| "Neighbors help with childcare" | Community | Informal community practice |
| "Community center provides free meals" | Organizational | Formal organization providing service |
| "Participants distrust government" | Population | Condition of the target population |
| "Redlining produced these demographics" | Historical | Accumulated historical condition |
| "Rents increased 40% in 18 months" | Situational | Current, rapidly changing condition |
| "The river is sacred" | Ecological | Ecological with spiritual standing |

**Key principle:** Classify by what the condition IS, not what caused it. Causal connections are captured in edges, not domain assignment.

---

## Connection Types

Connections between conditions are directional and typed. The source condition acts on the target condition.

| Type | Meaning | Example |
|------|---------|---------|
| `produces` | Source creates or generates target. Strongest causal claim. | Redlining → segregated neighborhoods |
| `maintains` | Source keeps target in place. Without source, target weakens. | Zoning laws → residential segregation |
| `enables` | Source makes target possible but doesn't guarantee it. | Community trust → collective action |
| `constrains` | Source limits or weakens target without fully blocking it. | Transportation cost → job access |
| `blocks` | Source prevents target from existing or functioning. | Legal status → employment eligibility |
| `amplifies` | Source strengthens or intensifies target. | Social media → community organizing |
| `depends_on` | Source requires target to function. Reverse of enables. | Program continuity → funding stability |
| `addresses` | Source works to change or resolve target. Typically program → condition. | Housing program → housing instability |
| `partially_addresses` | Source addresses some aspect of target but not all. | Job training → unemployment |

---

## Conversation Flow Architecture

### Phase 1: The Situation (spend real time here)

Open with the target population and their situation. Surface what accumulated for them. Always ask about subpopulation variation (not optional). Explore 2-3 distinct paths if they exist. This phase naturally covers Domains 1 (historical), 2 (situational), and 3 (population), plus begins to surface Domain 4 (community) and Domain 5 (structural).

### Phase 2: The Landscape

Who else is in this space? What organizations, agencies, and systems do participants navigate? What works, what fails, what gaps exist? This covers Domain 6 (organizational) and deepens Domain 5 (structural). Probe for conditions that relationships between organizations produce.

### Phase 3: The Economy and Place

What are the economic conditions? What does it cost to live here? Where does income come from? What markets work, what markets fail? What is the physical environment like? This covers Domain 7 (market) and Domain 8 (ecological). These domains are the most commonly missed, so the AI must actively open them.

### Phase 4: What You Bring

Now the program enters the web. What does this specific program introduce into the existing web of conditions? Not causes, but conditions it creates or strengthens. These are conditions in any domain marked with `is_program_contribution: true`. Connect program conditions to the conditions already surfaced.

### Phase 5: Risks and Gaps

What conditions could undermine or reverse progress? What is fragile? What did we not cover? The AI uses the domain framework as a checklist: have we touched all eight domains? Where are the gaps? Name them honestly.

### Throughout All Phases

The AI applies cross-cutting dimensions continuously: listening for power dynamics, temporal patterns, relational character, geographic factors, and felt experience (mattering, belonging, dignity). The AI tracks generative density: when a single relationship or condition produces many downstream conditions, flag it. These are high-leverage points for the strategy module.

---

## Visualization Specifications

### Node Appearance

Each condition node is colored by domain. Node size scales with connection count (generative density), so high-leverage conditions are visually prominent. Nodes display the condition name; description appears on hover or click. Program contribution nodes have a gold dashed outer ring to distinguish them without needing a separate domain.

### Domain Color Map

| Domain | Color | Hex |
|--------|-------|-----|
| 1. Historical & Systemic | Deep slate | #3D405B |
| 2. Situational | Gold dark | #C99D28 |
| 3. Population | Warm brown | #7A6A4A |
| 4. Community & Cultural | Forest green | #6B8F71 |
| 5. Structural & Political | Saddle brown | #8B4513 |
| 6. Organizational | Tan | #8B7355 |
| 7. Market & Exchange | Muted gold | #B08D57 |
| 8. Ecological & Place-Based | Muted sage | #81B29A |

### Edge Appearance

Connections are displayed as directional curved arrows (source to target). Edge styling encodes connection type:
- **Enabling/positive connections** (enables, amplifies, produces, maintains, addresses, partially_addresses): warm tones, solid lines
- **Constraining/negative connections** (constrains, blocks): cool/muted tones, dashed lines

Edge labels appear on hover.

### Domain Filtering

Users can toggle domains on/off via the legend. Clicking a domain dot in the legend dims or shows that domain's conditions. The force simulation keeps running with all nodes so layout doesn't jump — only visual rendering changes.

### Subpopulation Filtering

When conditions have subpopulation arrays, a pill selector appears above the legend. Selecting a subpopulation highlights conditions that belong to it and dims everything else. "All" shows the full web.

### Generative Density Indicator

Conditions with high connection counts (4+ connections) are visually distinct: larger node size and a subtle glow effect. This surfaces high-leverage conditions without requiring the user to count connections.

### Phase Progress Indicator

A subtle 5-segment progress bar appears at the top of the chat panel showing which conversation phase is active: The Situation → The Landscape → Economy & Place → What You Bring → Risks & Gaps.

---

## Deliverable Generation

### Narrative Summary

Generated after the conversation is complete. The AI reads the full conditions database for this web and produces a plain-language summary organized by domain: what conditions were surfaced, where the major clusters are, which conditions have the highest connection counts (generative density), what subpopulation variation was identified, and what domains were lightly covered or have gaps. The summary is honest about gaps.

### Theory of Change Generation

The ToC is generated from the database using Cypher graph traversal queries via Apache AGE. The generator identifies conditions with `is_program_contribution: true` (surfaced in Phase 4). It traces outward from those conditions through the connection graph: what do the program's contributions enable, address, or partially address? The result is a simplified pathway view: program contributions → intermediate conditions → changes the organization seeks. This is a translation artifact for funders, not the organization's actual understanding of how change works.

### Logic Model Generation

The logic model maps program contributions into inputs and activities, intermediate conditions into outputs, and downstream conditions into outcomes. The AI makes reasonable assignments and flags ambiguous cases. Rendered in standard tabular format. Like the ToC, it is a translation artifact.

### Conditions Web Review Checklist

Generated automatically from the web data. Checks:
- Domain coverage: has every domain been touched? Flag domains with fewer than 2 conditions.
- Subpopulation paths: were they identified and explored?
- Ontological frame compliance: if ecological_relational or spiritual_ceremonial, were those conditions surfaced with full standing?
- Unconfirmed suggestions: conditions flagged as `suggested_by_ai` not yet confirmed.
- Orphan conditions: conditions with no connections (may indicate incomplete mapping).
- Program contributions: have they been identified?

---

## Migration: Existing Nine Types to Eight Domains

| Old type (9-type system) | New domain (8-domain system) | Notes |
|--------------------------|------------------------------|-------|
| Historical/Systemic | Domain 1: Historical & Systemic | Direct mapping |
| Situational | Domain 2: Situational | Direct mapping |
| Participant | Domain 3: Population | Renamed. "Population" reflects group-level. Subpopulation paths are new. |
| Community | Domain 4: Community & Cultural | Expanded to include cultural conditions explicitly. |
| (no equivalent) | Domain 5: Structural & Political | New. Was partially covered by Historical/Systemic. |
| Organizational | Domain 6: Organizational & Institutional | Expanded to include full institutional landscape. |
| (no equivalent) | Domain 7: Market & Exchange | New. Economic conditions were not a type. |
| Landscape | Split across Domains 5, 6, 7 | Old "Landscape" combined external orgs, agencies, gaps. |
| (no equivalent) | Domain 8: Ecological & Place-Based | New. Physical/ecological conditions were not a type. |
| What You Bring (program) | Conditions in any domain | Not a domain. `is_program_contribution: true` flag on any condition. |
| Relational | Cross-cutting dimension | Not a domain. Relational character is a dimension applied in every domain. |
| Risks | Conditions in any domain | Not a domain. Risks are conditions that could undermine progress, classified by what they are. |

---

## Project Structure

```
conditions-web/
├── src/                          # Frontend (Vite + React + TypeScript)
│   ├── types/                    # TypeScript interfaces
│   │   ├── index.ts              # Domain, WebData, Message, ThemeTokens
│   │   └── onboarding.ts         # WebMetadata, OntologicalFrame
│   ├── constants/
│   │   ├── theme.ts              # Dark/light theme tokens, global CSS
│   │   ├── domains.ts            # 8 domain colors, labels, edge colors
│   │   └── prompts.ts            # System prompt builder (injects onboarding metadata)
│   ├── components/
│   │   ├── layout/ThemeToggle.tsx
│   │   ├── screens/
│   │   │   ├── StartScreen.tsx
│   │   │   ├── OnboardingFlow.tsx    # 3-step onboarding
│   │   │   └── WhatIsThisModal.tsx
│   │   ├── chat/PhaseIndicator.tsx   # 5-phase progress bar
│   │   ├── web/
│   │   │   ├── WebVisualization.tsx   # D3 force graph with filtering + density
│   │   │   └── WebLegend.tsx          # Domain + subpopulation filters
│   │   └── deliverables/
│   │       └── DeliverablePanel.tsx   # Tabbed deliverable viewer
│   ├── services/api.ts               # API client (Express or Netlify fallback)
│   ├── utils/parseWebData.ts         # Parse AI JSON, backward-compatible
│   ├── App.tsx                        # Root component
│   └── main.tsx                       # Entry point
├── server/                            # Backend (Express + PostgreSQL)
│   ├── index.ts                       # Express server entry
│   ├── db/
│   │   ├── pool.ts                    # PostgreSQL connection pool + AGE helper
│   │   ├── init.sql                   # Schema (tables + AGE graph)
│   │   └── queries/
│   │       ├── webs.ts               # Web CRUD
│   │       ├── conditions.ts         # Condition sync + AGE mirror
│   │       ├── connections.ts        # Connection sync + density queries
│   │       └── graph.ts              # Cypher path traversal queries
│   └── routes/
│       ├── chat.ts                    # Gemini API proxy
│       ├── webs.ts                    # Web + condition + connection endpoints
│       ├── deliverables.ts            # Deliverable generation endpoints
│       └── turns.ts                   # Conversation turn storage
├── netlify/functions/chat.mjs         # Netlify Function fallback proxy
├── docker-compose.yml                 # PostgreSQL + Apache AGE
├── netlify.toml
├── vite.config.js
├── tsconfig.json
└── package.json
```

---

## Running the Application

### Without database (development/demo)
```bash
netlify dev          # Starts Vite + Netlify Functions on port 8888
```
The app works fully — conversation, visualization, onboarding, domain filtering — using in-memory state. No persistence between sessions.

### With database (full stack)
```bash
docker compose up -d              # Start PostgreSQL + Apache AGE
npm run dev                       # Start Vite + Express concurrently
```
Open http://localhost:5180. Data persists to PostgreSQL. Sessions resumable via URL (`?web=UUID`). Deliverable generation queries the graph database.
