---
sidebar_position: 1
title: Overview
---

# AI Agent Integration

Atomic is the first version control system designed for AI-assisted development. Agent identity, provenance, and attestation are core concepts — not bolted-on metadata flags.

## How It Works

When you enable agent hooks, Atomic automatically records every agent turn as a change with full metadata. No manual flags, no wrapper scripts, no environment variables.

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
│    ├── Create Attestation (enriched with model/cost/token data)     │
│    ├── Switch back to user's original view                          │
│    └── Clean up session state                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install an Integration

Choose the adapter for your agent and install it into the agent's normal configuration:

| Integration | Agent |
|-------------|-------|
| `atomic-claude` | Claude Code |
| `atomic-codex` | Codex |
| `atomic-cline` | Cline |
| `atomic-pi` | Pi |
| `atomic-copilot` | GitHub Copilot |
| `atomic-cursor` | Cursor |
| `atomic-opencode` | OpenCode |

Some adapters are global hooks or plugins. Others also require repo-local instruction files so the agent follows the Atomic intent workflow in each project.

→ [Installing Agent Integrations](installing-agent-integrations.md)

### 2. Work Normally

Use your agent as you always do. Atomic hooks fire automatically on each lifecycle event.

### 3. Review What Happened

```bash
# See the recorded changes
atomic log

# Check session status
atomic agent status --verbose

# Inspect attestations (cost, tokens, model breakdown)
atomic agent attest

# Generate reasoning summaries
atomic agent explain <session-id> --all --save
```

## What Gets Recorded

Every agent turn produces an Atomic change containing:

| Data | Where | Description |
|------|-------|-------------|
| **Change header** | `hashed.header` | Message, author, timestamp |
| **Provenance** | `hashed.provenance` | Model, provider, session ID, turn number, token usage, cost |
| **Session envelope** | `hashed.metadata` | Turn timing, files touched, agent identity |
| **Graph operations** | `hashed.atoms` | The actual content changes (vertices + edges) |
| **Semantic operations** | `hashed.file_ops` | Line and token-level operations for human-readable diffs |
| **Transcript** | `unhashed` | Condensed conversation (redactable, doesn't affect hash) |

Because provenance and the session envelope are in the **hashed** section, they are part of the change's cryptographic identity. Tampering with attribution changes the hash — it's tamper-evident by construction.

## Agent Identity

Agent changes are attributed using Ed25519 signatures with a `+tag` email format that links back to the human developer:

```
User identity:    Lee Faus <lee@atomic.dev>
Agent author:     claude+60f5 <lee@atomic.dev>
```

The `+tag` is a short hash of the session ID — every agent turn traces back to a specific session and a specific human.

| Agent | Example Author |
|-------|---------------|
| Claude Code | `claude+60f5 <lee@atomic.dev>` |
| Gemini CLI | `gemini+abcd <lee@atomic.dev>` |
| OpenCode | `opencode+9876 <lee@atomic.dev>` |

## Agent Isolation with Views

When a session starts, Atomic automatically creates an **isolated agent view** (Draft, parent: current view). All agent work happens on this view:

```bash
# Before session: you're on "dev"
# Session starts: Atomic creates "agent-ses_3781fc..." (Draft, parent: dev)
# Agent works on its isolated view
# Session ends: Atomic switches back to "dev"
```

Agent views use the single canonical graph with view filters:
- All edges are written directly to `GRAPH` (single source of truth)
- The agent view's filter chain (agent → dev → main) determines which edges are visible
- The agent sees the full project context plus its own isolated changes

When you're done, insert changes into the parent and delete the agent view:

```bash
# Insert specific changes from the agent view
atomic insert <change-hash> --to dev

# Delete the agent view — removes VIEW_CHANGES entries, orphaned edges cleaned by GC
atomic view delete agent-ses_3781fc...
```

## Supported Agent Integrations

| Integration | Agent | Hook or Extension Model | Recording Boundary |
|-------------|-------|-------------------------|--------------------|
| **atomic-claude** | Claude Code | Native Claude Code hooks | Turn end |
| **atomic-codex** | Codex | Codex hooks | Turn end, with current hook limitations |
| **atomic-cline** | Cline | Executable hook scripts | Task completion |
| **atomic-pi** | Pi | Pi extension | Turn end |
| **atomic-copilot** | GitHub Copilot | Repository hook manifest | Session end |
| **atomic-cursor** | Cursor | Cursor hooks | Turn end |
| **atomic-opencode** | OpenCode | OpenCode plugin | Session idle / turn end |

All integrations share the same Rust-side orchestrator. The only difference is how hooks are installed and how events are parsed — the adapter normalizes agent-specific events into common `TurnEvent` values before the orchestrator processes them.

## Key Concepts

### Provenance Graphs

Every agent session builds a **causal decision DAG** — not just what changed, but why. Tool calls are classified into node types (Exploration, Commitment, Verification) with causal edges inferred automatically.

→ [Learn more about Provenance Graphs](provenance.md)

### Attestations

When a session ends, Atomic creates an **attestation** — a graph-level audit node summarizing cost, token usage, model breakdown, and which changes are covered.

→ [Learn more about Attestations](attestations.md)

## Next Steps

- [Provenance Graphs](provenance.md) — How agent reasoning is captured
- [Attestations](attestations.md) — Session-level audit and cost tracking
- [`atomic agent` command reference](/commands/agent) — Full CLI documentation
- [Comparison with Git](/getting-started/comparison-with-git) — Why patch theory matters for agents