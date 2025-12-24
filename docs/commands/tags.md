---
sidebar_position: 6
---

# Tags

Tags in Atomic are **consolidating boundaries** that dramatically reduce dependency complexity while maintaining mathematical correctness. Unlike traditional VCS tags that simply mark points in history, Atomic tags are first-class nodes in the dependency graph with transformative performance properties.

## What Are Atomic Tags?

An Atomic tag is a **consolidation point** that:

1. Captures the complete stack state as a cryptographic hash (Merkle tree)
2. Consolidates all dependencies up to that point into a single node
3. Allows future changes to depend on the tag instead of individual prior changes
4. Reduces dependency graph complexity from O(n²) to O(n)

### The Dependency Problem

In traditional patch-based systems, dependencies grow quadratically because each change can depend on any previous change:

```
Without Tags (100 changes):
Change 1: []
Change 2: [1]
Change 3: [1, 2]
Change 4: [1, 2, 3]
...
Change 100: [1, 2, 3, ..., 99]

Total dependencies: 1 + 2 + 3 + ... + 99 = ~5,000 dependencies
```

### The Tag Solution

With consolidating tags, dependencies remain linear:

```
With Tags (100 changes, tagged every 10):
Changes 1-10: Normal dependencies (~45)
Tag T1: Consolidates changes 1-10
Changes 11-20: Depend on T1, not changes 1-10 (~45)
Tag T2: Consolidates changes 11-20, depends on T1
Changes 21-30: Depend on T2, not changes 1-20 (~45)
...

Total dependencies: ~200 dependencies (96% reduction!)
```

## Why Tags Matter

### Performance Benefits

- **Clone Speed**: Transfer consolidated dependencies instead of thousands of individual ones
- **Merge Performance**: Resolve dependencies against tags, not all prior changes
- **Memory Usage**: Store minimal dependency graphs in memory
- **Database Size**: More efficient storage of repository state

### Real-World Impact

| Repository Size | Without Tags | With Tags (every 50 changes) | Improvement |
|----------------|--------------|------------------------------|-------------|
| 100 changes | ~5,000 deps | ~200 deps | 96% reduction |
| 1,000 changes | ~500,000 deps | ~10,000 deps | 98% reduction |
| 10,000 changes | ~50M deps | ~200,000 deps | 99.6% reduction |

### Scalability

Tags enable Atomic to scale to repositories with:
- Thousands of changes
- Hundreds of contributors
- Years of history
- Millions of dependencies (reduced to thousands)

## How Tags Work

### Tag Creation

When you create a tag:

```bash
atomic tag create v1.0.0 -m "First stable release"
```

Atomic:
1. Calculates the Merkle tree hash of the current stack state
2. Creates a tag file consolidating all dependencies
3. Stores the tag in `.atomic/tags/` with content-addressed filename
4. Registers the tag in the stack's dependency graph

### Tag Structure

Each tag contains:

- **State Hash**: Cryptographic identifier (Base32, 53 characters)
- **Metadata**: Author, timestamp, message, version
- **Consolidated Dependencies**: Minimal set of required changes
- **Attribution Summary**: Aggregated AI contribution statistics (if enabled)

### Cryptographic Properties

Tags are:
- **Content-Addressed**: Filename is derived from state hash
- **Tamper-Evident**: Any change to history invalidates the tag
- **Verifiable**: Multiple repositories can independently verify state
- **Immutable**: Once created, tags cannot be modified

## Tag Use Cases

### 1. Release Management

```bash
# Development cycle
atomic record -m "Add feature A"
atomic record -m "Add feature B"
atomic record -m "Fix bugs"

# Create release tag
atomic tag create v1.0.0 -m "First production release"

# Continue development
atomic record -m "Add feature C"
atomic tag create v1.1.0 -m "Feature release"
```

### 2. Production Hotfixes

```bash
# Critical bug found in v1.0.0
atomic tag checkout v1.0.0 --to-stack hotfix-1.0.1

# Fix the bug
atomic stack switch hotfix-1.0.1
atomic record -m "Fix critical security bug"

# Create incremental hotfix tag
atomic tag create v1.0.1 --since v1.0.0 -m "Security hotfix"

# Deploy v1.0.1 to production
atomic push production --from-stack hotfix-1.0.1
```

### 3. Dependency Reduction

