---
sidebar_position: 9
title: apply
---

# atomic apply

Apply a change to a stack.

## Synopsis

```bash
atomic apply [OPTIONS] <CHANGE>
```

## Description

The `apply` command applies a change file to a stack, incorporating the patches into the repository without requiring the working copy to be the source. This is useful for:

- Applying changes from other repositories
- Integrating patches received via email or file transfer
- Cherry-picking specific changes
- Applying changes to different stacks

When you apply a change, Atomic:

1. Reads the change file from `.atomic/changes/`
2. Verifies the change's dependencies are satisfied
3. Applies the patch operations to the stack
4. Updates the pristine database
5. Optionally updates the working copy

## Arguments

### `<CHANGE>`

The hash of the change to apply. Can be:
- Full hash (53 characters)
- Abbreviated hash (minimum 2 characters)
- Path to a change file

```bash
# Full hash
atomic apply MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Abbreviated hash
atomic apply MNYNGT2V

# From file
atomic apply /path/to/change.change
```

## Options

### `--stack <STACK>`

Apply the change to a specific stack instead of the current stack.

```bash
atomic apply --stack feature-branch ABCD1234...
```

### `--repository <PATH>`

Specify the repository path.

```bash
atomic apply --repository /path/to/repo ABCD1234...
```

### `--deps-only`

Only apply the dependencies of the change, not the change itself.

```bash
atomic apply --deps-only ABCD1234...
```

## Examples

### Basic Apply

```bash
# Apply a change to current stack
atomic apply MNYNGT2VGEQZX4QA43FWBDVYQY7CGXN4J2CGE5FDFIHOWQFKFIJQC

# Apply with abbreviated hash
atomic apply MNYNGT2V
```

### Apply to Different Stack

```bash
# Apply change to feature branch
atomic apply --stack feature ABCD1234...
```

### Cherry-Picking

```bash
# Apply specific change from another repository
cp ../other-repo/.atomic/changes/AB/CDEF...change .atomic/changes/AB/
atomic apply ABCDEF...
```

## Notes

- **Dependencies**: All dependencies must be satisfied before applying
- **Conflicts**: May produce conflicts if change doesn't apply cleanly
- **Working Copy**: Use `atomic reset` after apply to update working copy
- **Immutable**: Applied changes are immutable and cryptographically verified

## See Also

- [`atomic record`](./record.md) - Record new changes
- [`atomic pull`](./pull.md) - Pull and apply changes from remotes
- [`atomic change`](./change.md) - Inspect change files

## Related Concepts

- **Changes** - Immutable semantic patches
- **Dependencies** - Change prerequisites
- **Stacks** - Independent lines of development