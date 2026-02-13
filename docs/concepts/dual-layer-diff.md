---
sidebar_position: 3
title: Dual-Layer Diff & Semantic Merge
---

# Dual-Layer Diff & Semantic Merge

How Atomic stores changes with two parallel representations — a **graph layer** for mathematically sound merging and a **semantic layer** for human-readable code review — and why this architecture enables merge strategies that Git fundamentally cannot support.

## The Problem with Line-Based Diff

Every version control system built on line-based diff (Git, SVN, Mercurial) shares the same fundamental limitation: **lines are not a stable unit of identity**.

Consider two developers working in parallel:

```
Developer A (line 10):   let timeout = 30;   →   let timeout = 60;
Developer B (line 10):   let timeout = 30;   →   let timeout = 45;
```

Git sees this as "both modified line 10" and declares a conflict. But what if Developer A was changing the HTTP timeout and Developer B was changing the database timeout — and they happened to be on the same line number in different functions? Git can't tell. Line numbers carry no semantic meaning.

Atomic solves this with two layers that work together.

## Two Layers, One Change

Every Atomic change stores two parallel representations of the same edit:

| Layer | Purpose | Speaks In | Used For |
|-------|---------|-----------|----------|
| **Graph** | Storage & merging | Nodes, edges, byte positions | Apply, sync, conflict detection |
| **Semantic** | Understanding & display | Files, lines, tokens | Diff display, blame, code review |

Both layers reference the same content blob. Both are generated together during `atomic record`. Both travel together on `atomic push`.

```
┌─────────────────────────────────────────────────────┐
│                   HashedChange                       │
│                                                     │
│  hunks: Vec<GraphOp>     ← Graph layer (storage)   │
│  file_ops: Vec<FileOps>  ← Semantic layer (display) │
│  contents_hash: Hash     ← Shared content blob      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Graph Layer: Context, Not Position

The graph layer doesn't say "insert at line 10." It says "insert **after** this node and **before** that node":

```
  Node A: "fn main() {"       ◄── PREDECESSOR: "Insert AFTER this"
           │
           ▼
  NEW:  "    println!(\"World\");"
           │
           ▼
  Node B: "}"                  ◄── SUCCESSOR: "Insert BEFORE this"
```

This is an `Insertion` — the fundamental graph operation:

```rust
pub struct Insertion {
    pub predecessors: Vec<Position>,  // Nodes that come BEFORE
    pub successors: Vec<Position>,    // Nodes that come AFTER
    pub start: ChangePosition,        // Byte range in content blob
    pub end: ChangePosition,
    pub inode: Position,              // Which file this belongs to
}
```

**Why this matters for merging**: Two insertions with different predecessors and successors are, by definition, independent. They can be applied in any order. No conflict. No rebase. No merge commit. The graph structure proves commutativity.

## Semantic Layer: Files, Lines, Tokens

The semantic layer interprets the same edit for humans using a three-level hierarchy:

```
TRUNK (File)         "src/main.rs"
  │
  ├── BRANCH (Line)  line 1: "fn main() {"
  │     ├── LEAF     "fn"        (Word)
  │     ├── LEAF     " "         (Whitespace)
  │     └── LEAF     "main() {"  (Word + Punctuation)
  │
  ├── BRANCH (Line)  line 2: "    println!(\"World\");"
  │     ├── LEAF     "    "              (Whitespace)
  │     ├── LEAF     "println"           (Word)
  │     ├── LEAF     "!"                 (Punctuation)
  │     └── LEAF     "(\"World\");"      (String + Punctuation)
  │
  └── BRANCH (Line)  line 3: "}"
        └── LEAF     "}"         (Punctuation)
```

Each level has a globally unique ID (change_id + index) that survives renames, moves, and reorders:

| Level | ID Type | Represents | Operations |
|-------|---------|------------|------------|
| **Trunk** | `TrunkId` | File | Create, Delete, Move, Undelete |
| **Branch** | `BranchId` | Line | Insert, Delete, Restore |
| **Leaf** | `LeafId` | Token | Insert, Delete, Replace |

**Why this matters for code review**: When you run `atomic diff`, the output isn't reconstructed from byte positions. It's read directly from the semantic layer — line numbers, token changes, and all. `--word-diff` doesn't recompute anything; it reads `LeafOp` entries.

## How the Layers Enable Better Merging

### Scenario 1: Independent edits on the same "line"

Two developers edit the same line number but in different functions.

**Git**: Conflict. Manual resolution required.

**Atomic**: The graph layer sees two insertions with different predecessor/successor nodes (different functions are different graph regions). No shared context = no conflict. Applied cleanly.

### Scenario 2: Rename + edit

Developer A renames `auth.rs` to `authentication.rs`. Developer B edits a function inside `auth.rs`.

**Git**: Conflict. Git tracks paths, not file identity. The rename and the edit appear to be in different files.

**Atomic**: The file is tracked by its `Inode` (a stable identifier), not its path. The rename changes the Trunk's path. The edit changes a Branch inside the same Trunk. Different graph operations, different regions. Applied cleanly.

### Scenario 3: Reorder + insert

Developer A reorders two functions. Developer B adds a new function between them.

**Git**: Conflict. The diff hunks overlap because line numbers shifted.

**Atomic**: The reorder changes edges between existing nodes. The insert adds a new node with its own predecessor/successor context. If the new function's context nodes weren't moved, no conflict.

### Scenario 4: Token-level resolution

Two developers edit the same line but different tokens:

```
Before:   let config = Config::new(timeout, retries);
Dev A:    let config = Config::new(60, retries);        // changed timeout
Dev B:    let config = Config::new(timeout, 5);          // changed retries
```

**Git**: Conflict. Same line modified by both.

**Atomic**: The semantic layer sees two `LeafOp::Replace` operations on different `LeafId`s within the same Branch. The graph layer sees two independent edits to different byte ranges. No shared predecessors/successors. Applied cleanly.

## The Merge Decision Tree

When Atomic encounters two changes that touch the same file, the merge strategy uses both layers:

```
Two changes touch the same file
         │
         ▼
