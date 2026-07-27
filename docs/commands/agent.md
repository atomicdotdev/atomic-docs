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

The `agent` command is the Atomic-side control plane for AI coding integrations. `atomic agent enable --agent <name>` fetches an agent-specific package — `atomic-agy`, `atomic-claude`, `atomic-cline`, `atomic-codex`, `atomic-copilot`, `atomic-cursor`, `atomic-devin`, `atomic-kilo`, `atomic-kiro`, `atomic-opencode`, or `atomic-pi` — from Atomic storage and installs its hooks, plugins, extensions, skills, and instruction files for the host agent. Those hooks call back into `atomic agent hooks <agent> <verb>` so Atomic can record turns and sessions with provenance.

When an integration is active, every supported turn or task is automatically recorded as an Atomic change with full provenance, and every session produces a provenance graph (causal decision DAG) and an attestation (session-level audit node).

No daemon required. Each hook invocation is a standalone process that opens the repo, does its work, and exits.

For setup steps by agent, see [Installing Agent Integrations](/agents/installing-agent-integrations).

## Subcommands

### `enable`

Install an agent integration for turn-level recording.

For a registered agent, `enable` fetches the integration package from Atomic storage (caching it under `~/.atomic/integrations/<agent>/repo`), verifies the package's required CLI version, installs its files, hooks, and skills, and writes a receipt. Nothing from the package is executed. See [Installing Agent Integrations](/agents/installing-agent-integrations) for the per-agent guide.

```bash
# Auto-detect which agent is present in this repo
atomic agent enable

# Install a specific agent's integration
atomic agent enable --agent opencode

# Refresh to the latest package contents (overwrites even modified files)
atomic agent enable --agent opencode --force

# Install from a local package checkout (development / air-gapped)
atomic agent enable --agent opencode --from /path/to/atomic-opencode

# Install for all detected agents
atomic agent enable --all
```

**Options:**

| Option | Description |
|--------|-------------|
| `--agent <NAME>` | Target a specific agent (e.g. `opencode`, `claude-code`, `agy`, `codex`, `cursor`, `cline`, `copilot`, `devin`, `kilo`, `kiro`, `pi`) |
| `--force` | Overwrite files even when they look user-owned or user-modified, and re-clone the package cache |
| `--all` | Install for all detected agents |
| `--from <PATH>` | Install from a local package directory instead of syncing from Atomic storage |
| `--global` | For a built-in adapter, install hooks into user-level settings (all projects) |
| `--hooks <FILE>` | Install from an integration-supplied hooks manifest file directly |

**What it does:**

- Resolves the agent to a package in the embedded registry (Atomic storage URL + view)
- Clones the package on first run; reuses the cache afterward so `enable` works offline
- Installs files (never symlinks) and merges settings via the manifest engine
- Skips destinations you modified — unless `--force` — so your edits are safe

### `disable`

Remove an agent integration, guided by its receipt. Files you modified after install are kept and reported; Atomic's hook commands are stripped from shared settings files while your own hooks are preserved. Non-Atomic hooks are never touched.

```bash
# Disable for the auto-detected agent
atomic agent disable

# Disable a specific agent's integration
atomic agent disable --agent opencode

# Remove every integration that has a receipt
atomic agent disable --all
```

**Options:**

| Option | Description |
|--------|-------------|
| `--agent <NAME>` | Target a specific agent |
| `--all` | Remove all installed integrations |
| `--global` | Remove hooks from user-level settings |
| `--hooks <FILE>` | Remove hooks described by an integration-supplied manifest file |

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

# Show attestations for a view
atomic agent attest --view dev

# Verbose output with model breakdown
atomic agent attest --verbose
```

**Options:**

| Option | Description |
|--------|-------------|
| `--hash <PREFIX>` | Show details for a specific attestation (supports prefix matching) |
| `--view <NAME>` | Filter attestations covering changes in this view |
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
6. **View restore** — switch back to the user's original view

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

## Supported Integration Packages

| Integration | Agent | Setup Guide |
|-------------|-------|-------------|
| `atomic-agy` | Antigravity CLI | [Installing Agent Integrations](/agents/installing-agent-integrations#antigravity-cli) |
| `atomic-claude` | Claude Code | [Installing Agent Integrations](/agents/installing-agent-integrations#claude-code) |
| `atomic-cline` | Cline | [Installing Agent Integrations](/agents/installing-agent-integrations#cline) |
| `atomic-codex` | Codex | [Installing Agent Integrations](/agents/installing-agent-integrations#codex) |
| `atomic-copilot` | GitHub Copilot | [Installing Agent Integrations](/agents/installing-agent-integrations#github-copilot) |
| `atomic-cursor` | Cursor | [Installing Agent Integrations](/agents/installing-agent-integrations#cursor) |
| `atomic-devin` | Devin | [Installing Agent Integrations](/agents/installing-agent-integrations#devin) |
| `atomic-kilo` | Kilo Code | [Installing Agent Integrations](/agents/installing-agent-integrations#kilo-code) |
| `atomic-kiro` | Kiro | [Installing Agent Integrations](/agents/installing-agent-integrations#kiro) |
| `atomic-opencode` | OpenCode | [Installing Agent Integrations](/agents/installing-agent-integrations#opencode) |
| `atomic-pi` | Pi | [Installing Agent Integrations](/agents/installing-agent-integrations#pi) |

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
# See what the agent changed on its isolated view
atomic log --view agent-ses_3781fc...

# Insert specific changes into your view
atomic insert <change-hash> --to dev

# Clean up the agent view
atomic view delete agent-ses_3781fc...
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