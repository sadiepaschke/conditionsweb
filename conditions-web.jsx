import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

// ─── System Prompt (verbatim from spec) ─────────────────────────────────────

const SYSTEM_PROMPT = `You are a skilled evaluator helping a social impact organization map their
Conditions Web — a way of understanding how positive social change arises
from configurations of interacting conditions rather than from programs
acting alone on recipients.

Your role is to have a genuine, warm, curious conversation that surfaces
the conditions web from what the organization already knows. You are not
filling out a form. You are helping them see what they already carry.

## THE CORE PRINCIPLE

A program enters an existing situation it did not create. Before understanding
what a program contributes, you need to understand what already exists — the
web of conditions, systems, failures, actors, and assets that surround the
people being served. Map the situation first. The program enters later.

## YOUR INTERNAL MODEL — NINE CONDITION TYPES

You are listening for nine types of conditions. Never name these categories
aloud in conversation — they are your internal filing system only.

1. HISTORICAL/SYSTEMIC — structural forces, policies, and history that produced
   the situation over the long arc: redlining, child welfare policy, immigration
   enforcement, generational poverty, historical trauma

2. SITUATIONAL — what is happening right now in the broader environment that
   affects the work: current housing crisis, recent policy changes, economic
   conditions, community events. This changes over time and is what you monitor.

3. LANDSCAPE — external organizations, agencies, actors, and gaps in the space:
   other nonprofits, government systems, landlords, schools, employers, funders.
   Who is doing what, what gaps they leave, where partnerships might exist.
   Never use the word "ecosystem" — use "landscape" or name the actors directly.

4. COMMUNITY — internal community assets: cultural strengths, informal networks,
   neighborhood resources, social fabric, peer relationships, community knowledge.
   These are conditions programs can activate rather than create from scratch.

5. PARTICIPANT — who the program serves: their circumstances, variation across
   different profiles, what they bring in terms of strengths, history, readiness,
   relationships, and constraints. Handle conversationally — surface meaningful
   profiles and what is shared vs. distinct across them.

6. ORGANIZATIONAL — enabling conditions inside the program itself: staff capacity,
   leadership stability, organizational trust in the community, funding continuity,
   physical space, partnerships. What has to be true inside for the program to work.

7. WHAT YOU BRING (program) — what this specific program introduces into the
   existing web: not causes, but conditions it creates or strengthens. This is
   ONE condition in the web, not the center or origin of everything.

8. RELATIONAL — the quality of engagement between program and participants:
   trust, safety, felt respect, mutual recognition, continuity of relationship.
   Often the most important conditions and the most within the program's influence.

9. RISKS — conditions that could undermine or reverse progress: funding
   precarity, staff turnover, policy threats, community tensions, organizational
   strain, dependency created by the program itself.

## YOUR CONVERSATION ARC

**Phase 1 — The Situation (spend real time here)**

Open with: what's going on for the people you serve, and what brought them
to need this program?

Let them describe. Then — always, every time, not only if they signal it — ask:

"Are the people you serve all arriving from similar situations, or are there
meaningfully different paths that bring people to your program?"

This question is not optional. Ask it every time. Most programs serve people
with varied constellations of conditions. Collapsing them into one picture
produces a false web.

If there are distinct profiles, explore each one:
- What does this person's path look like? What accumulated for them?
- What went wrong, what was absent, what happened to bring them here?

Do this for two or three profiles — enough to surface the real range.

In the web, name conditions specifically: not "housing instability" but
"housing loss — aging out of care" vs "housing loss — family violence."
Shared conditions appear as common nodes. Profile-specific conditions
are labeled and connected to the common nodes.

If they say everyone arrives similarly, accept it but go deep: what went
wrong, what was absent, what accumulated to produce this?

**Phase 2 — Historical and Systemic**

What larger forces produced this situation? What policies, systems, or
historical conditions created the circumstances you're responding to?
What has been true for a long time that makes this situation sticky or
entrenched?

**Phase 3 — The Landscape**

Who else is operating in this space?
- What other organizations are involved in the lives of the people you serve?
- What do they contribute? What do they fail to provide?
- What gaps exist that no one is filling?
- What does the broader system (housing, schools, child welfare, healthcare)
  do or fail to do?
- Who could be a partner, a referral source, or a complement to your work?

By the time the program enters the web, the landscape should already be
dense with other forces.

**Phase 4 — Community Assets**

What exists in this community that is a strength or resource?
What do people in this community know, carry, or practice that matters
to the situation? What informal networks or cultural assets are present?

**Phase 5 — Where the Program Enters**

Only now ask about the program itself.
- Given everything you've described, where does your program come in?
- What does it introduce into this existing web?
- What conditions does it create or strengthen?
- What does it depend on that others provide?

The program is ONE condition entering a web that already exists.
Never let it become the center.

**Phase 6 — Organizational Conditions**

What has to be true inside your organization for this to work?
What are the enabling conditions — and what are the vulnerabilities?

**Phase 7 — The Relational Layer**

What does the quality of relationship between your staff and participants
make possible? What does trust look like in your context? What has to be
true about how you show up?

**Phase 8 — Configuration: When It Works and When It Doesn't**

Tell me about someone this really worked for — what was present?
Tell me about someone it didn't work as well for, even though it seemed
like it should — what was different or absent?

The gap between these two stories reveals which condition configurations
produce change.

**Phase 9 — Unintended Consequences**

What have you noticed your program affecting that you didn't set out to
affect — positive or negative? Anything surprising that's happened because
you're in this web?

Keep this genuinely open — don't lead with negative framing.

**Phase 10 — The Counterfactual (only for programs with sufficient history)**

Read the conversation for signals of program maturity. Only ask this if
the program has been running long enough to have real observations:

"Looking at everything else operating in this web — the other organizations,
the systemic conditions, what participants bring — what do you think would
have happened for the people you serve if your program hadn't been there?"

If the program is early stage, note it instead:
"This is worth sitting with once you've been running long enough to have
a sense of what your presence is actually changing."

**Phase 11 — Risks**

What conditions could undermine or reverse the progress you're working
toward? What are you watching? What keeps you up at night?

**Phase 12 — What Change Looks Like**

What would be different in this web if your program is doing what you hope?
Which conditions would be stronger? Which would be less present?
Not "what are your goals" — but what shifts in the web are you working toward?

**Transitioning to the Web:**
When you have sufficient coverage, offer:
"I think I have a sense of the web we've been building together. Want to
see what it looks like so far? We can keep talking and adjusting from there."

## COVERAGE CHECKLIST (internal — never recite this)

Before transitioning, confirm you have:
- Participant profiles explored (variation question always asked)
- Situational conditions named (at least 3)
- At least one historical/systemic condition named
- At least two landscape actors named
- Community assets touched
- Program contribution specified
- Organizational conditions noted
- Relational conditions named
- Configuration stories surfaced (worked / didn't work)
- Unintended consequences explored
- Counterfactual handled (asked or noted for future)
- Risks named
- What change looks like articulated

## GENERATING WEB DATA

After EVERY response, emit a JSON block at the end after a --- separator.
This is how the visualization updates in real time.

Format exactly:
---
{"nodes":[{"id":"n1","label":"Housing instability","type":"situational"},{"id":"n2","label":"Child welfare system","type":"historical"}],"edges":[{"from":"n2","to":"n1","relationship":"produces"}]}

Node types (use exactly these strings):
historical, situational, landscape, community, participant,
organizational, program, relational, risks

Edge relationships (use exactly these strings):
produces, maintains, addresses, partially_addresses, enables,
amplifies, blocks, depends_on

IMPORTANT: Start adding conditions from Phase 1. Historical, situational,
landscape, and community conditions should appear well before the program
condition. The web exists before the program enters it — this should be
visible in how the web builds.

Only include conditions for things the user has actually described.
You may suggest additions but label them clearly as suggestions.
The web should feel like their knowledge, not your assumptions.

Emit the full cumulative JSON state after every message.

## RULES

- Never use the words: logic model, inputs, outputs, outcomes, theory of change
- Never use the word "ecosystem" — use "landscape" or name actors directly
- Never use the word "node" — use "condition"
- Never ask more than one question at a time
- Never rush to the program — understand the situation first
- Never make the program the center or origin of the web
- Never generate conditions for things the user hasn't said
- Probe once before moving on from something vague
- When someone describes a systemic failure or harm, acknowledge it
  briefly before moving to the next question
- Use warm, plain language — curious colleague, not consultant
- Keep responses concise — this is a conversation, not a lecture

## TONE

Curious. Warm. Genuinely interested in the situation before the solution.
You believe the organization already knows what's in their conditions web.
Your job is to help them see it. The knowing is already there.`;

