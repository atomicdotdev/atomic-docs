---
sidebar_position: 25
title: vault
---

# atomic vault

Manage the vault (shared project knowledge store).

## Synopsis

```bash
atomic vault <SUBCOMMAND>
atomic vault init
atomic vault show <PATH> [--json] [--revision <HASH>]
atomic vault list [-t <TYPE>] [-p <PREFIX>] [--json]
atomic vault materialize [-p <PATH>]
atomic vault sync
atomic vault goal <SUBCOMMAND>
atomic vault context [QUERY]... [--intent <INTENT>] [--files <PATH>]
atomic vault summaries [--goal <GOAL>] [--json]
atomic vault query   # alias for `atomic query`
```

## Description

The **vault** is Atomic's shared project knowledge store: a structured collection of entries — **memories**, **intents**, **goals**, sessions, skills, scratch notes, and tool results — stored in the repository database and projected to markdown for humans.

Use the vault when knowledge should outlive a single session: durable context for future agent runs, decision records, and task directives. The [Knowledge Graph](query.md) indexes vault content, so vault entries are searchable with `atomic query`.

### Entry Types

| Type | Purpose |
|------|---------|
| `memory` | Durable context (decisions, lessons, constraints, preferences) — author with [`atomic memory`](memory.md) |
| `intent` | Directive-based units of work (a `:::why`, acceptance criteria, tasks) — author with [`atomic intent`](intent.md) |
| `goal` | A started unit of work being tracked with tool-result summaries |
| `session` | Agent session records |
| `skill` | Reusable instructions |
| `scratch` / `tool_result` | Working notes and captured tool output |

:::note
`atomic vault intent` and `atomic vault memory` were removed; they now print a redirect telling you to use `atomic intent` and `atomic memory` instead.
:::

## Subcommands

### `vault init` — Initialize the Vault

Initialize the vault in an existing Atomic repository.

```bash
atomic vault init
```

### `vault show` — Print an Entry's Content

#### Synopsis

```bash
atomic vault show <PATH> [OPTIONS]
```

#### Arguments

**`<PATH>`** — Vault-relative path to the entry (e.g. `memory/architecture.md`).

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON instead of markdown |
| `--revision <HASH>` | Require the entry to match this exact revision before printing JSON |

```bash
atomic vault show memory/architecture.md
```

### `vault list` — List Entries

#### Synopsis

```bash
atomic vault list [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `-t, --type <TYPE>` | Filter by entry type (`session`, `memory`, `intent`, `skill`, `scratch`, `tool_result`) |
| `-p, --prefix <PREFIX>` | Filter by path prefix |
| `--json` | Output as JSON |

```bash
atomic vault list --type memory
atomic vault list --prefix intent/ --json
```

### `vault materialize` — Write Entries to Disk

Materialize vault entries to markdown files on disk.

#### Synopsis

```bash
atomic vault materialize [OPTIONS]
```

#### Options

| Option | Description |
|--------|-------------|
| `-p, --path <PATH>` | Materialize only this specific vault path |

```bash
atomic vault materialize                 # everything
atomic vault materialize -p memory/      # one subtree
```

### `vault sync` — Sync Markdown Back to the Database

Sync vault markdown files (as materialized on disk) back into the vault database.

```bash
atomic vault sync
```

### `vault goal` — Manage Goals

Track a unit of work end-to-end: start it, capture tool-result summaries, stop/resume it.

#### Synopsis

```bash
atomic vault goal <SUBCOMMAND>
```

#### Subcommands

**`goal start`** — Start a new goal.

| Option | Description |
|--------|-------------|
| `--name <NAME>` | Override the generated goal name |
| `--developer <DEVELOPER>` | Developer name |
| `--intent <INTENT>` | Link to an intent ID (e.g. `PIMO-1` — see `atomic intent list`) |
| `--model <MODEL>` | AI model being used |
| `--json` | Output as JSON |

**`goal stop [GOAL]`** — Stop the current (or named) goal. `--promote` marks it completed (promoted for team consumption); `--discard` deletes it entirely.

**`goal resume <GOAL>`** — Resume a suspended goal (`--json` for JSON output).

**`goal list`** — List goals. `-s, --status <STATUS>` filters by `active`, `completed`, `suspended`, or `all` (default). `--json` for JSON.

**`goal show <GOAL>`** — Show a goal's content (`--json` for JSON).

```bash
atomic vault goal start --intent PIMO-1 --model glm-4
atomic vault goal list --status active
atomic vault goal stop --promote
```

### `vault context` — Research Relevant Memories

Find vault memories relevant to a task. This is the command agent integrations call to load durable context before working.

#### Synopsis

```bash
atomic vault context [QUERY]... [OPTIONS]
```

#### Arguments

**`[QUERY]...`** — Free-text query terms.

#### Options

| Option | Description |
|--------|-------------|
| `--intent <INTENT>` | Seed from an intent: uses its title, labels, and body as query terms, plus its graph neighbors as candidates (e.g. `PIMO-1`) |
| `--files <PATH>` | Seed from a file path; memories referencing it are candidates |
| `--limit <LIMIT>` | Maximum memories to return (default: 5) |
| `--budget-chars <BUDGET_CHARS>` | Total character budget across all memory bodies (default: 8000) |
| `--candidates-only` | Return ranked candidate metadata without memory bodies |
| `--format <FORMAT>` | `md` (prompt-ready block) or `json` (default: `md`) |
| `--json` | Output as JSON (shorthand for `--format json`) |

```bash
atomic vault context --intent PIMO-1
atomic vault context "authentication tokens"
atomic vault context --files src/auth/login.rs --json
atomic vault context "authentication" --candidates-only --json
```

### `vault summaries` — Get Tool Result Summaries

Get tool result summaries for a goal. `--goal <GOAL>` names the goal (see `atomic vault goal list`); `--json` for JSON output (JSON is the default for summaries).

```bash
atomic vault summaries --goal fix-token-refresh --json
```

### `vault query` — Query the Knowledge Graph

Alias for [`atomic query`](query.md).

## See Also

- [intent](intent.md) — Authoring directive-based intents
- [memory](memory.md) — Authoring durable memories
- [query](query.md) — Searching the knowledge graph
