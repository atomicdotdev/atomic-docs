---
sidebar_position: 6
title: status
---

# atomic status

Show the status of the working copy.

## Synopsis

```bash
atomic status [OPTIONS]
```

## Description

The `status` command displays a summary of the current state of your working copy compared to the last recorded state. It shows:

- The current stack name
- The stack's merkle state hash
- Files that have been added, modified, deleted, or renamed
- Untracked files (with the `-u` flag)
- Any active conflicts

This command is designed to give you a quick overview of what has changed before you record, similar to `git status`. Unlike `atomic diff` which shows the actual content changes, `status` provides a concise summary of which files are affected.

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic status --repository /path/to/repo
```

### `--stack <STACK>`

Show status relative to a specific stack instead of the current stack.

```bash
atomic status --stack feature-branch
```

### `-s, --short`

Show status in short format. Similar to `git status -s`, this provides a compact output with two-letter status codes.

```bash
atomic status -s
```

Output format:
```
A  new_file.rs        # Added
M  modified_file.rs   # Modified
D  deleted_file.rs    # Deleted
MV renamed_file.rs    # Moved/Renamed
?? untracked.txt      # Untracked (with -u)
```

### `-u, --untracked`

Include untracked files in the output. These are files in the working directory that are not being tracked by Atomic.

```bash
atomic status -u
```

### `--json`

Output status in JSON format for programmatic consumption.

```bash
atomic status --json
```

## Examples

### Basic Usage

```bash
# Show status of working copy
atomic status
```

Output:
```
On stack main
State: ABCD1234EFGH5678

Changes to be recorded:
  (use "atomic reset <file>..." to discard changes)

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
On stack main
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

### With Untracked Files

```bash
atomic status -u
```

Output:
```
On stack main
State: ABCD1234EFGH5678

Changes to be recorded:
  (use "atomic reset <file>..." to discard changes)

	modified:   src/main.rs

Untracked files:
  (use "atomic add <file>..." to include in what will be recorded)

	temp.log
	build/
	.env.local
```

### Short Format with Untracked Files

```bash
atomic status -s -u
```

Output:
```
M  src/main.rs
?? temp.log
?? build/
?? .env.local
```

### JSON Output

```bash
atomic status --json
```

Output:
```json
{
  "stack": "main",
  "state": "ABCD1234EFGH5678IJKL9012MNOP3456QRST7890UVWXYZAB",
  "changes": {
    "added": ["src/new_feature.rs"],
    "modified": ["src/main.rs"],
    "deleted": ["src/deprecated.rs"],
    "renamed": [],
    "other": []
  },
  "untracked": [],
  "conflicts": [],
  "clean": false
}
```

### Check Status of Different Stack

```bash
atomic status --stack develop
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
| `undeleted:` | Previously deleted file restored |
| `solve name conflict:` | Name conflict resolved |
| `unsolve name conflict:` | Name conflict introduced |
| `solve order conflict:` | Order conflict resolved |
| `unsolve order conflict:` | Order conflict introduced |
| `resurrect zombies:` | Deleted content restored |

### Short Format

In short format (`-s`), two-character codes are used:

| Code | Description |
|------|-------------|
| `A` | Added |
| `M` | Modified |
| `D` | Deleted |
| `MV` | Moved/Renamed |
| `R` | Replacement |
| `UD` | Undeleted |
| `SC` | Solve Conflict |
| `UC` | Unsolve Conflict |
| `RZ` | Resurrect Zombies |
| `??` | Untracked |

## Colored Output

By default, `atomic status` uses colors to make the output easier to read:

- **Cyan (bold)**: Stack name
- **Yellow**: State hash
- **Green**: New files
- **Yellow**: Modified files
- **Red**: Deleted files
- **Blue**: Renamed files
- **Magenta**: Other changes
- **Red**: Untracked files
- **Gray/Dimmed**: Help text hints

Colors are automatically disabled when output is piped or redirected. You can also control colors through your configuration:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml
[colors]
enabled = "auto"  # "auto", "always", or "never"
```

## Use Cases

### Pre-Record Review

```bash
# Make some changes
vim src/main.rs
echo "new module" > src/new.rs

# Quick status check
atomic status

# Detailed diff if needed
atomic diff

# Record changes
atomic record -m "Add new module"
```

### Finding Untracked Files

```bash
# See what's not being tracked
atomic status -u

# Add files you want to track
atomic add src/new_module.rs

# Verify
atomic status
```

### Scripting and Automation

```bash
# Check if working tree is clean
if atomic status --json | jq -e '.clean' > /dev/null; then
    echo "Working tree is clean"
else
    echo "There are uncommitted changes"
fi
```

### CI/CD Integration

```bash
# In a CI script, ensure no uncommitted changes
atomic status --json > status.json
if [ "$(jq '.clean' status.json)" != "true" ]; then
    echo "ERROR: Uncommitted changes detected"
    atomic status
    exit 1
fi
```

### Comparing Stacks

```bash
# Check status on current stack
atomic status

# Check status on another stack
atomic status --stack feature-branch
```

## Differences from `atomic diff`

| Feature | `atomic status` | `atomic diff` |
|---------|-----------------|---------------|
| Purpose | Summary of changes | Detailed content changes |
| Output | File list with status codes | Line-by-line diff |
| Speed | Faster | Slower (computes diffs) |
| Default | Grouped by change type | Full diff output |
| Use case | Quick overview | Code review |

Use `status` for a quick check of what's changed, and `diff` when you need to see the actual content changes.

## Exit Codes

- `0` - Success
- `1` - Error (e.g., not in a repository)

## Notes

- **No Staging Area**: Unlike Git, Atomic doesn't have a staging area. All changes shown in status will be included when you run `atomic record`.
- **Stack State**: The "State" hash shown is the merkle hash of the current stack state, useful for verifying repository integrity.
- **Performance**: Status is computed by comparing the working copy against the pristine state, which is generally very fast.
- **Untracked Detection**: The `-u` flag scans the working directory for files not in the tracking database, respecting `.ignore` patterns.

## Configuration

Relevant configuration options in `.atomic/config.toml` or `~/.config/atomic/config.toml`:

```toml
[colors]
# Control colored output
enabled = "auto"  # "auto", "always", or "never"

[pager]
# Use pager for long output
enabled = "auto"
```

## Environment Variables

- `NO_COLOR` - Disable colored output if set
- `PAGER` - Pager program for long output (e.g., `less -R`)

## See Also

- [`atomic diff`](./diff.md) - Show detailed content differences
- [`atomic record`](./record.md) - Record changes after reviewing status
- [`atomic add`](./add.md) - Add untracked files to tracking
- [`atomic reset`](./reset.md) - Discard working copy changes
- [`atomic log`](./log.md) - View history of recorded changes

## Related Concepts

- **Working Copy** - Your editable files on disk
- **Pristine** - The recorded repository state
- **Stack** - Atomic's term for a branch/channel of development
- **Merkle State** - Cryptographic hash representing the stack's state
- **Untracked Files** - Files in the working directory not managed by Atomic