```bash
# Large project with 500 changes
atomic log --count
# Output: 500 changes, ~125,000 dependencies

# Create consolidation tags
atomic tag create checkpoint-1 -m "First consolidation"

# Continue development
# ... 500 more changes ...

atomic tag create checkpoint-2 -m "Second consolidation"

# Now: ~1,000 changes, but only ~2,000 dependencies (98% reduction)
```

### 4. Multi-Version Support

```bash
# Support multiple major versions
atomic tag checkout v1.0.0 --to-stack support-1.x
atomic tag checkout v2.0.0 --to-stack support-2.x
atomic tag checkout v3.0.0 --to-stack main

# Apply fixes to each version independently
atomic stack switch support-1.x
atomic record -m "Backport security fix to v1.x"
atomic tag create v1.2.5 --since v1.2.4 -m "Security update"
```

### 5. Long-Lived Projects

```bash
# Maintain O(n) complexity in large projects
# Tag every 50-100 changes

atomic tag create --patch -m "Regular consolidation point"

# This keeps merge times fast even with thousands of changes
```

## Tag Operations

### Creating Tags

```bash
# Basic tag with message
atomic tag create v1.0.0 -m "Release message"

# Semantic versioning - auto-increment
atomic tag create --patch -m "Bug fixes"        # v1.0.0 -> v1.0.1
atomic tag create --minor -m "New features"     # v1.0.1 -> v1.1.0
atomic tag create --major -m "Breaking changes" # v1.1.0 -> v2.0.0

# Incremental consolidation from previous tag
atomic tag create v1.0.1 --since v1.0.0 -m "Hotfix"

# Tag specific stack
atomic tag create release-1.0 --stack main -m "Production release"
```

### Listing Tags

```bash
# List all tags in current stack
atomic tag list

# List tags in specific stack
atomic tag list --stack main

# Show attribution data
atomic tag list --attribution
```

### Checking Out Tags

```bash
# Restore tag state to new stack
atomic tag checkout v1.0.0 --to-stack investigation

# Create hotfix branch from production tag
atomic tag checkout v1.0.0 --to-stack hotfix-1.0.1
```

### Resetting to Tags

```bash
# Reset working copy to tag state
atomic tag reset v1.0.0

# Warning: Discards unrecorded changes
```

### Deleting Tags

```bash
# Delete tag from current stack
atomic tag delete v0.9.0-beta

# Delete from specific stack
atomic tag delete old-tag --stack experimental
```

## Tag Naming Conventions

### Semantic Versioning