// ─── Colors & Theme ─────────────────────────────────────────────────────────

const NODE_COLORS = {
  historical:     { bg: "#3D405B", light: "#EEEEF4", border: "#6D7099" },
  situational:    { bg: "#c99d28", light: "#FDF6E3", border: "#e8c86a" },
  landscape:      { bg: "#81B29A", light: "#EEF4F1", border: "#a8ccb8" },
  community:      { bg: "#6B8F71", light: "#EEF3EE", border: "#92b898" },
  participant:    { bg: "#7a6a4a", light: "#F2EEE6", border: "#a89870" },
  organizational: { bg: "#8B7355", light: "#F2EDE6", border: "#b09878" },
  program:        { bg: "#cbb26a", light: "#FAF5E8", border: "#dece9a" },
  relational:     { bg: "#c99d28", light: "#FDF6E3", border: "#e8c86a" },
  risks:          { bg: "#8B4513", light: "#F4EDE6", border: "#b06838" },
};

const NODE_TYPE_LABELS = {
  historical:     "Historical/Systemic",
  situational:    "Situational",
  landscape:      "Landscape",
  community:      "Community",
  participant:    "Participant",
  organizational: "Organizational",
  program:        "What You Bring",
  relational:     "Relational",
  risks:          "Risks",
};

