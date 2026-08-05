---
sidebar_position: 4
title: log
---

# atomic log

Show change history.

## Synopsis

```bash
atomic log [OPTIONS]
```

## Description

The `log` command displays the history of changes recorded in a view. It shows
change metadata such as hashes, authors, dates, and messages.

Unlike traditional VCS log commands, Atomic's log reflects the **dependency
graph** of changes based on patch theory. Each change has cryptographically
verifiable dependencies, forming a directed acyclic graph (DAG), and changes are
displayed in that order.

The output can be limited, filtered by path, reordered, and formatted in
multiple ways to suit different use cases.

## Options

### `-n, --count <N>`

Limit number of changes to show.

```bash
# Show the last 5 changes
atomic log -n 5
atomic log --count 5
```

### `--view <NAME>`

Show history for a specific view instead of the current view.

```bash
atomic log --view feature-branch
```

### `--tags-only`

Only show tagged changes.

```bash
atomic log --tags-only
```

### `--path <PATH>`

Filter to changes affecting a specific path.

```bash
# Show only changes that affected src/main.rs
atomic log --path src/main.rs

# Show only changes under a directory
atomic log --path src/
```

### `-f, --format <FORMAT>`

Output format. Possible values:

- `default` - Full detailed format with all information (default)
- `short` - Short format showing hash and first line of message
- `oneline` - Single-line format with hash, date, author, and message
- `json` - JSON format for machine parsing

```bash
atomic log --format oneline
atomic log -f json
```

### `--reverse`

Show in reverse order (oldest first).

```bash
atomic log --reverse
```

### `--from <SEQ>`

Start from a specific sequence number.

```bash
atomic log --from 10
```

### `--full-hash`

Show full hash instead of abbreviated.

```bash
atomic log --full-hash
```

### Global Options

These options are available on all commands:

- `-v, --verbose` - Emit extra diagnostic output.
- `--no-color` - Disable ANSI color in output.
- `-h, --help` - Print help.
- `-V, --version` - Print version.

## Examples

### Basic Usage

```bash
# Show the complete history
atomic log

# Show the last 10 changes
atomic log -n 10
```

### Formatting

```bash
# Compact single-line view
atomic log --format oneline

# Short format (hash + first message line)
atomic log --format short

# JSON output for parsing
atomic log --format json
```

### Filtering by Path

```bash
# Show changes that modified the authentication module
atomic log --path src/auth/

# Show changes to a specific file
atomic log --path src/main.rs
```

### Ordering and Ranges

```bash
# Show oldest changes first
atomic log --reverse

# Start from a specific sequence number
atomic log --from 20

# Show the 5 changes starting at sequence 20
atomic log --from 20 --count 5
```

### Tags

```bash
# Show only tagged changes
atomic log --tags-only
```

### Full Hashes

```bash
# Show full change hashes instead of abbreviated ones
atomic log --full-hash --format oneline
```

### A Specific View

```bash
# Show history for another view
atomic log --view release -n 10
```

## Output Formats

### Default Format

The default format shows changes in reverse chronological order:

```
Change MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
Author: Alice <alice@example.com>
Date: 2025-01-15 10:30:00 +0000

    Add user authentication system

Change ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTU
Author: Bob <bob@example.com>
Date: 2025-01-14 15:20:00 +0000

    Initial project setup
```

### Oneline Format

```
MNYNGT2 2025-01-15 Alice  Add user authentication system
ABCDEFG 2025-01-14 Bob    Initial project setup
```

### JSON Format

```json
[
  {
    "hash": "MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC",
    "author": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "timestamp": "2025-01-15T10:30:00+00:00",
    "message": "Add user authentication system"
  }
]
```

## Hash Format

Change hashes are Base32-encoded identifiers derived from the cryptographic hash
of the change contents. They uniquely identify changes across all repositories.

Example: `MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC`

By default hashes are abbreviated; use `--full-hash` to show the full value.

## Dependencies

Changes in the log are ordered based on their dependencies in the DAG. Each
change may depend on zero or more previous changes. The log displays changes in
topological order, ensuring dependencies appear before dependents. Use
`--reverse` to display oldest first.

## Notes

- **Reverse Order**: By default, changes are displayed newest first; use
  `--reverse` for oldest first.
- **View-Specific**: Each view has its own independent log; use `--view` to
  target another view.
- **Immutable History**: The log reflects the immutable change history in the
  DAG.
- **Cryptographic Integrity**: Each change hash cryptographically ensures the
  integrity of the change.

## Exit Codes

- `0` - Success
- `1` - Error (view not found, invalid option, etc.)

## See Also

- [`atomic record`](./record.md) - Record new changes
- [`atomic change`](./change.md) - Inspect individual changes
- [`atomic diff`](./diff.md) - Show differences
- [`atomic view`](./view.md) - Manage views

## Related Concepts

- **Changes** - Immutable semantic patches
- **DAG** - Directed acyclic graph of change dependencies
- **Views** - Independent lines of development
