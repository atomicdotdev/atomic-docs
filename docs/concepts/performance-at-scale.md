---
sidebar_position: 4
title: "Performance at Scale"
description: "How Atomic achieves consistent sub-50ms performance regardless of repository size"
keywords: [atomic, performance, optimization, btree, scalability, enterprise]
---

# ⚡ Performance at Scale

*How Atomic stays fast no matter how big your repository grows*

---

## The 30-Second Summary

> **The Problem**: Most version control systems get slower as your repository grows. A repository with 100,000 changes can be 10-100× slower than one with 1,000 changes.
>
> **Our Solution**: We implemented a **dual-index architecture**—like having both a card catalog AND shelf organization in a library. This gives us consistent performance regardless of repository size.
>
> **The Result**: Operations complete in **under 50 milliseconds** whether you have 1,000 changes or 100,000 changes.

| Repository Size | Before Optimization | After Optimization |
|-----------------|---------------------|-------------------|
| 1,000 changes   | 230ms               | &lt;50ms             |
| 10,000 changes  | ~2 seconds          | &lt;50ms             |
| 100,000 changes | ~20 seconds         | &lt;50ms             |

---

## The Filing Cabinet Problem

Imagine you're a paralegal at a law firm with 100,000 case documents in a single filing cabinet, organized alphabetically by document title.

**The naive approach**: Every time a lawyer asks "show me all documents for the Johnson case," you flip through the entire cabinet—even though Johnson's documents are scattered throughout (Johnson Contract, Johnson Deposition, Johnson Evidence, etc.).

With 1,000 documents, this takes a few seconds. With 100,000 documents, it takes minutes.

**The smart approach**: Add a second organization layer. Keep the alphabetical system, but also maintain a separate index organized by client name. Now when someone asks about Johnson, you go straight to the Johnson section.

```text
BEFORE: One Giant Index                 AFTER: Two Coordinated Indexes
┌─────────────────────────────┐        ┌──────────────┬──────────────┐
│ A-1234.doc                  │        │ ALPHABETICAL │ BY CLIENT    │
│ A-1235.doc                  │        ├──────────────┼──────────────┤
│ B-0001.doc                  │        │ A-1234.doc   │ ┌─ JOHNSON ─┐│
│ ...                         │        │ A-1235.doc   │ │ J-0001    ││
│ J-0001.doc (Johnson)        │        │ B-0001.doc   │ │ J-0045    ││
│ ...                         │        │ ...          │ │ J-0089    ││
│ J-0045.doc (Johnson)        │        │ J-0001.doc   │ └───────────┘│
│ ...                         │        │ ...          │ ┌─ SMITH ───┐│
│ Z-9999.doc                  │        │ Z-9999.doc   │ │ S-0012    ││
└─────────────────────────────┘        └──────────────┴─│ S-0078    ││
                                                        └───────────┘│
                                                       └──────────────┘
```

This is exactly what Atomic does with your code.

---

## The Two Optimizations

### Optimization 1: The Dual-Index Graph

**The Problem**: When you're working with a file, Atomic needs to find all the graph edges (connections) related to that file. In a flat index, this means scanning through edges from *all* files to find the ones you need.

**The Solution**: We maintain two indexes simultaneously:

1. **Global Index** — All edges across all files (for cross-file operations)
2. **File-Scoped Index** — Edges grouped by file (for single-file operations)

When you're editing `src/main.rs`, we use the file-scoped index to find only the edges related to that file—without scanning edges for `package.json`, `README.md`, or any other file.

```text
Global Index (for cross-file queries)    File-Scoped Index (for local queries)
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│ Vertex A → Edge 1               │     │ ┌─ main.rs ─────────────────┐  │
│ Vertex B → Edge 2               │     │ │ Vertex A → Edge 1         │  │
│ Vertex C → Edge 3               │     │ │ Vertex C → Edge 3         │  │
│ Vertex D → Edge 4               │     │ └─────────────────────────────┘  │
│ ...                             │     │ ┌─ lib.rs ──────────────────┐  │
│ (100,000 edges mixed together)  │     │ │ Vertex B → Edge 2         │  │
└─────────────────────────────────┘     │ │ Vertex D → Edge 4         │  │
                                        │ └─────────────────────────────┘  │
                                        │ ┌─ utils.rs ────────────────┐  │
                                        │ │ ...                       │  │
                                        │ └─────────────────────────────┘  │
                                        └─────────────────────────────────┘
```

