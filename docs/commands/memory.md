---
sidebar_position: 2
title: memory
---

# atomic memory

Record durable, searchable knowledge — decisions, lessons, constraints,
preferences, and context — as attestable memory records. `atomic memory` is the
memory analogue of [`atomic intent`](./intent.md): it scaffolds a memory, gates
it against the canonical shapes, signs (attests) it, and renders it.

Memories keep the **signal-to-noise ratio high**: a durable insight from a
session (why an approach was chosen, a corrective lesson, a discovered
constraint) is captured once, linked to its source, and becomes queryable
through the knowledge graph.

## Synopsis

```bash
atomic memory new --kind <KIND> [OPTIONS]
atomic memory show <ID> [--json]
atomic memory validate <ID_OR_PATH> [--json]
atomic memory attest <ID> [--identity <IDENTITY>] [--json]
atomic memory verify <ID> [--identity <IDENTITY>]
atomic memory list [--limit <N>] [--identity <IDENTITY>] [--json]
atomic memory kinds [--json]
atomic memory write <NAME> [--type <TYPE>]
```

## Memory kinds

Every canonical memory is classified into one kind from a closed vocabulary.
Pick the kind that fits the insight — a single turn may yield several (a
`decision` *and* a `lesson`), so record one memory per insight.

| Kind | Use for |
|------|---------|
| `decision` | A durable decision→outcome record: the chosen approach and **why** (typically emitted at turn end). |
| `lesson` | A corrective lesson learned from something that went wrong. |
| `constraint` | A rule or limitation discovered that future work must respect. |
| `preference` | A durable preference (style, tooling, workflow). |
| `context` | Durable background context that isn't a decision, lesson, or rule. |

Run `atomic memory kinds` to print the vocabulary (add `--json` for a machine
list of `{"kind","description"}` objects).

## `new` vs `write`

Atomic offers two ways to store a memory:

- **`atomic memory new`** — authors a **canonical, attestable** memory with a
  structured frontmatter spine and a `:::memory` body. Use this for durable
  knowledge you want gated, signed, and linked into the graph.
- **`atomic memory write`** — the raw escape hatch. Stores arbitrary content
  from stdin at `memory/<name>.md` with simple `{name,type}` frontmatter. Use
  this for freeform notes that don't need attestation.

## Recording a decision at turn end

```bash
# 1. Create the memory (non-interactive), linked to its source
ID=$(atomic memory new --kind decision \
  --text "Chose readline over a full TUI: smaller dep surface, EOF handled by close handler" \
  --derived-from urn:atomic:ac:01KYMD-ac-1,urn:atomic:intent:01KYMD \
  --json | jq -r .id)

# 2. Gate and sign it
atomic memory validate "$ID"
atomic memory attest "$ID"
```

`--derived-from` takes canonical urns (comma-separated), each becoming a
`wasDerivedFrom` edge in the knowledge graph. Link to the **most specific**
source the insight came from:

| Source | URN form |
|--------|----------|
| Acceptance criterion | `urn:atomic:ac:<UID>-ac-N` |
| Task | `urn:atomic:task:<UID>-N` |
| Todo | `urn:atomic:todo:<id>` |
| Intent (fallback) | `urn:atomic:intent:<UID>` |

Once linked, the memory surfaces through graph queries such as
`atomic query neighbors ac:<UID>-AC-1`.

## Subcommands

### `memory new` — scaffold a canonical memory

```bash
atomic memory new --kind <KIND> [OPTIONS]
```

| Option | Effect |
|--------|--------|
| `--kind <KIND>` | Memory kind (see the table above). **Required.** |
| `--text <TEXT>` | Durable memory text for a non-interactive workflow. When omitted, writes an editable `:::memory` scaffold instead. |
| `--about <URNS>` | Module/domain urns this memory is about (comma-separated). |
| `--derived-from <IDS>` | Intent/change/source-memory RDF ids this was derived from (comma-separated). |
| `--id <ID>` | Explicit memory id (the filename stem). Defaults to a freshly generated lowercased ULID. |
| `--status <STATUS>` | Lifecycle status: `active`, `superseded`, or `retracted` (default `active`). |
| `--json` | Emit `{"id":…,"file":…,"kind":…}` for scripting (e.g. `… --json \| jq -r .id`). |

```bash
atomic memory new --kind constraint
atomic memory new --kind lesson --about urn:atomic:module:storage
```

### `memory show` — render a read-time projection

```bash
atomic memory show <ID> [--json]
```

A pure read: it does not gate and does not require a proof. `--json` emits the
canonical node as JSON-LD.

```bash
atomic memory show 01j8zc4r8t
atomic memory show 01j8zc4r8t --json
```

### `memory validate` — gate against the canonical shapes

```bash
atomic memory validate <ID_OR_PATH> [--json]
```

An un-attested memory reports violations for the missing `proof` and author
(`attributedTo`) — expected, since `attest` is what makes it conform. Exits
non-zero if the report does not conform.

```bash
atomic memory validate 01j8zc4r8t
atomic memory validate ./note.md
atomic memory validate 01j8zc4r8t --json
```

### `memory attest` — sign into a tracked attestation

```bash
atomic memory attest <ID> [--identity <IDENTITY>] [--json]
```

Gates the memory, fills `attributedTo` from the signing identity, signs the
canonical node, re-gates, and writes the attested node as a tracked vault entry.
The source memory is unchanged.

```bash
atomic memory attest 01j8zc4r8t
atomic memory attest 01j8zc4r8t --identity alice-work
```

### `memory verify` — verify a signed attestation

```bash
atomic memory verify <ID> [--identity <IDENTITY>]
```

Confirms the attestation is fresh and verifies its content hash + Ed25519 proof.
Pass `--identity` if the memory was attested by someone else.

```bash
atomic memory verify 01j8zc4r8t
atomic memory verify 01j8zc4r8t --identity alice-work
```

### `memory list` — list memories, attestation-aware

```bash
atomic memory list [--limit <N>] [--identity <IDENTITY>] [--json]
```

Shows each memory's id (full ULID), kind, status, about-count, an `attested`
column (fresh / stale / `–`) and a `verifies` column (`✓` / `✗` / `–`).
`-n/--limit` caps the output to the N most recent (shows all when omitted).

```bash
atomic memory list
atomic memory list --limit 10
atomic memory list --json
```

### `memory kinds` — list the allowed kinds

```bash
atomic memory kinds [--json]
```

Surfaces the closed `memoryKind` vocabulary and when to use each, so you (or an
agent) can classify a session ledger before calling `atomic memory new`.

```bash
atomic memory kinds
atomic memory kinds --json
```

### `memory write` — freeform memory from stdin

```bash
atomic memory write <NAME> [--type <TYPE>]
```

Stores arbitrary stdin content at `memory/<name>.md`. `--type` sets a freeform
label (e.g. `user`, `feedback`, `project`, `reference`; default `project`).

```bash
echo "# Design" | atomic memory write design
cat notes.md | atomic memory write architecture --type reference
```

## Persistence — additive by construction

A canonical memory is a single flat tracked vault entry at `memory/<id>.md`.
Attestation never mutates the stored memory, its `content_hash`, or the manifest
merkle: the attested node + proof are written as a separate tracked attestation
entry.

## See also

- [`atomic intent`](./intent.md) — record the why behind a unit of work.
- [Attestations](../agents/attestations.md) — how signing and verification work.
- [Provenance Graphs](../agents/provenance.md) — how memories link into the knowledge graph.
