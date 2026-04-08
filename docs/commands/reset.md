---
sidebar_position: 14
title: reset
---

# atomic reset

Reset the working copy to the last recorded state or switch views.

## Synopsis

```bash
atomic reset [OPTIONS] [FILES]...
```

## Description

The `reset` command restores the working copy to match the pristine state (the last recorded state in the view). This is useful for:

- **Discarding uncommitted changes**: Remove modifications you don't want to keep
- **Switching views**: Change to a different view and update the working copy
- **Restoring specific files**: Reset individual files while keeping others modified
- **Recovering from conflicts**: Reset to a clean state after problematic changes

When you reset, Atomic:

1. Compares the working copy with the pristine state
2. Restores files to match the view state
3. Discards any unrecorded modifications (unless `--force` is required)
4. Optionally switches the current view

**Warning**: Reset discards uncommitted changes. They cannot be recovered unless recorded first.

## Arguments

### `[FILES]...`

Optional paths to reset. If provided, only these files/directories are reset. If omitted, the entire working copy is reset.

```bash
# Reset specific file
atomic reset src/main.rs

# Reset directory
atomic reset src/

# Reset multiple files
atomic reset file1.txt file2.txt src/
```

## Options

### `--repository <PATH>`

Specify the repository path if not running from within the repository directory.

```bash
atomic reset --repository /path/to/repo
```

### `--view <VIEW>`

Reset the working copy to a specific view and switch to that view.

```bash
# Switch to main view
atomic reset --view main

# Switch to feature branch
atomic reset --view feature-new-ui
```

### `--dry-run`

Print a file to standard output without modifying the repository. Works for a single file only.

```bash
# Preview what file would look like after reset
atomic reset --dry-run src/main.rs

# Pipe to viewer
atomic reset --dry-run README.md | less
```

### `-f, --force`

Reset even if there are unrecorded changes. Required when discarding modifications.

```bash
# Force reset with uncommitted changes
atomic reset --force

# Force reset specific file
atomic reset --force src/main.rs
```

## Examples

### Discard All Uncommitted Changes

```bash
# Preview changes that would be lost
atomic diff

# Discard all changes
atomic reset --force
```

### Reset Specific Files

```bash
# Reset single file
atomic reset src/main.rs

# Reset directory
atomic reset tests/

# Reset multiple specific files
atomic reset Cargo.toml README.md src/lib.rs
```

### Switch Views

```bash
# Switch to main view
atomic reset --view main

# Switch to feature view and reset working copy
atomic reset --view feature-auth
```

### Preview File Contents

```bash
# Preview what a file would look like after reset
atomic reset --dry-run src/config.rs

# Compare with current version
atomic reset --dry-run src/config.rs > /tmp/pristine.rs
diff src/config.rs /tmp/pristine.rs
```

### Safe Reset Workflow

```bash
# Check what would be lost
atomic diff

# Optionally save work-in-progress
atomic record -m "WIP: save current state"

# Now reset safely
atomic reset --force

# Or revert to the WIP change later
atomic unrecord  # if needed
```

## Reset vs. Other Commands

### Reset vs. Unrecord

- **`reset`**: Discards working copy changes, doesn't affect recorded history
- **`unrecord`**: Removes changes from view history, preserves working copy

```bash
# Discard uncommitted changes
atomic reset --force

# Remove last recorded change
atomic unrecord
```

### Reset vs. Revert

Atomic doesn't have a "revert" command because changes can be unrecorded:

```bash
# To undo a recorded change:
atomic unrecord HASH...
atomic reset --force  # Update working copy
```

## View Switching

When using `--view` to switch views:

### Without Uncommitted Changes

```bash
# Clean switch
atomic reset --view feature-branch
```

Atomic will:
1. Switch the current view
2. Update working copy to match the new view
3. Complete without warnings

### With Uncommitted Changes

```bash
# Attempt to switch with changes
atomic reset --view main
# Error: Cannot change view, as there are unrecorded changes.
```

Solution:
```bash
# Option 1: Record changes first
atomic record -m "Save changes"
atomic reset --view main

# Option 2: Force discard changes
atomic reset --force --view main
```