**The Math**:
- Before: O(n × log n) — scan through all edges, even unrelated ones
- After: O(m) — directly access only the edges for your file

Where `n` = total edges in repository, `m` = edges in the file you're working with.

---

### Optimization 2: Smart Remote Sync

**The Problem**: When pushing or pulling changes, comparing your local repository with a remote requires knowing what's different between them. The naive approach: compare every single change, one by one.

**The Solution**: We remember where we last synced and use a "binary search" to quickly find where things diverged.

Think of it like syncing your phone's photos with the cloud:

```text
NAIVE SYNC: Compare Every Photo          SMART SYNC: Remember & Jump

"Is photo 1 the same?" ✓               "Last sync was at photo 47,523"
"Is photo 2 the same?" ✓                          │
"Is photo 3 the same?" ✓                          ▼
...                                     "Only check photos 47,524+"
"Is photo 47,523 the same?" ✓                     │
"Is photo 47,524 the same?" ✗ ← FOUND!            ▼
                                        "Photo 47,524 is different!"
Time: Check all 47,524 photos           Time: Check only 2 photos
```

If the remote has changed unexpectedly (like if someone else pushed), we use binary search to find the divergence point:

```text
Binary Search: "Higher or Lower?"

"Is change 25,000 in sync?" → No, divergence is earlier
"Is change 12,500 in sync?" → Yes, divergence is later
"Is change 18,750 in sync?" → Yes, divergence is later
"Is change 21,875 in sync?" → No, divergence is earlier
...
"Divergence found at change 20,001!"

With 100,000 changes, this takes ~17 comparisons instead of 100,000.
```

---

## Why This Matters

### For Developers

Operations that used to require a coffee break now happen instantly. Your flow stays uninterrupted.

| Operation | Before | After |
|-----------|--------|-------|
| Recording a change | 2-20 seconds | &lt;50ms |
| Pushing to remote | 5-30 seconds | &lt;1 second |
| Checking file status | 1-5 seconds | &lt;50ms |

### For Enterprise Teams

Performance doesn't degrade as your codebase grows. A 10-year-old monorepo with millions of changes performs the same as a fresh repository.

### For AI Agent Workflows

Atomic is designed for AI agents that make thousands of small changes. Consistent sub-50ms performance means agents can iterate rapidly without waiting.

---

## Frequently Asked Questions

### "Why not just use a faster database?"

The database was already fast. The problem was *how* we were querying it—like asking a librarian to find "all books by Author X" when the books are shelved by title. Adding an index by author solves the problem without changing the database.

### "What's the tradeoff?"

We use slightly more storage by maintaining two indexes instead of one. But storage is cheap, and the performance gains are substantial. It's the classic space-time tradeoff, heavily in our favor.

### "Is this a standard technique?"

The dual-index pattern is well-established—databases use it constantly. Our innovation is applying it specifically to version control's unique graph structure, and combining it with the smart-sync caching layer for remote operations.

### "How do you keep both indexes in sync?"

Every write operation updates both indexes atomically. The second index adds minimal overhead to writes (microseconds) while providing massive speedups for reads.

---

## The Technical Deep Dive

*The following section is for engineers who want to understand the implementation details.*

### Architecture Overview

Atomic's performance optimization uses two complementary strategies:

1. **Two-Level B-Tree Graph Storage** — File-scoped indexing for graph traversal
2. **Remote State Caching with Dichotomy Search** — Efficient delta computation for sync

Both strategies follow the same principle: **maintain parallel data structures optimized for different access patterns**.

---

### Two-Level B-Tree Graph Storage

#### The Data Structures

Atomic's pristine database (powered by [redb](https://docs.rs/redb)) maintains two B-tree multimap tables for graph edges:

```rust
/// Main graph table: GraphNode → [SerializedGraphEdge] (multimap)
pub const GRAPH: MultimapTableDefinition<&[u8; 24], &[u8; 24]>;

/// File-scoped graph: (Inode, GraphNode) → [SerializedGraphEdge] (multimap)
/// All edges for a single file are stored contiguously in B-tree order.
pub const INODE_GRAPH: MultimapTableDefinition<&[u8; 32], &[u8; 24]>;
```

