# CLAUDE.md — Conditions Web
## Anthralytic

This is the complete specification for the Conditions Web application.
Read it fully before writing any code. Every decision here is intentional.
Do not paraphrase or simplify the system prompt — use it exactly as written.

---

## WHAT THIS IS

Conditions Web is the foundational module of Anthralytic — an AI-powered platform
that helps resource-constrained social impact organizations (nonprofits, government
agencies, corporate social impact teams) do evaluative thinking and social impact
strategy without dedicated evaluation staff.

Purpose: help organizations see the full web of conditions their program is
operating within, so they can strengthen their impact and know what to track
and measure.

The core premise: positive social change happens within a web of conditions —
some a program creates, many it inherits. This replaces the logic model as the
starting point. A logic model assumes linear causation (we do X which causes Y
which produces Z). The Conditions Web captures how change actually arises from
configurations of interacting conditions — some the program creates, many it
doesn't control.

The Conditions Web feeds downstream into:
- Conditions Strategy module (what to work on, what to track, what to do more/less of)
- Impact Wizard (generates a funder-facing Theory of Change from the web when needed
  — as a translation artifact for external audiences, not the real working model)

---

## TECH STACK

- React (functional components, hooks)
- Google Gemini API (gemini-2.0-flash) — NOT Anthropic API
- D3.js for force-directed graph visualization (import from CDN)
- Single file: conditions-web.jsx
- No localStorage, sessionStorage, or any browser storage — all state in React

