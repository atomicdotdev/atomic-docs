---
sidebar_position: 1
title: intent
---

# atomic intent

Record the **why** behind a piece of work. `atomic intent` drives the
`atomic-canonical` engine over the vault: it scaffolds a directive-based intent,
gates it against the canonical shapes, signs (attests) it, and renders it.

An intent is **not done until it conforms and is signed** — this is the gate
that forces a clean, reviewable record of intent before code lands.

## Synopsis

```bash
atomic intent new <TITLE> [--template <TEMPLATE>]
atomic intent validate <ID_OR_PATH> [--json]
atomic intent show <ID> [--json]
atomic intent attest <ID> [--identity <IDENTITY>] [--json]
atomic intent verify <ID> [--identity <IDENTITY>]
atomic intent list [--identity <IDENTITY>] [--json]
atomic intent update <ID> [OPTIONS]
atomic intent delete <ID> [--force] [--json]
atomic intent link <ID> --goal <GOAL>
```

## The intent lifecycle

Every unit of agent work follows the same sequence:

```bash
# 1. Scaffold a directive-based intent
atomic intent new "Interactive readline greeting"

# 2. Fill the directive stubs in the printed file, then persist your edits
atomic vault sync

# 3. Mark it done once the acceptance criteria are met
atomic intent update DEMO-2 --status done
atomic vault sync

# 4. Gate it, then sign it
atomic intent validate DEMO-2   # MUST conform
atomic intent attest DEMO-2     # signs the completed intent
```

`atomic intent list` should then show the intent as `done` / `fresh` / `✓`.

:::note
`validate`, `attest`, and `show` read from the vault **database**, so always run
`atomic vault sync` after editing an intent file and before validating or
attesting — otherwise they see the stale on-disk scaffold.
:::

## The directive vocabulary

`atomic intent new` scaffolds a body built from the closed directive vocabulary
the canonical engine understands. Replace **every** stub:

| Directive | Meaning | Required |
|-----------|---------|----------|
| `:::why` | Why this work matters. The content is never graded, but it must be present. | Yes |
| `:::acceptance-criterion{#… status=unmet}` | A single, checkable outcome that means "done". | At least one |
| `:::task{#… criteria=…}` | An ordered work item toward a criterion; name files with `::file-ref{path=…}`. | Recommended |
| `:::scope-in` | What this intent will change. | If scope declared |
| `:::scope-out` | What this intent will deliberately **not** change. | If `scope-in` present |
| `:::constraint` | A rule the implementation must respect. | Optional |

A missing `:::why` is a **hard gate failure** — the intent can never validate or
attest without it.

## Subcommands

### `intent new` — scaffold a directive-based intent

```bash
atomic intent new <TITLE> [--template <TEMPLATE>]
```

`<TITLE>` is the intent's title (a short summary), **not** the id — the human key
(e.g. `PIMO-1`) is allocated by the vault. `--template` selects the scaffold to
emit (default and only value: `feature`).

```bash
atomic intent new "Fix the login flow"
atomic intent new "Add OAuth" --template feature
```

### `intent validate` — gate against the canonical shapes

```bash
atomic intent validate <ID_OR_PATH> [--json]
```

Lifts the intent (by ID from the vault, or from a markdown file path) into a
canonical node and runs the SHACL-style gate. Exits non-zero if the report does
not conform. An un-attested intent will report violations for the missing
`proof` and author (`attributedTo`) — that is expected: `validate` is the
authoring check, `attest` is what makes it conform.

```bash
atomic intent validate PIMO-1
atomic intent validate ./plan.md
atomic intent validate PIMO-1 --json
```

### `intent show` — render a read-time projection

```bash
atomic intent show <ID> [--json]
```

A pure read: it does not gate and does not require a proof, so it works on a
plain (un-attested) intent. `--json` emits the canonical node as JSON-LD.

```bash
atomic intent show PIMO-1
atomic intent show PIMO-1 --json
```

### `intent attest` — sign into a tracked attestation

```bash
atomic intent attest <ID> [--identity <IDENTITY>] [--json]
```

Gates the intent first (refusing to sign a non-conforming node), fills
`attributedTo` from the signing identity's `did:atomic`, signs the canonical
node, re-gates the result, and writes the attested node (with embedded
`contentHash` + proof) as a tracked vault entry. The stored intent is never
mutated. `--identity` selects the signing identity (defaults to the current
default identity).

```bash
atomic intent attest PIMO-1
atomic intent attest PIMO-1 --identity alice-work
atomic intent attest PIMO-1 --json
```

### `intent verify` — verify a signed attestation

```bash
atomic intent verify <ID> [--identity <IDENTITY>]
```

Confirms the attestation is still fresh (the intent hasn't changed since it was
signed) and verifies its content hash + Ed25519 Data Integrity proof. Pass
`--identity` if the intent was attested by someone else. Exits non-zero if there
is no attestation, it is stale, or the signature does not verify.

```bash
atomic intent verify PIMO-1
atomic intent verify PIMO-1 --identity alice-work
```

### `intent list` — list intents, attestation-aware

```bash
atomic intent list [--identity <IDENTITY>] [--json]
```

Alongside the human key and status, adds an `attested` column (fresh / stale /
`–`) and a `verifies` column (`✓` / `✗` / `–`). `verifies` is `✓` only when a
fresh attestation signed by the resolving identity cryptographically checks out.

```bash
atomic intent list
atomic intent list --identity alice-work
atomic intent list --json
```

### `intent update` — update a stored intent's fields

```bash
atomic intent update <ID> [OPTIONS]
```

| Option | Effect |
|--------|--------|
| `--status <STATUS>` | New status (e.g. `in-progress`, `done`, `icebox`). |
| `--assignee <ASSIGNEE>` | New assignee. |
| `--priority <PRIORITY>` | New priority. |
| `--title <TITLE>` | New title. |
| `--reason <REASON>` | Reason for iceboxing (persisted with `--status icebox`). |
| `--informed-by <IDS>` | Source-memory RDF ids that informed this intent (comma-separated). |
| `--body <BODY>` | New Markdown body, inline. |
| `--body-stdin` | Read the new Markdown body from standard input. |
| `-f, --force` | Rewrite the body even if the intent has started or is linked to a goal. |

```bash
atomic intent update PIMO-1 --status in-progress
atomic intent update PIMO-1 --assignee bob --priority critical
atomic intent update PIMO-1 --body "# Fix auth\n\n## Problem\n..."
cat plan.md | atomic intent update PIMO-1 --body-stdin
```

### `intent delete` — delete an unstarted backlog intent

```bash
atomic intent delete <ID> [--force] [--json]
```

Only backlog intents with no linked goals can be deleted. `--force` skips the
confirmation prompt.

```bash
atomic intent delete PIMO-1
atomic intent delete PIMO-1 --force
```

### `intent link` — link a goal to an intent

```bash
atomic intent link <ID> --goal <GOAL>
```

Associates a goal with an intent so the work done in the goal is tracked against
the intent.

```bash
atomic intent link PIMO-1 --goal swift-meadow-a3f2
```

## Persistence — additive by construction

Attestation never mutates the stored intent, its `content_hash`, or the manifest
merkle. The attested node + proof are written as a separate tracked vault entry,
outside the materialized `.vault/` tree. Validating or attesting an intent leaves
the authored record untouched.

## See also

- [`atomic memory`](./memory.md) — record durable decisions, lessons, and constraints.
- [Attestations](../agents/attestations.md) — how signing and verification work.
- [Provenance Graphs](../agents/provenance.md) — how intents connect to the knowledge graph.
