---
sidebar_position: 9
title: insert
---

# atomic insert

Insert changes into a view.

## Synopsis

```bash
atomic insert                          # promote current view → its parent
atomic insert <CHANGE>                 # insert a single change into the current view
atomic insert view <SOURCE> [OPTIONS]  # insert all changes from another view
atomic insert change <CHANGES>... [OPTIONS]
atomic insert tag <TAG> [OPTIONS]
atomic insert preview <SOURCE> [OPTIONS]
```

## Description

The `insert` command adds change references to a view's `VIEW_CHANGES`, making those changes visible through the view's filter. This is Atomic's mechanism for incorporating changes — whether from another view in the same repository or received from a remote.

**Key concept:** Because all edges are already stored in the canonical GRAPH, insert is an **O(1) metadata operation** per change. It only writes entries to `VIEW_CHANGES` — no edge copying is needed. Atomic automatically computes and inserts the full transitive dependency closure so the view remains consistent.

:::tip Tab-completion
With [shell completions](./completions.md) enabled, `atomic insert view <TAB>` completes live **view names** and `atomic insert change <TAB>` completes recent **change hashes** (annotated with their commit messages).
:::

## Promote the current view (no arguments)

Running `atomic insert` with no arguments **promotes the current view's changes into its parent view** — the "I'm done with this draft, land it" gesture.

```bash
# On draft view `snow-cat-1234` (parent: dev)
atomic insert
# → Inserting 3 change(s): snow-cat-1234 → dev
#   ✓ Inserted 3 change(s)
```

- The source is always the current view; the target defaults to its parent.
- Use `--to <view>` to target a different view than the immediate parent.
- The working copy is **not** rematerialized — the target view isn't checked out, so your current view's files are untouched.

This inverts the direction of `atomic insert <hash>` (which brings a change *into* the current view), so the output always states the direction explicitly.

### Options for the promotion form

