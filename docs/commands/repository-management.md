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
| [`restore`](restore.md) | Restore working copy to the last recorded state |
| [`split`](split.md) | Create a new view from an existing one |

## Creating a Repository

### From scratch

```bash
# Initialize in the current directory
atomic init

# Initialize with a custom view name
atomic init --view main

# Initialize with project-specific ignore patterns
atomic init --kind rust
```

This creates the `.atomic/` directory structure:

```
.atomic/
├── pristine/          # Graph database (redb)
├── changes/           # Content-addressed change files
├── config.toml        # Repository configuration
├── current_view       # Active view name
└── working_copy_id    # Working copy state
```

### From a remote

```bash
# Clone a repository
atomic clone https://api.atomic.dev/acme/platform/core/code

# Clone into a specific directory
atomic clone https://api.atomic.dev/acme/platform/core/code myproject
```

## Restoring the Working Copy

The `restore` command discards uncommitted changes and restores the working copy to the last recorded state (the legacy name `reset` still works as an alias):

```bash
# Discard all uncommitted changes
atomic restore --force

# Restore specific files
atomic restore src/main.rs

# Preview what would be restored
atomic restore --dry-run
```

## Splitting Views

The `split` command creates a new view by forking from an existing one. All changes from the source view are inherited by the new view:

```bash
# Split from current view
atomic split experimental

# Split and switch to the new view
atomic split feature-auth --switch
```

This is equivalent to `atomic view create <NAME> --from <SOURCE>`.

## See Also

- [Working with Changes](working-with-changes.md) — Recording and reviewing changes
- [View](view.md) — Managing views
- [Remote Operations](remote-operations.md) — Push, pull, and clone