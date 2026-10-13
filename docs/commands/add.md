---
sidebar_position: 7
title: add
---

# atomic add

Add files to be tracked.

## Synopsis

```bash
atomic add [OPTIONS] [FILES]...
```

## Description

The `add` command tells Atomic to start tracking files in the repository. Once added, files become part of the working copy and their changes will be included in future `atomic record` operations.

Unlike some version control systems, Atomic doesn't have a staging area. Files are either tracked or untracked:

- **Tracked files**: Monitored for changes, included in `record` operations
- **Untracked files**: Ignored by Atomic unless explicitly added

## Arguments

### `[FILES]...`

Files or directories to add to tracking. Paths are relative to the current directory or can be absolute.

```bash
# Add a single file
atomic add README.md

# Add multiple files
atomic add src/main.rs src/lib.rs

# Add a directory
atomic add src/

# Add everything in the current directory
atomic add .
```

## Options

### `-A, --all`

Add all untracked files in the repository.

```bash
atomic add --all
```

### `-n, --dry-run`

Dry run - show what would be added without doing it.

```bash
atomic add --dry-run src/
```

### `-f, --force`

Force add ignored files.

```bash
# Add a file that matches an ignore pattern
atomic add --force build/important-artifact.bin
```

### `-r, --recursive`

Recursively add directory contents.

```bash
atomic add --recursive src/
```

### `--no-recursive`

Don't recursively add directory contents.

```bash
atomic add --no-recursive src/
```

### `-d, --directory`

Track empty directories explicitly.

```bash
atomic add --directory assets/
```

### Global Options

These options are available on all commands:

- `-v, --verbose` - Emit extra diagnostic output
- `--no-color` - Disable ANSI color in output
- `-h, --help` - Print help
- `-V, --version` - Print version

## Examples

### Adding Individual Files

```bash
# Add a single file
atomic add README.md

# Add specific source files
atomic add src/main.rs src/lib.rs Cargo.toml
```

### Adding Directories

```bash
# Add all files in the src/ directory
atomic add src/

# Add directory contents recursively
atomic add --recursive src/
```

### Adding All Untracked Files

```bash
# Add every untracked file in the repository
atomic add --all
```

### Force Adding Ignored Files

```bash
# Add a file that matches an ignore pattern
atomic add --force .env.production
```

### Previewing an Add

```bash
# See what would be added without making changes
atomic add --dry-run .
```

## See Also

- [`atomic remove`](./remove.md) - Remove files from tracking
- [`atomic move`](./move.md) - Move or rename tracked files
- [`atomic record`](./record.md) - Record changes
- [`atomic diff`](./diff.md) - Show changes to tracked files
- [`atomic status`](./status.md) - Show the status of the working copy