| Option | Description |
|--------|-------------|
| `--to <VIEW>` | Target view to promote into (default: the current view's parent). Alias: `--to-view`. |
| `-n`, `--dry-run` | Show what would be inserted without inserting. |
| `--confirm` | Skip the confirmation prompt when promoting between two **shared** views. |
| `--allow-conflicts` | Allow conflicts during insert. |

**Edge cases:**

- **Root view (no parent):** errors clearly — there is nothing to promote into.
- **Nothing to promote:** a friendly no-op ("Already even with `<parent>`").
- **Shared → shared:** requires interactive confirmation; pass `--confirm` to proceed non-interactively (e.g. in scripts).

```bash
# Preview the promotion first
atomic insert --dry-run

# Promote into a specific view
atomic insert --to release

# Promote between shared views without a prompt
atomic insert --confirm
```

## Insert a single change (`<CHANGE>`)

The hash of a change to insert into the current view (or `--view`). Accepts a full hash (53 characters) or an abbreviated prefix (minimum 2 characters).

```bash
# Full hash
atomic insert MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Abbreviated hash
atomic insert MNYNGT2V

# Into a specific view
atomic insert --view feature-auth MNYNGT2V
```

Options: `--view <VIEW>` (alias `--to`), `--deps` (on by default), `--allow-conflicts`, `-R`/`--repository <PATH>`.

## Subcommands

### `view` — Insert all changes from another view

Inserts every change present in a source view that is missing from the target view. (Formerly `from-view`, which is kept as an alias.)

```bash
atomic insert view <SOURCE> [OPTIONS]
```

**Arguments:**
- `<SOURCE>` — Source view to copy changes from

**Options:**
- `--to <VIEW>` — Target view (default: current view). Alias: `--to-view`.
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert
- `-n`, `--dry-run` — Show what would be inserted without making changes

```bash
# From dev, pull all of a draft's changes into dev
atomic insert view snow-cat-1234

# Insert from feature into dev explicitly
atomic insert view feature --to dev

# Preview first
atomic insert view feature --to dev --dry-run

# Backward-compatible alias
atomic insert from-view feature --to-view dev
```

### `change` — Insert specific change(s) by hash

Insert one or more specific changes by hash, pulling in their transitive dependencies automatically. (Formerly `pick`, which is kept as an alias.)

```bash
atomic insert change <CHANGES>... [OPTIONS]
```

**Arguments:**
- `<CHANGES>...` — One or more change hashes (required)

**Options:**
- `--to <VIEW>` — Target view (default: current view). Alias: `--to-view`.
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert

```bash
# A single change
atomic insert change ABCD1234

# Multiple changes
atomic insert change ABCD1234 EFGH5678

# Into a specific view
atomic insert change ABCD1234 --to dev

# Backward-compatible alias
atomic insert pick ABCD1234 --to-view dev
```

### `tag` — Insert changes up to a specific tag

Inserts all changes from a source view up to and including a tagged state.

```bash
atomic insert tag <TAG> [OPTIONS]
```

**Arguments:**
- `<TAG>` — Name of the tag to insert up to

**Options:**
- `--from-view <VIEW>` — Source view containing the tag
- `--to <VIEW>` — Target view (default: current view). Alias: `--to-view`.
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert
- `-n`, `--dry-run` — Show what would be inserted without making changes

```bash
# Insert tagged changes from release into dev
atomic insert tag v1.0.0 --from-view release --to dev
```

### `preview` — Show what would be inserted (dry run)

Preview the set of changes that would be inserted from a source view, without making any changes.

```bash
atomic insert preview <SOURCE> [OPTIONS]
```

**Arguments:**
- `<SOURCE>` — Source view to preview changes from

**Options:**
- `--to <VIEW>` — Target view (default: current view). Alias: `--to-view`.
- `--up-to-tag <TAG>` — Limit preview to changes up to a specific tag

```bash
atomic insert preview feature --to dev
atomic insert preview release --up-to-tag v1.0.0
```

## Examples

### Land a draft / session view

```bash
# You're on a draft view forked from dev; you've recorded some changes.
atomic insert --dry-run    # look first
atomic insert              # promote them into dev
```

### Cross-view workflow

```bash
# Create a feature view as a draft off dev
atomic view create feature-auth --draft --parent dev

# ... do work and record changes on feature-auth ...

# Preview, then insert into dev
atomic insert preview feature-auth --to dev
atomic insert view feature-auth --to dev
```

### Release workflow with tags

```bash
atomic tag create v1.0.0 -m "Release 1.0"
atomic insert tag v1.0.0 --from-view release --to main
```

### Cherry-pick a hotfix

```bash
atomic insert change ABCD1234 --to release
```

## Command changes and aliases

The subcommand names were unified for consistency. Old names still work:

| Canonical | Alias (still supported) |
|-----------|-------------------------|
| `atomic insert view <SOURCE>` | `atomic insert from-view <SOURCE>` |
| `atomic insert change <HASH>` | `atomic insert pick <HASH>` |
| `--to <VIEW>` | `--to-view <VIEW>` |

## How It Works

Insert is fundamentally different from Git's merge or cherry-pick:

| Aspect | Git Merge/Cherry-Pick | Atomic Insert |
|--------|----------------------|---------------|
| **Data copied** | Diffs are replayed | No data copied — edges already in GRAPH |
| **Cost** | O(diff size) | O(1) per change (metadata only) |
| **Dependencies** | Manual (conflicts if missing) | Automatic transitive closure |
| **Source modified** | Cherry-pick doesn't modify source | Source view is never modified |
| **Conflicts** | Common with cherry-pick | Only when changes are truly incompatible |

Because Atomic uses a single canonical GRAPH with view filters, inserting a change simply means adding its reference to the target view's `VIEW_CHANGES` table. The change's edges were already written to GRAPH when the change was first recorded — insert just makes them visible through a different view's filter.

## Notes

- **Dependencies**: Transitive dependencies are computed and inserted automatically. A change cannot be inserted without every change it depends on already present in the target view.
- **Idempotent**: Inserting a change that already exists in the view is a no-op.
- **Source unchanged**: The source view is never modified by an insert operation.
- **Conflicts**: True conflicts only arise when changes modify the same graph region in incompatible ways.
- **Pulling changes out**: Insert only *adds* references to a view. To lift changes *out* of a view into a new draft (the inverse operation), use [`atomic view split`](./view.md#view-split--split-changes-into-a-new-draft-view) (Atomic **>= 0.15.3**).

## See Also

- [Shell Completions](./completions.md) — tab-complete view names and change hashes
- [`atomic record`](./record.md) — Record new changes
- [`atomic view`](./view.md) — Manage views (create, switch, list, delete)
- [`atomic view split`](./view.md#view-split--split-changes-into-a-new-draft-view) — Split changes out of a view into a new draft (the inverse of insert)
- [`atomic pull`](./pull.md) — Pull and insert changes from remotes
- [`atomic tag`](./tag.md) — Manage tags for marking states
- [`atomic log`](./log.md) — View change history

## Related Concepts

- **Changes** — Immutable semantic patches identified by content hash
- **Views** — Filtered perspectives on the same canonical graph
- **Dependencies** — Transitive change prerequisites, automatically resolved
- **Merkle State** — Incremental hash representing the complete state of a view
