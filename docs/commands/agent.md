---
sidebar_position: 18
title: agent
---

# atomic agent

Manage AI agent integration for automatic turn-level recording with full provenance.

## Synopsis

```bash
atomic agent <SUBCOMMAND>
```

## Description

The `agent` command manages integration with AI coding agents — Claude Code, Gemini CLI, and OpenCode. When enabled, every agent turn is automatically recorded as an Atomic change with full provenance, and every session produces a provenance graph (causal decision DAG) and an attestation (session-level audit node).

No daemon required. Each hook invocation is a standalone process that opens the repo, does its work, and exits.

## Subcommands

### `enable`

Install agent hooks for turn-level recording.

```bash
# Auto-detect which agent is present
atomic agent enable

# Specify the agent explicitly
atomic agent enable --agent claude-code

# Force reinstall (removes existing hooks first)
atomic agent enable --force

# Install for all detected agents
atomic agent enable --all
```

**Options:**

| Option | Description |
|--------|-------------|
| `--agent <NAME>` | Target a specific agent: `claude-code`, `gemini-cli`, `opencode` |
| `--force` | Remove existing Atomic hooks before reinstalling |
| `--all` | Install hooks for all detected agents |
| `--global` | Install hooks globally (all projects) |

**What it does:**

- **Claude Code** — Writes hooks into `.claude/settings.json`
- **Gemini CLI** — Writes hooks into `.gemini/settings.json`
- **OpenCode** — Copies plugin to `.opencode/plugins/atomic/`

### `disable`

Remove agent hooks while preserving non-Atomic hooks.

```bash
# Disable for auto-detected agent
atomic agent disable

# Disable for a specific agent
atomic agent disable --agent claude-code
```

**Options:**

| Option | Description |
|--------|-------------|
| `--agent <NAME>` | Target a specific agent |

### `status`

Show agent integration status.

```bash
# Show status
atomic agent status

# Show verbose status with session details
atomic agent status --verbose
```

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose`, `-v` | Show session details, turn history, and watcher state |

**Output includes:**

- Installed agents and hook status
- Active sessions with turn counts
- File watcher state
- Recent recording history

### `explain`

Generate AI reasoning summaries for recorded agent turns.

```bash
# Explain the most recent session
atomic agent explain <session-id>

# Explain a specific turn
atomic agent explain <session-id> --turn 3

# Explain all turns and save reasoning + learnings
atomic agent explain <session-id> --all --save
```

**Options:**

| Option | Description |
|--------|-------------|
| `--turn <N>` | Explain a specific turn number |
| `--all` | Explain all turns in the session |
| `--save` | Save reasoning into the change's unhashed section and append learnings to the agent's context file |

When `--save` is used:

1. Reasoning is stored in the change (travels on push, rendered in server UI)
2. Repo and Workflow learnings are appended to the agent's context file (`CLAUDE.md`, `GEMINI.md`, or `opencode.md`)

### `attest`

List and inspect attestations — graph-level audit nodes capturing AI cost, token usage, model breakdown, and code change statistics.

Attestations are created automatically at session end. They aggregate data from the provenance entries embedded in each covered change: model name, token counts (input, output, cache read/write), cost in USD, and lines added/removed from the CRDT semantic layer.

```bash
# List all attestations
atomic agent attest

# Show details for a specific attestation
atomic agent attest --hash XMJZ3IPF

# Show attestations for a stack
atomic agent attest --stack dev

# Verbose output with model breakdown
atomic agent attest --verbose
```

**Options:**

| Option | Description |
|--------|-------------|
| `--hash <PREFIX>` | Show details for a specific attestation (supports prefix matching) |
| `--stack <NAME>` | Filter attestations covering changes in this stack |
| `--verbose`, `-v` | Show per-model token breakdown and per-change details |

**Example output:**

```
$ atomic agent attest

  XMJZ3IPF OpenCode · claude-sonnet-4-5 · 12.4k tokens · 3m 42s · 2 changes
  R3KQP7YN Claude Code · claude-sonnet-4-5 · 8.1k tokens · 1m 15s · 1 change

──────────────────────────────────────────
Total: $0.27 · 3 changes covered · 20.5k tokens
```

**Detail view:**

```
$ atomic agent attest --hash XMJZ3IPF

Attestation XMJZ3IPF

