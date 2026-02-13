---
sidebar_position: 4
title: log
---

# atomic log

Display the history of changes in a stack.

## Synopsis

```bash
atomic log [OPTIONS] [FILTERS]...
```

## Description

The `log` command displays the history of changes recorded in a stack. It shows change metadata including hashes, authors, timestamps, messages, and optionally descriptions, files changed, and AI attribution information.

Unlike traditional VCS log commands, Atomic's log displays the **dependency graph** of changes based on the mathematical patch theory. Each change has cryptographically verifiable dependencies, forming a directed acyclic graph (DAG).

The log output can be filtered, paginated, and formatted in multiple ways to suit different use cases.

## Options

### `--repository <PATH>`

Set the repository where this command should run. Defaults to the first ancestor of the current directory that contains a `.atomic` directory.

```bash
atomic log --repository /path/to/repo
```

### `--stack <STACK>`

Show logs for a specific stack instead of the current stack.

```bash
atomic log --stack feature-branch
```

### `--hash-only`

Only show the change hashes without any other information. Useful for scripting.

```bash
atomic log --hash-only
```

Output:
```
MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTU
...
```

### `--state`

Include state identifiers (Merkle tree hashes) in the output. States represent the repository state after each change.

```bash
atomic log --state
```

### `--description`

Include the full change description in addition to the commit message.

```bash
atomic log --description
```

### `--files`

Include the list of files changed by each commit.

```bash
atomic log --files
```

### `--offset <NUMBER>`

Start displaying after skipping this many changes. Useful for pagination.

```bash
# Skip the first 10 changes
atomic log --offset 10
```

### `--limit <NUMBER>`

Output at most this many changes. Useful for pagination or limiting output.

```bash
# Show only the last 5 changes
atomic log --limit 5

# Show changes 11-20
atomic log --offset 10 --limit 10
```

### `--output-format <FORMAT>`

Specify the output format. Options:
- `default` - Human-readable format
- `json` - JSON format for programmatic consumption

```bash
atomic log --output-format json
```

### AI Attribution Options

#### `--attribution`

Show AI attribution information for changes that were AI-assisted.

```bash
atomic log --attribution
```

#### `--ai-only`

Show only AI-assisted changes, filtering out human-authored changes.

```bash
atomic log --ai-only
```

#### `--human-only`

Show only human-authored changes, filtering out AI-assisted changes.

```bash
atomic log --human-only
```

### `[FILTERS]...`

Filter log output to show only changes that touched specified files or directories. Paths are relative to the repository root.

**Note**: Filters can only be applied when logging the current stack (the one comprising the working copy).

```bash
# Show only changes that modified files in src/
atomic log src/

# Show changes to specific files
atomic log src/main.rs config.toml

# Multiple paths
atomic log src/ docs/ README.md
```

## Examples

### Basic Usage

```bash
# Show the complete history
atomic log

# Show the last 10 changes
atomic log --limit 10
```

### Detailed Information

```bash
# Show full descriptions
atomic log --description

# Show files changed
atomic log --files

# Show everything
atomic log --description --files --state
```

### AI Attribution

```bash
# Show AI attribution for all changes
atomic log --attribution

# Show only AI-assisted changes
atomic log --ai-only --attribution

# Show only human changes
atomic log --human-only
```

### Filtering by Files

```bash
# Show changes that modified the authentication module
atomic log src/auth/

# Show changes to configuration files
atomic log config.toml .ignore

# Show changes to documentation
atomic log docs/
```

### Pagination

```bash
# Show changes 21-40
atomic log --offset 20 --limit 20

# Show only the most recent change
atomic log --limit 1
```

### Scripting

```bash
# Get just the hashes for scripting
atomic log --hash-only

# JSON output for parsing
atomic log --output-format json --limit 10
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

### With Descriptions

```
Change MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
Author: Alice <alice@example.com>
Date: 2025-01-15 10:30:00 +0000

    Add user authentication system

    Implements JWT-based authentication with refresh tokens.
    Includes middleware for protecting routes and role-based
    access control.
```

### With Files

```
Change MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
Author: Alice <alice@example.com>
Date: 2025-01-15 10:30:00 +0000

    Add user authentication system

    Files changed:
      - src/auth/mod.rs
      - src/auth/jwt.rs
      - src/middleware/auth.rs
      - Cargo.toml
```

### With AI Attribution

```
Change MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
Author: Alice <alice@example.com>
Date: 2025-01-15 10:30:00 +0000
AI-Assisted: Yes
  Provider: cursor
  Model: gpt-4
  Type: collaborative
  Confidence: 0.90

    Add user authentication system
```

### With State Identifiers

```
Change MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC
State: XYZABC123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABC
Author: Alice <alice@example.com>
Date: 2025-01-15 10:30:00 +0000

    Add user authentication system
