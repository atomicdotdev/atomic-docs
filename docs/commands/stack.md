---
sidebar_position: 10
title: stack
---

# atomic stack

Manage stacks (independent lines of development).

## Synopsis

```bash
atomic stack [OPTIONS]
atomic stack new <NAME>
atomic stack switch <NAME>
atomic stack list
atomic stack delete <NAME>
atomic stack rename <OLD> <NEW>
```

## Description

Stacks in Atomic are independent lines of development, similar to branches in other version control systems. However, stacks have important differences:

- **Patch-based**: Stacks share a common dependency graph of changes
- **Conflict-free merging**: Changes can be applied between stacks without merge conflicts
- **First-class citizens**: Stacks are fundamental to Atomic's architecture
- **Independent history**: Each stack maintains its own sequence of changes

When working with stacks, you can:
- Create new stacks for features or experiments
- Switch between stacks to work on different tasks
- Apply changes between stacks
- Delete stacks when work is complete

## Subcommands

### `stack new` - Create a New Stack

Create a new stack branching from the current stack's state.

#### Synopsis

```bash
atomic stack new <NAME>
```

#### Arguments

**`<NAME>`**

Name for the new stack. Should be descriptive (e.g., `feature/auth`, `bugfix/issue-123`).

#### Examples

```bash
# Create a feature stack
atomic stack new feature/user-auth

# Create a bugfix stack
atomic stack new bugfix/security-fix

# Create an experimental stack
atomic stack new experiment/new-algorithm
```

### `stack switch` - Switch to a Different Stack

Switch your working copy to a different stack.

#### Synopsis

```bash
atomic stack switch <NAME>
```

#### Arguments

**`<NAME>`**

Name of the stack to switch to. Must be an existing stack.

#### Examples

```bash
# Switch to main stack
atomic stack switch main

# Switch to feature branch
atomic stack switch feature/user-auth

# Switch back to previous work
atomic stack switch bugfix/issue-123
```

### `stack list` - List All Stacks

Display all stacks in the repository.

#### Synopsis

```bash
atomic stack list [OPTIONS]
```

#### Options

**`--current`**

Show only the current stack.

```bash
atomic stack list --current
```

#### Examples

```bash
# List all stacks
atomic stack list

# Show current stack
atomic stack list --current
```

#### Output

```
* main
  feature/user-auth
  feature/new-ui
  bugfix/issue-123
```

The `*` indicates the current stack.

### `stack delete` - Delete a Stack

Remove a stack from the repository.

#### Synopsis

```bash
atomic stack delete <NAME>
```

#### Arguments

**`<NAME>`**

Name of the stack to delete. Cannot delete the current stack.

#### Examples

```bash
# Delete a merged feature stack
atomic stack delete feature/completed

# Delete an experimental stack
atomic stack delete experiment/failed-approach
```

**Warning**: This permanently removes the stack. The changes remain in the repository but the stack reference is deleted.

### `stack rename` - Rename a Stack

Rename an existing stack.

#### Synopsis

```bash
atomic stack rename <OLD> <NEW>
```

#### Arguments

**`<OLD>`**

Current name of the stack.

**`<NEW>`**

New name for the stack.

#### Examples

```bash
# Rename a stack
atomic stack rename feature/old-name feature/new-name

# Rename main to master (or vice versa)
atomic stack rename main master
```

## Options

### `--repository <PATH>`

Specify the repository path.

```bash
atomic stack list --repository /path/to/repo
```

## Stack Cascade: Push Changes to Children (Future Feature)

**The Killer Feature:** Atomic will support cascading changes from a parent stack to all child stacks automatically - something impossible in Git-based workflows.

```bash
# Security patch on main
atomic stack switch main
atomic record security.patch -m "Fix CVE-2024-1234"

# Push to ALL child stacks automatically
atomic stack cascade

# Output:
#   Applying DWHTQ6K to child stacks...
#   ✓ feature-auth (3 changes, no conflicts)
#   ✓ api-redesign (5 changes, no conflicts)
#   ⚠ frontend-refactor (2 changes, conflict in ui.jsx)
#   ✓ db-backend (1 change, no conflicts)
#   
#   3/4 stacks updated successfully
#   1 stack requires manual resolution
```

### Use Cases

**Security Patches**: Push critical fixes to all feature stacks instantly
```bash
atomic stack switch main
atomic record -m "Security fix"
atomic stack cascade  # All teams get it immediately
```

**Monorepo Infrastructure Updates**: Propagate shared config changes
```bash
atomic stack switch infrastructure
atomic record build.config -m "Update to Node 20"
atomic stack cascade  # All projects updated
```

**Selective Propagation**: Choose which stacks to update
```bash
atomic stack cascade --to feature-auth --to feature-payments
atomic stack cascade --interactive  # Menu-driven selection
```

### Why This is Revolutionary

**Git/GitHub**: No equivalent - must manually checkout each branch, merge/rebase, resolve conflicts, push

**Graphite**: Has "restack" but only for linear stacks with complex rebasing

