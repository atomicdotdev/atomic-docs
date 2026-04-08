---
sidebar_position: 8
title: diff
---

# atomic diff

Show differences between the working copy and recorded state.

## Synopsis

```bash
atomic diff [OPTIONS] [PATHS]...
```

## Description

The `diff` command displays the differences between your working copy (the files you're editing) and the pristine state (the last recorded state in the view). This helps you review changes before recording them.

Unlike traditional VCS diff commands, Atomic computes differences based on the patch theory, showing semantic operations rather than just line-level changes. This enables:

- Preview of what will be recorded
- Identification of file additions, deletions, and modifications
- Line-by-line change inspection
- Selective change review

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic diff --repository /path/to/repo
```

### `--stack <STACK>`

Show differences relative to a specific view instead of the current view.

```bash
atomic diff --stack feature-branch
```

### `--json`

Output differences in JSON format for programmatic consumption.

```bash
atomic diff --json
```

### `--color <WHEN>`

Control colored output. Options: `auto`, `always`, `never`.

```bash
atomic diff --color always
atomic diff --color never
```

### `--unified <LINES>`

Number of context lines to show around changes. Default is 3.

```bash
# Show 5 lines of context
atomic diff --unified 5

# Show minimal context
atomic diff --unified 1
```

### `--patience`

Use the Patience diff algorithm instead of the default Myers algorithm. Can produce better diffs for certain types of changes.

```bash
atomic diff --patience
```

### `--short`

Short output format showing file paths with status indicators. This is a convenience alias for `--name-status`, commonly used for scripting and integration with other tools.

```bash
atomic diff --short
```

Output format:
- `M path/to/file` - Modified
- `A path/to/file` - Added (tracked)
- `D path/to/file` - Deleted
- `U path/to/file` - Untracked (with `--untracked`)

### `--untracked`

Include untracked files in the output. By default, only tracked files are shown. Use this flag to also include files that haven't been added to tracking.

```bash
# Show all changes including untracked files
atomic diff --short --untracked
```

Untracked files are shown with status `U` in short/name-status format.

### `[PATHS]...`

Optional paths to limit diff output. Only show differences in specified files or directories.

```bash
# Diff specific file
atomic diff src/main.rs

# Diff directory
atomic diff src/

# Diff multiple paths
atomic diff src/ tests/ Cargo.toml
```

## Examples

### Basic Usage

```bash
# Show all changes in working copy
atomic diff

# Show changes in specific file
atomic diff README.md

# Show changes in directory
atomic diff src/
```

### Controlling Output

```bash
# More context lines
atomic diff --unified 10

# No color output (for piping)
atomic diff --color never

# JSON output for parsing
atomic diff --json

# Short format for scripting
atomic diff --short

# Include untracked files
atomic diff --short --untracked
```

### Using Different Algorithms

```bash
# Default Myers algorithm
atomic diff

# Patience algorithm (better for refactoring)
atomic diff --patience
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

## Output Format

### Standard Diff Format

```diff
diff --git a/src/main.rs b/src/main.rs
--- a/src/main.rs
+++ b/src/main.rs
@@ -1,7 +1,8 @@
 fn main() {
-    println!("Hello, world!");
+    println!("Hello, Atomic!");
+    println!("Welcome to version control");
 }
 
 fn helper() {
     // Helper function
 }
```

### File Status Indicators

```
M  src/main.rs          # Modified
A  src/new_file.rs      # Added
D  src/old_file.rs      # Deleted
R  src/renamed.rs       # Renamed
U  src/untracked.rs     # Untracked (with --untracked flag)
```

### Diff Sections

- **Lines starting with `-`**: Removed from the file (shown in red)
- **Lines starting with `+`**: Added to the file (shown in green)
- **Lines with no prefix**: Context lines (unchanged)
- **`@@ -start,count +start,count @@`**: Hunk headers showing line ranges

## Diff Algorithms

### Myers Algorithm (Default)

The default Myers algorithm is fast and produces good results for most changes:

```bash
atomic diff
```

**Best for**:
- Regular code changes
- Small to medium edits
- General purpose diffing

### Patience Algorithm

The Patience algorithm produces more intuitive diffs for refactoring and code movement:

```bash
atomic diff --patience
```

**Best for**:
- Large refactoring
- Code reorganization
- Function/block movement
- Complex changes

**Example difference**:

With Myers, function reordering might show as many small changes. With Patience, it clearly shows the functions were moved as blocks.

## Binary Files

Binary files are detected automatically and shown without content diff:

```
diff --git a/assets/logo.png b/assets/logo.png
Binary files differ
```

## Empty Changes

If there are no changes in the working copy:

```bash
$ atomic diff
# (no output)
```

Check exit code:
```bash
atomic diff
echo $?
# 0 = no changes
# 1 = changes present
```

## Filtering by Path

Limit diff output to specific paths:

```bash
# Single file
atomic diff src/main.rs

# Directory
atomic diff src/

# Multiple paths
atomic diff src/ tests/

# Specific files
atomic diff Cargo.toml README.md src/lib.rs
```

## Use Cases

### Pre-Record Review

```bash
# Make changes
vim src/main.rs src/lib.rs

# Review all changes
atomic diff

# Review specific file
atomic diff src/main.rs

# Record if satisfied
atomic record -m "Update implementation"
```

### Debugging Changes

```bash
# Something broke - check what changed
atomic diff

# Check specific module
atomic diff src/buggy_module.rs

# Investigate further
atomic log --files
```

### Selective Recording

```bash
# Check changes
atomic diff

# Record only some files
atomic record -m "Update config" config.toml

# Check remaining changes
atomic diff
```

### Code Review

```bash
# Review before committing
atomic diff | less

# Save diff for review
atomic diff > review.patch

# Share diff with team
atomic diff --color never | mail -s "Review" team@example.com
```

## Integration with Tools

### With Pager

```bash
# Automatically uses $PAGER (e.g., less)
atomic diff

# Pipe to specific pager
atomic diff | less -R  # -R preserves colors
atomic diff | more
```

### With External Diff Tools

```bash
# Save diff and open in tool
atomic diff > /tmp/changes.diff
code /tmp/changes.diff

# Or use external diff viewer
atomic diff --color never | meld - /dev/null
```

### With Git-style Tools

```bash
# Many git diff tools work with atomic diff
atomic diff | diff-so-fancy
atomic diff | delta
```

## Performance

Diff computation is generally fast:

- **Small changes** (&lt; 10 files): &lt; 50ms
- **Medium changes** (10-100 files): &lt; 500ms
- **Large changes** (100+ files): &lt; 5 seconds

Performance factors:
- Number of files changed
- Size of files
- Algorithm choice (Myers vs. Patience)
- Amount of context requested

## Notes

- **Working Copy Only**: Diff shows changes in the working copy, not between recorded changes
- **No Staging**: Since Atomic has no staging area, diff shows exactly what will be recorded
- **Binary Detection**: Binary files are automatically detected and not shown line-by-line
- **Symlinks**: Symlink changes are shown as added/deleted links
- **Permissions**: Permission changes are tracked and displayed
- **Encodings**: Atomic handles various text encodings automatically

## Diff Between Changes

To see differences between recorded changes (not working copy), use:

```bash
# Show what a specific change did
atomic change <HASH> --diff

# Compare view states (advanced)
atomic log --description --files
```

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml

[diff]
# Default context lines
context = 3

# Default algorithm
algorithm = "myers"  # or "patience"

# Color output
colors = "auto"  # "auto", "always", or "never"

[colors]
# Customize diff colors
added = "green"
removed = "red"
context = "white"
```

## Environment Variables

- `PAGER` - Pager program for long output (e.g., `less -R`)
- `NO_COLOR` - Disable colored output if set
- `ATOMIC_DIFF_ALGORITHM` - Default diff algorithm (`myers` or `patience`)

## Exit Codes

- `0` - Success (no changes or diff displayed successfully)
- `1` - Error or changes present (depending on context)
- `2` - Invalid arguments

## See Also

- [`atomic record`](./record.md) - Record changes after reviewing with diff
- [`atomic add`](./add.md) - Add files to track their changes
- [`atomic change`](./change.md) - View diffs of recorded changes
- [`atomic log`](./log.md) - View history of changes
- [`atomic reset`](./reset.md) - Discard working copy changes

## Related Concepts

- **Working Copy** - Your editable files on disk
- **Pristine** - The recorded repository state
- **Diff Algorithms** - Myers vs. Patience
- **Hunks** - Sections of changes in a diff
- **Context Lines** - Unchanged lines shown around changes