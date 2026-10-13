---
sidebar_position: 8
title: diff
---

# atomic diff

Show differences in the working copy.

## Synopsis

```bash
atomic diff [OPTIONS] [FILES]...
```

## Description

The `diff` command displays the differences in your working copy—the changes between the files you're editing and the last recorded state in the view. This helps you review changes before recording them.

By default, `diff` shows all modified tracked files. You can limit the output to specific files, compare against a particular change or view, choose a diff algorithm, and control the output format.

## Options

### `[FILES]...`

Specific files to diff. When omitted, all modified tracked files are shown.

```bash
# Diff a single file
atomic diff src/main.rs

# Diff multiple files
atomic diff src/main.rs src/lib.rs Cargo.toml
```

### `-c, --change <CHANGE>`

Compare against a specific change hash or prefix.

```bash
atomic diff --change ABCD1234
```

### `--algorithm <ALGORITHM>`

Diff algorithm: `myers` or `patience`. Default is `myers`.

```bash
# Use the Patience algorithm
atomic diff --algorithm patience
```

### `--context <N>`

Number of context lines to show around changes. Default is `3`.

```bash
# Show 5 lines of context
atomic diff --context 5

# Show minimal context
atomic diff --context 1
```

### `--stat`

Show only a stat summary.

```bash
atomic diff --stat
```

### `--no-color`

Disable colored output.

```bash
atomic diff --no-color
```

### `--name-only`

Show only names of changed files.

```bash
atomic diff --name-only
```

### `--name-status`

Show names with status indicators (M/A/D).

```bash
atomic diff --name-status
```

### `--short`

Short output format (equivalent to `--name-status`).

```bash
atomic diff --short
```

### `--untracked`

Include untracked files in the output. By default, only tracked files are shown.

```bash
atomic diff --short --untracked
```

### `--view <VIEW>`

View to compare against.

```bash
atomic diff --view feature-branch
```

### `--word-diff`

Enable token-level diff highlighting (CRDT-powered).

```bash
atomic diff --word-diff
```

### `-v, --verbose`

Emit extra diagnostic output.

```bash
atomic diff --verbose
```

### `-h, --help`

Print help.

### `-V, --version`

Print version.

## Examples

### Basic Usage

```bash
# Show all changes in the working copy
atomic diff

# Show changes in a specific file
atomic diff README.md

# Show changes in multiple files
atomic diff src/main.rs src/lib.rs
```

### Controlling Output

```bash
# More context lines
atomic diff --context 10

# Disable color (for piping)
atomic diff --no-color

# Stat summary only
atomic diff --stat

# Short format for scripting
atomic diff --short

# Include untracked files
atomic diff --short --untracked

# Token-level highlighting
atomic diff --word-diff
```

### Using Different Algorithms

```bash
# Default Myers algorithm
atomic diff --algorithm myers

# Patience algorithm (better for refactoring)
atomic diff --algorithm patience
```

### Comparing Against a Change or View

```bash
# Compare against a specific change
atomic diff --change ABCD1234

# Compare against another view
atomic diff --view feature-branch
```

### Review Before Recording

```bash
# Make changes
echo "New content" >> file.txt

# Review changes
atomic diff

# Record if satisfied
atomic record -m "Update file"
```

## See Also

- [`atomic record`](./record.md) - Record changes after reviewing with diff
- [`atomic add`](./add.md) - Add files to track their changes
- [`atomic change`](./change.md) - View diffs of recorded changes
- [`atomic log`](./log.md) - View history of changes
- [`atomic restore`](./restore.md) - Discard working copy changes
