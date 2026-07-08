---
sidebar_position: 6
title: tag
---

# atomic tag

Create, manage, and restore consolidating tags that reduce dependency complexity.

## Synopsis

```bash
atomic tag [OPTIONS]
atomic tag create [OPTIONS] [TAG_NAME]
atomic tag list [OPTIONS]
atomic tag checkout <TAG> [OPTIONS]
atomic tag reset <TAG> [OPTIONS]
atomic tag delete <TAG> [OPTIONS]
```

## Description

Tags in Atomic are **consolidating boundaries** that dramatically reduce dependency complexity while maintaining full semantic accuracy. Unlike traditional version control tags that are simply named pointers to commits, Atomic tags are first-class nodes in the dependency graph with mathematical properties.

### Why Tags Are Revolutionary

In traditional patch-based systems, dependencies grow quadratically (O(n²)) because each change can depend on any previous change. With 100 changes, you could have 5,050 dependencies. Atomic's consolidating tags reduce this to linear growth (O(n)):

- **Without tags**: 100 changes = ~5,050 dependencies
- **With tags**: 100 changes = ~200 dependencies
- **Reduction**: 96% fewer dependencies

### How Tags Work

When you create a tag, Atomic:

1. Captures the current view state as a Merkle tree hash
2. Creates a tag file consolidating all dependencies up to that point
3. Adds the tag as a node in the dependency graph
4. Future changes depend on the tag, not individual changes

This means:
- Changes after a tag only depend on the tag, not all prior changes
- Tags can be pushed/pulled independently
- Repository state is cryptographically verifiable
- Dependency graphs remain manageable at scale

## Subcommands

### `tag create` - Create a Consolidating Tag

Create a new tag that consolidates dependencies.

#### Synopsis

```bash
atomic tag create [OPTIONS] [TAG_NAME]
```

#### Options

**`-m, --message <MESSAGE>`**

Set the tag message describing this release or milestone.

```bash
atomic tag create v1.0.0 -m "First stable release"
```

**`--author <AUTHOR>`**

Override the default author for this tag.

```bash
atomic tag create v1.0.0 --author "Release Team <team@example.com>"
```

**`--view <VIEW>`**

Tag a specific view instead of the current view.

```bash
atomic tag create v1.0.0 --view main
```

**`--timestamp <TIMESTAMP>`**

Set a custom timestamp (RFC 2822 format).

```bash
atomic tag create v1.0.0 --timestamp "Wed, 15 Jan 2025 12:00:00 +0000"
```

**`--since <TAG>`**

Consolidate from a previous tag instead of from the beginning. Enables flexible consolidation strategies for production hotfix workflows.

```bash
# Create v1.0.1 consolidating only changes since v1.0.0
atomic tag create v1.0.1 --since v1.0.0 -m "Hotfix release"
```

**`--version <VERSION>`**

Specify semantic version (e.g., "1.0.0", "2.1.3"). Alternative to providing version as tag name.

```bash
atomic tag create --version 1.0.0 -m "First release"
```

**`--major`**

Automatically increment the major version from the last tag (X.0.0).

```bash
atomic tag create --major -m "Breaking changes"
# If last tag was v1.2.3, creates v2.0.0
```

**`--minor`**

Automatically increment the minor version (x.Y.0).

```bash
atomic tag create --minor -m "New features"
# If last tag was v1.2.3, creates v1.3.0
```

**`--patch`**

Automatically increment the patch version (x.y.Z).

```bash
atomic tag create --patch -m "Bug fixes"
# If last tag was v1.2.3, creates v1.2.4
```

#### Examples

```bash
# Basic tag creation
atomic tag create v1.0.0 -m "First stable release"

# Tag with semantic versioning
atomic tag create --version 2.0.0 -m "Major release with breaking changes"

# Auto-increment patch version
atomic tag create --patch -m "Security fixes"

# Incremental consolidation for hotfixes
atomic tag create v1.0.1 --since v1.0.0 -m "Critical bugfix"

# Tag a specific view
atomic tag create release-1.0 --view release -m "Production release"
```

### `tag list` - List Tags

Display all tags in a view.

#### Synopsis

```bash
atomic tag list [OPTIONS]
```

#### Options

**`--view <VIEW>`**

List tags from a specific view.

```bash
atomic tag list --view main
```

**`--attribution`**

Show attribution summaries for changes consolidated by each tag.

```bash
atomic tag list --attribution
```

#### Examples

