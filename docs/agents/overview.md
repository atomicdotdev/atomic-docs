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
│    ├── Create isolated agent stack (forked from current)            │
│    ├── Initialize provenance accumulator                            │
│    └── Switch working copy to agent stack                           │
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
│    ├── Switch back to user's original stack                         │
│    └── Clean up session state                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Enable Hooks

```bash
# Auto-detect which agent is present (Claude Code, Gemini CLI, or OpenCode)
atomic agent enable

# Or target a specific agent
atomic agent enable --agent claude-code
atomic agent enable --agent gemini-cli
atomic agent enable --agent opencode
```

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

## Agent Isolation with Stacks

When a session starts, Atomic automatically creates an **isolated agent stack** forked from the current stack. All agent work happens on this stack:

```bash
# Before session: you're on "dev"
# Session starts: Atomic creates "agent-ses_3781fc..." (Local, parent: dev)
# Agent works on its isolated stack
# Session ends: Atomic switches back to "dev"
```

Agent stacks use the [two-tier graph model](/concepts/graph-model-explained):
- Agent edges are stored in `STACK_GRAPH` (local, ephemeral)
- Parent stack edges are in `GRAPH` (shared, permanent)
- The agent sees the union of both — full project context with isolated changes

When you're done, apply changes to the parent and delete the agent stack:

```bash
# Apply specific changes from the agent stack
atomic apply <change-hash> --to dev

# Delete the agent stack — cascade-deletes its edges, zero orphans
atomic stack delete agent-ses_3781fc...
```

## Supported Agents

| Agent | Config Location | Hook System | Turn Boundary |
|-------|----------------|-------------|---------------|
| **Claude Code** | `.claude/settings.json` | Native hooks | `stop` event |
| **Gemini CLI** | `.gemini/settings.json` | Native hooks | `after-agent` event |
| **OpenCode** | `.opencode/plugins/atomic/` | Plugin-based | `session.idle` event |

All three agents share the same Rust-side orchestrator. The only difference is how hooks are installed and how events are parsed — the `AgentHook` trait normalizes everything into common `TurnEvent` values before the orchestrator processes them.

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