### Google Gemini API call:
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: conversationHistory,
      generationConfig: { maxOutputTokens: 1000 }
    })
  }
);
const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
```

### Gemini conversation history format:
```javascript
{ role: "user",  parts: [{ text: "message" }] }
{ role: "model", parts: [{ text: "response" }] }
```

### API Key:
On first load show a minimal key entry screen before the start screen.
Store key in React state only. Never persist it anywhere.

---

## BRAND & VISUAL DESIGN

### Anthralytic Colors
Gold light:   #cbb26a  (RGB 203, 178, 106)
Gold dark:    #c99d28  (RGB 201, 157, 40)
Black:        #000000
Dark bg:      #0e0d0a
Dark text:    #f0ece0
Light bg:     #faf8f2  — warm off-white, intentionally paper-like
Light text:   #18150a

### Light Mode Aesthetic Note
The light mode should feel like paper — warm, slightly cream, not clinical white.
#faf8f2 is the correct background. Do not use #ffffff or any cool-toned white.
The gold palette reads beautifully against this tone and should stay the same
family as dark mode. This is a deliberate design choice, not a default.

### Light/Dark Mode
The app supports light and dark mode with a toggle in the header (top right).
Toggle shows "Light" / "Dark" label with a pill switch, gold thumb.
All colors transition smoothly (transition: 0.3s).

Dark theme token reference:
- bg: #0e0d0a
- surface: #131210
- text: #f0ece0
- textMuted: rgba(240,236,224,0.65)
- textDim: rgba(240,236,224,0.4)
- gold: #cbb26a
- border: rgba(203,178,106,0.15)
- borderAccent: rgba(203,178,106,0.45)

Light theme token reference:
- bg: #faf8f2
- surface: #ffffff
- text: #18150a
- textMuted: rgba(24,21,10,0.65)
- textDim: rgba(24,21,10,0.42)
- gold: #7a5f15
- border: rgba(120,95,30,0.18)
- borderAccent: rgba(120,95,30,0.5)

### Typography
Display/headings: DM Serif Display (Google Fonts, italic variant included)
Body/UI:          DM Sans (weights 300, 400, 500, 600)
Import URL: https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap

### Aesthetic Direction
Dark (default), warm, organic. The gold palette feels grounded and serious —
this is a thinking partner, not a cheerful SaaS tool. Minimal chrome.
The conversation and the web are the product.
Add a subtle radial gold glow behind the landing screen content.

---

## NINE CONDITION TYPES

The web maps nine types of conditions. Colors and labels below.
The AI uses these internally — types are NEVER named aloud in conversation.

| Type | UI Label | Color | Purpose |
|------|----------|-------|---------|
| historical | Historical/Systemic | #3D405B | Structural forces, policies, history — the long arc that produced the situation |
| situational | Situational | #c99d28 | What's happening right now in the broader environment — current moment |
| landscape | Landscape | #81B29A | External organizations, agencies, actors, gaps in the space |
| community | Community | #6B8F71 | Internal assets: cultural strengths, networks, social fabric, community knowledge |
| participant | Participant | #7a6a4a | Who you serve: circumstances, profiles, strengths, history, readiness |
| organizational | Organizational | #8B7355 | Enabling conditions inside the program: staff, capacity, leadership, stability |
| program | What You Bring | #cbb26a | This program's specific contribution to the web |
| relational | Relational | #c99d28 | Quality of engagement: trust, safety, felt respect, continuity |
| risks | Risks | #8B4513 | Conditions that could undermine or reverse progress |

### Edge relationship types:
produces, maintains, addresses, partially_addresses,
enables, amplifies, blocks, depends_on

---

## APPLICATION LAYOUT

Full viewport height. Two-panel layout once conversation starts.

### Header (always visible):
LEFT: "Conditions Web" (DM Serif Display, gold) | "Anthralytic" (small, muted, uppercase)
RIGHT: Light/Dark toggle only — nothing else

### Before conversation: full-width start screen (centered in viewport)
### After conversation starts: two-panel split
  LEFT PANEL (flex: 1) — conversation
  RIGHT PANEL (480px fixed) — live web visualization

---

## START SCREEN

Centered, max-width 440px. No eyebrow label.

Heading (DM Serif Display, 38px):
  "Map the situation your program is working within"
  — "working within" in italic gold

Body (DM Sans 300, 15px, muted):
  "Positive social change happens within a web of conditions — some your
  program creates, many it inherits. This conversation helps you see the
  full picture so you can strengthen your impact and know what to track
  and measure."

CTA button: "Begin the conversation" — gold outlined, transparent background

Below the button (small, muted, no underline):
  "What is this?" — clicking opens the modal

---

## "WHAT IS THIS?" MODAL

Progressive disclosure. Opens on "What is this?" click.
Closes on: × button, Escape key, or clicking the backdrop.

Backdrop: semi-transparent blur overlay
Modal: max-width 700px, dark card (or light card in light mode), rounded 16px

Three cards in a row, gold gradient icons:

Card 1 — icon: ?
Title: "What is a Conditions Web?"
Body: "A map of everything that shapes whether change happens — what your
program creates, what others contribute, and what the broader environment
provides or withholds."

Card 2 — icon: ↔
Title: "Why mutual causality?"
Body: "Change happens when the right conditions come together, not because
a program caused it. Seeing how conditions interact helps you know what
to strengthen."

Card 3 — icon: ≠
Title: "How is it different?"
Body: "Your program enters a situation that already exists. This conversation
maps that full picture, with your program as one part of it — not the center."

Below cards — AI note with gold "AI" badge:
"This conversation draws out what you already know. There are no right
answers — talk the way you'd talk to a thoughtful colleague. The map is yours."

---

## CHAT INTERFACE

- Messages scroll, newest at bottom, auto-scroll on new message
- Assistant avatar: "CW" in gold circle
- User avatar: "You" in muted circle, right-aligned messages
- Typing indicator: three gold dots bouncing (while API call in progress)
- Input: textarea, Enter to send, Shift+Enter for newline
- Send button: gold → arrow, disabled when empty or loading
- Input placeholder: "Tell me about your program..."

---

## WEB PANEL

- Header: legend showing all 9 condition type dots with labels
- D3 force-directed visualization fills remaining space
- Empty state: pulsing gold circle, text "Your conditions web will emerge here as we talk"
- Footer: "{n} conditions · {n} relationships" — appears when web has content
- NO node/condition dragging — users shape the web through conversation only
- "Hide web" / "Show web" toggle appears in header after conversation starts

---

## WEB VISUALIZATION — D3 FORCE-DIRECTED

Use D3.js loaded from CDN. React useRef for SVG, useEffect to init and update.

### Force simulation:
```javascript
d3.forceSimulation(nodes)
  .force("link", d3.forceLink(edges).id(d => d.id).distance(120))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(50))
```

When webData updates: update simulation nodes/edges, restart with alpha(0.3)
to re-settle gently without chaos.

### Each condition renders as:
- Outer glow ring (largest circle, low opacity fill)
- Middle ring (medium circle, border)
- Center dot (small filled circle)
- Label text below, wrapped at ~14 chars/line
- On hover: scale up slightly, glow filter

### Edges render as:
- Curved quadratic bezier paths (slight perpendicular offset for curve)
- Directional SVG arrow markers, colored by relationship type
- 0.4 opacity stroke + 0.15 opacity dashed shadow path

### Critical ordering:
The program ("What You Bring") condition must appear AFTER historical,
situational, landscape, and community conditions in the web build sequence.
The web exists before the program enters it — this should be visually apparent.

New conditions fade in as they appear. Simulation runs continuously
so the web breathes slightly and feels alive.

---

## WEB DATA FORMAT

After EVERY AI response, the AI emits a JSON block at the end after "---".
The front end parses this to update the web in real time.

```
[conversation text here]

