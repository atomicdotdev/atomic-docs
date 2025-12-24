---
sidebar_position: 7
title: add
---

# atomic add

Add files to the repository for tracking.

## Synopsis

```bash
atomic add [OPTIONS] <PATHS>...
```

## Description

The `add` command tells Atomic to start tracking files in the repository. Once added, files become part of the working copy and their changes will be included in future `atomic record` operations.

Unlike some version control systems, Atomic doesn't have a staging area. Files are either tracked or untracked:

- **Tracked files**: Monitored for changes, included in `record` operations
- **Untracked files**: Ignored by Atomic unless explicitly added

When you add a file, Atomic:

1. Records the file path in the pristine database
2. Includes the file in change detection
3. Makes the file visible to `record`, `diff`, and other operations

## Arguments

### `<PATHS>...`

One or more file or directory paths to add. Paths are relative to the current directory or can be absolute.

```bash
# Add a single file
atomic add README.md

# Add multiple files
atomic add src/main.rs src/lib.rs

# Add a directory (recursively)
atomic add src/

# Add everything in current directory
atomic add .
```

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic add --repository /path/to/repo file.txt
```

### `--force`

Force add files that match ignore patterns.

```bash
# Add a file that's normally ignored
atomic add --force build/important-artifact.bin
```

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
# Add all files in src/ directory
atomic add src/

# Add multiple directories
atomic add src/ tests/ docs/

# Add everything in the repository
atomic add .
```

### Force Adding Ignored Files

```bash
# Add a file that matches .ignore patterns
atomic add --force .env.production
```

### Project Initialization

```bash
# Initialize repository and add all files
atomic init
atomic add .
atomic record -m "Initial commit"
```

## Ignore Patterns

Atomic respects `.ignore` files (similar to `.gitignore`) that specify patterns for files to ignore:

```
# .ignore file example
target/
*.tmp
*.log
node_modules/
.env
```

Files matching these patterns won't be added unless you use `--force`.

### Default Ignore Patterns

When initializing with `--kind`, Atomic creates appropriate ignore patterns:

**Rust projects** (`--kind rust`):
```
target/
Cargo.lock  # for libraries
**/*.rs.bk
```

**Node.js projects** (`--kind node`):
```
node_modules/
*.log
.env
dist/
```

**Python projects** (`--kind python`):
```
__pycache__/
*.pyc
*.pyo
*.egg-info/
.venv/
```

## Tracking Status

After adding files, you can verify tracking status:

```bash
# Add files
atomic add src/ tests/

# Check what will be recorded
atomic diff
```

## Recursive Addition

When you add a directory, Atomic recursively adds all files within it (except those matching ignore patterns):

```bash
# Add all files in src/ and subdirectories
atomic add src/

# Equivalent to:
atomic add src/main.rs
atomic add src/lib.rs
atomic add src/utils/helpers.rs
atomic add src/utils/config.rs
# ... etc.
```

## Adding New Files vs. Modified Files

The `add` command is only needed for **new files**. Modified files that are already tracked don't need to be added again:

```bash
# Initial add
atomic add README.md
atomic record -m "Add README"

# Modify README.md
echo "More content" >> README.md

# No need to add again - just record
atomic record -m "Update README"
```

## Binary Files

Atomic handles binary files automatically. Just add them like any other file:

```bash
# Add images
atomic add assets/logo.png assets/banner.jpg

# Add compiled assets
atomic add dist/bundle.js

# Add documents
atomic add docs/manual.pdf
```

## Path Resolution

Paths can be:

- **Relative to current directory**: `atomic add ./file.txt`
- **Relative to repository root**: Atomic resolves to repository root
- **Absolute paths**: `/full/path/to/file.txt`

```bash
# From repository root
atomic add src/main.rs

# From subdirectory
cd src/
atomic add main.rs  # Same as above

# Absolute path
atomic add /home/user/project/src/main.rs
```

## Multiple Add Operations

You can add files incrementally:

```bash
# Add some files
atomic add src/main.rs

# Add more files later
atomic add tests/

# Record all tracked changes
atomic record -m "Add source and tests"
```

## Undoing Add

To stop tracking a file without deleting it from disk, use `atomic remove --keep`:

```bash
# Add file
atomic add secrets.txt

# Oops, didn't mean to track this
atomic remove --keep secrets.txt

# Now add it to .ignore
echo "secrets.txt" >> .ignore
```

## Notes

- **No Staging**: Atomic doesn't have a staging area. All tracked files are automatically included in `record`.
- **Idempotent**: Adding an already-tracked file has no effect.
- **Recursive by Default**: Adding a directory adds all files within it.
- **Respects Ignore**: Files matching `.ignore` patterns are skipped unless `--force` is used.
- **Empty Directories**: Atomic doesn't track empty directories, only files.

## Common Patterns

### New Project Setup

```bash
atomic init myproject --kind rust
cd myproject
# Create files...
atomic add .
atomic record -m "Initial commit"
```

### Selective Addition

```bash
# Add only source files, not tests
atomic add src/

# Add configuration
atomic add Cargo.toml .ignore

# Record separately
atomic record -m "Add source and config"
```

### Adding After Changes

```bash
# Create new files
touch src/new_module.rs
touch tests/new_test.rs

# Add them
atomic add src/new_module.rs tests/new_test.rs

# Record
atomic record -m "Add new module and tests"
```

## Performance

Adding files is fast, even for large numbers of files:

- **Small additions** (&lt; 10 files): &lt; 10ms
- **Medium additions** (10-100 files): &lt; 100ms
- **Large additions** (1000+ files): &lt; 1 second

Performance depends on:
- Number of files
- File sizes (for initial hash computation)
- Filesystem performance

## Exit Codes

- `0` - Success
- `1` - Error (file not found, permission denied, etc.)
- `2` - Invalid arguments

## See Also

- [`atomic remove`](./remove.md) - Stop tracking files
- [`atomic move`](./move.md) - Move or rename tracked files
- [`atomic record`](./record.md) - Record changes
- [`atomic diff`](./diff.md) - Show changes to tracked files
- [`atomic init`](./init.md) - Initialize repository with ignore patterns

## Related Concepts

- **Working Copy** - Your editable files on disk
- **Tracking** - Files monitored by Atomic
- **Ignore Patterns** - Rules for excluding files
- **Recording** - Saving tracked changes to repository history