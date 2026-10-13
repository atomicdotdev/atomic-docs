---
sidebar_position: 23
title: session
---

# atomic session

Inspect the Atomic-native agent session ledger.

## Synopsis

```bash
atomic session <SUBCOMMAND>
atomic session show [SESSION_ID] [--json] [-n <LIMIT>]
atomic session fork --at-turn <AT_TURN> --child <CHILD> <PARENT_SESSION_ID>
atomic session rebuild
```

## Description

When an AI coding agent works inside an Atomic repository, its turns are recorded in an **session ledger** — an ordered, Atomic-native record of what the agent did. The `atomic session` command lets you inspect, branch, and repair that ledger.

### Finding Session IDs

`session show` and `session fork` require an **external agent session ID** — the session identifier used by the agent integration (for example, the ID your coding agent reports for a conversation). If you don't know it, run:

```bash
atomic session show
```

with no arguments to list recent sessions, then use the session ID from the output.

## Subcommands

### `session show` — Show a Session Ledger

#### Synopsis

```bash
atomic session show [SESSION_ID] [OPTIONS]
```

#### Arguments

**`[SESSION_ID]`** — External agent session ID. Omit to show recent sessions.

#### Options

| Option | Description |
|--------|-------------|
| `-n, --limit <LIMIT>` | Number of recent sessions to show when no ID is supplied (default: 5) |
| `--json` | Emit the indexed ledger as JSON |

#### Examples

```bash
# List the 5 most recent sessions
atomic session show

# Show the full ordered ledger for one session
atomic session show a1b2c3d4-5678-90ab-cdef-1234567890ab

# Machine-readable output
atomic session show a1b2c3d4-5678-90ab-cdef-1234567890ab --json
```

### `session fork` — Fork a Session at a Turn

Create a new **child session** that inherits the parent's history up to a chosen turn. Useful for branching an agent conversation: replay the same context but diverge from a given turn onward.

#### Synopsis

```bash
atomic session fork --at-turn <AT_TURN> --child <CHILD> <PARENT_SESSION_ID> [OPTIONS]
```

#### Arguments

**`<PARENT_SESSION_ID>`** — External session ID of the parent session.

#### Options

| Option | Description |
|--------|-------------|
| `--at-turn <AT_TURN>` | Turn number to fork at (inherits turns 0..=N) |
| `--child <CHILD>` | External session ID for the new child session |

#### Examples

```bash
# Fork session "abc123" after turn 4 into a new child "def456"
atomic session fork --at-turn 4 --child def456 abc123
```

### `session rebuild` — Rebuild Indexes

Rebuild session indexes from the stored provenance graphs. Use after importing or restoring repository data, or if session listings look stale.

#### Synopsis

```bash
atomic session rebuild
```

#### Examples

```bash
atomic session rebuild
```

## See Also

- [agent](agent.md) — Agent integration hooks
- [agent lifecycle](agent-lifecycle.md) — Managed runs for orchestrated agents
- [sandbox](sandbox.md) — Concurrent agent sandboxes
- [provenance](provenance.md) — W3C PROV projections for changes
