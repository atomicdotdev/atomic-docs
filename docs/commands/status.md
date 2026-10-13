---
sidebar_position: 6
title: status
---

# atomic status

Show the status of the working copy.

## Synopsis

```bash
atomic status [OPTIONS] [PATH]
```

## Description

The `status` command displays a summary of the current state of your working copy compared to the last recorded state. It shows which files have been added, modified, deleted, or renamed, along with untracked files.

This command is designed to give you a quick overview of what has changed before you record. Unlike `atomic diff`, which shows the actual content changes, `status` provides a concise summary of which files are affected.

## Arguments

### `[PATH]`

Show status for a specific path only.

```bash
atomic status src/
```

## Options

### `-s, --short`

Show short/porcelain output. This provides a compact listing with two-character status codes.

```bash
atomic status -s
```

Output format:
```
A  new_file.rs        # Added
M  modified_file.rs   # Modified
D  deleted_file.rs    # Deleted
MV renamed_file.rs    # Moved/Renamed
C  conflicted.rs      # Conflicted (unresolved merge)
?? untracked.txt      # Untracked
```

### `--no-untracked`

Don't show untracked files. By default, untracked files are included in the output.

```bash
atomic status --no-untracked
```

### `--reindex`

Rebuild the FILE_INDEX before computing status.

```bash
atomic status --reindex
```

### Global Options

These options are available on all commands:

- `-v, --verbose` - Emit extra diagnostic output
- `--no-color` - Disable ANSI color in output
- `-h, --help` - Print help
- `-V, --version` - Print version

## Examples

### Basic Usage

```bash
# Show status of the working copy
atomic status
```

Output:
```
On view main
State: ABCD1234EFGH5678

Changes to be recorded:
  (use "atomic restore <file>..." to discard changes)

	new file:   src/new_feature.rs
	modified:   src/main.rs
	deleted:    src/deprecated.rs
```

### Clean Working Tree

When there are no changes:

```bash
atomic status
```

Output:
```
On view main
State: ABCD1234EFGH5678

nothing to record, working tree clean
```

### Short Format

```bash
atomic status -s
```

Output:
```
A  src/new_feature.rs
M  src/main.rs
D  src/deprecated.rs
```

### Hiding Untracked Files

```bash
atomic status --no-untracked
```

### Status for a Specific Path

```bash
atomic status src/
```

### Rebuilding the File Index

```bash
# Force a rebuild of the FILE_INDEX before computing status
atomic status --reindex
```

## Status Codes

### Long Format

In the default long format, changes are grouped by type with descriptive labels:

| Label | Description |
|-------|-------------|
| `new file:` | File added to tracking |
| `modified:` | File contents changed |
| `deleted:` | File removed |
| `renamed:` | File moved or renamed |
| `conflicted:` | File has unresolved conflict markers |

### Short Format

In short format (`-s`), two-character codes are used:

| Code | Description |
|------|-------------|
| `A` | Added |
| `M` | Modified |
| `D` | Deleted |
| `MV` | Moved/Renamed |
| `C` | Conflicted (unresolved merge) |
| `??` | Untracked |

A `C` entry supersedes any `M` for the same file: a conflicted file is never
reported as merely modified. See [Merging & Conflicts](../concepts/merging-and-conflicts.md)
for how conflicts are surfaced and resolved.

## See Also

- [Merging & Conflicts](../concepts/merging-and-conflicts.md) - Understand conflicted (`C`) files
- [`atomic diff`](./diff.md) - Show detailed content differences
- [`atomic record`](./record.md) - Record changes after reviewing status
- [`atomic add`](./add.md) - Add untracked files to tracking
- [`atomic restore`](./restore.md) - Discard working copy changes
- [`atomic log`](./log.md) - View history of recorded changes
