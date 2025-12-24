---
sidebar_position: 7
---

# File Operations

File operations in Atomic manage which files are tracked by the version control system. Unlike systems with a staging area, Atomic uses a simple tracked/untracked model where files are either monitored for changes or ignored.

## Overview

Atomic provides three core file operations:

- **`atomic add`**: Start tracking files in the repository
- **`atomic remove`**: Stop tracking files (marks for deletion)
- **`atomic move`**: Move or rename tracked files

These operations modify Atomic's internal tree structure, which represents the files currently tracked by the repository.

## Key Concepts

### The Internal Tree

Atomic maintains an **internal tree** in the pristine database (`.atomic/pristine`) that represents all tracked files. This tree:

- Lists all files currently under version control
- Records file paths (not content)
- Updates when you add, remove, or move files
- Determines what `atomic record` will detect as changes

### Tracked vs. Untracked

Files in your working copy fall into two categories:

**Tracked Files**:
- Monitored by Atomic for changes
- Included in `atomic record` operations
- Visible in `atomic diff`
- Listed by `atomic ls`

**Untracked Files**:
- Ignored by Atomic operations
- Won't be recorded until explicitly added
- Not affected by `atomic reset`

### No Staging Area

Atomic does not have a staging area like Git. When you:

1. `atomic add file.txt` - File is now tracked
2. Edit `file.txt` - Changes are immediately detected
3. `atomic record` - All changes to tracked files are recorded

There's no intermediate "staged" state.

## Adding Files

### Basic Add Operations

```bash
# Add a single file
atomic add README.md

# Add multiple files
atomic add src/main.rs src/lib.rs Cargo.toml

# Add a directory recursively
atomic add --recursive src/

# Add everything in current directory (recursively)
atomic add --recursive .

# Add just the directory itself (not contents)
atomic add src/
```

### Recursive vs. Non-Recursive

By default, `atomic add` adds only the specified path:

```bash
# Adds the directory entry, not its contents
atomic add src/
# Output: The directory `src/` has been recorded, but its contents will not be tracked

# Add directory and all contents recursively
atomic add --recursive src/
```

### Force Add

Override `.ignore` patterns with `--force`:

```bash
# Add a file that would normally be ignored
atomic add --force debug.log

# Force add ignored directory
atomic add --force --recursive build/
```

## Removing Files

### Basic Remove Operations

```bash
# Remove a single file from tracking
atomic remove old-file.txt

# Remove multiple files
atomic remove temp1.txt temp2.txt temp3.txt

# Remove all files matching pattern
atomic remove src/*.tmp
```

### What Remove Does

`atomic remove` **stops tracking** the file:

1. Removes the file from Atomic's internal tree
2. The file remains in your working copy
3. Next `atomic record` will record the deletion
4. Other users pulling the change will have the file deleted

```bash
# File is still in working copy after remove
atomic remove unwanted.txt
ls unwanted.txt
# unwanted.txt still exists

# Record the deletion
atomic record -m "Remove unwanted file"

# Now collaborators pulling this change won't have the file
```

### Removing vs. Deleting

```bash
# Option 1: Remove from tracking, then record
atomic remove file.txt
atomic record -m "Remove file.txt"

# Option 2: Delete file, then record (Atomic detects deletion)
rm file.txt
atomic record -m "Remove file.txt"
```

Both approaches achieve the same result.

## Moving Files

### Basic Move Operations

```bash
# Move a file
atomic move old-name.txt new-name.txt

# Move file to directory
atomic move file.txt src/

# Move multiple files to directory
atomic move file1.txt file2.txt file3.txt dest/

# Rename a directory
atomic move old-dir/ new-dir/
```

### Move vs. Manual Move

Atomic's `move` command is **atomic** (pun intended):

```bash
# Atomic move: updates working copy AND internal tree
atomic move old.txt new.txt

# Manual move: requires separate steps
mv old.txt new.txt
atomic remove old.txt
atomic add new.txt
```

Use `atomic move` for safety - if it fails, the operation is rolled back.

### Move Semantics

The last argument is always the destination:

```bash
# Single file move (rename)
atomic move source.txt destination.txt

# Multiple files to directory
atomic move file1.txt file2.txt file3.txt target-dir/
# target-dir/ must exist and be a directory
```

## Listing Tracked Files

View all files currently tracked by Atomic:

```bash
# List all tracked files
atomic ls

# With full path context
atomic ls --repository /path/to/repo
```

Output format:
```
src/main.rs
src/lib.rs
Cargo.toml
README.md
```

If no files are tracked:
```
No tracked files
```

## Ignore Patterns

### Using `.ignore` Files

Atomic respects ignore patterns in `.ignore` files (and `.gitignore` for compatibility):

```bash
# Create ignore file
cat > .ignore << EOF
# Build artifacts
target/
*.o
*.so

# IDE files
.vscode/
.idea/

# Temporary files
*.tmp
*.swp

# Environment files
.env
.env.local
EOF

# Add and track the ignore file itself
atomic add .ignore
atomic record -m "Add ignore patterns"
```

### Default Ignores

Atomic automatically ignores:
- `.atomic/` - The Atomic repository directory
- `.DS_Store` - macOS system files

### Project-Specific Ignores

When initializing a repository, you can specify a project type:

