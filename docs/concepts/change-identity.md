---
sidebar_position: 1
title: Change Identity
---

# Change Identity

## Overview

Change identity is a fundamental concept in Atomic VCS that distinguishes it from Git and other version control systems. In Atomic, **changes are identified by their content alone**, not by metadata like author, timestamp, or parent commits.

## What is Change Identity?

A **change** in Atomic is a set of patch hunks that describe transformations to files. The identity of a change is determined by cryptographically hashing **only the patch content**—the actual code modifications.

```rust
Change {
    hunks: Vec<Hunk>,        // The actual code changes
    dependencies: Vec<Hash>, // What this change depends on
}

// Change hash = hash(hunks + dependencies)
// NOT hash(hunks + author + timestamp + message + parent)
```

## Git vs Atomic: A Critical Difference

### Git Commits
In Git, commit identity includes everything:

```
Git Commit Hash = hash(
    tree,           // File snapshots
    parent,         // Previous commit
    author,         // Who wrote it
    committer,      // Who committed it
    timestamp,      // When it was committed
    message,        // Commit message
)
```

**Result**: The same code change gets different hashes in different contexts.

### Atomic Changes
In Atomic, change identity includes only content:

```
Atomic Change Hash = hash(
    hunks,          // The actual code changes
    dependencies,   // What it depends on
)
```

**Result**: The same code change gets the same hash everywhere.

## Why This Matters

### 1. No Lost Work from Duplicate Fixes

**Git Problem:**
```bash
# Developer A fixes bug
git commit -m "Fix null pointer bug"  # Commit: abc123

# Developer B independently fixes same bug
git commit -m "Fix null pointer bug"  # Commit: def456

# Different hashes, Git treats as different commits
# Merge creates conflict even though patches are identical
```

**Atomic Solution:**
```bash
# Developer A fixes bug
atomic record -m "Fix null pointer bug"  # Change: XYZ789

# Developer B independently fixes same bug
atomic record -m "Fix null pointer bug"  # Change: XYZ789 (same hash!)

# Atomic detects: "This change already exists"
# No duplicate work, no conflicts
```

### 2. Change References Never Break

**Git Problem:**
```bash
# Create PR referencing commit
PR #123: "See commit abc123 for implementation"

# Someone rebases the branch
git rebase main  # Commit abc123 becomes def456

# Reference is now broken! abc123 doesn't exist anymore
```

**Atomic Solution:**
```bash
# Create discussion referencing change
Discussion: "See change XYZ789 for implementation"

# Someone updates the change
atomic unrecord XYZ789
atomic record -m "Updated implementation"  # New change: XYZ789'

# Original XYZ789 still exists in change store
# Reference still valid, can view both versions
```

### 3. Cross-Repository Deduplication

**Git Problem:**
```bash
# Repository A
git commit -m "Add feature"  # Commit: aaa111

# Repository B (fork)
git cherry-pick aaa111  # Creates new commit: bbb222

# Same code, different hashes
# No way to know they're the same change
```

**Atomic Solution:**
```bash
# Repository A
atomic record -m "Add feature"  # Change: CCC333

# Repository B (fork)
atomic pull CCC333  # Same change, same hash: CCC333

# Atomic knows these are identical
# Automatic deduplication
```

## How Change Hashing Works

### Step 1: Normalize Hunks

```rust
fn normalize_hunk(hunk: &Hunk) -> Vec<u8> {
    // Extract only the content changes
    let mut data = Vec::new();
    
    // File path
    data.extend(hunk.file_path.as_bytes());
    
    // Line numbers
    data.extend(&hunk.start_line.to_le_bytes());
    data.extend(&hunk.end_line.to_le_bytes());
    
    // Operation (add/delete/modify)
    data.push(hunk.operation as u8);
    
    // Content
    data.extend(hunk.content.as_bytes());
    
    data
}
```

### Step 2: Hash Dependencies

```rust
fn hash_change(hunks: &[Hunk], dependencies: &[Hash]) -> Hash {
    let mut hasher = Blake3::new();
    
    // Hash all hunks
    for hunk in hunks {
        let normalized = normalize_hunk(hunk);
        hasher.update(&normalized);
    }
    
    // Hash dependencies (sorted for consistency)
    let mut deps_sorted = dependencies.to_vec();
    deps_sorted.sort();
    for dep in deps_sorted {
        hasher.update(dep.as_bytes());
    }
    
    Hash::from(hasher.finalize())
}
```

### Step 3: Base32 Encoding

```rust
// Hash is 256-bit Blake3 digest
// Encoded as base32 for human readability
let hash = hash_change(&hunks, &dependencies);
let base32 = hash.to_base32();  // Example: "XYZ789ABC123DEF456..."
```

## Change Identity in Practice

### Same Change, Different Messages

```bash
# Developer A
atomic record src/fix.rs -m "Fix bug"
# Output: Change ABC123

# Developer B (independently)
atomic record src/fix.rs -m "Fixed the null pointer issue"
# Output: Change ABC123 (same hash!)

# Atomic: "This change already exists with different message"
# Uses existing change, no duplicate
```

### Same Change, Different Authors