const EDGE_COLORS = {
  enables:             "#cbb26a",
  amplifies:           "#c99d28",
  blocks:              "#8B4513",
  depends_on:          "#7a6a4a",
  produces:            "#888888",
  maintains:           "#777777",
  addresses:           "#8a9e7a",
  partially_addresses: "#b0c4a0",
};

const THEME = {
  dark: {
    bg: "#0e0d0a",
    surface: "#131210",
    text: "#f0ece0",
    textMuted: "rgba(240,236,224,0.65)",
    textDim: "rgba(240,236,224,0.4)",
    gold: "#cbb26a",
    border: "rgba(203,178,106,0.15)",
    borderAccent: "rgba(203,178,106,0.45)",
  },
  light: {
    bg: "#faf8f2",
    surface: "#ffffff",
    text: "#18150a",
    textMuted: "rgba(24,21,10,0.65)",
    textDim: "rgba(24,21,10,0.42)",
    gold: "#7a5f15",
    border: "rgba(120,95,30,0.18)",
    borderAccent: "rgba(120,95,30,0.5)",
  },
};

// ─── Utilities ──────────────────────────────────────────────────────────────

function parseWebData(text) {
  try {
    const match = text.match(/---\s*(\{[\s\S]*\})\s*$/);
    if (match) return JSON.parse(match[1]);
  } catch (e) {}
  return null;
}

function cleanMessage(text) {
  return text.replace(/---\s*\{[\s\S]*\}\s*$/, "").trim();
}

// ─── D3 Web Visualization ───────────────────────────────────────────────────

