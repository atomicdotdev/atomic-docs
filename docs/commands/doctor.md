---
title: doctor
---

# atomic doctor

Diagnose and repair repository indexes and verify working-copy consistency.

## Synopsis

```bash
atomic doctor <SUBCOMMAND>
```

## Description

`atomic doctor` groups the repository's diagnostic and maintenance tools. Its most important subcommand, [`check`](#check), is a read-only audit that proves the working copy still agrees with the graph — including Atomic's conflict-honesty guarantee. The remaining subcommands rebuild derived indexes.

## Subcommands

### `check`

Verify working-copy consistency against the graph. **Read-only — mutates nothing.** Exits non-zero when problems are found.

```bash
atomic doctor check
```

`check` recomputes each visible file's content from the graph and reports two classes of problem:

- **Materialization drift** — a file that `status` considers *clean* whose on-disk bytes differ from what the graph would materialize. This is the signature of silent corruption. (Files with uncommitted edits are expected to differ and are skipped.)
- **Conflict-state disagreement** — the honesty invariant from [Merging & Conflicts](../concepts/merging-and-conflicts.md): on-disk conflict markers, `atomic status` reporting `Conflicted`, and `atomic conflicts` listing the file must **all agree**. Any disagreement is a caught bug.

Healthy output:

```
ℹ Verifying working-copy consistency against the graph...
ℹ Checked 42 clean file(s); 3 with uncommitted edits skipped; 0 conflicted.
✓ Working copy is consistent with the graph.
```

When problems are found, each is listed and the command exits non-zero:

```
ℹ Verifying working-copy consistency against the graph...
⚠ 1 problem(s) found:
  ✗ materialization drift: src/config.rs (disk=210 bytes, graph=188 bytes)
```

Run `check` any time you want reassurance — after a merge, a switch, a pull, or an interrupted operation — that the files on disk and the graph tell the same story.

### `repair-dependency-index`

Rebuild the redb dependency index (`CHANGE_DEPS`) used by fast view filters. Scans stored `.change` files once and backfills dependency metadata so interactive commands such as `status` can build dependency closures without repeatedly loading change files.

```bash
atomic doctor repair-dependency-index
```

Options:

- `--force` — Re-index changes even if they already have dependency metadata.

### `materialize-crdt`

Rebuild the CRDT semantic tables (the line/token layer used for diff, blame, and word-level review) from the FileOps stored in changes. This is the second phase of graph-first Git import: the graph is already written and this backfills the semantic layer.

```bash
atomic doctor materialize-crdt [--view <VIEW>] [--force]
```

Options:

- `--view <VIEW>` — View to materialize (default: the current view).
- `--force` — Re-apply even when a trunk row already exists.

## Options

### Global Options

- `-v, --verbose` — Emit extra diagnostic output
- `--no-color` — Disable ANSI color in output
- `-h, --help` — Print help
- `-V, --version` — Print version

## Exit status

- `check` exits **non-zero** when it finds any problem, so it is safe to use in CI or a pre-push hook:

  ```bash
  atomic doctor check || { echo "working copy inconsistent" >&2; exit 1; }
  ```

## Repairing drift

Materialization drift can often be repaired by re-materializing the current view — for example:

```bash
atomic view switch <current-view>
```

A conflict-state disagreement, by contrast, indicates a bug worth reporting.

## See Also

- [Merging & Conflicts](../concepts/merging-and-conflicts.md) — the conflict-honesty invariant `check` audits
- [`atomic status`](./status.md) — working-copy status, including conflicted (`C`) files
- [`atomic conflicts`](./conflicts.md) — detailed conflict listing
