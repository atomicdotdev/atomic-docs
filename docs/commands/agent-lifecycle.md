---
sidebar_position: 20
title: agent lifecycle
---

# atomic agent lifecycle

Declare managed runs for orchestrated agents.

## Synopsis

```bash
atomic agent lifecycle <SUBCOMMAND>
atomic agent lifecycle begin --owner <OWNER> --session <SESSION> [OPTIONS]
atomic agent lifecycle renew --run-id <RUN_ID> [--ttl-seconds <TTL_SECONDS>]
atomic agent lifecycle end --run-id <RUN_ID> [--json]
atomic agent lifecycle status [--json]
```

## Description

When an **outer orchestrator** (e.g. a "sherpa" agent) drives inner agents, Atomic can track the run as a first-class entity: a **managed run** with a lease, an owner, and the sessions that participate in it.

- **`begin`** declares the run and starts a lease.
- **`renew`** extends the lease while work continues.
- **`end`** closes the run and prints its summary (sessions, changes, views).
- **`status`** shows active runs.

The lease is **crash protection, not a session limit**: if the orchestrator dies, the lease expiring lets Atomic reclaim the run state.

### Run IDs

`renew`, `end` — and referencing the run anywhere — require the **run ID returned by `lifecycle begin`**. Active run IDs are listed by:

```bash
atomic agent lifecycle status
```

## Subcommands

### `lifecycle begin` — Declare a Managed Run

#### Synopsis

```bash
atomic agent lifecycle begin --owner <OWNER> --session <SESSION> [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--owner <OWNER>` | Lifecycle owner agent, e.g. `sherpa` |
| `--session <SESSION>` | Owner session id |
| `--executor <EXECUTOR>` | Executor agent whose hooks participate in this run (registry key of the *inner* agent, e.g. `codex`, `claude-code`). When set, hooks from other non-owner agents are left untouched; when omitted, any agent inside the workdir participates |
| `--work-item <WORK_ITEM>` | Optional work item id to associate with the managed run |
| `--view <VIEW>` | View the run's sessions should adopt for recording. When omitted, sessions fork their usual per-session view and are only stamped |
| `--workdir <WORKDIR>` | Working directory the run covers (a sandbox path or the repo root). Hooks participate only when their cwd is inside it. Defaults to the current directory |
| `--ttl-seconds <TTL_SECONDS>` | Lease duration. The lease is crash protection, not a session limit (default: 86400) |
| `--json` | Print JSON |

#### Examples

```bash
# Minimal managed run over the current directory
atomic agent lifecycle begin --owner sherpa --session s-123

# Pinned executor, shared recording view, sandbox workdir, 1h lease
atomic agent lifecycle begin \
  --owner sherpa --session s-123 \
  --executor claude-code \
  --view feature-payments \
  --workdir /sandboxes/payments \
  --ttl-seconds 3600
```

### `lifecycle renew` — Renew the Lease

#### Synopsis

```bash
atomic agent lifecycle renew --run-id <RUN_ID> [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--run-id <RUN_ID>` | Run id returned by `lifecycle begin` |
| `--ttl-seconds <TTL_SECONDS>` | Lease duration from now (default: 86400) |
| `--json` | Print JSON |

```bash
atomic agent lifecycle renew --run-id run_9f3c --ttl-seconds 3600
```

### `lifecycle end` — End the Run

Ends the run and prints its summary — the sessions that participated, the changes they recorded, and the views involved.

#### Synopsis

```bash
atomic agent lifecycle end --run-id <RUN_ID> [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `--run-id <RUN_ID>` | Run id returned by `lifecycle begin` |
| `--json` | Print JSON |

```bash
atomic agent lifecycle end --run-id run_9f3c --json
```

### `lifecycle status` — Show Active Runs

#### Synopsis

```bash
atomic agent lifecycle status [--json]
```

```bash
atomic agent lifecycle status
```

## See Also

- [agent](agent.md) — Agent integration hooks (enable, status, explain, attest)
- [sandbox](sandbox.md) — Concurrent agent sandboxes (useful as `--workdir` targets)
- [session](session.md) — The agent session ledger