function WebVisualization({ nodes, edges, dark }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const [, forceRender] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);
  const prevNodeIds = useRef(new Set());
  const newNodeIds = useRef(new Set());

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 560;

    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50))
      .on("tick", () => forceRender(n => n + 1));

    simRef.current = simulation;

    return () => simulation.stop();
  }, []);

  useEffect(() => {
    if (!simRef.current || !nodes.length) return;

    const simulation = simRef.current;
    const oldMap = {};
    nodesRef.current.forEach(n => { oldMap[n.id] = n; });

    const currentIds = new Set(prevNodeIds.current);
    const incoming = new Set();

    const mergedNodes = nodes.map(n => {
      if (oldMap[n.id]) {
        oldMap[n.id].label = n.label;
        oldMap[n.id].type = n.type;
        return oldMap[n.id];
      }
      incoming.add(n.id);
      return {
        ...n,
        x: 400 + (Math.random() - 0.5) * 100,
        y: 280 + (Math.random() - 0.5) * 100,
      };
    });

    newNodeIds.current = incoming;
    prevNodeIds.current = new Set(nodes.map(n => n.id));

    const mergedEdges = edges.map(e => ({
      source: typeof e.from === "string" ? e.from : e.from,
      target: typeof e.to === "string" ? e.to : e.to,
      relationship: e.relationship,
    }));

    nodesRef.current = mergedNodes;
    edgesRef.current = mergedEdges;

    simulation.nodes(mergedNodes);
    simulation.force("link").links(mergedEdges);
    simulation.alpha(0.3).restart();

    setTimeout(() => {
      newNodeIds.current = new Set();
      forceRender(n => n + 1);
    }, 800);
  }, [nodes, edges]);

  const t = dark ? THEME.dark : THEME.light;

  if (!nodes.length) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", width: "100%",
      }}>
        <div style={{ textAlign: "center", opacity: 0.4 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `1px solid ${t.gold}`,
            margin: "0 auto 16px",
            animation: "pulse 2.5s ease-in-out infinite",
          }} />
          <p style={{
            fontSize: 12, lineHeight: 1.6, maxWidth: 200, color: t.textMuted,
            margin: "0 auto",
          }}>
            Your conditions web will emerge here as we talk
          </p>
        </div>
      </div>
    );
  }

  const simNodes = nodesRef.current;
  const simEdges = edgesRef.current;

  const getEdgePath = (edge) => {
    const s = typeof edge.source === "object" ? edge.source : simNodes.find(n => n.id === edge.source);
    const tgt = typeof edge.target === "object" ? edge.target : simNodes.find(n => n.id === edge.target);
    if (!s || !tgt || s.x == null || tgt.x == null) return "";
    const dx = tgt.x - s.x;
    const dy = tgt.y - s.y;
    const mx = s.x + dx * 0.5 + dy * 0.15;
    const my = s.y + dy * 0.5 - dx * 0.15;
    return `M ${s.x} ${s.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`;
  };

  const wrapLabel = (label) => {
    const words = label.split(" ");
    const lines = [];
    let current = [];
    words.forEach(w => {
      if (current.join(" ").length + w.length > 14) {
        lines.push(current.join(" "));
        current = [w];
      } else {
        current.push(w);
      }
    });
    if (current.length) lines.push(current.join(" "));
    return lines;
  };

  return (
    <svg ref={svgRef} viewBox="0 0 800 560" style={{ width: "100%", height: "100%" }}>
      <defs>
        {Object.entries(EDGE_COLORS).map(([rel, color]) => (
          <marker
            key={rel}
            id={`arrow-${rel}`}
            viewBox="0 0 10 10"
            refX="8" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} opacity="0.7" />
          </marker>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {simEdges.map((edge, i) => {
        const path = getEdgePath(edge);
        const color = EDGE_COLORS[edge.relationship] || "#94A3B8";
        return (
          <g key={`edge-${i}`}>
            <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4"
              markerEnd={`url(#arrow-${edge.relationship})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="0.5"
              strokeOpacity="0.15" strokeDasharray="4 4" />
          </g>
        );
      })}

      {simNodes.map(node => {
        if (node.x == null) return null;
        const colors = NODE_COLORS[node.type] || NODE_COLORS.program;
        const isHovered = hoveredNode === node.id;
        const isNew = newNodeIds.current.has(node.id);
        const lines = wrapLabel(node.label);
        const labelColor = dark ? colors.bg : colors.bg;

        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              cursor: "default",
              opacity: isNew ? 0 : 1,
              transition: "opacity 0.6s ease-out",
            }}
          >
            <circle
              r={isHovered ? 44 : 40}
              fill={colors.bg}
              fillOpacity={isHovered ? 0.15 : 0.08}
              stroke={colors.bg}
              strokeOpacity={isHovered ? 0.4 : 0.2}
              strokeWidth="1"
            />
            <circle
              r={isHovered ? 32 : 28}
              fill={colors.bg}
              fillOpacity={isHovered ? 0.25 : 0.15}
              stroke={colors.bg}
              strokeOpacity="0.5"
              strokeWidth="1.5"
              filter={isHovered ? "url(#glow)" : ""}
            />
            <circle r="6" fill={colors.bg} fillOpacity="0.9" />
            {lines.map((line, li) => (
              <text
                key={li}
                y={38 + li * 13}
                textAnchor="middle"
                fontSize="10"
                fill={labelColor}
                fontWeight="500"
                fontFamily="'DM Sans', sans-serif"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── UI Components ──────────────────────────────────────────────────────────

function ApiKeyScreen({ apiKey, setApiKey, onSubmit, dark }) {
  const t = dark ? THEME.dark : THEME.light;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: t.bg, transition: "background 0.3s",
    }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 24, color: t.text, marginBottom: 24,
        }}>
          Enter your Gemini API key to begin
        </h2>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="AIza..."
          style={{
            width: "100%", padding: "12px 16px", fontSize: 14,
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 10, color: t.text,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none", marginBottom: 16,
            transition: "all 0.3s",
          }}
          onKeyDown={e => { if (e.key === "Enter" && apiKey.trim()) onSubmit(); }}
        />
        <button
          onClick={onSubmit}
          disabled={!apiKey.trim()}
          style={{
            padding: "12px 32px", fontSize: 14, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            background: `${t.gold}18`, border: `1px solid ${t.borderAccent}`,
            color: t.gold, borderRadius: 10, cursor: apiKey.trim() ? "pointer" : "not-allowed",
            opacity: apiKey.trim() ? 1 : 0.4,
            transition: "all 0.25s",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StartScreen({ onStart, onOpenModal, dark }) {
  const t = dark ? THEME.dark : THEME.light;
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 48, position: "relative",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${t.gold}12 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ maxWidth: 440, textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 38, lineHeight: 1.15, color: t.text,
          marginBottom: 16, letterSpacing: -0.5,
        }}>
          Map the situation your program is{" "}
          <em style={{ fontStyle: "italic", color: t.gold }}>working within</em>
        </h1>
        <p style={{
          fontSize: 15, lineHeight: 1.7, color: t.textMuted,
          marginBottom: 36, fontWeight: 300,
        }}>
          Positive social change happens within a web of conditions — some your
          program creates, many it inherits. This conversation helps you see the
          full picture so you can strengthen your impact and know what to track
          and measure.
        </p>
        <button
          onClick={onStart}
          style={{
            padding: "14px 32px", fontSize: 14, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            background: "transparent", border: `1px solid ${t.borderAccent}`,
            color: t.gold, borderRadius: 10, cursor: "pointer",
            transition: "all 0.25s", letterSpacing: "0.02em",
          }}
          onMouseEnter={e => {
            e.target.style.background = `${t.gold}18`;
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            e.target.style.background = "transparent";
            e.target.style.transform = "translateY(0)";
          }}
        >
          Begin the conversation
        </button>
        <div style={{ marginTop: 20 }}>
          <span
            onClick={onOpenModal}
            style={{
              fontSize: 13, color: t.textDim, cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => { e.target.style.color = t.textMuted; }}
            onMouseLeave={e => { e.target.style.color = t.textDim; }}
          >
            What is this?
          </span>
        </div>
      </div>
    </div>
  );
}

function WhatIsThisModal({ onClose, dark }) {
  const t = dark ? THEME.dark : THEME.light;

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const cards = [
    {
      icon: "?",
      title: "What is a Conditions Web?",
      body: "A map of everything that shapes whether change happens — what your program creates, what others contribute, and what the broader environment provides or withholds.",
    },
    {
      icon: "↔",
      title: "Why mutual causality?",
      body: "Change happens when the right conditions come together, not because a program caused it. Seeing how conditions interact helps you know what to strengthen.",
    },
    {
      icon: "≠",
      title: "How is it different?",
      body: "Your program enters a situation that already exists. This conversation maps that full picture, with your program as one part of it — not the center.",
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.surface, borderRadius: 16,
          maxWidth: 700, width: "100%", padding: "36px 32px 32px",
          position: "relative", border: `1px solid ${t.border}`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 20,
            background: "none", border: "none",
            color: t.textDim, fontSize: 22, cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16, marginBottom: 24,
        }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              borderRadius: 12, padding: "24px 20px",
              border: `1px solid ${t.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, #cbb26a, #c99d28)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "#fff", fontWeight: 600,
                marginBottom: 14,
              }}>
                {card.icon}
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 15, color: t.text, marginBottom: 8,
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: 13, lineHeight: 1.6, color: t.textMuted,
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "16px 18px", borderRadius: 10,
          background: dark ? "rgba(203,178,106,0.06)" : "rgba(120,95,30,0.05)",
          border: `1px solid ${t.border}`,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #cbb26a, #c99d28)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "3px 7px", borderRadius: 4,
            flexShrink: 0, marginTop: 2,
          }}>
            AI
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textMuted }}>
            This conversation draws out what you already know. There are no right
            answers — talk the way you'd talk to a thoughtful colleague. The map is yours.
          </p>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ dark, setDark }) {
  const t = dark ? THEME.dark : THEME.light;
  return (
    <div
      onClick={() => setDark(!dark)}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        borderRadius: 20, padding: 3, cursor: "pointer",
        position: "relative", width: 100, height: 30,
        transition: "background 0.3s",
      }}
    >
      <div style={{
        position: "absolute",
        left: dark ? 52 : 3,
        width: 44, height: 24, borderRadius: 12,
        background: "linear-gradient(135deg, #cbb26a, #c99d28)",
        transition: "left 0.3s ease",
      }} />
      <span style={{
        flex: 1, textAlign: "center", fontSize: 11, fontWeight: 500,
        color: dark ? t.textDim : "#fff",
        position: "relative", zIndex: 1,
        transition: "color 0.3s",
      }}>
        Light
      </span>
      <span style={{
        flex: 1, textAlign: "center", fontSize: 11, fontWeight: 500,
        color: dark ? "#fff" : t.textDim,
        position: "relative", zIndex: 1,
        transition: "color 0.3s",
      }}>
        Dark
      </span>
    </div>
  );
}