┌─────────────────────────────┐
│ Graph: Same predecessors    │──── No  ──▶ Independent. Apply both.
│ and successors?             │
└──────────┬──────────────────┘
           │ Yes
           ▼
┌─────────────────────────────┐
│ Semantic: Same Branch       │──── No  ──▶ Different lines. Apply both.
│ (same line)?                │
└──────────┬──────────────────┘
           │ Yes
           ▼
┌─────────────────────────────┐
│ Semantic: Same Leaf         │──── No  ──▶ Different tokens. Apply both.
│ (same token)?               │
└──────────┬──────────────────┘
           │ Yes
           ▼
┌─────────────────────────────┐
│ Same content?               │──── Yes ──▶ Identical edit. Deduplicate.
└──────────┬──────────────────┘
           │ No
           ▼
      TRUE CONFLICT
   (mark for human resolution)
```

This means Atomic only declares a conflict when two changes modify the **exact same token** to **different values**. Everything else resolves automatically.

## Performance Characteristics

The semantic layer doesn't just help with display — it makes operations faster:

| Operation | Without Semantic Layer | With Semantic Layer |
|-----------|----------------------|---------------------|
| Find line N | O(graph nodes) scan | O(1) via Branch index |
| Token-level blame | Traverse entire graph | Direct: `leaf.change_id` |
| Word diff | Recompute from bytes | Read from LeafOp |
| Line count | Walk all content | Count Branches |
| Conflict check | Byte-range overlap | Token-ID comparison |

## What Gets Stored

Both layers are part of the change's content-addressed hash. They travel together:

```
atomic record
  │
  ├── Detects file changes (working copy vs pristine)
  │
  ├── Graph layer: DiffOp → GraphOp (Insertions, EdgeUpdates)
  │
  ├── Semantic layer: content → tokenize → analyze → FileOps/LineOps
  │
  └── Store both in HashedChange → content-addressed .atomic/changes/
```

On `atomic push`, the remote receives the full change including both layers. The server can render diffs, compute blame, and display code review — all from the change data, without recomputing anything.

## Comparison with Other Systems

| Capability | Git | Pijul | Atomic |
|------------|-----|-------|--------|
| **Diff unit** | Lines | Bytes/lines | Nodes + Tokens |
| **Merge granularity** | Line-level | Byte-level | Token-level |
| **File identity** | Path | Inode | Inode + TrunkId |
| **Rename handling** | Heuristic detection | Native | Native + semantic |
| **Blame granularity** | Line | Line | Token |
| **Word diff** | Recomputed on display | Not available | Stored in change |
| **Code review data** | Generated by server | Generated by server | Embedded in change |
| **Conflict rate** | High (line overlap) | Low (byte context) | Lowest (token context) |

## Key Takeaways

1. **Graph layer = correctness**. It guarantees that independent changes commute, that content is addressed by hash, and that merges are mathematically sound.

2. **Semantic layer = understanding**. It translates byte-level graph operations into lines and tokens that developers can read, review, and reason about.

3. **Both are required**. The graph alone can't show you "line 42 changed." The semantic layer alone can't merge changes. Together, they provide both correctness and usability.

4. **Fewer conflicts by construction**. Because Atomic resolves at the token level using stable identity (not line numbers), the vast majority of "conflicts" in Git are simply non-conflicts in Atomic.

5. **Provenance is built in**. Every token has a `LeafId` that traces back to the change that introduced it. Blame is O(1), not a graph traversal.

## Further Reading

- [The Lego Story](the-lego-story.md) — Intuitive explanation of Atomic's graph model
- [Graph Model & AI Attribution](graph-model-explained.md) — Deep dive into the DAG structure
- [Hunks: Edit and Replacement](hunks-edit-replacement.md) — Mathematical foundations of graph operations
- [Performance at Scale](performance-at-scale.md) — How dual-layer indexing scales to large repositories