---
sidebar_position: 19
title: stash
---

# atomic stash

Temporarily save uncommitted changes.

## Synopsis

```bash
atomic stash [SUBCOMMAND]
```

## Description

The `stash` command saves your uncommitted working copy changes to a temporary orphan view, then restores the working copy to a clean state. This is useful when you need to switch views but have changes that belong elsewhere, or when you need a clean working copy for a different task.

Stashes are stored as lightweight orphan views under the `stash/` namespace. They persist until explicitly dropped or popped.

## Subcommands

### `stash` (no subcommand)

Save uncommitted changes and restore a clean working copy.

```bash
# Save all uncommitted changes
atomic stash

# Save with a message
atomic stash -m "WIP: auth refactor"
```

**Options:**

| Option | Description |
|--------|-------------|
| `-m`, `--message <TEXT>` | Descriptive message for the stash |
| `--include-untracked` | Also stash untracked files |
| `--keep` | Save to stash but don't revert the working copy |

### `pop`

Apply the most recent stash and remove it.

```bash
# Apply and remove the most recent stash
atomic stash pop

# Apply and remove a specific stash
atomic stash pop stash@{2}
```

If the stash applies cleanly, it is automatically removed from the stash list. If there are conflicts, the stash is preserved so you can resolve and retry.

### `apply`

Apply a stash without removing it from the stash list.

```bash
# Apply the most recent stash (keep it in the list)
atomic stash apply

# Apply a specific stash
atomic stash apply stash@{1}
```

This is useful when you want to apply the same changes to multiple views.

### `list`

List all saved stashes.

```bash
atomic stash list
```

**Example output:**

```
stash@{0}: On main — WIP: auth refactor (2 minutes ago)
stash@{1}: On feature — debugging session cleanup (1 hour ago)
stash@{2}: On main — (3 days ago)
```

Each entry shows:
- The stash index
- The source view
- The stash message (if provided)
- How long ago it was created

### `drop`

Delete a stash without applying it.

```bash
# Drop the most recent stash
atomic stash drop

# Drop a specific stash
atomic stash drop stash@{1}
```

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | Drop all stashes |

### `show`

Show the contents of a stash (what files were changed).

```bash
# Show the most recent stash
atomic stash show

# Show a specific stash
atomic stash show stash@{2}

# Show full diff
atomic stash show --diff
```

**Options:**

| Option | Description |
|--------|-------------|
| `--diff` | Show full diff instead of just file list |

## How It Works

Under the hood, stashes are implemented as orphan views:

1. **Save** — Creates a temporary view named `stash/auto_{timestamp}` (or `stash/{source}_{timestamp}_{message}`), records all working copy changes to it, then reverts the working copy.

2. **Pop/Apply** — Switches to the stash view, reads the recorded changes, applies them to the current working copy, and (for `pop`) deletes the stash view.

3. **Drop** — Deletes the orphan view and its recorded changes.

Because stashes are just views, they participate in the normal Atomic graph — they're content-addressed, use the same change format, and can even be pushed to remotes if needed.

## Examples

### Save changes before switching views

```bash
# You're working on feature-auth but need to fix a bug on main
atomic stash -m "WIP: auth middleware"
atomic view switch main

# Fix the bug
atomic record -m "Fix null pointer in config parser"

# Go back and restore your work
atomic view switch feature-auth
atomic stash pop
```

### Apply the same changes to multiple views

```bash
# Stash the changes
atomic stash -m "shared config update"

# Apply to first view
atomic view switch staging
atomic stash apply

# Apply to second view
atomic view switch production
atomic stash apply

# Clean up the stash
atomic stash drop
```

### Clean up old stashes

```bash
# See what's stashed
atomic stash list

# Drop everything
atomic stash drop --all
```

## Differences from Git

| Aspect | Git | Atomic |
|--------|-----|--------|
| Storage | Special ref outside branch model | Orphan view (same graph model) |
| Identity | Index-based only (`stash@{0}`) | Index-based, with source view and message |
| Conflicts on pop | Possible, stash kept | Possible, stash kept |
| Push to remote | Not possible | Possible (it's just a view) |
| Untracked files | Requires `--include-untracked` | Requires `--include-untracked` |

## See Also

- [view](view.md) — Managing views
- [record](record.md) — Recording changes
- [restore](restore.md) — Discarding working copy changes
- [status](status.md) — Viewing working copy status