```bash
# Alice commits change
atomic record src/feature.rs -m "New feature"
# Change: DEF456, Author: alice@example.com

# Bob makes identical change
atomic record src/feature.rs -m "New feature"
# Change: DEF456 (same hash!), Author: bob@example.com

# Atomic detects duplicate, suggests using existing change
```

### Same Change, Different Timestamps

```bash
# Create change today
atomic record src/code.rs -m "Implementation"
# Change: GHI789, Date: 2025-01-01

# Create identical change tomorrow
atomic record src/code.rs -m "Implementation"
# Change: GHI789 (same hash!), Date: 2025-01-02

# Same hash despite different dates
```

## Change Metadata vs Identity

While identity is content-only, changes still carry metadata:

```rust
pub struct ChangeHeader {
    pub hash: Hash,              // Identity (content-based)
    pub message: String,         // NOT part of identity
    pub authors: Vec<Author>,    // NOT part of identity
    pub timestamp: DateTime,     // NOT part of identity
    pub dependencies: Vec<Hash>, // Part of identity
}
```

**Key Point**: Metadata can differ, but identity stays the same.

## Benefits of Content-Based Identity

### ✅ Deduplication Across Repositories

When two repositories independently create the same fix:
- Git: Two commits, potential merge conflict
- Atomic: One change, automatic deduplication

### ✅ Stable References

Links to changes never break:
- Git: Commit hashes change with rebase
- Atomic: Change hashes are stable

### ✅ Provable Correctness

Mathematical properties:
- Same input → Same output (deterministic)
- Content equality → Identity equality (content-addressed)
- Commutative merges (order-independent)

### ✅ Cross-Team Collaboration

Teams can share changes knowing:
- Same hash = exact same code change
- Dependencies are explicit
- No hidden context required

## Comparison Table

| Aspect | Git Commits | Atomic Changes |
|--------|-------------|----------------|
| **Hash Includes** | Tree, parent, author, date, message | Hunks, dependencies only |
| **Stability** | Changes on rebase/amend | Immutable |
| **Deduplication** | Manual (requires coordination) | Automatic |
| **References** | Break on rewrite | Always valid |
| **Identity** | Context-dependent | Content-dependent |
| **Merge Detection** | By commit hash | By change hash |

## Common Questions

### Q: What if I want to update a change?

**A**: Create a new change. The old change remains in the store.

```bash
atomic unrecord ABC123  # Remove from view
atomic record src/fix.rs -m "Updated fix"  # New change: ABC124
# ABC123 still exists in change store, can be referenced
```

### Q: Can two changes have the same hash by accident?

**A**: Astronomically unlikely. Blake3 has 256-bit output space (2^256 possible hashes). Collision probability is negligible.

### Q: What if dependencies differ?

**A**: Different dependencies = different hash.

```bash
# Change A depends on X
atomic record -m "Feature" --deps X
# Hash: AAA111

# Change B depends on Y
atomic record -m "Feature" --deps Y
# Hash: BBB222 (different!)

# Even if hunks are identical, dependencies differ
```

### Q: How does this affect performance?

**A**: Positively! Content-based hashing enables:
- Automatic deduplication (saves space)
- Faster conflict detection
- Better caching strategies

### Q: Can I see the raw hash?

**A**: Yes!

```bash
atomic show ABC123 --format json
# Output:
# {
#   "hash": "ABC123DEF456...",
#   "blake3": "f8e9a7b6c5d4e3f2a1b0...",
#   "hunks": [...],
#   "dependencies": [...]
# }
```

## Advanced: Change Algebra

Change identity enables mathematical operations:

### Commutative Property

```
A + B = B + A
```

Same changes in different order produce the same result.

### Associative Property

```
(A + B) + C = A + (B + C)
```

Grouping doesn't matter.

### Identity Element

```
A + ∅ = A
```

Empty change doesn't affect result.

### Inverse Element

```
A + A⁻¹ = ∅
```

Change and its inverse cancel out.

**Why this matters**: These properties enable conflict-free merges and parallel development at scale.

## Implementation Notes

### Hash Algorithm

Atomic uses **Blake3** for change hashing:
- Fast (faster than SHA-2, competitive with SHA-1)
- Secure (cryptographically strong)
- Parallel (tree-based hashing)
- Fixed output (256 bits)

### Encoding

Hashes are encoded as **base32** for human readability:
- Case-insensitive
- No ambiguous characters (0/O, 1/l)
- URL-safe
- Shorter than hex for same information

## See Also

- [Virtual Working Copies](../proposals/virtual-working-copies.md) - How sessions use change identity
- [Git Shadow Sync](../getting-started/git-shadow-sync) - Using change identity across Atomic and Git
- [Comparison with Git](../getting-started/comparison-with-git.md) - Why change identity matters

## Summary

**Change identity** is what makes Atomic different:

- ✅ Changes identified by **content only**
- ✅ Same code = same hash everywhere
- ✅ No lost work from duplicate fixes
- ✅ References never break
- ✅ Automatic deduplication
- ✅ Mathematical correctness

This foundation enables Atomic's advanced features: commutative merges, view-based development, and AI agent collaboration at scale.

---

**Key Takeaway**: In Git, commits are snapshots in time. In Atomic, changes are timeless mathematical objects identified solely by their transformations.