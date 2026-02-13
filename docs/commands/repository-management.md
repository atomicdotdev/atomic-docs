---
sidebar_position: 2
title: Repository Management
---

# Repository Management

Commands for creating, cloning, and managing Atomic repositories.

## Commands

| Command | Description |
|---------|-------------|
| [`init`](init.md) | Initialize a new Atomic repository |
| [`clone`](clone.md) | Clone an existing repository from a remote |
| [`reset`](reset.md) | Reset working copy to the last recorded state |
| [`split`](split.md) | Create a new stack from an existing one |

## Creating a Repository

### From scratch

```bash
# Initialize in the current directory
atomic init

# Initialize with a custom stack name
atomic init --stack main

# Initialize with project-specific ignore patterns
atomic init --kind rust
```

This creates the `.atomic/` directory structure:

```
.atomic/
├── pristine/          # Graph database (redb)
├── changes/           # Content-addressed change files
├── config.toml        # Repository configuration
├── current_stack      # Active stack name
└── working_copy_id    # Working copy state
```

### From a remote

```bash
# Clone a repository
atomic clone https://api.atomic.dev/acme/platform/core/code

# Clone into a specific directory
atomic clone https://api.atomic.dev/acme/platform/core/code myproject
```

## Resetting the Working Copy

The `reset` command discards uncommitted changes and restores the working copy to the last recorded state:

```bash
# Discard all uncommitted changes
atomic reset --force

# Reset specific files
atomic reset src/main.rs

# Preview what would be reset
atomic reset --dry-run
```

## Splitting Stacks

The `split` command creates a new stack by forking from an existing one. All changes from the source stack are inherited by the new stack:

```bash
# Split from current stack
atomic split experimental

# Split and switch to the new stack
atomic split feature-auth --switch
```

This is equivalent to `atomic stack new <NAME> --from <SOURCE>`.

## See Also

- [Working with Changes](working-with-changes.md) — Recording and reviewing changes
- [Stack](stack.md) — Managing stacks
- [Remote Operations](remote-operations.md) — Push, pull, and clone