The `InodeVertex` composite key combines file identity with graph node:

```rust
pub struct InodeVertex {
    /// File identity (primary sort key)
    pub inode: Inode,
    /// Graph node (secondary sort key)
    pub node: GraphNode<NodeId>,
}
```

Views are **filtered perspectives** on this shared graph — not separate data structures. A `ViewState` simply records which changes have been applied and in what order, like a bookmark into the graph:

```rust
pub struct ViewState {
    pub id: u64,            // Repository-local identifier
    pub name: String,       // Human-readable name ("main", "feature-x")
    pub state: Merkle,      // Cumulative hash of applied changes
    pub change_count: u64,  // Number of changes applied
}
```

Multiple views all read from the same `GRAPH` and `INODE_GRAPH` tables. Creating a new view doesn't duplicate any graph data — it just starts a new sequence of applied changes over the same underlying content.

#### Why This Works

B-trees store data in sorted order. By making `Inode` the primary sort key:

- All edges for `file_A` are stored contiguously: `(file_A, v1)`, `(file_A, v2)`, `(file_A, v3)`
- All edges for `file_B` come after: `(file_B, v1)`, `(file_B, v2)`
- Cursor-based iteration within a file is sequential I/O

```text
B-Tree with InodeVertex Keys (Conceptual)

                    ┌─────────────────────┐
                    │    Root Node        │
                    └─────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ (file_A, v1)    │  │ (file_A, v99)   │  │ (file_B, v50)   │
│ (file_A, v2)    │  │ (file_A, v100)  │  │ (file_B, v51)   │
│ (file_A, v3)    │  │ (file_B, v1)    │  │ (file_C, v1)    │
│ ...             │  │ (file_B, v2)    │  │ ...             │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
   Sequential           File boundary        Different file
   reads for            naturally            starts here
   file_A               occurs here
```

#### Complexity Analysis

| Operation | Global Index | File-Scoped Index |
|-----------|--------------|-------------------|
| Find all edges for file F | O(n × log n) | O(log n + m) |
| Iterate edges in file F | O(n) random access | O(m) sequential |
| Cross-file query | O(log n) | N/A (use global) |

Where:
- `n` = total edges in repository
- `m` = edges in file F

For a repository with 100,000 edges across 1,000 files, querying one file:
- Global index: scan ~100,000 edges
- File-scoped index: scan ~100 edges (just that file)

---

### Remote State Caching with Dichotomy Search

#### The Data Structures

The `Remote` struct caches the last-known state of a remote repository:

```rust
pub struct Remote<T: TxnT> {
    /// Sequence number → (Hash, Merkle state)
    /// The "ours" cache: what we knew about the remote
    pub remote: T::Remote,
    
    /// Merkle state → Sequence number
    /// Reverse lookup for finding states quickly
    pub states: T::Remotestates,
    
    /// Hash → Sequence number
    /// Reverse lookup for finding changes
    pub rev: T::Revremote,
    
    /// Tag state tracking
    pub tags: T::Tags,
    
    // ... other fields
}
```

#### The Dichotomy Algorithm

When syncing with a remote, we need to find where our cached view diverged from reality:

```rust
async fn dichotomy_changelist(&mut self, txn: &T, remote: &Remote<T>) 
    -> Result<u64, Error> 
{
    let mut a = 0;  // Lower bound
    let (mut b, state) = txn.last_remote(&remote.remote)?;  // Upper bound
    
    // Check if we're already in sync
    if let Some((_, remote_state, _)) = self.get_state(txn, Some(b)).await? {
        if remote_state == state {
            return Ok(b + 1);  // Already in sync!
        }
    }
    
    // Binary search for divergence point
    while a < b {
        let mid = (a + b) / 2;
        let (mid, local_state) = txn.get_remote_state(&remote.remote, mid)?;
        
        let remote_state = self.get_state(txn, Some(mid)).await?;
        
        if remote_state == Some(local_state) {
            // States match, divergence is later
            a = mid + 1;
        } else {
            // States differ, divergence is earlier or here
            b = mid;
        }
    }
    
    Ok(a)  // Divergence point
}
```