Agent:     OpenCode
Session:   agent-ses_3781fc7a6ffet5c6r1ILy1BEbv
Changes:   2 changes
Wall time: 3m 42s
Cost:      $0.15
Tokens:    12.4k
Code:      +116 -8

Model Breakdown:
  claude-sonnet-4-5: 3.2k in / 9.2k out · $0.15

Changes Covered (2):
  ABC12345
  DEF67890

Coverage:
  dev                  ████████████░░░░░░░░ 2/5 (40%)
```

## How It Works

```
You prompt the agent → agent reads, edits, tests → Atomic records the turn
                                                      │
                                                      ├── Change: "Turn 3: Fix the auth bug"
                                                      ├── Provenance: anthropic/claude-sonnet-4-5, session, turn
                                                      ├── Envelope: timing, files touched, model info
                                                      ├── Provenance Graph: goal → explorations → commitment → verification
                                                      └── Transcript: conversation (unhashed, redactable)
```

### On Each Turn End

1. **Status** — ask the repository what changed since the last recorded state
2. **Add** — track any new files the agent created
3. **Record** — create an Atomic change with AI provenance metadata
4. **Provenance** — append a PatchProposal node, convert the accumulated graph to a content-addressed `ProvenanceGraph`, and save it to the repository

### On Session End

5. **Attestation** — aggregate model/cost/token data from all covered changes and create a session-level audit node
6. **Stack restore** — switch back to the user's original stack

### Provenance Graph Pipeline

Throughout the session, the **ProvenanceAccumulator** builds a causal decision DAG:

- **`user-prompt`** → appends a **Goal** node (the user's intent)
- **`after-tool`** → appends a classified tool node (**Exploration**, **Commitment**, **Verification**, or **Execution**) with causal edges inferred from context
- **`stop`** → appends a **PatchProposal** node, converts to `ProvenanceGraph`, saves to `.atomic/changes/`

The accumulator is persisted to `.atomic/sessions/{session_id}/graph.json` between hook invocations (each hook is a separate process). Writes are atomic (temp file + rename) to prevent corruption.

Provenance graphs are pushed to remotes alongside changes and rendered in the web UI.

## Agent Identity

Agent changes are attributed using a `+tag` email format:

```
User identity:   Lee Faus <lee@atomic.dev>
Agent author:    claude+60f5 <lee@atomic.dev>
```

| Agent | Example Author |
|-------|---------------|
| Claude Code | `claude+60f5 <lee@atomic.dev>` |
| Gemini CLI | `gemini+abcd <lee@atomic.dev>` |
| OpenCode | `opencode+9876 <lee@atomic.dev>` |

## Supported Agents

| Agent | Config File | Hook System |
|-------|------------|-------------|
| Claude Code | `.claude/settings.json` | Native hooks |
| Gemini CLI | `.gemini/settings.json` | Native hooks |
| OpenCode | `.opencode/plugins/atomic/` | Plugin-based |

## Examples

### Enable and work with Claude Code

```bash
# Initialize repo and enable agent
atomic init
atomic agent enable --agent claude-code

# Work with Claude Code normally — turns are recorded automatically

# Check what happened
atomic log
atomic agent status --verbose

# Inspect attestations
atomic agent attest

# Generate reasoning summary
atomic agent explain <session-id> --all --save
```

### Review agent work before promoting

```bash
# See what the agent changed on its isolated stack
atomic log --stack agent-ses_3781fc...

# Apply specific changes to your stack
atomic apply <change-hash> --to dev

# Clean up the agent stack
atomic stack delete agent-ses_3781fc...
```

### Push agent data to remote

```bash
$ atomic push origin

# Changes, attestations, and provenance graphs are uploaded automatically:
#   ✓ Pushed 2 changes
#   ✓ XMJZ3IPF attestation ($0.15, 2 covered)
#   ✓ ABC12345 provenance (7 nodes, 1 change)
```

### Rewind an agent turn

```bash
# See the turn history
atomic log

# Undo the last turn
atomic revise
```

## See Also

- [Provenance Graphs](/agents/provenance) — How agent reasoning is captured as causal DAGs
- [Attestations](/agents/attestations) — Session-level audit and cost tracking
- [AI Agent Workflows](/getting-started/ai-agent-workflows) — Getting started guide
- [record](record.md) — How changes are recorded
- [identity](identity.md) — Managing user identities
- [log](log.md) — Viewing change history