### Partial View Difference

If views have diverged, reset updates only affected files:

```bash
# Switch to view with different files
atomic reset --view experimental

# Only files that differ between views are updated
# Other files remain unchanged
```

## Reset Behavior

### Full Reset (No Files Specified)

```bash
atomic reset --force
```

Restores the entire working copy:
- Modified files are reverted
- Added files (untracked) remain
- Tracked files are restored to pristine state

### Partial Reset (Files Specified)

```bash
atomic reset src/main.rs
```

Only specified files are reset:
- Other modifications remain intact
- Only listed files/directories are restored

### Dry Run

```bash
atomic reset --dry-run file.txt > /tmp/pristine.txt
```

- Doesn't modify any files
- Outputs pristine version to stdout
- Works for exactly one file
- Useful for previewing changes

## Configuration

Relevant configuration options:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml

# Control reset behavior with changes
reset_overwrites_changes = "auto"  # "auto", "always", or "never"
```

Options:
- `"never"` - Always require `--force` to discard changes
- `"auto"` or `"always"` - Allow reset to discard changes without `--force` (default)

## Performance

Reset performance depends on:

- **Working copy size**: More files = longer reset
- **Number of files to reset**: Fewer files = faster
- **View differences**: Bigger differences = more work

Typical reset times:
- **Small reset** (&lt; 10 files): &lt; 100ms
- **Medium reset** (10-100 files): &lt; 1 second
- **Full reset** (entire repository): 1-10 seconds

## Use Cases

### Experimenting Safely

```bash
# Make experimental changes
vim src/experimental.rs

# Test them
cargo test

# Discard if they don't work
atomic reset --force
```

### Recovering from Mistakes

```bash
# Accidentally modified many files
atomic diff  # Oh no, too many changes!

# Reset to clean state
atomic reset --force
```

### Cleaning Up Merge Conflicts

```bash
# After pull, conflicts appear
atomic pull
# Warning: Conflicts detected

# Reset to pre-pull state
atomic reset --force

# Or reset just conflicted files
atomic reset src/conflicted.rs
```

### File Recovery

```bash
# Accidentally deleted a file
rm important.txt

# Recover it
atomic reset important.txt
```

## Conflicts After Reset

In rare cases, reset might produce conflicts in the working copy:

```
Warning: Conflicts detected in working copy
  - src/main.rs
```

This happens when:
- View has conflicting changes
- Working copy state is complex

Resolution:
```bash
# View conflicts
atomic diff

# Manually resolve
vim src/main.rs

# Record resolution
atomic record -m "Resolve conflicts"
```

## Notes

- **Destructive**: Reset discards uncommitted changes permanently
- **Working Copy Only**: Doesn't affect recorded history
- **Selective**: Can reset individual files
- **View Switching**: Updates working copy when changing views
- **Safe by Default**: Warns before discarding changes (unless configured otherwise)
- **Dry Run**: Preview changes without modifying files

## Best Practices

### Always Check First

```bash
# Review what will be lost
atomic diff

# Then reset
atomic reset --force
```

### Save Important Work

```bash
# If unsure, record first
atomic record -m "WIP: experimental changes"

# Now safe to reset
atomic reset --force

# Can unrecord later if needed
atomic unrecord
```

### Selective Reset

```bash
# Reset only what's needed
atomic reset src/broken_module.rs

# Keep other changes
atomic diff  # Shows remaining modifications
```

## Exit Codes

- `0` - Success
- `1` - Error (no view, conflicts, etc.)
- `2` - Invalid arguments

## See Also

- [`atomic diff`](./diff.md) - Preview changes before resetting
- [`atomic revise`](./revise.md) - Revise a recorded change
- [`atomic record`](./record.md) - Record changes before resetting
- [`atomic view`](./view.md) - View management
- [`atomic insert`](./insert.md) - Insert specific changes

## Related Concepts

- **Working Copy** - Your editable files on disk
- **Pristine** - The recorded repository state
- **Views** - Independent lines of development
- **Uncommitted Changes** - Modifications not yet recorded
- **Destructive Operation** - Cannot be undone