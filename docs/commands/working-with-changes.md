---
sidebar_position: 3
title: Working with Changes
---

# Working with Changes

The core workflow in Atomic — track files, record changes, review diffs, and navigate history.

## Commands

| Command | Description |
|---------|-------------|
| [`add`](add.md) | Add files to be tracked |
| [`remove`](remove.md) | Remove files from tracking (alias: `rm`) |
| [`move`](move.md) | Move or rename tracked files (alias: `mv`) |
| [`status`](status.md) | Show modified, added, deleted, and untracked files |
| [`diff`](diff.md) | Show differences between working copy and last recorded state |
| [`record`](record.md) | Create a new change from tracked file modifications |
| [`revise`](revise.md) | Modify a previously recorded change in-place |
| [`log`](log.md) | Display the history of changes on the current view |
| [`change`](change.md) | Inspect details of a specific change by hash or sequence number |
| [`insert`](insert.md) | Insert changes from another view or change file |

## The Record Workflow

Atomic's workflow is similar to Git but uses different terminology:

| Git | Atomic | Description |
|-----|--------|-------------|
| `git add` | `atomic add` | Track a file |
| `git status` | `atomic status` | See what changed |
| `git diff` | `atomic diff` | Review differences |
| `git commit` | `atomic record` | Create a change |
| `git commit --amend` | `atomic revise` | Modify the last change |
| `git log` | `atomic log` | View history |
| `git show` | `atomic change` | Inspect a specific change |

The key difference: Atomic records **changes** (patches), not snapshots. A change is a set of composable graph operations that can be applied, unapplied, and reordered.

## Typical Workflow

```bash
# 1. Track files
atomic add src/main.rs src/lib.rs

# 2. Make edits to your files

# 3. Review what changed
atomic status
atomic diff

# 4. Record the change
atomic record -m "Add authentication module"

# 5. View history
atomic log
```

## Recording Changes

The `record` command creates a new change from all tracked file modifications:

```bash
# Record with a message
atomic record -m "Fix null pointer in config parser"

# Record all changes (including newly created files)
atomic record --all -m "Initial project setup"

# Record with a specific diff algorithm
atomic record --algorithm patience -m "Refactor auth module"
```

Each recorded change includes:
- **Graph operations** — The low-level vertex/edge modifications
- **Semantic layer** — Line-level and token-level operations for display
- **Metadata** — Author, timestamp, message, dependencies
- **Provenance** — AI model and cost data (if recorded by an agent)

## Revising Changes

Unlike Git where `--amend` only works on HEAD, Atomic can revise any change in the view:

```bash
# Revise the most recent change
atomic revise -m "Better commit message"

# Revise only the message (no content changes)
atomic revise --reword -m "Fix typo in auth module"

# Revise a previous change
atomic revise @~1
```

Subsequent changes are automatically re-applied on top. See [revise](revise.md) for details.

## Reviewing Changes

### Status

```bash
# See all changes
atomic status

# Short format
atomic status --short
```

### Diff

```bash
# Diff all tracked files
atomic diff

# Diff a specific file
atomic diff src/main.rs

# Show only statistics
atomic diff --stat

# Use patience diff algorithm
atomic diff --algorithm patience
```

### History

```bash
# View change log
atomic log

# View a specific change
atomic change ABC12345

# View the most recent change
atomic change
```

## Inserting Changes

The `insert` command moves changes between views or inserts change files:

```bash
# Insert a single change by hash
atomic insert ABC12345

# Insert changes from another view
atomic insert from-view feature --to-view main

# Cherry-pick specific changes
atomic insert pick ABC123 DEF456 --to-view main

# Preview what would be inserted
atomic insert preview feature --to-view main
```

## See Also

- [Repository Management](repository-management.md) — Creating and managing repos
- [View](view.md) — Managing views
- [Stash](stash.md) — Temporarily saving uncommitted changes
- [Agent](agent.md) — AI agent turn-level recording