---
sidebar_position: 11
title: revise
---

# atomic revise

Revise a change in-place without losing its position in the view.

## Synopsis

```bash
atomic revise [<REF>] [OPTIONS]
```

## Description

The `revise` command modifies a previously recorded change. Unlike Git's `commit --amend` which only works on HEAD, Atomic can revise any change in the view. The change keeps its position — subsequent changes are automatically re-applied on top.

This is useful for fixing typos, updating commit messages, or making corrections to recent changes without rewriting history.

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `<REF>` | Reference to the change to revise. Supports `@` (last), `@~1` (previous), `@~N` (N back), or a hash prefix. | `@` (most recent) |

## Options

| Option | Description |
|--------|-------------|
| `-m`, `--message <TEXT>` | New message for the change |
| `--reword` | Only change the message, don't include working copy changes |
| `--no-edit` | Keep existing message, only update content |
| `--dry-run` | Show what would happen without making changes |

## How It Works

When you revise a change that isn't the most recent, Atomic performs these steps internally:

```
Before:  [A] ← [B] ← [C] ← @
                 ↑
            want to revise

Step 1: Unrecord @ (C saved as pending)
         [A] ← [B] ← @

Step 2: Unrecord @ (B is now the target)
         [A] ← @    working copy has B's changes

Step 3: User edits files (or just message with --reword)
         Record as B'
         [A] ← [B'] ← @

Step 4: Re-apply pending (C)
         [A] ← [B'] ← [C] ← @

After:   B has been revised to B', C re-applied on top
```

Because Atomic uses patch theory, re-applying subsequent changes is mathematically sound — independent changes commute cleanly.

## Examples

### Revise the last change

```bash
# Edit files, then revise the most recent change
atomic revise
```

### Fix a commit message

```bash
# Change only the message
atomic revise --reword -m "Better description of what changed"
```

### Revise a previous change

```bash
# Revise the change before the most recent
atomic revise @~1

# Revise two changes back
atomic revise @~2 -m "Updated message"
```

### Preview what would happen

```bash
atomic revise @~1 --dry-run
```

## Differences from Git

| Aspect | Git | Atomic |
|--------|-----|--------|
| What can be amended | Only HEAD (`--amend`) | Any change in the view |
| History rewriting | Rewrites commit SHAs | Preserves graph structure |
| Rebasing needed | Yes, for non-HEAD changes | No, changes re-apply automatically |
| Conflicts | Possible during rebase | Only if changes aren't independent |

## See Also

- [record](record.md) — Recording new changes
- [log](log.md) — Viewing change history
- [restore](restore.md) — Discarding working copy changes
- [change](change.md) — Inspecting change details