Follow [semver](https://semver.org/) for releases:

```bash
atomic tag create v1.0.0 -m "Initial stable release"
atomic tag create v1.0.1 -m "Patch: Bug fixes"
atomic tag create v1.1.0 -m "Minor: New features, backward compatible"
atomic tag create v2.0.0 -m "Major: Breaking changes"
```

### Pre-Release Tags

```bash
atomic tag create v1.0.0-alpha -m "Alpha testing"
atomic tag create v1.0.0-beta -m "Beta release"
atomic tag create v1.0.0-rc1 -m "Release candidate 1"
atomic tag create v1.0.0 -m "Final release"
```

### Date-Based Tags

```bash
atomic tag create 2025-01-15 -m "Daily build"
atomic tag create 2025-Q1 -m "Quarterly release"
```

### Milestone Tags

```bash
atomic tag create milestone-1 -m "Project phase 1 complete"
atomic tag create checkpoint-100 -m "100 changes consolidated"
```

## Tagging Strategy

### Small Projects (< 1,000 changes)

```bash
# Tag every 50-100 changes or at major milestones
atomic tag create --minor -m "Development checkpoint"
```

### Large Projects (> 1,000 changes)

```bash
# Tag every 20-50 changes to maintain performance
atomic tag create --patch -m "Regular consolidation"
```

### Production Projects

```bash
# Tag all releases
atomic tag create v1.0.0 -m "Production release"

# Tag release candidates
atomic tag create v1.1.0-rc1 -m "Release candidate for testing"

# Tag hotfixes
atomic tag create v1.0.1 --since v1.0.0 -m "Critical security fix"
```

### Development Projects

```bash
# Tag at logical boundaries
atomic tag create feature-complete -m "Feature X implementation complete"
atomic tag create refactor-done -m "Codebase refactoring complete"
```

## Best Practices

### 1. Tag Regularly

Maintain O(n) complexity by tagging at regular intervals:

```bash
# Every 50 changes for optimal performance
atomic log --count
# If count > 50 since last tag
atomic tag create --patch -m "Consolidation checkpoint"
```

### 2. Use Semantic Versioning

Make version numbers meaningful:

```bash
# Breaking changes
atomic tag create --major -m "API v2 with breaking changes"

# New features
atomic tag create --minor -m "Added user authentication"

# Bug fixes
atomic tag create --patch -m "Fixed memory leak"
```

### 3. Write Descriptive Messages

Tag messages should explain the significance:

```bash
# Good
atomic tag create v1.0.0 -m "First production release - stable API, full test coverage"

# Less helpful
atomic tag create v1.0.0 -m "release"
```

### 4. Use Incremental Tags for Hotfixes

When fixing bugs in old releases:

```bash
# Create incremental tag from previous release
atomic tag create v1.0.1 --since v1.0.0 -m "Security fix for CVE-2025-1234"
```

### 5. Tag Before Major Changes

Create safety points before risky operations:

```bash
# Tag before major refactoring
atomic tag create pre-refactor -m "Stable state before API refactor"

# Do refactoring
atomic record -m "Refactor API"

# If successful, tag again
atomic tag create post-refactor -m "API refactor complete"
```

## Tag Distribution

### Pushing Tags

```bash
# Push changes and tags together
atomic push origin

# Tags are automatically included with changes
# No separate --tags flag needed
```

### Pulling Tags

```bash
# Pull changes and tags together
atomic pull origin

# Tags are automatically downloaded with changes
```

### Tag Files

Tags are stored in `.atomic/tags/` with content-addressed filenames:

```
.atomic/tags/
├── AB/
│   └── CDEF123456789...tag
├── XY/
│   └── Z123456789ABC...tag
└── MN/
    └── OPQR987654321...tag
```

## Performance Characteristics

### Time Complexity

| Operation | Without Tags | With Tags | Improvement |
|-----------|--------------|-----------|-------------|
| Clone | O(n²) | O(n) | Dramatic |
| Merge | O(n²) | O(n) | Dramatic |
| Log | O(n) | O(n) | Unchanged |
| Diff | O(n) | O(n) | Unchanged |

### Space Complexity

| Metric | Without Tags | With Tags |
|--------|--------------|-----------|
| Dependency storage | O(n²) | O(n) |
| Tag overhead | 0 | O(tags) |
| Net savings | - | 95-99% |

## Mathematical Properties

### Consolidation Guarantees

Tags maintain **semantic equivalence**:

```
State(before_tag) ≡ State(after_tag)
```

This means:
- Working copy is identical
- File contents are identical
- Dependency semantics are preserved
- Only the dependency *representation* changes

### Cryptographic Verification

State hashes enable:

```bash
# Two repositories in same state have same hash
repo1$ atomic tag create test -m "Test"
# State: XYZABC123...

repo2$ atomic tag create test -m "Test"
# State: XYZABC123...

# Identical hashes prove identical state
```

## Troubleshooting

### Tag Not Found

```bash
# List available tags
atomic tag list

# Check specific stack
atomic tag list --stack main
```

### Can't Delete Tag

```bash
# Tag might be referenced by other stacks
# Check all stacks first
atomic stack list

# Force delete from current stack only
atomic tag delete <tag>
```

### State Mismatch

If tag state doesn't match expected:

```bash
# Verify stack state
atomic log --stack main

# Check tag details
atomic tag list

# Reset to known good state
atomic tag reset <known-good-tag>
```

## Command Reference

For detailed information about the tag command:

- [**`atomic tag`**](./tag.md) - Complete tag command reference

## See Also

- [Working with Changes](./working-with-changes.md) - Recording changes that get consolidated
- [Stacks](./stacks.md) - Managing development lines with tags
- [Remote Operations](./remote-operations.md) - Distributing tags across repositories
- [Repository Management](./repository-management.md) - Setting up repositories with tagging strategy

---

**Next Steps:**
- Learn the [tag command](./tag.md) for detailed usage
- Create tags regularly (every 50-100 changes) to maintain O(n) complexity
- Use semantic versioning for releases with `--major`, `--minor`, and `--patch` flags