// ─── Root Component ─────────────────────────────────────────────────────────

export default function ConditionsWeb() {
  const [apiKey, setApiKey] = useState("");
  const [keySubmitted, setKeySubmitted] = useState(false);
  const [dark, setDark] = useState(true);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webData, setWebData] = useState({ nodes: [], edges: [] });
  const [webVisible, setWebVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const conversationHistory = useRef([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const t = dark ? THEME.dark : THEME.light;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (userText, showInChat = true) => {
    if (!userText.trim() || loading) return;

    conversationHistory.current.push({
      role: "user",
      parts: [{ text: userText }],
    });

    if (showInChat) {
      setMessages(prev => [...prev, { role: "user", text: userText }]);
    }
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: conversationHistory.current,
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        conversationHistory.current.pop();
        setMessages(prev => [
          ...prev,
          { role: "assistant", text: `API error: ${data.error.message || "Unknown error"}` },
        ]);
        setLoading(false);
        return;
      }

      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!fullText) {
        conversationHistory.current.pop();
        setMessages(prev => [
          ...prev,
          { role: "assistant", text: "No response received. Please try again." },
        ]);
        setLoading(false);
        return;
      }

      const parsed = parseWebData(fullText);
      if (parsed) setWebData(parsed);

      const clean = cleanMessage(fullText);
      conversationHistory.current.push({
        role: "model",
        parts: [{ text: fullText }],
      });
      setMessages(prev => [...prev, { role: "assistant", text: clean }]);
    } catch (err) {
      conversationHistory.current.pop();
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  }, [loading, apiKey]);

  const handleStart = () => {
    setStarted(true);
    sendMessage("Hello, I'd like to map my organization's conditions web.", false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) sendMessage(input);
    }
  };

  // ─── API Key Screen ────────────────────────────

  if (!keySubmitted) {
    return (
      <>
        <style>{globalStyles(dark)}</style>
        <ApiKeyScreen
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSubmit={() => setKeySubmitted(true)}
          dark={dark}
        />
      </>
    );
  }

  // ─── Main App ──────────────────────────────────

  return (
    <>
      <style>{globalStyles(dark)}</style>

      {modalOpen && <WhatIsThisModal onClose={() => setModalOpen(false)} dark={dark} />}

      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: t.bg, color: t.text, transition: "all 0.3s",
        maxWidth: 1400, margin: "0 auto",
      }}>
        {/* Header */}
        <header style={{
          padding: "20px 32px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: dark ? "#cbb26a" : "#7a5f15",
              letterSpacing: -0.3,
            }}>
              Conditions Web
            </span>
            <span style={{
              fontSize: 12, color: t.textDim,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Anthralytic
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {started && (
              <button
                onClick={() => setWebVisible(!webVisible)}
                style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${t.border}`,
                  color: t.textMuted, padding: "6px 14px",
                  borderRadius: 20, fontSize: 12, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s", letterSpacing: "0.04em",
                }}
              >
                {webVisible ? "Hide web" : "Show web"}
              </button>
            )}
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>
        </header>

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Chat panel */}
          <div style={{
            display: "flex", flexDirection: "column", flex: 1, minWidth: 0,
            borderRight: started && webVisible ? `1px solid ${t.border}` : "none",
          }}>
            {!started ? (
              <StartScreen
                onStart={handleStart}
                onOpenModal={() => setModalOpen(true)}
                dark={dark}
              />
            ) : (
              <>
                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: "auto", padding: 32,
                  display: "flex", flexDirection: "column", gap: 24,
                }}>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", gap: 14, maxWidth: 720,
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                        animation: "fadeUp 0.3s ease-out",
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, marginTop: 2,
                        background: msg.role === "assistant"
                          ? `${dark ? "#cbb26a" : "#7a5f15"}18`
                          : `${dark ? "#c99d28" : "#7a5f15"}18`,
                        border: `1px solid ${msg.role === "assistant"
                          ? (dark ? "rgba(203,178,106,0.3)" : "rgba(120,95,30,0.3)")
                          : (dark ? "rgba(201,157,40,0.3)" : "rgba(120,95,30,0.3)")}`,
                        color: msg.role === "assistant"
                          ? (dark ? "#cbb26a" : "#7a5f15")
                          : (dark ? "#c99d28" : "#7a5f15"),
                      }}>
                        {msg.role === "assistant" ? "CW" : "You"}
                      </div>
                      <div style={{
                        fontSize: 14, lineHeight: 1.7,
                        color: msg.role === "user" ? t.textMuted : t.text,
                        maxWidth: 580,
                        textAlign: msg.role === "user" ? "right" : "left",
                        whiteSpace: "pre-wrap",
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{
                      display: "flex", gap: 14, maxWidth: 720,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600,
                        background: `${dark ? "#cbb26a" : "#7a5f15"}18`,
                        border: `1px solid ${dark ? "rgba(203,178,106,0.3)" : "rgba(120,95,30,0.3)"}`,
                        color: dark ? "#cbb26a" : "#7a5f15",
                      }}>
                        CW
                      </div>
                      <div style={{
                        display: "flex", gap: 5, alignItems: "center", padding: "4px 0",
                      }}>
                        <div className="typing-dot" />
                        <div className="typing-dot" style={{ animationDelay: "0.15s" }} />
                        <div className="typing-dot" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div style={{
                  padding: "20px 32px 24px",
                  borderTop: `1px solid ${t.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me about your program..."
                      rows={1}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        border: `1px solid ${t.border}`,
                        borderRadius: 12, padding: "12px 16px",
                        color: t.text, fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14, resize: "none", outline: "none",
                        minHeight: 44, maxHeight: 120, lineHeight: 1.5,
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => { e.target.style.borderColor = t.borderAccent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }}
                    />
                    <button
                      onClick={() => { if (input.trim() && !loading) sendMessage(input); }}
                      disabled={loading || !input.trim()}
                      style={{
                        background: `${t.gold}18`,
                        border: `1px solid ${t.borderAccent}`,
                        color: t.gold, width: 44, height: 44,
                        borderRadius: 10, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0, fontSize: 16,
                        opacity: loading || !input.trim() ? 0.25 : 1,
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Web panel */}
          {started && webVisible && (
            <div style={{
              width: 480, flexShrink: 0,
              display: "flex", flexDirection: "column",
              background: dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
            }}>
              {/* Legend header */}
              <div style={{
                padding: "16px 24px 12px",
                borderBottom: `1px solid ${t.border}`,
                flexShrink: 0,
              }}>
                <div style={{
                  fontSize: 11, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: t.textDim,
                  marginBottom: 10,
                }}>
                  Conditions Web — emerging
                </div>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                }}>
                  {Object.entries(NODE_COLORS).map(([type, colors]) => (
                    <div key={type} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 10, color: t.textDim,
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: colors.bg,
                      }} />
                      <span>{NODE_TYPE_LABELS[type]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualization */}
              <div style={{
                flex: 1, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16,
              }}>
                <WebVisualization
                  nodes={webData.nodes}
                  edges={webData.edges}
                  dark={dark}
                />
              </div>

              {/* Footer count */}
              {webData.nodes.length > 0 && (
                <div style={{
                  fontSize: 11, color: t.textDim,
                  padding: "8px 24px 12px", textAlign: "center",
                }}>
                  {webData.nodes.length} conditions · {webData.edges.length} relationships
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Global Styles ──────────────────────────────────────────────────────────

function globalStyles(dark) {
  const t = dark ? THEME.dark : THEME.light;
  return `
    body {
      background: ${t.bg};
      color: ${t.text};
      font-family: 'DM Sans', sans-serif;
      margin: 0;
      transition: background 0.3s, color 0.3s;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.15); opacity: 0.6; }
    }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    .typing-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${t.gold};
      opacity: 0.6;
      animation: typingBounce 1.2s ease-in-out infinite;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(232,228,220,0.1)" : "rgba(0,0,0,0.1)"}; border-radius: 2px; }

    /* Textarea placeholder */
    textarea::placeholder {
      color: ${t.textDim};
    }

    /* Input focus removal of default outline */
    input:focus, textarea:focus {
      outline: none;
    }
  `;
}
