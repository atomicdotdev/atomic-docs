---
sidebar_position: 33
title: compact
---

# atomic compact

Reclaim unused space in the repository database. Introduced in Atomic 0.20.0.

> **Verified against CLI 0.20.0.**

## Synopsis

```bash
atomic compact [--repository <REPOSITORY>] [--json]
```

## Description

Deleting views, unrecording changes, and pruning data can leave unused space in the repository database. `atomic compact` reclaims that space. It is safe to run at any time; it never removes reachable content.

## Options

| Option | Description |
|--------|-------------|
| `--repository <REPOSITORY>` | Path inside the repository or one of its sandboxes (default: `.`) |
| `--json` | Emit the database path and before/after byte counts as JSON |

## Examples

```bash
# Compact the current repository
atomic compact

# Compact from inside a sandbox, targeting the parent repository
atomic compact --repository ../..

# Machine-readable result
atomic compact --json
```

## See Also

- [doctor](doctor.md) — diagnose and repair repository indexes
- [view](view.md) — deleted views free `VIEW_CHANGES` entries that GC and compaction can then reclaim
