---
sidebar_position: 32
title: blame
---

# atomic blame

Show line-level ownership for a tracked text file. Introduced in Atomic 0.20.0.

> **Verified against CLI 0.20.0.**

## Synopsis

```bash
atomic blame <PATH> [--short]
```

## Description

`atomic blame` attributes each line of a tracked text file to the change that last touched it. Because Atomic changes are content-addressed and vertices are never deleted, blame resolves against real change identities, not synthesized tree diffs.

## Arguments

| Argument | Description |
|----------|-------------|
| `<PATH>` | File path to attribute (repository-relative) |

## Options

| Option | Description |
|--------|-------------|
| `--short` | Show only the short (12-character) change hash per line |

## Examples

```bash
# Attribute every line of auth.rs
atomic blame src/auth.rs

# Compact view: change hashes only
atomic blame --short src/auth.rs

# Then inspect the change behind a specific line
atomic change <HASH>
```

## See Also

- [change](change.md) — inspect the change that owns a line
- [provenance](provenance.md) — W3C PROV projection for a change (model, session, cost)
- [query](query.md) — graph queries across files and changes
