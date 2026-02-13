---
sidebar_position: 1
title: Manifest Nodes - Investigating
status: investigating
---

# Manifest Nodes: Sapling-Inspired Query Optimization

**Status**: 🔍 Investigating  
**Proposed**: December 2025  
**Goal**: Address scaling challenges with many small operations by adding Manifest nodes as first-class DAG citizens

## Problem Statement

Atomic's pure patch-based model provides mathematical correctness but faces scaling challenges with frequent, small incremental changes:

1. **Query Performance**: File existence/content queries require O(changes) traversal
2. **Context Calculation**: O(contexts × edges) complexity per hunk
3. **Write Amplification**: Copy-on-write B-tree overhead (2-5×) for many small writes
4. **Transaction Commits**: Each change requires commit overhead (1-10ms)

While local database access eliminates network latency, the fundamental algorithmic complexity remains.

## Proposed Solution: Manifest Nodes

Extend Atomic's unified DAG model to include **Manifest nodes** as third-class citizens alongside Changes and Tags, inspired by Sapling's manifest system but maintaining Atomic's mathematical foundations.

### Three-Node DAG Architecture

```rust
pub enum NodeType {
    Change = 0,     // Semantic patch with hunks
    Tag = 1,        // Consolidating snapshot (dependency consolidation)
    Manifest = 2,  // File tree snapshot (query optimization)
}
```

### Manifest Node Structure

```rust
/// Manifest node: File tree snapshot for O(1) queries
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Manifest {
    /// Hash of the manifest (content-addressed)
    pub manifest_hash: Hash,
    
    /// Merkle hash representing the channel state
    pub state: Merkle,
    
    /// Channel this manifest belongs to
    pub channel: String,
    
    /// File tree snapshot: path -> file metadata
    pub file_tree: HashMap<String, FileManifestEntry>,
    
    /// Optional: Reference to tag that created this manifest
    pub created_from_tag: Option<Hash>,
    
    /// Optional: Reference to change that created this manifest
    pub created_from_change: Option<Hash>,
    
    /// Timestamp when manifest was created
    pub created_at: u64,
    
    /// AI attestation metadata (if AI generated this file tree)
    pub ai_attestation: Option<AIAttestation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FileManifestEntry {
    /// Content hash of the file
    pub file_hash: Hash,
    
    /// Inode reference in the DAG
    pub inode: Inode,
    
    /// File size in bytes
    pub size: u64,
    
    /// Whether this is a directory
    pub is_directory: bool,
    
    /// Optional: Merkle hash of directory contents
    pub directory_state: Option<Merkle>,
}
```

## Key Benefits

### 1. O(1) Query Performance

**Without manifest** (current):
```rust
// Query: "Does file X exist at state S?"
// Requires: Apply all changes up to state S, traverse DAG
// Complexity: O(changes)
```

**With manifest** (proposed):
```rust
// Query: "Does file X exist at manifest M?"
// Requires: HashMap lookup
// Complexity: O(1)
fn file_exists_at_manifest(manifest: &Manifest, file_path: &str) -> bool {
    manifest.file_tree.contains_key(file_path)
}
```

### 2. Independent Creation

Manifests can be created independently of tags:

```bash
# Create manifest from current state (not tied to tag)
atomic manifest create --from-state <merkle>

# Create manifest from tag (for production releases)
atomic manifest create --from-tag v1.0.0

# Create manifest from change (for development snapshots)
atomic manifest create --from-change <hash>
```

### 3. AI Attestation on File Trees

AI agents can attest to file tree correctness:

```rust
pub struct AIAttestation {
    // ... existing fields ...
    
    /// Node type this attestation applies to
    pub node_type: NodeType,  // Can be Change, Tag, or Manifest
    
    /// Node hash (change_hash, tag_hash, or manifest_hash)
    pub node_hash: Hash,
    
    /// For manifests: Attestation that file tree is correct
    pub manifest_attestation: Option<ManifestAttestation>,
}

pub struct ManifestAttestation {
    /// AI verified that this file tree is correct
    pub verified_file_tree: bool,
    
    /// AI verified that all files are syntactically valid
    pub verified_syntax: bool,
    
    /// AI verified that dependencies are correct
    pub verified_dependencies: bool,
}
```

### 4. DAG Integration

All three node types are first-class DAG nodes:

```rust
impl Node {
    /// Create a manifest node
    pub fn manifest(hash: Hash, state: Merkle) -> Self {
        Self {
            hash,
            node_type: NodeType::Manifest,
            state,
        }
    }
    
    /// Check if this node is a manifest
    pub fn is_manifest(&self) -> bool {
        self.node_type == NodeType::Manifest
    }
}

// All operations work on any node type
atomic apply <manifest-hash>     # Apply manifest (restore file tree)
atomic dependencies <manifest-hash>  # Get manifest dependencies
atomic log <manifest-hash>       # Show manifest in history
```

## Performance Comparison

| Operation | Without Manifest | With Manifest Node | Improvement |
|-----------|------------------|-------------------|-------------|
| **File exists query** | O(changes) | O(1) | **100-1000× faster** |
| **File content lookup** | O(changes + log n) | O(log n) | **10-100× faster** |
| **Directory listing** | O(changes + files) | O(files) | **10-100× faster** |
| **AI attestation** | Change-level only | Change + Manifest | **More granular** |
| **Manifest creation** | N/A | O(files) | **One-time cost** |

## Use Cases

### 1. Production Release Manifests

```bash
# Create tag for release
atomic tag create v1.0.0 -m "Production release"

# Create manifest for fast queries
atomic manifest create --from-tag v1.0.0 -m "v1.0.0 file tree"

# O(1) queries on production state
atomic manifest query v1.0.0 --file src/index.ts
# Returns: file exists, hash, size, inode
```

