---
sidebar_position: 10
title: unrecord
---

# atomic unrecord

Remove changes from a stack's history.

## Synopsis

```bash
atomic unrecord [OPTIONS] [CHANGES]...
```

## Description

The `unrecord` command removes changes from a stack, effectively undoing recorded patches. This is useful for:

- Correcting mistakes in recorded changes
- Removing unwanted changes before pushing
- Cleaning up experimental work
- Reorganizing change history

Unlike traditional VCS systems that rewrite history, Atomic's unrecord operation:

1. Removes changes from the stack's dependency graph
2. Updates the pristine database
3. Optionally restores the working copy to the new state
4. Preserves the change files (they can be reapplied later)

## Options

### `--stack <STACK>`

Unrecord changes from a specific stack instead of the current stack.

```bash
atomic unrecord --stack feature-branch
```

### `--repository <PATH>`

Specify the repository path.

```bash
atomic unrecord --repository /path/to/repo
```

### `--reset`

Reset the working copy after unrecording to match the new stack state.

```bash
atomic unrecord --reset
```

### `[CHANGES]...`

Optional list of change hashes to unrecord. If not provided, Atomic opens an editor to let you select changes interactively.

```bash
# Unrecord specific changes
atomic unrecord ABCD1234... EFGH5678...

# Interactive selection
atomic unrecord
```

## Examples

### Interactive Unrecord

```bash
# Opens editor to select changes to unrecord
atomic unrecord
```

### Unrecord Specific Changes

```bash
# Unrecord the last change
atomic unrecord MNYNGT2V...

# Unrecord multiple changes
atomic unrecord ABCD1234... EFGH5678...
```

### Unrecord and Reset

```bash
# Unrecord and update working copy
atomic unrecord --reset ABCD1234...
```

## Interactive Selection

When run without arguments, `atomic unrecord` opens your editor with a list of changes:

```
# Please select the changes to unrecord. The lines that contain just a
# valid hash, and no other character (except possibly a newline), will
# be unrecorded.

MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

  Dependencies: ABCD1234...
  Author: [Alice]
  Date: 2025-01-15 10:30:00 +0000

    Add new feature

ABCD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABCDE

  Author: [Bob]
  Date: 2025-01-14 15:20:00 +0000

    Initial setup
```

Delete or comment out lines for changes you want to keep. Keep only the hash lines for changes to unrecord.

## Notes

- **Preserves Files**: Change files remain in `.atomic/changes/` and can be reapplied
- **Dependencies**: Atomic ensures you don't unrecord changes that other changes depend on
- **Working Copy**: Use `--reset` to update working copy after unrecording
- **Local Only**: Unrecord only affects the local stack
- **Reversible**: You can reapply unrecorded changes with `atomic apply`

## Configuration

Relevant configuration:

```toml
# In .atomic/config.toml or ~/.config/atomic/config.toml

# Maximum number of changes to show in interactive unrecord
unrecord_changes = 10
```

## See Also

- [`atomic record`](./record.md) - Record changes
- [`atomic apply`](./apply.md) - Reapply unrecorded changes
- [`atomic reset`](./reset.md) - Reset working copy
- [`atomic log`](./log.md) - View change history

## Related Concepts

- **Changes** - Immutable semantic patches
- **Stacks** - Independent lines of development
- **Dependencies** - Change relationships in the DAG