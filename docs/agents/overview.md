---
sidebar_position: 1
title: How Atomic Records What Your AI Coding Agent Did
description: See how Atomic turns file-changing AI agent activity into isolated, reviewable changes with provenance and session audit data.
---

# How Atomic Records What Your AI Coding Agent Did

Atomic uses agent lifecycle hooks to record each supported file-changing turn as a content-addressed change, connect it to observed prompts and tool activity, and summarize the session with model attribution and available usage data. Read-only turns are skipped, and token or cost fields remain empty when an integration does not report them.

## How It Works

When you enable agent hooks, Atomic automatically records supported file-changing turns with the metadata supplied by the integration. No manual record flags or wrapper scripts are required.

```
You prompt the agent → agent modifies files → Atomic records the turn
                                                │
                                                ├── Change: "Turn 3: Fix the auth bug"
                                                ├── Provenance: anthropic/claude-sonnet-4-5, session, turn #3
                                                ├── Envelope: timing, files touched, model info
                                                ├── Provenance Graph: goal → explorations → commitments → verification
                                                └── Attestation: session cost, token breakdown, model usage (at session end)
```

### The Agent Lifecycle

Each agent session follows a well-defined lifecycle managed by the **TurnOrchestrator**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Agent Session                               │
│                                                                     │
│  session-start                                                      │
│    ├── Create isolated agent view (Draft, parent: current)          │
│    ├── Initialize provenance accumulator                            │
│    └── Switch working copy to agent view                            │
│                                                                     │
│  Turn 1:                                                            │
│    ├── user-prompt  → Goal node in provenance graph                 │
│    ├── after-tool   → Exploration/Commitment/Verification nodes     │
│    ├── after-tool   → (more tool nodes...)                          │
│    └── stop         → record change → PatchProposal node            │
│                       → save ProvenanceGraph to repository          │
│                                                                     │
│  Turn 2:                                                            │
│    ├── user-prompt  → New goal node (chains to previous)            │
│    ├── after-tool   → ...                                           │
│    └── stop         → record change → save ProvenanceGraph          │
│                                                                     │
│  session-end                                                        │
│    ├── Flush any pending file-changing turn                         │
│    ├── Create Attestation when changes were recorded                │
│    └── Leave working copy on the agent view for review              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install an Integration

Install the adapter for your agent with one command. `enable` fetches the integration package from Atomic storage and installs its hooks, plugins, skills, and instruction files for you — no clone, no `npm`/`npx`, no shell script:

```bash
atomic agent enable --agent opencode

# Or let Atomic detect the agent from directories like .claude/ or .cursor/
atomic agent enable
```

Supported agents:

| Integration | Agent |
|-------------|-------|
| `atomic-agy` | Antigravity CLI |
| `atomic-claude` | Claude Code |
| `atomic-cline` | Cline |
| `atomic-codex` | Codex |
| `atomic-copilot` | GitHub Copilot |
| `atomic-cursor` | Cursor |
| `atomic-devin` | Devin |
| `atomic-grok` | Grok Build |
| `atomic-kilo` | Kilo Code |
| `atomic-kiro` | Kiro |
| `atomic-opencode` | OpenCode |
| `atomic-pi` | Pi |

A few agents need one manual step afterward (for example, enabling hooks in an IDE panel). Removal is symmetric: `atomic agent disable --agent <name>` removes exactly what was installed and keeps files you edited.

→ [Installing Agent Integrations](installing-agent-integrations.md)

### 2. Work Normally

Use your agent as you always do. Atomic hooks fire automatically on each lifecycle event.

### 3. Review What Happened

```bash
# See the recorded changes
atomic log

# Check session status
atomic agent status --verbose

# Inspect one change: files, AI metadata, cost, and Change Ledger
atomic change <change-hash>

# List separate session-level attestations
atomic agent attest

# Project the change ledger as standards-oriented provenance
atomic provenance trace <change-hash>

# Generate and save a session reasoning summary
atomic agent explain <session-id> --all --save
```

## What Gets Recorded

Each supported turn that modifies files produces an Atomic change containing:

