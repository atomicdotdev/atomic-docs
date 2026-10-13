---
sidebar_position: 26
title: provenance
---

# atomic provenance

Project & trace W3C PROV over the provenance Atomic already captures.

## Synopsis

```bash
atomic provenance <SUBCOMMAND>
atomic provenance trace <TARGET> [--json] [--sign] [--identity <IDENTITY>]
atomic provenance show <TARGET> [--sign] [--identity <IDENTITY>]
```

## Description

Every recorded change in Atomic already carries provenance: which agent session produced it, which intents and memories justify it, which views carry it. `atomic provenance` projects that captured data onto the **W3C PROV** standard, so the story of a change can be traced — and cryptographically signed — in a standard, machine-checkable form.

Two projections are available:

- **`trace`** — a human-readable walk of the flywheel chain for a change (session → turns → changes → views)
- **`show`** — the raw W3C PROV JSON-LD named subgraph for a change

### Target Identification

Both subcommands take the same **`<TARGET>`** argument — a change to project:

| Accepted format | Example |
|-----------------|---------|
| Full change hash | `3f9c2ab1d4e5…` |
| Unambiguous hash prefix | `3f9c2ab1` |
| Canonical change URN | `urn:atomic:change:<base32>` |

Find change hashes with [`atomic log`](log.md) (use `--full-hash` for the complete hash) or inspect one with [`atomic change`](change.md).

## Subcommands

### `provenance trace` — Walk the Flywheel Chain

#### Synopsis

```bash
atomic provenance trace <TARGET> [OPTIONS]
```

#### Arguments

**`<TARGET>`** — Change hash, hash prefix, or `urn:atomic:change:<base32>` (see [Target Identification](#target-identification)).

#### Options

| Option | Description |
|--------|-------------|
| `--json` | Emit the PROV JSON-LD `@graph` instead of the human chain |
| `--sign` | With `--json`, emit the SIGNABLE artifact — sign the graph (top-level `attributedTo`/`contentHash`/`proof`) instead of the plain projection |
| `--identity <IDENTITY>` | Identity whose key signs the projection (with `--json --sign`, and to resolve the Person). Defaults to the current default identity |

#### Examples

```bash
# Human-readable chain for a change
atomic provenance trace 3f9c2ab1

# Signed PROV JSON-LD projection
atomic provenance trace 3f9c2ab1 --json --sign
```

### `provenance show` — Emit the PROV JSON-LD Subgraph

#### Synopsis

```bash
atomic provenance show <TARGET> [OPTIONS]
```

#### Arguments

**`<TARGET>`** — Change hash, hash prefix, or `urn:atomic:change:<base32>` (see [Target Identification](#target-identification)).

#### Options

| Option | Description |
|--------|-------------|
| `--sign` | Emit the SIGNABLE artifact — sign the graph instead of the plain projection |
| `--identity <IDENTITY>` | Identity used to resolve the Person (and to sign with `--sign`). Defaults to the current default identity |

#### Examples

```bash
# Plain JSON-LD named subgraph
atomic provenance show 3f9c2ab1

# Signed, attributed to a specific identity
atomic provenance show 3f9c2ab1 --sign --identity work-laptop
```

## See Also

- [change](change.md) — Inspect a specific change
- [log](log.md) — Find change hashes
- [identity](identity.md) — Managing signing identities
- [How to See Why an AI Agent Changed Your Code](/agents/provenance) — Provenance guide