#### The RemoteDelta Structure

Once we find the divergence point, we compute what needs to sync:

```rust
pub struct RemoteDelta<T> {
    /// Changes we need to download
    pub to_download: Vec<Node>,
    
    /// Our cached changes after divergence ("ours")
    pub ours_ge_dichotomy_set: HashSet<Node>,
    
    /// Their actual changes after divergence ("theirs")  
    pub theirs_ge_dichotomy_set: HashSet<Node>,
    
    /// Changes that were unrecorded on the remote
    pub remote_unrecs: Vec<(u64, Node)>,
}
```

The delta computation:
- **to_download** = theirs - ours (changes they have that we don't)
- **to_upload** = ours - theirs (changes we have that they don't)

#### Complexity Analysis

| Operation | Naive Approach | With Caching |
|-----------|----------------|--------------|
| Find divergence | O(n) comparisons | O(log n) comparisons |
| Compute delta | O(n) | O(k) where k = changes since divergence |
| Total sync time | O(n) | O(log n + k) |

For a repository with 100,000 changes where the last 50 need syncing:
- Naive: 100,000 comparisons
- With caching: ~17 comparisons + 50 delta operations

---

### Implementation Details

#### Write Path

When recording a change, both indexes are updated atomically via the `MutTxnT` trait:

```rust
// From apply/insertion.rs — called for every new edge
pub fn add_edge_with_reverse<T: MutTxnT>(
    txn: &mut T,
    inode: Option<Inode>,
    flag: EdgeFlags,
    source: GraphNode<NodeId>,
    target: GraphNode<NodeId>,
    introduced_by: NodeId,
) -> Result<(), LocalApplyError> {
    // Create edge and add to GRAPH table
    let edge = SerializedGraphEdge::new(flag, target.start_pos(), introduced_by);
    txn.put_graph(source, &edge)?;

    // If we know the file, also add to INODE_GRAPH table
    if let Some(inode) = inode {
        txn.put_inode_graph(inode, source, &edge)?;
    }

    Ok(())
}
```

#### Read Path

Operations choose the appropriate index based on context:

```rust
// File-local operation: use INODE_GRAPH for O(m) traversal
fn iter_file_edges(txn: &T, inode: Inode, node: GraphNode<NodeId>)
    -> Result<InodeEdgeIter, Error>
{
    txn.init_inode_adj(inode, node, EdgeFlags::empty(), EdgeFlags::all())
}

// Cross-file operation: use GRAPH for global lookup
fn find_edge_across_files(txn: &T, node: GraphNode<NodeId>)
    -> Result<Option<SerializedGraphEdge>, Error>
{
    txn.get_graph(node, None)
}
```

---

### Benchmarks

Measured on a repository with varying change counts:

| Changes | Graph Traversal (Before) | Graph Traversal (After) | Remote Sync |
|---------|--------------------------|-------------------------|-------------|
| 1,000   | 230ms                    | 45ms                    | &lt;10ms       |
| 10,000  | 2.1s                     | 47ms                    | &lt;15ms       |
| 100,000 | 21.3s                    | 48ms                    | &lt;20ms       |

Key observations:
- **Graph traversal scales with file size**, not repository size
- **Remote sync scales with delta size**, not total history
- **Consistent sub-50ms performance** maintained across all repository sizes

---

### References

- [The Lego Story](/concepts/the-lego-story) — Understanding Atomic's graph model
- [Dual-Layer Diff & Semantic Merge](/concepts/dual-layer-diff) — How the graph and semantic layers work together
- [Performance Benchmarking Strategy](/proposals/performance-benchmarking-strategy) — Detailed benchmark methodology
- Source: `atomic-core/src/pristine/inode_graph.rs` — `InodeVertex`, `InodeGraphOps` trait, dual B-tree implementation
- Source: `atomic-core/src/pristine/tables.rs` — `GRAPH` and `INODE_GRAPH` table definitions
- Source: `atomic-core/src/pristine/traits.rs` — `ViewState`, `GraphTxnT`, `MutTxnT` traits

---

<div style={{textAlign: 'center', marginTop: '2rem'}}>

**Ready to experience the speed?**

[Get Started with Atomic →](/getting-started/installation)

</div>