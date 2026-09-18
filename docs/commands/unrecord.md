---
sidebar_position: 27
title: unrecord
---

# atomic unrecord

Remove the last change from the current view.

## Synopsis

```bash
atomic unrecord [CHANGE] [-n]
```

## Description

`atomic unrecord` removes a change from the current view's change log. It is the local, view-level counterpart to [`atomic record`](record.md) — undo the last commit-like step without touching the working copy content.

Because changes are content-addressed and edges live in the canonical graph, unrecord removes the change's membership in the view; the change data itself remains recoverable until garbage-collected.

:::caution
Unrecording a change that other changes depend on can leave the view inconsistent. Prefer [`atomic view split`](view.md#view-split---split-changes-into-a-new-draft-view) (with `--cascade`) when you want to move changes — including their dependents — elsewhere rather than discard them.
:::

### Choosing the Change

**`[CHANGE]`** — Hash or prefix of the change to unrecord. Find change hashes with [`atomic log`](log.md); the most recent change in the view is the default target when no hash is given.

## Options

| Option | Description |
|--------|-------------|
| `-n, --dry-run` | Preview what would be unrecorded without doing it |

## Examples

### Undo the last change

```bash
atomic log --format short     # see the recent changes
atomic unrecord               # remove the most recent one
```

### Remove a specific change

```bash
atomic log                    # find the hash
atomic unrecord 3f9c2ab1
```

### Preview first

```bash
atomic unrecord --dry-run
```

## Differences from Git

| Aspect | Git | Atomic |
|--------|-----|--------|
| Scope | Rewrites branch history (`git reset`) | Removes view membership; graph edges persist |
| Depth | One commit (without rebase gymnastics) | Any change in the view by hash |
| Safety | Force-push needed after rewrite | Local metadata operation |

## See Also

- [record](record.md) — Recording changes
- [revise](revise.md) — Revise a change in-place (edit rather than remove)
- [view split](view.md#view-split---split-changes-into-a-new-draft-view) — Move changes (with dependents) into another view
- [log](log.md) — Find change hashes