| Data | Where | Description |
|------|-------|-------------|
| **Change header** | `hashed.header` | Message, author, timestamp |
| **Provenance** | `hashed.provenance` | Model, provider, session ID, turn number, token usage, cost |
| **Session envelope** | `hashed.metadata` | Turn timing, files touched, agent identity |
| **Graph operations** | `hashed.hunks` | The actual content changes (vertices + edges) |
| **Semantic operations** | `hashed.file_ops` | Line and token-level operations for human-readable diffs |
| **Transcript** | `unhashed` | Condensed conversation (redactable, doesn't affect hash) |

Because provenance and the session envelope are in the **hashed** section, they are part of the change's cryptographic identity. Tampering with attribution changes the hash — it's tamper-evident by construction.

## Agent Identity

Agent changes carry structured author attribution using a `+tag` email format that links the change to an agent session and the configured human identity:

```
User identity:    Lee Faus <lee@atomic.dev>
Agent author:     claude+60f5 <lee@atomic.dev>
```

The `+tag` is a short hash of the session ID used for display attribution. It is not itself a signature or proof that a specific human delegated the session.

| Agent | Example Author |
|-------|---------------|
| Claude Code | `claude+60f5 <lee@atomic.dev>` |
| Gemini CLI | `gemini+abcd <lee@atomic.dev>` |
| Grok Build | `grok+019f <lee@atomic.dev>` |
| OpenCode | `opencode+9876 <lee@atomic.dev>` |

## Agent Isolation with Views

When a session starts, Atomic attempts to create an **isolated agent view** (Draft, parent: current view) and align the working copy to it. Recording uses that session view; failure to prepare or align the required view is reported rather than silently attributing the work to another view:

```bash
# Before session: you're on "dev"
# Session starts: Atomic creates "agent-ses_3781fc..." (Draft, parent: dev)
# Agent works on its isolated view
# Session ends: the working copy remains on the agent view for review
```

Agent views use the single canonical graph with view filters:
- All edges are written directly to `GRAPH` (single source of truth)
- The agent view's filter chain (agent → dev → main) determines which edges are visible
- The agent sees the full project context plus its own isolated changes

When you're done, review the agent view, insert approved changes, switch to the target, and then delete the draft:

```bash
# Review while the agent view is current
atomic log
atomic diff

# Insert approved changes into dev
atomic insert change <change-hash> --to dev

# A current view cannot be deleted, so leave the agent view first
atomic view switch dev
atomic view delete agent-ses_3781fc...
```

## Supported Agent Integrations

| Integration | Agent | Hook or Extension Model | Recording Boundary |
|-------------|-------|-------------------------|--------------------|
| **atomic-agy** | Antigravity CLI | Plugin (hooks + skills) | Turn end (on idle) |
| **atomic-claude** | Claude Code | Native Claude Code hooks | Turn end |
| **atomic-cline** | Cline | Executable hook scripts | Task completion |
| **atomic-codex** | Codex | Codex hooks | Turn end, with current hook limitations |
| **atomic-copilot** | GitHub Copilot | Repository hook manifest | Session end |
| **atomic-cursor** | Cursor | Cursor hooks | Turn end |
| **atomic-devin** | Devin | Hook wiring | Session |
| **atomic-grok** | Grok Build | Native Grok hooks (`~/.grok/hooks/`) | Turn end |
| **atomic-kilo** | Kilo Code | Rules + agent config | Turn end |
| **atomic-kiro** | Kiro | IDE steering + hook scripts | Turn end |
| **atomic-opencode** | OpenCode | OpenCode plugin | Session idle / turn end |
| **atomic-pi** | Pi | Pi extension | Turn end |

All integrations share the same Rust-side orchestrator. The only difference is how hooks are installed and how events are parsed — the adapter normalizes agent-specific events into common `TurnEvent` values before the orchestrator processes them.

## Key Concepts

### Provenance Graphs

Each recorded agent session builds a **causal decision DAG** of observed goals, tool activity, edits, and verification. Tool calls are classified into node types (Exploration, Commitment, Verification), and causal edges are inferred automatically; the graph does not expose private chain-of-thought.

→ [Learn more about Provenance Graphs](provenance.md)

### Attestations

When a session with recorded changes ends, Atomic attempts to create an **attestation** — a graph-level audit node summarizing model attribution, available cost and token usage, and which changes are covered.

→ [Learn more about Attestations](attestations.md)

## Next Steps

- [How to See Why an AI Agent Changed Your Code](provenance.md) — Trace observed activity and inferred causal links
- [AI Agent Session Audit Trails](attestations.md) — Session-level audit and cost tracking
- [`atomic agent` command reference](/commands/agent) — Full CLI documentation
- [Comparison with Git](/getting-started/comparison-with-git) — Why patch theory matters for agents