```

### JSON Format

```json
[
  {
    "hash": "MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC",
    "state": "XYZABC123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABC",
    "author": {
      "name": "Alice",
      "email": "alice@example.com"
    },
    "timestamp": "2025-01-15T10:30:00+00:00",
    "message": "Add user authentication system",
    "description": "Implements JWT-based authentication...",
    "files": [
      "src/auth/mod.rs",
      "src/auth/jwt.rs"
    ],
    "attribution": {
      "ai_assisted": true,
      "provider": "cursor",
      "model": "gpt-4",
      "suggestion_type": "collaborative",
      "confidence": 0.90
    }
  }
]
```

## Hash Format

Change hashes are 53-character Base32-encoded identifiers derived from the cryptographic hash of the change contents. They uniquely identify changes across all repositories.

Example: `MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC`

## State Identifiers

State identifiers (Merkle tree hashes) represent the complete repository state after applying a change. They enable:

- Cryptographic verification of repository integrity
- Efficient state comparison
- Tag creation and validation

## Dependencies

Changes in the log are ordered based on their dependencies in the DAG. Each change may depend on zero or more previous changes. The log displays changes in topological order, ensuring dependencies appear before dependents.

## File Filtering

When using file filters, Atomic shows only changes that:

- Added, modified, or deleted the specified files
- Affected directories containing the specified paths
- Touched any file matching the filter criteria

**Important**: File filtering only works when viewing the current stack. To filter logs for other stacks, switch to that stack first.

```bash
# This works (current stack)
atomic log src/

# This won't filter (different stack)
atomic log --stack other-branch src/  # Shows all changes, ignores filter
```

## Performance

Log operations are optimized for performance:

- **Small repos** (&lt; 1000 changes): Instant
- **Medium repos** (1000-10000 changes): &lt; 1 second
- **Large repos** (10000+ changes): &lt; 5 seconds

File filtering may take longer on large repositories as it requires traversing the change graph.

## Pagination Strategy

For large repositories, use pagination to manage output:

```bash
# Page 1: First 50 changes
atomic log --limit 50

# Page 2: Changes 51-100
atomic log --offset 50 --limit 50

# Page 3: Changes 101-150
atomic log --offset 100 --limit 50
```

## Use Cases

### Code Review

```bash
# Review recent changes
atomic log --limit 10 --files

# Review AI-assisted changes
atomic log --ai-only --attribution --files
```

### Debugging

```bash
# Find changes to a specific file
atomic log src/buggy_module.rs

# Get change details for investigation
atomic log --description --files
```

### Auditing

```bash
# Full audit trail
atomic log --description --attribution --state

# Export for compliance
atomic log --output-format json > audit_log.json
```

### Finding Changes

```bash
# Search for specific author's changes
atomic log | grep "Alice"

# Find changes in the last week
atomic log --limit 20

# Get all AI-generated changes
atomic log --ai-only --hash-only
```

## Notes

- **Reverse Order**: Changes are displayed in reverse chronological order (newest first)
- **Stack-Specific**: Each stack has its own independent log
- **Immutable History**: The log reflects the immutable change history in the DAG
- **No Merge Commits**: Atomic has no merge commits; all changes are semantic patches
- **Cryptographic Integrity**: Each change hash cryptographically ensures the integrity of the change

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml

# Use a pager for long output (Unix only)
pager = "auto"  # "auto", "always", or "never"

# Color output
colors = "auto"  # "auto", "always", or "never"
```

## Environment Variables

- `PAGER` - Pager program for long output (e.g., `less`, `more`)
- `NO_COLOR` - Disable colored output if set

## Piping and Pagers

On Unix systems, `atomic log` automatically uses a pager (like `less`) for long output when:

- Output is to a terminal (not redirected)
- `PAGER` environment variable is set
- Configuration allows paging

To disable the pager:

```bash
# Use --pager=never (if available) or redirect output
atomic log | cat

# Set environment variable
PAGER="" atomic log
```

## Exit Codes

- `0` - Success
- `1` - Error (stack not found, invalid filter, etc.)

## See Also

- [`atomic record`](./record.md) - Record new changes
- [`atomic change`](./change.md) - Inspect individual changes
- [`atomic diff`](./diff.md) - Show differences
- [`atomic agent`](./agent.md) - AI agent integration and provenance
- [`atomic stack`](./stack.md) - Manage stacks

## Related Concepts

- **Changes** - Immutable semantic patches
- **DAG** - Directed acyclic graph of change dependencies
- **Stacks** - Independent lines of development
- **State** - Merkle tree hash representing repository state
- **AI Attribution** - Cryptographic tracking of AI contributions