### 2. AI Agent File Tree Verification

```bash
# AI agent creates manifest and attests to correctness
atomic manifest create --ai-attest \
  --ai-provider anthropic \
  --ai-model claude-sonnet-4 \
  --verify-syntax \
  --verify-dependencies

# Manifest includes AI attestation
# Other agents can verify: "This file tree is correct"
```

### 3. Development Snapshots

```bash
# Create manifest from current state (not tied to tag)
atomic manifest create --from-state <merkle> -m "Dev snapshot"

# Fast queries during development
atomic manifest query <manifest-hash> --list-files
```

## DAG Structure Example

```
Change A [root]
  ↓
Change B [A]
  ↓
Change C [A, B]
  ↓
Tag v1.0 [A, B, C]  ← Consolidates dependencies
  ↓
Manifest M1 [Tag v1.0]  ← File tree snapshot
  ↓
Change D [Tag v1.0]  ← New change depends on tag
  ↓
Manifest M2 [Change D]  ← New manifest from change
```

**Key Insight**: Manifests can depend on:
- **Tags**: Production release manifests
- **Changes**: Development snapshots
- **Other Manifests**: Incremental updates

## Comparison with Sapling

| Aspect | Sapling Manifest | Atomic Manifest Node |
|--------|------------------|----------------------|
| **DAG Integration** | Separate from DAG | First-class DAG node |
| **Content-Addressed** | No | Yes (manifest_hash) |
| **AI Attestation** | No | Yes (built-in) |
| **Dependencies** | Per changeset | Can depend on any node |
| **Mathematical Guarantees** | None | Merkle hash verification |
| **Query Speed** | O(1) | O(1) |
| **Creation Cost** | O(files) per changeset | O(files) on-demand |

**Key Advantage**: Atomic's manifest nodes are:
1. **DAG-integrated**: First-class nodes with dependencies
2. **Content-addressed**: Same file tree = same manifest hash
3. **AI-attestable**: Can verify file tree correctness
4. **Flexible**: Can depend on changes, tags, or other manifests

## Implementation Strategy

### Phase 1: Add Manifest NodeType

```rust
// atomic-core/src/pristine/mod.rs
pub enum NodeType {
    Change = 0,
    Tag = 1,
    Manifest = 2,  // NEW
}

impl NodeType {
    pub fn from_u8(val: u8) -> Option<Self> {
        match val {
            0 => Some(NodeType::Change),
            1 => Some(NodeType::Tag),
            2 => Some(NodeType::Manifest),  // NEW
            _ => None,
        }
    }
}
```

### Phase 2: Manifest Storage

```rust
// atomic-core/src/pristine/manifest.rs
pub struct Manifest {
    // ... fields ...
}

// Store in redb database
#[table("manifests")]
pub struct ManifestTable {
    manifest_hash: Hash,
    state: Merkle,
    // ... other fields ...
}
```

### Phase 3: AI Attestation Extension

```rust
// Extend AIAttestation to support manifests
pub struct AIAttestation {
    node_type: NodeType,  // Change, Tag, or Manifest
    node_hash: Hash,
    // ... existing fields ...
    manifest_attestation: Option<ManifestAttestation>,
}
```

### Phase 4: CLI Commands

```bash
# Create manifest
atomic manifest create [--from-tag <tag>] [--from-change <hash>] [--from-state <merkle>]

# Query manifest
atomic manifest query <manifest-hash> [--file <path>] [--list-files] [--directory <path>]

# List manifests
atomic manifest list [--channel <channel>]

# Apply manifest (restore file tree)
atomic manifest apply <manifest-hash>
```

## Trade-offs

### Benefits

1. **O(1) Query Performance**: File existence/content queries become instant
2. **AI Attestation**: Verify file tree correctness at manifest level
3. **DAG Integration**: First-class nodes maintain mathematical guarantees
4. **Flexibility**: Independent of tags, can be created on-demand
5. **Content-Addressed**: Same file tree = same manifest hash (deduplication)

### Costs

1. **Storage Overhead**: Each manifest stores full file tree (O(files) space)
2. **Creation Cost**: Generating manifest requires O(files) traversal
3. **Maintenance**: Manifests must be kept in sync with channel state
4. **Complexity**: Additional node type increases system complexity

### Mitigation Strategies

1. **Optional Manifests**: Only create when needed (production releases, AI verification)
2. **Lazy Generation**: Generate manifests on-demand, not per change
3. **Incremental Updates**: Update manifests incrementally when possible
4. **Content-Addressed Deduplication**: Same file tree = same manifest (automatic deduplication)

## Research Questions

1. **When to create manifests?**
   - On-demand vs. automatic?
   - Per tag vs. per change?
   - Production releases only?

2. **Storage strategy?**
   - Store full file tree in database?
   - Store references to DAG vertices?
   - Hybrid approach?

3. **Update frequency?**
   - Recreate on every change?
   - Incremental updates?
   - On-demand only?

4. **Query optimization?**
   - Cache frequently accessed manifests?
   - Index file paths for faster lookup?
   - Lazy loading of manifest data?

## Next Steps

1. **Prototype**: Implement basic Manifest node type in `atomic-core`
2. **Benchmark**: Measure query performance improvement
3. **Evaluate**: Assess storage overhead vs. performance gain
4. **Design**: Finalize manifest creation/update strategy
5. **Implement**: Full integration with DAG and AI attestation

## References

- [Sapling SCM](https://github.com/facebook/sapling) - Facebook's scalable VCS with manifest system
- [Hunks: Edit and Replacement Calculations](../concepts/hunks-edit-replacement.md) - Mathematical foundations
- [Hunks: Edit and Replacement Calculations](../concepts/hunks-edit-replacement.md) - Mathematical foundations of Atomic's patch model