```bash
# List tags in current view
atomic tag list

# List tags in main view
atomic tag list --view main

# List with attribution info
atomic tag list --attribution
```

#### Output Format

```
v1.0.0  XYZABC123...  2025-01-15  First stable release
v0.9.0  ABCDEF456...  2025-01-10  Beta release
v0.1.0  MNOPQR789...  2025-01-01  Initial alpha
```

### `tag checkout` - Restore Tag to New View

Restore a tag's state into a new view, useful for creating release branches or investigating historical states.

#### Synopsis

```bash
atomic tag checkout <TAG> [OPTIONS]
```

#### Arguments

**`<TAG>`**

The tag name or state hash to checkout.

#### Options

**`--to-view <VIEW>`**

Name for the new view. If not specified, uses the tag's state hash as the view name.

```bash
atomic tag checkout v1.0.0 --to-view release-1.0
```

#### Examples

```bash
# Checkout tag to new view
atomic tag checkout v1.0.0 --to-view hotfix-branch

# Checkout using state hash
atomic tag checkout XYZABC123... --to-view investigation

# Checkout with auto-generated view name
atomic tag checkout v1.0.0
```

### `tag reset` - Reset Working Copy to Tag

Reset the working copy to match a tag's state.

#### Synopsis

```bash
atomic tag reset <TAG> [OPTIONS]
```

#### Arguments

**`<TAG>`**

The tag name or state hash to reset to.

#### Examples

```bash
# Reset to v1.0.0
atomic tag reset v1.0.0

# Reset using state hash
atomic tag reset XYZABC123...
```

**Warning**: This will discard uncommitted changes in your working copy.

### `tag delete` - Delete a Tag

Remove a tag from a view. If the tag isn't referenced in any other view, the tag file is also deleted.

#### Synopsis

```bash
atomic tag delete <TAG> [OPTIONS]
```

#### Arguments

**`<TAG>`**

The tag name or state hash to delete.

#### Options

**`--view <VIEW>`**

Delete the tag from a specific view instead of the current view.

```bash
atomic tag delete v0.9.0-beta --view develop
```

#### Examples

```bash
# Delete tag from current view
atomic tag delete v0.9.0-beta

# Delete from specific view
atomic tag delete v1.0.0-rc --view release
```

## Complete Examples

### Basic Tagging Workflow

```bash
# Create repository and make changes
atomic init myproject
cd myproject
atomic add .
atomic record -m "Initial implementation"
atomic record -m "Add features"
atomic record -m "Fix bugs"

# Create first stable tag
atomic tag create v1.0.0 -m "First stable release"

# Continue development
atomic record -m "Add new feature"
atomic record -m "Refactor code"

# Create minor release
atomic tag create --minor -m "Feature release"
# Creates v1.1.0
```

### Production Hotfix Workflow

```bash
# Main branch with v1.0.0 tag
atomic tag list
# v1.0.0  XYZABC...  2025-01-15  Production release

# Development continues on main
atomic record -m "Add feature X"
atomic record -m "Add feature Y"

# Critical bug found in production (v1.0.0)
# Checkout v1.0.0 to hotfix view
atomic tag checkout v1.0.0 --to-view hotfix-1.0.1

# Switch to hotfix view and fix bug
atomic view switch hotfix-1.0.1
atomic record -m "Fix critical security bug"

# Create incremental hotfix tag
atomic tag create v1.0.1 --since v1.0.0 -m "Security hotfix"

# Now you can push v1.0.1 to production
# and also merge the fix back to main
atomic view switch main
atomic pull . --from-view hotfix-1.0.1
```

### Multi-Version Support

```bash
# Maintain multiple release branches
atomic tag checkout v1.0.0 --to-view support-1.x
atomic tag checkout v2.0.0 --to-view support-2.x
atomic tag checkout v3.0.0 --to-view support-3.x

# Apply fix to v2.x branch
atomic view switch support-2.x
atomic record -m "Backport security fix"
atomic tag create v2.0.5 --since v2.0.4 -m "Security update"

# Apply same fix to other branches as needed
```

### Semantic Versioning

```bash
# Automatic version incrementing
atomic tag create v1.0.0 -m "Initial release"

# Bug fixes (patch)
atomic record -m "Fix bug"
atomic tag create --patch -m "Bug fixes"
# Creates v1.0.1

# New features (minor)
atomic record -m "Add feature"
atomic tag create --minor -m "New features"
# Creates v1.1.0

# Breaking changes (major)
atomic record -m "Refactor API"
atomic tag create --major -m "Breaking changes"
# Creates v2.0.0
```