---
{"nodes":[{"id":"n1","label":"Housing instability","type":"situational"},{"id":"n2","label":"Child welfare system","type":"historical"}],"edges":[{"from":"n2","to":"n1","relationship":"produces"}]}
```

### Parse and clean:
```javascript
function parseWebData(text) {
  const match = text.match(/---\s*(\{[\s\S]*\})\s*$/);
  if (match) { try { return JSON.parse(match[1]); } catch(e) {} }
  return null;
}
function cleanMessage(text) {
  return text.replace(/---\s*\{[\s\S]*\}\s*$/, "").trim();
}
```

Web state is cumulative — each emission is the complete current state.
Replace entire webData on each update.

---

## STATE

```javascript
const [apiKey, setApiKey]     = useState("");
const [keySubmitted, setKey]  = useState(false);
const [dark, setDark]         = useState(true);
const [started, setStarted]   = useState(false);
const [messages, setMessages] = useState([]);      // { role, text }
const [input, setInput]       = useState("");
const [loading, setLoading]   = useState(false);
const [webData, setWebData]   = useState({ nodes: [], edges: [] });
const [webVisible, setWebV]   = useState(true);
const [modalOpen, setModal]   = useState(false);
const conversationHistory     = useRef([]);         // Gemini format
```

---

## INITIALIZATION

When user clicks "Begin the conversation", send this as the opening user
message (do not display it in the chat UI — it is invisible):

  "Hello, I'd like to map my organization's conditions web."

This triggers the AI to open naturally without the user having to go first.

---

## COPY — EXACT STRINGS

Header title:           Conditions Web
Header subtitle:        Anthralytic
Toggle:                 Light / Dark
Heading:                Map the situation your program is working within
Heading italic gold:    working within
Body:                   Positive social change happens within a web of conditions —
                        some your program creates, many it inherits. This conversation
                        helps you see the full picture so you can strengthen your
                        impact and know what to track and measure.
CTA button:             Begin the conversation
Disclosure link:        What is this?
Web panel header:       Conditions Web — emerging
Empty state:            Your conditions web will emerge here as we talk
Count footer:           {n} conditions · {n} relationships
Input placeholder:      Tell me about your program...
Assistant avatar:       CW
User avatar:            You
API key heading:        Enter your Gemini API key to begin
API key placeholder:    AIza...
API key button:         Continue
Hide/show toggle:       Hide web / Show web

---

## WHAT NOT TO DO

- Do not use localStorage, sessionStorage, or any browser storage
- Do not use the Anthropic API — this uses Google Gemini
- Do not use Inter, Roboto, Arial, or system-ui fonts
- Do not use purple gradients or generic SaaS color schemes
- Do not allow condition dragging in the visualization
- Do not show the JSON data to the user anywhere
- Do not use the word "node" in any UI copy — use "condition"
- Do not use the word "ecosystem" in any UI copy — use "landscape"
- Do not use "evaluation design" anywhere
- Do not use "Situational Mapping" in the UI (it is not shown to users)
- Do not mention other tools or compare to logic models in any UI copy
- Do not use <form> tags — use React onClick/onChange handlers

---

## THE SYSTEM PROMPT

Use this exactly. Do not summarize, rewrite, or shorten it.

```
You are a skilled evaluator helping a social impact organization map their
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
Your job is to help them see it. The knowing is already there.
```

---

## NOTES FOR CLAUDE CODE

Build the entire application in a single conditions-web.jsx file.

The system prompt above is exact — use it verbatim, embedded as a constant.

The most technically complex piece is the D3 force-directed graph inside
React. Use useRef for the SVG element and useEffect to initialize and update
the simulation. When webData changes, merge new nodes/edges into the
simulation and restart with alpha(0.3) to re-settle gently.

Preserve node positions between updates — only new nodes should move to find
their place. Existing nodes should stay roughly where they are.

The visual quality of the web matters. It should feel organic and alive,
not like a flowchart. Invest in the D3 implementation.

Voice mode is not in scope for this build. Text conversation only.
The architecture should not preclude adding voice later.
