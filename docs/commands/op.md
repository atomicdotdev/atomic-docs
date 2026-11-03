---
sidebar_position: 31
title: op
---

# atomic op

Inspect the immutable repository operation journal. Introduced in Atomic 0.20.0.

> **Verified against CLI 0.20.0.**

## Synopsis

```bash
atomic op <SUBCOMMAND>
atomic op log [-n <LIMIT>] [--reverse] [--repository]
atomic op show <ID_OR_PREFIX> [--json]
atomic op undo [ID_OR_PREFIX] [--json]
atomic op restore <ID_OR_PREFIX> [--json]
```

## Description

Every repository mutation is appended to an **immutable operation journal**. `atomic op` is the window into that journal: it shows what operations exist, what each one contains, and lets you undo or re-project a previous operation by appending a *new* operation: the journal itself is never rewritten.

This is the audit trail under the working-copy layer: `atomic log` shows change history on a view; `atomic op` shows how the repository got there.

## Subcommands

### `op log` — Show Operations

```bash
atomic op log [OPTIONS]
```

| Option | Description |
|--------|-------------|
| `-n, --limit <LIMIT>` | Limit the number of operations printed |
| `--reverse` | Show parents before children |
| `--repository` | Inspect the repository-wide operation scope instead of this working copy |

### `op show` — Show One Operation

```bash
atomic op show <ID_OR_PREFIX> [--json]
```

| Argument | Description |
|----------|-------------|
| `<ID_OR_PREFIX>` | Full operation ID or a case-insensitive prefix of at least four characters |

| Option | Description |
|--------|-------------|
| `--json` | Emit stable machine-readable JSON |

Shows the operation's full payload, receipts, and head scopes.

### `op undo` — Append an Inverse

```bash
atomic op undo [ID_OR_PREFIX] [--json]
```

| Argument | Description |
|----------|-------------|
| `[ID_OR_PREFIX]` | Current operation ID or unambiguous prefix; omitted means the sole head |

| Option | Description |
|--------|-------------|
| `--json` | Emit the newly appended operation as stable JSON |

Appends an inverse of the given operation head. The original operation remains in the journal; undo is itself an operation.

### `op restore` — Re-project a Verified State

```bash
atomic op restore <ID_OR_PREFIX> [--json]
```

| Argument | Description |
|----------|-------------|
| `<ID_OR_PREFIX>` | Operation ID or unambiguous prefix whose after-state should be restored |

| Option | Description |
|--------|-------------|
| `--json` | Emit the newly appended operation as stable JSON |

Re-projects the verified state selected by an earlier operation.

## Examples

```bash
# See recent operations
atomic op log -n 10

# Inspect one operation
atomic op show a1b2

# Undo the latest operation
atomic op undo

# Return the working copy to the state after an earlier operation
atomic op restore a1b2
```

## See Also

- [log](log.md) — change history on a view
- [unrecord](unrecord.md) — remove a change from the current view
- [git shim](git-shim.md) — the shim records its metadata here
