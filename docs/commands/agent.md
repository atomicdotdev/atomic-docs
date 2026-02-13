---
sidebar_position: 18
title: agent
---

# atomic agent

Manage AI agent integration for turn-level recording.

## Synopsis

```bash
atomic agent <SUBCOMMAND>
```

## Description

The `agent` command manages integration with AI coding agents — Claude Code, Gemini CLI, Codex, and OpenCode. When enabled, every agent turn is automatically recorded as an Atomic change with full provenance: model, provider, tokens, cost, session ID, and turn number.

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

List and inspect attestations — graph-level audit nodes capturing AI cost, token usage, and model breakdown.

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
| `--hash <PREFIX>` | Show details for a specific attestation |
| `--stack <NAME>` | Filter attestations by stack |
| `--verbose`, `-v` | Show model breakdown and per-change details |

## How It Works

```
You prompt Claude Code → agent modifies files → Atomic records the turn
                                                  │
                                                  ├── ChangeHeader: "Turn 3: Fix the auth bug"
                                                  ├── Provenance: anthropic/claude-sonnet-4, tokens, cost
                                                  ├── SessionEnvelope: turn #3, timing, files
                                                  └── Transcript: conversation (unhashed, redactable)
```

The recording workflow on each turn end:

1. **Status** — ask the repository what changed since the last recorded state
2. **Add** — track any new files the agent created
3. **Record** — create an Atomic change with AI provenance metadata

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

# Generate reasoning summary
atomic agent explain <session-id> --all --save
```

### Rewind an agent turn

```bash
# See the turn history
atomic log

# Undo the last turn
atomic revise
```

## See Also

- [record](record.md) — How changes are recorded
- [identity](identity.md) — Managing user identities
- [log](log.md) — Viewing change history