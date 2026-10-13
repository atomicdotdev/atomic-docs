---
sidebar_position: 5
title: Merging & Conflicts
description: How Atomic merges changes across views, when conflicts happen, how they are surfaced honestly, and how to resolve them.
---

# Merging & Conflicts

Atomic merges by **inserting changes between views**, not by replaying diffs. Because every change is a set of graph operations with explicit context (see [Dual-Layer Diff & Semantic Merge](./dual-layer-diff.md)), most merges are automatic and order-independent. When two changes are genuinely incompatible, Atomic records a conflict — and it never hides one.

This page covers what actually happens during a merge, the guarantees Atomic makes, what a conflict looks like, how to see it, and how to resolve it.

## How merging works

In Git you merge branches by computing and replaying diffs, producing merge commits and, often, conflicts caused by shifted line numbers.

In Atomic, all changes already live in a single canonical graph. A view is a **filter** over that graph — an ordered set of change references. Merging is [`atomic insert`](../commands/insert.md): it adds a change (and its dependency closure) to another view's filter.

| Aspect | Git merge / cherry-pick | Atomic insert |
|--------|-------------------------|---------------|
| Data moved | Diffs replayed | None — edges already in the graph |
| Cost | O(diff size) | O(1) per change (metadata) |
| Dependencies | Manual | Automatic transitive closure |
| Source branch | Cherry-pick leaves it alone | Source view is never modified |
| Conflicts | Common (line-based) | Only when changes truly overlap |

Because merging is metadata, it is fast and the source view is untouched. A conflict arises only when two changes modify the **same token to different values** (or touch the same structural position in incompatible ways) — not merely because they edited nearby lines.

## The four guarantees

Every merge in Atomic upholds four invariants. These are enforced by the engine and continuously exercised by a scenario test matrix.

1. **No silent duplication** — every logical line appears exactly once. (Inside a conflict, each *side* appears exactly once.)
2. **No false conflict** — changes that commute never produce conflict markers.
3. **No lost edit** — both sides' content is always present, either merged into the file or preserved inside a conflict.
4. **Honest exit state** — if a file contains conflict markers, the repository *knows* it. `atomic status` reports it, `atomic conflicts` lists it, and `atomic record` refuses to bake the markers into history. A conflict is never reported as "clean."

The fourth guarantee is the important one: a conflict you can't see is worse than a conflict. Atomic keeps three signals in lock-step — **markers on disk ⇔ `status` says Conflicted ⇔ `conflicts` lists the file** — and [`atomic doctor check`](#verifying-integrity) audits that they always agree.

## What a conflict looks like

When a real conflict occurs, the file is written with conflict markers. Atomic's markers are **inverted relative to Git**:

```
>>>>>>> 1
first version of the region
======= 1 [7K3XSCZ3]
second version of the region
<<<<<<< 1
```

- `>>>>>>>` opens the block (the first side).
- `=======` separates the sides. With three or more concurrent sides, the separators **nest** — one opener, one separator between each side, one closer.
- `<<<<<<<` closes the block (the last side).

Shared, unconflicted lines around the block are written normally, exactly once.

## Seeing conflicts

### `atomic status`

A conflicted file is reported with the `C` code, and supersedes any Modified report for the same path:

```bash
atomic status --short
```

```
C  src/config.rs
M  src/main.rs
```

### `atomic conflicts`

Lists every conflicted file on the current view, with the line where each conflict begins:

```bash
atomic conflicts
```

```
1 conflicted file:

	src/config.rs
	  order conflict at line 12
```

Machine-readable form — one line per conflict as `<path>:<line>:<kind>`:

```bash
atomic conflicts --short
```

```
src/config.rs:12:order
```

### `atomic record` refuses to bury a conflict

If a file still contains conflict markers, `atomic record` will not record it — otherwise the markers would become permanent content:

```
src/config.rs still contains conflict markers at line 12
(resolve the conflict, or pass --allow-conflict-markers to override)
```

## Resolving a conflict

Resolution is the same working-copy edit you already know:

1. Open the conflicted file and edit it to the intended result, deleting the markers.
2. Record the resolution:

```bash
atomic record -m "resolve config conflict"
```

Once the markers are gone, `status` and `conflicts` drop the file automatically, and the recorded resolution clears the persisted conflict state. The resolution sticks — switching views away and back does not resurrect the markers.

## Verifying integrity

`atomic doctor check` is a read-only audit of the working copy against the graph. It catches two classes of problem and exits non-zero if any are found:

```bash
atomic doctor check
```

- **Materialization drift** — a file `status` considers *clean* whose on-disk bytes differ from what the graph would produce.
- **Conflict honesty** — the invariant above: on-disk markers, `status` Conflicted, and `conflicts` must all agree.

Run it any time you want reassurance that the working copy and the graph tell the same story.

## Scenario reference

What Atomic does when two changes converge on the same file:

| Scenario | Outcome |
|----------|---------|
| Edits in different regions / functions | Clean merge, both edits kept |
| Same line, different tokens | Clean merge (token-level) |
| Identical edit made on both sides | Deduplicated — appears once |
| Same position, different content | Conflict, both sides in markers |
| Three or more concurrent edits at one spot | Conflict with correctly nested markers |
| One side deletes a region, the other edits a different line | Deletion applies; the edited line survives |
| Both sides delete the same file | File is removed once, cleanly |
| Same change arriving via two paths (a diamond) | Deduplicated by change identity — applied once |
| Two views independently **create** the same path | Name conflict surfaced (both versions preserved in markers) |
| Binary / non-text file edited at the same spot on both sides | Whole-file conflict (no token merge) |

## Renames & moves

Atomic tracks a file by a stable **inode**, not its path, so renames and moves preserve identity and history. Use [`atomic move`](../commands/move.md) (alias `atomic mv`) — or just rename on disk and record — and Atomic records the change as a *move* that reuses the file's inode rather than a delete-plus-add.

The payoff shows up in merges:

- **Rename vs edit** — one view renames `auth.rs` → `authentication.rs` while another edits a function inside it. Because both operate on the same inode, inserting the rename carries the concurrent edit along to the new path. Clean, no conflict.
- **Cross-view rename** — inserting a rename into another view applies it: the file appears at the new path with its content, the old path is gone, and the inode (and its blame/history) is preserved.

## Known limitations

Atomic favors an honest, tracked gap over a silent one. The current limitation in this area:

- **Rename vs rename (different targets)** — if two views rename the *same* file to *different* names concurrently, the merge currently resolves to a single name (last writer wins) rather than surfacing a name conflict. Content is never lost (the file exists under one of the names), but the competing name is dropped without a conflict marker. Surfacing this as a first-class name conflict is in progress.

## See also

- [Dual-Layer Diff & Semantic Merge](./dual-layer-diff.md) — why Atomic conflicts so rarely
- [`atomic insert`](../commands/insert.md) — merge changes between views
- [`atomic status`](../commands/status.md) — see conflicted files
- [`atomic move`](../commands/move.md) — rename/move with preserved identity
- [`atomic record`](../commands/record.md) — record edits and conflict resolutions