```bash
# Rust project (ignores target/, Cargo.lock)
atomic init --kind rust

# Node.js project (ignores node_modules/)
atomic init --kind node

# Lean project (ignores build/)
atomic init --kind lean
```

### Ignore File Format

```
# Comments start with #

# Ignore specific files
debug.log
secret.key

# Ignore file types
*.tmp
*.log
*.o

# Ignore directories
target/
node_modules/
.vscode/

# Glob patterns
**/*.backup
test-*.txt
```

### Override Ignores with Force

```bash
# Add a file that matches .ignore patterns
atomic add --force debug.log

# This file will now be tracked despite .ignore
```

## Common Workflows

### Initial Repository Setup

```bash
# Initialize repository
atomic init

# Set up ignore patterns
cat > .ignore << EOF
target/
*.tmp
.env
EOF

# Add initial files
atomic add --recursive .

# Record initial state
atomic record -m "Initial setup"
```

### Adding New Features

```bash
# Create new files
touch src/new_feature.rs
touch tests/test_new_feature.rs

# Add them to tracking
atomic add src/new_feature.rs tests/test_new_feature.rs

# Record the addition
atomic record -m "Add new feature skeleton"
```

### Reorganizing Files

```bash
# Move files to new structure
atomic move src/old_module.rs src/modules/old_module.rs

# Rename for clarity
atomic move src/util.rs src/utilities.rs

# Record the reorganization
atomic record -m "Reorganize source structure"
```

### Cleaning Up

```bash
# Remove deprecated files
atomic remove src/deprecated.rs
atomic remove tests/old_test.rs

# Record the cleanup
atomic record -m "Remove deprecated code"
```

## Best Practices

### 1. Use `.ignore` Files

Set up ignore patterns early to avoid tracking unnecessary files:

```bash
# Common patterns for most projects
target/
build/
dist/
*.tmp
*.log
.env
.DS_Store
node_modules/
```

### 2. Add Recursively for Directories

When adding directories, use `--recursive`:

```bash
# Add entire source tree
atomic add --recursive src/

# Not just the directory
atomic add src/  # Only adds directory entry
```

### 3. Use `atomic move` for Renames

Always use `atomic move` instead of manual `mv`:

```bash
# Good: Atomic operation
atomic move old.txt new.txt

# Avoid: Multiple steps, error-prone
mv old.txt new.txt
atomic remove old.txt
atomic add new.txt
```

### 4. Track the `.ignore` File

Make your ignore patterns part of the repository:

```bash
atomic add .ignore
atomic record -m "Add ignore patterns for team"
```

### 5. List Before Recording

Check what's tracked before recording changes:

```bash
# See all tracked files
atomic ls

# See what would be recorded
atomic diff

# Record changes
atomic record -m "Update tracked files"
```

### 6. Remove Before Deleting (Optional)

For clarity, remove from tracking before deleting:

```bash
# Explicit removal
atomic remove unwanted.txt
rm unwanted.txt
atomic record -m "Remove unwanted.txt"

# Or let record detect deletion
rm unwanted.txt
atomic record -m "Remove unwanted.txt"
```

## Troubleshooting

### File Not Tracked

**Problem**: File exists but isn't tracked by Atomic

```bash
# Check if it's tracked
atomic ls | grep file.txt

# If not listed, add it
atomic add file.txt
```

### Ignored File Won't Add

**Problem**: File matches `.ignore` pattern

```bash
# Check .ignore file
cat .ignore

# Force add if needed
atomic add --force file.txt
```

### Can't Move File

**Problem**: `atomic move` fails

```bash
# Ensure file is tracked first
atomic ls | grep old-name.txt

# Ensure destination directory exists
mkdir -p dest/

# Try move again
atomic move old-name.txt dest/
```

### Too Many Files Added

**Problem**: Added files that should be ignored

```bash
# Remove them from tracking
atomic remove unwanted.txt

# Add to .ignore
echo "unwanted.txt" >> .ignore

# Record the changes
atomic record -m "Remove unwanted files"
```

### Directory Not Recursively Added

**Problem**: Added directory but not its contents

```bash
# Remove the directory entry
atomic remove src/

# Add recursively
atomic add --recursive src/
```

## Integration with Other Commands

File operations work seamlessly with other Atomic commands:

- **`atomic record`**: Records changes to all tracked files
- **`atomic diff`**: Shows differences in tracked files
- **`atomic reset`**: Restores tracked files to last recorded state
- **`atomic log`**: Shows history of changes to tracked files
- **`atomic apply`**: Applies changes to tracked files in the tree

## Command Reference

For detailed information about file operation commands:

- [**`atomic add`**](./add.md) - Add files to tracking
- [**`atomic remove`**](./remove.md) - Remove files from tracking
- [**`atomic move`**](./move.md) - Move or rename tracked files

## See Also

- [Working with Changes](./working-with-changes.md) - Recording changes to tracked files
- [Repository Management](./repository-management.md) - Initializing repositories with ignore patterns
- [Recording Changes](./record.md) - Recording modifications to tracked files

---

**Next Steps:**
- Learn the [add command](./add.md) for detailed tracking options
- Explore [record command](./record.md) to understand how changes are captured
- Set up `.ignore` files early to avoid tracking unnecessary files