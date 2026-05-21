---
sidebar_position: 14
title: restore
---

# atomic restore

Restore the working copy to the last recorded state.

`atomic restore` is the working-copy counterpart of `git restore`: it discards
unrecorded edits and brings files back to the pristine state (the last recorded
state in the current view).

:::note Renamed from `reset`
This command was previously called `atomic reset`. The old name still works as
an alias, so existing scripts keep running, but `atomic restore` is the
canonical name. Switching views is a separate command — see
[`atomic view switch`](./view.md).
:::

## Synopsis

```bash
atomic restore [OPTIONS] [FILES]...
```

## Description

The `restore` command restores the working copy to match the pristine state.
This is useful for:

- **Discarding uncommitted changes**: Remove modifications you don't want to keep
- **Restoring specific files**: Restore individual files while keeping others modified
- **Recovering deleted files**: Bring back a tracked file you removed on disk

When you restore, Atomic:

1. Compares the working copy with the pristine state
2. Restores files to match the last recorded state
3. Discards any unrecorded modifications

**Warning**: Restore discards uncommitted changes. They cannot be recovered
unless recorded first.

## Arguments

### `[FILES]...`

Optional paths to restore. If provided, only these files/directories are
restored. Naming files is explicit consent to discard their changes, so no
`--force` is needed. If omitted, the entire working copy is restored, which
requires `--force`.

```bash
# Restore a specific file
atomic restore src/main.rs

# Restore a directory
atomic restore src/

# Restore multiple files
atomic restore file1.txt file2.txt src/
```

## Options

### `--dry-run`

Print a file to standard output without modifying the repository. Works for a
single file only.

```bash
# Preview what a file would look like after restore
atomic restore --dry-run src/main.rs

# Pipe to viewer
atomic restore --dry-run README.md | less
```

### `-f, --force`

Required only for a whole-tree restore (no files named), because it discards
*all* uncommitted changes at once.

```bash
# Discard every uncommitted change
atomic restore --force
```

## Examples

### Discard a single file's changes

```bash
atomic restore src/main.rs
```

### Discard all uncommitted changes

```bash
# Preview changes that would be lost
atomic diff

# Discard all changes
atomic restore --force
```

### Recover a deleted file

```bash
# Accidentally deleted a tracked file
rm important.txt

# Bring it back
atomic restore important.txt
```

### Preview file contents

```bash
# Preview what a file would look like after restore
atomic restore --dry-run src/config.rs > /tmp/pristine.rs
diff src/config.rs /tmp/pristine.rs
```

## Behavior by file state

`restore` only touches tracked, dirty files. Untracked files are never touched.

| File state | What `restore` does |
| --- | --- |
| Modified | Reverts content to the pristine version |
| Deleted (on disk) | Recreates the file from pristine |
| Added (tracked, not recorded) | Undoes tracking; the file stays on disk as untracked |
| Untracked | Left alone — `restore` never deletes files you created |

### Whole-tree vs. partial

```bash
# Whole tree — discards all uncommitted changes (requires --force)
atomic restore --force

# Partial — only the named paths; other modifications are kept
atomic restore src/main.rs
```

A partial restore is never blocked by unrelated dirty files: only the paths you
name are affected.

## restore vs. other commands

### restore vs. unrecord

- **`restore`**: Discards working-copy changes; does not affect recorded history
- **`unrecord`**: Removes a change from view history; preserves the working copy

```bash
# Discard uncommitted changes
atomic restore --force

# Remove the last recorded change
atomic unrecord
```

### Undoing a recorded change

Atomic has no "revert" command — recorded changes are removed with `unrecord`:

```bash
atomic unrecord HASH...
atomic restore --force   # update the working copy afterwards if needed
```

### Switching views

`restore` does not switch views. Use [`atomic view switch`](./view.md), which
materializes the working copy for the target view.

## Notes

- **Destructive**: Restore discards uncommitted changes permanently
- **Working copy only**: Doesn't affect recorded history
- **Selective**: Can restore individual files
- **Keeps untracked files**: Never deletes files you created
- **Dry run**: Preview a single file's pristine content without modifying it

## Exit Codes

- `0` - Success
- `1` - Refused (e.g. whole-tree restore without `--force`)
- `2` - Invalid arguments

## See Also

- [`atomic diff`](./diff.md) - Preview changes before restoring
- [`atomic view`](./view.md) - Switch and manage views
- [`atomic record`](./record.md) - Record changes before restoring
- [`atomic unrecord`](./unrecord.md) - Remove a recorded change

## Related Concepts

- **Working Copy** - Your editable files on disk
- **Pristine** - The recorded repository state
- **Views** - Independent lines of development
- **Uncommitted Changes** - Modifications not yet recorded
