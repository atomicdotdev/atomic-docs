---
sidebar_position: 9
title: insert
---

# atomic insert

Insert changes into a view.

## Synopsis

```bash
atomic insert [OPTIONS] <CHANGE>
atomic insert from-view <SOURCE> [OPTIONS]
atomic insert tag <TAG> [OPTIONS]
atomic insert pick <CHANGES>... [OPTIONS]
atomic insert preview <SOURCE> [OPTIONS]
```

## Description

The `insert` command adds change references to a view's `VIEW_CHANGES`, making those changes visible through the view's filter. This is Atomic's mechanism for incorporating changes — whether from the same repository or received from a remote.

**Key concept:** Because all edges are already stored in the canonical GRAPH, insert is an **O(1) metadata operation** per change. It only writes entries to `VIEW_CHANGES` — no edge copying is needed. Atomic automatically computes and inserts the full transitive dependency closure so the view remains consistent.

When you insert a change, Atomic:

1. Computes the change's transitive dependencies
2. Filters out dependencies already present in the target view
3. Adds missing dependency references to `VIEW_CHANGES` in dependency order
4. Adds the change itself to `VIEW_CHANGES`
5. Updates the view's Merkle state
6. Optionally updates the working copy

## Arguments

### `<CHANGE>`

The hash of the change to insert (when not using subcommands). Can be:
- Full hash (53 characters)
- Abbreviated hash (minimum 2 characters)

```bash
# Full hash
atomic insert MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Abbreviated hash
atomic insert MNYNGT2V
```

## Options

### `--view <VIEW>`

Insert the change into a specific view instead of the current view.

```bash
atomic insert --view feature-auth ABCD1234...
```

### `--deps`

Insert dependencies automatically (enabled by default).

```bash
atomic insert --deps ABCD1234...
```

### `--allow-conflicts`

Allow conflicts during insert instead of aborting.

```bash
atomic insert --allow-conflicts ABCD1234...
```

### `-R`, `--repository <PATH>`

Specify the repository path.

```bash
atomic insert --repository /path/to/repo ABCD1234...
```

## Subcommands

### `from-view` — Insert changes from one view to another

Inserts all changes present in a source view that are missing from the target view.

```bash
atomic insert from-view <SOURCE> [OPTIONS]
```

**Arguments:**
- `<SOURCE>` — Source view to copy changes from

**Options:**
- `--to-view <VIEW>` — Target view (default: current view)
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert
- `--dry-run` — Show what would be inserted without making changes

```bash
# Insert all changes from feature-auth into current view
atomic insert from-view feature-auth

# Insert from feature into dev
atomic insert from-view feature --to-view dev

# Preview what would happen
atomic insert from-view feature --to-view dev --dry-run
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
- `--to-view <VIEW>` — Target view (default: current view)
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert
- `--dry-run` — Show what would be inserted without making changes

```bash
# Insert changes up to tag v1.0.0
atomic insert tag v1.0.0

# Insert tagged changes from release view into dev
atomic insert tag v1.0.0 --from-view release --to-view dev
```

### `pick` — Cherry-pick specific changes

Insert one or more specific changes by hash, pulling in their transitive dependencies automatically.

```bash
atomic insert pick <CHANGES>... [OPTIONS]
```

**Arguments:**
- `<CHANGES>...` — One or more change hashes to cherry-pick (required)

**Options:**
- `--to-view <VIEW>` — Target view (default: current view)
- `--deps` — Insert dependencies automatically (default: true)
- `--allow-conflicts` — Allow conflicts during insert

```bash
# Pick a single change
atomic insert pick ABCD1234...

# Pick multiple changes
atomic insert pick ABCD1234... EFGH5678...

# Pick into a specific view
atomic insert pick ABCD1234... --to-view dev
```

### `preview` — Show what would be inserted (dry run)

Preview the set of changes that would be inserted from a source view, without making any changes.

```bash
atomic insert preview <SOURCE> [OPTIONS]
```

**Arguments:**
- `<SOURCE>` — Source view to preview changes from

**Options:**
- `--to-view <VIEW>` — Target view (default: current view)
- `--up-to-tag <TAG>` — Limit preview to changes up to a specific tag

```bash
# Preview all changes from feature
atomic insert preview feature

# Preview changes up to a tag
atomic insert preview release --up-to-tag v1.0.0

# Preview into a specific target
atomic insert preview feature --to-view dev
```

## Examples

### Basic Insert

```bash
# Insert a change into the current view
atomic insert MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Insert with abbreviated hash
atomic insert MNYNGT2V
```

### Cross-View Workflow

```bash
# Create a feature view as a draft off dev
atomic view create feature-auth --draft --parent dev

# ... do work and record changes on feature-auth ...

# Preview what would be inserted into dev
atomic insert preview feature-auth --to-view dev

# Insert all changes from feature-auth into dev
atomic insert from-view feature-auth --to-view dev
```

### Release Workflow with Tags

```bash
# Tag the current state of the release view
atomic tag create v1.0.0 -m "Release 1.0"

# Insert everything up to the release tag into main
atomic insert tag v1.0.0 --from-view release --to-view main
```

### Cherry-Pick Specific Changes

```bash
# Pick a hotfix change into the release view
atomic insert pick ABCD1234... --to-view release
```

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
- **Working copy**: Use `atomic restore` after insert to update the working copy if needed.
- **Conflicts**: True conflicts only arise when changes modify the same graph region in incompatible ways.

## See Also

- [`atomic record`](./record.md) — Record new changes
- [`atomic view`](./view.md) — Manage views (create, switch, list, delete)
- [`atomic pull`](./pull.md) — Pull and insert changes from remotes
- [`atomic tag`](./tag.md) — Manage tags for marking states
- [`atomic change`](./change.md) — Inspect change files
- [`atomic log`](./log.md) — View change history

## Related Concepts

- **Changes** — Immutable semantic patches identified by content hash
- **Views** — Filtered perspectives on the same canonical graph
- **Dependencies** — Transitive change prerequisites, automatically resolved
- **Merkle State** — Incremental hash representing the complete state of a view