**Atomic**: 
- ✅ Native cascade from parent to all children
- ✅ Works with tree of stacks (not just linear)
- ✅ Semantic merge (fewer conflicts)
- ✅ Forward-only (no rebasing)
- ✅ Perfect for monorepos

### Planned Command Options

```bash
atomic stack cascade [OPTIONS]

--dry-run              # Show what would be applied
--to <stack>           # Only cascade to specific stack
--to-all               # Cascade to all descendant stacks (default)
--interactive          # Choose which stacks to update
--auto-resolve         # Auto-resolve simple conflicts
--stop-on-conflict     # Stop at first conflict (vs continue)
```

## Complete Examples

### Feature Branch Workflow

```bash
# Start from main
atomic stack switch main

# Create feature branch
atomic stack new feature/add-logging

# Work on feature
atomic add src/logging.rs
atomic record -m "Add logging module"
atomic record -m "Add log configuration"

# Switch back to main
atomic stack switch main

# Apply changes from feature branch
atomic pull . --from-stack feature/add-logging

# Clean up
atomic stack delete feature/add-logging
```

### Parallel Development

```bash
# Create multiple feature stacks
atomic stack new feature/api-v2
atomic stack new feature/new-ui
atomic stack new bugfix/memory-leak

# Work on each independently
atomic stack switch feature/api-v2
atomic record -m "Start API v2"

atomic stack switch feature/new-ui
atomic record -m "Design new UI"

atomic stack switch bugfix/memory-leak
atomic record -m "Fix memory leak"

# List all work in progress
atomic stack list
```

### Release Branch Strategy

```bash
# Create release branch from main
atomic stack switch main
atomic stack new release/v1.0

# Apply only necessary changes
atomic apply CHANGE1...
atomic apply CHANGE2...

# Tag the release
atomic tag create v1.0.0 -m "Release 1.0"

# Keep release branch for maintenance
atomic stack switch main
```

## Stack Properties

Each stack maintains:

- **Change sequence**: Ordered list of applied changes
- **State hash**: Cryptographic identifier of current state
- **Tag references**: Tags created in this stack
- **Configuration**: Stack-specific settings

## Default Stack

When you initialize a repository, a default stack is created (usually "main"):

```bash
atomic init
# Creates "main" stack by default

# Or specify custom name
atomic init --stack develop
```

## Current Stack

The current stack determines:
- Which changes are visible in the working copy
- Where new changes are recorded
- Which history `atomic log` displays

Check the current stack:

```bash
atomic stack list --current
# or
atomic stack
```

## Switching Stacks

When you switch stacks:

1. Working copy is updated to match the stack's state
2. Uncommitted changes must be recorded or discarded first
3. The new stack becomes current
4. `.atomic/config.toml` is updated

```bash
# This will fail if you have uncommitted changes
atomic stack switch other-branch
# Error: uncommitted changes

# Record or discard changes first
atomic record -m "Work in progress"
# or
atomic reset

# Now switch succeeds
atomic stack switch other-branch
```

## Sharing Changes Between Stacks

Apply changes from one stack to another:

```bash
# Switch to target stack
atomic stack switch main

# Pull changes from feature stack
atomic pull . --from-stack feature/new-feature

# Or apply specific changes
atomic apply HASH1... HASH2...
```

## Stack Naming Conventions

Good stack naming practices:

- **Feature branches**: `feature/description` or `feature/issue-number`
- **Bug fixes**: `bugfix/description` or `fix/issue-number`
- **Releases**: `release/version` or `release/v1.0`
- **Experiments**: `experiment/description`
- **Personal work**: `user/feature` or `yourname/work`

Examples:
```bash
atomic stack new feature/user-authentication
atomic stack new bugfix/issue-456
atomic stack new release/v2.0
atomic stack new experiment/new-algorithm
atomic stack new alice/refactoring
```

## Performance

Stack operations are fast:

- **Create**: &lt; 10ms (just metadata)
- **Switch**: 100ms - 5s (depending on working copy size)
- **List**: &lt; 10ms
- **Delete**: &lt; 10ms

## Notes

- **No Merge Commits**: Stacks don't create merge commits when sharing changes
- **Conflict-Free**: Atomic's patch theory ensures conflict-free merging
- **Independent**: Stacks are independent; deleting one doesn't affect others
- **Remote Sync**: Stacks can be pushed/pulled to/from remotes
- **Case Sensitive**: Stack names are case-sensitive

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml

# Default stack
[repository]
default_stack = "main"

# Stack-specific settings
[stack.main]
protected = true  # Prevent accidental deletion

[stack.develop]
auto_tag = true  # Auto-tag periodically
```

## See Also

- [`atomic record`](./record.md) - Record changes in current stack
- [`atomic log`](./log.md) - View stack history
- [`atomic pull`](./pull.md) - Pull changes between stacks
- [`atomic split`](./split.md) - Split a stack with advanced options
- [`atomic tag`](./tag.md) - Tag stack states

## Related Concepts

- **Stacks** - Independent lines of development
- **Changes** - Atomic units of modification
- **Branches** - Git equivalent (but conflict-free in Atomic)
- **Working Copy** - Files reflecting current stack state