## Tag File Structure

Tags are stored in `.atomic/tags/` with filenames based on the state hash:

```
.atomic/tags/
├── XY/
│   └── ZABC123456...tag
└── MN/
    └── OPQR789012...tag
```

Each tag file contains:
- **Header**: Author, timestamp, message, version
- **State Hash**: Merkle tree hash of the consolidated state
- **Attribution Summary**: Aggregated AI contribution statistics
- **Consolidated Dependencies**: Minimal set of required changes

## Tag State Identifiers

Tags are identified by Merkle tree hashes (state identifiers) that cryptographically represent the complete repository state. These are Base32-encoded, 53-character strings:

```
XYZABC123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABC
```

State identifiers enable:
- **Cryptographic Verification**: Tamper-evident repository integrity
- **Content Addressing**: Tags are identified by their content
- **Efficient Comparison**: Quickly determine if two repositories are in the same state
- **Distributed Consensus**: Multiple repositories can independently verify state

## Dependency Reduction Mathematics

### Without Tags

Each change can depend on any previous change:

```
Change 1: []
Change 2: [1]
Change 3: [1, 2]
Change 4: [1, 2, 3]
...
Change 100: [1, 2, 3, ..., 99]
```

Total dependencies: 1 + 2 + 3 + ... + 99 = **4,950 dependencies**

### With Tags (Every 10 Changes)

```
Changes 1-10: Normal dependencies
Tag T1: Consolidates changes 1-10
Changes 11-20: Depend on T1, not changes 1-10
Tag T2: Consolidates changes 11-20 (depends on T1)
Changes 21-30: Depend on T2, not changes 1-20
...
```

Total dependencies: ~**200 dependencies** (96% reduction)

## Best Practices

### When to Create Tags

- **Major Releases**: Create tags for production releases
- **Milestones**: Tag significant development milestones
- **Stable Points**: Tag after successful testing
- **Before Large Changes**: Create safety points
- **Regular Intervals**: Tag every N changes to maintain O(n) growth

### Tagging Strategy

```bash
# For small projects: Tag periodically
# Every 50-100 changes
atomic tag create --minor -m "Development checkpoint"

# For large projects: Tag more frequently
# Every 20-30 changes
atomic tag create --patch -m "Incremental consolidation"

# For production: Use semantic versioning
atomic tag create v1.2.3 -m "Production release"
```

### Naming Conventions

- **Semantic Versioning**: `v1.2.3`, `v2.0.0-beta`
- **Date-Based**: `2025-01-15`, `release-2025-Q1`
- **Descriptive**: `stable`, `production`, `rc1`
- **Milestones**: `alpha`, `beta`, `1.0-rc1`

## Performance Impact

Tags improve performance across operations:

- **Clone Time**: Reduced by downloading consolidated dependencies
- **Merge Time**: Fewer dependencies to resolve
- **Memory Usage**: Smaller in-memory graphs
- **Database Size**: More efficient storage

Example: Repository with 1,000 changes
- Without tags: ~500,000 dependencies, 10s merge time
- With 10 tags: ~10,000 dependencies, less than 1s merge time

## Notes

- **Immutable**: Tags are immutable once created
- **Cryptographically Signed**: Can be signed with identity keys
- **Pushable**: Tags can be pushed/pulled independently
- **View-Specific**: Tags are per-view but can be shared
- **First-Class Nodes**: Tags are graph nodes, not just metadata
- **Mathematical Guarantees**: Consolidation maintains semantic equivalence

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml

[tags]
# Default semantic version increment
default_increment = "patch"  # "major", "minor", or "patch"

# Auto-tag every N changes
auto_tag_interval = 50

# Tag naming pattern
name_pattern = "v{version}"
```

## See Also

- [`atomic record`](./record.md) - Record changes
- [`atomic log`](./log.md) - View history including tags
- [`atomic push`](./push.md) - Push tags to remotes
- [`atomic pull`](./pull.md) - Pull tags from remotes
- [`atomic view`](./view.md) - Manage views

## Related Concepts

- **Consolidation** - Reducing dependency complexity while maintaining semantics
- **State Hash** - Merkle tree cryptographic identifier
- **Dependency Graph** - DAG of changes and tags
- **Semantic Versioning** - Version numbering scheme
- **O(n) Complexity** - Linear growth instead of quadratic